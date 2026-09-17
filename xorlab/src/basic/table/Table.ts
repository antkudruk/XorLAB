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

import type { ISeg, Seg } from "../../facade/line";
import type { Card, ICard } from "../../facade/card";
import type { EMapped, EReadCollection } from "../../facade/collection";
import { Basis, BasisPatch, Place, createBasis } from "../card/Basis";
import { CardVi } from "../../renderer/CardVi";
import { EMPTY_RENDERER, type Renderer } from "../../renderer";
import { EMapped as EMappedImpl } from "../../collection";
import { v4 as uuidv4 } from "uuid";
import { resolveChildPositionFromMap } from "../card/ChildPos";
import { updateNestedCards } from "../card/NestedCardsCollection";
import { resolveSelfPosition, adaptPlaceSelfPosFactories, type ExactPlaceSelfPosFactories, type PlaceSelfPosFactories } from "../card/SelfPos";
import { createTableChildPos } from "./TableChildPos";
import { childCardAtCoordFromCard } from "../../renderer/CoordHitTest";
import type { ECollectionItemType } from "../../facade/table";
import type { CardCoord } from "../../renderer/MouseInteraction";
import { createCardCoordHelper } from "../../facade/CardCoordHelper";
import { fireCardPlacement } from "../card/fireCard";

export interface TableProps<
    NestedSegType extends ISeg,
    OrthoSegType extends ISeg,
    TableRow extends ICard,
    SelfPos extends PlaceSelfPosFactories = PlaceSelfPosFactories,
    TypeName extends string = string,
> {
    readonly mainLine: string;
    readonly orthoLine: string;
    readonly orthoFactory: (it: NestedSegType, ortho: OrthoSegType) => TableRow;
    readonly typeName?: TypeName;
    readonly selfPos?: ExactPlaceSelfPosFactories<SelfPos>;
    /** Defaults to {@link EMPTY_RENDERER}. Tree nested tables pass a shell renderer. */
    readonly renderer?: Renderer;
}

export function createTable<
    NestedSegType extends ISeg,
    OrthoSegType extends ISeg,
    TableRow extends ICard,
    SelfPos extends PlaceSelfPosFactories = PlaceSelfPosFactories,
    TypeName extends string = string,
>(props: TableProps<NestedSegType, OrthoSegType, TableRow, SelfPos, TypeName>): Card<EMapped<NestedSegType[], TableRow>, TypeName, {}> {
    const basis = createBasis();
    const vis: { [treeUuid: string]: CardVi } = {};
    let currentOrtho: OrthoSegType | null = null;
    const nested = new EMappedImpl<NestedSegType, TableRow>(null, it => {
        if (!currentOrtho) {
            throw new Error(`No ortho segment available for type "${props.orthoLine}"`);
        }
        return props.orthoFactory(it, currentOrtho);
    });
    const selfPos = adaptPlaceSelfPosFactories(props.selfPos || {});
    const childPos = createTableChildPos(props.mainLine);

    const result: Card<EMapped<NestedSegType[], TableRow>, TypeName, {}> = {
        vis,
        uuid: uuidv4(),
        nested: nested as unknown as EMapped<NestedSegType[], TableRow>,
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

            const mainSegments = basis.findAllByTypeName(props.mainLine);
            const orthoSegments = basis.findAllByTypeName(props.orthoLine);

            if (Object.keys(mainSegments).length === 1 && Object.keys(orthoSegments).length === 1) {
                const mainSeg = Object.values(mainSegments)[0];
                const orthoSeg = Object.values(orthoSegments)[0] as unknown as OrthoSegType;
                if (currentOrtho !== orthoSeg && (nested.source as unknown) === (mainSeg.nested as unknown)) {
                    nested.replace(null);
                }

                currentOrtho = orthoSeg;
                nested.replace(mainSeg.nested as unknown as EReadCollection<NestedSegType[]> | null);
                updateNestedCards(result, setBasisResult, nested);
            } else {
                currentOrtho = null;
                nested.replace(null);
                updateNestedCards(result, setBasisResult, nested);
            }

            return setBasisResult;
        },
        getBasis(): Basis {
            return basis;
        },
        fire(): void {
            fireCardPlacement(result);
        },
        attrs: {},
        renderer: props.renderer ?? EMPTY_RENDERER,
        segAtPlace(seg: Place): ISeg | undefined {
            return basis.at(seg);
        },
        addWidget(vi: CardVi): void {
            vis[vi.treeUuid] = vi;
        },
        removeWidget(vi: CardVi): void {
            delete vis[vi.treeUuid];
        },
        getViByUuid(treeUuid: string): CardVi | undefined {
            return vis[treeUuid];
        },
        getSelfPos(): { [name: string]: ISeg } {
            return basis.segTypeNameToSegDict;
        },
        resolveSelfPosition(place: ISeg): ISeg | null {
            return resolveSelfPosition(selfPos, place, result);
        },
        resolveChildPosition(place: ISeg, child: ICard): ISeg | null {
            return resolveChildPositionFromMap(childPos, child, place, result);
        },
        childCardAtCoord(coord: CardCoord): ECollectionItemType<EMapped<NestedSegType[], TableRow>>[number] | undefined {
            return childCardAtCoordFromCard(result, coord);
        },
        coordHelper(coord: CardCoord, treeUuid: string) {
            return createCardCoordHelper(result, coord, treeUuid);
        },
    };

    return result;
}
