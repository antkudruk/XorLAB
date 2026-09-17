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
import type { ICard } from "xorlab";
import type { MouseInteractionEvent } from "xorlab";
import { HoverController } from "./HoverController";
import { createMockSelectableCard, mockMouseEvent } from "./controllerTestUtils";

function ensureDom(): void {
    if (typeof global.document !== "undefined") {
        return;
    }
    const dom = new JSDOM("<!DOCTYPE html><html><body></body></html>");
    global.document = dom.window.document;
    global.HTMLElement = dom.window.HTMLElement;
}

describe("HoverController", () => {
    beforeAll(() => {
        ensureDom();
    });

    it("highlights cards in the event widget and clears previous emphasis", () => {
        const treeUuid = "card-tree-uuid";
        const controller = new HoverController("TestCard--hovered");
        const cardA = createMockSelectableCard(1, "TestCard", treeUuid);
        const cardB = createMockSelectableCard(2, "TestCard", treeUuid);

        controller.highlightCards([cardA], mockMouseEvent(treeUuid));
        expect(cardA.vis[treeUuid]!.htmlElement!.classList.contains("TestCard--hovered")).toBe(true);

        controller.highlightCards([cardB], mockMouseEvent(treeUuid));
        expect(cardA.vis[treeUuid]!.htmlElement!.classList.contains("TestCard--hovered")).toBe(false);
        expect(cardB.vis[treeUuid]!.htmlElement!.classList.contains("TestCard--hovered")).toBe(true);
    });

    it("clear removes emphasis from tracked elements", () => {
        const treeUuid = "card-tree-uuid";
        const controller = new HoverController("TestCard--hovered");
        const card = createMockSelectableCard(1, "TestCard", treeUuid);

        controller.highlightCards([card], mockMouseEvent(treeUuid));
        controller.clear();
        expect(card.vis[treeUuid]!.htmlElement!.classList.contains("TestCard--hovered")).toBe(false);
    });
});
