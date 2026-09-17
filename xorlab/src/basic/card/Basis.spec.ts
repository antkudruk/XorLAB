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
import type { ISeg } from "../../facade/line";
import type { ICard } from "../../facade/card";
import { createBasis } from "./Basis";

describe("Basis test", () => {
    const mockCard = mock<ICard>();

    test("Empty patch", () => {
        const testSubject = createBasis();
        const result = testSubject.setBasis({}, mockCard);
        expect(result.updatedBasisPart).toEqual({});
        expect(result.droppedBasisPart).toEqual({});
    });

    test("Assigned segment to a card", () => {
        const placeId = "1";
        const mockSeg: ISeg = mock<ISeg>({ id: "placeId" });
        const testSubject = createBasis();

        const result = testSubject.setBasis({ [placeId]: mockSeg }, mockCard);

        expect(result.updatedBasisPart).toEqual({ placeId: mockSeg });
        expect(result.droppedBasisPart).toEqual({});
        expect(mockSeg.subscribeCard).toHaveBeenCalledWith(mockCard);
    });

    test("Come to the same seg from the different places", () => {
        const placeId0 = "0";
        const placeId1 = "1";
        const mockSeg: ISeg = mock<ISeg>({ id: "shared-seg" });
        const testSubject = createBasis();
        testSubject.setBasis({ [placeId0]: mockSeg }, mockCard);

        const result = testSubject.setBasis({ [placeId1]: mockSeg }, mockCard);

        expect(result.updatedBasisPart).toEqual({});
        expect(result.droppedBasisPart).toEqual({});
        expect(testSubject.at({ id: placeId0 })).toEqual(mockSeg);
        expect(testSubject.at({ id: placeId1 })).toEqual(mockSeg);
    });

    test("Update segment at the same place", () => {
        const placeId = "0";
        const mockSeg0: ISeg = mock<ISeg>({ id: "mockSeg0" });
        const mockSeg1: ISeg = mock<ISeg>({ id: "mockSeg1" });
        const testSubject = createBasis();
        testSubject.setBasis({ [placeId]: mockSeg0 }, mockCard);

        const result = testSubject.setBasis({ [placeId]: mockSeg1 }, mockCard);

        expect(result.updatedBasisPart).toEqual({ mockSeg1: mockSeg1 });
        expect(result.droppedBasisPart).toEqual({ mockSeg0: null });
        expect(testSubject.at({ id: placeId })).toEqual(mockSeg1);
        expect(mockSeg0.unsubscribeCard).toHaveBeenCalledWith(mockCard);
    });
});
