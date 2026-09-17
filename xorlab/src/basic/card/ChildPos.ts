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
 * Resolves where a nested child card sits relative to a place segment.
 *
 * @remarks Do not annotate callback parameters with `any`. Prefer omitting annotations so
 * preprocessor-generated types apply, or supply explicit segment/card types. Using `any`
 * here is bad practice and defeats type checking. Name handler parameters `place`, `child`,
 * and `self`.
 */
export type ChildPos<
    PlaceType extends ISeg = ISeg,
    SelfType extends ICard = ICard,
> = (place: PlaceType, child: ICard, self: SelfType) => ISeg | null | undefined;

export type ChildPosersMapFromSchema<
    SelfPosType extends { [name: string]: ISeg },
    SelfType extends ICard = ICard,
> = {
    [PlaceName in keyof SelfPosType]?: ChildPos<SelfPosType[PlaceName], SelfType>;
};

export function resolveChildPositionFromMap<
    SelfPosType extends { [name: string]: ISeg },
    SelfType extends ICard = ICard,
>(
    childPosers: ChildPosersMapFromSchema<SelfPosType, SelfType>,
    child: ICard,
    place: ISeg,
    parent: SelfType,
): ISeg | null {
    const childPos = childPosers[place.typeName as keyof SelfPosType] as
        | ChildPos<ISeg, SelfType>
        | undefined;

    if (childPos) {
        const fromChildPos = childPos(place, child, parent);
        if (fromChildPos !== undefined) {
            return fromChildPos;
        }
    }

    return child.resolveSelfPosition(place);
}
