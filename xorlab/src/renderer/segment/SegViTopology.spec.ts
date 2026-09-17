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

import { STYLE_ADAPTERS } from "../SegPropsAdapters";
import { CardVi, HasHtmlElement } from "../CardVi";
import { SegVi } from "./SegVi";
import { SegViTopology } from "./SegViTopology";
import { PropertyImpl } from "../../collection";

function createMockSegVi(props: {
    typeName: string;
    clientCoordinate: number;
    parent?: SegVi;
    sourceId?: string;
}): SegVi {
    const clientCoordinate = new PropertyImpl(props.clientCoordinate);
    const source = {
        id: props.sourceId ?? props.typeName,
        typeName: props.typeName,
        nested: { forEach: () => {} },
    };
    return {
        parent: props.parent,
        clientCoordinate,
        // Matches SegVi: displayCoordinate = client − parent.scrollOffset
        displayCoordinate: clientCoordinate,
        source,
        treeUuid: "test-tree",
        window: new PropertyImpl(50),
    } as unknown as SegVi;
}

describe("SegViTopology nested card scroll offset", () => {
    it("uses cumulative offset from nested seg up to place seg", () => {
        const weekVi = createMockSegVi({ typeName: "WeekSeg", clientCoordinate: 0, sourceId: "week-place" });
        const weekdayVi = createMockSegVi({ typeName: "WeekdaySeg", clientCoordinate: 200, parent: weekVi });
        const hourVi = createMockSegVi({ typeName: "HourSeg", clientCoordinate: 50, parent: weekdayVi });

        const topology = new SegViTopology({
            cssUpdater: STYLE_ADAPTERS.HORIZONTAL,
        }, hourVi);

        const placeSegVi = { source: { id: "week-place", typeName: "WeekSeg" } } as unknown as SegVi;
        const parentCardVi = {
            viBasis: {
                HORIZONTAL: placeSegVi,
                VERTICAL: { source: { id: "v-stub", typeName: "StubSeg" } } as unknown as SegVi,
            },
        } as HasHtmlElement;

        const cardElement = {
            style: {} as CSSStyleDeclaration,
        } as HTMLElement;

        const cardVi = {
            id: "lesson-card",
            parent: parentCardVi,
            htmlElement: cardElement,
            source: { typeName: "LessonCard" },
        } as unknown as CardVi;

        topology.subscribeCardVi(cardVi, false);
        topology.shiftCardVis();

        expect(cardElement.style.left).toBe("250px");
    });

    it("subtracts parent scrollOffset via displayCoordinate when shifting cards", () => {
        const listScrollOffset = new PropertyImpl(40);
        const listVi = {
            parent: undefined,
            clientCoordinate: new PropertyImpl(0),
            displayCoordinate: new PropertyImpl(0),
            scrollOffset: listScrollOffset,
            source: { id: "group-list-place", typeName: "GroupListSeg" },
            treeUuid: "test-tree",
            window: new PropertyImpl(200),
        } as unknown as SegVi;

        const groupClient = new PropertyImpl(60);
        const groupDisplay = new PropertyImpl(60 - 40);
        const groupVi = {
            parent: listVi,
            clientCoordinate: groupClient,
            displayCoordinate: groupDisplay,
            source: { id: "group-1", typeName: "GroupSeg" },
            treeUuid: "test-tree",
            window: new PropertyImpl(60),
        } as unknown as SegVi;

        const topology = new SegViTopology({
            cssUpdater: STYLE_ADAPTERS.VERTICAL,
        }, groupVi);

        const placeSegVi = { source: { id: "group-list-place", typeName: "GroupListSeg" } } as unknown as SegVi;
        const parentCardVi = {
            viBasis: {
                HORIZONTAL: { source: { id: "h-stub", typeName: "StubSeg" } } as unknown as SegVi,
                VERTICAL: placeSegVi,
            },
        } as HasHtmlElement;

        const cardElement = {
            style: {} as CSSStyleDeclaration,
        } as HTMLElement;

        const cardVi = {
            id: "lesson-card",
            parent: parentCardVi,
            htmlElement: cardElement,
            source: { typeName: "LessonCard" },
        } as unknown as CardVi;

        topology.subscribeCardVi(cardVi, false);
        topology.shiftCardVis();

        expect(cardElement.style.top).toBe("20px");
        expect(cardElement.style.top).not.toBe("60px");
    });
});
