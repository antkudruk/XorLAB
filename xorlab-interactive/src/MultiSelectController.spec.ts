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
import { MultiSelectController } from "./MultiSelectController";
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


describe("MultiSelectController", () => {
    beforeAll(() => {
        ensureDom();
    });

    it("handleCardClick toggles membership and invokes onChange", () => {
        const cardA = createMockSelectableCard(1);
        const cardB = createMockSelectableCard(2);
        const onChange = jest.fn();
        const multi = new MultiSelectController<number>({
            selectClassName: "ItemCard--selected",
            getValue: (card) =>
                card.typeName === "ItemCard"
                    ? (card.attrs as unknown as { id: number }).id
                    : undefined,
            cards: [cardA, cardB],
            onChange,
        });
        multi.bindWidget(mockBindWidget());

        multi.handleCardClick(cardA, mockMouseEvent());
        expect(multi.value).toEqual([1]);
        expect(onChange).toHaveBeenCalledWith([1], []);

        multi.handleCardClick(cardB, mockMouseEvent());
        expect(multi.value).toEqual([1, 2]);
        expect(onChange).toHaveBeenLastCalledWith([1, 2], [1]);

        multi.handleCardClick(cardA, mockMouseEvent());
        expect(multi.value).toEqual([2]);
        expect(onChange).toHaveBeenLastCalledWith([2], [1, 2]);
    });

    it("value setter syncs multiple cards", () => {
        const cardA = createMockSelectableCard(1);
        const cardB = createMockSelectableCard(2);
        const cardC = createMockSelectableCard(3);
        const multi = new MultiSelectController<number>({
            selectClassName: "ItemCard--selected",
            getValue: (card) =>
                card.typeName === "ItemCard"
                    ? (card.attrs as unknown as { id: number }).id
                    : undefined,
            cards: [cardA, cardB, cardC],
        });
        multi.bindWidget(mockBindWidget());

        multi.value = [1, 3];
        expect(cardA.vis[TREE_UUID]!.htmlElement!.classList.contains("ItemCard--selected")).toBe(true);
        expect(cardB.vis[TREE_UUID]!.htmlElement!.classList.contains("ItemCard--selected")).toBe(false);
        expect(cardC.vis[TREE_UUID]!.htmlElement!.classList.contains("ItemCard--selected")).toBe(true);
    });

    it("programmatic value set does not invoke onChange", () => {
        const card = createMockSelectableCard(1);
        const onChange = jest.fn();
        const multi = new MultiSelectController<number>({
            selectClassName: "ItemCard--selected",
            getValue: (card) =>
                card.typeName === "ItemCard"
                    ? (card.attrs as unknown as { id: number }).id
                    : undefined,
            cards: [card],
            onChange,
        });
        multi.bindWidget(mockBindWidget());

        multi.value = [1];
        expect(onChange).not.toHaveBeenCalled();
    });
});
