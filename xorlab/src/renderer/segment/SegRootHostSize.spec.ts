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
import { EArray } from "../../collection/EArray";
import { PropertyImpl } from "../../collection/property/Property";
import { segFactory } from "../../facade/line";
import { STYLE_ADAPTERS } from "../SegPropsAdapters";
import { SegVi, SegViCeiling } from "./SegVi";

function createRootSegVi(
    source: ISeg,
    hostAvailableSpace: PropertyImpl<number>,
    cssUpdater = STYLE_ADAPTERS.HORIZONTAL,
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

describe("Root segment host available space", () => {
    it("resolves window 100% to host size", () => {
        const hostSize = new PropertyImpl(600);
        const seg = segFactory({ typeName: "RootSeg", style: { window: "100%" } });
        const rootVi = createRootSegVi(seg, hostSize);

        expect(rootVi.window.value).toBe(600);
        expect(rootVi.availableSpace.value).toBe(600);

        hostSize.value = 800;
        expect(rootVi.window.value).toBe(800);
        expect(rootVi.availableSpace.value).toBe(800);
    });

    it("root auto uses client for window and host size for availableSpace", () => {
        const hostSize = new PropertyImpl(1000);
        const nested = new EArray<ISeg>();
        const seg = segFactory({
            typeName: "RootSeg",
            style: { window: "auto" },
            nested,
        });
        const rootVi = createRootSegVi(seg, hostSize);

        expect(rootVi.window.value).toBe(0);
        expect(rootVi.availableSpace.value).toBe(1000);

        nested.push(segFactory({ typeName: "ChildSeg", style: { window: "300px" } }));

        expect(rootVi.window.value).toBe(300);
        expect(rootVi.availableSpace.value).toBe(1000);
        expect(rootVi.flexible.value).toBe(false);
    });

    it("flexible root auto fills host size and tracks host changes", () => {
        const hostSize = new PropertyImpl(600);
        const nested = new EArray(
            segFactory({
                typeName: "FlexChildSeg",
                style: { window: "100flex" },
                nested: [],
            }),
        );
        const seg = segFactory({
            typeName: "RootSeg",
            style: { window: "auto" },
            nested,
        });
        const rootVi = createRootSegVi(seg, hostSize);

        expect(rootVi.flexible.value).toBe(true);
        expect(rootVi.window.value).toBe(600);
        expect(rootVi.availableSpace.value).toBe(600);

        hostSize.value = 900;
        expect(rootVi.window.value).toBe(900);
        expect(rootVi.availableSpace.value).toBe(900);
    });

    it("root auto with only fixed children stays content-sized", () => {
        const hostSize = new PropertyImpl(1000);
        const nested = new EArray<ISeg>(
            segFactory({ typeName: "FixedA", style: { window: "120px" } }),
            segFactory({ typeName: "FixedB", style: { window: "80px" } }),
        );
        const seg = segFactory({
            typeName: "RootSeg",
            style: { window: "auto" },
            nested,
        });
        const rootVi = createRootSegVi(seg, hostSize);

        expect(rootVi.flexible.value).toBe(false);
        expect(rootVi.window.value).toBe(200);
        expect(rootVi.availableSpace.value).toBe(1000);
    });
});
