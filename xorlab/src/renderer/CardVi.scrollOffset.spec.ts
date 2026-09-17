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
 * Regression: after horizontal setBasis with vertical scrollOffset ≠ 0,
 * CardVi.render must keep vertical CSS offset from displayCoordinate
 * (same as SegViTopology.shiftCardVis), not clientCoordinate.
 */
import type { ICard, ISeg } from "../facade";
import { cardFactory, segFactory } from "../facade";
import { eArrayFactory } from "../facade/collection";
import { JSDOM } from "jsdom";
import { ScalarElementMetaFactory } from "./ElementFactory";
import { Widget } from "./Widget";

function ensureDom(): void {
    if (typeof global.document !== "undefined") {
        return;
    }
    const dom = new JSDOM("<!DOCTYPE html><html><body></body></html>", {
        pretendToBeVisual: true,
        url: "http://localhost/",
    });
    global.document = dom.window.document;
    global.window = dom.window as unknown as Window & typeof globalThis;
    global.HTMLElement = dom.window.HTMLElement;
    global.MouseEvent = dom.window.MouseEvent;
    global.ResizeObserver = class ResizeObserver {
        observe() {}
        unobserve() {}
        disconnect() {}
    } as unknown as typeof ResizeObserver;
}

describe("CardVi render with scrollOffset", () => {
    let container: HTMLDivElement;

    beforeAll(() => {
        ensureDom();
    });

    beforeEach(() => {
        container = document.createElement("div");
        container.style.width = "400px";
        container.style.height = "300px";
        document.body.appendChild(container);
    });

    afterEach(() => {
        container.remove();
    });

    it("keeps scrolled top after horizontal setBasis when GroupListSeg scrollOffset is non-zero", () => {
        const group0 = segFactory({
            typeName: "GroupSeg",
            attrs: { id: 0 },
            style: { window: "60px" },
        });
        const group1 = segFactory({
            typeName: "GroupSeg",
            attrs: { id: 1 },
            style: { window: "60px" },
        });
        const vertical = segFactory({
            typeName: "GroupListSeg",
            nested: eArrayFactory([group0, group1]),
            style: { window: "200px" },
        });

        const hour0 = segFactory({
            typeName: "HourSeg",
            attrs: { hour: 1 },
            style: { window: "50px" },
        });
        const hour1 = segFactory({
            typeName: "HourSeg",
            attrs: { hour: 2 },
            style: { window: "50px" },
        });
        const horizontal = segFactory({
            typeName: "WeekSeg",
            nested: eArrayFactory([hour0, hour1]),
            style: { window: "200px" },
        });

        const lesson = { groupId: 1, hour: 1 };
        const lessonCard = cardFactory({
            typeName: "LessonCard",
            attrs: lesson,
            selfPos: {
                WeekSeg: (place: ISeg) =>
                    place.nested.find(
                        (seg) => (seg.attrs as { hour: number }).hour === lesson.hour,
                    ) ?? null,
                GroupListSeg: (place: ISeg) =>
                    place.nested.find(
                        (seg) => (seg.attrs as { id: number }).id === lesson.groupId,
                    ) ?? null,
            } as never,
            renderer: {
                updateCardHtmlelement: () => {},
            },
        });

        const listCard = cardFactory({
            typeName: "GroupLessonListCard",
            nested: eArrayFactory([lessonCard]),
        });

        const widget = new Widget({
            htmlElement: container,
            styleSheet: {},
            elementMetaFactory: ScalarElementMetaFactory,
            vertical: vertical as unknown as ISeg,
            horizontal: horizontal as unknown as ISeg,
            card: listCard as unknown as ICard,
        });

        const cardTreeUuid = widget.treeUuids.card;
        const lessonVi = lessonCard.vis[cardTreeUuid];
        expect(lessonVi?.htmlElement).toBeDefined();

        const groupListVi = vertical.getViByUuid(widget.treeUuids.vertical);
        expect(groupListVi).toBeDefined();

        const scrollOffset = 40;
        groupListVi!.scrollOffset.value = scrollOffset;

        const topAfterScroll = lessonVi!.htmlElement!.style.top;
        const group1Vi = group1.getViByUuid(widget.treeUuids.vertical);
        expect(group1Vi).toBeDefined();
        const expectedScrolledTop = `${group1Vi!.displayCoordinate.value}px`;
        expect(topAfterScroll).toBe(expectedScrolledTop);
        expect(group1Vi!.clientCoordinate.value).toBeGreaterThan(group1Vi!.displayCoordinate.value);
        expect(topAfterScroll).not.toBe(`${group1Vi!.clientCoordinate.value}px`);

        lesson.hour = 2;
        listCard.setBasis({
            [vertical.id]: vertical,
            [horizontal.id]: horizontal,
        });
        const childBasis: { [placeId: string]: ISeg | null } = {
            [vertical.id]: listCard.resolveChildPosition(vertical, lessonCard),
            [horizontal.id]: listCard.resolveChildPosition(horizontal, lessonCard),
        };
        lessonCard.setBasis(childBasis);

        const topAfterHorizontalMove = lessonVi!.htmlElement!.style.top;
        expect(topAfterHorizontalMove).toBe(expectedScrolledTop);
        expect(topAfterHorizontalMove).toBe(topAfterScroll);

        widget.destroy();
    });

    it("applies card zIndex to the rendered HTML element", () => {
        const vertical = segFactory({
            typeName: "GroupListSeg",
            style: { window: "100px" },
        });
        const horizontal = segFactory({
            typeName: "WeekSeg",
            style: { window: "100px" },
        });
        const overlayCard = cardFactory({
            typeName: "EmptySlotListCard",
            zIndex: 3,
            renderer: { updateCardHtmlelement: () => {} },
        });
        const rootCard = cardFactory({
            typeName: "GroupTimetableCard",
            nested: eArrayFactory([overlayCard]),
            renderer: { updateCardHtmlelement: () => {} },
        });

        const widget = new Widget({
            htmlElement: container,
            styleSheet: {},
            elementMetaFactory: ScalarElementMetaFactory,
            vertical: vertical as unknown as ISeg,
            horizontal: horizontal as unknown as ISeg,
            card: rootCard as unknown as ICard,
        });

        const overlayVi = overlayCard.vis[widget.treeUuids.card];
        expect(overlayVi?.htmlElement?.style.zIndex).toBe("3");
        expect(overlayCard.zIndex).toBe(3);
        expect(rootCard.zIndex).toBe(0);

        widget.destroy();
    });
});
