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

import type { ICard, ISeg } from "../facade";
import {
    hasMouseHandler,
    resolveMouseClickHandler,
    resolveMouseDoubleClickHandler,
    resolveMouseDownHandler,
    resolveMouseDragHandler,
    resolveMouseOverHandler,
    resolveMouseUpHandler,
} from "./resolveCallbacks";
import type { CallbackTable } from "./CallbackTable";

function mockSeg(
    typeName: string,
    handlers: Partial<{
        mouseOver: ISeg["mouseOver"];
        mouseClick: ISeg["mouseClick"];
        mouseDoubleClick: ISeg["mouseDoubleClick"];
    }> = {},
): ISeg {
    return {
        typeName,
        mouseOver: handlers.mouseOver,
        mouseClick: handlers.mouseClick,
        mouseDoubleClick: handlers.mouseDoubleClick,
    } as ISeg;
}

describe("resolveCallbacks", () => {
    it("prefers callbackTable handler over inline handler", () => {
        const inline = jest.fn();
        const fromTable = jest.fn();
        const seg = mockSeg("GroupSeg", { mouseOver: inline });
        const callbackTable: CallbackTable = {
            GroupSeg: { mouseOver: fromTable },
        };

        expect(resolveMouseOverHandler(seg, callbackTable)).toBe(fromTable);
    });

    it("falls back to inline handler when callbackTable entry is absent", () => {
        const inline = jest.fn();
        const seg = mockSeg("GroupSeg", { mouseOver: inline });

        expect(resolveMouseOverHandler(seg, {})).toBe(inline);
        expect(resolveMouseOverHandler(seg, undefined)).toBe(inline);
    });

    it("hasMouseHandler returns true for table-only handlers", () => {
        const seg = mockSeg("HourSeg");
        const callbackTable: CallbackTable = {
            HourSeg: { mouseClick: jest.fn() },
        };

        expect(hasMouseHandler(seg, "mouseClick", callbackTable)).toBe(true);
        expect(hasMouseHandler(seg, "mouseOver", callbackTable)).toBe(false);
        expect(hasMouseHandler(seg, "mouseDoubleClick", callbackTable)).toBe(false);
    });

    it("resolveMouseClickHandler prefers callbackTable", () => {
        const inline = jest.fn();
        const fromTable = jest.fn();
        const card = {
            typeName: "ElementCard",
            mouseClick: inline,
        } as unknown as ICard;
        const callbackTable: CallbackTable = {
            ElementCard: { mouseClick: fromTable },
        };

        expect(resolveMouseClickHandler(card, callbackTable)).toBe(fromTable);
    });

    it("resolveMouseDoubleClickHandler prefers callbackTable", () => {
        const inline = jest.fn();
        const fromTable = jest.fn();
        const card = {
            typeName: "ElementCard",
            mouseDoubleClick: inline,
        } as unknown as ICard;
        const callbackTable: CallbackTable = {
            ElementCard: { mouseDoubleClick: fromTable },
        };

        expect(resolveMouseDoubleClickHandler(card, callbackTable)).toBe(fromTable);
    });

    it("hasMouseHandler returns true for mouseDoubleClick table handlers", () => {
        const seg = mockSeg("HourSeg");
        const callbackTable: CallbackTable = {
            HourSeg: { mouseDoubleClick: jest.fn() },
        };

        expect(hasMouseHandler(seg, "mouseDoubleClick", callbackTable)).toBe(true);
        expect(hasMouseHandler(seg, "mouseClick", callbackTable)).toBe(false);
    });

    it("resolveMouseDown/Drag/Up prefer callbackTable", () => {
        const inlineDown = jest.fn();
        const tableDown = jest.fn();
        const tableDrag = jest.fn();
        const tableUp = jest.fn();
        const card = {
            typeName: "LessonCard",
            mouseDown: inlineDown,
        } as unknown as ICard;
        const callbackTable: CallbackTable = {
            LessonCard: {
                mouseDown: tableDown,
                mouseDrag: tableDrag,
                mouseUp: tableUp,
            },
        };

        expect(resolveMouseDownHandler(card, callbackTable)).toBe(tableDown);
        expect(resolveMouseDragHandler(card, callbackTable)).toBe(tableDrag);
        expect(resolveMouseUpHandler(card, callbackTable)).toBe(tableUp);
        expect(hasMouseHandler(card, "mouseDown", callbackTable)).toBe(true);
        expect(hasMouseHandler(card, "mouseDrag", callbackTable)).toBe(true);
        expect(hasMouseHandler(card, "mouseUp", callbackTable)).toBe(true);
    });

});
