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

import { JSDOM } from "jsdom";
import { SelectController } from "./SelectController";
import {
    TREE_UUID,
    createMockSelectableCard,
    mockBindWidget,
    mockMouseEvent,
} from "./controllerTestUtils";

function ensureDom(): void {
    if (typeof global.document !== "undefined") {
        return;
    }
    const dom = new JSDOM("<!DOCTYPE html><html><body></body></html>");
    global.document = dom.window.document;
    global.HTMLElement = dom.window.HTMLElement;
}


describe("SelectController", () => {
    beforeAll(() => {
        ensureDom();
    });

    it("applies CSS when value is set programmatically", () => {
        const cardA = createMockSelectableCard(1);
        const cardB = createMockSelectableCard(2);
        const select = new SelectController<number>({
            selectClassName: "ItemCard--selected",
            getValue: (card) =>
                card.typeName === "ItemCard"
                    ? (card.attrs as unknown as { id: number }).id
                    : undefined,
            cards: [cardA, cardB],
        });
        select.bindWidget(mockBindWidget());

        select.value = 2;
        expect(cardB.vis[TREE_UUID]!.htmlElement!.classList.contains("ItemCard--selected")).toBe(true);
        expect(cardA.vis[TREE_UUID]!.htmlElement!.classList.contains("ItemCard--selected")).toBe(false);
    });

    it("handleCardClick updates value, DOM, and invokes onChange", () => {
        const cardA = createMockSelectableCard(1);
        const cardB = createMockSelectableCard(2);
        const onChange = jest.fn();
        const select = new SelectController<number>({
            selectClassName: "ItemCard--selected",
            getValue: (card) =>
                card.typeName === "ItemCard"
                    ? (card.attrs as unknown as { id: number }).id
                    : undefined,
            cards: [cardA, cardB],
            onChange,
        });
        select.bindWidget(mockBindWidget());

        select.handleCardClick(cardB, mockMouseEvent());
        expect(select.value).toBe(2);
        expect(cardB.vis[TREE_UUID]!.htmlElement!.classList.contains("ItemCard--selected")).toBe(true);
        expect(onChange).toHaveBeenCalledWith(2, undefined);
    });

    it("commitValue updates value, DOM, and invokes onChange", () => {
        const cardA = createMockSelectableCard(1);
        const cardB = createMockSelectableCard(2);
        const onChange = jest.fn();
        const select = new SelectController<number>({
            selectClassName: "ItemCard--selected",
            getValue: (card) =>
                card.typeName === "ItemCard"
                    ? (card.attrs as unknown as { id: number }).id
                    : undefined,
            cards: [cardA, cardB],
            onChange,
        });
        select.bindWidget(mockBindWidget());

        select.commitValue(2, mockMouseEvent());
        expect(select.value).toBe(2);
        expect(cardB.vis[TREE_UUID]!.htmlElement!.classList.contains("ItemCard--selected")).toBe(true);
        expect(onChange).toHaveBeenCalledWith(2, undefined);
    });

    it("commitValue is a no-op when the value is unchanged", () => {
        const card = createMockSelectableCard(1);
        const onChange = jest.fn();
        const select = new SelectController<number>({
            selectClassName: "ItemCard--selected",
            getValue: (card) =>
                card.typeName === "ItemCard"
                    ? (card.attrs as unknown as { id: number }).id
                    : undefined,
            cards: [card],
            onChange,
        });
        select.bindWidget(mockBindWidget());
        select.commitValue(1, mockMouseEvent());
        onChange.mockClear();

        select.commitValue(1, mockMouseEvent());
        expect(onChange).not.toHaveBeenCalled();
    });

    it("programmatic value set does not invoke onChange", () => {
        const card = createMockSelectableCard(1);
        const onChange = jest.fn();
        const select = new SelectController<number>({
            selectClassName: "ItemCard--selected",
            getValue: (card) =>
                card.typeName === "ItemCard"
                    ? (card.attrs as unknown as { id: number }).id
                    : undefined,
            cards: [card],
            onChange,
        });
        select.bindWidget(mockBindWidget());

        select.value = 1;
        expect(onChange).not.toHaveBeenCalled();
    });

    it("clear removes selection", () => {
        const card = createMockSelectableCard(1);
        const select = new SelectController<number>({
            selectClassName: "ItemCard--selected",
            getValue: (card) =>
                card.typeName === "ItemCard"
                    ? (card.attrs as unknown as { id: number }).id
                    : undefined,
            cards: [card],
        });
        select.bindWidget(mockBindWidget());

        select.value = 1;
        select.clear();
        expect(select.value).toBeUndefined();
        expect(card.vis[TREE_UUID]!.htmlElement!.classList.contains("ItemCard--selected")).toBe(false);
    });
});
