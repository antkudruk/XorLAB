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
 * Runtime segment implementation in the basic layer.
 *
 * Application and example code should use {@link segFactory} from `"xorlab"` (see
 * `xorlab/src/facade/line.ts`). `ISeg` and `Seg` types live in the facade layer.
 *
 * @see ../facade/line.ts — public segment API (`segFactory`, `ISeg`)
 */
import type { ICard } from "../facade/card";
import type {
    ISeg,
    OrthoCardFactories,
    Seg,
    SegOrthoSelf,
} from "../facade/line";
import type { EReadCollection } from "../facade/collection";
import { childSegAtCoordFromSeg } from "../renderer/CoordHitTest";
import type { MouseClickHandler, MouseDoubleClickHandler, MouseDownHandler, MouseDragHandler, MouseOverHandler, MouseUpHandler, SegCoord } from "../renderer/MouseInteraction";
import { createTable } from "./table/Table";
import { createDefaultOrthoFactory } from "./table/OrthoFactory";
import { EArray } from "../collection/EArray";
import { v4 as uuidv4 } from "uuid";
import { SegVi } from "../renderer/segment/SegVi";
import { EStyle } from "../renderer/Size";
import { ECollectionItemType } from "../facade";
import { createCoordHelper } from "../facade/CoordHelper";

export interface CreateSegProps<
    NestedModel extends EReadCollection<ISeg[]>,
    TypeName extends string,
    Attributes extends {},
    CardFactories extends OrthoCardFactories<SegOrthoSelf<NestedModel, TypeName, Attributes>> = OrthoCardFactories<SegOrthoSelf<NestedModel, TypeName, Attributes>>,
> {
    readonly nested?: NestedModel | (NestedModel extends EReadCollection<infer Items> ? Items : never);
    readonly typeName?: TypeName;
    readonly attrs?: Attributes;
    /** @remarks See facade `SegProps.cardFactories` — keep inline, no `any`, name args `ortho` and `self`. */
    readonly cardFactories?: CardFactories;
    readonly style?: EStyle;
    readonly mouseOver?: MouseOverHandler<ISeg>;
    readonly mouseClick?: MouseClickHandler<ISeg>;
    readonly mouseDoubleClick?: MouseDoubleClickHandler<ISeg>;
    readonly mouseDown?: MouseDownHandler<ISeg>;
    readonly mouseDrag?: MouseDragHandler<ISeg>;
    readonly mouseUp?: MouseUpHandler<ISeg>;
}

function adaptSegNested<NestedModel extends EReadCollection<ISeg[]>>(
    nested?: NestedModel | (NestedModel extends EReadCollection<infer Items> ? Items : never),
): EReadCollection<ISeg[]> {
    if (nested === undefined) {
        return new EArray<ISeg>();
    }
    if (Array.isArray(nested)) {
        return new EArray<ISeg>(...(nested as ISeg[]));
    }
    return nested;
}

export const STYLE_DEFAULTS: Pick<EStyle, "window" | "collapsed"> = {
    window: "auto",
    collapsed: false,
};

/**
 * Internal runtime constructor for segments. Called by {@link segFactory} in the facade layer.
 *
 * @remarks Not part of the `xorlab` package public API. Application code should import
 * `segFactory` from `"xorlab"` instead of calling `createSeg` or deep-importing this module.
 *
 * @see ../facade/line.ts — `segFactory`
 */
export function createSeg<
    NestedModel extends EReadCollection<ISeg[]>,
    TypeName extends string = string,
    Attributes extends {} = {},
    CardFactories extends OrthoCardFactories<SegOrthoSelf<NestedModel, TypeName, Attributes>> = OrthoCardFactories<SegOrthoSelf<NestedModel, TypeName, Attributes>>,
>(props: CreateSegProps<NestedModel, TypeName, Attributes, CardFactories>): Seg<NestedModel, TypeName, Attributes, CardFactories> {
    let cards: ICard[] = [];
    const vis: { [uuid: string]: SegVi } = {};
    const nested = adaptSegNested(props.nested);
    const typeName = (props.typeName || uuidv4()) as TypeName;
    const cardFactories = props.cardFactories || {};

    const result = {
        id: uuidv4(),
        vis,
        nested: nested as unknown as NestedModel,
        typeName,
        attrs: (props.attrs || {}) as Attributes,
        cardFactories,
        get cards(): readonly ICard[] {
            return cards;
        },
        unsubscribeCard(card: ICard): void {
            cards = cards.filter(candidate => candidate !== card);
        },
        subscribeCard(card: ICard): void {
            cards.push(card);
        },
        getViByUuid(uuid: string): SegVi | undefined {
            return vis[uuid];
        },
        subscribeVi(treeUuid: string, vi: SegVi): void {
            vis[treeUuid] = vi;
        },
        unsubscribeVi(treeUuid: string): void {
            delete vis[treeUuid];
        },
        style: {
            ...STYLE_DEFAULTS,
            ...(props.style || {}),
        },
        extrude(ortho: ISeg): ICard {
            return createTable({
                mainLine: typeName,
                orthoLine: ortho.typeName,
                orthoFactory: createDefaultOrthoFactory(typeName, ortho.typeName),
            }) as unknown as ICard;
        },
        mouseOver: props.mouseOver,
        mouseClick: props.mouseClick,
        mouseDoubleClick: props.mouseDoubleClick,
        mouseDown: props.mouseDown,
        mouseDrag: props.mouseDrag,
        mouseUp: props.mouseUp,
        childSegAtCoord(coord: SegCoord, treeUuid: string): ECollectionItemType<NestedModel>[number] | undefined {
            return childSegAtCoordFromSeg(result, coord, treeUuid);
        },
        coordHelper(coord: SegCoord, treeUuid: string) {
            return createCoordHelper(result, coord, treeUuid);
        },
    } as Seg<NestedModel, TypeName, Attributes, CardFactories>;

    return result;
}
