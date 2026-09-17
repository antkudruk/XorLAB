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


/**
 * Listener notified when a {@link Property} value changes.
 * Used for reactive layout updates outside drag-and-drop (drag prefers plain attrs + `card.fire()`).
 */
export interface PropertyListener<T> {
    onChange(oldValue: T | undefined, newValue: T): void;
}

export interface ReadOnlyProperty<T> {
    readonly value: T;
    subscribe(listener: PropertyListener<T>): void;
    unsubscribe(listener: PropertyListener<T>): void;
}

export interface Property<T> extends ReadOnlyProperty<T> {
    value: T;
}

/**
 * Default {@link Property} implementation. Setting `value` notifies subscribers when
 * the new value is strictly unequal (`!==`) to the previous one.
 *
 * @see ../../../README.md#property-reactive-fields
 */
export class PropertyImpl<T> implements Property<T> {
    private _value: T;
    private _listeners: Set<PropertyListener<T>> = new Set();

    constructor(initialValue: T) {
        this._value = initialValue;
    }

    get value(): T {
        return this._value;
    }

    set value(newValue: T) {
        const oldValue = this._value;
        this._value = newValue;
        if(newValue !== oldValue) {
            this
                ._listeners
                .forEach(listener => listener.onChange(oldValue, newValue));
        }
    }
    
    subscribe(listener: PropertyListener<T>): void {
        this._listeners.add(listener);
    }
    
    unsubscribe(listener: PropertyListener<T>): void {
        this._listeners.delete(listener);
    }
}
