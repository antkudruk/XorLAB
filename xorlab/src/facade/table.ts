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

import { createTable as createRuntimeTable } from "../basic/table/Table";
import { createDefaultOrthoFactory } from "../basic/table/OrthoFactory";
import { Card, ICard } from "./card";
import { EReadCollection } from "./collection";
import { ISeg, Seg } from "./line";

export type SegLike = ISeg & { extrude(ortho: ISeg): ICard };
export type SegType<E extends keyof GenSegments> = GenSegments[E] & SegLike;
export type NestedModelType<E> = E extends Seg<infer NestedModel, any, any, any> ? NestedModel : never;
export type ECollectionItemType<E> = E extends EReadCollection<infer Items> ? Items : never;

export type TableSelfPosFactories = Partial<{
    [PlaceType in keyof GenSegments]: (place: GenSegments[PlaceType]) => ISeg | null | undefined;
}>;

export interface TableProps<
    MainLineType extends keyof GenSegments,
    OrthoLineType extends keyof GenSegments,
> {
    readonly mainLine: MainLineType;
    readonly orthoLine: OrthoLineType;
    /** Overrides default cardFactories lookup when provided. */
    readonly orthoFactory?: (
        item: ECollectionItemType<NestedModelType<SegType<MainLineType>>>[number],
        ortho: SegType<OrthoLineType>,
    ) => ICard;
    /**
     * Maps segment place type names to handlers that anchor the table card in a composite layout.
     *
     * @remarks Do not annotate callback parameters with `any`. Prefer omitting annotations so
     * preprocessor-generated `GenSegments` types apply, or supply explicit segment types.
     * Using `any` here is bad practice and defeats type checking. Keep handlers inline;
     * do not extract `selfPos` into helpers returning `: any`. Do not annotate `place` as `any`.
     * Name the handler parameter `place`.
     *
     * @see ../../README.md#callback-typing-convention
     */
    readonly selfPos?: TableSelfPosFactories;
}

/**
 * @remarks Prefer aligning runtime and facade prop types so `selfPos` and `orthoFactory` pass through
 * without `as unknown as`. Remaining cast is for preprocessor return branding.
 */
export function tableFactory<
    MainLineType extends keyof GenSegments,
    OrthoLineType extends keyof GenSegments,
>(props: TableProps<MainLineType, OrthoLineType>): Card<EReadCollection<ICard[]>, string, {}> {
    type MainItem = ECollectionItemType<NestedModelType<SegType<MainLineType>>>[number];
    type OrthoSeg = SegType<OrthoLineType>;

    const orthoFactory =
        props.orthoFactory ??
        createDefaultOrthoFactory(props.mainLine, props.orthoLine);

    return createRuntimeTable<MainItem, OrthoSeg, ICard>({
        mainLine: props.mainLine,
        orthoLine: props.orthoLine,
        orthoFactory,
        selfPos: props.selfPos,
    });
}
