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
import { EMapped } from "./EMapped";

describe("EMapped", () => {
    test("creates the initial mapped view from the source collection", () => {
        const source = new EArray(1, 2, 3);

        const testSubject = new EMapped(source, (item) => item * 10);

        expect(testSubject.slice()).toEqual([10, 20, 30]);
    });

    test("propagates splice operations from the source", () => {
        const source = new EArray(1, 2, 3);
        const testSubject = new EMapped(source, (item) => item * 10);

        source.splice(1, 1, 5, 6);

        expect(testSubject.slice()).toEqual([10, 50, 60, 30]);
    });

    test("propagates move operations from the source", () => {
        const source = new EArray(1, 2, 3);
        const testSubject = new EMapped(source, (item) => item * 10);

        source.move(0, 2);

        expect(testSubject.slice()).toEqual([20, 30, 10]);
    });

    test("replace switches subscriptions from the old source to the new one", () => {
        const sourceA = new EArray(1, 2);
        const sourceB = new EArray(7, 8);
        const testSubject = new EMapped(sourceA, (item) => item * 10);

        testSubject.replace(sourceB);
        sourceA.push(3);
        sourceB.push(9);

        expect(testSubject.slice()).toEqual([70, 80, 90]);
        expect(testSubject.source).toBe(sourceB);
    });

    test("replace with null clears the mapped collection", () => {
        const source = new EArray(1, 2);
        const testSubject = new EMapped(source, (item) => item * 10);

        testSubject.replace(null);

        expect(testSubject.length).toBe(0);
        expect(testSubject.source).toBeNull();
    });
});
