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
import { MapProperty } from "./MapProperty";
import { mock } from "jest-mock-extended";

    test("get value", () => {
        // given
        const propertyA = new PropertyImpl(10);
        const testSubject = new MapProperty(propertyA, (a) => a * 2);

        // when
        const result = testSubject.value;

        // then
        expect(result).toBe(20);
    });

    test("set value", () => {
        // given
        const propertyA = new PropertyImpl(10);
        const testSubject = new MapProperty(propertyA, (a) => a * 2);

        // when
        propertyA.value = 20;

        // then
        expect(testSubject.value).toBe(40);
    });

    test("subscribe", () => {
        // given
        const propertyA = new PropertyImpl(10);
        const testSubject = new MapProperty(propertyA, (a) => a * 2);
        const listener = mock<PropertyListener<number>>();

        // when
        testSubject.subscribe(listener);
        
        // then
        propertyA.value = 20;
        expect(listener.onChange).toHaveBeenCalledWith(20, 40);
    });
