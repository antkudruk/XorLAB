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
 * Display-side multi-select controller for xorlab widgets.
 *
 * Like `SelectController`, but `value` is a `readonly T[]` and each card click
 * toggles membership. Programmatic `value` setter updates DOM without `onChange`.
 *
 * Wiring checklist:
 * 1. Construct with `selectClassName`, `getValue`, and `cardTypeName` or `cards`.
 * 2. Register `mouseClick` on selectable cards: `multiSelect.handleCardClick(self, event)`.
 * 3. After `mountWidget`, call `multiSelect.bindWidget(mounted.widget)`.
 * 4. Use a separate controller instance per interactive region of the same widget;
 *    do not couple regions through a shared instance.
 * 5. Optionally assign `multiSelect.onChange` to sync external app state.
 *
 * @see ../../README.md#multiselectcontroller
 * @see ../../README.md#region-scoped-controllers
 */
import type { ICard } from "xorlab";
import type { MouseInteractionEvent } from "xorlab";
import type { Widget } from "xorlab";
import { collectCardsByTypeName } from "./collectCards";

export interface MultiSelectControllerOptions<T> {
    readonly selectClassName: string;
    readonly getValue: (card: ICard) => T | undefined;
    readonly isEqual?: (a: T, b: T) => boolean;
    readonly onChange?: (newValue: readonly T[], oldValue: readonly T[]) => void;
    /** When set, cards are collected from the widget root on `bindWidget`. */
    readonly cardTypeName?: string;
    /** Explicit card list. Used when cards are known before mount. */
    readonly cards?: readonly ICard[];
}

/** Multi-select controller with `value` array and `onChange` bound to card DOM. */
export class MultiSelectController<T> {
    private _value: T[] = [];
    private _onChange?: (newValue: readonly T[], oldValue: readonly T[]) => void;
    private _cards: ICard[] = [];
    private readonly selectedElements: HTMLElement[] = [];
    private cardTreeUuid?: string;

    constructor(private readonly options: MultiSelectControllerOptions<T>) {
        this._onChange = options.onChange;
        if (options.cards) {
            this._cards = [...options.cards];
        }
    }

    get value(): readonly T[] {
        return this._value;
    }

    set value(newValue: readonly T[]) {
        if (this.arraysEqual(this._value, newValue)) {
            return;
        }
        this._value = [...newValue];
        this.applySelectionDom();
    }

    get onChange(): ((newValue: readonly T[], oldValue: readonly T[]) => void) | undefined {
        return this._onChange;
    }

    set onChange(callback: ((newValue: readonly T[], oldValue: readonly T[]) => void) | undefined) {
        this._onChange = callback;
    }

    /** Stores widget tree UUIDs and optionally collects cards by `cardTypeName`. */
    bindWidget(widget: Widget): void {
        this.cardTreeUuid = widget.treeUuids.card;
        if (this.options.cardTypeName) {
            this._cards = collectCardsByTypeName(widget.rootCardVi.source, this.options.cardTypeName);
        }
        this.applySelectionDom();
    }

    /** Registers selectable cards explicitly (overrides auto-collect from `bindWidget`). */
    registerCards(cards: readonly ICard[]): void {
        this._cards = [...cards];
        this.applySelectionDom();
    }

    /** Called from a card `mouseClick` handler. Toggles value membership and invokes `onChange`. */
    handleCardClick(card: ICard, event: MouseInteractionEvent): void {
        const clickedValue = this.options.getValue(card);
        if (clickedValue === undefined) {
            return;
        }
        const oldValue = [...this._value];
        const existingIndex = this._value.findIndex((item) => this.isEqual(item, clickedValue));
        if (existingIndex >= 0) {
            this._value = this._value.filter((_, index) => index !== existingIndex);
        } else {
            this._value = [...this._value, clickedValue];
        }
        this.cardTreeUuid = event.widgetTreeUuids.card;
        this.applySelectionDom();
        this._onChange?.(this._value, oldValue);
    }

    /** Clears all selections and removes CSS emphasis. */
    clear(): void {
        this.value = [];
    }

    private isEqual(a: T, b: T): boolean {
        return this.options.isEqual?.(a, b) ?? a === b;
    }

    private arraysEqual(a: readonly T[], b: readonly T[]): boolean {
        if (a.length !== b.length) {
            return false;
        }
        return a.every((item, index) => this.isEqual(item, b[index] as T));
    }

    private valueIncluded(value: T): boolean {
        return this._value.some((item) => this.isEqual(item, value));
    }

    private clearDom(): void {
        this.selectedElements.forEach((element) => {
            element.classList.remove(this.options.selectClassName);
        });
        this.selectedElements.length = 0;
    }

    private applySelectionDom(): void {
        this.clearDom();
        if (this._value.length === 0 || !this.cardTreeUuid) {
            return;
        }
        const uuid = this.cardTreeUuid;
        this._cards.forEach((card) => {
            const cardValue = this.options.getValue(card);
            if (cardValue === undefined || !this.valueIncluded(cardValue)) {
                return;
            }
            const vi = card.vis[uuid];
            if (vi?.htmlElement) {
                vi.htmlElement.classList.add(this.options.selectClassName);
                this.selectedElements.push(vi.htmlElement);
            }
        });
    }
}
