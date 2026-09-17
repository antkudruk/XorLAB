/*
    Copyright 2023 - Present Anton Kudruk
   Licensed under the Apache License, Version 2.0 (the "License");
   you may not use this file except in compliance with the License.
   You may obtain a copy of the License at
       http://www.apache.org/licenses/LICENSE-2.0
   Unless required by applicable law or agreed to in writing, software
   distributed under the License is distributed on an "AS IS" BASIS,
   WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
    10|   See the License for the specific language governing permissions and
   limitations under the License.
 */

/**
 * SegVi collapse/expand: window → COLLAPSED_WINDOW_PX, nested SegVis and
 * scrollOffset persist, aligned CardVi HTML detaches and reattaches.
 */
import type { ICard, ISeg } from "../../facade";
import { cardFactory, segFactory } from "../../facade";
import { eArrayFactory } from "../../facade/collection";
import { JSDOM } from "jsdom";
import { ScalarElementMetaFactory } from "../ElementFactory";
import { Widget } from "../Widget";
import { COLLAPSED_WINDOW_PX, SegVi, SegViCeiling } from "./SegVi";
import { STYLE_ADAPTERS } from "../SegPropsAdapters";
import { PropertyImpl } from "../../collection/property/Property";

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

function createRootSegVi(source: ISeg) {
    return new SegVi({
        parent: undefined,
        styleSheet: {},
        source,
        cssUpdater: STYLE_ADAPTERS.VERTICAL,
        next: new SegViCeiling(),
        hostAvailableSpace: new PropertyImpl(800),
    });
}

describe("SegVi collapse/expand", () => {
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

    it("keeps nested SegVis and scrollOffset across collapse and expand", () => {
        const child0 = segFactory({
            typeName: "GroupSeg",
            attrs: { id: 0 },
            style: { window: "60px" },
        });
        const child1 = segFactory({
            typeName: "GroupSeg",
            attrs: { id: 1 },
            style: { window: "60px" },
        });
        const list = segFactory({
            typeName: "GroupListSeg",
            nested: eArrayFactory([child0, child1]),
            style: { window: "200px" },
        });

        const root = createRootSegVi(list as unknown as ISeg);
        list.subscribeVi(root.treeUuid, root);

        const child0Vi = child0.getViByUuid(root.treeUuid);
        const child1Vi = child1.getViByUuid(root.treeUuid);
        expect(child0Vi).toBeDefined();
        expect(child1Vi).toBeDefined();
        expect(root.window.value).toBe(200);

        const scrollOffset = 40;
        root.scrollOffset.value = scrollOffset;

        root.collapse();
        expect(root.window.value).toBe(COLLAPSED_WINDOW_PX);
        expect(root.scrollOffset.value).toBe(scrollOffset);
        expect(child0.getViByUuid(root.treeUuid)).toBe(child0Vi);
        expect(child1.getViByUuid(root.treeUuid)).toBe(child1Vi);
        expect(list.nested.length).toBe(2);

        root.expand();
        expect(root.window.value).toBe(200);
        expect(root.scrollOffset.value).toBe(scrollOffset);
        expect(child0.getViByUuid(root.treeUuid)).toBe(child0Vi);
        expect(child1.getViByUuid(root.treeUuid)).toBe(child1Vi);
    });

    it("populates nested SegVis when initially collapsed and restores window on expand", () => {
        const child = segFactory({
            typeName: "GroupSeg",
            attrs: { id: 0 },
            style: { window: "60px" },
        });
        const list = segFactory({
            typeName: "GroupListSeg",
            nested: eArrayFactory([child]),
            style: { window: "200px", collapsed: true },
        });

        const root = createRootSegVi(list as unknown as ISeg);
        list.subscribeVi(root.treeUuid, root);

        expect(root.collapsed.value).toBe(true);
        expect(root.window.value).toBe(COLLAPSED_WINDOW_PX);
        expect(child.getViByUuid(root.treeUuid)).toBeDefined();
        expect(list.nested.length).toBe(1);

        root.expand();
        expect(root.window.value).toBe(200);
        expect(root.collapsed.value).toBe(false);
    });

    it("detaches aligned CardVi HTML on collapse and restores it on expand", () => {
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
        const horizontal = segFactory({
            typeName: "WeekSeg",
            style: { window: "200px" },
        });

        const listCard = cardFactory({
            typeName: "GroupLessonListCard",
            renderer: { updateCardHtmlelement: () => {} },
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
        const listCardVi = listCard.vis[cardTreeUuid];
        expect(listCardVi?.htmlElement).toBeDefined();

        const groupListVi = vertical.getViByUuid(widget.treeUuids.vertical)!;
        const nestedBefore = [
            group0.getViByUuid(widget.treeUuids.vertical),
            group1.getViByUuid(widget.treeUuids.vertical),
        ];
        expect(nestedBefore[0]).toBeDefined();
        expect(nestedBefore[1]).toBeDefined();

        const scrollOffset = 35;
        groupListVi.scrollOffset.value = scrollOffset;
        const windowBefore = groupListVi.window.value;

        groupListVi.collapse();
        expect(groupListVi.window.value).toBe(COLLAPSED_WINDOW_PX);
        expect(groupListVi.scrollOffset.value).toBe(scrollOffset);
        expect(listCardVi?.htmlElement).toBeUndefined();
        expect(group0.getViByUuid(widget.treeUuids.vertical)).toBe(nestedBefore[0]);
        expect(group1.getViByUuid(widget.treeUuids.vertical)).toBe(nestedBefore[1]);

        groupListVi.expand();
        expect(groupListVi.window.value).toBe(windowBefore);
        expect(groupListVi.scrollOffset.value).toBe(scrollOffset);
        expect(listCardVi?.htmlElement).toBeDefined();
        expect(group0.getViByUuid(widget.treeUuids.vertical)).toBe(nestedBefore[0]);
        expect(group1.getViByUuid(widget.treeUuids.vertical)).toBe(nestedBefore[1]);

        widget.destroy();
    });

    it("leaves aligned CardVi without HTML when initially collapsed via style", () => {
        const vertical = segFactory({
            typeName: "GroupListSeg",
            style: { window: "200px", collapsed: true },
        });
        const horizontal = segFactory({
            typeName: "WeekSeg",
            style: { window: "200px" },
        });
        const listCard = cardFactory({
            typeName: "GroupLessonListCard",
            renderer: { updateCardHtmlelement: () => {} },
        });

        const widget = new Widget({
            htmlElement: container,
            styleSheet: {},
            elementMetaFactory: ScalarElementMetaFactory,
            vertical: vertical as unknown as ISeg,
            horizontal: horizontal as unknown as ISeg,
            card: listCard as unknown as ICard,
        });

        const groupListVi = vertical.getViByUuid(widget.treeUuids.vertical)!;
        expect(groupListVi.window.value).toBe(COLLAPSED_WINDOW_PX);
        expect(listCard.vis[widget.treeUuids.card]?.htmlElement).toBeUndefined();

        groupListVi.expand();
        expect(listCard.vis[widget.treeUuids.card]?.htmlElement).toBeDefined();

        widget.destroy();
    });

    it("expand(false) collapses and collapse(false) expands", () => {
        const list = segFactory({
            typeName: "GroupListSeg",
            style: { window: "100px" },
        });
        const root = createRootSegVi(list as unknown as ISeg);
        expect(root.window.value).toBe(100);

        root.expand(false);
        expect(root.collapsed.value).toBe(true);
        expect(root.window.value).toBe(COLLAPSED_WINDOW_PX);

        root.collapse(false);
        expect(root.collapsed.value).toBe(false);
        expect(root.window.value).toBe(100);
    });
});
