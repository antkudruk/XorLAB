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
import { Property, PropertyImpl, ReadOnlyProperty } from "./property/Property";


export interface NumberedArrayItem<Item> {
    readonly selfNumber: ReadOnlyProperty<number>;
    readonly source: Item;
}

export class NumberedArray<Item> implements EReadCollection<NumberedArrayItem<Item>[]> {
    readonly underlying: EArray<NumberedArrayItem<Item>> = new EArray;

    constructor(source: EReadCollection<Item[]>) {
        const self = this;

        source.subscribe({
            afterSplice(start, deleteItems, insertedItems, deletedItems) {
                // Splice the underlying array
                const itemsToInsert = insertedItems
                    .map((item, index) => {
                        return {
                            source: item,
                            selfNumber: new PropertyImpl<number>(start + index),
                        }
                    });
                self.underlying.splice(start, deleteItems, ...itemsToInsert);
                
                // Update the self numbers after the splice
                const delta = itemsToInsert.length - deleteItems;
                if(delta != 0) {
                    for(let i = start + insertedItems.length; i < self.underlying.length; i++) {
                        (self.underlying.at(i).selfNumber as Property<number>).value += delta;
                    }
                }
            },

            afterMove(from, into) {
                (self.underlying.at(from).selfNumber as Property<number>).value = into;
                (self.underlying.at(into).selfNumber as Property<number>).value = from;
            },

            update(at, newValue) {
                // ignore
            }
        });
    }

    at(i: number): NumberedArrayItem<Item> {
        return this.underlying.at(i);
    }

    get length(): number {
        return this.underlying.length;
    }
    
    subscribe(listener: EListener<NumberedArrayItem<Item>>): this {
        this.underlying.subscribe(listener);
        return this;
    }

    unsubscribe(listener: EListener<NumberedArrayItem<Item>>): this {
        this.underlying.unsubscribe(listener);
        return this;
    }

    findIndex(predicate: (value: NumberedArrayItem<Item>, index: number, obj: NumberedArrayItem<Item>[]) => boolean): number {
        return this.underlying.findIndex(predicate);
    }

    map<Result>(callbackFn: (it: NumberedArrayItem<Item>, index: number, self: EReadCollection<NumberedArrayItem<Item>[]>) => Result): Result[] {
        return this.underlying.map(callbackFn);
    }

    indexOf(item: NumberedArrayItem<Item>): number {
        return this.underlying.indexOf(item);
    }

    slice(start?: number, end?: number): NumberedArrayItem<Item>[] {
        return this.underlying.slice(start, end);
    }

    forEach(callbackFn: (it: NumberedArrayItem<Item>, index: number, self: EReadCollection<NumberedArrayItem<Item>[]>) => void): void {
        this.underlying.forEach(callbackFn);
    }

    find(criteria: (item: NumberedArrayItem<Item>) => boolean): NumberedArrayItem<Item> | undefined {
        return this.underlying.find(criteria);
    }

    touchAt(index: number): void {
        this.underlying.touchAt(index);
    }
}
