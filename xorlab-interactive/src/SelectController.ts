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
 * Display-side single-select controller for xorlab widgets.
 *
 * Binds a domain value to one or more card DOM elements via a CSS modifier class.
 * `value` can be set programmatically (updates DOM only) or via user commit paths
 * (`handleCardClick` / `commitValue`) which also invoke `onChange`.
 *
 * Two value modes:
 * - **Card value** — `T` comes from a clicked card via `getValue` (`handleCardClick`).
 *   Periodic-table `ElementCard` selection uses this mode.
 * - **Slot value** — `T` is a segment-intersection location (e.g. weekday/hour/group).
 *   Nest a [Type Partition](../../README.md#type-partition-pattern) display card only while
 *   a slot is selected (complete attrs). Call `fire()`, `registerCards` if needed, then
 *   `commitValue(slot, event)`. Do **not** gate the display card's `selfPos` on
 *   completeness checks — if the card is nested, attrs are complete; if nothing is
 *   selected, the card is absent and `selfPos` never runs.
 *   DOM emphasis still targets the display card via `getValue` / `cardTypeName`.
 *
 * Wiring checklist:
 * 1. Construct with `selectClassName`, `getValue`, and `cardTypeName` or `cards`.
 * 2. Register `mouseClick`: `select.handleCardClick(self, event)` (card mode) or
 *    resolve a slot and call `select.commitValue(slot, event)` (slot mode).
 * 3. After `mountWidget`, call `select.bindWidget(mounted.widget)` on each controller
 *    instance bound to that widget (a model may use several SelectControllers).
 * 4. Use a separate controller instance per interactive region of the same widget;
 *    do not couple regions through a shared instance.
 * 5. Optionally assign `select.onChange` to sync external app state.
 *
 * @see ../../README.md#selectcontroller
 * @see ../../README.md#region-scoped-controllers
 * @see ../../README.md#type-partition-pattern
 */
import type { ICard } from "xorlab";
import type { MouseInteractionEvent } from "xorlab";
import type { Widget } from "xorlab";
import { collectCardsByTypeName } from "./collectCards";

export interface SelectControllerOptions<T> {
    readonly selectClassName: string;
    readonly getValue: (card: ICard) => T | undefined;
    readonly isEqual?: (a: T, b: T) => boolean;
    readonly onChange?: (newValue: T | undefined, oldValue: T | undefined) => void;
    /** When set, cards are collected from the widget root on `bindWidget`. */
    readonly cardTypeName?: string;
    /** Explicit card list (e.g. `elementListCard.nested`). Used when cards are known before mount. */
    readonly cards?: readonly ICard[];
}

/** Single-select controller with `value` and `onChange` bound to card DOM. */
export class SelectController<T> {
    private _value: T | undefined;
    private _onChange?: (newValue: T | undefined, oldValue: T | undefined) => void;
    private _cards: ICard[] = [];
    private readonly selectedElements: HTMLElement[] = [];
    private cardTreeUuid?: string;

    constructor(private readonly options: SelectControllerOptions<T>) {
        this._onChange = options.onChange;
        if (options.cards) {
            this._cards = [...options.cards];
        }
    }

    get value(): T | undefined {
        return this._value;
    }

    set value(newValue: T | undefined) {
        if (this.valuesEqual(this._value, newValue)) {
            return;
        }
        this._value = newValue;
        this.applySelectionDom();
    }

    get onChange(): ((newValue: T | undefined, oldValue: T | undefined) => void) | undefined {
        return this._onChange;
    }

    set onChange(callback: ((newValue: T | undefined, oldValue: T | undefined) => void) | undefined) {
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

    /** Called from a card `mouseClick` handler. Updates value, DOM, and invokes `onChange`. */
    handleCardClick(card: ICard, event: MouseInteractionEvent): void {
        const newValue = this.options.getValue(card);
        if (newValue === undefined) {
            return;
        }
        this.commitValue(newValue, event);
    }

    /**
     * Commits a selection value from outside `getValue(clickedCard)` — e.g. a segment
     * intersection resolved from pointer coords. Updates DOM and invokes `onChange`.
     * For slot mode, update the display card attrs and call `fire()` before this.
     */
    commitValue(newValue: T | undefined, event?: MouseInteractionEvent): void {
        const oldValue = this._value;
        if (this.valuesEqual(oldValue, newValue)) {
            return;
        }
        this._value = newValue;
        if (event) {
            this.cardTreeUuid = event.widgetTreeUuids.card;
        }
        this.applySelectionDom();
        this._onChange?.(newValue, oldValue);
    }

    /** Clears selection and removes CSS emphasis. */
    clear(): void {
        this.value = undefined;
    }

    private valuesEqual(a: T | undefined, b: T | undefined): boolean {
        if (a === undefined && b === undefined) {
            return true;
        }
        if (a === undefined || b === undefined) {
            return false;
        }
        return this.isEqual(a, b);
    }

    private isEqual(a: T, b: T): boolean {
        return this.options.isEqual?.(a, b) ?? a === b;
    }

    private clearDom(): void {
        this.selectedElements.forEach((element) => {
            element.classList.remove(this.options.selectClassName);
        });
        this.selectedElements.length = 0;
    }

    private applySelectionDom(): void {
        this.clearDom();
        if (this._value === undefined || !this.cardTreeUuid) {
            return;
        }
        const uuid = this.cardTreeUuid;
        this._cards.forEach((card) => {
            const cardValue = this.options.getValue(card);
            if (cardValue === undefined || !this.isEqual(cardValue, this._value as T)) {
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
