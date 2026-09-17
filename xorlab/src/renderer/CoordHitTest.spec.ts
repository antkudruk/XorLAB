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

import type { ISeg } from "../facade/line";
import { EArray } from "../collection/EArray";
import { segFactory } from "../facade/line";
import { distinctTypeLineCollectionFactory } from "../facade/collection";
import { PropertyImpl } from "../collection/property/Property";
import { STYLE_ADAPTERS } from "./SegPropsAdapters";
import { CardVi } from "./CardVi";
import {
    childCardAtCoordFromCardVi,
    childCardsAtDisplayCoordFromCardVi,
    childSegAtCoordFromSeg,
    childSegAtCoordFromSegVi,
    displayLocalToInvariantLocal,
    findCardChainAtDisplayCoord,
    findDeepestCardVi,
    findSegsWithHandlerAtDisplayCoord,
} from "./CoordHitTest";
import { SegVi, SegViCeiling } from "./segment/SegVi";

function createRootSegVi(
    source: ISeg,
    cssUpdater = STYLE_ADAPTERS.VERTICAL,
    hostAvailableSpace = new PropertyImpl(800),
) {
    const vi = new SegVi({
        parent: undefined,
        styleSheet: {},
        source,
        cssUpdater,
        next: new SegViCeiling(),
        hostAvailableSpace,
    });
    source.subscribeVi(vi.treeUuid, vi);
    return vi;
}

function segViFor(root: SegVi, child: ISeg): SegVi {
    const vi = child.getViByUuid(root.treeUuid);
    if (!vi) {
        throw new Error(`Missing SegVi for ${child.typeName}`);
    }
    return vi;
}

describe("CoordHitTest", () => {
    it("childSegAtCoord returns direct nested seg by clientCoordinate range", () => {
        const nested = new EArray<ISeg>();
        const parentSeg = segFactory({
            typeName: "WeekSeg",
            nested,
        });
        const parentVi = createRootSegVi(parentSeg);

        for (let i = 0; i < 3; i++) {
            nested.push(segFactory({
                typeName: "HourSeg",
                attrs: { hour: i + 1 },
                style: { window: "50px" },
            }));
        }

        const childVis = nested.map((child) => segViFor(parentVi, child));
        expect(childSegAtCoordFromSegVi(parentVi, 0)?.source).toBe(childVis[0].source);
        expect(childSegAtCoordFromSegVi(parentVi, 49)?.source).toBe(childVis[0].source);
        expect(childSegAtCoordFromSegVi(parentVi, 50)?.source).toBe(childVis[1].source);
        expect(childSegAtCoordFromSegVi(parentVi, 120)?.source).toBe(childVis[2].source);
        expect(childSegAtCoordFromSeg(parentSeg, 75, parentVi.treeUuid)?.typeName).toBe("HourSeg");
    });

    it("childSegAtCoord is invariant to scrollOffset", () => {
        const nested = new EArray<ISeg>();
        const parentSeg = segFactory({
            typeName: "WeekSeg",
            nested,
        });
        const parentVi = createRootSegVi(parentSeg);
        nested.push(segFactory({
            typeName: "HourSeg",
            style: { window: "50px" },
        }));
        nested.push(segFactory({
            typeName: "HourSeg",
            style: { window: "50px" },
        }));

        parentVi.scrollOffset.value = 0;
        const beforeScroll = childSegAtCoordFromSegVi(parentVi, 60)?.source.id;

        parentVi.scrollOffset.value = 30;
        const afterScroll = childSegAtCoordFromSegVi(parentVi, 60)?.source.id;

        expect(beforeScroll).toBe(afterScroll);
    });

    it("childCardAtCoord returns nested card at scroll-invariant bounds", () => {
        const weekVi = {
            source: { id: "week-place", typeName: "WeekSeg" },
        } as SegVi;
        const weekdayVi = {
            parent: weekVi,
            clientCoordinate: new PropertyImpl(100),
            displayCoordinate: new PropertyImpl(100),
            source: { id: "weekday", typeName: "WeekdaySeg" },
            window: new PropertyImpl(200),
        } as unknown as SegVi;
        const hourVi = {
            parent: weekdayVi,
            clientCoordinate: new PropertyImpl(25),
            displayCoordinate: new PropertyImpl(25),
            source: { id: "hour", typeName: "HourSeg" },
            window: new PropertyImpl(50),
        } as unknown as SegVi;

        const parentCardVi = {
            viBasis: {
                HORIZONTAL: weekVi,
                VERTICAL: { source: { id: "v-place", typeName: "GroupListSeg" } },
            },
            nested: {
                length: 1,
                at: () => childCardVi,
            },
        } as unknown as CardVi;

        const childCardVi = {
            parent: parentCardVi,
            horizontal: hourVi,
            vertical: {
                clientCoordinate: new PropertyImpl(0),
                displayCoordinate: new PropertyImpl(0),
                source: { id: "group", typeName: "GroupSeg" },
                window: new PropertyImpl(70),
            },
            source: { typeName: "LessonCard" },
        } as unknown as CardVi;

        const hit = childCardAtCoordFromCardVi(parentCardVi, [125, 10]);
        expect(hit?.source.typeName).toBe("LessonCard");
    });

    it("findCardChainAtDisplayCoord returns root-to-leaf chain and findDeepestCardVi returns leaf", () => {
        const weekVi = {
            source: { id: "week-place", typeName: "WeekSeg" },
        } as SegVi;
        const weekdayVi = {
            parent: weekVi,
            clientCoordinate: new PropertyImpl(100),
            displayCoordinate: new PropertyImpl(100),
            source: { id: "weekday", typeName: "WeekdaySeg" },
            window: new PropertyImpl(200),
        } as unknown as SegVi;
        const hourVi = {
            parent: weekdayVi,
            clientCoordinate: new PropertyImpl(25),
            displayCoordinate: new PropertyImpl(25),
            source: { id: "hour", typeName: "HourSeg" },
            window: new PropertyImpl(50),
        } as unknown as SegVi;

        const parentCardVi = {
            viBasis: {
                HORIZONTAL: weekVi,
                VERTICAL: { source: { id: "v-place", typeName: "GroupListSeg" } },
            },
            nested: {
                length: 1,
                at: () => childCardVi,
            },
        } as unknown as CardVi;

        const childCardVi = {
            parent: parentCardVi,
            viBasis: {
                HORIZONTAL: weekVi,
                VERTICAL: { source: { id: "v-place", typeName: "GroupListSeg" } },
            },
            nested: {
                length: 0,
                at: () => undefined,
            },
            horizontal: hourVi,
            vertical: {
                clientCoordinate: new PropertyImpl(0),
                displayCoordinate: new PropertyImpl(0),
                source: { id: "group", typeName: "GroupSeg" },
                window: new PropertyImpl(70),
            },
            source: { typeName: "LessonCard" },
        } as unknown as CardVi;

        const chain = findCardChainAtDisplayCoord(parentCardVi, [125, 10]);
        expect(chain).toHaveLength(2);
        expect(chain[0].cardVi).toBe(parentCardVi);
        expect(chain[1].cardVi).toBe(childCardVi);
        expect(chain[1].cardVi.source.typeName).toBe("LessonCard");

        const deepest = findDeepestCardVi(parentCardVi, [125, 10]);
        expect(deepest.cardVi).toBe(childCardVi);
        expect(deepest.cardVi.source.typeName).toBe("LessonCard");
    });

    it("findCardChainAtDisplayCoord includes all sibling overlay cards at the same bounds", () => {
        const weekVi = {
            source: { id: "week-place", typeName: "WeekSeg" },
            window: new PropertyImpl(200),
        } as unknown as SegVi;
        const groupListVi = {
            source: { id: "v-place", typeName: "GroupListSeg" },
            window: new PropertyImpl(70),
        } as unknown as SegVi;
        const hourVi = {
            parent: weekVi,
            clientCoordinate: new PropertyImpl(0),
            displayCoordinate: new PropertyImpl(0),
            source: { id: "hour", typeName: "HourSeg" },
            window: new PropertyImpl(200),
        } as unknown as SegVi;
        const groupSegVi = {
            clientCoordinate: new PropertyImpl(0),
            displayCoordinate: new PropertyImpl(0),
            source: { id: "group", typeName: "GroupSeg" },
            window: new PropertyImpl(70),
        } as unknown as SegVi;

        const overlayCardVi = {
            parent: undefined as unknown as CardVi,
            viBasis: {
                HORIZONTAL: weekVi,
                VERTICAL: groupListVi,
            },
            nested: {
                length: 0,
                at: () => undefined,
            },
            horizontal: weekVi,
            vertical: groupListVi,
            source: { typeName: "EmptyGroupSlotListCard" },
        } as unknown as CardVi;

        const lessonListCardVi = {
            parent: undefined as unknown as CardVi,
            viBasis: {
                HORIZONTAL: weekVi,
                VERTICAL: groupListVi,
            },
            nested: {
                length: 0,
                at: () => undefined,
            },
            horizontal: weekVi,
            vertical: groupListVi,
            source: { typeName: "GroupLessonListCard" },
        } as unknown as CardVi;

        const parentCardVi = {
            viBasis: {
                HORIZONTAL: weekVi,
                VERTICAL: groupListVi,
            },
            nested: {
                length: 2,
                at: (index: number) => (index === 0 ? overlayCardVi : lessonListCardVi),
            },
            source: { typeName: "GroupTimetableCard" },
        } as unknown as CardVi;

        (overlayCardVi as unknown as { parent: CardVi }).parent = parentCardVi;
        (lessonListCardVi as unknown as { parent: CardVi }).parent = parentCardVi;

        const hits = childCardsAtDisplayCoordFromCardVi(parentCardVi, [50, 10]);
        expect(hits).toHaveLength(2);
        expect(hits[0].source.typeName).toBe("EmptyGroupSlotListCard");
        expect(hits[1].source.typeName).toBe("GroupLessonListCard");

        const chain = findCardChainAtDisplayCoord(parentCardVi, [50, 10]);
        expect(chain.map((entry) => entry.cardVi.source.typeName)).toEqual([
            "GroupTimetableCard",
            "EmptyGroupSlotListCard",
            "GroupLessonListCard",
        ]);
    });

    it("orders overlapping siblings by zIndex (higher paints and hits on top)", () => {
        const weekVi = {
            source: { id: "week-place", typeName: "WeekSeg" },
            window: new PropertyImpl(200),
        } as unknown as SegVi;
        const groupListVi = {
            source: { id: "v-place", typeName: "GroupListSeg" },
            window: new PropertyImpl(70),
        } as unknown as SegVi;

        const lowCardVi = {
            parent: undefined as unknown as CardVi,
            viBasis: {
                HORIZONTAL: weekVi,
                VERTICAL: groupListVi,
            },
            nested: {
                length: 0,
                at: () => undefined,
            },
            horizontal: weekVi,
            vertical: groupListVi,
            source: { typeName: "EmptyGroupSlotListCard", zIndex: 0 },
        } as unknown as CardVi;

        const highCardVi = {
            parent: undefined as unknown as CardVi,
            viBasis: {
                HORIZONTAL: weekVi,
                VERTICAL: groupListVi,
            },
            nested: {
                length: 0,
                at: () => undefined,
            },
            horizontal: weekVi,
            vertical: groupListVi,
            source: { typeName: "GroupLessonListCard", zIndex: 2 },
        } as unknown as CardVi;

        // Nested order puts low zIndex first; without zIndex sorting it would win childCardAtCoord.
        const parentCardVi = {
            viBasis: {
                HORIZONTAL: weekVi,
                VERTICAL: groupListVi,
            },
            nested: {
                length: 2,
                at: (index: number) => (index === 0 ? lowCardVi : highCardVi),
            },
            source: { typeName: "GroupTimetableCard", zIndex: 0 },
        } as unknown as CardVi;

        (lowCardVi as unknown as { parent: CardVi }).parent = parentCardVi;
        (highCardVi as unknown as { parent: CardVi }).parent = parentCardVi;

        const hits = childCardsAtDisplayCoordFromCardVi(parentCardVi, [50, 10]);
        expect(hits.map((hit) => hit.source.typeName)).toEqual([
            "EmptyGroupSlotListCard",
            "GroupLessonListCard",
        ]);
        expect(childCardAtCoordFromCardVi(parentCardVi, [50, 10])?.source.typeName).toBe(
            "GroupLessonListCard",
        );

        const chain = findCardChainAtDisplayCoord(parentCardVi, [50, 10]);
        expect(chain.map((entry) => entry.cardVi.source.typeName)).toEqual([
            "GroupTimetableCard",
            "EmptyGroupSlotListCard",
            "GroupLessonListCard",
        ]);
        expect(findDeepestCardVi(parentCardVi, [50, 10]).cardVi.source.typeName).toBe(
            "GroupLessonListCard",
        );
    });

    it("findCardChainAtDisplayCoord walks deeper nested cards under each sibling branch", () => {
        const weekVi = {
            source: { id: "week-place", typeName: "WeekSeg" },
            window: new PropertyImpl(200),
        } as unknown as SegVi;
        const groupListVi = {
            source: { id: "v-place", typeName: "GroupListSeg" },
            window: new PropertyImpl(70),
        } as unknown as SegVi;
        const hourVi = {
            parent: weekVi,
            clientCoordinate: new PropertyImpl(25),
            displayCoordinate: new PropertyImpl(25),
            source: { id: "hour", typeName: "HourSeg" },
            window: new PropertyImpl(50),
        } as unknown as SegVi;
        const groupSegVi = {
            clientCoordinate: new PropertyImpl(0),
            displayCoordinate: new PropertyImpl(0),
            source: { id: "group", typeName: "GroupSeg" },
            window: new PropertyImpl(70),
        } as unknown as SegVi;

        const overlayCardVi = {
            parent: undefined as unknown as CardVi,
            viBasis: {
                HORIZONTAL: weekVi,
                VERTICAL: groupListVi,
            },
            nested: {
                length: 0,
                at: () => undefined,
            },
            horizontal: weekVi,
            vertical: groupListVi,
            source: { typeName: "EmptyGroupSlotListCard" },
        } as unknown as CardVi;

        const lessonCardVi = {
            parent: undefined as unknown as CardVi,
            viBasis: {
                HORIZONTAL: weekVi,
                VERTICAL: groupListVi,
            },
            nested: {
                length: 0,
                at: () => undefined,
            },
            horizontal: hourVi,
            vertical: groupSegVi,
            source: { typeName: "LessonCard" },
        } as unknown as CardVi;

        const lessonListCardVi = {
            parent: undefined as unknown as CardVi,
            viBasis: {
                HORIZONTAL: weekVi,
                VERTICAL: groupListVi,
            },
            nested: {
                length: 1,
                at: () => lessonCardVi,
            },
            horizontal: weekVi,
            vertical: groupListVi,
            source: { typeName: "GroupLessonListCard" },
        } as unknown as CardVi;

        const parentCardVi = {
            viBasis: {
                HORIZONTAL: weekVi,
                VERTICAL: groupListVi,
            },
            nested: {
                length: 2,
                at: (index: number) => (index === 0 ? overlayCardVi : lessonListCardVi),
            },
            horizontal: weekVi,
            vertical: groupListVi,
            source: { typeName: "GroupTimetableCard" },
        } as unknown as CardVi;

        (overlayCardVi as unknown as { parent: CardVi }).parent = parentCardVi;
        (lessonListCardVi as unknown as { parent: CardVi }).parent = parentCardVi;
        (lessonCardVi as unknown as { parent: CardVi }).parent = lessonListCardVi;

        const chain = findCardChainAtDisplayCoord(parentCardVi, [30, 10]);
        expect(chain.map((entry) => entry.cardVi.source.typeName)).toEqual([
            "GroupTimetableCard",
            "EmptyGroupSlotListCard",
            "GroupLessonListCard",
            "LessonCard",
        ]);

        const deepest = findDeepestCardVi(parentCardVi, [30, 10]);
        expect(deepest.cardVi.source.typeName).toBe("LessonCard");
    });

    it("displayLocalToInvariantLocal adds scroll delta between client and display offsets", () => {
        const placeVi = {
            source: { id: "place", typeName: "WeekSeg" },
        } as SegVi;
        const childVi = {
            parent: {
                scrollOffset: new PropertyImpl(40),
            },
            clientCoordinate: new PropertyImpl(90),
            displayCoordinate: new PropertyImpl(50),
            source: { id: "hour", typeName: "HourSeg" },
        } as unknown as SegVi;
        const vPlaceVi = {
            source: { id: "v-place", typeName: "GroupListSeg" },
            scrollOffset: new PropertyImpl(0),
        } as unknown as SegVi;

        const cardVi = {
            viBasis: { HORIZONTAL: placeVi, VERTICAL: vPlaceVi },
            horizontal: childVi,
            vertical: vPlaceVi,
        } as unknown as CardVi;

        expect(displayLocalToInvariantLocal(cardVi, [10, 0])).toEqual([50, 0]);
    });

    it("displayLocalToInvariantLocal adds place scrollOffset when card sits on the place", () => {
        const placeVi = {
            source: { id: "week", typeName: "WeekSeg" },
            scrollOffset: new PropertyImpl(30),
        } as unknown as SegVi;
        const vPlaceVi = {
            source: { id: "v-place", typeName: "GroupListSeg" },
            scrollOffset: new PropertyImpl(0),
        } as unknown as SegVi;

        const cardVi = {
            viBasis: { HORIZONTAL: placeVi, VERTICAL: vPlaceVi },
            horizontal: placeVi,
            vertical: vPlaceVi,
        } as unknown as CardVi;

        // Card-relative display X must become WeekSeg client X for CoordHelper / childSegAtCoord.
        expect(displayLocalToInvariantLocal(cardVi, [60, 0])).toEqual([90, 0]);
    });

    it("findSegsWithHandlerAtDisplayCoord reaches GroupSeg through auto and flex vertical siblings", () => {
        const timePlaceSeg = segFactory({
            typeName: "TimePlaceSeg",
            nested: new EArray(
                segFactory({ typeName: "WeekdayPlaceSeg", style: { window: "50px" } }),
                segFactory({ typeName: "HourPlaceSeg", style: { window: "50px" } }),
            ),
        });

        const groupListSeg = segFactory({
            typeName: "GroupListSeg",
            nested: new EArray(
                segFactory({
                    typeName: "GroupSeg",
                    attrs: { id: 1 },
                    style: { window: "70px" },
                    mouseOver: () => {},
                }),
            ),
            style: { window: "50flex" },
        });

        const timetableVerticalSeg = segFactory({
            typeName: "TimetableVerticalSeg",
            nested: distinctTypeLineCollectionFactory([timePlaceSeg, groupListSeg]),
            style: { window: "300px" },
        });

        const rootVi = createRootSegVi(timetableVerticalSeg, STYLE_ADAPTERS.VERTICAL, new PropertyImpl(300));

        const timePlaceVi = segViFor(rootVi, timePlaceSeg);
        const groupListVi = segViFor(rootVi, groupListSeg);

        expect(timePlaceVi.window.value).toBe(100);
        expect(groupListVi.displayCoordinate.value).toBe(100);

        const hits = findSegsWithHandlerAtDisplayCoord(rootVi, 130, "mouseOver");
        expect(hits.map((hit) => hit.seg.typeName)).toContain("GroupSeg");
        expect(hits.find((hit) => hit.seg.typeName === "GroupSeg")?.local).toBe(30);
        expect(groupListVi.displayCoordinate.value).toBe(100);
    });

    it("findSegsWithHandlerAtDisplayCoord prefers narrowest sibling when ranges overlap", () => {
        const timePlaceSeg = segFactory({
            typeName: "TimePlaceSeg",
            nested: new EArray(
                segFactory({ typeName: "WeekdayPlaceSeg", style: { window: "50px" } }),
                segFactory({ typeName: "HourPlaceSeg", style: { window: "50px" } }),
            ),
            style: { window: "300px" },
        });

        const groupListSeg = segFactory({
            typeName: "GroupListSeg",
            nested: new EArray(
                segFactory({
                    typeName: "GroupSeg",
                    attrs: { id: 1 },
                    style: { window: "70px" },
                    mouseOver: () => {},
                }),
            ),
            style: { window: "100px" },
        });

        const timetableVerticalSeg = segFactory({
            typeName: "TimetableVerticalSeg",
            nested: distinctTypeLineCollectionFactory([timePlaceSeg, groupListSeg]),
            style: { window: "300px" },
        });

        const rootVi = createRootSegVi(timetableVerticalSeg, STYLE_ADAPTERS.VERTICAL, new PropertyImpl(300));
        const groupListVi = segViFor(rootVi, groupListSeg);
        groupListVi.setClientCoordinate(100);

        const hits = findSegsWithHandlerAtDisplayCoord(rootVi, 130, "mouseOver");
        expect(hits.map((hit) => hit.seg.typeName)).toContain("GroupSeg");
    });
});
