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

/**
 * Fluent helpers for walking a nested card tree along a scroll-invariant CardCoord.
 *
 * Start from a card that already owns the local coordinate (typically `self` in a mouse handler):
 * `self.coordHelper(event.local, event.treeUuid).inner()…`. Uses `treeUuid` for Vi lookup so
 * multi-widget mounts stay correct.
 *
 * @see ./CoordHelper.ts — segment parallel (`CoordHelper` / `CoordBasedFold`)
 * @see ../../README.md#coord-helper-api
 */
import {
    childCardAtCoordFromCardVi,
    offsetFromPlaceToSeg,
} from "../renderer/CoordHitTest";
import type { CardCoord } from "../renderer/MouseInteraction";
import type { ICard } from "./card";
import type { ECollectionItemType } from "./table";

/**
 * Coordinate-scoped view of a card. Holds the card, local {@link CardCoord}, and Vi tree UUID.
 *
 * @typeParam TCard — current strongly-typed card (often an `GenCards` entry)
 */
export class CardCoordHelper<TCard extends ICard> {
    constructor(
        protected readonly card: TCard,
        protected readonly coordinate: CardCoord,
        protected readonly treeUuid: string,
    ) {}

    /** Returns the current strongly-typed card. */
    getCard(): TCard {
        return this.card;
    }

    /**
     * Runs a side-effect on the current card and returns this helper for chaining.
     */
    peek(fn: (card: TCard) => void): this {
        fn(this.card);
        return this;
    }

    /**
     * Descends into the nested child under {@link coordinate}.
     * Remaps the local coordinate into the child's place-relative client space.
     *
     * @throws If no Vi exists for `treeUuid`, or no nested card covers the coordinate.
     */
    inner(): CardCoordHelper<ECollectionItemType<TCard["nested"]>[number]> {
        const { child, childLocal } = resolveInnerCard(this.card, this.coordinate, this.treeUuid);
        return new CardCoordHelper(child, childLocal, this.treeUuid);
    }

    /**
     * Starts a {@link CardCoordBasedFold} by merging entries derived from the current card.
     * Prefer object-literal returns: `(card) => ({ field: card.attrs… })`.
     */
    fold<E extends {}>(fn: (card: TCard) => E): CardCoordBasedFold<TCard, E> {
        return new CardCoordBasedFold(this.card, this.coordinate, this.treeUuid, fn(this.card));
    }
}

/**
 * {@link CardCoordHelper} that accumulates a typed object while walking nested cards.
 *
 * @typeParam TCard — current card
 * @typeParam Acc — accumulated fold object
 */
export class CardCoordBasedFold<TCard extends ICard, Acc extends {}> extends CardCoordHelper<TCard> {
    constructor(
        card: TCard,
        coordinate: CardCoord,
        treeUuid: string,
        private readonly acc: Acc,
    ) {
        super(card, coordinate, treeUuid);
    }

    override peek(fn: (card: TCard) => void): this {
        fn(this.card);
        return this;
    }

    override inner(): CardCoordBasedFold<ECollectionItemType<TCard["nested"]>[number], Acc> {
        const { child, childLocal } = resolveInnerCard(this.card, this.coordinate, this.treeUuid);
        return new CardCoordBasedFold(child, childLocal, this.treeUuid, this.acc);
    }

    override fold<E extends {}>(fn: (card: TCard) => E): CardCoordBasedFold<TCard, Acc & E> {
        return new CardCoordBasedFold(
            this.card,
            this.coordinate,
            this.treeUuid,
            { ...this.acc, ...fn(this.card) },
        );
    }

    /** Returns the accumulated fold object. */
    get(): Acc {
        return this.acc;
    }
}

/**
 * Creates a {@link CardCoordHelper} for `coordinate` relative to `card` in the Vi tree `treeUuid`.
 */
export function createCardCoordHelper<TCard extends ICard>(
    card: TCard,
    coordinate: CardCoord,
    treeUuid: string,
): CardCoordHelper<TCard> {
    return new CardCoordHelper(card, coordinate, treeUuid);
}

type NestedCardOf<TCard extends ICard> = ECollectionItemType<TCard["nested"]>[number];

function resolveInnerCard<TCard extends ICard>(
    card: TCard,
    coordinate: CardCoord,
    treeUuid: string,
): { child: NestedCardOf<TCard>; childLocal: CardCoord } {
    const cardVi = card.getViByUuid(treeUuid);
    if (!cardVi) {
        throw new Error(
            `CardCoordHelper.inner: no CardVi for treeUuid "${treeUuid}" on card "${card.typeName}"`,
        );
    }
    const childVi = childCardAtCoordFromCardVi(cardVi, coordinate);
    if (!childVi) {
        throw new Error(
            `CardCoordHelper.inner: no nested card at coord [${coordinate[0]}, ${coordinate[1]}] under "${card.typeName}"`,
        );
    }
    const hPlace = cardVi.viBasis.HORIZONTAL;
    const vPlace = cardVi.viBasis.VERTICAL;
    const ox = offsetFromPlaceToSeg(hPlace, childVi.horizontal);
    const oy = offsetFromPlaceToSeg(vPlace, childVi.vertical);
    return {
        // CardVi.source is ICard; nested item type comes from TCard["nested"].
        child: childVi.source as NestedCardOf<TCard>,
        childLocal: [coordinate[0] - ox, coordinate[1] - oy],
    };
}
