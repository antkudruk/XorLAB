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

import { PropertyImpl } from "../collection/property/Property";
import { CardVi } from "../renderer/CardVi";
import { SegVi } from "../renderer/segment/SegVi";
import { cardFactory } from "./card";
import { eArrayFactory } from "./collection";
import { CardCoordHelper } from "./CardCoordHelper";

describe("CardCoordHelper", () => {
    it("inner descends to nested card and remaps local coord", () => {
        const treeUuid = "card-tree-uuid";
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
        const groupVi = {
            clientCoordinate: new PropertyImpl(0),
            displayCoordinate: new PropertyImpl(0),
            source: { id: "group", typeName: "GroupSeg" },
            window: new PropertyImpl(70),
        } as unknown as SegVi;

        const childCard = cardFactory({
            typeName: "LessonCard",
            attrs: { id: 42 },
        });
        const parentCard = cardFactory({
            typeName: "LessonListCard",
            nested: eArrayFactory([childCard]),
        });

        let childCardVi: CardVi;
        const parentCardVi = {
            treeUuid,
            source: parentCard,
            viBasis: {
                HORIZONTAL: weekVi,
                VERTICAL: { source: { id: "v-place", typeName: "GroupListSeg" } },
            },
            nested: {
                length: 1,
                at: () => childCardVi,
            },
        } as unknown as CardVi;

        childCardVi = {
            parent: parentCardVi,
            treeUuid,
            horizontal: hourVi,
            vertical: groupVi,
            source: childCard,
            nested: { length: 0, at: () => undefined },
        } as unknown as CardVi;

        parentCard.addWidget(parentCardVi);
        childCard.addWidget(childCardVi);

        // Child occupies x [125, 175) relative to parent place (ox = 100+25)
        const helper = parentCard
            .coordHelper([130, 10], treeUuid)
            .inner();

        expect(helper.getCard()).toBe(childCard);
        expect(helper.getCard().attrs).toEqual({ id: 42 });

        // Remapped local: [130 - 125, 10 - 0] = [5, 10]
        const folded = new CardCoordHelper(childCard, [5, 10], treeUuid)
            .fold((card) => ({ id: (card.attrs as { id: number }).id }))
            .get();
        expect(folded).toEqual({ id: 42 });
    });

    it("fold merges across inner", () => {
        const treeUuid = "card-tree-uuid";
        const weekVi = {
            source: { id: "week-place", typeName: "WeekSeg" },
        } as SegVi;
        const hourVi = {
            parent: weekVi,
            clientCoordinate: new PropertyImpl(0),
            displayCoordinate: new PropertyImpl(0),
            source: { id: "hour", typeName: "HourSeg" },
            window: new PropertyImpl(100),
        } as unknown as SegVi;
        const groupVi = {
            clientCoordinate: new PropertyImpl(0),
            displayCoordinate: new PropertyImpl(0),
            source: { id: "group", typeName: "GroupSeg" },
            window: new PropertyImpl(100),
        } as unknown as SegVi;

        const childCard = cardFactory({
            typeName: "LessonCard",
            attrs: { id: 7 },
        });
        const parentCard = cardFactory({
            typeName: "LessonListCard",
            attrs: { list: true },
            nested: eArrayFactory([childCard]),
        });

        let childCardVi: CardVi;
        const parentCardVi = {
            treeUuid,
            source: parentCard,
            viBasis: {
                HORIZONTAL: weekVi,
                VERTICAL: groupVi,
            },
            nested: {
                length: 1,
                at: () => childCardVi,
            },
        } as unknown as CardVi;

        childCardVi = {
            parent: parentCardVi,
            treeUuid,
            horizontal: hourVi,
            vertical: groupVi,
            source: childCard,
            nested: { length: 0, at: () => undefined },
        } as unknown as CardVi;

        parentCard.addWidget(parentCardVi);
        childCard.addWidget(childCardVi);

        const value = parentCard
            .coordHelper([10, 10], treeUuid)
            .fold((card) => ({ fromList: !!(card.attrs as { list?: boolean }).list }))
            .inner()
            .fold((card) => ({ id: (card.attrs as { id: number }).id }))
            .get();

        expect(value).toEqual({ fromList: true, id: 7 });
    });

    it("inner throws when no CardVi exists for treeUuid", () => {
        const parentCard = cardFactory({
            typeName: "LessonListCard",
            nested: eArrayFactory([]),
        });
        expect(() =>
            parentCard.coordHelper([0, 0], "missing").inner(),
        ).toThrow(/no CardVi for treeUuid/);
    });

    it("inner throws when no nested card covers the coordinate", () => {
        const treeUuid = "card-tree-uuid";
        const parentCard = cardFactory({
            typeName: "LessonListCard",
            nested: eArrayFactory([]),
        });
        const parentCardVi = {
            treeUuid,
            source: parentCard,
            viBasis: {
                HORIZONTAL: { source: { id: "h", typeName: "WeekSeg" } },
                VERTICAL: { source: { id: "v", typeName: "GroupListSeg" } },
            },
            nested: {
                length: 0,
                at: () => undefined,
            },
        } as unknown as CardVi;
        parentCard.addWidget(parentCardVi);

        expect(() =>
            parentCard.coordHelper([10, 10], treeUuid).inner(),
        ).toThrow(/no nested card at coord/);
    });
});
