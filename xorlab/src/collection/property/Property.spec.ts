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

import { PropertyImpl, PropertyListener } from "./Property";
import { mock } from "jest-mock-extended";

    test("get value", () => {
        // when
        const testSubject = new PropertyImpl(10);

        // then
        expect(testSubject.value).toBe(10);
    });

    test("set value", () => {
        // given
        const testSubject = new PropertyImpl(10);

        // when
        testSubject.value = 20;

        // then
        expect(testSubject.value).toBe(20);
    });

    test("subscribe", () => {
        // given
        const testSubject = new PropertyImpl(10);
        const listener = mock<PropertyListener<number>>();

        // when
        testSubject.subscribe(listener);

        // then
        testSubject.value = 20;
        expect(listener.onChange).toHaveBeenCalledWith(10, 20);
    });

    test("unsubscribe", () => {
        // given
        const testSubject = new PropertyImpl(10);

        const listener = mock<PropertyListener<number>>();
        const unsubscribe = testSubject.subscribe(listener);

        // when
        testSubject.unsubscribe(listener);

        // then
        testSubject.value = 20;
        expect(listener.onChange).not.toHaveBeenCalled();
    });
