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

export interface ZippedProductPlacement {
    readonly positions: readonly ISeg[];
}

export interface ZippedProductCardFactoryProps<
    First extends ICard,
    Second extends ICard,
    Result,
    ResultCard extends ICard,
> {
    readonly first: First;
    readonly second: Second;
    /** Axis leaf typeNames that must match on both matrices (Hadamard product). */
    readonly axisPlaces: readonly (keyof GenSegments)[];
    readonly linearSpace?: LinearSpace<
        NestedCardAttrs<First>,
        NestedCardAttrs<Second>,
        Result
    >;
    readonly resultCardFactory?: (
        result: Result,
        placement: ZippedProductPlacement,
    ) => ResultCard;
}

function resolveAll(
    card: ICard,
    typeNames: readonly (keyof GenSegments)[],
): ISeg[] | null {
    const resolved: ISeg[] = [];
    for (const typeName of typeNames) {
        const pos = resolveCardAlongTypeName(card, typeName);
        if (!pos) {
            return null;
        }
        resolved.push(pos);
    }
    return resolved;
}

function positionsKey(positions: readonly ISeg[]): string {
    return positions.map((seg) => segStableKey(seg)).join("\0");
}

function defaultResultCardFactory(result: Scalar): ICard {
    return cardFactory({
        attrs: result,
    });
}

/**
 * Element-wise (Hadamard) product: match children on every axis in `axisPlaces`.
 *
 * Result children are placed via this card's `childPos` (no per-child `selfPos` required).
 * Recalculates when either input matrix's `nested` changes, and when this card is `fire()`d.
 */
export function zippedProductCardFactory<
    First extends ICard,
    Second extends ICard,
    Result = Scalar,
    ResultCard extends ICard = ICard,
>(
    props: ZippedProductCardFactoryProps<First, Second, Result, ResultCard>,
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
            placement: ZippedProductPlacement,
        ) => ResultCard);

    const childPlacements = new Map<string, readonly ISeg[]>();
    const nested = eArrayFactory<ICard[]>([]);
    const productCard = cardFactory({
        nested,
        childPos: createChildPlacementsChildPos(childPlacements),
    });

    let recomputing = false;
    const recompute = () => {
        if (recomputing) {
            return;
        }
        recomputing = true;
        try {
            props.first.fire();
            props.second.fire();

            const secondByKey = new Map<string, { card: ICard; positions: ISeg[] }>();
            props.second.nested.forEach((b) => {
                const positions = resolveAll(b, props.axisPlaces);
                if (!positions) {
                    return;
                }
                secondByKey.set(positionsKey(positions), { card: b, positions });
            });

            childPlacements.clear();
            const nextChildren: ICard[] = [];
            props.first.nested.forEach((a) => {
                const positions = resolveAll(a, props.axisPlaces);
                if (!positions) {
                    return;
                }
                const match = secondByKey.get(positionsKey(positions));
                if (!match) {
                    return;
                }
                const result = linearSpace.product(
                    a.attrs as NestedCardAttrs<First>,
                    match.card.attrs as NestedCardAttrs<Second>,
                );
                const child = resultCardFactory(result, { positions });
                childPlacements.set(child.uuid, positions);
                child.setBasis(Object.fromEntries(positions.map((p) => [p.id, p])));
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
