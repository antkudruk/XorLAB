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


export class BiProperty<A, B, Result> implements ReadOnlyProperty<Result> {

    private readonly _propertyA: ReadOnlyProperty<A>;
    private readonly _propertyB: ReadOnlyProperty<B>;
    private readonly _expression: (a: A, b: B) => Result;
    private readonly _underlying: Property<Result>;

    constructor(
        propertyA: ReadOnlyProperty<A>,
        propertyB: ReadOnlyProperty<B>,
        expression: (a: A, b: B) => Result
    ) {
        this._propertyA = propertyA;
        this._propertyB = propertyB;
        this._expression = expression;
        this._underlying = new PropertyImpl<Result>(this._expression(propertyA.value, propertyB.value));
        propertyA.subscribe({
            onChange: () => {
                this._underlying.value = this._expression(propertyA.value, propertyB.value);
            }
        });
        propertyB.subscribe({
            onChange: () => {
                this._underlying.value = this._expression(propertyA.value, propertyB.value);
            }
        });
    }
    
    get value(): Result {
        return this._underlying.value;
    }
    
    subscribe(listener: PropertyListener<Result>): void {
        return this._underlying.subscribe(listener);
    }
    
    unsubscribe(listener: PropertyListener<Result>): void {
        return this._underlying.unsubscribe(listener);
    }
}