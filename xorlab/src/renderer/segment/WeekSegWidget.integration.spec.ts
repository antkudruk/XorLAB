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

import { JSDOM } from "jsdom";
import * as fs from "fs";
import { createTable } from "../../basic/table/Table";
import { createDefaultOrthoFactory } from "../../basic/table/OrthoFactory";
import { cardFactory } from "../../facade/card";
import { EArray } from "../../collection/EArray";
import { segFactory } from "../../facade/line";
import { Widget, ScalarElementMetaFactory } from "../../index"
import type { ISeg } from "../../facade/line";

const LOG_PATH = "/home/akudruk/xorlab-x/.cursor/debug-bbe1ca.log";

function hourSegFactory(hour: number) {
    return segFactory({
        typeName: "HourSeg",
        attrs: { hour },
        style: { window: "50px" },
    });
}

function weekdaySegFactory(order: number) {
    return segFactory({
        typeName: "WeekdaySeg",
        attrs: { weekday: { order } },
        nested: new EArray(
            hourSegFactory(1), hourSegFactory(2), hourSegFactory(3),
            hourSegFactory(4), hourSegFactory(5), hourSegFactory(6), hourSegFactory(7),
        ),
    });
}

function weekSegFactory() {
    return segFactory({
        typeName: "WeekSeg",
        style: { window: "auto" },
        nested: new EArray(
            weekdaySegFactory(1), weekdaySegFactory(2), weekdaySegFactory(3),
            weekdaySegFactory(4), weekdaySegFactory(5),
        ),
    });
}

function logEntry(message: string, data: Record<string, unknown>) {
    fs.appendFileSync(
        LOG_PATH,
        JSON.stringify({
            sessionId: "bbe1ca",
            runId: "integration-verify",
            location: "WeekSegWidget.integration.spec.ts",
            message,
            data,
            timestamp: Date.now(),
        }) + "\n",
    );
}

describe("timetable WeekSeg widget integration", () => {
    beforeEach(() => {
        const dom = new JSDOM("<!DOCTYPE html><html><body></body></html>");
        (global as unknown as { document: Document }).document = dom.window.document;
        (global as unknown as { window: Window }).window = dom.window as unknown as Window;
        try {
            fs.unlinkSync(LOG_PATH);
        } catch {
            // ignore
        }
    });

    it("WeekSeg card width equals sum of WeekdaySeg widths (1750px)", () => {
        const weekSeg = weekSegFactory();
        const labelPlace = segFactory({
            typeName: "LabelPlaceSeg",
            style: { window: "50px" },
        });

        const horizontal = segFactory({
            typeName: "TimetableHorizontalSeg",
            nested: new EArray(weekSeg),
            style: { window: "auto" },
        });

        const vertical = segFactory({
            typeName: "TimetableVerticalSeg",
            nested: new EArray(labelPlace),
            style: { window: "auto" },
        });

        const host = document.createElement("div");
        document.body.appendChild(host);

        const timeHeaderCard = createTable({
            mainLine: "WeekSeg",
            orthoLine: "LabelPlaceSeg",
            orthoFactory: createDefaultOrthoFactory("WeekSeg", "LabelPlaceSeg"),
        });

        const widgetCard = cardFactory({
            typeName: "TimetableWidgetCard",
            nested: new EArray(timeHeaderCard),
            selfPos: {
                TimetableHorizontalSeg: (place) => place.nested.at(0),
                TimetableVerticalSeg: (place) => place.nested.at(0),
            },
        });

        new Widget({
            htmlElement: host,
            styleSheet: {},
            elementMetaFactory: ScalarElementMetaFactory,
            vertical: vertical,
            horizontal: horizontal,
            card: widgetCard,
        });

        const treeUuid = Object.keys(weekSeg.vis)[0]!;
        const weekSegVi = weekSeg.getViByUuid(treeUuid)!;
        const weekdayWindows = weekSeg.nested.map(
            (wd) => wd.getViByUuid(treeUuid)?.window.value ?? 0,
        );

        const weekSegElements = host.querySelectorAll(".WeekSeg");
        const domWidths = Array.from(weekSegElements).map((el) => ({
            inlineWidth: (el as HTMLElement).style.width,
            offsetWidth: (el as HTMLElement).offsetWidth,
            className: el.className,
        }));

        logEntry("WeekSeg sizing verification", {
            weekSegWindow: weekSegVi.window.value,
            weekdayWindows,
            sumWeekdayWindows: weekdayWindows.reduce((a, b) => a + b, 0),
            domWidths,
        });

        expect(weekdayWindows).toEqual([350, 350, 350, 350, 350]);
        expect(weekSegVi.window.value).toBe(1750);
        expect(weekSegVi.window.value).toBe(
            weekdayWindows.reduce((a, b) => a + b, 0),
        );
    });
});
