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

import type { ICard } from "../facade/card";
import type { EReadCollection } from "../facade/collection";
import type { ECollectionItemType } from "../facade/table";
import type { ISeg } from "../facade/line";
import { CardVi } from "./CardVi";
import { SegVi } from "./segment/SegVi";
import type { CardCoord, SegCoord } from "./MouseInteraction";
import type { CallbackTable } from "./CallbackTable";
import { hasMouseHandler, type MouseEventType } from "./resolveCallbacks";

export function getFirstSegVi(seg: ISeg): SegVi | undefined {
    return Object.values(seg.vis)[0];
}

export function getFirstCardVi(card: ICard): CardVi | undefined {
    const values = Object.values(card.vis);
    if (values.length === 0) {
        return undefined;
    }
    return values[0];
}

export function offsetFromPlaceToSeg(placeSegVi: SegVi, segVi: SegVi): number {
    let offsetAcc = 0;
    let current: SegVi | undefined = segVi;
    while (current?.source && placeSegVi.source.id !== current.source.id) {
        offsetAcc += current.clientCoordinate.value;
        current = current.parent;
    }
    return offsetAcc;
}

export function offsetFromPlaceToSegDisplay(placeSegVi: SegVi, segVi: SegVi): number {
    let offsetAcc = 0;
    let current: SegVi | undefined = segVi;
    while (current?.source && placeSegVi.source.id !== current.source.id) {
        offsetAcc += current.displayCoordinate.value;
        current = current.parent;
    }
    return offsetAcc;
}

export function childSegAtCoordFromSegVi(segVi: SegVi, coord: SegCoord): SegVi | undefined {
    for (let i = 0; i < segVi.source.nested.length; i++) {
        const child = segVi.source.nested.at(i);
        const childVi = child.getViByUuid(segVi.treeUuid);
        if (!childVi) {
            continue;
        }
        const start = childVi.clientCoordinate.value;
        const end = start + childVi.window.value;
        if (coord >= start && coord < end) {
            return childVi;
        }
    }
    return undefined;
}

type NestedSegOf<TSeg extends ISeg> = ECollectionItemType<TSeg["nested"]>[number];

export function childSegAtCoordFromSeg<TSeg extends ISeg>(
    seg: TSeg,
    coord: SegCoord,
    treeUuid: string,
): NestedSegOf<TSeg> | undefined {
    const segVi = seg.getViByUuid(treeUuid);
    if (!segVi) {
        return undefined;
    }
    return childSegAtCoordFromSegVi(segVi, coord)?.source as NestedSegOf<TSeg> | undefined;
}

export function childSegAtDisplayCoordFromSegVi(segVi: SegVi, coord: SegCoord): SegVi | undefined {
    let best: SegVi | undefined;
    let bestWindow = Infinity;
    for (let i = 0; i < segVi.source.nested.length; i++) {
        const child = segVi.source.nested.at(i);
        const childVi = child.getViByUuid(segVi.treeUuid);
        if (!childVi) {
            continue;
        }
        const start = childVi.displayCoordinate.value;
        const end = start + childVi.window.value;
        if (coord >= start && coord < end && childVi.window.value < bestWindow) {
            best = childVi;
            bestWindow = childVi.window.value;
        }
    }
    return best;
}

export function childCardAtCoordFromCardVi(cardVi: CardVi, coord: CardCoord): CardVi | undefined {
    const [x, y] = coord;
    const hPlace = cardVi.viBasis.HORIZONTAL;
    const vPlace = cardVi.viBasis.VERTICAL;

    for (const childVi of nestedCardVisByZIndexDesc(cardVi)) {
        const ox = offsetFromPlaceToSeg(hPlace, childVi.horizontal);
        const oy = offsetFromPlaceToSeg(vPlace, childVi.vertical);
        const width = childVi.horizontal.window.value;
        const height = childVi.vertical.window.value;
        if (x >= ox && x < ox + width && y >= oy && y < oy + height) {
            return childVi;
        }
    }
    return undefined;
}

export function childCardAtCoordFromCard<NestedModel extends EReadCollection<ICard[]>>(
    card: ICard & { nested: NestedModel },
    coord: CardCoord,
): ECollectionItemType<NestedModel>[number] | undefined {
    const cardVi = getFirstCardVi(card);
    if (!cardVi) {
        return undefined;
    }
    return childCardAtCoordFromCardVi(cardVi, coord)?.source as ECollectionItemType<NestedModel>[number] | undefined;
}

export function childCardsAtDisplayCoordFromCardVi(cardVi: CardVi, coord: CardCoord): CardVi[] {
    const [x, y] = coord;
    const hPlace = cardVi.viBasis.HORIZONTAL;
    const vPlace = cardVi.viBasis.VERTICAL;

    const hits: CardVi[] = [];
    // Ascending zIndex (then nested index) so higher zIndex appears later / on top in the chain.
    for (const childVi of nestedCardVisByZIndexAsc(cardVi)) {
        const ox = offsetFromPlaceToSegDisplay(hPlace, childVi.horizontal);
        const oy = offsetFromPlaceToSegDisplay(vPlace, childVi.vertical);
        const width = childVi.horizontal.window.value;
        const height = childVi.vertical.window.value;
        if (x >= ox && x < ox + width && y >= oy && y < oy + height) {
            hits.push(childVi);
        }
    }
    return hits;
}

export function childCardAtDisplayCoordFromCardVi(cardVi: CardVi, coord: CardCoord): CardVi | undefined {
    const hits = childCardsAtDisplayCoordFromCardVi(cardVi, coord);
    return hits[hits.length - 1];
}

/**
 * Converts card display-local coords to scroll-invariant (client) locals for
 * `childCardAtCoord` / `CoordHelper`.
 *
 * When the card's axis segment is nested under the place, `client − display`
 * along that path already includes ancestor scroll. When the card sits directly
 * on the place (`card.horizontal === hPlace`), that path is empty — add the
 * place's own `scrollOffset` so locals stay in client space (e.g. LessonListCard
 * on a scrolled WeekSeg).
 */
export function displayLocalToInvariantLocal(cardVi: CardVi, displayLocal: CardCoord): CardCoord {
    const hPlace = cardVi.viBasis.HORIZONTAL;
    const vPlace = cardVi.viBasis.VERTICAL;
    const hDelta = offsetFromPlaceToSeg(hPlace, cardVi.horizontal) - offsetFromPlaceToSegDisplay(hPlace, cardVi.horizontal)
        + (cardVi.horizontal === hPlace ? hPlace.scrollOffset.value : 0);
    const vDelta = offsetFromPlaceToSeg(vPlace, cardVi.vertical) - offsetFromPlaceToSegDisplay(vPlace, cardVi.vertical)
        + (cardVi.vertical === vPlace ? vPlace.scrollOffset.value : 0);
    return [displayLocal[0] + hDelta, displayLocal[1] + vDelta];
}

export function cardDisplayOriginInParent(cardVi: CardVi): CardCoord {
    const parent = cardVi.parent;
    const hPlace = parent.viBasis.HORIZONTAL;
    const vPlace = parent.viBasis.VERTICAL;
    const ox = offsetFromPlaceToSegDisplay(hPlace, cardVi.horizontal);
    const oy = offsetFromPlaceToSegDisplay(vPlace, cardVi.vertical);
    return [ox, oy];
}

/**
 * Returns every card on the pointer path from root to leaf, each with display-local coords.
 * Sibling overlay cards at the same parent that share the pointer all enter the chain,
 * ordered by ascending `zIndex` then nested-array index (higher `zIndex` later / on top).
 * Dispatch invokes handlers for all entries in root-to-leaf order.
 */
export function findCardChainAtDisplayCoord(
    cardVi: CardVi,
    displayCoordInParent: CardCoord,
): Array<{ cardVi: CardVi; displayLocal: CardCoord }> {
    const chain: Array<{ cardVi: CardVi; displayLocal: CardCoord }> = [
        { cardVi, displayLocal: displayCoordInParent },
    ];
    childCardsAtDisplayCoordFromCardVi(cardVi, displayCoordInParent).forEach((childVi) => {
        const childOrigin = cardDisplayOriginInParent(childVi);
        const childDisplayLocal: CardCoord = [
            displayCoordInParent[0] - childOrigin[0],
            displayCoordInParent[1] - childOrigin[1],
        ];
        chain.push(...findCardChainAtDisplayCoord(childVi, childDisplayLocal));
    });
    return chain;
}

/** Nested card Vis sorted by ascending zIndex, then nested index (stable for chain order). */
function nestedCardVisByZIndexAsc(cardVi: CardVi): CardVi[] {
    return sortNestedCardVis(cardVi, 1);
}

/** Nested card Vis sorted by descending zIndex, then nested index (topmost first for single hit). */
function nestedCardVisByZIndexDesc(cardVi: CardVi): CardVi[] {
    return sortNestedCardVis(cardVi, -1);
}

function sortNestedCardVis(cardVi: CardVi, zSign: 1 | -1): CardVi[] {
    const indexed: Array<{ childVi: CardVi; index: number }> = [];
    for (let i = 0; i < cardVi.nested.length; i++) {
        indexed.push({ childVi: cardVi.nested.at(i), index: i });
    }
    indexed.sort((a, b) => {
        const zDiff = zSign * ((a.childVi.source.zIndex ?? 0) - (b.childVi.source.zIndex ?? 0));
        if (zDiff !== 0) {
            return zDiff;
        }
        return a.index - b.index;
    });
    return indexed.map((entry) => entry.childVi);
}

/** Returns the leaf card at a display coordinate (last entry in findCardChainAtDisplayCoord). */
export function findDeepestCardVi(
    cardVi: CardVi,
    displayCoordInParent: CardCoord,
): { cardVi: CardVi; displayLocal: CardCoord } {
    const chain = findCardChainAtDisplayCoord(cardVi, displayCoordInParent);
    return chain[chain.length - 1];
}

/**
 * Walks down from a place segment and returns nested segments that have a handler
 * for the given event type, each with its axis-local coordinate.
 */
export function findSegsWithHandlerAtDisplayCoord(
    placeSegVi: SegVi,
    displayLocal: SegCoord,
    eventType: MouseEventType,
    callbackTable?: CallbackTable,
): Array<{ seg: ISeg; local: SegCoord }> {
    const results: Array<{ seg: ISeg; local: SegCoord }> = [];
    let coord = displayLocal;
    let current: SegVi | undefined = placeSegVi;

    while (current) {
        const childVi = childSegAtDisplayCoordFromSegVi(current, coord);
        if (!childVi) {
            break;
        }
        const childLocal = coord - childVi.displayCoordinate.value;
        if (hasMouseHandler(childVi.source, eventType, callbackTable)) {
            results.push({ seg: childVi.source, local: childLocal });
        }
        coord = childLocal;
        current = childVi;
    }

    return results;
}
