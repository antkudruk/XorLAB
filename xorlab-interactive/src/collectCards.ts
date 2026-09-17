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

import type { ICard } from "xorlab";

/**
 * Depth-first walk of a card tree, collecting every card whose `typeName` matches.
 * Used by select controllers after `bindWidget` when `cardTypeName` is configured.
 *
 * When `GenCards` is populated by the preprocessor, a literal `typeName` returns
 * `GenCards[K][]`. With an empty `GenCards` (xorlab package build), only the
 * string overload applies and the result is `ICard[]`.
 */
export function collectCardsByTypeName<K extends keyof GenCards>(
    root: ICard,
    typeName: K,
): Array<GenCards[K]>;
export function collectCardsByTypeName(root: ICard, typeName: string): ICard[];
export function collectCardsByTypeName(root: ICard, typeName: string): ICard[] {
    const result: ICard[] = [];
    const visit = (card: ICard): void => {
        if (card.typeName === typeName) {
            result.push(card);
        }
        card.nested.forEach(visit);
    };
    visit(root);
    return result;
}
