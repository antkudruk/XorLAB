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

export function buildMissingOrthoCardFactoryMessage(
    mainLine: string,
    orthoLine: string,
    itemTypeName: string,
): string {
    return (
        `No card factory registered for ortho segment type "${orthoLine}" ` +
        `in main line child segment type "${itemTypeName}" (main line "${mainLine}").\n` +
        `item.cardFactories["${orthoLine}"] is missing on ${itemTypeName}.\n` +
        `Fix A: Add cardFactories.${orthoLine} on ${itemTypeName}; return a card via ` +
        `cardFactory(...), tableFactory({ mainLine, orthoLine }), or ` +
        `ortho.extrude(self) / self.extrude(ortho).\n` +
        `Fix B: If this card must not use the default ortho lookup, pass orthoFactory ` +
        `to tableFactory instead of relying on per-segment cardFactories.`
    );
}

/**
 * Default ortho factory used by tableFactory and seg.extrude.
 * For each main-line child, looks up `item.cardFactories[orthoLine](ortho, item)`.
 *
 * @throws When `cardFactories[orthoLine]` is missing on a main-line child:
 *   - **Fix A:** add that entry; the factory must return an intersection card
 *     (`cardFactory`, nested `tableFactory`, or `extrude` shortcut).
 *   - **Fix B:** pass a custom `orthoFactory` to `tableFactory` to bypass
 *     per-segment `cardFactories` lookup.
 */
export function createDefaultOrthoFactory(mainLine: string, orthoLine: string) {
    return (item: ISeg, ortho: ISeg): ICard => {
        const factory = (item.cardFactories as Record<string, ((ortho: ISeg, self: ISeg) => ICard) | undefined>)[orthoLine];
        if (!factory) {
            const message = buildMissingOrthoCardFactoryMessage(
                mainLine,
                orthoLine,
                item.typeName,
            );
            console.error(message);
            throw new Error(message);
        }
        return factory(ortho, item);
    };
}
