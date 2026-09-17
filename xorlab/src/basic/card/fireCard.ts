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
 * Re-resolves a card's own `selfPos` placement and nested children.
 *
 * Used by {@link ICard.fire}. After attrs fields that drive `selfPos` change,
 * `fire()` recovers each place segment (via SegVi parent walk), re-runs
 * `resolveSelfPosition`, then re-resolves nested children. Placement updates
 * flow through `setBasis` → CardVi → SegVi CSS — do not write card DOM
 * `left`/`top` directly.
 *
 * Nested reapply uses `basisToStretchChildren()` (the full parent basis). Each
 * child is narrowed only when `childPos` or the child's `selfPos` selects a
 * smaller segment; otherwise the child keeps the whole place (default stretch).
 *
 * @see ../../../../README.md#dragcontroller
 * @see ../../../../README.md#default-stretch-when-selfpos-is-omitted
 */
import type { ICard } from "../../facade/card";
import type { ISeg } from "../../facade/line";
import type { SegVi } from "../../renderer/segment/SegVi";
import type { BasisPatch } from "./Basis";

function walkSegViParents(start: SegVi | undefined, placeId: string): ISeg | undefined {
    let current = start;
    while (current) {
        if (current.source.id === placeId) {
            return current.source;
        }
        current = current.parent;
    }
    return undefined;
}

/** Recover the place ISeg for a placeId by walking SegVi.parent chains. */
export function findPlaceSegById(card: ICard, placeId: string): ISeg | undefined {
    const basis = card.getBasis();
    const leafSegId = basis.getPlaceToSegIds()[placeId];
    const leafSeg = leafSegId ? basis.findBySegId(leafSegId) : undefined;

    if (leafSeg?.id === placeId) {
        return leafSeg;
    }

    for (const cardVi of Object.values(card.vis)) {
        for (const dir of ["HORIZONTAL", "VERTICAL"] as const) {
            const found = walkSegViParents(cardVi.viBasis[dir], placeId);
            if (found) {
                return found;
            }
        }
    }

    if (leafSeg) {
        for (const segVi of Object.values(leafSeg.vis)) {
            const found = walkSegViParents(segVi, placeId);
            if (found) {
                return found;
            }
        }
    }

    return undefined;
}

function reapplyOwnSelfPos(card: ICard): void {
    const basis = card.getBasis();
    const placeToSegIds = basis.getPlaceToSegIds();
    const patch: BasisPatch = {};
    let any = false;

    for (const placeId of Object.keys(placeToSegIds)) {
        const placeSeg = findPlaceSegById(card, placeId);
        if (!placeSeg) {
            continue;
        }
        patch[placeId] = card.resolveSelfPosition(placeSeg);
        any = true;
    }

    if (any) {
        card.setBasis(patch);
    }
}

function reapplyNestedChildren(card: ICard): void {
    const stretch = card.getBasis().basisToStretchChildren();
    card.setBasis(stretch);
    card.nested.forEach((child) => {
        const childBasis: { [placeId: string]: ISeg | null } = {};
        for (const placeSeg of Object.values(stretch)) {
            childBasis[placeSeg.id] = card.resolveChildPosition(placeSeg, child);
        }
        child.setBasis(childBasis);
    });
}

/** Re-run setBasis for this card's selfPos and nested children. */
export function fireCardPlacement(card: ICard): void {
    reapplyOwnSelfPos(card);
    reapplyNestedChildren(card);
}
