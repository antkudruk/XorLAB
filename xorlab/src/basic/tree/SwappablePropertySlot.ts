/*
    Copyright 2023 - Present Anton Kudruk
   Licensed under the Apache License, Version 2.0 (the "License");
   you may not use this file except in compliance with the License.
   You may obtain a copy of the License at
       http://www.apache.org/licenses/LICENSE-2.0
   Unless required by applicable law or agreed to in writing, software
   distributed under the License is distributed on an "AS IS" BASIS,
   WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
    10|   See the License for the specific language governing permissions and
   limitations under the License.
 */

import { Property, PropertyImpl, PropertyListener, ReadOnlyProperty } from "../../collection/property/Property";

/**
 * Stable {@link ReadOnlyProperty} that follows whichever source
 * {@link swap} binds via `propertyProvider`. {@link clear} releases the source
 * and resets to `undefined` (notifies when the value actually changes).
 */
export class SwappablePropertySlot<Input, P> implements ReadOnlyProperty<P | undefined> {

    private readonly propertyProvider: (input: Input) => ReadOnlyProperty<P>;
    private _input: Input | undefined;
    private _srcProperty: ReadOnlyProperty<P> | undefined;
    private readonly underlyingProperty: Property<P | undefined> = new PropertyImpl<P | undefined>(undefined);

    private readonly listener: PropertyListener<P>;

    constructor(propertyProvider: (input: Input) => ReadOnlyProperty<P>) {
        this.propertyProvider = propertyProvider;
        const self = this;
        this.listener = {
            onChange(_oldValue: P | undefined, newValue: P) {
                self.underlyingProperty.value = newValue;
            }
        };
    }

    get value(): P | undefined {
        return this.underlyingProperty.value;
    }

    subscribe(listener: PropertyListener<P | undefined>): void {
        this.underlyingProperty.subscribe(listener);
    }

    unsubscribe(listener: PropertyListener<P | undefined>): void {
        this.underlyingProperty.unsubscribe(listener);
    }

    /**
     * Bind to the property for `input`. Notifies slot listeners once when the
     * mirrored value changes (`!==`); same-value swaps are silent.
     */
    swap(input: Input): void {
        this._srcProperty?.unsubscribe(this.listener);
        this._input = input;
        this._srcProperty = this.propertyProvider(this._input);
        this._srcProperty.subscribe(this.listener);
        // Single assignment — PropertyImpl notifies only when !== previous.
        this.underlyingProperty.value = this._srcProperty.value;
    }

    /**
     * Release the current source and reset the mirrored value to `undefined`.
     * Notifies when the previous value was not already `undefined`.
     */
    clear(): void {
        this._srcProperty?.unsubscribe(this.listener);
        this._srcProperty = undefined;
        this._input = undefined;
        this.underlyingProperty.value = undefined;
    }
}
