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
import { EArray } from "../../collection";
import { PropertyImpl } from "../../collection/property/Property";
import { segFactory } from "../../facade/line";
import { STYLE_ADAPTERS } from "../SegPropsAdapters";
import { SegVi, SegViCeiling } from "./SegVi";

function createRootSegVi(
    source: ISeg,
    hostAvailableSpace = new PropertyImpl(1000),
) {
    return new SegVi({
        parent: undefined,
        styleSheet: {},
        source,
        cssUpdater: STYLE_ADAPTERS.VERTICAL,
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

describe("Create SegSizeProcessor", () => {
    it("We have a single empty segment with size in px", () => {
        const seg = segFactory({ style: { window: "200px" } });
        const testSubject = createRootSegVi(seg);

        expect(testSubject.window.value).toBe(200);
        expect(testSubject.client.value).toBe(0);
        expect(testSubject.availableSpace.value).toBe(200);
        expect(testSubject.flexible.value).toBe(false);
    });

    it("We have a single empty segment with size in px and a single child with bigger size", () => {
        const seg = segFactory({
            style: { window: "200px" },
            nested: [segFactory({ style: { window: "300px" } })],
        });
        const testSubject = createRootSegVi(seg);

        expect(testSubject.window.value).toBe(200);
        expect(testSubject.client.value).toBe(300);
        expect(testSubject.availableSpace.value).toBe(200);
        expect(testSubject.flexible.value).toBe(false);
    });

    it("Se have a single empty segment with the size 'auto' and a single child with a constant size", () => {
        const seg = segFactory({
            style: { window: "auto" },
            nested: [segFactory({ style: { window: "300px" } })],
        });
        const testSubject = createRootSegVi(seg);

        expect(testSubject.window.value).toBe(300);
        expect(testSubject.client.value).toBe(300);
        expect(testSubject.availableSpace.value).toBe(1000);
        expect(testSubject.flexible.value).toBe(false);
    });

    it("Child is percentage of parent", () => {
        const seg = segFactory({
            style: { window: "300px" },
            nested: [segFactory({ style: { window: "50%" } })],
        });
        const testSubject = createRootSegVi(seg);

        expect(testSubject.window.value).toBe(300);
        expect(testSubject.client.value).toBe(150);
        expect(testSubject.availableSpace.value).toBe(300);
        expect(testSubject.flexible.value).toBe(false);
        expect(segViFor(testSubject, seg.nested.at(0)).flexible.value).toBe(true);
    });

    it("A segment of size `auto` and child is percentage", () => {
        const nestedChild = segFactory({
            style: { window: "50%" },
        });
        const seg = segFactory({
            style: { window: "auto" },
            nested: [nestedChild],
        });
        const testSubject = createRootSegVi(seg);

        const nestedSegVi = segViFor(testSubject, nestedChild);
        expect(nestedSegVi.window.value).toBe(500);
        expect(nestedSegVi.client.value).toBe(0);
        expect(nestedSegVi.availableSpace.value).toBe(500);
        expect(nestedSegVi.flexible.value).toBe(true);

        expect(testSubject.window.value).toBe(1000);
        expect(testSubject.client.value).toBe(500);
        expect(testSubject.availableSpace.value).toBe(1000);
        expect(testSubject.countFlexibleChildren.value).toBe(1);
        expect(testSubject.flexible.value).toBe(true);
    });

    it("After adding segment, recalculates sizes", () => {
        const nested = new EArray(
            segFactory({
                style: { window: "50%" },
            }),
        );

        const seg = segFactory({
            style: { window: "auto" },
            nested: nested,
        });

        const testSubject = createRootSegVi(seg);

        nested.push(segFactory({
            style: { window: "10px" },
        }));

        expect(testSubject.window.value).toBe(1000);
        expect(testSubject.client.value).toBe(510);
        expect(testSubject.availableSpace.value).toBe(1000);
        expect(testSubject.countFlexibleChildren.value).toBe(1);
        expect(testSubject.flexible.value).toBe(true);
    });

    it("empty auto child in a fixed parent has window 0", () => {
        const emptyAuto = segFactory({
            typeName: "EmptyAutoSeg",
            style: { window: "auto" },
            nested: [],
        });
        const parent = segFactory({
            typeName: "FixedParentSeg",
            style: { window: "100px" },
            nested: [emptyAuto],
        });
        const rootVi = createRootSegVi(parent);
        const childVi = segViFor(rootVi, emptyAuto);

        expect(childVi.window.value).toBe(0);
        expect(childVi.client.value).toBe(0);
        expect(childVi.flexible.value).toBe(false);
        expect(rootVi.window.value).toBe(100);
    });
});
