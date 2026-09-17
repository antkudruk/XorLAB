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

import type { ISeg } from "../../facade/line";
import type { Card, ICard } from "../../facade/card";
import type { EReadCollection } from "../../facade/collection";
import { Basis, BasisPatch, Place, createBasis } from "../card/Basis";
import { CardVi } from "../../renderer/CardVi";
import { OMIT_UNTIL_PAINTED_SHELL_RENDERER } from "../../renderer";
import { PropertyImpl, ReadOnlyProperty } from "../../collection/property/Property";
import { TreeCardContentModel } from "./TreeCardContentModel";
import { TreeBasisPatchManager } from "./TreeBasisPatchManager";
import { TreeCardBasisHandler } from "./TreeCardBasisHandler";
import { TreeCardModel } from "./TreeCardModel";
import { v4 as uuidv4 } from "uuid";
import { resolveChildPositionFromMap } from "../card/ChildPos";
import {
    adaptPlaceSelfPosFactories,
    resolveSelfPosition,
    type ExactPlaceSelfPosFactories,
    type PlaceSelfPosFactories,
} from "../card/SelfPos";
import { childCardAtCoordFromCard } from "../../renderer/CoordHitTest";
import type { ECollectionItemType } from "../../facade/table";
import type { CardCoord } from "../../renderer/MouseInteraction";
import { createCardCoordHelper } from "../../facade/CardCoordHelper";
import { fireCardPlacement } from "../card/fireCard";

type TreeCardSelf<TypeName extends string> = Card<EReadCollection<ICard[]>, TypeName, {}>;

export interface TreeCardProps<
    SelfPos extends PlaceSelfPosFactories = PlaceSelfPosFactories,
    TypeName extends string = string,
> {
    readonly cardFactory: () => ICard;
    readonly renderCondition?: (it: ISeg, basis: Basis) => ReadOnlyProperty<boolean>;
    readonly typeName?: TypeName;
    readonly selfPos?: ExactPlaceSelfPosFactories<SelfPos>;
}

/**
 * Creates a tree card (`ICard` shell): wires {@link TreeCardModel} (policy),
 * {@link TreeCardContentModel} (storage; `result.nested === content.nested`), and
 * {@link TreeCardBasisHandler} (reacts to `setBasis` / `renderCondition`).
 *
 * Main card sits on the TreeSeg node place; optional nested table of child tree
 * cards; optional inner TreeSeg level. Callers supply `renderCondition` →
 * `placeActive` (for example overflow or always-true). Nested tables are seeded
 * whenever the place has children; deepen only when a child has active
 * descendants. Uses {@link OMIT_UNTIL_PAINTED_SHELL_RENDERER} so CardVi omits DOM
 * until a painted main card exists. Tree does not own Scrollbar or Discovery.
 *
 * @see ../../README.md#tree-pattern
 * @see ../../README.md#callback-typing-convention — `selfPos` typing and naming
 */
export function createTree<
    SelfPos extends PlaceSelfPosFactories = PlaceSelfPosFactories,
    TypeName extends string = string,
>(props: TreeCardProps<SelfPos, TypeName>): TreeCardSelf<TypeName> {
    const basis = createBasis();
    const vis: { [treeUuid: string]: CardVi } = {};
    const selfPos = adaptPlaceSelfPosFactories<TreeCardSelf<TypeName>>(props.selfPos || {});

    const rendererCondition =
        props.renderCondition || ((_it, _basis) => new PropertyImpl(true));
    const basisPatchManager = new TreeBasisPatchManager();

    const nestedFactory = () =>
        createTree({
            typeName: props.typeName,
            renderCondition: props.renderCondition,
            cardFactory: props.cardFactory,
        });

    const content = new TreeCardContentModel();

    const model = new TreeCardModel({
        nestedFactory,
        mainCardFactory: props.cardFactory,
        content,
        basisPatchManager,
        // Same predicate that shows the main card (caller-defined). Drives deepen.
        placeActive: (seg) => rendererCondition(seg, basis).value,
    });

    const basisHandler = new TreeCardBasisHandler({
        model,
        basis,
        rendererCondition,
        basisPatchManager,
    });

    const result: TreeCardSelf<TypeName> = {
        vis,
        uuid: uuidv4(),
        nested: content.nested as EReadCollection<ICard[]>,
        typeName: props.typeName || (uuidv4() as TypeName),
        zIndex: 0,
        setBasis: (basisPatch: BasisPatch) => {
            const setBasisResult = basis.setBasis(basisPatch, result);

            Object.values(vis).forEach((it) => {
                it.afterSetBasis({
                    patchResult: setBasisResult,
                    basisPart: basisPatch,
                });
            });

            basisHandler.afterSetBasis(basis);

            return setBasisResult;
        },
        getBasis(): Basis {
            return basis;
        },
        fire(): void {
            fireCardPlacement(result);
        },
        attrs: {},
        renderer: OMIT_UNTIL_PAINTED_SHELL_RENDERER,
        segAtPlace(seg: Place): ISeg | undefined {
            return basis.at(seg);
        },
        addWidget(vi: CardVi): void {
            if (Object.keys(vis).length > 0) {
                throw new Error("Only one widget can be applied to a TreeCard");
            }
            vis[vi.treeUuid] = vi;
        },
        removeWidget(vi: CardVi): void {
            delete vis[vi.treeUuid];
        },
        getViByUuid(treeUuid: string): CardVi | undefined {
            return vis[treeUuid];
        },
        getSelfPos(): { [name: string]: ISeg } {
            return basis.segTypeNameToSegDict as { [name: string]: ISeg };
        },
        resolveSelfPosition(place: ISeg): ISeg | null {
            return resolveSelfPosition(selfPos, place, result);
        },
        resolveChildPosition(place: ISeg, child: ICard): ISeg | null {
            return resolveChildPositionFromMap({}, child, place, result);
        },
        childCardAtCoord(coord: CardCoord): ECollectionItemType<EReadCollection<ICard[]>>[number] | undefined {
            return childCardAtCoordFromCard(result, coord);
        },
        coordHelper(coord: CardCoord, treeUuid: string) {
            return createCardCoordHelper(result, coord, treeUuid);
        },
    };

    return result;
}
