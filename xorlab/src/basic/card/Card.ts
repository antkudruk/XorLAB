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
 * Runtime card implementation in the basic layer.
 *
 * Application and example code should use {@link cardFactory} from `"xorlab"` (see
 * `xorlab/src/facade/card.ts`). `ICard` and `Card` types live in the facade layer.
 *
 * @see ../../facade/card.ts — public card API (`cardFactory`, `ICard`)
 */
import { EArray } from "../../collection/EArray";
import { Renderer } from "../../renderer/Renderer";
import { BasisPatch, createBasis, Place } from "./Basis";
import type { ISeg } from "../../facade/line";
import { updateNestedCards } from "./NestedCardsCollection";
import { CardVi } from "../../renderer/CardVi";
import { v4 as uuidv4 } from "uuid";
import { EMPTY_RENDERER } from "../../renderer/Renderer";
import { EMapped } from "../../collection/EMapped";
import { createCardChildPos, createMappedCardChildPos } from "./CardChildPos";
import { ChildPosersMapFromSchema } from "./ChildPos";
import { resolveSelfPosition, SelfPosersMapFromSchema } from "./SelfPos";
import type {
    Card,
    CardSelf,
    ChildPosFactories,
    ExactChildPosFactories,
    ExactSelfPosFactories,
    ICard,
    SelfPosFactories,
} from "../../facade/card";
import type { EReadCollection } from "../../facade/collection";
import type { ECollectionItemType } from "../../facade/table";
import { childCardAtCoordFromCard } from "../../renderer/CoordHitTest";
import type { CardCoord, MouseClickHandler, MouseDoubleClickHandler, MouseDownHandler, MouseDragHandler, MouseOverHandler, MouseUpHandler } from "../../renderer/MouseInteraction";
import { createCardCoordHelper } from "../../facade/CardCoordHelper";
import { fireCardPlacement } from "./fireCard";

export interface CreateCardProps<
    NestedModel extends EReadCollection<ICard[]>,
    TypeName extends string,
    Attributes extends {},
    SelfPos extends SelfPosFactories<CardSelf<NestedModel, TypeName, Attributes>> = SelfPosFactories<CardSelf<NestedModel, TypeName, Attributes>>,
    ChildPos extends ChildPosFactories<CardSelf<NestedModel, TypeName, Attributes>> = ChildPosFactories<CardSelf<NestedModel, TypeName, Attributes>>,
> {
    readonly nested?: NestedModel | (NestedModel extends EReadCollection<infer Items> ? Items : never);
    readonly typeName?: TypeName;
    readonly attrs?: Attributes;
    readonly renderer?: Renderer<Attributes>;
    /** @remarks See facade `CardProps.selfPos` — keep inline, no `any`, name args `place` and `self`. */
    readonly selfPos?: ExactSelfPosFactories<SelfPos, CardSelf<NestedModel, TypeName, Attributes>>;
    /** @remarks See facade `CardProps.childPos` — keep inline, no `any`, name args `place`, `child`, and `self`. */
    readonly childPos?: ExactChildPosFactories<ChildPos, CardSelf<NestedModel, TypeName, Attributes>>;
    /** Stacking order among siblings; default `0`. See facade `CardProps.zIndex`. */
    readonly zIndex?: number;
    readonly mouseOver?: MouseOverHandler<ICard>;
    readonly mouseClick?: MouseClickHandler<ICard>;
    readonly mouseDoubleClick?: MouseDoubleClickHandler<ICard>;
    readonly mouseDown?: MouseDownHandler<ICard>;
    readonly mouseDrag?: MouseDragHandler<ICard>;
    readonly mouseUp?: MouseUpHandler<ICard>;
}

function adaptCardNested<NestedModel extends EReadCollection<ICard[]>>(
    nested?: NestedModel | (NestedModel extends EReadCollection<infer Items> ? Items : never),
): NestedModel {
    if (nested === undefined) {
        return new EArray<ICard>() as unknown as NestedModel;
    }
    if (Array.isArray(nested)) {
        return new EArray<ICard>(...(nested as ICard[])) as unknown as NestedModel;
    }
    return nested;
}

/**
 * Internal runtime constructor for cards. Called by {@link cardFactory} in the facade layer.
 *
 * @remarks Not part of the `xorlab` package public API. Application code should import
 * `cardFactory` from `"xorlab"` instead of calling `createCard` or deep-importing this module.
 *
 * @see ../../facade/card.ts — `cardFactory`
 */
export function createCard<
    NestedModel extends EReadCollection<ICard[]>,
    TypeName extends string,
    Attributes extends {} = {},
    SelfPos extends SelfPosFactories<CardSelf<NestedModel, TypeName, Attributes>> = SelfPosFactories<CardSelf<NestedModel, TypeName, Attributes>>,
    ChildPos extends ChildPosFactories<CardSelf<NestedModel, TypeName, Attributes>> = ChildPosFactories<CardSelf<NestedModel, TypeName, Attributes>>,
>(props: CreateCardProps<NestedModel, TypeName, Attributes, SelfPos, ChildPos>): Card<NestedModel, TypeName, Attributes> {
    const basis = createBasis();
    const nested = adaptCardNested(props.nested);
    const vis: { [treeUuid: string]: CardVi } = {};
    const selfPos = (props.selfPos || {}) as SelfPosersMapFromSchema<{ [pos: string]: ISeg }, ICard>;
    const explicitChildPos = props.childPos as ChildPosersMapFromSchema<{ [name: string]: ISeg }> | undefined;
    const cardChildPos = nested instanceof EMapped
        ? createMappedCardChildPos(nested, explicitChildPos)
        : createCardChildPos(explicitChildPos);

    const result: Card<NestedModel, TypeName, Attributes> = {
        vis,
        uuid: uuidv4(),
        nested: nested,
        typeName: props.typeName || (uuidv4() as TypeName),
        zIndex: props.zIndex ?? 0,
        setBasis: (basisPatch: BasisPatch) => {
            const setBasisResult = basis.setBasis(basisPatch, result);

            Object.values(vis).forEach((it) => {
                it.afterSetBasis({
                    patchResult: setBasisResult,
                    basisPart: basisPatch,
                });
            });

            updateNestedCards(result, setBasisResult, nested);
            return setBasisResult;
        },
        getBasis() {
            return basis;
        },
        fire(): void {
            fireCardPlacement(result);
        },
        attrs: (props.attrs || {}) as Attributes,
        renderer: props.renderer || EMPTY_RENDERER,
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
            return cardChildPos.resolve(place, child, result);
        },
        mouseOver: props.mouseOver,
        mouseClick: props.mouseClick,
        mouseDoubleClick: props.mouseDoubleClick,
        mouseDown: props.mouseDown,
        mouseDrag: props.mouseDrag,
        mouseUp: props.mouseUp,
        childCardAtCoord(coord: CardCoord): ECollectionItemType<NestedModel>[number] | undefined {
            return childCardAtCoordFromCard(result, coord);
        },
        coordHelper(coord: CardCoord, treeUuid: string) {
            return createCardCoordHelper(result, coord, treeUuid);
        },
    };

    return result;
}
