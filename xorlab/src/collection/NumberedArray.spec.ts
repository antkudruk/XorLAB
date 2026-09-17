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

import { EArray } from "./EArray";
import { NumberedArray } from "./NumberedArray";

describe("NumberedArray", () => {
    test("assigns self numbers for the initial source order", () => {
        const source = new EArray("a", "b", "c");

        const testSubject = new NumberedArray(source);

        expect(testSubject.map(({ source, selfNumber }) => [source, selfNumber.value])).toEqual([
            ["a", 0],
            ["b", 1],
            ["c", 2],
        ]);
    });

    test("renumbers items after splice inserts and removals", () => {
        const source = new EArray("a", "b", "c");
        const testSubject = new NumberedArray(source);

        source.splice(1, 1, "x", "y");

        expect(testSubject.map(({ source, selfNumber }) => [source, selfNumber.value])).toEqual([
            ["a", 0],
            ["x", 1],
            ["y", 2],
            ["c", 3],
        ]);
    });

    test("updates self numbers for moved boundary items", () => {
        const source = new EArray("a", "b", "c");
        const testSubject = new NumberedArray(source);

        source.move(0, 2);

        expect(testSubject.find((item) => item.source === "a")?.selfNumber.value).toBe(2);
        expect(testSubject.find((item) => item.source === "b")?.selfNumber.value).toBe(1);
        expect(testSubject.find((item) => item.source === "c")?.selfNumber.value).toBe(0);
    });
});
