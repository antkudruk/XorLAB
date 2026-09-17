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
import { Widget, ScalarElementMetaFactory } from "../../index"
import type { ISeg } from "../../facade/line";
import {
    cardFactory,
    distinctTypeLineCollectionFactory,
    eArrayFactory,
    eMappedFactory,
    segFactory,
} from "../../facade";
import { scrollableSystemFactory } from "../../facade/scrollable";
import { SizeString } from "../../renderer/SizeStyle";

const LOG_PATH = "/home/akudruk/xorlab-x/.cursor/debug-a87db3.log";

function wideListSeg(typeName: string) {
    return segFactory({
        typeName,
        nested: eMappedFactory(
            eArrayFactory(Array.from({ length: 20 }, (_, i) => ({ id: i }))),
            (item) =>
                segFactory({
                    typeName: `${typeName}Item`,
                    attrs: item,
                    style: { window: "120px" },
                })
        ),
        style: { window: "2400px" },
    });
}

function createTestScrollableSystem(scrollbarWidth: SizeString = "30px") {
    return scrollableSystemFactory({
        verticalContentSeg: segFactory({
            typeName: "TimetableVerticalSeg",
            nested: distinctTypeLineCollectionFactory([
                wideListSeg("TimePlaceSeg"),
                wideListSeg("GroupListSeg"),
                wideListSeg("TeacherListSeg"),
            ]),
            style: { window: "100flex" },
        }),
        horizontalContentSeg: segFactory({
            typeName: "TimetableHorizontalSeg",
            nested: distinctTypeLineCollectionFactory([
                wideListSeg("TeacherColumnsSeg"),
                wideListSeg("WeekSeg"),
            ]),
            style: { window: "100flex" },
        }),
        widgetCard: cardFactory({
            typeName: "TimetableWidgetCard",
            nested: eArrayFactory([]),
        }),
        scrollbarWidth,
    });
}

describe("TreeSeg backward widget integration", () => {
    beforeEach(() => {
        const dom = new JSDOM("<!DOCTYPE html><html><body></body></html>");
        (global as any).document = dom.window.document;
        (global as any).window = dom.window;
        (global as any).fetch = (_url: string, opts: { body: string }) => {
            fs.appendFileSync(LOG_PATH, opts.body + "\n");
            return Promise.resolve({ ok: true });
        };
        try {
            fs.unlinkSync(LOG_PATH);
        } catch {
            // ignore
        }
    });

    test("reproduces alien segment error when scrollbar tree card activates", () => {
        const host = document.createElement("div");
        document.body.appendChild(host);

        const { vertical, horizontal, card } = createTestScrollableSystem();

        try {
            new Widget({
                htmlElement: host,
                styleSheet: {},
                elementMetaFactory: ScalarElementMetaFactory,
                vertical: vertical,
                horizontal: horizontal,
                card: card,
            });
            fs.appendFileSync(
                LOG_PATH,
                JSON.stringify({
                    sessionId: "a87db3",
                    location: "integration.spec.ts",
                    message: "widget started without error",
                    runId: "integration-test-full",
                }) + "\n"
            );
        } catch (error) {
            fs.appendFileSync(
                LOG_PATH,
                JSON.stringify({
                    sessionId: "a87db3",
                    location: "integration.spec.ts",
                    message: "widget startup threw",
                    data: { error: String(error) },
                    runId: "integration-test-full",
                }) + "\n"
            );
            throw error;
        }
    });

    test("100flex children plus TreeSeg fit inside 100% scrollable host", () => {
        const host = document.createElement("div");
        Object.defineProperty(host, "clientWidth", { configurable: true, value: 1000 });
        Object.defineProperty(host, "clientHeight", { configurable: true, value: 800 });
        document.body.appendChild(host);

        const { vertical, horizontal, card } = createTestScrollableSystem();

        const widget = new Widget({
            htmlElement: host,
            styleSheet: {},
            elementMetaFactory: ScalarElementMetaFactory,
            vertical: vertical,
            horizontal: horizontal,
            card: card,
        });

        const hRootVi = widget.viBasis.HORIZONTAL;
        const vRootVi = widget.viBasis.VERTICAL;

        const hNested = horizontal.nested as unknown as {
            getItemByType(type: string): ISeg;
        };
        const vNested = vertical.nested as unknown as {
            getItemByType(type: string): ISeg;
        };
        const hFlexVi = hNested.getItemByType("TimetableHorizontalSeg").getViByUuid(hRootVi.treeUuid)!;
        const hTreeVi = hNested.getItemByType("TreeSeg").getViByUuid(hRootVi.treeUuid)!;
        const vFlexVi = vNested.getItemByType("TimetableVerticalSeg").getViByUuid(vRootVi.treeUuid)!;
        const vTreeVi = vNested.getItemByType("TreeSeg").getViByUuid(vRootVi.treeUuid)!;

        expect(hFlexVi.window.value + hTreeVi.window.value).toBe(hRootVi.window.value);
        expect(vFlexVi.window.value + vTreeVi.window.value).toBe(vRootVi.window.value);
        expect(hRootVi.fixedPartSize.value).toBe(hTreeVi.window.value);
        expect(vRootVi.fixedPartSize.value).toBe(vTreeVi.window.value);
    });
});
