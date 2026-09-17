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

import type { ISeg } from "../../facade/line";
import { treeSeg, TreeSegAttributes } from "../../basic/tree/TreeSeg";
import { EArray } from "../../collection/EArray";
import { distinctTypeLineCollectionFactory } from "../../facade/collection";
import { segFactory } from "../../facade/line";
import { PropertyImpl } from "../../collection/property/Property";
import { STYLE_ADAPTERS } from "../SegPropsAdapters";
import { SegVi, SegViCeiling } from "./SegVi";

function createRootSegVi(
    source: ISeg,
    cssUpdater = STYLE_ADAPTERS.VERTICAL,
    hostAvailableSpace = new PropertyImpl(800),
) {
    return new SegVi({
        parent: undefined,
        styleSheet: {},
        source,
        cssUpdater,
        next: new SegViCeiling(),
        hostAvailableSpace,
    });
}

function segViFor(root: SegVi, child: ISeg): SegVi {
    const vi = child.getViByUuid(root.treeUuid);
    if (!vi) {
        throw new Error(`Missing SegVi for ${child.typeName}`);
    }
    return vi;
}

describe("SegVi stacked fixed-size children", () => {
    it("positions siblings at cumulative window offsets without orderNumber leak", () => {
        const nested = new EArray<ISeg>();
        const weekSeg = segFactory({
            typeName: "WeekSeg",
            style: { window: "auto" },
            nested,
        });
        const weekVi = createRootSegVi(weekSeg);

        for (let i = 0; i < 7; i++) {
            nested.push(segFactory({
                typeName: "WeekDaySeg",
                style: { window: "50px" },
            }));
        }

        const childVis = nested.map((child) => {
            const vi = child.getViByUuid(weekVi.treeUuid);
            if (!vi) {
                throw new Error(`Missing SegVi for child at index ${nested.indexOf(child)}`);
            }
            return vi;
        });

        expect(childVis.map((vi) => vi.clientCoordinate.value)).toEqual([
            0, 50, 100, 150, 200, 250, 300,
        ]);
        expect(childVis.map((vi) => vi.window.value)).toEqual([
            50, 50, 50, 50, 50, 50, 50,
        ]);
        expect(childVis.map((vi) => vi.orderNumber.value)).toEqual([
            0, 1, 2, 3, 4, 5, 6,
        ]);
        expect(weekVi.client.value).toBe(350);
        expect(weekVi.window.value).toBe(350);
    });

    it("auto WeekSeg horizontal width equals sum of WeekdaySeg widths (timetable)", () => {
        function hourSeg(hour: number) {
            return segFactory({ typeName: "HourSeg", attrs: { hour }, style: { window: "50px" } });
        }

        function weekdaySeg(order: number) {
            return segFactory({
                typeName: "WeekdaySeg",
                attrs: { weekday: { order } },
                nested: new EArray(
                    hourSeg(1), hourSeg(2), hourSeg(3), hourSeg(4),
                    hourSeg(5), hourSeg(6), hourSeg(7),
                ),
            });
        }

        const nested = new EArray(
            weekdaySeg(1), weekdaySeg(2), weekdaySeg(3), weekdaySeg(4), weekdaySeg(5),
        );
        const weekSeg = segFactory({
            typeName: "WeekSeg",
            style: { window: "auto" },
            nested,
        });
        const weekVi = createRootSegVi(weekSeg, STYLE_ADAPTERS.HORIZONTAL);

        const weekdayVis = nested.map((child) => {
            const vi = child.getViByUuid(weekVi.treeUuid);
            if (!vi) {
                throw new Error("Missing WeekdaySeg SegVi");
            }
            return vi;
        });

        expect(weekdayVis.map((vi) => vi.window.value)).toEqual([350, 350, 350, 350, 350]);
        expect(weekVi.window.value).toBe(1750);
        expect(weekVi.client.value).toBe(1750);
    });

    it("100flex sibling shrinks when TreeSeg grows inside 100% parent", () => {
        const hostSize = new PropertyImpl(1000);
        const nested = new EArray<ISeg>();
        const tree = treeSeg({
            nodeSegFactory: () =>
                segFactory({ typeName: "ScrollbarPlaceSeg", style: { window: "30px" } }),
        });
        const scrollable = segFactory({
            typeName: "TimetableHorizontalScrollableSeg",
            style: { window: "100%" },
            nested,
        });
        const rootVi = createRootSegVi(scrollable, STYLE_ADAPTERS.HORIZONTAL, hostSize);
        hostSize.value = 1000;

        nested.push(
            segFactory({ typeName: "TimetableHorizontalSeg", style: { window: "100flex" }, nested: [] }),
            tree,
        );

        const flexVi = segViFor(rootVi, nested.at(0));
        const treeVi = segViFor(rootVi, tree);

        expect(rootVi.window.value).toBe(1000);
        expect(rootVi.fixedPartSize.value).toBe(30);
        expect(rootVi.flexiblePartWidth.value).toBe(970);
        expect(flexVi.window.value).toBe(970);
        expect(treeVi.window.value).toBe(30);
        expect(flexVi.window.value + treeVi.window.value).toBe(1000);

        (tree.attrs as TreeSegAttributes).getNestedLevel();

        expect(rootVi.fixedPartSize.value).toBe(60);
        expect(rootVi.flexiblePartWidth.value).toBe(940);
        expect(flexVi.window.value).toBe(940);
        expect(treeVi.window.value).toBe(60);
        expect(flexVi.window.value + treeVi.window.value).toBe(1000);

        (tree.attrs as TreeSegAttributes).freeNestedLevel();

        expect(rootVi.fixedPartSize.value).toBe(30);
        expect(flexVi.window.value).toBe(970);
        expect(treeVi.window.value).toBe(30);
        expect(flexVi.window.value + treeVi.window.value).toBe(1000);
    });

    it("100flex sizing works when nested children are constructor-initialized", () => {
        const hostSize = new PropertyImpl(1000);
        const tree = treeSeg({
            nodeSegFactory: () =>
                segFactory({ typeName: "ScrollbarPlaceSeg", style: { window: "30px" } }),
        });
        const scrollable = segFactory({
            typeName: "TimetableHorizontalScrollableSeg",
            style: { window: "100%" },
            nested: distinctTypeLineCollectionFactory([
                segFactory({ typeName: "TimetableHorizontalSeg", style: { window: "100flex" }, nested: [] }),
                tree,
            ]),
        });
        const rootVi = createRootSegVi(scrollable, STYLE_ADAPTERS.HORIZONTAL, hostSize);
        hostSize.value = 1000;

        const flexVi = segViFor(rootVi, scrollable.nested.at(0));
        const treeVi = segViFor(rootVi, tree);

        expect(rootVi.fixedPartSize.value).toBe(30);
        expect(flexVi.window.value + treeVi.window.value).toBe(1000);

        (tree.attrs as TreeSegAttributes).getNestedLevel();

        expect(rootVi.fixedPartSize.value).toBe(60);
        expect(flexVi.window.value + treeVi.window.value).toBe(1000);
    });

    it("backward TreeSeg shrinks after freeNestedLevel inside 100% parent", () => {
        const hostSize = new PropertyImpl(1000);
        const tree = treeSeg({
            order: "backward",
            nodeSegFactory: () =>
                segFactory({ typeName: "ScrollbarPlaceSeg", style: { window: "30px" } }),
        });
        const scrollable = segFactory({
            typeName: "TimetableHorizontalScrollableSeg",
            style: { window: "100%" },
            nested: distinctTypeLineCollectionFactory([
                segFactory({ typeName: "TimetableHorizontalSeg", style: { window: "100flex" }, nested: [] }),
                tree,
            ]),
        });
        const rootVi = createRootSegVi(scrollable, STYLE_ADAPTERS.HORIZONTAL, hostSize);
        hostSize.value = 1000;

        const flexVi = segViFor(rootVi, scrollable.nested.at(0));
        const treeVi = segViFor(rootVi, tree);

        expect(treeVi.window.value).toBe(30);

        (tree.attrs as TreeSegAttributes).getNestedLevel();

        expect(tree.nested.length).toBe(2);

        (tree.attrs as TreeSegAttributes).freeNestedLevel();

        expect(tree.nested.length).toBe(1);
        expect(treeVi.window.value).toBe(30);
        expect(flexVi.window.value).toBe(970);
    });
});

describe("rem residual sizing", () => {
    it("100rem takes leftover after fixed and flex siblings", () => {
        const hostSize = new PropertyImpl(1000);
        const nested = new EArray<ISeg>();
        const parent = segFactory({
            typeName: "RemParentSeg",
            style: { window: "100%" },
            nested,
        });
        const rootVi = createRootSegVi(parent, STYLE_ADAPTERS.VERTICAL, hostSize);

        nested.push(
            segFactory({ typeName: "FixedSeg", style: { window: "100px" } }),
            segFactory({ typeName: "FlexSeg", style: { window: "50flex" } }),
            segFactory({ typeName: "RemSeg", style: { window: "100rem" } }),
        );

        const fixedVi = segViFor(rootVi, nested.at(0));
        const flexVi = segViFor(rootVi, nested.at(1));
        const remVi = segViFor(rootVi, nested.at(2));

        expect(rootVi.window.value).toBe(1000);
        expect(rootVi.fixedPartSize.value).toBe(100);
        expect(rootVi.flexPartSize.value).toBe(450);
        expect(rootVi.remPartWidth.value).toBe(450);
        expect(fixedVi.window.value).toBe(100);
        expect(flexVi.window.value).toBe(450);
        expect(remVi.window.value).toBe(450);
        expect(fixedVi.window.value + flexVi.window.value + remVi.window.value).toBe(1000);
    });

    it("bare rem equals 100rem", () => {
        const hostSize = new PropertyImpl(1000);
        const nested = new EArray<ISeg>();
        const parent = segFactory({
            typeName: "RemParentSeg",
            style: { window: "100%" },
            nested,
        });
        const rootVi = createRootSegVi(parent, STYLE_ADAPTERS.VERTICAL, hostSize);

        nested.push(
            segFactory({ typeName: "FixedSeg", style: { window: "200px" } }),
            segFactory({ typeName: "RemSeg", style: { window: "rem" } }),
        );

        const remVi = segViFor(rootVi, nested.at(1));
        expect(rootVi.remPartWidth.value).toBe(800);
        expect(remVi.window.value).toBe(800);
    });

    it("two rem siblings share the rem pool by weight", () => {
        const hostSize = new PropertyImpl(1000);
        const nested = new EArray<ISeg>();
        const parent = segFactory({
            typeName: "RemParentSeg",
            style: { window: "100%" },
            nested,
        });
        const rootVi = createRootSegVi(parent, STYLE_ADAPTERS.VERTICAL, hostSize);

        nested.push(
            segFactory({ typeName: "FixedSeg", style: { window: "100px" } }),
            segFactory({ typeName: "RemASeg", style: { window: "50rem" } }),
            segFactory({ typeName: "RemBSeg", style: { window: "50rem" } }),
        );

        const remA = segViFor(rootVi, nested.at(1));
        const remB = segViFor(rootVi, nested.at(2));

        expect(rootVi.remPartWidth.value).toBe(900);
        expect(remA.window.value).toBe(450);
        expect(remB.window.value).toBe(450);
    });

    it("rem with only fixed siblings uses window minus fixed", () => {
        const hostSize = new PropertyImpl(800);
        const nested = new EArray<ISeg>();
        const parent = segFactory({
            typeName: "RemParentSeg",
            style: { window: "100%" },
            nested,
        });
        const rootVi = createRootSegVi(parent, STYLE_ADAPTERS.VERTICAL, hostSize);

        nested.push(
            segFactory({ typeName: "FixedSeg", style: { window: "50px" } }),
            segFactory({ typeName: "RemSeg", style: { window: "100rem" } }),
        );

        const remVi = segViFor(rootVi, nested.at(1));
        expect(rootVi.flexPartSize.value).toBe(0);
        expect(rootVi.remPartWidth.value).toBe(750);
        expect(remVi.window.value).toBe(750);
    });

    it("100flex leaves no rem pool for 100rem sibling", () => {
        const hostSize = new PropertyImpl(1000);
        const nested = new EArray<ISeg>();
        const parent = segFactory({
            typeName: "RemParentSeg",
            style: { window: "100%" },
            nested,
        });
        const rootVi = createRootSegVi(parent, STYLE_ADAPTERS.VERTICAL, hostSize);

        nested.push(
            segFactory({ typeName: "FlexSeg", style: { window: "100flex" } }),
            segFactory({ typeName: "RemSeg", style: { window: "100rem" } }),
        );

        const flexVi = segViFor(rootVi, nested.at(0));
        const remVi = segViFor(rootVi, nested.at(1));

        expect(flexVi.window.value).toBe(1000);
        expect(rootVi.flexPartSize.value).toBe(1000);
        expect(rootVi.remPartWidth.value).toBe(0);
        expect(remVi.window.value).toBe(0);
    });
});

function createAutoParentWithNested() {
    const nested = new EArray<ISeg>();
    const parentSeg = segFactory({
        typeName: "AutoParentSeg",
        style: { window: "auto" },
        nested,
    });
    const parentVi = createRootSegVi(parentSeg, STYLE_ADAPTERS.HORIZONTAL);
    return { nested, parentSeg, parentVi };
}

function fixedChild(widthPx: number) {
    return segFactory({ style: { window: `${widthPx}px` } });
}

describe("auto segment sizing on child removal", () => {
    it("shrinks window and client when the last child is removed", () => {
        const { nested, parentVi } = createAutoParentWithNested();

        nested.push(fixedChild(100), fixedChild(200));

        expect(nested.length).toBe(2);
        expect(parentVi.window.value).toBe(300);
        expect(parentVi.client.value).toBe(300);

        nested.splice(1, 1);

        expect(nested.length).toBe(1);
        expect(parentVi.window.value).toBe(100);
        expect(parentVi.client.value).toBe(100);
    });

    it("shrinks window and client when the first child is removed", () => {
        const { nested, parentVi } = createAutoParentWithNested();

        nested.push(fixedChild(100));
        nested.insert(0, [fixedChild(200)]);

        expect(nested.length).toBe(2);
        expect(parentVi.window.value).toBe(300);
        expect(parentVi.client.value).toBe(300);

        nested.splice(0, 1);

        expect(nested.length).toBe(1);
        expect(parentVi.window.value).toBe(100);
        expect(parentVi.client.value).toBe(100);
    });
});

describe("flexible auto equal-split sizing", () => {
    it("splits parent flex space equally among auto children with flex nested content", () => {
        const hostSize = new PropertyImpl(400);
        const weeks = [0, 1, 2, 3].map(() =>
            segFactory({
                typeName: "WeekSeg",
                style: { window: "100flex" },
                nested: [],
            }),
        );
        const rows = new EArray(
            ...[0, 1, 2, 3].map((row) =>
                segFactory({
                    typeName: "MonthRowSeg",
                    attrs: { row },
                    style: { window: "auto" },
                    nested: [weeks[row]],
                }),
            ),
        );
        const list = segFactory({
            typeName: "MonthRowListSeg",
            style: { window: "100%" },
            nested: rows,
        });
        const rootVi = createRootSegVi(list, STYLE_ADAPTERS.VERTICAL, hostSize);

        expect(rootVi.window.value).toBe(400);
        expect(rootVi.countFlexibleChildren.value).toBe(4);
        expect(rootVi.flexiblePartWidth.value).toBe(400);

        const rowVis = rows.map((row) => segViFor(rootVi, row));
        expect(rowVis.map((vi) => vi.window.value)).toEqual([100, 100, 100, 100]);
        expect(rowVis.every((vi) => vi.flexible.value)).toBe(true);

        const weekVis = weeks.map((week) => segViFor(rootVi, week));
        expect(weekVis.map((vi) => vi.window.value)).toEqual([100, 100, 100, 100]);
    });

    it("calendar-shaped auto row with fixed header and 100flex week does not overflow", () => {
        const hostSize = new PropertyImpl(400);
        const rows = new EArray(
            ...[0, 1, 2, 3].map((row) =>
                segFactory({
                    typeName: "MonthRowSeg",
                    attrs: { row },
                    style: { window: "auto" },
                    nested: [
                        segFactory({
                            typeName: "MonthHeaderPlaceSeg",
                            style: { window: "28px" },
                        }),
                        segFactory({
                            typeName: "WeekSeg",
                            style: { window: "100flex" },
                            nested: [],
                        }),
                    ],
                }),
            ),
        );
        const list = segFactory({
            typeName: "MonthRowListSeg",
            style: { window: "100%" },
            nested: rows,
        });
        const rootVi = createRootSegVi(list, STYLE_ADAPTERS.VERTICAL, hostSize);

        const rowVis = rows.map((row) => segViFor(rootVi, row));
        expect(rowVis.map((vi) => vi.window.value)).toEqual([100, 100, 100, 100]);

        for (let i = 0; i < rows.length; i++) {
            const row = rows.at(i);
            const rowVi = segViFor(rootVi, row);
            const headerVi = segViFor(rootVi, row.nested.at(0));
            const weekVi = segViFor(rootVi, row.nested.at(1));
            expect(headerVi.window.value).toBe(28);
            expect(weekVi.window.value).toBe(72);
            expect(rowVi.fixedPartSize.value).toBe(28);
            expect(headerVi.window.value + weekVi.window.value).toBe(rowVi.window.value);
        }
    });
});

describe("SegVi directional windowH / windowV", () => {
    const labelStyleSheet = {
        LabelPlaceSeg: { windowH: "100px" as const, windowV: "15px" as const, window: "20px" as const },
    };

    function createLabelPlaceVi(cssUpdater: typeof STYLE_ADAPTERS.HORIZONTAL) {
        const source = segFactory({ typeName: "LabelPlaceSeg" });
        return new SegVi({
            parent: undefined,
            styleSheet: labelStyleSheet,
            source,
            cssUpdater,
            next: new SegViCeiling(),
            hostAvailableSpace: new PropertyImpl(800),
        });
    }

    it("uses windowH when rendered horizontally", () => {
        const vi = createLabelPlaceVi(STYLE_ADAPTERS.HORIZONTAL);
        expect(vi.windowStyle.value).toBe("100px");
        expect(vi.window.value).toBe(100);
    });

    it("uses windowV when rendered vertically", () => {
        const vi = createLabelPlaceVi(STYLE_ADAPTERS.VERTICAL);
        expect(vi.windowStyle.value).toBe("15px");
        expect(vi.window.value).toBe(15);
    });

    it("falls back to window when directional sizes are unset", () => {
        const source = segFactory({ typeName: "PoissonSeg" });
        const vi = new SegVi({
            parent: undefined,
            styleSheet: { PoissonSeg: { window: "72px" } },
            source,
            cssUpdater: STYLE_ADAPTERS.HORIZONTAL,
            next: new SegViCeiling(),
            hostAvailableSpace: new PropertyImpl(800),
        });
        expect(vi.windowStyle.value).toBe("72px");
        expect(vi.window.value).toBe(72);
    });
});
