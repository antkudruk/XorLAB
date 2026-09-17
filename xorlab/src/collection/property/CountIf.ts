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

import { EListener, EReadCollection } from "../ECollection";
import { Property, PropertyImpl, PropertyListener, ReadOnlyProperty } from "./Property";


export class CountIf<Item> implements ReadOnlyProperty<number> {
    
    private _collection: EReadCollection<Item[]>;
    private _underlying: Property<number> = new PropertyImpl<number>(0);

    constructor(collection: EReadCollection<Item[]>, countedPredicate: (vi: Item) => boolean) {
        this._collection = collection;
        this._collection.subscribe(new CounterByPredicate<Item>(countedPredicate));
    }

    subscribe(listener: PropertyListener<number>): void {
        this._underlying.subscribe(listener);
    }
    unsubscribe(listener: PropertyListener<number>): void {
        this._underlying.subscribe(listener);
    }

    get value(): number {
        return this._underlying.value;
    }
}

export class CounterByPredicate<Item> implements EListener<Item> {
    private _counterProperty: Property<number> = new PropertyImpl<number>(0);
    private countedPredicate: (vi: Item) => boolean;

    constructor(countedPredicate: (vi: Item) => boolean) {
        this.countedPredicate = countedPredicate;
    }

    afterSplice(start: number, deleteItems: number, insertedItems: Item[], deletedItems: Item[]): void {
        this._counterProperty.value -= deletedItems.filter(this.countedPredicate).length;
        this._counterProperty.value += insertedItems.filter(this.countedPredicate).length;
    }

    afterMove(from: number, into: number): void {
        // ignore
    }

    update(at: number, newValue: Item): void {
        // TODO: Introduce oldValue end newValue. Then increase or decrease the counter
    }
}