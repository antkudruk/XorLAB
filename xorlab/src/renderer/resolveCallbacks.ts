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
import type { CallbackTable } from "./CallbackTable";
import type {
    MouseClickHandler,
    MouseDoubleClickHandler,
    MouseDownHandler,
    MouseDragHandler,
    MouseOverHandler,
    MouseUpHandler,
} from "./MouseInteraction";

export type MouseEventType =
    | "mouseOver"
    | "mouseClick"
    | "mouseDoubleClick"
    | "mouseDown"
    | "mouseDrag"
    | "mouseUp";

function getTableEntry(
    source: ICard | ISeg,
    callbackTable?: CallbackTable,
): CallbackTable[keyof CallbackTable] | undefined {
    return callbackTable?.[source.typeName];
}

export function resolveMouseOverHandler(
    source: ICard | ISeg,
    callbackTable?: CallbackTable,
): MouseOverHandler<ICard | ISeg> | undefined {
    const tableHandler = getTableEntry(source, callbackTable)?.mouseOver;
    if (tableHandler) {
        return tableHandler as MouseOverHandler<ICard | ISeg>;
    }
    return source.mouseOver as MouseOverHandler<ICard | ISeg> | undefined;
}

export function resolveMouseClickHandler(
    source: ICard | ISeg,
    callbackTable?: CallbackTable,
): MouseClickHandler<ICard | ISeg> | undefined {
    const tableHandler = getTableEntry(source, callbackTable)?.mouseClick;
    if (tableHandler) {
        return tableHandler as MouseClickHandler<ICard | ISeg>;
    }
    return source.mouseClick as MouseClickHandler<ICard | ISeg> | undefined;
}

export function resolveMouseDoubleClickHandler(
    source: ICard | ISeg,
    callbackTable?: CallbackTable,
): MouseDoubleClickHandler<ICard | ISeg> | undefined {
    const tableHandler = getTableEntry(source, callbackTable)?.mouseDoubleClick;
    if (tableHandler) {
        return tableHandler as MouseDoubleClickHandler<ICard | ISeg>;
    }
    return source.mouseDoubleClick as MouseDoubleClickHandler<ICard | ISeg> | undefined;
}

export function resolveMouseDownHandler(
    source: ICard | ISeg,
    callbackTable?: CallbackTable,
): MouseDownHandler<ICard | ISeg> | undefined {
    const tableHandler = getTableEntry(source, callbackTable)?.mouseDown;
    if (tableHandler) {
        return tableHandler as MouseDownHandler<ICard | ISeg>;
    }
    return source.mouseDown as MouseDownHandler<ICard | ISeg> | undefined;
}

export function resolveMouseDragHandler(
    source: ICard | ISeg,
    callbackTable?: CallbackTable,
): MouseDragHandler<ICard | ISeg> | undefined {
    const tableHandler = getTableEntry(source, callbackTable)?.mouseDrag;
    if (tableHandler) {
        return tableHandler as MouseDragHandler<ICard | ISeg>;
    }
    return source.mouseDrag as MouseDragHandler<ICard | ISeg> | undefined;
}

export function resolveMouseUpHandler(
    source: ICard | ISeg,
    callbackTable?: CallbackTable,
): MouseUpHandler<ICard | ISeg> | undefined {
    const tableHandler = getTableEntry(source, callbackTable)?.mouseUp;
    if (tableHandler) {
        return tableHandler as MouseUpHandler<ICard | ISeg>;
    }
    return source.mouseUp as MouseUpHandler<ICard | ISeg> | undefined;
}

export function hasMouseHandler(
    source: ICard | ISeg,
    eventType: MouseEventType,
    callbackTable?: CallbackTable,
): boolean {
    if (eventType === "mouseOver") {
        return resolveMouseOverHandler(source, callbackTable) !== undefined;
    }
    if (eventType === "mouseClick") {
        return resolveMouseClickHandler(source, callbackTable) !== undefined;
    }
    if (eventType === "mouseDoubleClick") {
        return resolveMouseDoubleClickHandler(source, callbackTable) !== undefined;
    }
    if (eventType === "mouseDown") {
        return resolveMouseDownHandler(source, callbackTable) !== undefined;
    }
    if (eventType === "mouseDrag") {
        return resolveMouseDragHandler(source, callbackTable) !== undefined;
    }
    return resolveMouseUpHandler(source, callbackTable) !== undefined;
}
