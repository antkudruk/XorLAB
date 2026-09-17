/*
    Copyright 2023 - Present Anton Kudruk
   Licensed under the Apache License, Version 2.0 (the "License");
   you may not use this file except in compliance with the License.
   You may obtain a copy of the License at
       http://www.apache.org/licenses/LICENSE-2.0
   Unless required by applicable law or agreed to in writing, software
   distributed under the License is distributed on an "AS IS" BASIS,
   WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
    10|   See the License for the specific language governing permissions and
   limitations under the License.
 */

import { PropertyImpl, PropertyListener, ReadOnlyProperty } from "../../collection/property/Property";
import { SwappablePropertySlot } from "./SwappablePropertySlot";

describe("A slot that provides a property based on the Segment", () => {
    interface Foo {
        prop: ReadOnlyProperty<number>
    };

    test("WHEN replace to new property THEN updates value", () => {
        // given
        const initValue: Foo = {
            prop: new PropertyImpl(10),
        };

        const replacement: Foo = {
            prop: new PropertyImpl(11),
        }

        const propertyProvider = (src: Foo) => {
            return src.prop;
        }

        const testSubject = new SwappablePropertySlot<Foo, number>(propertyProvider);
        testSubject.swap(initValue);
        expect(testSubject.value).toBe(10);

        // when
        testSubject.swap(replacement);

        // then
        expect(testSubject.value).toBe(11);

    });

    test("WHEN swap to same value THEN notifies listeners once", () => {
        const a: Foo = { prop: new PropertyImpl(10) };
        const b: Foo = { prop: new PropertyImpl(10) };
        const slot = new SwappablePropertySlot<Foo, number>((src) => src.prop);
        const changes: Array<{ oldValue: number | undefined; newValue: number | undefined }> = [];
        const listener: PropertyListener<number | undefined> = {
            onChange(oldValue, newValue) {
                changes.push({ oldValue, newValue });
            },
        };
        slot.subscribe(listener);

        slot.swap(a);
        expect(changes).toEqual([{ oldValue: undefined, newValue: 10 }]);

        slot.swap(b);
        // Same mirrored value — PropertyImpl does not notify again.
        expect(changes).toEqual([{ oldValue: undefined, newValue: 10 }]);
        expect(slot.value).toBe(10);
    });

    test("WHEN source property changes THEN slot mirrors once per change", () => {
        const srcProp = new PropertyImpl(1);
        const foo: Foo = { prop: srcProp };
        const slot = new SwappablePropertySlot<Foo, number>((src) => src.prop);
        const changes: number[] = [];
        slot.subscribe({
            onChange(_old, newValue) {
                if (newValue !== undefined) {
                    changes.push(newValue);
                }
            },
        });

        slot.swap(foo);
        expect(changes).toEqual([1]);

        srcProp.value = 2;
        expect(changes).toEqual([1, 2]);
        expect(slot.value).toBe(2);
    });

    test("WHEN clear THEN value is undefined and source is released", () => {
        const srcProp = new PropertyImpl(5);
        const foo: Foo = { prop: srcProp };
        const slot = new SwappablePropertySlot<Foo, number>((src) => src.prop);
        const changes: Array<number | undefined> = [];
        slot.subscribe({
            onChange(_old, newValue) {
                changes.push(newValue);
            },
        });

        slot.swap(foo);
        slot.clear();

        expect(slot.value).toBeUndefined();
        expect(changes).toEqual([5, undefined]);

        srcProp.value = 99;
        expect(slot.value).toBeUndefined();
        expect(changes).toEqual([5, undefined]);
    });
});
