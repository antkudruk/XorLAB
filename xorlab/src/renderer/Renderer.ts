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

import { Basis } from "../basic";
import type { ISeg } from "../facade/line";
import { CardVi } from "./CardVi";

/**
 * Card surface passed to renderers: attributes plus basis/self-position hooks
 * used by some built-in renderers. Does not depend on nested-card or self-pos generics.
 */
export interface RendererCard<Attributes extends {} = {}> {
    readonly attrs: Attributes;
    getBasis(): Basis;
    getSelfPos(): { [name: string]: ISeg };
}

export interface Renderer<Attributes extends {} = any> {
    updateCardHtmlelement(value: RendererCard<Attributes>, cardElement: HTMLElement, cardVi: CardVi): void;
    /**
     * When true, CardVi skips creating a DOM node for this card until a painted
     * (non-empty, non-shell) descendant exists.
     */
    readonly omitDomUntilPainted?: boolean;
}

export const EMPTY_RENDERER: Renderer = {
    updateCardHtmlelement(_value: RendererCard, _cardElement: HTMLElement, _cardVi: CardVi): void {
        // Intentionally empty: layout-only cards or containers updated by nested widgets.
    },
};

/**
 * Layout shell with no paint of its own; CardVi omits DOM until a painted main
 * appears in the subtree. Used by tree cards and their nested tables.
 */
export const OMIT_UNTIL_PAINTED_SHELL_RENDERER: Renderer = {
    omitDomUntilPainted: true,
    updateCardHtmlelement(_value: RendererCard, _cardElement: HTMLElement, _cardVi: CardVi): void {
        // Intentionally empty: shell only; main card / nested content paint.
    },
};

export const INVALID_BASIS_RENDERER: Renderer = {
    updateCardHtmlelement(_value: RendererCard, cardElement: HTMLElement, _cardVi: CardVi): void {
        cardElement.innerText = "Error: INVALID BASIS";
    }
}

export interface ValueCardAttributes {
    readonly value: string;
}

export interface TextCardAttributes {
    readonly text: string;
}

export const VALUE_RENDERER: Renderer<ValueCardAttributes> = {
    updateCardHtmlelement(value, cardElement, _cardVi): void {
        cardElement.style.display = "flex";
        cardElement.style.alignItems = "center";
        cardElement.style.justifyContent = "center";
        cardElement.style.boxSizing = "border-box";
        cardElement.style.padding = "2px";

        cardElement.replaceChildren();
        const textEl = document.createElement("span");
        textEl.style.maxWidth = "100%";
        textEl.style.overflowWrap = "break-word";
        textEl.style.wordBreak = "break-word";
        textEl.style.textAlign = "center";
        textEl.textContent = value.attrs.value;
        cardElement.appendChild(textEl);
    },
};

export const TEXT_RENDERER: Renderer<TextCardAttributes> = {
    updateCardHtmlelement(value, cardElement, _cardVi): void {
        cardElement.textContent = value.attrs.text;
    },
};

export function textRendererFactory<Attributes extends {}>(
    expression: (value: RendererCard<Attributes>) => string
) {
    return new TextRenderer(expression);
}

export class TextRenderer<Attributes extends {}> implements Renderer<Attributes> {

    private readonly textRenderer: (value: RendererCard<Attributes>) => string;

    constructor(textRenderer: (value: RendererCard<Attributes>) => string) {
        this.textRenderer = textRenderer;
    }

    updateCardHtmlelement(value: RendererCard<Attributes>, cardElement: HTMLElement, _cardVi: CardVi): void {
        cardElement.innerText = this.textRenderer(value);
    }
}
