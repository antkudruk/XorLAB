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

import type { ICard, ISeg } from "../facade";
import { cardFactory, segFactory } from "../facade";
import { distinctTypeLineCollectionFactory, eArrayFactory } from "../facade/collection";
import { scrollableSystemFactory } from "../facade/scrollable";
import { JSDOM } from "jsdom";
import { ScalarElementMetaFactory } from "./ElementFactory";
import { Widget } from "./Widget";
import type { MouseInteractionEvent } from "./MouseInteraction";
import { findDeepestCardVi } from "./CoordHitTest";

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

describe("MouseInteraction", () => {
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

  function mockBoundingRect() {
    container.getBoundingClientRect = () => ({
      left: 0,
      top: 0,
      width: 400,
      height: 300,
      right: 400,
      bottom: 300,
      x: 0,
      y: 0,
      toJSON: () => ({}),
    });
  }

  it("dispatches mouseOver on card with coordinate fields and pair local coord", () => {
    const events: MouseInteractionEvent[] = [];
    const vertical = segFactory({
      typeName: "TimetableVerticalSeg",
      style: { window: "200px" },
    });
    const horizontal = segFactory({
      typeName: "TimetableHorizontalSeg",
      style: { window: "300px" },
    });
    const card = cardFactory({
      typeName: "LessonListCard",
      nested: eArrayFactory<ICard[]>([]),
      mouseOver: (event) => {
        events.push(event);
      },
    });

    const widget = new Widget({
      htmlElement: container,
      styleSheet: {},
      elementMetaFactory: ScalarElementMetaFactory,
      vertical,
      horizontal,
      card,
    });

    mockBoundingRect();

    container.dispatchEvent(new MouseEvent("mousemove", {
      clientX: 50,
      clientY: 60,
      bubbles: true,
    }));

    expect(events.length).toBeGreaterThan(0);
    const event = events[0];
    expect(event.absolute).toEqual({ x: expect.any(Number), y: expect.any(Number) });
    expect(event.viewport).toEqual({ x: 50, y: 60 });
    expect(event.widget).toEqual([50, 60]);
    expect(Array.isArray(event.local)).toBe(true);
    expect(event.treeUuid).toBe(widget.rootCardVi.treeUuid);
    expect(event.widgetTreeUuids).toEqual({
      vertical: widget.rootCardVi.viBasis.VERTICAL.treeUuid,
      horizontal: widget.rootCardVi.viBasis.HORIZONTAL.treeUuid,
      card: widget.rootCardVi.treeUuid,
    });
    expect(event.treeUuid).toBe(event.widgetTreeUuids.card);

    widget.destroy();
  });

  it("dispatches mouseClick on seg with scalar local coord", () => {
    const segEvents: Array<{
      local: number | readonly [number, number];
      treeUuid: string;
      widgetTreeUuids: MouseInteractionEvent["widgetTreeUuids"];
    }> = [];
    const nested = eArrayFactory<ISeg[]>([
      segFactory({
        typeName: "HourSeg",
        style: { window: "50px" },
        mouseClick: (event) => {
          segEvents.push({
            local: event.local,
            treeUuid: event.treeUuid,
            widgetTreeUuids: event.widgetTreeUuids,
          });
        },
      }),
    ]);

    const vertical = segFactory({
      typeName: "TimetableVerticalSeg",
      nested,
      style: { window: "200px" },
    });
    const horizontal = segFactory({
      typeName: "TimetableHorizontalSeg",
      style: { window: "300px" },
    });
    const card = cardFactory({
      typeName: "LessonListCard",
    });

    const widget = new Widget({
      htmlElement: container,
      styleSheet: {},
      elementMetaFactory: ScalarElementMetaFactory,
      vertical,
      horizontal,
      card,
    });

    mockBoundingRect();

    container.dispatchEvent(new MouseEvent("click", {
      clientX: 10,
      clientY: 20,
      bubbles: true,
    }));

    if (segEvents.length > 0) {
      expect(typeof segEvents[0].local).toBe("number");
      expect(segEvents[0].treeUuid).toBe(
        widget.rootCardVi.viBasis.VERTICAL.treeUuid,
      );
      expect(segEvents[0].widgetTreeUuids).toEqual({
        vertical: widget.rootCardVi.viBasis.VERTICAL.treeUuid,
        horizontal: widget.rootCardVi.viBasis.HORIZONTAL.treeUuid,
        card: widget.rootCardVi.treeUuid,
      });
    }

    widget.destroy();
  });

  it("dispatches ancestor seg mouseOver when pointer is over self-positioned nested card", () => {
    const weekdayMouseOverEvents: ISeg[] = [];
    const hourMouseOverEvents: ISeg[] = [];
    const lessonListCardMouseOverEvents: ICard[] = [];
    const lessonCardMouseOverEvents: ICard[] = [];

    const hourSeg = segFactory({
      typeName: "HourSeg",
      attrs: { hour: 1 },
      style: { window: "50px" },
      mouseOver: (_event, seg) => {
        hourMouseOverEvents.push(seg);
      },
    });

    const weekdaySeg = segFactory({
      typeName: "WeekdaySeg",
      attrs: { weekday: { order: 1 } },
      nested: eArrayFactory([hourSeg]),
      style: { window: "50px" },
      mouseOver: (_event, seg) => {
        weekdayMouseOverEvents.push(seg);
      },
    });

    const horizontal = segFactory({
      typeName: "WeekSeg",
      nested: eArrayFactory([weekdaySeg]),
      style: { window: "50px" },
    });

    const vertical = segFactory({
      typeName: "GroupListSeg",
      style: { window: "100px" },
    });

    const lessonCard = cardFactory({
      typeName: "LessonCard",
      attrs: { lesson: 1 },
      selfPos: {
        WeekSeg: (place: ISeg) => place.nested.at(0)?.nested?.at(0) ?? null,
      } as never,
      renderer: {
        updateCardHtmlelement: () => {},
      },
      mouseOver: (_event, self) => {
        lessonCardMouseOverEvents.push(self);
      },
    });

    const card = cardFactory({
      typeName: "LessonListCard",
      nested: eArrayFactory([lessonCard]),
      mouseOver: (_event, self) => {
        lessonListCardMouseOverEvents.push(self);
      },
    });

    const widget = new Widget({
      htmlElement: container,
      styleSheet: {},
      elementMetaFactory: ScalarElementMetaFactory,
      vertical,
      horizontal,
      card,
    });

    mockBoundingRect();

    const { cardVi: deepestCardVi } = findDeepestCardVi(widget.rootCardVi, [25, 10]);
    expect(deepestCardVi.source.typeName).toBe("LessonCard");

    container.dispatchEvent(new MouseEvent("mousemove", {
      clientX: 25,
      clientY: 10,
      bubbles: true,
    }));

    expect(lessonListCardMouseOverEvents).toHaveLength(1);
    expect(lessonCardMouseOverEvents).toHaveLength(1);
    expect(weekdayMouseOverEvents).toHaveLength(1);
    expect(weekdayMouseOverEvents[0].typeName).toBe("WeekdaySeg");
    expect(hourMouseOverEvents).toHaveLength(1);
    expect(hourMouseOverEvents[0].typeName).toBe("HourSeg");

    widget.destroy();
  });

  it("dispatches GroupSeg mouseOver over GroupTimetableCard in scrollable vertical stack", () => {
    const groupMouseOverEvents: ISeg[] = [];

    const timePlaceSeg = segFactory({
      typeName: "TimePlaceSeg",
      nested: eArrayFactory([
        segFactory({ typeName: "WeekdayPlaceSeg", style: { window: "50px" } }),
        segFactory({ typeName: "HourPlaceSeg", style: { window: "50px" } }),
      ]),
    });

    const groupListSeg = segFactory({
      typeName: "GroupListSeg",
      nested: eArrayFactory([
        segFactory({
          typeName: "GroupSeg",
          attrs: { id: 1, name: "Group-1" },
          style: { window: "70px" },
          mouseOver: (_event, seg) => {
            groupMouseOverEvents.push(seg);
          },
        }),
      ]),
      style: { window: "50flex" },
    });

    const verticalContent = segFactory({
      typeName: "TimetableVerticalSeg",
      nested: distinctTypeLineCollectionFactory([timePlaceSeg, groupListSeg]),
      style: { window: "100flex" },
    });

    const weekdaySeg = segFactory({
      typeName: "WeekdaySeg",
      attrs: { weekday: { order: 1 } },
      nested: eArrayFactory([
        segFactory({ typeName: "HourSeg", attrs: { hour: 1 }, style: { window: "50px" } }),
      ]),
      style: { window: "50px" },
    });

    const horizontalContent = segFactory({
      typeName: "TimetableHorizontalSeg",
      nested: distinctTypeLineCollectionFactory([
        segFactory({ typeName: "TeacherColumnsSeg", style: { window: "100px" } }),
        segFactory({
          typeName: "WeekSeg",
          nested: eArrayFactory([weekdaySeg]),
          style: { window: "100flex" },
        }),
      ]),
      style: { window: "100flex" },
    });

    const groupTimetableCard = cardFactory({
      typeName: "GroupTimetableCard",
      nested: eArrayFactory([]),
      selfPos: {
        TimetableVerticalSeg: (place: ISeg) =>
          place.nested.find((seg) => seg.typeName === "GroupListSeg") ?? null,
        TimetableHorizontalSeg: (place: ISeg) =>
          place.nested.find((seg) => seg.typeName === "WeekSeg") ?? null,
      } as never,
    });

    const widgetCard = cardFactory({
      typeName: "TimetableWidgetCard",
      nested: eArrayFactory([groupTimetableCard]),
    });

    const system = scrollableSystemFactory({
      verticalContentSeg: verticalContent,
      horizontalContentSeg: horizontalContent,
      widgetCard,
    });

    const widget = new Widget({
      htmlElement: container,
      styleSheet: {},
      elementMetaFactory: ScalarElementMetaFactory,
      vertical: system.vertical,
      horizontal: system.horizontal,
      card: system.card,
    });

    mockBoundingRect();

    container.dispatchEvent(new MouseEvent("mousemove", {
      clientX: 150,
      clientY: 130,
      bubbles: true,
    }));

    expect(groupMouseOverEvents).toHaveLength(1);
    expect(groupMouseOverEvents[0].typeName).toBe("GroupSeg");

    widget.destroy();
  });

  it("dispatches callbackTable handler instead of inline handler when both exist", () => {
    const inlineHandler = jest.fn();
    const tableHandler = jest.fn();
    const vertical = segFactory({
      typeName: "TimetableVerticalSeg",
      style: { window: "200px" },
    });
    const horizontal = segFactory({
      typeName: "TimetableHorizontalSeg",
      nested: eArrayFactory([
        segFactory({
          typeName: "HourSeg",
          style: { window: "50px" },
          mouseOver: inlineHandler,
        }),
      ]),
      style: { window: "300px" },
    });
    const card = cardFactory({
      typeName: "LessonListCard",
    });

    const widget = new Widget({
      htmlElement: container,
      styleSheet: {},
      callbackTable: {
        HourSeg: { mouseOver: tableHandler },
      },
      elementMetaFactory: ScalarElementMetaFactory,
      vertical,
      horizontal,
      card,
    });

    mockBoundingRect();

    container.dispatchEvent(new MouseEvent("mousemove", {
      clientX: 30,
      clientY: 30,
      bubbles: true,
    }));

    expect(tableHandler).toHaveBeenCalledTimes(1);
    expect(inlineHandler).not.toHaveBeenCalled();

    widget.destroy();
  });

  it("dispatches mouseDoubleClick on card from dblclick", () => {
    const events: MouseInteractionEvent[] = [];
    const vertical = segFactory({
      typeName: "TimetableVerticalSeg",
      style: { window: "200px" },
    });
    const horizontal = segFactory({
      typeName: "TimetableHorizontalSeg",
      style: { window: "300px" },
    });
    const card = cardFactory({
      typeName: "LessonListCard",
      nested: eArrayFactory<ICard[]>([]),
      mouseDoubleClick: (event) => {
        events.push(event);
      },
    });

    const widget = new Widget({
      htmlElement: container,
      styleSheet: {},
      elementMetaFactory: ScalarElementMetaFactory,
      vertical,
      horizontal,
      card,
    });

    mockBoundingRect();

    container.dispatchEvent(new MouseEvent("dblclick", {
      clientX: 50,
      clientY: 60,
      bubbles: true,
    }));

    expect(events.length).toBeGreaterThan(0);
    const event = events[0];
    expect(event.viewport).toEqual({ x: 50, y: 60 });
    expect(event.widget).toEqual([50, 60]);
    expect(Array.isArray(event.local)).toBe(true);
    expect(event.widgetTreeUuids.card).toBe(widget.rootCardVi.treeUuid);

    widget.destroy();
  });

  it("dispatches callbackTable mouseDoubleClick instead of inline handler when both exist", () => {
    const inlineHandler = jest.fn();
    const tableHandler = jest.fn();
    const vertical = segFactory({
      typeName: "TimetableVerticalSeg",
      style: { window: "200px" },
    });
    const horizontal = segFactory({
      typeName: "TimetableHorizontalSeg",
      style: { window: "300px" },
    });
    const card = cardFactory({
      typeName: "LessonListCard",
      mouseDoubleClick: inlineHandler,
    });

    const widget = new Widget({
      htmlElement: container,
      styleSheet: {},
      callbackTable: {
        LessonListCard: { mouseDoubleClick: tableHandler },
      },
      elementMetaFactory: ScalarElementMetaFactory,
      vertical,
      horizontal,
      card,
    });

    mockBoundingRect();

    container.dispatchEvent(new MouseEvent("dblclick", {
      clientX: 50,
      clientY: 60,
      bubbles: true,
    }));

    expect(tableHandler).toHaveBeenCalledTimes(1);
    expect(inlineHandler).not.toHaveBeenCalled();

    widget.destroy();
  });

  it("dispatches mouseClick to all sibling overlay cards at the same bounds", () => {
    const overlayClickEvents: ICard[] = [];
    const lessonListClickEvents: ICard[] = [];
    const lessonClickEvents: ICard[] = [];

    const hourSeg = segFactory({
      typeName: "HourSeg",
      attrs: { hour: 1 },
      style: { window: "50px" },
    });

    const weekdaySeg = segFactory({
      typeName: "WeekdaySeg",
      attrs: { weekday: { order: 1 } },
      nested: eArrayFactory([hourSeg]),
      style: { window: "50px" },
    });

    const horizontal = segFactory({
      typeName: "WeekSeg",
      nested: eArrayFactory([weekdaySeg]),
      style: { window: "200px" },
    });

    const vertical = segFactory({
      typeName: "GroupListSeg",
      nested: eArrayFactory([
        segFactory({
          typeName: "GroupSeg",
          attrs: { id: 1 },
          style: { window: "70px" },
        }),
      ]),
      style: { window: "100px" },
    });

    const lessonCard = cardFactory({
      typeName: "LessonCard",
      attrs: { lesson: 1 },
      selfPos: {
        WeekSeg: (place: ISeg) => place.nested.at(0)?.nested?.at(0) ?? null,
        GroupListSeg: (place: ISeg) => place.nested.at(0) ?? null,
      } as never,
      renderer: {
        updateCardHtmlelement: () => {},
      },
      mouseClick: (_event, self) => {
        lessonClickEvents.push(self);
      },
    });

    const overlayListCard = cardFactory({
      typeName: "EmptyGroupSlotListCard",
      nested: eArrayFactory<ICard[]>([]),
      mouseClick: (_event, self) => {
        overlayClickEvents.push(self);
      },
    });

    const lessonListCard = cardFactory({
      typeName: "GroupLessonListCard",
      nested: eArrayFactory([lessonCard]),
      mouseClick: (_event, self) => {
        lessonListClickEvents.push(self);
      },
    });

    const anchorCard = cardFactory({
      typeName: "GroupTimetableCard",
      nested: eArrayFactory([overlayListCard, lessonListCard]),
      selfPos: {
        GroupListSeg: (place: ISeg) => place,
        WeekSeg: (place: ISeg) => place,
      } as never,
    });

    const widget = new Widget({
      htmlElement: container,
      styleSheet: {},
      elementMetaFactory: ScalarElementMetaFactory,
      vertical,
      horizontal,
      card: anchorCard,
    });

    mockBoundingRect();

    container.dispatchEvent(new MouseEvent("click", {
      clientX: 25,
      clientY: 10,
      bubbles: true,
    }));

    expect(overlayClickEvents).toHaveLength(1);
    expect(overlayClickEvents[0].typeName).toBe("EmptyGroupSlotListCard");
    expect(lessonListClickEvents).toHaveLength(1);
    expect(lessonListClickEvents[0].typeName).toBe("GroupLessonListCard");
    expect(lessonClickEvents).toHaveLength(1);
    expect(lessonClickEvents[0].typeName).toBe("LessonCard");

    widget.destroy();
  });

  it("dispatches mouseDown on mousedown and mouseDrag after threshold on captured card", () => {
    const downs: MouseInteractionEvent[] = [];
    const drags: MouseInteractionEvent[] = [];
    const ups: MouseInteractionEvent[] = [];
    const clicks: MouseInteractionEvent[] = [];

    const vertical = segFactory({
      typeName: "TimetableVerticalSeg",
      style: { window: "200px" },
    });
    const horizontal = segFactory({
      typeName: "TimetableHorizontalSeg",
      style: { window: "300px" },
    });
    const card = cardFactory({
      typeName: "LessonListCard",
      nested: eArrayFactory<ICard[]>([]),
      mouseDown: (event) => {
        downs.push(event);
      },
      mouseDrag: (event) => {
        drags.push(event);
      },
      mouseUp: (event) => {
        ups.push(event);
      },
      mouseClick: (event) => {
        clicks.push(event);
      },
    });

    const widget = new Widget({
      htmlElement: container,
      styleSheet: {},
      elementMetaFactory: ScalarElementMetaFactory,
      vertical,
      horizontal,
      card,
    });

    mockBoundingRect();

    container.dispatchEvent(new MouseEvent("mousedown", {
      clientX: 40,
      clientY: 50,
      button: 0,
      bubbles: true,
    }));
    expect(downs.length).toBe(1);

    document.dispatchEvent(new MouseEvent("mousemove", {
      clientX: 42,
      clientY: 50,
      bubbles: true,
    }));
    expect(drags.length).toBe(0);

    document.dispatchEvent(new MouseEvent("mousemove", {
      clientX: 50,
      clientY: 50,
      bubbles: true,
    }));
    expect(drags.length).toBeGreaterThan(0);

    document.dispatchEvent(new MouseEvent("mousemove", {
      clientX: 80,
      clientY: 55,
      bubbles: true,
    }));
    expect(drags.length).toBeGreaterThan(1);
    const laterLocal = drags[drags.length - 1].local as [number, number];
    const earlierLocal = drags[0].local as [number, number];
    expect(laterLocal[0]).toBeGreaterThan(earlierLocal[0]);

    document.dispatchEvent(new MouseEvent("mouseup", {
      clientX: 80,
      clientY: 55,
      button: 0,
      bubbles: true,
    }));
    expect(ups.length).toBe(1);

    container.dispatchEvent(new MouseEvent("click", {
      clientX: 80,
      clientY: 55,
      bubbles: true,
    }));
    expect(clicks.length).toBe(0);

    widget.destroy();
  });

  it("does not suppress click when mouseup happens before drag threshold", () => {
    const clicks: MouseInteractionEvent[] = [];
    const vertical = segFactory({
      typeName: "TimetableVerticalSeg",
      style: { window: "200px" },
    });
    const horizontal = segFactory({
      typeName: "TimetableHorizontalSeg",
      style: { window: "300px" },
    });
    const card = cardFactory({
      typeName: "LessonListCard",
      nested: eArrayFactory<ICard[]>([]),
      mouseClick: (event) => {
        clicks.push(event);
      },
    });

    const widget = new Widget({
      htmlElement: container,
      styleSheet: {},
      elementMetaFactory: ScalarElementMetaFactory,
      vertical,
      horizontal,
      card,
    });

    mockBoundingRect();

    container.dispatchEvent(new MouseEvent("mousedown", {
      clientX: 40,
      clientY: 50,
      button: 0,
      bubbles: true,
    }));
    document.dispatchEvent(new MouseEvent("mouseup", {
      clientX: 41,
      clientY: 50,
      button: 0,
      bubbles: true,
    }));
    container.dispatchEvent(new MouseEvent("click", {
      clientX: 41,
      clientY: 50,
      bubbles: true,
    }));
    expect(clicks.length).toBe(1);

    widget.destroy();
  });


});
