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

import { COLLAPSED_WINDOW_PX, SegSizeProcessor, SegSizeProcessorImpl } from "./SegSizeProcessor";
import { SegViTopology } from "./SegViTopology";

import { CardVi } from "../CardVi";
import type { ISeg } from "../../facade/line";
import { EStyleSheet, segSizeFactory } from "../Size";
import { resolveSegStyle } from "../resolveStyle";
import { SegPropsAdapter } from "../SegPropsAdapters";
import { EReadCollection, PropertyImpl, ReadOnlyProperty } from "../../collection";
import { v4 as uuidv4} from "uuid";
import { NumberedArray } from "../../collection/NumberedArray";
import { SizeString, sizeStyleItemFactory } from "../SizeStyle";
import { BiProperty } from "../../collection/property/BiProperty";
import { childSegAtCoordFromSegVi } from "../CoordHitTest";
import type { SegCoord } from "../MouseInteraction";

export { COLLAPSED_WINDOW_PX };

function contributesToFixedPartSize(segVi: SegVi): boolean {
    if (segVi.flexible.value) {
        return false;
    }
    const windowStyle = segVi.windowStyle.value;
    if (windowStyle === "auto") {
        return true;
    }
    return sizeStyleItemFactory(windowStyle).unit !== "flex";
}

function contributesToFlexPartSize(segVi: SegVi): boolean {
    const windowStyle = segVi.windowStyle.value;
    if (windowStyle === "auto" || windowStyle === "rem") {
        return false;
    }
    return sizeStyleItemFactory(windowStyle).unit === "flex";
}

/** True when this SegVi or any ancestor is collapsed (cards on that axis must not keep DOM). */
export function isSegViOrAncestorCollapsed(segVi: SegVi | undefined): boolean {
    let current = segVi;
    while (current) {
        if (current.collapsed.value) {
            return true;
        }
        current = current.parent;
    }
    return false;
}

export interface SegViProps {
    parent?: SegVi,
    styleSheet: EStyleSheet,
    source: ISeg,
    treeUuid?: string,
    cssUpdater: SegPropsAdapter,
    next: SegViNext,
    hostAvailableSpace?: ReadOnlyProperty<number>,
}


interface SegViNext {
    addClientCoordinate(delta: number): void;
    setClientCoordinate(offset: number): void;
    shiftOrderNumber(delta: number): void;
}

export function unsubscribeSegViTree(root: SegVi): void {
    const treeUuid = root.treeUuid;
    const visit = (seg: ISeg) => {
        seg.unsubscribeVi(treeUuid);
        seg.nested.forEach(child => visit(child));
    };
    visit(root.source);
}

export class SegViCeiling implements SegViNext {
    private readonly _positon: PropertyImpl<number>;
    private readonly _orderNumber: PropertyImpl<number>;

    constructor() {
        this._positon = new PropertyImpl<number>(0);
        this._orderNumber = new PropertyImpl<number>(0);
    }

    shiftOrderNumber(delta: number): void {
        this._orderNumber.value += delta;
    }

    addClientCoordinate(delta: number) {
        this._positon.value += delta;
    }

    setClientCoordinate(offset: number) {    
        const delta = offset - this._positon.value;
        if(!!delta) {
            this.addClientCoordinate(delta);
        }
    }

    get position(): ReadOnlyProperty<number> {
        return this._positon;
    }

    get orderNumber(): ReadOnlyProperty<number> {
        return this._orderNumber;
    }
}

/**
 * Visual instance of an {@link ISeg} in one Widget axis tree.
 *
 * Widget fully owns SegVi (create, rebind, collapse/expand, destroy). Application
 * and example code must not store SegVi; look up `seg.vis[treeUuid]` at the call site.
 *
 * @see ../../README.md#cardvi-and-segvi
 */
export class SegVi implements SegViNext {
    readonly parent?: SegVi;
    readonly hostAvailableSpace?: ReadOnlyProperty<number>;
    private readonly sizeProcessor: SegSizeProcessor;
    private readonly topology: SegViTopology;
    readonly sourceArray: NumberedArray<ISeg>;  // TODO: Move numbered array under the hood od EArray and make it singleton, created for each  EArray on demand
    readonly source: ISeg;
    readonly treeUuid: string;
    private _next: SegViNext;

    // Sizing
    private readonly _ceiling = new SegViCeiling();
    private readonly _clientCoordinate: PropertyImpl<number> = new PropertyImpl<number>(0);
    readonly displayCoordinate: BiProperty<number, number, number>;
    readonly windowStyle: ReadOnlyProperty<SizeString>;
    private readonly _countFlexibleChildren: PropertyImpl<number> = new PropertyImpl<number>(0);
    private readonly _fixedPartSize: PropertyImpl<number> = new PropertyImpl<number>(0);
    private readonly _flexPartSize: PropertyImpl<number> = new PropertyImpl<number>(0);
    private readonly _orderNumber: PropertyImpl<number> = new PropertyImpl<number>(0);

    // Scrolling functionality
    readonly scrollOffset: PropertyImpl<number> = new PropertyImpl<number>(0);

    /** Runtime collapsed flag; initial value comes from resolved `EStyle.collapsed`. */
    readonly collapsed: PropertyImpl<boolean>;

    constructor(props: SegViProps) {
        const resolvedStyle = resolveSegStyle(props.source, props.styleSheet);
        this.collapsed = new PropertyImpl<boolean>(resolvedStyle.collapsed ?? false);
        this.windowStyle = new PropertyImpl<SizeString>(
            segSizeFactory(resolvedStyle, props.cssUpdater.direction),
        );
        this._next = props.next;
        this.treeUuid = props.treeUuid || uuidv4();
        this.parent = props.parent;
        this.hostAvailableSpace = props.hostAvailableSpace;
        this.source = props.source;
        this.source.style.collapsed = this.collapsed.value;
        this.sourceArray = new NumberedArray<ISeg>(props.source.nested);
        this.sizeProcessor = new SegSizeProcessorImpl({
            // parent: props.parent,
            source: props.source.nested,
        }, this);        
        this.topology = new SegViTopology({
            cssUpdater: props.cssUpdater
        }, this);

        const self = this;
    
        this.window.subscribe({
            onChange(oldValue: number, newValue: number) {
                const delta = newValue - oldValue;
                if(delta !== 0) {
                    self._next.addClientCoordinate(delta);
                }
            }
        });

        this.displayCoordinate = new BiProperty<number, number, number>(
            this._clientCoordinate, 
            props.parent?.scrollOffset || new PropertyImpl<number>(0),
            (a: number, b: number) => a - b
        );

        this.displayCoordinate.subscribe({
            onChange(oldValue: number, newValue: number) {
                self.topology.shiftCardVis();
                self.shiftDescendantCardVis();
            }
        })

        this
            .source
            .nested
            .subscribe({
                afterSplice(start: number, _: number, insertedItems: ISeg[], deletedItems: ISeg[], processedCollection: EReadCollection<ISeg[]>): void {
                    
                    const nextItemIndex = start + insertedItems.length;

                    const nextItem = ((nextItemIndex === processedCollection.length)
                        ? self._ceiling
                        : processedCollection.at(nextItemIndex).getViByUuid?.(self.treeUuid)) || self._ceiling;

                    const previousSeg = start === 0 
                        ? null 
                        : processedCollection.at(start - 1);

                    let beforeInserted = previousSeg
                        ?.getViByUuid?.(self.treeUuid);

                    for(let i = 0; i < insertedItems.length; i++) {
                        const item = insertedItems[i];

                        const insertedVi = new SegVi({ 
                            parent: self, 
                            source: item,
                            styleSheet: props.styleSheet,
                            treeUuid: self.treeUuid,
                            cssUpdater: props.cssUpdater, 
                            next: self._ceiling,
                        });

                        if(!!beforeInserted) {
                            insertedVi.addClientCoordinate(beforeInserted._clientCoordinate.value + beforeInserted.window.value);
                            insertedVi.shiftOrderNumber(beforeInserted.orderNumber.value + 1);
                            beforeInserted.setNext(insertedVi);
                        }

                        item.subscribeVi(self.treeUuid, insertedVi);

                        if (contributesToFixedPartSize(insertedVi)) {
                            insertedVi.window.subscribe({
                                onChange(oldValue: number, newValue: number) {
                                    const delta = newValue - oldValue;
                                    if (delta !== 0) {
                                        self._fixedPartSize.value += delta;
                                    }
                                }
                            });
                        }

                        if (contributesToFlexPartSize(insertedVi)) {
                            insertedVi.window.subscribe({
                                onChange(oldValue: number, newValue: number) {
                                    const delta = newValue - oldValue;
                                    if (delta !== 0) {
                                        self._flexPartSize.value += delta;
                                    }
                                }
                            });
                        }
                        
                        beforeInserted = insertedVi;
                    }

                    if (deletedItems.length > 0 && insertedItems.length === 0) {
                        self.relayoutChildChain(processedCollection);
                    } else if (!!beforeInserted) {
                        beforeInserted.setNext(nextItem);
                        nextItem.setClientCoordinate(beforeInserted.clientCoordinate.value + beforeInserted.window.value);
                    }


                    // Update flexible items count
                    {
                        const countFlexibleChildrenDelta = insertedItems
                            .map(t => t.getViByUuid(self.treeUuid))
                            .filter((item): item is SegVi => !!item)
                            .filter(item => item.flexible.value)
                            .length 
                            - deletedItems
                            .map(t => t.getViByUuid(self.treeUuid))
                            .filter((item): item is SegVi => !!item)
                            .filter(item => item.flexible.value)
                            .length;

                        self._countFlexibleChildren.value += countFlexibleChildrenDelta;
                    }

                    // Update fixed / flex part sizes. Compute both deltas before applying
                    // either — updating fixedPartSize shrinks flex windows and the flex
                    // subscription would otherwise desync the bulk flexPartSize delta.
                    {
                        const fixedPartSizeDelta = insertedItems
                            .map(t => t.getViByUuid(self.treeUuid))
                            .filter((item): item is SegVi => !!item)
                            .filter(contributesToFixedPartSize)
                            .reduce((acc, item) => acc + item.window.value, 0) 
                            -
                            deletedItems
                            .map(t => t.getViByUuid(self.treeUuid))
                            .filter((item): item is SegVi => !!item)
                            .filter(contributesToFixedPartSize)
                            .reduce((acc, item) => acc + item.window.value, 0);

                        const flexPartSizeDelta = insertedItems
                            .map(t => t.getViByUuid(self.treeUuid))
                            .filter((item): item is SegVi => !!item)
                            .filter(contributesToFlexPartSize)
                            .reduce((acc, item) => acc + item.window.value, 0)
                            -
                            deletedItems
                            .map(t => t.getViByUuid(self.treeUuid))
                            .filter((item): item is SegVi => !!item)
                            .filter(contributesToFlexPartSize)
                            .reduce((acc, item) => acc + item.window.value, 0);

                        self._fixedPartSize.value += fixedPartSizeDelta;
                        self._flexPartSize.value += flexPartSizeDelta;
                    }

                    deletedItems.forEach(element => {
                        element.unsubscribeVi(self.treeUuid)
                    });
                },

                afterMove(from: number, into: number): void {
                    // TODO: IMplememt swap callback
                },

                update(at: number, newValue: ISeg): void {

                },
            });

        this.sizeProcessor.flexible.subscribe({
            onChange(oldValue: boolean, newValue: boolean) {
                if(oldValue && !newValue) {
                    self.countFlexibleChildren.value--;
                } else if (!oldValue && newValue) {
                    self.countFlexibleChildren.value++;
                }
            }
        })
    }

    get clientCoordinate(): ReadOnlyProperty<number> {
        return this._clientCoordinate;
    }

    addClientCoordinate(delta: number) {
        this._clientCoordinate.value += delta;
        if(delta != 0) {
            this._next.addClientCoordinate(delta);
        }
    }

    setClientCoordinate(offset: number) {    
        const delta = offset - this._clientCoordinate.value;
        if(!!delta) {
            this.addClientCoordinate(delta);
        }
    }

    shiftOrderNumber(delta: number) {
        // TODO: Compare with non-ai branch again
        this._orderNumber.value += delta;
        if(delta != 0) {
            this._next.shiftOrderNumber(delta);
        }
    }

    subscribeCardVi(cardVi: CardVi, wholePlace: boolean): void {
        this.topology.subscribeCardVi(cardVi, wholePlace);
    }

    unsubscribeCardVi(cardVi: CardVi): void {
        this.topology.unsubscribeCardVi(cardVi);
    }

    /**
     * Collapse or expand this segment. When collapsed, `window` is
     * {@link COLLAPSED_WINDOW_PX}; nested SegVis and `scrollOffset` are kept.
     * Aligned CardVi HTML is detached (models remain).
     */
    collapse(collapsed: boolean = true): void {
        this.setCollapsed(collapsed);
    }

    /**
     * Expand or collapse this segment. `expand(false)` collapses.
     */
    expand(expanded: boolean = true): void {
        this.setCollapsed(!expanded);
    }

    private setCollapsed(collapsed: boolean): void {
        if (this.collapsed.value === collapsed) {
            return;
        }
        this.collapsed.value = collapsed;
        this.source.style.collapsed = collapsed;
        if (collapsed) {
            this.topology.forEachAlignedCard((cardVi) => cardVi.detachHtml());
        } else {
            this.topology.forEachAlignedCard((cardVi) => cardVi.attachHtml());
        }
    }

    updateCardViCss(cardVis: CardVi, offset: number) {
        this.topology.updateCardViCss(cardVis, offset);
    }

    updateChildCardElement(htmlElement: HTMLElement | undefined, offset: number) {
        this.topology.updateChildCardElement(htmlElement, offset);
    }

    get ceiling() {
        return this._ceiling.position;
    }

    get client() {
        return this.ceiling;
    }
    
    get window() {
        return this.sizeProcessor.window;
    }

    get scrollable() {
        return this.sizeProcessor.scrollable;
    }

    get flexible() {
        return this.sizeProcessor.flexible;
    }

    get availableSpace() {
        return this.sizeProcessor.availableSpace;
    }

    get flexiblePartWidth() {
        return this.sizeProcessor.flexiblePartWidth;
    }

    get remPartWidth() {
        return this.sizeProcessor.remPartWidth;
    }
    
    resizeCardVis(value?: number) {
        // TODO: Replace with style update
        this.topology.resizeCardVis(value || this.window.value);
    }

    shiftCardVis() {
        this.topology.shiftCardVis();
    }

    private shiftDescendantCardVis(): void {
        this.source.nested.forEach(child => {
            const childVi = child.getViByUuid(this.treeUuid);
            if (childVi) {
                childVi.topology.shiftCardVis();
                childVi.shiftDescendantCardVis();
            }
        });
    }

    private relayoutChildChain(processedCollection: EReadCollection<ISeg[]>): void {
        let beforeInserted: SegVi | undefined;

        for (let i = 0; i < processedCollection.length; i++) {
            const childVi = processedCollection.at(i).getViByUuid?.(this.treeUuid);
            if (!childVi) {
                continue;
            }

            if (!beforeInserted) {
                childVi.setClientCoordinate(0);
                childVi.shiftOrderNumber(0);
            } else {
                childVi.setClientCoordinate(beforeInserted.clientCoordinate.value + beforeInserted.window.value);
                childVi.shiftOrderNumber(beforeInserted.orderNumber.value + 1);
                beforeInserted.setNext(childVi);
            }

            beforeInserted = childVi;
        }

        if (beforeInserted) {
            beforeInserted.setNext(this._ceiling);
            this._ceiling.setClientCoordinate(beforeInserted.clientCoordinate.value + beforeInserted.window.value);
        } else {
            this._ceiling.setClientCoordinate(0);
        }
    }

    setNext(next: SegViNext) {
        this._next = next;
    }

    get countFlexibleChildren() {
        return this._countFlexibleChildren; 
    }

    get fixedPartSize() {
        return this._fixedPartSize;
    }

    get flexPartSize() {
        return this._flexPartSize;
    }

    get orderNumber(): ReadOnlyProperty<number> {
        return this._orderNumber;
    }

    childSegAtCoord(coord: SegCoord): SegVi | undefined {
        return childSegAtCoordFromSegVi(this, coord);
    }
}