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

import { EReadCollection } from "./ECollection";

export interface EArrayDelegateTestProps<Item> {
    createCollection: (...items: Item[]) => EReadCollection<Item[]>;
    sampleItems: [Item, Item, Item];
    missingItem: Item;
}

export function eArrayDelegateTest<Item>(props: EArrayDelegateTestProps<Item>) {
    const { createCollection, sampleItems, missingItem } = props;

    test("indexOf", () => {
        const testSubject = createCollection(...sampleItems);

        expect(testSubject.indexOf(sampleItems[1])).toBe(1);
        expect(testSubject.indexOf(missingItem)).toBe(-1);
    });

    test("map", () => {
        const testSubject = createCollection(...sampleItems);

        const result = testSubject.map((item, index, self) => `${index}:${item === self.at(index)}`);

        expect(result).toEqual(["0:true", "1:true", "2:true"]);
    });

    test("forEach", () => {
        const testSubject = createCollection(...sampleItems);
        const result: Array<{ item: Item; index: number }> = [];

        testSubject.forEach((item, index) => {
            result.push({ item, index });
        });

        expect(result).toEqual([
            { item: sampleItems[0], index: 0 },
            { item: sampleItems[1], index: 1 },
            { item: sampleItems[2], index: 2 },
        ]);
    });
}
