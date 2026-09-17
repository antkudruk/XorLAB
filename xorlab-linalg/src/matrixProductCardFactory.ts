/*
    Copyright 2023 - Present Anton Kudruk
   Licensed under the Apache License, Version 2.0 (the "License");
   you may not use this file except in compliance with the License.
   You may obtain a copy of the License at
       http://www.apache.org/licenses/LICENSE-2.0
   Unless required by applicable law or agreed to in writing, software
   distributed under the License is distributed on an "AS IS" BASIS,
   WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
   See the License for the specific language governing permissions and
   limitations under the License.
 */

import {
    cardFactory,
    eArrayFactory,
    type ECollectionItemType,
    type ICard,
    type ISeg,
} from "xorlab";
import {
    createChildPlacementsChildPos,
    resolveCardAlongTypeName,
    segStableKey,
} from "./childPlacementsChildPos";
import { LinearSpace, Scalar, scalarLinearSpace } from "./LinearSpace";
import {
    bindRecomputeOnPlacement,
    replaceNestedAndFire,
    subscribeNestedRecompute,
} from "./reactiveNested";

type NestedCardAttrs<C extends ICard> = ECollectionItemType<C["nested"]>[number]["attrs"];

/** Kept axis positions from both factors (every dimension except the contracted sum axis). */
export interface MatrixProductPlacement {
    readonly positions: readonly ISeg[];
}

export interface MatrixProductCardFactoryProps<
    First extends ICard,
    Second extends ICard,
    Result,
    ResultCard extends ICard,
> {
    readonly first: First;
    readonly second: Second;
    /** Shared axis leaf typeName to contract (S_0). All other dimensions from both matrices are kept. */
    readonly sumAxisPlace: keyof GenSegments;
    /**
     * All factor axis leaf typeNames (including `sumAxisPlace`). Prefer this over caller `setBasis`:
     * keep dims are resolved from Basis via `resolveCardAlongTypeName`.
     * When omitted, keep dims come from `getSelfPos()` after `fire()` (seed basis in tests).
     */
    readonly axisPlaces?: readonly (keyof GenSegments)[];
    readonly linearSpace?: LinearSpace<
        NestedCardAttrs<First>,
        NestedCardAttrs<Second>,
        Result
    >;
    readonly resultCardFactory?: (
        result: Result,
        placement: MatrixProductPlacement,
    ) => ResultCard;
}

function defaultResultCardFactory(result: Scalar): ICard {
    return cardFactory({
        attrs: result,
    });
}

/** Positions on `card` from getSelfPos, excluding the contracted sum-axis segment. */
function keepPositionsFromSelfPos(
    card: ICard,
    sumPos: ISeg,
): { [typeName: string]: ISeg } {
    const kept: { [typeName: string]: ISeg } = {};
    for (const seg of Object.values(card.getSelfPos())) {
        if (seg.id !== sumPos.id) {
            kept[seg.typeName] = seg;
        }
    }
    return kept;
}

/**
 * Keep dims via resolveCardAlongTypeName on `axisPlaces`.
 * Skips unresolved axes and the contracted sum leaf.
 */
function keepPositionsFromAxisPlaces(
    card: ICard,
    sumPos: ISeg,
    axisPlaces: readonly (keyof GenSegments)[],
): { [typeName: string]: ISeg } {
    const kept: { [typeName: string]: ISeg } = {};
    for (const typeName of axisPlaces) {
        const pos = resolveCardAlongTypeName(card, typeName);
        if (!pos || pos.id === sumPos.id) {
            continue;
        }
        kept[pos.typeName] = pos;
    }
    return kept;
}

function positionsKey(byTypeName: { [typeName: string]: ISeg }): string {
    return Object.keys(byTypeName)
        .sort()
        .map((typeName) => segStableKey(byTypeName[typeName]))
        .join("\0");
}

function seedChildBasis(child: ICard, positions: readonly ISeg[]): void {
    child.setBasis(Object.fromEntries(positions.map((p) => [p.id, p])));
}

/**
 * Matrix multiplication over nested cards: contract along `sumAxisPlace`,
 * keep every other resolved dimension from both factor cards (multi-dimensional result).
 *
 * Result children are placed via this card's `childPos` (no per-child `selfPos` required).
 * Prefer `axisPlaces` so keep axes resolve from Basis by typeName. When omitted,
 * keep dims use `getSelfPos()` after `fire()` (tests may seed basis).
 *
 * Recalculates when either input matrix's `nested` changes, and when this card is
 * placed via Widget `setBasis` / `fire` (so factor Basis is available after mount).
 */
export function matrixProductCardFactory<
    First extends ICard,
    Second extends ICard,
    Result = Scalar,
    ResultCard extends ICard = ICard,
>(
    props: MatrixProductCardFactoryProps<First, Second, Result, ResultCard>,
): ICard {
    const linearSpace = (props.linearSpace ??
        scalarLinearSpace) as LinearSpace<
        NestedCardAttrs<First>,
        NestedCardAttrs<Second>,
        Result
    >;
    const resultCardFactory =
        props.resultCardFactory ??
        (defaultResultCardFactory as unknown as (
            result: Result,
            placement: MatrixProductPlacement,
        ) => ResultCard);
    const axisPlaces = props.axisPlaces;

    const childPlacements = new Map<string, readonly ISeg[]>();
    const nested = eArrayFactory<ICard[]>([]);
    const productCard = cardFactory({
        nested,
        childPos: createChildPlacementsChildPos(childPlacements),
    });

    const keepPositions = (card: ICard, sumPos: ISeg) =>
        axisPlaces
            ? keepPositionsFromAxisPlaces(card, sumPos, axisPlaces)
            : keepPositionsFromSelfPos(card, sumPos);

    let recomputing = false;
    const recompute = () => {
        if (recomputing) {
            return;
        }
        recomputing = true;
        try {
            props.first.fire();
            props.second.fire();

            type AccEntry = {
                positions: { [typeName: string]: ISeg };
                value: Result;
            };
            const accumulators = new Map<string, AccEntry>();

            props.first.nested.forEach((a) => {
                const sumA = resolveCardAlongTypeName(a, props.sumAxisPlace);
                if (!sumA) {
                    return;
                }
                const keepA = keepPositions(a, sumA);

                props.second.nested.forEach((b) => {
                    const sumB = resolveCardAlongTypeName(b, props.sumAxisPlace);
                    if (!sumB || segStableKey(sumB) !== segStableKey(sumA)) {
                        return;
                    }
                    const keepB = keepPositions(b, sumB);
                    const merged = { ...keepA, ...keepB };
                    const key = positionsKey(merged);

                    const term = linearSpace.product(
                        a.attrs as NestedCardAttrs<First>,
                        b.attrs as NestedCardAttrs<Second>,
                    );
                    const existing = accumulators.get(key);
                    if (existing) {
                        existing.value = linearSpace.sum(existing.value, term);
                    } else {
                        accumulators.set(key, {
                            positions: merged,
                            value: linearSpace.sum(linearSpace.getZero(), term),
                        });
                    }
                });
            });

            childPlacements.clear();
            const nextChildren: ICard[] = [];
            accumulators.forEach((entry) => {
                const positions = Object.values(entry.positions);
                const child = resultCardFactory(entry.value, { positions });
                childPlacements.set(child.uuid, positions);
                seedChildBasis(child, positions);
                nextChildren.push(child);
            });

            replaceNestedAndFire(productCard, nested, nextChildren);
        } finally {
            recomputing = false;
        }
    };

    subscribeNestedRecompute([props.first.nested, props.second.nested], recompute);
    bindRecomputeOnPlacement(productCard, recompute, () => recomputing);

    return productCard;
}
