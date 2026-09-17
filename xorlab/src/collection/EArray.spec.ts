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
import { EArray } from "./EArray";
import { EListener } from "./ECollection";
import { eArrayDelegateTest } from "./EArrayDelegateTestUtils";

describe("EArray", () => {
    eArrayDelegateTest({
        createCollection: (...items: number[]) => new EArray(...items),
        sampleItems: [10, 20, 30],
        missingItem: 40,
    });

    test("replays current items on subscribe", () => {
        const testSubject = new EArray(10, 20);
        const listener = mock<EListener<number>>();

        testSubject.subscribe(listener);

        expect(listener.afterSplice).toHaveBeenCalledWith(0, 0, [10, 20], [], testSubject);
    });

    test("push adds items and notifies listeners with splice payload", () => {
        const testSubject = new EArray(10);
        const listener = mock<EListener<number>>();
        testSubject.subscribe(listener);
        listener.afterSplice.mockClear();

        const result = testSubject.push(20, 30);

        expect(result).toBe(3);
        expect(testSubject.slice()).toEqual([10, 20, 30]);
        expect(listener.afterSplice).toHaveBeenCalledWith(1, 0, [20, 30], [], testSubject);
    });

    test("splice replaces items and returns removed values", () => {
        const testSubject = new EArray(10, 20, 30);
        const listener = mock<EListener<number>>();
        testSubject.subscribe(listener);
        listener.afterSplice.mockClear();

        const deletedItems = testSubject.splice(1, 1, 40, 50);

        expect(deletedItems).toEqual([20]);
        expect(testSubject.slice()).toEqual([10, 40, 50, 30]);
        expect(listener.afterSplice).toHaveBeenCalledWith(1, 1, [40, 50], [20], testSubject);
    });

    test("move reorders items and notifies listeners", () => {
        const testSubject = new EArray(10, 20, 30);
        const listener = mock<EListener<number>>();
        testSubject.subscribe(listener);
        listener.afterMove.mockClear();

        testSubject.move(0, 2);

        expect(testSubject.slice()).toEqual([20, 30, 10]);
        expect(listener.afterMove).toHaveBeenCalledWith(0, 2, testSubject);
    });

    test("set updates the value and emits update", () => {
        const testSubject = new EArray(10, 20);
        const listener = mock<EListener<number>>();
        testSubject.subscribe(listener);
        listener.update.mockClear();

        testSubject.set(1, 99);

        expect(testSubject.at(1)).toBe(99);
        expect(listener.update).toHaveBeenCalledWith(1, 99);
    });

    test("touchAt emits update for the current value", () => {
        const testSubject = new EArray(10, 20);
        const listener = mock<EListener<number>>();
        testSubject.subscribe(listener);
        listener.update.mockClear();

        testSubject.touchAt(0);

        expect(listener.update).toHaveBeenCalledWith(0, 10);
    });

    test("unsubscribe stops further notifications", () => {
        const testSubject = new EArray(10);
        const listener = mock<EListener<number>>();
        testSubject.subscribe(listener);
        listener.afterSplice.mockClear();

        testSubject.unsubscribe(listener);
        testSubject.push(20);

        expect(listener.afterSplice).not.toHaveBeenCalled();
    });
});
