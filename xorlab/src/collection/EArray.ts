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


import { ECollection, EListener, EReadCollection } from "./ECollection";

export class EArray<Item> implements ECollection<Item[]> {
    private _listeners: EListener<Item>[] = [];
    private _items: Item[] = [];

    constructor(...initial: Item[]) {
        this._items = [...initial];
    }

    indexOf(item: Item): number {
        return this._items.indexOf(item);
    }

    slice(start?: number | undefined, end?: number | undefined): Item[] {
        return this._items.slice(start, end);
    }

    map<Result>(callbackFn: (it: Item, index: number, self: EReadCollection<Item[]>) => Result): Result[] {
        return this._items.map((it, index) => callbackFn(it, index, this));
    }

    forEach(callbackFn: (it: Item, index: number, self: EReadCollection<Item[]>) => void): void {
        this._items.forEach((t, i, a) => callbackFn(t, i, this));
    }

    at(index: number): Item {
        return this._items[index];
    }

    set(at: number, item: Item): void {
        this._items[at] = item;
        this._listeners.forEach(listener => listener.update(at, item));
    }

    insert(at: number, items: Item[]): void {
        this.splice(at, 0, ...items);
    }

    find(criteria: (r: Item) => boolean): Item | undefined {
        return this._items.find(criteria);
    }

    findIndex(criteria: (value: Item, index: number, obj: Item[]) => boolean): number {
        return this._items.findIndex(criteria);
    }

    push(...newItems: Item[]): number {
        const start = this.length;
        const result = this._items.push(...newItems);
        this._listeners.forEach(e => e.afterSplice(start, 0, newItems, [], this));
        return result;
    }

    splice(start: number, deleteItems: number, ...newItems: Item[]): Item[] {
        const result: Item[] = this._items.splice(start, deleteItems, ...newItems);
        this._listeners.forEach(e => e.afterSplice(start, deleteItems, newItems, result, this));
        return result;
    }

    move(from: number, into: number): void {
        const itemToInsert = this._items.splice(from, 1);
        this._items.splice(into, 0, ...itemToInsert);
        this._listeners.forEach(e => e.afterMove(from, into, this));
    }

    replace(itemToRemove: Item | undefined, ...itemsToInsert: Item[]) {
        if(!!itemToRemove) {
            this._items.splice(
                this._items.indexOf(itemToRemove),
                1,
                ...itemsToInsert
            );
        } else {
            this._items.splice(
                this._items.length,
                0,
                ...itemsToInsert
            );
        }
    }

    subscribe(listener: EListener<Item>): void {
        this._listeners.push(listener);
        listener.afterSplice(0, 0, this._items, [], this);
    }

    unsubscribe(listener: EListener<Item>): void {
        const index = this._listeners.indexOf(listener);
        if (index !== -1) {
            this._listeners.splice(index, 1);
        }
    }

    get length(): number {
        return this._items.length;
    }

    // TODO: Probably, remove all touchAt methods at all?
    touchAt(index: number) {
        this._listeners.forEach(it => it.update(index, this._items[index]));
    }
}
