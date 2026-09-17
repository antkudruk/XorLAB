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

/** Pair coordinate inside a card's local space. */
export type CardCoord = readonly [number, number];
/** Scalar coordinate along one segment axis. */
export type SegCoord = number;

/** Maps a card/seg self type to its handler-local coordinate type. */
export type CoordTypeOf<Self extends ICard | ISeg> =
    Self extends ICard ? CardCoord : SegCoord;

/** Vi tree UUIDs for one widget (vertical seg, horizontal seg, root card). */
export interface WidgetTreeUuids {
    readonly vertical: string;
    readonly horizontal: string;
    readonly card: string;
}

/**
 * Mouse event payload passed to card and segment handlers.
 * `local` is a CardCoord for card handlers and a SegCoord for segment handlers.
 */
export interface MouseInteractionEvent<CoordType extends CardCoord | SegCoord = CardCoord | SegCoord> {
    /** Page coordinates (pageX / pageY). */
    readonly absolute: { readonly x: number; readonly y: number };
    /** Browser viewport coordinates (clientX / clientY). */
    readonly viewport: { readonly x: number; readonly y: number };
    /** Pointer position inside the widget host, including scroll offset. */
    readonly widget: CardCoord;
    /** Handler-specific local coordinate (pair for cards, scalar for segments). */
    readonly local: CoordType;
    /** Tree UUID of the Vi tree that produced this handler invocation. */
    readonly treeUuid: string;
    /** All widget Vi tree UUIDs (vertical seg, horizontal seg, root card). */
    readonly widgetTreeUuids: WidgetTreeUuids;
}

/** Handler invoked on mousemove over a card or segment. */
export type MouseOverHandler<Self extends ICard | ISeg = ICard | ISeg> = (
    event: MouseInteractionEvent<CoordTypeOf<Self>>,
    self: Self,
) => void;

/** Handler invoked on click over a card or segment. */
export type MouseClickHandler<Self extends ICard | ISeg = ICard | ISeg> = (
    event: MouseInteractionEvent<CoordTypeOf<Self>>,
    self: Self,
) => void;

/** Handler invoked on double-click over a card or segment. */
export type MouseDoubleClickHandler<Self extends ICard | ISeg = ICard | ISeg> = (
    event: MouseInteractionEvent<CoordTypeOf<Self>>,
    self: Self,
) => void;

/**
 * Handler invoked on mousedown over a card or segment.
 * Uses the live under-cursor hit path (same as click). Starts a Widget drag session.
 */
export type MouseDownHandler<Self extends ICard | ISeg = ICard | ISeg> = (
    event: MouseInteractionEvent<CoordTypeOf<Self>>,
    self: Self,
) => void;

/**
 * Handler invoked on mousemove after a drag session crosses the movement threshold.
 * Dispatched to the card/seg chain captured at mousedown (stable drag target), not the live hit path.
 */
export type MouseDragHandler<Self extends ICard | ISeg = ICard | ISeg> = (
    event: MouseInteractionEvent<CoordTypeOf<Self>>,
    self: Self,
) => void;

/**
 * Handler invoked on mouseup that ends a Widget drag session.
 * Dispatched to the card/seg chain captured at mousedown. After an active drag,
 * Widget suppresses the following click so selection handlers do not fire.
 */
export type MouseUpHandler<Self extends ICard | ISeg = ICard | ISeg> = (
    event: MouseInteractionEvent<CoordTypeOf<Self>>,
    self: Self,
) => void;

export function buildMouseInteractionEvent<CoordType extends CardCoord | SegCoord>(
    nativeEvent: MouseEvent,
    widgetElement: HTMLElement,
    local: CoordType,
    treeUuid: string,
    widgetTreeUuids: WidgetTreeUuids,
): MouseInteractionEvent<CoordType> {
    const rect = widgetElement.getBoundingClientRect();
    return {
        absolute: {
            x: nativeEvent.pageX || nativeEvent.clientX,
            y: nativeEvent.pageY || nativeEvent.clientY,
        },
        viewport: { x: nativeEvent.clientX, y: nativeEvent.clientY },
        widget: [
            nativeEvent.clientX - rect.left + widgetElement.scrollLeft,
            nativeEvent.clientY - rect.top + widgetElement.scrollTop,
        ],
        local,
        treeUuid,
        widgetTreeUuids,
    };
}
