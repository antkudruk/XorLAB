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
 * Display-side hover feedback for xorlab widgets.
 *
 * Segment and card `mouseOver` handlers call `highlightCards`; controllers do not
 * subscribe to pointer events themselves. Emphasis is ephemeral — each call clears
 * the previous highlight on that controller instance.
 *
 * Wiring checklist:
 * 1. Create one `HoverController` per independent highlight axis / region (CSS modifier class).
 * 2. Register `mouseOver` on the relevant `segFactory` / `cardFactory` call.
 * 3. Filter `self.cards` by header `typeName` (or pass `[self]` for leaf cards).
 * 4. Call `highlightCards(cards, event)` — always pass `event` for widget-scoped DOM.
 * 5. Use a separate controller instance per interactive region of the same widget;
 *    do not couple regions through a shared instance.
 *
 * A model may use multiple HoverController instances and mount in multiple Widget hosts;
 * each controller tracks only the DOM it emphasizes.
 *
 * @see ../../README.md#hovercontroller
 * @see ../../README.md#region-scoped-controllers
 */
import type { ICard } from "xorlab";
import type { MouseInteractionEvent } from "xorlab";

/** Tracks emphasized DOM elements and applies or clears hover feedback via CSS class. */
export class HoverController {
    private readonly highlightedElements: HTMLElement[] = [];

    constructor(private readonly hoverClassName: string) {}

    /** Removes emphasis from all elements tracked by this controller. */
    clear(): void {
        this.highlightedElements.forEach((element) => {
            element.classList.remove(this.hoverClassName);
        });
        this.highlightedElements.length = 0;
    }

    /** Clears previous emphasis, then highlights the given cards in the event widget. */
    highlightCards(cards: readonly ICard[], event: MouseInteractionEvent): void {
        const cardTreeUuid = event.widgetTreeUuids.card;
        this.clear();
        cards.forEach((card) => {
            const vi = card.vis[cardTreeUuid];
            if (vi?.htmlElement) {
                vi.htmlElement.classList.add(this.hoverClassName);
                this.highlightedElements.push(vi.htmlElement);
            }
        });
    }
}
