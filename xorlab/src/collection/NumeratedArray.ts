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
import { EListener, EReadCollection } from "./ECollection";


export interface NumeratedItem<Item> {
    readonly index: number;
    readonly item: Item;
}

export class NumeratedArray<Item> implements EReadCollection<Item[]> {

    private readonly underlying: EArray<NumeratedItem<Item>> = new EArray;

    constructor(source: EReadCollection<Item[]>) {
    }

    at(i: number): Item {
        throw new Error("Method not implemented.");
    }
    find(criteria: (item: Item) => boolean): Item | undefined {
        throw new Error("Method not implemented.");
    }
    get length(): number {
        throw new Error("Method not implemented.");
    };
    forEach(callbackFn: (it: Item, index: number, self: EReadCollection<Item[]>) => void): void {
        throw new Error("Method not implemented.");
    }
    map<Result>(callbackFn: (it: Item, index: number, self: EReadCollection<Item[]>) => Result): Result[] {
        throw new Error("Method not implemented.");
    }
    slice(start?: number, end?: number): Item[] {
        throw new Error("Method not implemented.");
    }
    findIndex(predicate: (value: Item, index: number, obj: Item[]) => boolean): number {
        throw new Error("Method not implemented.");
    }
    indexOf(item: Item): number {
        throw new Error("Method not implemented.");
    }
    touchAt(index: number): void {
        throw new Error("Method not implemented.");
    }
    subscribe(listener: EListener<Item>): void {
        throw new Error("Method not implemented.");
    }
    unsubscribe(listener: EListener<Item>): void {
        throw new Error("Method not implemented.");
    }

}
