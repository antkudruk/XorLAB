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
import { segFactory } from "../facade/line";
import { cardFactory } from "../facade/card";
import { eArrayFactory } from "../facade/collection";
import { PropertyImpl } from "../collection/property/Property";
import { STYLE_ADAPTERS } from "./SegPropsAdapters";
import { childSegAtCoordFromSeg } from "./CoordHitTest";
import { SegVi, SegViCeiling } from "./segment/SegVi";

function createRootSegVi(source: ISeg) {
    const vi = new SegVi({
        parent: undefined,
        styleSheet: {},
        source,
        cssUpdater: STYLE_ADAPTERS.VERTICAL,
        next: new SegViCeiling(),
        hostAvailableSpace: new PropertyImpl(800),
    });
    source.subscribeVi(vi.treeUuid, vi);
    return vi;
}

describe("SelfPos hit testing", () => {
    it("finds direct child of place seg via childSegAtCoord", () => {
        const hourNested = eArrayFactory([
            segFactory({ typeName: "HourSeg", attrs: { hour: 1 }, style: { window: "50px" } }),
            segFactory({ typeName: "HourSeg", attrs: { hour: 2 }, style: { window: "50px" } }),
        ]);
        const weekdaySeg = segFactory({
            typeName: "WeekdaySeg",
            attrs: { weekday: { order: 1 } },
            nested: hourNested,
            style: { window: "350px" },
        });

        const weekSeg = segFactory({
            typeName: "WeekSeg",
            nested: eArrayFactory([weekdaySeg]),
            style: { window: "auto" },
        });

        const rootVi = createRootSegVi(weekSeg);

        const resolvedHour = weekdaySeg.nested.find((seg) => (seg.attrs as { hour: number }).hour === 2);
        const hitHour = childSegAtCoordFromSeg(weekdaySeg, 55, rootVi.treeUuid);

        expect(hitHour).toBe(resolvedHour);
        expect((hitHour?.attrs as { hour: number }).hour).toBe(2);
    });

    it("finds child-of-child seg along nested weekday and hour chain", () => {
        function hourSeg(hour: number) {
            return segFactory({
                typeName: "HourSeg",
                attrs: { hour },
                style: { window: "50px" },
            });
        }

        function weekdaySeg(order: number) {
            return segFactory({
                typeName: "WeekdaySeg",
                attrs: { weekday: { order } },
                nested: eArrayFactory([
                    hourSeg(1),
                    hourSeg(2),
                    hourSeg(3),
                ]),
                style: { window: "150px" },
            });
        }

        const weekNested = eArrayFactory([
            weekdaySeg(1),
            weekdaySeg(2),
        ]);
        const weekSeg = segFactory({
            typeName: "WeekSeg",
            nested: weekNested,
            style: { window: "auto" },
        });

        const rootVi = createRootSegVi(weekSeg);

        const lesson = { weekday: 2, hour: 3 };
        const lessonCard = cardFactory({
            typeName: "LessonCard",
            attrs: lesson,
            selfPos: {
                WeekSeg: (place: ISeg) => place
                    .nested
                    .find((seg) => (seg.attrs as { weekday: { order: number } }).weekday.order === lesson.weekday)
                    ?.nested
                    ?.find((seg) => (seg.attrs as { hour: number }).hour === lesson.hour)
                    ?? null,
            } as never,
        });

        lessonCard.setBasis({ [weekSeg.id]: weekSeg });

        const resolvedSeg = lessonCard.resolveSelfPosition(weekSeg);
        expect((resolvedSeg?.attrs as { hour: number }).hour).toBe(3);

        const tuesdayWeekday = weekNested.at(1);
        const hourAt110 = childSegAtCoordFromSeg(tuesdayWeekday, 110, rootVi.treeUuid);
        expect((hourAt110?.attrs as { hour: number }).hour).toBe(3);
    });
});
