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
import { LinearSpace, Scalar, scalar, scalarLinearSpace } from "./LinearSpace";
import {
    bindRecomputeOnPlacement,
    replaceNestedAndFire,
    subscribeNestedRecompute,
} from "./reactiveNested";

type NestedCardAttrs<C extends ICard> = ECollectionItemType<C["nested"]>[number]["attrs"];

export interface SumUpPlacement {
    readonly keep: ISeg;
}

export interface SumUpCardFactoryProps<
    Source extends ICard,
    Result,
    ResultCard extends ICard,
> {
    readonly source: Source;
    /** Axis leaf typeName to collapse by summing. */
    readonly sumAxisPlace: keyof GenSegments;
    /** Axis leaf typeName retained in the result. */
    readonly keepAxisPlace: keyof GenSegments;
    /**
     * Uses `sum` / `getZero`. For Scalar attrs, `product` is unused;
     * cell attrs are lifted via `asProduct` (default: attrs as Result when Result is Scalar).
     */
    readonly linearSpace?: LinearSpace<Scalar, Scalar, Result>;
    /** Lift a source cell's attrs into the product/sum type. Default assumes Scalar-like `{ value }`. */
    readonly asProduct?: (attrs: NestedCardAttrs<Source>) => Result;
    readonly resultCardFactory?: (
        result: Result,
        placement: SumUpPlacement,
    ) => ResultCard;
}

function defaultAsProduct<Source extends ICard>(
    attrs: NestedCardAttrs<Source>,
): Scalar {
    const value =
        typeof (attrs as { value?: unknown }).value === "number"
            ? (attrs as { value: number }).value
            : 0;
    return scalar(value);
}

function defaultResultCardFactory(result: Scalar): ICard {
    return cardFactory({
        attrs: result,
    });
}

/**
 * Collapse one axis of a matrix card by summing cells that share the keep-axis position.
 *
 * Result children are placed via this card's `childPos` (no per-child `selfPos` required).
 * Recalculates when `source.nested` changes, and when this card is `fire()`d.
 */
export function sumUpCardFactory<
    Source extends ICard,
    Result = Scalar,
    ResultCard extends ICard = ICard,
>(
    props: SumUpCardFactoryProps<Source, Result, ResultCard>,
): ICard {
    const linearSpace = (props.linearSpace ??
        scalarLinearSpace) as LinearSpace<Scalar, Scalar, Result>;
    const asProduct =
        props.asProduct ??
        (defaultAsProduct as unknown as (attrs: NestedCardAttrs<Source>) => Result);
    const resultCardFactory =
        props.resultCardFactory ??
        (defaultResultCardFactory as unknown as (
            result: Result,
            placement: SumUpPlacement,
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
            props.source.fire();

            type AccEntry = { keep: ISeg; value: Result };
            const accumulators = new Map<string, AccEntry>();

            props.source.nested.forEach((cell) => {
                const keep = resolveCardAlongTypeName(cell, props.keepAxisPlace);
                if (!keep) {
                    return;
                }
                // Require a resolvable position on the collapsed axis so unmatched cells are skipped.
                if (!resolveCardAlongTypeName(cell, props.sumAxisPlace)) {
                    return;
                }

                const term = asProduct(cell.attrs as NestedCardAttrs<Source>);
                const keepKey = segStableKey(keep);
                const existing = accumulators.get(keepKey);
                if (existing) {
                    existing.value = linearSpace.sum(existing.value, term);
                } else {
                    accumulators.set(keepKey, {
                        keep,
                        value: linearSpace.sum(linearSpace.getZero(), term),
                    });
                }
            });

            childPlacements.clear();
            const nextChildren: ICard[] = [];
            accumulators.forEach((entry) => {
                const child = resultCardFactory(entry.value, { keep: entry.keep });
                const positions = [entry.keep];
                childPlacements.set(child.uuid, positions);
                child.setBasis(Object.fromEntries(positions.map((p) => [p.id, p])));
                nextChildren.push(child);
            });

            replaceNestedAndFire(productCard, nested, nextChildren);
        } finally {
            recomputing = false;
        }
    };

    subscribeNestedRecompute([props.source.nested], recompute);
    bindRecomputeOnPlacement(productCard, recompute, () => recomputing);

    return productCard;
}
