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
import { createMappedCardChildPos } from "./CardChildPos";
import { EArray } from "../../collection/EArray";
import { EMapped } from "../../collection/EMapped";

describe("createMappedCardChildPos", () => {

    test("maps eMapped nested children to place nested segments by index", () => {
        const colSeg0 = { id: "col-0" } as ISeg;
        const colSeg1 = { id: "col-1" } as ISeg;
        const placeNested = new EArray<ISeg>(colSeg0, colSeg1);
        const place = {
            id: "columns-id",
            typeName: "TeacherColumnsSeg",
            nested: placeNested,
        } as unknown as ISeg;

        const child0 = {} as ICard;
        const child1 = {} as ICard;
        const mappedNested = new EMapped<ISeg, ICard>(
            placeNested,
            (_src, index) => (index === 0 ? child0 : child1),
        );
        const parent = { nested: mappedNested } as unknown as ICard;
        const cardChildPos = createMappedCardChildPos(mappedNested);

        expect(cardChildPos.resolve(place, child0, parent)).toBe(colSeg0);
        expect(cardChildPos.resolve(place, child1, parent)).toBe(colSeg1);
    });

    test("explicit childPos takes priority over mapped nested strategy", () => {
        const colSeg0 = { id: "col-0" } as ISeg;
        const explicitSeg = { id: "explicit" } as ISeg;
        const placeNested = new EArray<ISeg>(colSeg0);
        const place = {
            id: "columns-id",
            typeName: "TeacherColumnsSeg",
            nested: placeNested,
        } as unknown as ISeg;

        const child0 = {} as ICard;
        const mappedNested = new EMapped<ISeg, ICard>(
            placeNested,
            () => child0,
        );
        const parent = { nested: mappedNested } as unknown as ICard;
        const cardChildPos = createMappedCardChildPos(mappedNested, {
            TeacherColumnsSeg: () => explicitSeg,
        });

        expect(cardChildPos.resolve(place, child0, parent)).toBe(explicitSeg);
    });
});
