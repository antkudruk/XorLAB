/*
    Copyright 2023 - Present Anton Kudruk
   Licensed under the Apache License, Version 2.0 (the "License");
   you may not use this file except in compliance with the License.
   You may obtain a copy of the License at
       http://www.apache.org/licenses/LICENSE-2.0
   Unless required by applicable law or agreed to in writing, software
   distributed under the License is distributed on an "AS IS" BASIS,
   WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
    10|   See the License for the specific language governing permissions and
   limitations under the License.
 */

import { EArray } from "../../collection";
import { Property, PropertyImpl } from "../../collection/property/Property";
import { INVALID_BASIS_RENDERER } from "../../renderer";
import { TREE_SQUARE_RENDERER } from "./TreeRenderers";
import { cardFactory } from "../../facade/card";
import type { ICard } from "../../facade/card";

/**
 * Keep a single optional card slot in sync with {@link TreeCardContentModel.nested}:
 * replace in place, push when absent, or remove when cleared.
 */
function syncCardSlot(
    nested: EArray<ICard>,
    oldCard: ICard | undefined,
    newCard: ICard | undefined,
): void {
    if (oldCard === newCard) {
        return;
    }
    if (oldCard) {
        const index = nested.findIndex((t) => t.uuid === oldCard.uuid);
        if (newCard) {
            if (index >= 0) {
                nested.splice(index, 1, newCard);
            } else {
                nested.push(newCard);
            }
        } else if (index >= 0) {
            nested.splice(index, 1);
        }
    } else if (newCard) {
        nested.push(newCard);
    }
}

/**
 * Layout **storage** for a tree card: owns {@link nested} and Property-backed
 * main-card / nested-items-table slots that sync into {@link nested}. Does not
 * decide when to show, nest, or deepen — that is {@link TreeCardModel} policy.
 *
 * `createTree` exposes `content.nested` as the tree card's `nested` collection.
 *
 * @see ../../README.md#tree-pattern
 */
export class TreeCardContentModel {
    /** Cards under the tree shell: typically main card plus optional nested table. */
    readonly nested = new EArray<ICard>();

    /** Painted main card on the TreeSeg node place; assign `undefined` to drop. */
    readonly mainCard: Property<ICard | undefined> = new PropertyImpl<ICard | undefined>(undefined);

    /** Per-row nested table of child tree cards; assign `undefined` to drop. */
    readonly nestedItemsTable: Property<ICard | undefined> = new PropertyImpl<ICard | undefined>(undefined);

    constructor() {
        this.mainCard.subscribe({
            onChange: (oldCard, newCard) => {
                syncCardSlot(this.nested, oldCard, newCard);
            },
        });
        this.nestedItemsTable.subscribe({
            onChange: (oldCard, newCard) => {
                syncCardSlot(this.nested, oldCard, newCard);
            },
        });
    }

    /** Replace all nested content with an invalid-basis error card. */
    setErrorCard(): ICard {
        this.mainCard.value = undefined;
        this.nestedItemsTable.value = undefined;
        const errorCard = cardFactory({ renderer: INVALID_BASIS_RENDERER });
        this.nested.splice(0, this.nested.length, errorCard);
        return errorCard;
    }

    /** Replace all nested content with the Tree×Tree squared placeholder. */
    setTreeSquared(): ICard {
        this.mainCard.value = undefined;
        this.nestedItemsTable.value = undefined;
        const treeSquaredCard = cardFactory({ renderer: TREE_SQUARE_RENDERER });
        this.nested.splice(0, this.nested.length, treeSquaredCard);
        return treeSquaredCard;
    }

    /** Clear main card, nested table, and {@link nested}. */
    dropAll(): void {
        this.mainCard.value = undefined;
        this.nestedItemsTable.value = undefined;
        if (this.nested.length > 0) {
            this.nested.splice(0, this.nested.length);
        }
    }
}
