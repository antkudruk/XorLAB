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

declare const __items: unique symbol;

export type ItemOf<Items extends any[]> = Items[number];

export interface EListener<Item> {
    afterSplice(
        start: number,
        deleteItems: number,
        insertedItems: Item[],
        deletedItems: Item[],
        processedCollection: EReadCollection<Item[]>
    ): void;
    afterMove(from: number, into: number, processedCollection: EReadCollection<Item[]>): void;
    update(at: number, newValue: Item): void;  // TODO: onsider removing
}

export type EObservableCollection<Items extends any[]> = {
    subscribe(listener: EListener<ItemOf<Items>>): void;
    unsubscribe(listener: EListener<ItemOf<Items>>): void;
}

/**
 * Read-only collection interface shared by cards, segments, and mapped collections.
 *
 * @remarks Do not annotate `find`, `forEach`, `map`, or `findIndex` callback parameters with
 * `any`. Prefer omitting annotations so the collection item type applies, or supply explicit
 * segment/card types from generated `GenSegments` / `GenCards`. Using `any` here is bad
 * practice and defeats type checking.
 */
export interface EReadCollection<Items extends any[]> extends EObservableCollection<Items> {
    readonly [__items]?: Items;
    at<Index extends keyof Items & number>(index: Index): Items[Index];
    at(index: number): ItemOf<Items>;
    find(callback: (item: ItemOf<Items>) => boolean): ItemOf<Items> | undefined;
    readonly length: number;
    forEach(callbackFn: (it: ItemOf<Items>, index: number, self: EReadCollection<Items>) => void): void;
    map<Result>(mapFunction: (item: ItemOf<Items>, index: number, self: EReadCollection<Items>) => Result): Result[];
    slice(start?: number, end?: number): ItemOf<Items>[];
    findIndex(predicate: (value: ItemOf<Items>, index: number, obj: ItemOf<Items>[]) => boolean): number;
    indexOf(item: ItemOf<Items>): number;
    // TODO: Probably, remove all touchAt methods at all?
    touchAt(index: number): void;
}

export interface ECollection<Items extends any[]> extends EReadCollection<Items> {
    push(...newItems: ItemOf<Items>[]): number;
    splice(start: number, deleteItems: number, ...newItems: ItemOf<Items>[]): ItemOf<Items>[];
    move(from: number, into: number): void;
    replace(itemToRemove: ItemOf<Items> | undefined, ...itemsToInsert: ItemOf<Items>[]): void;
}
