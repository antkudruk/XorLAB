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

import { mock } from "jest-mock-extended";
import { PatchBasisResult } from "./Basis";
import { calculateCardBasis, updateNestedCards } from "./NestedCardsCollection";
import type { ICard } from "../../facade/card";
import type { ISeg } from "../facade/line";
import { EArray } from "../../collection/EArray";
import { createMappedCardChildPos } from "./CardChildPos";
import { EMapped } from "../../collection/EMapped";

describe("calculateCardBasis returns the new basis for a nested card", () => {

    test("applies child selfPos mapping when parent has no childPos", () => {
        const placeId = "place ID";
        const place: ISeg = mock<ISeg>({ id: placeId, typeName: "row" });
        const newCardSelfPos = {[placeId]: place};

        const nestedSeg = mock<ISeg>();
        const child = mock<ICard>({
            resolveSelfPosition: () => nestedSeg,
        });
        const parent = mock<ICard>({
            resolveChildPosition: (_place, card) => card.resolveSelfPosition(_place),
        });
        const basisPatch: PatchBasisResult = {droppedBasisPart: {}, updatedBasisPart: newCardSelfPos};

        const result: {[placeId: string]: ISeg | null} = calculateCardBasis(parent, basisPatch, child);

        expect(result[placeId]).toBe(nestedSeg);
    });

    test("applies parent childPos mapping over child selfPos", () => {
        const placeId = "place ID";
        const place: ISeg = mock<ISeg>({ id: placeId, typeName: "row" });
        const childPosSeg = mock<ISeg>();
        const selfPosSeg = mock<ISeg>();
        const child = mock<ICard>({
            resolveSelfPosition: () => selfPosSeg,
        });
        const parent = mock<ICard>({
            resolveChildPosition: () => childPosSeg,
        });
        const basisPatch: PatchBasisResult = {
            droppedBasisPart: {},
            updatedBasisPart: { [placeId]: place },
        };

        const result = calculateCardBasis(parent, basisPatch, child);

        expect(result[placeId]).toBe(childPosSeg);
    });

    test("drops segments from the patch as-is", () => {
        const basisPatch: PatchBasisResult = {
            droppedBasisPart: { droppedSeg: null },
            updatedBasisPart: {},
        };

        const result = calculateCardBasis(mock<ICard>(), basisPatch, mock<ICard>());

        expect(result).toEqual({ droppedSeg: null });
    });

    test("keeps the whole place when neither childPos nor child selfPos is defined", () => {
        const placeId = "place ID";
        const place: ISeg = mock<ISeg>({ id: placeId, typeName: "row" });
        const basisPatch: PatchBasisResult = {
            droppedBasisPart: {},
            updatedBasisPart: { [placeId]: place },
        };

        const child = mock<ICard>({
            resolveSelfPosition: (input: ISeg) => input,
        });
        const parent = mock<ICard>({
            resolveChildPosition: (_place, card) => card.resolveSelfPosition(_place),
        });

        const result = calculateCardBasis(parent, basisPatch, child);

        expect(result[placeId]).toBe(place);
    });

    test("maps eMapped nested children to place nested segments by index", () => {
        const placeId = "columns-id";
        const colSeg0 = { id: "col-0" } as ISeg;
        const colSeg1 = { id: "col-1" } as ISeg;
        const placeNested = new EArray<ISeg>(colSeg0, colSeg1);
        const place = {
            id: placeId,
            typeName: "TeacherColumnsSeg",
            nested: placeNested,
        } as unknown as ISeg;

        const child0 = {
            resolveSelfPosition: (input: ISeg) => input,
        } as ICard;
        const child1 = {
            resolveSelfPosition: (input: ISeg) => input,
        } as ICard;
        const mappedNested = new EMapped<ISeg, ICard>(
            placeNested,
            (_src, index) => (index === 0 ? child0 : child1),
        );
        const cardChildPos = createMappedCardChildPos(mappedNested);
        const parent = {
            nested: mappedNested,
            resolveChildPosition: (p: ISeg, child: ICard) =>
                cardChildPos.resolve(p, child, parent as ICard),
        } as unknown as ICard;

        const basisPatch: PatchBasisResult = {
            droppedBasisPart: {},
            updatedBasisPart: { [placeId]: place },
        };

        expect(calculateCardBasis(parent, basisPatch, child0)[placeId]).toBe(colSeg0);
        expect(calculateCardBasis(parent, basisPatch, child1)[placeId]).toBe(colSeg1);
    });
});

describe("updateNestedCards", () => {

    test("merges basisExtension into nested card basis", () => {
        const stretchSeg = { id: "stretch" } as ISeg;
        const placeId = "place-id";
        const place = { id: placeId, typeName: "row" } as ISeg;
        const child = mock<ICard>({
            setBasis: jest.fn(),
            resolveSelfPosition: (input: ISeg) => input,
        });
        const parent = mock<ICard>({
            resolveChildPosition: (_place, card) => card.resolveSelfPosition(_place),
        });
        const nested = new EArray<ICard>(child);
        const basisPatch: PatchBasisResult = {
            droppedBasisPart: {},
            updatedBasisPart: { [placeId]: place },
        };

        updateNestedCards(parent, basisPatch, nested, { [stretchSeg.id]: stretchSeg });

        expect(child.setBasis).toHaveBeenCalledWith({
            [stretchSeg.id]: stretchSeg,
            [placeId]: place,
        });
    });
});
