/*
 * Collapse/expand scrollbar: scrollOffset must persist on model and DOM.
 * Dual collapse: collapsing both TeacherListSeg and GroupListSeg releases nested TreeSeg.
 */
import { JSDOM } from "jsdom";
import { Widget, ScalarElementMetaFactory } from "../../index";
import {
    cardFactory,
    distinctTypeLineCollectionFactory,
    eArrayFactory,
    eMappedFactory,
    segFactory,
} from "../../facade";
import { scrollableSystemFactory } from "../../facade/scrollable";
import { TREE_SEG_TYPE_NAME } from "./TreeSeg";

function ensureDom(): void {
    if (typeof global.document !== "undefined") {
        return;
    }
    const dom = new JSDOM("<!DOCTYPE html><html><body></body></html>", {
        pretendToBeVisual: true,
        url: "http://localhost/",
    });
    (global as unknown as { document: Document }).document = dom.window.document;
    (global as unknown as { window: Window }).window = dom.window as unknown as Window;
    (global as unknown as { HTMLElement: typeof HTMLElement }).HTMLElement = dom.window.HTMLElement;
    (global as unknown as { ResizeObserver: unknown }).ResizeObserver = class {
        observe() {}
        unobserve() {}
        disconnect() {}
    };
}

function createTeacherHeavyScrollable() {
    const teacherListSeg = segFactory({
        typeName: "TeacherListSeg",
        nested: eMappedFactory(
            eArrayFactory(Array.from({ length: 15 }, (_, i) => ({ id: i }))),
            (item) =>
                segFactory({
                    typeName: "TeacherSeg",
                    attrs: item,
                    style: { window: "60px" },
                }),
        ),
        style: { window: "100rem" },
    });
    const groupListSeg = segFactory({
        typeName: "GroupListSeg",
        nested: eMappedFactory(
            eArrayFactory(Array.from({ length: 5 }, (_, i) => ({ id: i }))),
            (item) =>
                segFactory({
                    typeName: "GroupSeg",
                    attrs: item,
                    style: { window: "60px" },
                }),
        ),
        style: { window: "30flex" },
    });
    const timePlaceSeg = segFactory({
        typeName: "TimePlaceSeg",
        style: { window: "40px" },
    });

    return {
        teacherListSeg,
        groupListSeg,
        system: scrollableSystemFactory({
            verticalContentSeg: segFactory({
                typeName: "TimetableVerticalSeg",
                nested: distinctTypeLineCollectionFactory([
                    timePlaceSeg,
                    groupListSeg,
                    teacherListSeg,
                ]),
                style: { window: "100flex" },
            }),
            horizontalContentSeg: segFactory({
                typeName: "TimetableHorizontalSeg",
                nested: distinctTypeLineCollectionFactory([
                    segFactory({
                        typeName: "TeacherColumnsSeg",
                        style: { window: "250px" },
                    }),
                    segFactory({
                        typeName: "WeekSeg",
                        style: { window: "100flex" },
                    }),
                ]),
                style: { window: "100flex" },
            }),
            widgetCard: cardFactory({
                typeName: "TimetableWidgetCard",
                nested: eArrayFactory([]),
            }),
            scrollbarWidth: "16px",
        }),
    };
}

function styleSheet() {
    return {
        GroupListSeg: { window: "30flex" as const },
        TeacherListSeg: { window: "100rem" as const },
        TeacherSeg: { window: "60px" as const },
        GroupSeg: { window: "60px" as const },
        TimePlaceSeg: { window: "40px" as const },
        TeacherColumnsSeg: { window: "250px" as const },
        WeekSeg: { window: "100flex" as const },
        TimetableHorizontalSeg: { window: "100flex" as const },
        TimetableVerticalSeg: { window: "100flex" as const },
    };
}

function readTeacherScrollbarDom(host: HTMLElement): {
    count: number;
    scrollTop: number | null;
} {
    const els = Array.from(host.querySelectorAll(".ScrollbarWidgetCard.TeacherListSeg"));
    if (els.length === 0) {
        return { count: 0, scrollTop: null };
    }
    const scrollEl = els[0].querySelector("div") as HTMLElement | null;
    return {
        count: els.length,
        scrollTop: scrollEl ? scrollEl.scrollTop : null,
    };
}

/** Horizontal host TreeSeg owns nested levels for vertical scrollbars (Teacher/Group). */
function getVerticalScrollbarTreeSeg(system: ReturnType<typeof createTeacherHeavyScrollable>["system"]) {
    const nested = system.horizontal.nested;
    for (let i = 0; i < nested.length; i++) {
        const item = nested.at(i);
        if (item.typeName === TREE_SEG_TYPE_NAME) {
            return item;
        }
    }
    throw new Error("Missing horizontal TreeSeg");
}

describe("TeacherListSeg collapse scrollbar", () => {
    beforeAll(() => {
        ensureDom();
    });


    test("scrollOffset persists on model and DOM after collapse then expand", () => {
        const host = document.createElement("div");
        Object.defineProperty(host, "clientWidth", { configurable: true, value: 900 });
        Object.defineProperty(host, "clientHeight", { configurable: true, value: 600 });
        document.body.appendChild(host);

        const { teacherListSeg, system } = createTeacherHeavyScrollable();
        const widget = new Widget({
            htmlElement: host,
            styleSheet: styleSheet(),
            elementMetaFactory: ScalarElementMetaFactory,
            vertical: system.vertical,
            horizontal: system.horizontal,
            card: system.card,
        });

        const vUuid = widget.treeUuids.vertical;
        const teacherListVi = teacherListSeg.getViByUuid(vUuid)!;
        const savedOffset = 120;
        teacherListVi.scrollOffset.value = savedOffset;

        teacherListVi.collapse();
        expect(teacherListVi.scrollOffset.value).toBe(savedOffset);

        teacherListVi.expand();
        expect(teacherListVi.scrollOffset.value).toBe(savedOffset);

        const afterExpand = readTeacherScrollbarDom(host);
        expect(afterExpand.count).toBe(1);
        expect(afterExpand.scrollTop).toBe(savedOffset);

        widget.destroy();
    });

    test("collapsing both TeacherListSeg and GroupListSeg releases nested TreeSeg level", () => {
        const host = document.createElement("div");
        Object.defineProperty(host, "clientWidth", { configurable: true, value: 900 });
        Object.defineProperty(host, "clientHeight", { configurable: true, value: 600 });
        document.body.appendChild(host);

        const { teacherListSeg, groupListSeg, system } = createTeacherHeavyScrollable();
        const widget = new Widget({
            htmlElement: host,
            styleSheet: styleSheet(),
            elementMetaFactory: ScalarElementMetaFactory,
            vertical: system.vertical,
            horizontal: system.horizontal,
            card: system.card,
        });

        const vUuid = widget.treeUuids.vertical;
        const teacherListVi = teacherListSeg.getViByUuid(vUuid)!;
        const groupListVi = groupListSeg.getViByUuid(vUuid)!;
        const treeSeg = getVerticalScrollbarTreeSeg(system);

        expect(teacherListVi.window.value).toBeGreaterThan(0);
        expect(teacherListVi.window.value).toBeLessThan(teacherListVi.client.value);
        expect(groupListVi.window.value).toBeGreaterThan(0);
        expect(groupListVi.window.value).toBeLessThan(groupListVi.client.value);
        expect(treeSeg.nested.length).toBe(1);

        teacherListVi.collapse();
        groupListVi.collapse();

        expect(teacherListVi.window.value).toBe(0);
        expect(groupListVi.window.value).toBe(0);
        expect(treeSeg.nested.length).toBe(1);
        expect(treeSeg.nested.at(0).typeName).toBe("ScrollbarPlaceSeg");

        widget.destroy();
    });

    test("collapse Group then Teacher then expand Teacher keeps a single TeacherListSeg scrollbar", () => {
        const host = document.createElement("div");
        Object.defineProperty(host, "clientWidth", { configurable: true, value: 900 });
        Object.defineProperty(host, "clientHeight", { configurable: true, value: 600 });
        document.body.appendChild(host);

        const { teacherListSeg, groupListSeg, system } = createTeacherHeavyScrollable();
        const widget = new Widget({
            htmlElement: host,
            styleSheet: styleSheet(),
            elementMetaFactory: ScalarElementMetaFactory,
            vertical: system.vertical,
            horizontal: system.horizontal,
            card: system.card,
        });

        const vUuid = widget.treeUuids.vertical;
        const teacherListVi = teacherListSeg.getViByUuid(vUuid)!;
        const groupListVi = groupListSeg.getViByUuid(vUuid)!;

        const countTeacherScrollbars = () =>
            host.querySelectorAll(".ScrollbarWidgetCard.TeacherListSeg").length;

        expect(countTeacherScrollbars()).toBe(1);

        groupListVi.collapse();
        teacherListVi.collapse();
        expect(countTeacherScrollbars()).toBe(0);

        teacherListVi.expand();
        expect(countTeacherScrollbars()).toBe(1);
        expect(teacherListVi.collapsed.value).toBe(false);

        groupListVi.expand();
        expect(countTeacherScrollbars()).toBe(1);

        widget.destroy();
    });

    function countEmptyTreeSegAxisShellsInDom(root: ParentNode): number {
        return Array.from(root.querySelectorAll("div")).filter((el) => {
            const classes = el.className.split(/\s+/);
            if (!classes.includes("TreeSeg")) {
                return false;
            }
            if (
                !classes.includes("TeacherListSeg")
                && !classes.includes("GroupListSeg")
                && !classes.includes("WeekdaySeg")
            ) {
                return false;
            }
            // Painted main for scrollbars is ScrollbarWidgetCard; empty shells have none.
            if (classes.includes("ScrollbarWidgetCard")) {
                return false;
            }
            return el.querySelector(".ScrollbarWidgetCard") === null;
        }).length;
    }

    test("empty tree-card shells without a painted main card are not in the DOM", () => {
        const host = document.createElement("div");
        Object.defineProperty(host, "clientWidth", { configurable: true, value: 900 });
        Object.defineProperty(host, "clientHeight", { configurable: true, value: 600 });
        document.body.appendChild(host);

        const { system } = createTeacherHeavyScrollable();
        const widget = new Widget({
            htmlElement: host,
            styleSheet: styleSheet(),
            elementMetaFactory: ScalarElementMetaFactory,
            vertical: system.vertical,
            horizontal: system.horizontal,
            card: system.card,
        });

        expect(countEmptyTreeSegAxisShellsInDom(host)).toBe(0);
        expect(host.querySelectorAll(".ScrollbarWidgetCard.TeacherListSeg").length).toBe(1);

        widget.destroy();
    });

    test("WeekSeg scroll host keeps host TreeSeg shallow and hides empty tree-card shells", () => {
        const host = document.createElement("div");
        Object.defineProperty(host, "clientWidth", { configurable: true, value: 900 });
        Object.defineProperty(host, "clientHeight", { configurable: true, value: 600 });
        document.body.appendChild(host);

        const weekSeg = segFactory({
            typeName: "WeekSeg",
            nested: eArrayFactory(
                Array.from({ length: 5 }, (_, i) =>
                    segFactory({
                        typeName: "WeekdaySeg",
                        attrs: { weekday: { order: i + 1, name: `Day${i + 1}` } },
                        nested: eMappedFactory(
                            eArrayFactory(Array.from({ length: 7 }, (_, h) => ({ hour: h + 1 }))),
                            (item) =>
                                segFactory({
                                    typeName: "HourSeg",
                                    attrs: item,
                                    style: { window: "120px" },
                                }),
                        ),
                        style: { window: "840px" },
                    }),
                ),
            ),
            style: { window: "4200px" },
        });

        const system = scrollableSystemFactory({
            verticalContentSeg: segFactory({
                typeName: "TimetableVerticalSeg",
                nested: distinctTypeLineCollectionFactory([
                    segFactory({ typeName: "TimePlaceSeg", style: { window: "40px" } }),
                ]),
                style: { window: "100flex" },
            }),
            horizontalContentSeg: segFactory({
                typeName: "TimetableHorizontalSeg",
                nested: distinctTypeLineCollectionFactory([
                    segFactory({ typeName: "TeacherColumnsSeg", style: { window: "250px" } }),
                    weekSeg,
                ]),
                style: { window: "100flex" },
            }),
            widgetCard: cardFactory({
                typeName: "TimetableWidgetCard",
                nested: eArrayFactory([]),
            }),
            scrollbarWidth: "16px",
        });

        const widget = new Widget({
            htmlElement: host,
            styleSheet: styleSheet(),
            elementMetaFactory: ScalarElementMetaFactory,
            vertical: system.vertical,
            horizontal: system.horizontal,
            card: system.card,
        });

        const hTreeSeg = getVerticalScrollbarTreeSeg(system);
        expect(hTreeSeg.nested.length).toBe(1);

        expect(countEmptyTreeSegAxisShellsInDom(host)).toBe(0);

        widget.destroy();
    });

    test("MonthRowListSeg overflow still discovers nested WeekSeg scrollbars", () => {
        const host = document.createElement("div");
        Object.defineProperty(host, "clientWidth", { configurable: true, value: 900 });
        Object.defineProperty(host, "clientHeight", { configurable: true, value: 400 });
        document.body.appendChild(host);

        const monthRowListSeg = segFactory({
            typeName: "MonthRowListSeg",
            nested: eArrayFactory(
                Array.from({ length: 4 }, (_, row) =>
                    segFactory({
                        typeName: "MonthRowSeg",
                        attrs: { row },
                        nested: distinctTypeLineCollectionFactory([
                            segFactory({
                                typeName: "MonthHeaderPlaceSeg",
                                style: { window: "28px" },
                            }),
                            segFactory({
                                typeName: "WeekSeg",
                                nested: eArrayFactory(
                                    Array.from({ length: 7 }, (_, i) =>
                                        segFactory({
                                            typeName: "WeekDaySeg",
                                            attrs: { order: i },
                                            style: { window: "25px" },
                                        }),
                                    ),
                                ),
                                style: { window: "160px" },
                            }),
                        ]),
                        style: { window: "auto" },
                    }),
                ),
            ),
            style: { window: "100flex" },
        });

        const system = scrollableSystemFactory({
            verticalContentSeg: monthRowListSeg,
            horizontalContentSeg: segFactory({
                typeName: "MonthColListSeg",
                nested: eArrayFactory(
                    Array.from({ length: 3 }, (_, col) =>
                        segFactory({
                            typeName: "MonthColSeg",
                            attrs: { col },
                            nested: eArrayFactory(
                                Array.from({ length: 6 }, (_, week) =>
                                    segFactory({
                                        typeName: "WeekNumberInMonthSeg",
                                        attrs: { week },
                                        style: { window: "25px" },
                                    }),
                                ),
                            ),
                            style: { window: "auto" },
                        }),
                    ),
                ),
                style: { window: "100flex" },
            }),
            widgetCard: cardFactory({
                typeName: "YearCard",
                nested: eArrayFactory([]),
            }),
            scrollbarWidth: "16px",
        });

        const widget = new Widget({
            htmlElement: host,
            styleSheet: {
                MonthRowListSeg: { window: "100flex" as const },
                MonthColListSeg: { window: "100flex" as const },
                MonthRowSeg: { window: "auto" as const },
                MonthColSeg: { window: "auto" as const },
                MonthHeaderPlaceSeg: { window: "28px" as const },
                WeekSeg: { window: "160px" as const },
                WeekDaySeg: { window: "25px" as const },
                WeekNumberInMonthSeg: { window: "25px" as const },
            },
            elementMetaFactory: ScalarElementMetaFactory,
            vertical: system.vertical,
            horizontal: system.horizontal,
            card: system.card,
        });

        expect(host.querySelectorAll(".ScrollbarWidgetCard.MonthRowListSeg").length).toBe(1);
        expect(host.querySelectorAll(".ScrollbarWidgetCard.WeekSeg").length).toBeGreaterThanOrEqual(3);

        widget.destroy();
    });
});
