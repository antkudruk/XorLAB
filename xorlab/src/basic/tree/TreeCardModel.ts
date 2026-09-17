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

import { Basis } from "../card/Basis";
import type { ICard } from "../../facade/card";
import type { ISeg } from "../../facade/line";
import type { TreeSeg, TreeSegAttributes } from "./TreeSeg";
import { createTable } from "../table";
import { TreeCardContentModel } from "./TreeCardContentModel";
import { TREE_SEG_TYPE_NAME } from "./TreeSeg";
import { TreeBasisPatchManager } from "./TreeBasisPatchManager";
import { OMIT_UNTIL_PAINTED_SHELL_RENDERER } from "../../renderer";

/**
 * Props for {@link TreeCardModel}.
 *
 * @see ../../README.md#tree-pattern
 */
export interface TreeCardModelProps {
    readonly nestedFactory: (it: ISeg) => ICard;
    readonly mainCardFactory: () => ICard;
    readonly content: TreeCardContentModel;
    readonly basisPatchManager: TreeBasisPatchManager;
    /**
     * True when a place should get a main tree card (and counts for deepen).
     * Callers typically pass overflow or always-true. Defaults to
     * {@link segmentPlaceActive}.
     */
    readonly placeActive?: (seg: ISeg) => boolean;
}

/** True when any mounted SegVi reports client extent exceeding window. */
export function segmentPlaceActive(seg: ISeg): boolean {
    const visList = Object.values(seg.vis ?? {});
    for (let i = 0; i < visList.length; i++) {
        if (visList[i].scrollable.value) {
            return true;
        }
    }
    return false;
}

/**
 * Layout **policy** for a tree card: when to show the main card, seed a nested
 * table of child tree cards, deepen to an inner {@link TreeSeg}, or release that
 * level. Assigns {@link TreeCardContentModel} Property slots (storage) and calls
 * {@link TreeSegAttributes}; does not own the nested list itself.
 *
 * Activity uses {@link TreeCardModelProps.placeActive} (default:
 * {@link segmentPlaceActive}). When this place has children, always seed a nested
 * table so each child can react to its own activity. Deepen only when a child has
 * active descendants. Child typeName sameness is irrelevant. Callers choose
 * `placeActive`; this model does not name Scrollbar or Discovery products.
 *
 * @see ../../README.md#tree-pattern
 */
export class TreeCardModel {
    private readonly props: TreeCardModelProps;
    private _usingInnerLevel = false;
    private _basisForInnerLevel: Basis | undefined = undefined;
    private _innerLevelOwner: TreeSeg | undefined = undefined;

    constructor(props: TreeCardModelProps) {
        this.props = { ...props };
    }

    private isPlaceActive(seg: ISeg): boolean {
        return (this.props.placeActive ?? segmentPlaceActive)(seg);
    }

    private releaseInnerLevelIfEmpty(basis: Basis | undefined): void {
        if (!this._usingInnerLevel || !basis) {
            return;
        }
        try {
            const owner = this._innerLevelOwner ?? this.getTreeSeg(basis);
            owner.attrs.freeNestedLevel();
        } catch {
            // basis no longer contains a single TreeSeg
        }
        this._usingInnerLevel = false;
        this._basisForInnerLevel = undefined;
        this._innerLevelOwner = undefined;
    }

    // Deepen the TreeSeg this card sits on. Sibling tree cards on the host share
    // one inner level; each nest that needs its own level acquires via getNestedLevel.
    private resolveNestedLevelTreeSeg(
        treeSeg: TreeSeg,
        basis: Basis,
    ): TreeSeg {
        if (!this._usingInnerLevel) {
            this._usingInnerLevel = true;
            this._basisForInnerLevel = basis;
            this._innerLevelOwner = treeSeg;
            return treeSeg.attrs.getNestedLevel();
        }
        for (let i = 0; i < treeSeg.nested.length; i++) {
            const item = treeSeg.nested.at(i);
            if (item.typeName === TREE_SEG_TYPE_NAME) {
                return item as TreeSeg;
            }
        }
        return treeSeg.attrs.getNestedLevel();
    }

    /**
     * Place the caller-supplied main card on the TreeSeg node place
     * (`getNodeSeg`) when basis has exactly one TreeSeg and one content place.
     */
    showMainCard(basis: Basis): void {
        const nonTreeSeg = this.getNonTreeSeg(basis);
        const treeSeg = this.getTreeSeg(basis);
        if (!!nonTreeSeg && !!treeSeg) {
            const mainCard = this.props.mainCardFactory();
            this.props.content.mainCard.value = mainCard;

            // Key must match the TreeSeg place this tree card currently sits on (host or nested).
            mainCard.setBasis({
                ...basis.basisToStretchChildren(),
                [treeSeg.id]: treeSeg.attrs.getNodeSeg(),
            });
        }
    }

    /**
     * True when any descendant place is active (direct child active, or deeper).
     * Used only to decide whether a child requires further nesting (deepen).
     */
    private hasActiveDescendant(seg: ISeg): boolean {
        for (let i = 0; i < seg.nested.length; i++) {
            const child = seg.nested.at(i);
            if (this.isPlaceActive(child) || this.hasActiveDescendant(child)) {
                return true;
            }
        }
        return false;
    }

    /**
     * Deepen only when a child has active places below it. Sibling active places
     * share the host TreeSeg — do not open an empty inner level when no child
     * requires further nesting.
     */
    private shouldDeepenForNested(seg: ISeg): boolean {
        for (let i = 0; i < seg.nested.length; i++) {
            if (this.hasActiveDescendant(seg.nested.at(i))) {
                return true;
            }
        }
        return false;
    }

    private publishNestedTableOnInnerLevel(basis: Basis): void {
        const treeSeg = this.getTreeSeg(basis);
        const nestedLevel = this.resolveNestedLevelTreeSeg(treeSeg, basis);
        const nestedItemsTable = this.createNestedItemsTable(basis);
        this.props.content.nestedItemsTable.value = nestedItemsTable;
        nestedItemsTable.setBasis({
            ...basis.basisToStretchChildren(),
            [treeSeg.id]: nestedLevel,
        });
    }

    private publishNestedTableOnSameLevel(basis: Basis): void {
        const nestedItemsTable = this.createNestedItemsTable(basis);
        this.props.content.nestedItemsTable.value = nestedItemsTable;
        nestedItemsTable.setBasis(this.basisPatchForSameLevel(basis));
    }

    /**
     * Seed a nested table of child tree cards when this place has children. Deepen
     * only when a child itself has active descendants. Always seeding (not only when
     * children are already active) lets child tree cards subscribe before layout
     * finishes measuring overflow.
     */
    refreshNestedItemsTableOnInnerLevel(basis: Basis): void {
        const nonTreeSeg = this.getNonTreeSeg(basis);
        if (nonTreeSeg.nested.length === 0) {
            this.dropNestedItemsTableIfPresent();
            return;
        }
        if (this.shouldDeepenForNested(nonTreeSeg)) {
            this.publishNestedTableOnInnerLevel(basis);
            return;
        }
        this.releaseInnerLevelIfEmpty(this._basisForInnerLevel);
        this.publishNestedTableOnSameLevel(basis);
    }

    /** Drop per-row nested table when nothing remains to nest. */
    dropNestedItemsTableIfPresent(): void {
        this.releaseInnerLevelIfEmpty(this._basisForInnerLevel);
        this.props.content.nestedItemsTable.value = undefined;
    }

    /**
     * This place is inactive: release inner TreeSeg; keep a host-level nested table
     * of children so each child tree card can still react when it becomes active.
     */
    refreshNestedItemsTableOnSameLevel(basis: Basis): void {
        this.releaseInnerLevelIfEmpty(basis);
        const nonTreeSeg = this.getNonTreeSeg(basis);
        if (nonTreeSeg.nested.length === 0) {
            this.dropNestedItemsTableIfPresent();
            return;
        }
        this.publishNestedTableOnSameLevel(basis);
    }

    /** Stretch patch using the host TreeSeg (never a freed nested level with empty vis). */
    private basisPatchForSameLevel(basis: Basis): { [placeId: string]: ISeg } {
        const nonTreeSeg = this.getNonTreeSeg(basis);
        const treeSeg = this
            .getTreeSeg(basis)
            .attrs
            .getHostTreeSeg();
        return {
            [nonTreeSeg.id]: nonTreeSeg,
            [treeSeg.id]: treeSeg,
        };
    }

    private getTreeSeg(basis: Basis): TreeSeg {
        const treeSegments = basis.findAllByTypeName(TREE_SEG_TYPE_NAME);
        if (Object.keys(treeSegments).length !== 1) {
            throw new Error("Wrong type of tree segments");
        }

        return Object.values(treeSegments)[0] as unknown as TreeSeg;
    }

    private getNonTreeSeg(basis: Basis): ISeg {
        const nonTreeSegments = basis.findAllByTypeNameNotEqualTo(TREE_SEG_TYPE_NAME);

        if (Object.keys(nonTreeSegments).length !== 1) {
            throw new Error("Wrong type of non-tree segments");
        }

        return Object.values(nonTreeSegments)[0];
    }

    private createNestedItemsTable(basis: Basis): ICard {
        const nonTreeSeg = this.getNonTreeSeg(basis);

        return createTable({
            mainLine: nonTreeSeg.typeName,
            orthoLine: TREE_SEG_TYPE_NAME,
            orthoFactory: this.props.nestedFactory,
            // Same omit-until-painted policy as the tree card shell — empty per-row
            // tables must not create DOM before a painted main appears below.
            renderer: OMIT_UNTIL_PAINTED_SHELL_RENDERER,
        });
    }

    displayTreeSquared(basis: Basis): void {
        const card = this.props.content.setTreeSquared();
        card.setBasis(basis.basisToStretchChildren());
        this.props.basisPatchManager.drop();
    }

    displayErrorCard(basis: Basis): void {
        const card = this.props.content.setErrorCard();
        card.setBasis(basis.basisToStretchChildren());
        this.props.basisPatchManager.drop();
    }

    clear(): void {
        this.releaseInnerLevelIfEmpty(this._basisForInnerLevel);
        this.props.content.dropAll();
    }
}
