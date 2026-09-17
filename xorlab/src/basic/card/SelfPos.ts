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
import type { ICard } from "../../facade/card";

/**
 * Resolves where a card sits relative to a place segment in the segment tree.
 *
 * @remarks Do not annotate callback parameters with `any`. Prefer omitting annotations so
 * preprocessor-generated `GenSegments` / `GenCards` types apply, or supply explicit
 * segment/card types. Using `any` here is bad practice and defeats type checking.
 * Name handler parameters `place` (segment along which the card is positioned) and
 * `self` (the card itself).
 */
export type SelfPos<
    PlaceType extends ISeg = ISeg,
    SelfType extends ICard = ICard,
    ResultType extends ISeg | null = ISeg
> = (place: PlaceType, self: SelfType) => ResultType;

export type SelfPosersMapFromSchema<
    SelfPosType extends { [name: string]: ISeg },
    SelfType extends ICard = ICard,
> = {
    [PlaceName in keyof SelfPosType]?: SelfPos<SelfPosType[PlaceName], SelfType, ISeg | null>;
};

/** Single-argument selfPos handlers keyed by preprocessor segment types (table and tree cards). */
export type PlaceSelfPosFactories = Partial<{
    [PlaceType in keyof GenSegments]: (place: GenSegments[PlaceType]) => ISeg | null | undefined;
}>;

export type ExactPlaceSelfPosFactories<
    SelfPos extends PlaceSelfPosFactories,
> = SelfPos & {
    [Key in Exclude<keyof SelfPos, keyof PlaceSelfPosFactories>]: never;
};

export function adaptPlaceSelfPosFactories<
    SelfType extends ICard = ICard,
>(selfPos: PlaceSelfPosFactories): SelfPosersMapFromSchema<{ [place: string]: ISeg }, SelfType> {
    const adapted: SelfPosersMapFromSchema<{ [place: string]: ISeg }, SelfType> = {};
    for (const key of Object.keys(selfPos)) {
        const handler = selfPos[key as keyof PlaceSelfPosFactories];
        if (handler) {
            adapted[key] = (place, _self) =>
                (handler as (place: ISeg) => ISeg | null | undefined)(place) ?? null;
        }
    }
    return adapted;
}

/**
 * Resolves where `self` sits along `place`.
 *
 * When no handler is registered for `place.typeName` (including an omitted or empty
 * `selfPos` map), returns `place` itself — the card **stretches to the whole parent**
 * basis. Type Partition intermediate containers rely on this identity fallback.
 *
 * @see ../../../../README.md#default-stretch-when-selfpos-is-omitted
 * @see ../../../../README.md#type-partition-pattern
 */
export function resolveSelfPosition<
    SelfPosType extends { [name: string]: ISeg },
    SelfType extends ICard = ICard,
>(
    selfPosers: SelfPosersMapFromSchema<SelfPosType, SelfType>,
    place: ISeg,
    self: SelfType
): ISeg | null {
    const selfPos = selfPosers[place.typeName as keyof SelfPosType] as
        | SelfPos<ISeg, SelfType, ISeg | null>
        | undefined;

    return selfPos ? selfPos(place, self) : place;
}
