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

import { PropertyListener, ReadOnlyProperty } from "../../collection/property/Property";
import { Basis } from "../card";
import type { ISeg } from "../../facade/line";
import { TreeCardModel } from "./TreeCardModel";
import { TREE_SEG_TYPE_NAME } from "./TreeSeg";
import { TreeBasisPatchManager } from "./TreeBasisPatchManager";
import { SwappablePropertySlot } from "./SwappablePropertySlot";

export type DisplayMainCardCriteria = (segment: ISeg, basis: Basis) => ReadOnlyProperty<boolean>;


export interface TreeCardBasisHandlerProps {
    model: TreeCardModel;
    basis: Basis;
    rendererCondition: DisplayMainCardCriteria;
    basisPatchManager: TreeBasisPatchManager
}


export class MainCardListenerFactory {

    readonly model: TreeCardModel;
    readonly basis: Basis;

    constructor(model: TreeCardModel, basis: Basis) {
        this.model = model;
        this.basis = basis;
    }

    get(): PropertyListener<boolean | undefined> {
        const self = this;
        return {
            onChange(oldValue: boolean | undefined, newValue: boolean | undefined) {
                // true→true / false→false must not clear — that drops the main card with no restore.
                if (oldValue === newValue) {
                    return;
                }
                self.model.clear();
                if (!!newValue && !oldValue) {
                    // Active place: main card + seed nested child table / deepen if needed.
                    self.model.showMainCard(self.basis);
                    self.model.refreshNestedItemsTableOnInnerLevel(self.basis);
                } else if (!newValue && !!oldValue) {
                    // Inactive place: drop main card; keep host nested table so children can activate later.
                    self.model.refreshNestedItemsTableOnSameLevel(self.basis);
                }
            }
        };
    }
}


/** Reacts to tree-card basis changes and main-card visibility transitions. */
export class TreeCardBasisHandler {

    private readonly model: TreeCardModel;

    private readonly treeBasisPatchManager: TreeBasisPatchManager;

    private readonly showMainCardListener: PropertyListener<boolean | undefined>;
    private readonly renderConditionSlot: SwappablePropertySlot<ISeg, boolean>;
    private readonly basis: Basis;

    constructor(props: TreeCardBasisHandlerProps) {
        this.model = props.model;
        this.basis = props.basis;
        this.treeBasisPatchManager = props.basisPatchManager;
        this.renderConditionSlot = new SwappablePropertySlot<ISeg, boolean>(
            (seg) => props.rendererCondition(seg, this.basis),
        );
        this.showMainCardListener = new MainCardListenerFactory(this.model, this.basis).get();
        this.renderConditionSlot.subscribe(this.showMainCardListener);
    }

    afterSetBasis(basis: Basis): void {

        const treeSegments = basis.findAllByTypeName(TREE_SEG_TYPE_NAME);
        const nonTreeSegments = basis.findAllByTypeNameNotEqualTo(TREE_SEG_TYPE_NAME);

        if (Object.keys(nonTreeSegments).length > 1) {
            this.releaseRenderCondition();
            this.model.displayErrorCard(basis);
        } else if (Object.keys(nonTreeSegments).length === 1) {
            if (Object.keys(treeSegments).length === 1) {
                const treeSeg = Object.values(treeSegments)[0];
                const nodeSeg = Object.values(nonTreeSegments)[0];

                if (nodeSeg !== this.treeBasisPatchManager.previousNodeSeg) {
                    this.renderConditionSlot.swap(nodeSeg);
                }

                if (this.treeBasisPatchManager.shouldCreateFromScratch) {
                    const visible = !!this.renderConditionSlot.value;
                    if (visible) {
                        this.model.clear();
                        this.model.showMainCard(basis);
                        this.model.refreshNestedItemsTableOnInnerLevel(basis);
                    } else {
                        this.model.refreshNestedItemsTableOnSameLevel(basis);
                    }
                }

                this.treeBasisPatchManager.refresh(nodeSeg, treeSeg);
            } else if (Object.keys(treeSegments).length > 1) {
                this.releaseRenderCondition();
                this.model.displayErrorCard(basis);
            } else {
                this.releaseRenderCondition();
                this.model.clear();
            }
        } else {
            if (Object.keys(treeSegments).length > 1) {
                this.releaseRenderCondition();
                this.model.displayTreeSquared(basis);
            } else {
                this.releaseRenderCondition();
                this.model.clear();
            }
        }
    }

    /**
     * Drop the renderCondition binding without letting the visibility listener
     * rebuild nested content — error / clear paths own that themselves.
     */
    private releaseRenderCondition(): void {
        this.renderConditionSlot.unsubscribe(this.showMainCardListener);
        this.renderConditionSlot.clear();
        this.renderConditionSlot.subscribe(this.showMainCardListener);
    }
}
