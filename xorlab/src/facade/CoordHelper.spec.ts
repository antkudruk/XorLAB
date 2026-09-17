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

import type { ISeg } from "./line";
import { EArray } from "../collection/EArray";
import { eArrayFactory } from "./collection";
import { segFactory } from "./line";
import { PropertyImpl } from "../collection/property/Property";
import { STYLE_ADAPTERS } from "../renderer/SegPropsAdapters";
import { SegVi, SegViCeiling } from "../renderer/segment/SegVi";

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

describe("CoordHelper", () => {
    it("inner descends to nested seg and remaps local coord", () => {
        const nested = new EArray<ISeg>();
        const weekSeg = segFactory({
            typeName: "WeekSeg",
            nested,
        });
        const parentVi = createRootSegVi(weekSeg);

        for (let i = 0; i < 3; i++) {
            nested.push(segFactory({
                typeName: "HourSeg",
                attrs: { hour: i + 1 },
                style: { window: "50px" },
            }));
        }

        const second = nested.at(1);
        const helper = weekSeg
            .coordHelper(75, parentVi.treeUuid)
            .inner();

        expect(helper.getSeg()).toBe(second);
        expect(helper.getSeg().attrs).toEqual({ hour: 2 });

        // 75 is 25px into the second 50px child
        const peeked: number[] = [];
        helper.peek((hourSeg) => {
            peeked.push((hourSeg.attrs as { hour: number }).hour);
        });
        expect(peeked).toEqual([2]);
    });

    it("peek returns the same helper for chaining", () => {
        const nested = new EArray<ISeg>();
        const weekSeg = segFactory({ typeName: "WeekSeg", nested });
        const parentVi = createRootSegVi(weekSeg);
        nested.push(segFactory({ typeName: "HourSeg", style: { window: "50px" } }));

        const start = weekSeg.coordHelper(10, parentVi.treeUuid);
        const afterPeek = start.peek(() => undefined);
        expect(afterPeek).toBe(start);
        expect(afterPeek.inner().getSeg().typeName).toBe("HourSeg");
    });

    it("fold builds a typed accumulator across nested levels", () => {
        const weekdaySeg = segFactory({
            typeName: "WeekdaySeg",
            nested: eArrayFactory([
                segFactory({
                    typeName: "HourSeg",
                    attrs: { hour: 7 },
                    style: { window: "50px" },
                }),
                segFactory({
                    typeName: "HourSeg",
                    attrs: { hour: 8 },
                    style: { window: "50px" },
                }),
            ]),
            attrs: { weekday: { number: 3 } },
            style: { window: "100px" },
        });
        const weekSeg = segFactory({
            typeName: "WeekSeg",
            nested: eArrayFactory([weekdaySeg]),
        });
        const parentVi = createRootSegVi(weekSeg);

        // Week local 60 → weekday (0–100), then hour local 60 → second hour (50–100)
        const placeValue = weekSeg
            .coordHelper(60, parentVi.treeUuid)
            .inner()
            .fold((wd) => ({ weekDay: (wd.attrs as { weekday: { number: number } }).weekday.number }))
            .inner()
            .fold((hour) => ({ hour: (hour.attrs as { hour: number }).hour }))
            .get();

        expect(placeValue).toEqual({ weekDay: 3, hour: 8 });
    });

    it("inner throws when no Vi exists for treeUuid", () => {
        const weekSeg = segFactory({
            typeName: "WeekSeg",
            nested: new EArray<ISeg>(),
        });
        expect(() =>
            weekSeg.coordHelper(0, "missing-uuid").inner(),
        ).toThrow(/no SegVi for treeUuid/);
    });

    it("inner throws when no nested segment covers the coordinate", () => {
        const nested = new EArray<ISeg>();
        const weekSeg = segFactory({ typeName: "WeekSeg", nested });
        const parentVi = createRootSegVi(weekSeg);
        nested.push(segFactory({ typeName: "HourSeg", style: { window: "50px" } }));

        expect(() =>
            weekSeg.coordHelper(200, parentVi.treeUuid).inner(),
        ).toThrow(/no nested segment at coord/);
    });

    it("inner stays on the same child when parent scrollOffset changes (client coords)", () => {
        const nested = new EArray<ISeg>();
        const weekSeg = segFactory({ typeName: "WeekSeg", nested });
        const parentVi = createRootSegVi(weekSeg);
        nested.push(segFactory({ typeName: "HourSeg", attrs: { hour: 1 }, style: { window: "50px" } }));
        nested.push(segFactory({ typeName: "HourSeg", attrs: { hour: 2 }, style: { window: "50px" } }));

        parentVi.scrollOffset.value = 0;
        const before = weekSeg.coordHelper(60, parentVi.treeUuid).inner().getSeg();

        parentVi.scrollOffset.value = 30;
        // Client 60 still hits hour 2; display 60 would incorrectly hit hour 1 after scroll.
        const after = weekSeg.coordHelper(60, parentVi.treeUuid).inner().getSeg();

        expect(before).toBe(after);
        expect(after.attrs).toEqual({ hour: 2 });
    });
});
