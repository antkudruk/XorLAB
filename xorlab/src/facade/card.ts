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
 * Facade card API: typed `ICard` / `Card` interfaces and the public `cardFactory` entry point.
 *
 * `cardFactory` delegates to `createCard` in `xorlab/src/basic/card/Card.ts`. The xorlab preprocessor
 * scans `cardFactory` calls with string-literal `typeName` values to generate `GenCards`.
 *
 * @see ../basic/card/Card.ts — internal runtime constructor (`createCard`)
 * @see ../../README.md#callback-typing-convention — `selfPos` / `childPos` typing and naming
 */
import { createCard } from "../basic/card/Card";
import type { Basis, BasisPatch, PatchBasisResult, Place } from "../basic/card/Basis";
import type { CardVi } from "../renderer/CardVi";
import type { Renderer } from "../renderer/Renderer";
import type { EReadCollection } from "./collection";
import type { ECollectionItemType } from "./table";
import type { CardCoord, MouseClickHandler, MouseDoubleClickHandler, MouseDownHandler, MouseDragHandler, MouseInteractionEvent, MouseOverHandler, MouseUpHandler } from "../renderer/MouseInteraction";
import type { CardCoordHelper } from "./CardCoordHelper";
import type { ISeg } from "./line";

export interface ICard {
    readonly uuid: string;
    readonly nested: EReadCollection<ICard[]>;
    readonly attrs: {};
    /**
     * CardVi instances keyed by widget card-tree UUID (one entry per mounted widget).
     * Widget owns these; do not store CardVi in application code — look up by treeUuid
     * at the call site (`event.widgetTreeUuids.card` or `widget.treeUuids.card`).
     * @see ../../README.md#cardvi-and-segvi
     */
    readonly vis: { readonly [treeUuid: string]: CardVi };
    readonly renderer: Renderer;
    readonly typeName: string;
    /**
     * Stacking order among sibling cards that share bounds. Higher values paint and
     * hit-test on top. Default `0`.
     * @see ../../README.md#type-partition-pattern
     */
    readonly zIndex: number;
    readonly mouseOver?: MouseOverHandler<ICard>;
    readonly mouseClick?: MouseClickHandler<ICard>;
    readonly mouseDoubleClick?: MouseDoubleClickHandler<ICard>;
    readonly mouseDown?: MouseDownHandler<ICard>;
    readonly mouseDrag?: MouseDragHandler<ICard>;
    readonly mouseUp?: MouseUpHandler<ICard>;
    setBasis(basisPart: BasisPatch): PatchBasisResult;
    getBasis(): Basis;
    /**
     * Re-resolve this card's own `selfPos` placement and nested children.
     * Call after attrs fields that drive `selfPos` change (for example after a
     * xorlab-interactive `DragController` `updateAttrs` callback). Placement updates flow through
     * `setBasis` → CardVi → SegVi CSS — do not write card DOM `left`/`top` directly.
     *
     * @see ../../README.md#dragcontroller
     * @see ../../README.md#icardfire
     */
    fire(): void;
    segAtPlace(seg: Place): ISeg | undefined;
    addWidget(vi: CardVi): void;
    removeWidget(vi: CardVi): void;
    getViByUuid(treeUuid: string): CardVi | undefined;
    getSelfPos(): { [name: string]: ISeg };
    resolveSelfPosition(place: ISeg): ISeg | null;
    resolveChildPosition(place: ISeg, child: ICard): ISeg | null;
    childCardAtCoord(coord: CardCoord): ICard | undefined;
    /**
     * Fluent walk of nested cards along `coord` using `treeUuid` for Vi lookup.
     * Call on the card that owns `coord` (typically `self` in a mouse handler:
     * `self.coordHelper(event.local, event.treeUuid)`).
     * @see ./CardCoordHelper.ts
     * @see ../../README.md#coord-helper-api
     */
    coordHelper(coord: CardCoord, treeUuid: string): CardCoordHelper<this>;
}

export interface Card<
    NestedModel extends EReadCollection<ICard[]>,
    TypeName extends string,
    Attrs extends {} = {},
> extends ICard {
    readonly nested: NestedModel;
    readonly typeName: TypeName;
    readonly attrs: Attrs;
    readonly renderer: Renderer<Attrs>;
    childCardAtCoord(coord: CardCoord): ECollectionItemType<NestedModel>[number] | undefined;
    coordHelper(coord: CardCoord, treeUuid: string): CardCoordHelper<this>;
}

export type CardSelf<
    NestedModel extends EReadCollection<ICard[]>,
    TypeName extends string,
    Attrs extends {},
> = TypeName extends keyof GenCards
    ? GenCards[TypeName]
    : ICard & {
        readonly nested: NestedModel;
        readonly typeName: TypeName;
        readonly attrs: Attrs;
    };

/**
 * Maps segment place type names to self-position handlers for a card.
 *
 * @remarks Do not annotate callback parameters with `any`. Prefer omitting annotations so
 * preprocessor-generated `GenSegments` / `GenCards` types apply, or supply explicit
 * segment/card types. Using `any` here is bad practice and defeats type checking.
 * Keep handlers inline inside `cardFactory`; do not extract `selfPos` into helpers returning `: any`.
 * Do not annotate `place` as `any` — that rejects the typed place segment from `GenSegments`.
 * Name handler parameters `place` (segment along which the card is positioned) and
 * `self` (the card itself).
 */
export type SelfPosFactories<Self extends ICard> = Partial<{
    [PlaceType in keyof GenSegments]: (place: GenSegments[PlaceType], self: Self) => ISeg | null | undefined;
}>;

export type ExactSelfPosFactories<
    SelfPos extends SelfPosFactories<Self>,
    Self extends ICard,
> = SelfPos & {
    [Key in Exclude<keyof SelfPos, keyof SelfPosFactories<Self>>]: never;
};

/**
 * Maps segment place type names to child-position handlers.
 *
 * @remarks Do not annotate callback parameters with `any`. Prefer omitting annotations so
 * preprocessor-generated `GenSegments` types apply, or supply explicit segment types.
 * Using `any` here is bad practice and defeats type checking.
 * Name handler parameters `place`, `child`, and `self`.
 */
export type ChildPosFactories<Self extends ICard> = Partial<{
    [PlaceType in keyof GenSegments]: (place: GenSegments[PlaceType], child: ICard, self: Self) => ISeg | null | undefined;
}>;

export type ExactChildPosFactories<
    ChildPos extends ChildPosFactories<Self>,
    Self extends ICard,
> = ChildPos & {
    [Key in Exclude<keyof ChildPos, keyof ChildPosFactories<Self>>]: never;
};

export type CardProps<
    NestedModel extends EReadCollection<ICard[]>,
    TypeName extends string,
    Attrs extends {},
    SelfPos extends SelfPosFactories<CardSelf<NestedModel, TypeName, Attrs>>,
    ChildPos extends ChildPosFactories<CardSelf<NestedModel, TypeName, Attrs>> = ChildPosFactories<CardSelf<NestedModel, TypeName, Attrs>>,
> = {
    readonly nested?: NestedModel | (NestedModel extends EReadCollection<infer Items> ? Items : never);
    readonly typeName?: TypeName;
    readonly attrs?: Attrs;
    /**
     * Maps segment place type names to handlers that resolve where this card sits in the tree.
     *
     * @remarks Do not annotate callback parameters with `any`. Prefer omitting annotations so
     * preprocessor-generated types apply, or supply explicit segment/card types. Using `any`
     * here is bad practice and defeats type checking. Keep handlers inline inside `cardFactory`;
     * do not extract `selfPos` into helpers returning `: any`. Do not annotate `place` as `any`.
     * Name handler parameters `place` and `self`.
     *
     * Declare handlers for all relevant coordinate places. Only the handler whose key matches
     * `place.typeName` runs at resolve time along the card's actual placement path. Do not use
     * conditional spreads to pick orthogonal row handlers; keep handlers inline.
     *
     * When `selfPos` is omitted or has no handler for a place, the card stretches to the whole
     * parent basis (identity fallback in `resolveSelfPosition`). See
     * [Default stretch when selfPos is omitted](../../README.md#default-stretch-when-selfpos-is-omitted)
     * and the [Type Partition Pattern](../../README.md#type-partition-pattern).
     * @see ../../README.md#selfpos-scope--no-axis-conditionals
     */
    readonly selfPos?: ExactSelfPosFactories<SelfPos, CardSelf<NestedModel, TypeName, Attrs>>;
    /**
     * Stacking order among sibling cards that share bounds. Higher values paint and hit-test
     * on top. Defaults to `0`.
     * @see ../../README.md#type-partition-pattern
     */
    readonly zIndex?: number;
    /**
     * Maps segment place type names to handlers that resolve nested child card positions.
     *
     * @remarks Do not annotate callback parameters with `any`. Prefer omitting annotations so
     * preprocessor-generated types apply, or supply explicit segment/card types. Using `any`
     * here is bad practice and defeats type checking. Name handler parameters `place`, `child`,
     * and `self`.
     */
    readonly childPos?: ExactChildPosFactories<ChildPos, CardSelf<NestedModel, TypeName, Attrs>>;
    readonly renderer?: Renderer;
    /**
     * Inline mouse-over handler. Prefer defining the same handler on `Widget({ callbackTable })`
     * at mount time; callbackTable entries override inline handlers when present.
     */
    readonly mouseOver?: MouseOverHandler<CardSelf<NestedModel, TypeName, Attrs>>;
    /**
     * Inline mouse-click handler. Prefer defining the same handler on `Widget({ callbackTable })`
     * at mount time; callbackTable entries override inline handlers when present.
     */
    readonly mouseClick?: MouseClickHandler<CardSelf<NestedModel, TypeName, Attrs>>;
    /**
     * Inline mouse double-click handler. Prefer defining the same handler on `Widget({ callbackTable })`
     * at mount time; callbackTable entries override inline handlers when present.
     */
    readonly mouseDoubleClick?: MouseDoubleClickHandler<CardSelf<NestedModel, TypeName, Attrs>>;
    /**
     * Inline mouse-down handler. Prefer `Widget({ callbackTable })` at mount time.
     * Starts a Widget drag session; see README Mouse Interaction drag rules.
     */
    readonly mouseDown?: MouseDownHandler<CardSelf<NestedModel, TypeName, Attrs>>;
    /**
     * Inline mouse-drag handler. Prefer `Widget({ callbackTable })` at mount time.
     * Fires after the drag threshold on the chain captured at mouseDown.
     */
    readonly mouseDrag?: MouseDragHandler<CardSelf<NestedModel, TypeName, Attrs>>;
    /**
     * Inline mouse-up handler. Prefer `Widget({ callbackTable })` at mount time.
     * Ends a Widget drag session on the chain captured at mouseDown.
     */
    readonly mouseUp?: MouseUpHandler<CardSelf<NestedModel, TypeName, Attrs>>;
};

/**
 * Public entry point for creating cards.
 *
 * Delegates to `createCard` in `xorlab/src/basic/card/Card.ts`. When `typeName` is a string literal,
 * the xorlab preprocessor infers card types into `generated/generated-cards.d.ts` (`GenCards`).
 *
 * @see ../basic/card/Card.ts — internal implementation (`createCard`)
 * @see ../../README.md#callback-typing-convention — `selfPos` / `childPos` typing and naming
 *
 * @remarks Prefer aligning runtime and facade prop types so `selfPos` and `childPos` pass through
 * without `as unknown as`. Remaining casts here are for handler variance (`mouseOver` / `mouseClick` / `mouseDoubleClick`)
 * and preprocessor return branding (`CardAdapter`).
 */
export function cardFactory<
    NestedModel extends EReadCollection<ICard[]>,
    TypeName extends string,
    Attrs extends {},
    SelfPos extends SelfPosFactories<CardSelf<NestedModel, TypeName, Attrs>>,
    ChildPos extends ChildPosFactories<CardSelf<NestedModel, TypeName, Attrs>> = ChildPosFactories<CardSelf<NestedModel, TypeName, Attrs>>,
>(props: CardProps<NestedModel, TypeName, Attrs, SelfPos, ChildPos>): CardAdapter<NestedModel, TypeName, Attrs> {
    return createCard<NestedModel, TypeName, Attrs, SelfPos, ChildPos>({
        nested: props.nested,
        typeName: props.typeName,
        attrs: props.attrs,
        selfPos: props.selfPos,
        childPos: props.childPos,
        zIndex: props.zIndex,
        renderer: props.renderer,
        mouseOver: props.mouseOver as MouseOverHandler<ICard> | undefined,
        mouseClick: props.mouseClick as MouseClickHandler<ICard> | undefined,
        mouseDoubleClick: props.mouseDoubleClick as MouseDoubleClickHandler<ICard> | undefined,
        mouseDown: props.mouseDown as MouseDownHandler<ICard> | undefined,
        mouseDrag: props.mouseDrag as MouseDragHandler<ICard> | undefined,
        mouseUp: props.mouseUp as MouseUpHandler<ICard> | undefined,
    }) as unknown as CardAdapter<NestedModel, TypeName, Attrs>;
}

export type CardAdapter<
    NestedModel extends EReadCollection<ICard[]>,
    TypeName extends string,
    Attrs extends {}
> = TypeName extends keyof GenCards ? GenCards[TypeName] : Card<NestedModel, TypeName, Attrs>;
