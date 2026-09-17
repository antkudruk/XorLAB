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

import type { ISeg } from "../facade/line";
import type { ICard } from "../../facade/card";
import { resolveChildPositionFromMap } from "../card/ChildPos";
import { createTableChildPos } from "./TableChildPos";
import { EArray } from "../../collection/EArray";

describe("createTableChildPos", () => {

    test("maps row children to main line nested segments by index", () => {
        const rowSeg0 = { id: "row-0" } as ISeg;
        const rowSeg1 = { id: "row-1" } as ISeg;
        const mainNested = new EArray<ISeg>(rowSeg0, rowSeg1);
        const place = {
            id: "main-id",
            typeName: "TeacherListSeg",
            nested: mainNested,
        } as unknown as ISeg;

        const child0 = {} as ICard;
        const child1 = {} as ICard;
        const parentNested = new EArray<ICard>(child0, child1);
        const parent = { nested: parentNested } as unknown as ICard;
        const childPos = createTableChildPos("TeacherListSeg");

        expect(resolveChildPositionFromMap(childPos, child0, place, parent)).toBe(rowSeg0);
        expect(resolveChildPositionFromMap(childPos, child1, place, parent)).toBe(rowSeg1);
    });
});
