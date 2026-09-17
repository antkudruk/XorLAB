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

import { EReadCollection } from "../../collection/ECollection";
import type { ISeg } from "../../facade/line";
import { PatchBasisResult, SelfPosPatch } from "./Basis";
import type { ICard } from "../../facade/card";

export function updateNestedCards(
    parent: ICard,
    patch: PatchBasisResult,
    nested: EReadCollection<ICard[]>,
    basisExtension?: SelfPosPatch,
): void {
    nested.forEach(card => {
        card.setBasis({
            ...basisExtension,
            ...calculateCardBasis(parent, patch, card),
        });
    });
}

export function calculateCardBasis(
    parent: ICard,
    patch: PatchBasisResult,
    child: ICard
): { [placeId: string]: ISeg | null } {
    return {
        ...patch.droppedBasisPart,
        ...calculateCardPlaces(parent, child, patch.updatedBasisPart),
    };
}

function calculateCardPlaces(
    parent: ICard,
    child: ICard,
    parentBasisPart: SelfPosPatch
): { [placeId: string]: ISeg | null } {
    const newNestedPlaces: { [placeId: string]: ISeg | null } = {};

    for (const placeForNestedCard of Object.values(parentBasisPart)) {
        if (!placeForNestedCard) {
            continue;
        }

        newNestedPlaces[placeForNestedCard.id] = parent.resolveChildPosition(placeForNestedCard, child);
    }

    return newNestedPlaces;
}
