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
import type { ISeg } from "../facade/line";
import type { ICard } from "../../facade/card";
import { resolveChildPositionFromMap } from "./ChildPos";

describe("resolveChildPositionFromMap", () => {

    test("uses childPos when defined", () => {
        const place = mock<ISeg>({ id: "place-id", typeName: "row" });
        const childPosSeg = mock<ISeg>();
        const parent = mock<ICard>();
        const child = mock<ICard>();

        const result = resolveChildPositionFromMap(
            {
                row: () => childPosSeg,
            },
            child,
            place,
            parent,
        );

        expect(result).toBe(childPosSeg);
    });

    test("falls through to child selfPos when childPos returns undefined", () => {
        const place = mock<ISeg>({ id: "place-id", typeName: "row" });
        const selfPosSeg = mock<ISeg>();
        const parent = mock<ICard>();
        const child = mock<ICard>({
            resolveSelfPosition: () => selfPosSeg,
        });

        const result = resolveChildPositionFromMap(
            {
                row: () => undefined,
            },
            child,
            place,
            parent,
        );

        expect(result).toBe(selfPosSeg);
    });

    test("childPos takes priority over child selfPos", () => {
        const place = mock<ISeg>({ id: "place-id", typeName: "row" });
        const childPosSeg = mock<ISeg>();
        const selfPosSeg = mock<ISeg>();
        const parent = mock<ICard>();
        const child = mock<ICard>({
            resolveSelfPosition: () => selfPosSeg,
        });

        const result = resolveChildPositionFromMap(
            {
                row: () => childPosSeg,
            },
            child,
            place,
            parent,
        );

        expect(result).toBe(childPosSeg);
    });

    test("falls back to child selfPos when childPos is not defined for place type", () => {
        const place = mock<ISeg>({ id: "place-id", typeName: "row" });
        const selfPosSeg = mock<ISeg>();
        const parent = mock<ICard>();
        const child = mock<ICard>({
            resolveSelfPosition: () => selfPosSeg,
        });

        const result = resolveChildPositionFromMap({}, child, place, parent);

        expect(result).toBe(selfPosSeg);
    });
});
