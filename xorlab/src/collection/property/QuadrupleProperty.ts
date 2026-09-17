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

export class QuadrupleProperty<A, B, C, D, Result> implements Property<Result> {
    private readonly _propertyA: ReadOnlyProperty<A>
    private readonly _propertyB: ReadOnlyProperty<B>
    private readonly _propertyC: ReadOnlyProperty<C>
    private readonly _propertyD: ReadOnlyProperty<D>
    private readonly _expression: (a: A, b: B, c: C, d: D) => Result
    private readonly _underlying: Property<Result>

    constructor(
        propertyA: ReadOnlyProperty<A>,
        propertyB: ReadOnlyProperty<B>,
        propertyC: ReadOnlyProperty<C>,
        propertyD: ReadOnlyProperty<D>,
        expression: (a: A, b: B, c: C, d: D) => Result
    ) {
        this._propertyA = propertyA;
        this._propertyB = propertyB;
        this._propertyC = propertyC;
        this._propertyD = propertyD;
        this._expression = expression;
        this._underlying = new PropertyImpl<Result>(this._expression(propertyA.value, propertyB.value, propertyC.value, propertyD.value));
        propertyA.subscribe({
            onChange: () => {
                this._underlying.value = this._expression(propertyA.value, propertyB.value, propertyC.value, propertyD.value);
            }
        });
        propertyB.subscribe({
            onChange: () => {
                this._underlying.value = this._expression(propertyA.value, propertyB.value, propertyC.value, propertyD.value);
            }
        });
        propertyC.subscribe({
            onChange: () => {
                this._underlying.value = this._expression(propertyA.value, propertyB.value, propertyC.value, propertyD.value);
            }
        });
        propertyD.subscribe({
            onChange: () => {
                this._underlying.value = this._expression(propertyA.value, propertyB.value, propertyC.value, propertyD.value);
            }
        });
    }

    public get value(): Result {
        return this._underlying.value;
    }

    public subscribe(listener: PropertyListener<Result>): void {
        return this._underlying.subscribe(listener);
    }

    public unsubscribe(listener: PropertyListener<Result>): void {
        return this._underlying.unsubscribe(listener);
    }
}
