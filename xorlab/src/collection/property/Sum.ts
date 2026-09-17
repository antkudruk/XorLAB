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

import { EReadCollection } from "../ECollection";
import { PropertyListener, ReadOnlyProperty } from "./Property";

import { Property, PropertyImpl } from "./Property";


export class Sum<Item> implements ReadOnlyProperty<number> {
    
    private _underlying: Property<number> = new PropertyImpl<number>(0);

    constructor(collection: EReadCollection<Item[]>, propertyGetter: (item: Item) => Property<number>) {
        collection.subscribe({
            afterSplice: (_, __, items, deletedItems) => {
                const deletedProps = deletedItems
                    .map(propertyGetter);

                const insertedProps = items
                    .map(propertyGetter);

                this._underlying.value -= 
                    deletedProps
                    .map(t => t.value)
                    .reduce((a, b) => a + b, 0);

                this._underlying.value += insertedProps
                    .map(t => t.value)
                    .reduce((a, b) => a + b, 0);
                
                insertedProps.forEach(it => it.subscribe(eventHandler));
                
                deletedProps.forEach(it => it.unsubscribe(eventHandler));
            },
            afterMove: (_, __) => {
                // ignore
            },
            update: (at, newValue) => {
                // TODO: Introduce oldValue end newValue. Then increase or decrease the counter
            }
        });

        const self = this;
        const eventHandler = {
            onChange(oldValue: number, newValue: number): void {
                self._underlying.value += (newValue - oldValue);
            }
        };
    }
    
    get value(): number {
        return this._underlying.value;
    }
    
    subscribe(listener: PropertyListener<number>): void {
        this._underlying.subscribe(listener);
    }
    
    unsubscribe(listener: PropertyListener<number>): void {
        this._underlying.unsubscribe(listener);
    }
}