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
import type { ISeg } from "../../facade/line";
import { createCardToSegRef } from "./CardToSegRef";

describe("Card to seg reference", () => {

    test("Adding and substracting number of children segment", () => {
        // then
        const mockSeg = mock<ISeg>();

        // when
        const testSubject = createCardToSegRef(mockSeg);
        
        // then
        expect(testSubject.seg).toBe(mockSeg);
        expect(testSubject.counter).toBe(1);

        // when
        testSubject.plus();

        // then
        expect(testSubject.seg).toBe(mockSeg);
        expect(testSubject.counter).toBe(2);

        {
            // when
            const next = testSubject.minusAndGet();

            // then
            expect(next).toBe(1);
            expect(testSubject.seg).toBe(mockSeg);
            expect(testSubject.counter).toBe(1);
        }

        {
            // when
            const next = testSubject.minusAndGet();

            // then
            expect(next).toBe(0);
            expect(testSubject.seg).toBe(mockSeg);
            expect(testSubject.counter).toBe(0);
        }

        // Further substraction doesn't make sense
    });
});