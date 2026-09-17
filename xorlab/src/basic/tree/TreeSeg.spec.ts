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

import { mock } from "jest-mock-extended";
import { TREE_SEG_TYPE_NAME, TreeSeg } from "./TreeSeg";
import type { ISeg } from "../../facade/line";

describe("Tree dimension: FORWARD ORDER", () => {

    test("nodeSeg is before nestedLevel by default", () => {
        const infoSeg0 = mock<ISeg>();

        const testSubject = TreeSeg({
            nodeSegFactory: () => infoSeg0,
        });

        expect(testSubject.nested.at(0)).toBe(infoSeg0);

        const nestedLevel = testSubject.attrs.getNestedLevel();

        expect(nestedLevel.typeName).toBe(TREE_SEG_TYPE_NAME);
        expect(testSubject.nested.at(0)).toBe(infoSeg0);
        expect(testSubject.nested.at(1)).toBe(nestedLevel);
    });

    test("nested TreeSeg also uses forward order", () => {
        const infoSeg0 = mock<ISeg>();
        const infoSeg1 = mock<ISeg>();
        let callCount = 0;

        const testSubject = TreeSeg({
            nodeSegFactory: () => (callCount++ === 0 ? infoSeg0 : infoSeg1),
        });

        const nestedLevel = testSubject.attrs.getNestedLevel();

        expect(nestedLevel.nested.at(0)).toBe(infoSeg1);
    });
});

describe("Tree dimension: BACKWARD ORDER", () => {

    test("nodeSeg is after nestedLevel when order is backward", () => {
        const infoSeg0 = mock<ISeg>();

        const testSubject = TreeSeg({
            nodeSegFactory: () => infoSeg0,
            order: "backward",
        });

        expect(testSubject.nested.at(0)).toBe(infoSeg0);
        expect(testSubject.nested.length).toBe(1);

        const nestedLevel = testSubject.attrs.getNestedLevel();

        expect(nestedLevel.typeName).toBe(TREE_SEG_TYPE_NAME);
        expect(testSubject.nested.at(0)).toBe(nestedLevel);
        expect(testSubject.nested.at(1)).toBe(infoSeg0);
    });

    test("nested TreeSeg inherits backward order from params", () => {
        const infoSeg0 = mock<ISeg>();

        const testSubject = TreeSeg({
            nodeSegFactory: () => infoSeg0,
            order: "backward",
        });

        const nestedLevel = testSubject.attrs.getNestedLevel();
        nestedLevel.attrs.getNestedLevel();

        expect(nestedLevel.nested.at(0).typeName).toBe(TREE_SEG_TYPE_NAME);
        expect(nestedLevel.nested.at(1)).toBe(nestedLevel.attrs.getNodeSeg());
    });

    test("freeNestedLevel restores nodeSeg-only collection", () => {
        const infoSeg0 = mock<ISeg>();

        const testSubject = TreeSeg({
            nodeSegFactory: () => infoSeg0,
            order: "backward",
        });

        testSubject.attrs.getNestedLevel();
        testSubject.attrs.freeNestedLevel();

        expect(testSubject.nested.length).toBe(1);
        expect(testSubject.nested.at(0)).toBe(infoSeg0);
    });
});
