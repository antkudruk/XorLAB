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
 * Drag-and-drop controller for xorlab widgets: updates attrs fields, then refreshes placement.
 *
 * Card `mouseDown` / `mouseDrag` / `mouseUp` handlers call `begin` / `move` / `end`.
 * Controllers do not subscribe to pointer events themselves.
 *
 * On each active `move`, the controller:
 * 1. Invokes the app `updateAttrs` callback with the dragged card, region card, and event
 *    (the callback maps pointer coords via `ISeg.childSegAtCoord` / `CoordHelper` and mutates
 *    attrs fields).
 * 2. Calls {@link ICard.fire} on the **dragged** card so `selfPos` rebinds and CardVi refreshes
 *    DOM position through SegVi CSS.
 *
 * The controller does **not** manipulate HTML elements (no CSS classes, no `left`/`top`).
 *
 * Which placement axes move is decided solely by `updateAttrs`: mutate only the attrs fields
 * that should change. Fields left unchanged keep their `selfPos` targets after `fire()`
 * (e.g. timetable drag updates `weekday` / `hour` and leaves `groupId` / `teacherId` alone).
 *
 * Region scoping: construct one instance per interactive region with that region's card
 * (often a `*ListCard`). `begin` no-ops when the card is not nested under the region card
 * (`containsCard`). A shared `callbackTable` entry may fan events to several controllers —
 * do not re-check region identity inside handlers. The region card is also passed to
 * `updateAttrs` for coord helpers.
 *
 * Prefer CoordHelper / `fold` in `updateAttrs` for multi-level seg walks.
 * When `nested` is a uniform `EMapped` of one card kind, trust typed hits — no `typeName` guards.
 *
 * Wiring checklist:
 * 1. Construct with `{ regionCard, updateAttrs }` once the region card exists.
 * 2. Register `mouseDown` / `mouseDrag` / `mouseUp` (prefer `callbackTable` on the region card);
 *    resolve the nested card at `mouseDown`, then `begin(card, event)`, `move(event)`, `end(event)`.
 * 3. In app CSS, set `user-select: none` (and `-webkit-user-select: none`) on the
 *    draggable card / region `typeName` class so native text selection does not fight the
 *    drag gesture.
 *
 * @see ../../README.md#dragcontroller
 * @see ../../README.md#region-scoped-controllers
 */
import type { ICard } from "xorlab";
import type { CardCoord, MouseInteractionEvent } from "xorlab";

export type DragUpdateAttrs = (args: {
    readonly card: ICard;
    readonly regionCard: ICard;
    readonly event: MouseInteractionEvent;
}) => void;

export interface DragControllerOptions {
    readonly regionCard: ICard;
    readonly updateAttrs: DragUpdateAttrs;
}

/** Invokes `updateAttrs` then `card.fire()` while a region-scoped drag is active. */
export class DragController {
    private readonly updateAttrs: DragUpdateAttrs;
    private readonly _regionCard: ICard;
    private _isDragging = false;
    private _card?: ICard;
    private _startWidgetCoord?: CardCoord;

    constructor(options: DragControllerOptions) {
        this._regionCard = options.regionCard;
        this.updateAttrs = options.updateAttrs;
    }

    get isDragging(): boolean {
        return this._isDragging;
    }

    get startWidgetCoord(): CardCoord | undefined {
        return this._startWidgetCoord;
    }

    get regionCard(): ICard {
        return this._regionCard;
    }

    /** Card captured at `begin`, if any. */
    get draggedCard(): ICard | undefined {
        return this._card;
    }

    /** Marks the start of a press for a card in this region. */
    begin(card: ICard, event: MouseInteractionEvent): void {
        if (!this.containsCard(card)) {
            return;
        }
        this._card = card;
        this._startWidgetCoord = event.widget;
        this._isDragging = false;
    }

    /**
     * Marks an active drag, runs `updateAttrs`, then `card.fire()` on the card from `begin`.
     * Call from `mouseDrag` after Widget has crossed the movement threshold.
     */
    move(event: MouseInteractionEvent): void {
        const card = this._card;
        if (!card) {
            return;
        }
        this._isDragging = true;
        this.updateAttrs({
            card,
            regionCard: this._regionCard,
            event,
        });
        card.fire();
    }

    /** Clears drag session state. Call from `mouseUp`. */
    end(_event?: MouseInteractionEvent): void {
        this._isDragging = false;
        this._card = undefined;
        this._startWidgetCoord = undefined;
    }

    /** Resets drag session without requiring the card (e.g. destroy). */
    clear(): void {
        this._isDragging = false;
        this._card = undefined;
        this._startWidgetCoord = undefined;
    }

    /** True when `card` is nested under the region card. */
    containsCard(card: ICard): boolean {
        let found = false;
        this._regionCard.nested.forEach((nested) => {
            if (found) {
                return;
            }
            if (nested === card) {
                found = true;
            }
        });
        return found;
    }
}
