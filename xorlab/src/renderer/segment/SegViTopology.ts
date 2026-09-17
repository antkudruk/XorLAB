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

import { CardVi } from "../CardVi";
import { SegPropsAdapter } from "../SegPropsAdapters";
import { SegVi } from "./SegVi";

export interface SegViTopologyProps {
    cssUpdater: SegPropsAdapter;
}

export interface AlignedCardDescriptor {
    readonly cardVi: CardVi;
    readonly wholePlace: boolean;       // TODO: Make up a better variable name
}

export class SegViTopology {
    
    private readonly context: SegVi;
    readonly cssUpdater: SegPropsAdapter;
    private _alignedCards: {[cardId: string]: AlignedCardDescriptor} = {};

    constructor(props: SegViTopologyProps, context: SegVi) {
        this.context = context;
        this.cssUpdater = props.cssUpdater;
    }

    subscribeCardVi(cardVi: CardVi, wholePlace: boolean): void {
        this._alignedCards[cardVi.id] = {cardVi, wholePlace};
    }

    unsubscribeCardVi(cardVi: CardVi): void {
        delete this._alignedCards[cardVi.id];
    }

    forEachAlignedCard(callback: (cardVi: CardVi) => void): void {
        Object
            .values(this._alignedCards)
            .forEach(({ cardVi }) => callback(cardVi));
    }

    updateCardViCss(cardVis: CardVi, offset: number) {
        this.updateChildCardElement(cardVis.htmlElement, offset);
    }

    updateChildCardElement(htmlElement: HTMLElement | undefined, offset: number) {
        if(!!htmlElement) {
            this.cssUpdater.patchProps(
                htmlElement.style, 
                // TODO: Consider triggering once a property gets changed
                {offset, window: this.context.window.value}
            );
            htmlElement.style.overflow="hidden";
        }
    }

    touchCardsWidth() {
        Object
            .values(this._alignedCards)
            .map(t => t.cardVi)
            .forEach(cardVi => {
                if(!!cardVi.htmlElement) {
                    this.cssUpdater.patchProps(
                        cardVi.htmlElement.style, 
                        // TODO: Consider triggering once a property gets changed
                        {window: this.context.window.value}
                    );
                }
            });
    }

    resizeCardVis(value: number) {
        Object
            .values(this._alignedCards)
            .map(t => t.cardVi)
            .forEach(cardVi => {
                if(!!cardVi.htmlElement) {
                    this.cssUpdater.patchProps(
                        cardVi.htmlElement.style, 
                        // TODO: Consider triggering once a property gets changed
                        {window: value}
                    );
                }
            })
    }

    private computeCardOffset(cardVi: CardVi): number {
        const direction = this.cssUpdater.direction;
        const placeId = cardVi.parent.viBasis[direction].source.id;
        let offsetAcc = 0;
        let currentSegVi: SegVi | undefined = this.context;

        while (currentSegVi && placeId !== currentSegVi.source.id) {
            offsetAcc += currentSegVi.displayCoordinate.value;
            currentSegVi = currentSegVi.parent;
        }

        return offsetAcc;
    }

    shiftCardVis() {
        const cards = Object.values(this._alignedCards);
        const shifted = cards.filter(t => !t.wholePlace);
        shifted
            .forEach(({ cardVi }) => {
                if (!cardVi.htmlElement) {
                    return;
                }
                const offset = this.computeCardOffset(cardVi);
                this.cssUpdater.patchProps(
                    cardVi.htmlElement.style,
                    { offset },
                );
            });
    }
}