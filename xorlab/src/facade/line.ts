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
 * Facade segment API: typed `ISeg` / `Seg` interfaces and the public `segFactory` entry point.
 *
 * `segFactory` delegates to `createSeg` in `xorlab/src/basic/Seg.ts`. The xorlab preprocessor
 * scans `segFactory` calls with string-literal `typeName` values to generate `GenSegments`.
 *
 * @see ../basic/Seg.ts — internal runtime constructor (`createSeg`)
 * @see ../../README.md#callback-typing-convention — `cardFactories` typing and naming
 */
import { createSeg } from "../basic/Seg";
import type { SegVi } from "../renderer/segment/SegVi";
import type {
    MouseClickHandler,
    MouseDoubleClickHandler,
    MouseDownHandler,
    MouseDragHandler,
    MouseOverHandler,
    MouseUpHandler,
    SegCoord,
} from "../renderer/MouseInteraction";
import type { ICard } from "./card";
import type { CoordHelper } from "./CoordHelper";
import { EReadCollection } from "./collection";
import { EStyle } from "./style";
import { ECollectionItemType } from ".";

/**
 * Maps ortho segment type names to intersection-card factories for table rows.
 *
 * @remarks Do not annotate callback parameters with `any`. Prefer omitting annotations so
 * preprocessor-generated `GenSegments` / `GenOrthoCardFactories` types apply, or supply
 * explicit segment types. Using `any` here is bad practice and defeats type checking.
 * Keep handlers inline inside `segFactory`; do not extract `cardFactories` into helpers
 * returning `: any`. Name handler parameters `ortho` (orthogonal segment) and `self`
 * (the owning segment).
 */
export type OrthoCardFactories<Self extends ISeg> = Partial<GenOrthoCardFactories<Self>>;

export type ExactOrthoCardFactories<
    CardFactories extends OrthoCardFactories<Self>,
    Self extends ISeg,
> = CardFactories & {
    [Key in Exclude<keyof CardFactories, keyof OrthoCardFactories<Self>>]: never;
};

export type SegOrthoSelf<
    NestedModel extends EReadCollection<ISeg[]>,
    TypeName extends string,
    Attrs extends {},
> = TypeName extends keyof GenSegments
    ? GenSegments[TypeName]
    : ISeg & {
        readonly nested: NestedModel;
        readonly typeName: TypeName;
        readonly attrs: Attrs;
        readonly cardFactories: OrthoCardFactories<ISeg>;
    };

export interface ISeg {
    readonly id: string;
    readonly nested: EReadCollection<ISeg[]>;
    readonly typeName: string;
    readonly attrs: {};
    readonly style: Required<EStyle>;
    /**
     * SegVi instances keyed by widget axis-tree UUID (one entry per mounted widget axis).
     * Widget owns these; do not store SegVi in application code — look up by treeUuid
     * at the call site.
     * @see ../../README.md#cardvi-and-segvi
     */
    readonly vis: { [uuid: string]: SegVi };
    readonly cards: readonly ICard[];
    readonly cardFactories: OrthoCardFactories<ISeg>;
    readonly mouseOver?: MouseOverHandler<ISeg>;
    readonly mouseClick?: MouseClickHandler<ISeg>;
    readonly mouseDoubleClick?: MouseDoubleClickHandler<ISeg>;
    readonly mouseDown?: MouseDownHandler<ISeg>;
    readonly mouseDrag?: MouseDragHandler<ISeg>;
    readonly mouseUp?: MouseUpHandler<ISeg>;
    unsubscribeCard(card: ICard): void;
    subscribeCard(card: ICard): void;
    subscribeVi(treeUuid: string, vi: SegVi): void;
    unsubscribeVi(treeUuid: string): void;
    getViByUuid(uuid: string): SegVi | undefined;
    extrude(ortho: ISeg): ICard;
    childSegAtCoord(coord: SegCoord, treeUuid: string): ISeg | undefined;
    /**
     * Fluent walk of nested segments along `coord` using `treeUuid` for Vi lookup.
     * Call on the segment that owns `coord` (typically `self` in a mouse handler:
     * `self.coordHelper(event.local, event.treeUuid)`).
     * @see ./CoordHelper.ts
     * @see ../../README.md#coord-helper-api
     */
    coordHelper(coord: SegCoord, treeUuid: string): CoordHelper<this>;
}

export interface SegProps<
    NestedModel extends EReadCollection<ISeg[]>,
    TypeName extends string,
    Attrs extends {},
    CardFactories extends OrthoCardFactories<SegOrthoSelf<NestedModel, TypeName, Attrs>>,
> {
    readonly nested?: NestedModel | (NestedModel extends EReadCollection<infer Items> ? Items : never);
    readonly typeName?: TypeName;
    readonly attrs?: Attrs;
    /**
     * Maps ortho segment type names to factories that produce intersection cards
     * when this segment is a main-line row in a table built via tableFactory or extrude.
     * Each factory receives (ortho, self) and returns an ICard.
     *
     * @remarks Do not annotate callback parameters with `any`. Prefer omitting annotations so
     * preprocessor-generated types apply, or supply explicit segment types. Using `any`
     * here is bad practice and defeats type checking. Keep handlers inline inside `segFactory`;
     * do not extract `cardFactories` into helpers returning `: any`. Name handler parameters
     * `ortho` and `self`.
     *
     * Do not branch `cardFactories` on ortho type when the table or extrude context already
     * fixes which ortho segments apply (via `mainLine` / `orthoLine`). Declare only the keys
     * needed for that table geometry.
     * @see ../../README.md#selfpos-scope--no-axis-conditionals
     */
    readonly cardFactories?: ExactOrthoCardFactories<CardFactories, SegOrthoSelf<NestedModel, TypeName, Attrs>>;
    /**
     * Inline segment layout style. Prefer defining the same style on `Widget({ styleSheet })`
     * at mount time; styleSheet entries override inline styles when present.
     */
    readonly style?: EStyle;
    /**
     * Inline mouse-over handler. Prefer defining the same handler on `Widget({ callbackTable })`
     * at mount time; callbackTable entries override inline handlers when present.
     */
    readonly mouseOver?: MouseOverHandler<SegOrthoSelf<NestedModel, TypeName, Attrs>>;
    /**
     * Inline mouse-click handler. Prefer defining the same handler on `Widget({ callbackTable })`
     * at mount time; callbackTable entries override inline handlers when present.
     */
    readonly mouseClick?: MouseClickHandler<SegOrthoSelf<NestedModel, TypeName, Attrs>>;
    /**
     * Inline mouse double-click handler. Prefer defining the same handler on `Widget({ callbackTable })`
     * at mount time; callbackTable entries override inline handlers when present.
     */
    readonly mouseDoubleClick?: MouseDoubleClickHandler<SegOrthoSelf<NestedModel, TypeName, Attrs>>;
    /**
     * Inline mouse-down handler. Prefer `Widget({ callbackTable })` at mount time.
     */
    readonly mouseDown?: MouseDownHandler<SegOrthoSelf<NestedModel, TypeName, Attrs>>;
    /**
     * Inline mouse-drag handler. Prefer `Widget({ callbackTable })` at mount time.
     */
    readonly mouseDrag?: MouseDragHandler<SegOrthoSelf<NestedModel, TypeName, Attrs>>;
    /**
     * Inline mouse-up handler. Prefer `Widget({ callbackTable })` at mount time.
     */
    readonly mouseUp?: MouseUpHandler<SegOrthoSelf<NestedModel, TypeName, Attrs>>;
}

export interface Seg<
    NestedModel extends EReadCollection<ISeg[]>,
    TypeName extends string,
    Attrs extends {},
    CardFactories extends OrthoCardFactories<SegOrthoSelf<NestedModel, TypeName, Attrs>>,
> extends ISeg {
    readonly __nestedItemType?: NestedModel extends EReadCollection<infer Items> ? Items[number] : never;
    readonly nested: NestedModel;
    readonly typeName: TypeName;
    readonly attrs: Attrs;
    /** See {@link SegProps.cardFactories}. */
    readonly cardFactories: CardFactories;
    readonly resolvedStyle?: EStyle;
    childSegAtCoord(coord: SegCoord, treeUuid: string): ECollectionItemType<NestedModel>[number] | undefined;
    coordHelper(coord: SegCoord, treeUuid: string): CoordHelper<this>;
}

/**
 * Public entry point for creating segments.
 *
 * Delegates to `createSeg` in `xorlab/src/basic/Seg.ts`. When `typeName` is a string literal,
 * the xorlab preprocessor infers segment types into `generated/generated-lines.d.ts` (`GenSegments`).
 *
 * @see ../basic/Seg.ts — internal implementation (`createSeg`)
 * @see ../../README.md#callback-typing-convention — `cardFactories` typing and naming
 *
 * @remarks Prefer aligning runtime and facade prop types so `nested` and `cardFactories` pass through
 * without `as unknown as`. Remaining casts here are for handler variance (`mouseOver` / `mouseClick` / `mouseDoubleClick`)
 * and preprocessor return branding (`SegAdapter`).
 */
export function segFactory<
    NestedModel extends EReadCollection<ISeg[]>,
    TypeName extends string,
    Attrs extends {},
    CardFactories extends OrthoCardFactories<SegOrthoSelf<NestedModel, TypeName, Attrs>>,
>(props: SegProps<NestedModel, TypeName, Attrs, CardFactories>): SegAdapter<NestedModel, TypeName, Attrs, CardFactories> {
    return createSeg<NestedModel, TypeName, Attrs, CardFactories>({
        nested: props.nested,
        typeName: props.typeName,
        attrs: props.attrs,
        cardFactories: props.cardFactories,
        style: props.style,
        mouseOver: props.mouseOver as MouseOverHandler<ISeg> | undefined,
        mouseClick: props.mouseClick as MouseClickHandler<ISeg> | undefined,
        mouseDoubleClick: props.mouseDoubleClick as MouseDoubleClickHandler<ISeg> | undefined,
        mouseDown: props.mouseDown as MouseDownHandler<ISeg> | undefined,
        mouseDrag: props.mouseDrag as MouseDragHandler<ISeg> | undefined,
        mouseUp: props.mouseUp as MouseUpHandler<ISeg> | undefined,
    }) as unknown as SegAdapter<NestedModel, TypeName, Attrs, CardFactories>;
}

export type SegAdapter<
    NestedModel extends EReadCollection<ISeg[]>,
    TypeName extends string,
    Attrs extends {},
    CardFactories extends OrthoCardFactories<SegOrthoSelf<NestedModel, TypeName, Attrs>>,
> = TypeName extends keyof GenSegments ? GenSegments[TypeName] : Seg<NestedModel, TypeName, Attrs, CardFactories>;
