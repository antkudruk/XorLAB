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

import type { ECollection, EListener, EReadCollection, ICard } from "xorlab";

/**
 * Subscribes to one or more nested collections and runs `recompute` on every change.
 * `subscribe` immediately seeds listeners with current items, so the first call runs once at setup.
 */
export function subscribeNestedRecompute(
    sources: ReadonlyArray<EReadCollection<ICard[]>>,
    recompute: () => void,
): void {
    const listener: EListener<ICard> = {
        afterSplice() {
            recompute();
        },
        afterMove() {
            recompute();
        },
        update() {
            recompute();
        },
    };

    for (const source of sources) {
        source.subscribe(listener);
    }
}

/** Replace all nested cards, then re-apply placement. */
export function replaceNestedAndFire(
    parent: ICard,
    nested: ECollection<ICard[]>,
    nextChildren: ICard[],
): void {
    nested.splice(0, nested.length, ...nextChildren);
    parent.fire();
}

/**
 * Re-run `recompute` when the result card is placed via Widget `setBasis` or `fire`.
 * Widget mount uses `setBasis` only (not `fire`), so algebra must hook `setBasis`.
 * Skips while `isRecomputing` to avoid loops from `replaceNestedAndFire` → `fire` → `setBasis`.
 */
export function bindRecomputeOnPlacement(
    card: ICard,
    recompute: () => void,
    isRecomputing: () => boolean,
): void {
    const originalSetBasis = card.setBasis.bind(card);
    card.setBasis = (basisPart) => {
        const result = originalSetBasis(basisPart);
        if (!isRecomputing()) {
            recompute();
        }
        return result;
    };

    const originalFire = card.fire.bind(card);
    card.fire = () => {
        if (!isRecomputing()) {
            recompute();
        }
        originalFire();
    };
}
