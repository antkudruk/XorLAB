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

export class EMapped<S, R> implements EReadCollection<R[]> {
    
    private _underlying: EArray<R>;
    private _source: EReadCollection<S[]> | null;
    private _listener: EListener<S>;

    constructor(source: EReadCollection<S[]> | null, factory: ((src: S, newIndex: number, source: EReadCollection<S[]>) => R)) {
        this._source = source;
        this._underlying = new EArray<R>();
        const self = this;  // <!-- TODO: Find a solution better thatn `self` variable
        this._listener = {
            afterSplice(start: number, deleteItems: number, insertItems: S[]): R[] {
                const insertedItemsDst = insertItems.map((item, index) => {
                    if(!self._source) {
                        throw "Program error: trying to splice elements on the empty array.";
                    }
                    return factory(item, start + index, self._source);
                });
                return self._underlying.splice(start, deleteItems, ...insertedItemsDst);
            },
        
            afterMove(from: number, into: number): EListener<S> {
                self._underlying.move(from, into);
                return this;
            },

            update(at: number, newValue: S): void {
                // ignore
            }
        };
        this._source?.subscribe?.(this._listener);
    }

    touchAt(index: number) {
        this._underlying.touchAt(index);
    }

    indexOf(item: R): number {
        return this._underlying.indexOf(item);
    }

    slice(start?: number | undefined, end?: number | undefined): R[] {
        return this._underlying.slice(start, end);
    }

    find(criteria: (item: R) => boolean): R | undefined {
        return this._underlying.find(criteria);
    }

    forEach(callbackFn: (it: R, index: number, self: EReadCollection<R[]>) => void): void {
        this._underlying.forEach(callbackFn);
    }

    map<Result>(callbackFn: (it: R, index: number, self: EReadCollection<R[]>) => Result): Result[] {
        return this._underlying.map(callbackFn);
    }

    at(index: number): R {
        return this._underlying.at(index);
    }

    // TODO: Replace with findIndex
    findIndex(criteria: (value: R, index: number, obj: R[]) => boolean): number {
        return this._underlying.findIndex(criteria);
    }

    subscribe(listener: EListener<R>): this {
        this._underlying.subscribe(listener);
        return this;
    }

    unsubscribe(listener: EListener<R>): this {
        this._underlying.unsubscribe(listener);
        return this;
    }

    replace(source: EReadCollection<S[]> | null): this {
        if(source !== this._source) {
            this._source?.unsubscribe(this._listener);
            this._underlying.splice(0, this._underlying.length);
            this._source = source;
            if(!!source) {
                source.subscribe(this._listener);
            }
        }
        return this;
    }

    get source() {
        return this._source;
    }
    
    get length(): number {
        return this._underlying.length;
    }
};
