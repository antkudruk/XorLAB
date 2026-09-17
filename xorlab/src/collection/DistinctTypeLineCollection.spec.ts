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

import { DistinctTypeLineCollection } from "./DistinctTypeLineCollection";
import { eArrayDelegateTest } from "./EArrayDelegateTestUtils";

describe("DistinctTypeLineCollection", () => {
    type TestLine = { typeName: string; value: number };

    const lineA: TestLine = { typeName: "a", value: 10 };
    const lineB: TestLine = { typeName: "b", value: 20 };
    const lineC: TestLine = { typeName: "c", value: 30 };

    eArrayDelegateTest({
        createCollection: (...items) => new DistinctTypeLineCollection(...items),
        sampleItems: [lineA, lineB, lineC],
        missingItem: { typeName: "missing", value: 40 },
    });

    test("returns the item for the requested type", () => {
        const testSubject = new DistinctTypeLineCollection(lineA, lineB, lineC);

        expect(testSubject.getItemByType("b")).toBe(lineB);
    });

    test("throws when the requested type is missing", () => {
        const testSubject = new DistinctTypeLineCollection(lineA, lineB, lineC);

        expect(() => testSubject.getItemByType("missing")).toThrow(
            'Collection item with type "missing" is not found.'
        );
    });
});
