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
import { CardVi, HasHtmlElement } from "./CardVi";
import { SegVi } from "./segment/SegVi";
import { ElementMetaFactory } from "./ElementFactory";
import { mock } from "jest-mock-extended";
import { EStyleSheet } from "./Size";
import { JSDOM } from "jsdom";
import { EMPTY_RENDERER } from "./Renderer";
import { ReadOnlyProperty } from "../collection/property/Property";

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
}

function mockPlaceSegVi(typeName: string, id = `${typeName}-id`): SegVi {
    return {
        source: { typeName, id } as ISeg,
        collapsed: { value: false } as ReadOnlyProperty<boolean>,
        displayCoordinate: { value: 0 } as ReadOnlyProperty<number>,
        updateCardViCss: jest.fn(),
        parent: undefined,
    } as unknown as SegVi;
}

function createCardVi(
    source: ICard,
    horizontal: SegVi,
    vertical: SegVi,
    parent: HasHtmlElement,
): CardVi {
    const stylesheet: EStyleSheet = mock<EStyleSheet>();
    const elementMetaFactory: ElementMetaFactory = mock<ElementMetaFactory>();
    return new CardVi({
        parent,
        treeUuid: "tree-uuid",
        source,
        stylesheet,
        elementMetaFactory,
        basis: {
            HORIZONTAL: horizontal,
            VERTICAL: vertical,
        },
    });
}

describe("CardVi framework CSS classes", () => {
    beforeAll(() => {
        ensureDom();
    });

    test("drops stale place typeNames on rerender and keeps non-framework classes", () => {
        const parentHorizontal = mockPlaceSegVi("ParentHSeg", "parent-h-id");
        const parentVertical = mockPlaceSegVi("ParentVSeg", "parent-v-id");
        const parentElement = document.createElement("div");
        const parent: HasHtmlElement = {
            htmlElement: parentElement,
            viBasis: {
                HORIZONTAL: parentHorizontal,
                VERTICAL: parentVertical,
            },
        };

        const horizontalPlace = mockPlaceSegVi("ColSeg", "col-id");
        const verticalPlaceOld = mockPlaceSegVi("GroupListSeg", "list-id");

        const source = {
            typeName: "ScrollbarTreeCard",
            zIndex: 0,
            renderer: EMPTY_RENDERER,
            nested: {
                length: 0,
                at: () => undefined,
                subscribe: jest.fn(),
            },
            addWidget: jest.fn(),
        } as unknown as ICard;

        const cardVi = createCardVi(source, horizontalPlace, verticalPlaceOld, parent);

        cardVi.render(parent);

        expect(cardVi.htmlElement?.classList.contains("ScrollbarTreeCard")).toBe(true);
        expect(cardVi.htmlElement?.classList.contains("ColSeg")).toBe(true);
        expect(cardVi.htmlElement?.classList.contains("GroupListSeg")).toBe(true);

        cardVi.htmlElement?.classList.add("hover-emphasis");

        const verticalPlaceNew = mockPlaceSegVi("GroupSeg", "group-id");
        (cardVi as unknown as { _viBasis: { VERTICAL: SegVi } })._viBasis.VERTICAL = verticalPlaceNew;

        cardVi.render(parent);

        expect(cardVi.htmlElement?.classList.contains("GroupListSeg")).toBe(false);
        expect(cardVi.htmlElement?.classList.contains("GroupSeg")).toBe(true);
        expect(cardVi.htmlElement?.classList.contains("hover-emphasis")).toBe(true);
        expect(cardVi.htmlElement?.classList.contains("ScrollbarTreeCard")).toBe(true);
        expect(cardVi.htmlElement?.classList.contains("ColSeg")).toBe(true);
        expect(cardVi.htmlElement?.classList.length).toBe(4);
    });
});
