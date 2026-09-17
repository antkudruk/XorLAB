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


import { Property, PropertyImpl, PropertyListener, ReadOnlyProperty } from "./Property";


export class MapProperty<A, R> {
    private readonly _propertyA: ReadOnlyProperty<A>
    private readonly _expression: (a: A) => R
    private readonly _underlying: Property<R>

    constructor(
        propertyA: ReadOnlyProperty<A>,
        expression: (a: A) => R
    ) {
        this._propertyA = propertyA;
        this._expression = expression;
        this._underlying = new PropertyImpl<R>(this._expression(propertyA.value));
        propertyA.subscribe({
            onChange: () => {
                this._underlying.value = this._expression(propertyA.value);
            }
        });
    }

    get value(): R {
        return this._underlying.value;
    }

    subscribe(listener: PropertyListener<R>): void {
        return this._underlying.subscribe(listener);
    }

    unsubscribe(listener: PropertyListener<R>): void {
        return this._underlying.unsubscribe(listener);
    }
}