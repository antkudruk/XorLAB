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

import { BasisPatch, PatchBasisResult } from "../basic";
import type { ICard } from "../facade/card";
import { EReadCollection } from "../collection/ECollection";
import { EMapped } from "../collection/EMapped";
import { SegVi, isSegViOrAncestorCollapsed } from "./segment/SegVi";
import { ElementMetaFactory } from "./ElementFactory";
import { v4 as uuidv4 } from 'uuid';
import { EStyleSheet } from "./Size";
import {
    childCardAtCoordFromCardVi,
} from "./CoordHitTest";
import type { CardCoord } from "./MouseInteraction";
import { EMPTY_RENDERER } from "./Renderer";
export type Direction = "VERTICAL" | "HORIZONTAL";

export interface HasHtmlElement {
    readonly htmlElement?: HTMLElement;
    readonly viBasis: { [seg in Direction]: SegVi }
}

export interface AfterSetBasisEvent {
    readonly patchResult: PatchBasisResult;
    readonly basisPart: BasisPatch;
}

/**
 * Visual instance of an {@link ICard} in one Widget mount.
 *
 * Widget fully owns CardVi (create, rebind, collapse/expand, destroy). Application
 * and example code must not store CardVi; look up `card.vis[treeUuid]` at the call site.
 *
 * @see ../../README.md#cardvi-and-segvi
 */
export class CardVi implements HasHtmlElement {
    private readonly _id: string;
    readonly parent: HasHtmlElement;

    private _source: ICard;
    private _htmlElement?: HTMLElement;
    private _nested: EReadCollection<CardVi[]>;
    // TODO: Probably, it might be reused from the Card class.
    private _viBasis: { [seg in Direction]: SegVi };
    /** Card + H/V place typeNames last applied by {@link syncFrameworkClassNames}. */
    private _managedClassNames: string[] = [];

    // Widget: 
    private _treeUuid: string;
    private _elementMetaFactory: ElementMetaFactory;
    private _stylesheet: EStyleSheet; 
    
    constructor(props: {
        parent: HasHtmlElement,
        treeUuid: string,
        source: ICard,
        stylesheet: EStyleSheet,
        elementMetaFactory: ElementMetaFactory,
        basis: { [seg in Direction]?: SegVi }
    }) {
        this._id = uuidv4();
        this.parent = props.parent;
        this._treeUuid = props.treeUuid;
        this._source = props.source;
        this._elementMetaFactory = props.elementMetaFactory;
        this._stylesheet = props.stylesheet;
        if (!props.basis.HORIZONTAL || !props.basis.VERTICAL) {
            throw new Error("CardVi requires both HORIZONTAL and VERTICAL place SegVi");
        }
        this._viBasis = {
            HORIZONTAL: props.basis.HORIZONTAL,
            VERTICAL: props.basis.VERTICAL,
        };

        // Initiation:
        this._source.addWidget(this);

        // TODO: This EMapped should be unsubscribed from the source array listener once the CardVi instance gets removed
        // TODO: Use more than one nested collections for a source
        this._nested = new EMapped(
            this._source.nested, 
            // this.cardViFactory.bind(this)
            (nesCell: ICard) => this.cardViFactory(nesCell)
        );

        // TODO: Find a better solution. 
        // TODO: Unsubscribe the listener/
        this._nested.subscribe({
            afterSplice: (start: number, deleteItems: number, insertedItems: CardVi[], deletedItems: CardVi[]) => {
                deletedItems.forEach(it => it.removeElement());
                if (this.shouldOmitEmptyShell()) {
                    this.detachHtml();
                    return;
                }
                this.ensureAttachedForNested();
                if(!!this._htmlElement) {
                    insertedItems.forEach(it => it.attachHtml());
                    // TODO:
                    // @ts-ignore
                    this._source.renderer.updateCardHtmlelement(this._source, this._htmlElement, this);
                }
            }, afterMove: () => {
                if(!!this._htmlElement) {
                    // TODO:
                    // @ts-ignore
                    this._source.renderer.updateCardHtmlelement(this._source, this._htmlElement, this);
                }
            }, update: () => {
                if (this.shouldOmitEmptyShell()) {
                    this.detachHtml();
                    return;
                }
                this.ensureAttachedForNested();
                if(!!this._htmlElement) {
                    // TODO:
                    // @ts-ignore
                    this._source.renderer.updateCardHtmlelement(this._source, this._htmlElement, this);
                }
            }
        })

        // TODO: Render the div immediately
    }

    get id(): string {
        return this._id;
    }

    private cardViFactory(newNestedCard: ICard) {

        if(! newNestedCard) {
            throw new Error("Nested card is undefined");
        }
        
        // TODO: Try DRY as the same code part in this file
        const newBasis: {[placeId in Direction]?: SegVi} = {};
        (["VERTICAL", "HORIZONTAL"] as Direction[])
            .forEach((dir: Direction) => {
                const selfSegVi = this._viBasis[dir];
                const selfSegId = selfSegVi.source.id;
                const selfSegTreeUuid = selfSegVi.treeUuid;
                const segById = newNestedCard.getBasis().findBySegId(selfSegId);
                if(!!segById) {
                    const nestedSegVi = segById.getViByUuid(selfSegTreeUuid);
                    if (nestedSegVi) {
                        newBasis[dir] = nestedSegVi;
                    }
                }
            });

        if (!newBasis.HORIZONTAL) {
            newBasis.HORIZONTAL = this._viBasis.HORIZONTAL;
        }
        if (!newBasis.VERTICAL) {
            newBasis.VERTICAL = this._viBasis.VERTICAL;
        }

        if (!newBasis.HORIZONTAL || !newBasis.VERTICAL) {
            const missing = [
                !newBasis.HORIZONTAL ? "HORIZONTAL" : undefined,
                !newBasis.VERTICAL ? "VERTICAL" : undefined,
            ].filter(Boolean).join(" and ");
            throw new Error(
                `CardVi requires both HORIZONTAL and VERTICAL place SegVi for card "${newNestedCard.typeName}" (missing ${missing})`,
            );
        }

        const newCardVi = new CardVi({
            parent: this,
            treeUuid: this._treeUuid,
            source: newNestedCard,
            elementMetaFactory: this._elementMetaFactory,
            basis: {
                HORIZONTAL: newBasis.HORIZONTAL,
                VERTICAL: newBasis.VERTICAL,
            },
            stylesheet: this._stylesheet
        });

        return newCardVi;
    }
    
    afterSetBasis(event: AfterSetBasisEvent) {

        let needsRerender = false;
        for (const dir of ["VERTICAL", "HORIZONTAL"] as Direction[]) {
            const placeSegment = this.parent.viBasis[dir];
            const placeId = placeSegment.source.id;
            if (!(placeId in event.basisPart)) {
                continue;
            }
            const newSeg = event.basisPart[placeId];
            if (!newSeg) {
                this.removeElement();
                this._source.removeWidget(this);
                return;
            }
            const newSegVi = newSeg.getViByUuid(placeSegment.treeUuid);
            if (!newSegVi) {
                this.removeElement();
                this._source.removeWidget(this);
                return;
            }
            if (this.viBasis[dir] !== newSegVi) {
                this.viBasis[dir].unsubscribeCardVi(this);
                this._viBasis[dir] = newSegVi;
                needsRerender = true;
            }
            const wholePlace: boolean = newSeg.id === placeId;
            newSegVi.subscribeCardVi(this, wholePlace);
        }

        if (needsRerender || !this._htmlElement) {
            this.render(this.parent);
        }

    }

    /**
     * Permanently tear down this CardVi: recurse into nested CardVis, unsubscribe
     * from place SegVis (so expand/`forEachAlignedCard` cannot resurrect it), and
     * remove DOM.
     *
     * Called when the card leaves the model tree — nested `afterSplice` on deleted
     * items (e.g. TreeCard `clear` / content splice) and recursively from those
     * children; also from {@link Widget.destroy} on the root CardVi.
     *
     * Distinct from {@link detachHtml}, which only drops HTML while keeping SegVi
     * subscriptions (collapse/expand).
     */
    removeElement() {
        this._nested.forEach((child) => child.removeElement());
        this._viBasis.HORIZONTAL.unsubscribeCardVi(this);
        this._viBasis.VERTICAL.unsubscribeCardVi(this);
        this._htmlElement?.remove();
        this._htmlElement = undefined;
        this.resetManagedClassNames();
    }

    /** Drop HTML without clearing SegVi basis or subscriptions (used by SegVi collapse). */
    detachHtml(): void {
        this._nested.forEach((child) => child.detachHtml());
        this._htmlElement?.remove();
        this._htmlElement = undefined;
        this.resetManagedClassNames();
    }

    /** Recreate HTML after {@link detachHtml} (used by SegVi expand). */
    attachHtml(): void {
        this.render(this.parent);
        this._nested.forEach((child) => child.attachHtml());
    }

    render(parent: HasHtmlElement) {
        if (
            isSegViOrAncestorCollapsed(this._viBasis.HORIZONTAL)
            || isSegViOrAncestorCollapsed(this._viBasis.VERTICAL)
        ) {
            this.detachHtml();
            return;
        }

        // Cards with omitDomUntilPainted stay model-only until a painted main card
        // appears in the subtree.
        if (this.shouldOmitEmptyShell()) {
            this.detachHtml();
            return;
        }

        if(!this._htmlElement) {
            // Render the data
            this._htmlElement = document.createElement("div");
            this._htmlElement.style.boxSizing = "border-box";
            this._htmlElement.style.border = "1px solid gray";
        }
        // Re-parent when the element was created while the parent CardVi was still
        // detached (e.g. painted main card during SegVi.expand before attachHtml).
        // Walk past omitted empty shells that have no HTML.
        const layoutParent = this.resolveLayoutParent(parent);
        if (layoutParent.htmlElement && this._htmlElement.parentElement !== layoutParent.htmlElement) {
            layoutParent.htmlElement.append(this._htmlElement);
        }

        this.syncFrameworkClassNames(this._htmlElement);
        this._htmlElement.style.zIndex = String(this.source.zIndex);
        // TODO:
        // @ts-ignore
        this._source.renderer.updateCardHtmlelement(this.source, this._htmlElement, this);

        
        (["HORIZONTAL", "VERTICAL"] as Direction[])
            .forEach(((dir: Direction) => {
                // TODO: Work out a soultion for the case where multiple layers of SegVi
                // Must match SegViTopology.computeCardOffset: use displayCoordinate
                // (client − parent.scrollOffset), not clientCoordinate, so scrolled
                // places (e.g. GroupListSeg) keep correct top/left after setBasis.
                let offsetAcc = 0;
                let currentSegVi = this._viBasis[dir];
                while(!!currentSegVi && layoutParent.viBasis[dir].source.id !== currentSegVi.source.id) {
                    if(!!currentSegVi.parent) {
                        offsetAcc += currentSegVi.displayCoordinate.value;
                        currentSegVi = currentSegVi.parent;
                    } else {
                        break;
                    }
                }
                this._viBasis[dir].updateCardViCss(this, offsetAcc);
            })
            .bind(this));
    }

    get nested(): EReadCollection<CardVi[]> {
        return this._nested;
    }

    get treeUuid() {
        return this._treeUuid;
    }

    get type() {
        return this.source.typeName;
    }

    get source() {
        return this._source;
    }

    get vertical() {
        return this._viBasis.VERTICAL;
    }

    get horizontal() {
        return this._viBasis.HORIZONTAL;
    }

    get viBasis() {
        return {...this._viBasis};
    }

    get htmlElement() {
        return this._htmlElement;
    }

    private resetManagedClassNames(): void {
        this._managedClassNames = [];
    }

    private frameworkClassNames(): string[] {
        return [
            ...new Set([
                this.source.typeName,
                this._viBasis.HORIZONTAL.source.typeName,
                this._viBasis.VERTICAL.source.typeName,
            ]),
        ];
    }

    private syncFrameworkClassNames(element: HTMLElement): void {
        const desired = this.frameworkClassNames();
        for (const name of this._managedClassNames) {
            if (!desired.includes(name)) {
                element.classList.remove(name);
            }
        }
        for (const name of desired) {
            element.classList.add(name);
        }
        this._managedClassNames = desired;
    }

    /**
     * Shell cards (`renderer.omitDomUntilPainted`) with no painted subtree must not
     * create DOM nodes. Painted = any descendant whose renderer is neither
     * {@link EMPTY_RENDERER} nor itself omit-until-painted.
     */
    private shouldOmitEmptyShell(): boolean {
        return !!this._source.renderer.omitDomUntilPainted
            && !this.subtreeHasPaintedCard(this._source);
    }

    private subtreeHasPaintedCard(card: ICard): boolean {
        if (card.renderer !== EMPTY_RENDERER && !card.renderer.omitDomUntilPainted) {
            return true;
        }
        for (let i = 0; i < card.nested.length; i++) {
            if (this.subtreeHasPaintedCard(card.nested.at(i))) {
                return true;
            }
        }
        return false;
    }

    /** Nearest ancestor that still owns an HTML element (skip omitted empty shells). */
    private resolveLayoutParent(from: HasHtmlElement): HasHtmlElement {
        let current: HasHtmlElement = from;
        while (current instanceof CardVi && !current.htmlElement) {
            current = current.parent;
        }
        return current;
    }

    /**
     * When a formerly omitted shell gains a painted main card, recreate ancestor
     * HTML first so children can append into a live parent element.
     */
    private ensureAttachedForNested(): void {
        if (this._htmlElement) {
            return;
        }
        const parent = this.parent;
        if (parent instanceof CardVi) {
            parent.ensureAttachedForNested();
            if (!parent.htmlElement && !parent.shouldOmitEmptyShell()) {
                parent.render(parent.parent);
            }
        }
        if (!this.shouldOmitEmptyShell()) {
            this.render(this.parent);
        }
    }

    childCardAtCoord(coord: CardCoord): CardVi | undefined {
        return childCardAtCoordFromCardVi(this, coord);
    }
}
