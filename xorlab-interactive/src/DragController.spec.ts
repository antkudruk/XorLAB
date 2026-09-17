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
import { DragController } from "./DragController";
import { createMockSelectableCard, mockMouseEvent } from "./controllerTestUtils";
import type { ICard } from "xorlab";

function ensureDom(): void {
    if (typeof global.document !== "undefined") {
        return;
    }
    const dom = new JSDOM("<!DOCTYPE html><html><body></body></html>");
    global.document = dom.window.document;
    global.HTMLElement = dom.window.HTMLElement;
}

function withNested(regionCard: ICard, nestedCards: readonly ICard[]): ICard {
    const mutable = regionCard as ICard & { nested: ICard["nested"] };
    mutable.nested = {
        forEach: (fn: (item: ICard) => void) => {
            nestedCards.forEach(fn);
        },
    } as unknown as ICard["nested"];
    return mutable;
}

describe("DragController", () => {
    beforeAll(() => {
        ensureDom();
    });

    it("calls updateAttrs and dragged card.fire on move for a card in the region", () => {
        const updates: Array<{ card: ICard; regionCard: ICard }> = [];
        const cardFire = jest.fn();
        const regionFire = jest.fn();
        const lesson = createMockSelectableCard(1, "LessonCard");
        lesson.fire = cardFire;
        const regionCard = withNested(createMockSelectableCard(100, "LessonListCard"), [lesson]);
        regionCard.fire = regionFire;

        const controller = new DragController({
            regionCard,
            updateAttrs: ({ card, regionCard: region }) => {
                updates.push({ card, regionCard: region });
            },
        });

        const event = mockMouseEvent();
        controller.begin(lesson, event);
        expect(controller.isDragging).toBe(false);
        expect(controller.draggedCard).toBe(lesson);
        expect(controller.regionCard).toBe(regionCard);

        controller.move(event);
        expect(controller.isDragging).toBe(true);
        expect(updates).toEqual([{ card: lesson, regionCard }]);
        expect(cardFire).toHaveBeenCalledTimes(1);
        expect(regionFire).not.toHaveBeenCalled();

        controller.end(event);
        expect(controller.isDragging).toBe(false);
        expect(controller.draggedCard).toBeUndefined();
    });

    it("ignores foreign-region cards", () => {
        const updateAttrs = jest.fn();
        const cardFire = jest.fn();
        const regionCard = withNested(createMockSelectableCard(100, "LessonListCard"), []);
        const foreign = createMockSelectableCard(2, "LessonCard");
        foreign.fire = cardFire;
        const controller = new DragController({ regionCard, updateAttrs });

        const event = mockMouseEvent();
        controller.begin(foreign, event);
        controller.move(event);
        controller.end(event);

        expect(updateAttrs).not.toHaveBeenCalled();
        expect(cardFire).not.toHaveBeenCalled();
        expect(controller.isDragging).toBe(false);
    });

    it("does not move without begin", () => {
        const updateAttrs = jest.fn();
        const lesson = createMockSelectableCard(1, "LessonCard");
        const regionCard = withNested(createMockSelectableCard(100, "LessonListCard"), [lesson]);
        const controller = new DragController({ regionCard, updateAttrs });
        const event = mockMouseEvent();

        controller.move(event);
        expect(updateAttrs).not.toHaveBeenCalled();
    });
});
