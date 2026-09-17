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
import type { ISeg } from "../facade/line";
import { CardVi } from "./CardVi";
import {
    cardDisplayOriginInParent,
    childSegAtDisplayCoordFromSegVi,
    displayLocalToInvariantLocal,
    findCardChainAtDisplayCoord,
    findSegsWithHandlerAtDisplayCoord,
} from "./CoordHitTest";
import {
    buildMouseInteractionEvent,
    type CardCoord,
    type MouseInteractionEvent,
    type SegCoord,
    type WidgetTreeUuids,
} from "./MouseInteraction";
import type { CallbackTable } from "./CallbackTable";
import {
    resolveMouseClickHandler,
    resolveMouseDoubleClickHandler,
    resolveMouseDownHandler,
    resolveMouseDragHandler,
    resolveMouseOverHandler,
    resolveMouseUpHandler,
    type MouseEventType,
} from "./resolveCallbacks";
import { SegVi } from "./segment/SegVi";

/** Default movement (px) before a potential drag becomes an active drag. */
export const DRAG_THRESHOLD_PX = 4;

export interface WidgetDragSession {
    readonly cardChain: CardVi[];
    readonly horizontalSegs: ISeg[];
    readonly verticalSegs: ISeg[];
    readonly startWidgetCoord: CardCoord;
    isActiveDrag: boolean;
}

function resolveHandler(
    source: ICard | ISeg,
    eventType: MouseEventType,
    callbackTable?: CallbackTable,
): ((event: MouseInteractionEvent, self: ICard | ISeg) => void) | undefined {
    if (eventType === "mouseOver") {
        return resolveMouseOverHandler(source, callbackTable);
    }
    if (eventType === "mouseClick") {
        return resolveMouseClickHandler(source, callbackTable);
    }
    if (eventType === "mouseDoubleClick") {
        return resolveMouseDoubleClickHandler(source, callbackTable);
    }
    if (eventType === "mouseDown") {
        return resolveMouseDownHandler(source, callbackTable);
    }
    if (eventType === "mouseDrag") {
        return resolveMouseDragHandler(source, callbackTable);
    }
    return resolveMouseUpHandler(source, callbackTable);
}

export function buildWidgetTreeUuids(rootCardVi: CardVi): WidgetTreeUuids {
    return {
        vertical: rootCardVi.viBasis.VERTICAL.treeUuid,
        horizontal: rootCardVi.viBasis.HORIZONTAL.treeUuid,
        card: rootCardVi.treeUuid,
    };
}

function widgetDisplayCoord(nativeEvent: MouseEvent, widgetElement: HTMLElement): CardCoord {
    const rect = widgetElement.getBoundingClientRect();
    return [
        nativeEvent.clientX - rect.left + widgetElement.scrollLeft,
        nativeEvent.clientY - rect.top + widgetElement.scrollTop,
    ];
}

function displayInRootCoord(
    rootCardVi: CardVi,
    widgetElement: HTMLElement,
    nativeEvent: MouseEvent,
): CardCoord {
    const widgetCoord = widgetDisplayCoord(nativeEvent, widgetElement);
    const rootOrigin = cardDisplayOriginInParent(rootCardVi);
    return [
        widgetCoord[0] - rootOrigin[0],
        widgetCoord[1] - rootOrigin[1],
    ];
}

/** Cumulative display origin of a card relative to the root card. */
export function cardDisplayOriginInRoot(cardVi: CardVi, rootCardVi: CardVi): CardCoord {
    let ox = 0;
    let oy = 0;
    let current: CardVi | undefined = cardVi;
    while (current && current !== rootCardVi) {
        const origin = cardDisplayOriginInParent(current);
        ox += origin[0];
        oy += origin[1];
        current = current.parent instanceof CardVi ? current.parent : undefined;
    }
    return [ox, oy];
}

function dispatchCardHandler(
    card: ICard,
    baseEvent: MouseInteractionEvent,
    displayLocal: CardCoord,
    cardVi: CardVi,
    handler: ((event: MouseInteractionEvent, self: ICard) => void) | undefined,
): void {
    if (!handler) {
        return;
    }
    const invariantLocal = displayLocalToInvariantLocal(cardVi, displayLocal);
    handler({
        ...baseEvent,
        local: invariantLocal,
        treeUuid: cardVi.treeUuid,
    }, card);
}

function collectNestedSegsAtDisplayCoord(
    placeSegVi: SegVi,
    displayLocal: SegCoord,
): ISeg[] {
    const results: ISeg[] = [];
    let coord = displayLocal;
    let current: SegVi | undefined = placeSegVi;

    while (current) {
        const childVi = childSegAtDisplayCoordFromSegVi(current, coord);
        if (!childVi) {
            break;
        }
        const childLocal = coord - childVi.displayCoordinate.value;
        results.push(childVi.source);
        coord = childLocal;
        current = childVi;
    }

    return results;
}

function dispatchSegHandlers(
    cardVi: CardVi,
    baseEvent: MouseInteractionEvent,
    displayLocal: CardCoord,
    eventType: MouseEventType,
    callbackTable?: CallbackTable,
): void {
    (["HORIZONTAL", "VERTICAL"] as const).forEach((direction) => {
        const placeSegVi = cardVi.viBasis[direction];
        const axisIndex = direction === "HORIZONTAL" ? 0 : 1;
        const segs = findSegsWithHandlerAtDisplayCoord(
            placeSegVi,
            displayLocal[axisIndex],
            eventType,
            callbackTable,
        );
        segs.forEach(({ seg, local }) => {
            const handler = resolveHandler(seg, eventType, callbackTable);
            handler?.({
                ...baseEvent,
                local,
                treeUuid: placeSegVi.treeUuid,
            }, seg);
        });
    });
}

function dispatchCapturedSegHandlers(
    rootCardVi: CardVi,
    baseEvent: MouseInteractionEvent,
    displayInRoot: CardCoord,
    session: WidgetDragSession,
    eventType: "mouseDrag" | "mouseUp",
    callbackTable?: CallbackTable,
): void {
    (["HORIZONTAL", "VERTICAL"] as const).forEach((direction) => {
        const placeSegVi = rootCardVi.viBasis[direction];
        const axisIndex = direction === "HORIZONTAL" ? 0 : 1;
        const captured = direction === "HORIZONTAL" ? session.horizontalSegs : session.verticalSegs;
        let coord = displayInRoot[axisIndex];

        captured.forEach((seg) => {
            const segVi = seg.getViByUuid(placeSegVi.treeUuid);
            if (!segVi) {
                return;
            }
            const local = coord - segVi.displayCoordinate.value;
            const handler = resolveHandler(seg, eventType, callbackTable);
            handler?.({
                ...baseEvent,
                local,
                treeUuid: placeSegVi.treeUuid,
            }, seg);
            coord = local;
        });
    });
}

/**
 * Dispatches mouseOver, mouseClick, mouseDoubleClick, or mouseDown to all cards and segments
 * under the pointer (live hit path).
 *
 * Card handlers: every card on the root-to-leaf hit path (findCardChainAtDisplayCoord),
 * each with its own event.local. Segment handlers: all nested segments with handlers
 * on each axis, resolved from the root card's place segments and root-relative coords.
 */
export function dispatchWidgetMouseEvent(
    rootCardVi: CardVi,
    widgetElement: HTMLElement,
    nativeEvent: MouseEvent,
    eventType: MouseEventType,
    callbackTable?: CallbackTable,
): void {
    const displayInRoot = displayInRootCoord(rootCardVi, widgetElement, nativeEvent);
    const widgetTreeUuids = buildWidgetTreeUuids(rootCardVi);
    const cardChain = findCardChainAtDisplayCoord(rootCardVi, displayInRoot);
    const deepest = cardChain[cardChain.length - 1];
    const baseEvent = buildMouseInteractionEvent(
        nativeEvent,
        widgetElement,
        deepest.displayLocal,
        rootCardVi.treeUuid,
        widgetTreeUuids,
    );

    cardChain.forEach(({ cardVi, displayLocal }) => {
        const handler = resolveHandler(cardVi.source, eventType, callbackTable);
        dispatchCardHandler(
            cardVi.source,
            baseEvent,
            displayLocal,
            cardVi,
            handler,
        );
    });
    dispatchSegHandlers(rootCardVi, baseEvent, displayInRoot, eventType, callbackTable);
}

/**
 * Starts a drag session: dispatches mouseDown on the live hit path and returns a session
 * that captures the card chain and nested segments under the pointer for stable mouseDrag/mouseUp.
 */
export function beginWidgetDragSession(
    rootCardVi: CardVi,
    widgetElement: HTMLElement,
    nativeEvent: MouseEvent,
    callbackTable?: CallbackTable,
): WidgetDragSession {
    const displayInRoot = displayInRootCoord(rootCardVi, widgetElement, nativeEvent);
    const widgetCoord = widgetDisplayCoord(nativeEvent, widgetElement);
    const widgetTreeUuids = buildWidgetTreeUuids(rootCardVi);
    const cardChainEntries = findCardChainAtDisplayCoord(rootCardVi, displayInRoot);
    const deepest = cardChainEntries[cardChainEntries.length - 1];
    const baseEvent = buildMouseInteractionEvent(
        nativeEvent,
        widgetElement,
        deepest.displayLocal,
        rootCardVi.treeUuid,
        widgetTreeUuids,
    );

    cardChainEntries.forEach(({ cardVi, displayLocal }) => {
        const handler = resolveMouseDownHandler(cardVi.source, callbackTable);
        dispatchCardHandler(
            cardVi.source,
            baseEvent,
            displayLocal,
            cardVi,
            handler,
        );
    });
    dispatchSegHandlers(rootCardVi, baseEvent, displayInRoot, "mouseDown", callbackTable);

    const horizontalPlace = rootCardVi.viBasis.HORIZONTAL;
    const verticalPlace = rootCardVi.viBasis.VERTICAL;

    return {
        cardChain: cardChainEntries.map((entry) => entry.cardVi),
        horizontalSegs: collectNestedSegsAtDisplayCoord(horizontalPlace, displayInRoot[0]),
        verticalSegs: collectNestedSegsAtDisplayCoord(verticalPlace, displayInRoot[1]),
        startWidgetCoord: widgetCoord,
        isActiveDrag: false,
    };
}

/**
 * Dispatches mouseDrag or mouseUp to the card/seg chain captured at mousedown.
 * Updates each card's event.local from the current pointer position relative to that card.
 */
export function dispatchWidgetDragEvent(
    rootCardVi: CardVi,
    widgetElement: HTMLElement,
    nativeEvent: MouseEvent,
    session: WidgetDragSession,
    eventType: "mouseDrag" | "mouseUp",
    callbackTable?: CallbackTable,
): void {
    const displayInRoot = displayInRootCoord(rootCardVi, widgetElement, nativeEvent);
    const widgetTreeUuids = buildWidgetTreeUuids(rootCardVi);
    const deepest = session.cardChain[session.cardChain.length - 1] ?? rootCardVi;
    const deepestOrigin = cardDisplayOriginInRoot(deepest, rootCardVi);
    const deepestLocal: CardCoord = [
        displayInRoot[0] - deepestOrigin[0],
        displayInRoot[1] - deepestOrigin[1],
    ];
    const baseEvent = buildMouseInteractionEvent(
        nativeEvent,
        widgetElement,
        deepestLocal,
        rootCardVi.treeUuid,
        widgetTreeUuids,
    );

    session.cardChain.forEach((cardVi) => {
        const origin = cardDisplayOriginInRoot(cardVi, rootCardVi);
        const displayLocal: CardCoord = [
            displayInRoot[0] - origin[0],
            displayInRoot[1] - origin[1],
        ];
        const handler = resolveHandler(cardVi.source, eventType, callbackTable);
        dispatchCardHandler(
            cardVi.source,
            baseEvent,
            displayLocal,
            cardVi,
            handler,
        );
    });
    dispatchCapturedSegHandlers(
        rootCardVi,
        baseEvent,
        displayInRoot,
        session,
        eventType,
        callbackTable,
    );
}

export function movementFromStart(session: WidgetDragSession, widgetCoord: CardCoord): number {
    const dx = widgetCoord[0] - session.startWidgetCoord[0];
    const dy = widgetCoord[1] - session.startWidgetCoord[1];
    return Math.hypot(dx, dy);
}

export function widgetCoordFromNative(nativeEvent: MouseEvent, widgetElement: HTMLElement): CardCoord {
    return widgetDisplayCoord(nativeEvent, widgetElement);
}
