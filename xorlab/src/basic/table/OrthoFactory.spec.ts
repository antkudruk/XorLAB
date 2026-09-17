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
import { cardFactory } from "../../facade/card";
import { segFactory } from "../../facade/line";
import { createSeg } from "../Seg";
import {
    buildMissingOrthoCardFactoryMessage,
    createDefaultOrthoFactory,
} from "./OrthoFactory";

describe("createDefaultOrthoFactory", () => {
    let consoleErrorSpy: jest.SpyInstance;

    beforeEach(() => {
        consoleErrorSpy = jest.spyOn(console, "error").mockImplementation(() => undefined);
    });

    afterEach(() => {
        consoleErrorSpy.mockRestore();
    });

    test("returns card from item.cardFactories[orthoLine](ortho, item)", () => {
        const slotCard = cardFactory({ typeName: "SlotCard" });
        const ortho = { typeName: "ColSeg" } as ISeg;
        const item = {
            typeName: "RowSeg",
            cardFactories: {
                ColSeg: () => slotCard,
            },
        } as unknown as ISeg;

        const orthoFactory = createDefaultOrthoFactory("MainSeg", "ColSeg");
        const result = orthoFactory(item, ortho);

        expect(result).toBe(slotCard);
    });

    test("logs to console.error and throws when cardFactories[orthoLine] is missing", () => {
        const ortho = { typeName: "ColSeg" } as ISeg;
        const item = {
            typeName: "RowSeg",
            cardFactories: {},
        } as unknown as ISeg;

        const orthoFactory = createDefaultOrthoFactory("MainSeg", "ColSeg");
        const expectedMessage = buildMissingOrthoCardFactoryMessage(
            "MainSeg",
            "ColSeg",
            "RowSeg",
        );

        expect(() => orthoFactory(item, ortho)).toThrow(expectedMessage);
        expect(consoleErrorSpy).toHaveBeenCalledWith(expectedMessage);
    });
});

describe("segFactory.extrude", () => {
    let consoleErrorSpy: jest.SpyInstance;

    beforeEach(() => {
        consoleErrorSpy = jest.spyOn(console, "error").mockImplementation(() => undefined);
    });

    afterEach(() => {
        consoleErrorSpy.mockRestore();
    });

    test("produces a table card with defined nested cards when children have cardFactories", () => {
        const slotCard = cardFactory({ typeName: "SlotCard" });
        const row0 = createSeg({
            typeName: "RowSeg",
            cardFactories: {
                ColSeg: () => slotCard,
            },
        });
        const row1 = createSeg({
            typeName: "RowSeg",
            cardFactories: {
                ColSeg: () => slotCard,
            },
        });
        const mainSeg = segFactory({
            typeName: "MainSeg",
            nested: [row0, row1],
        });
        const orthoSeg = segFactory({ typeName: "ColSeg" });

        const table = mainSeg.extrude(orthoSeg);
        table.setBasis({
            [mainSeg.id]: mainSeg,
            [orthoSeg.id]: orthoSeg,
        });

        expect(table.nested.length).toBe(2);
        expect(table.nested.at(0)).toBe(slotCard);
        expect(table.nested.at(1)).toBe(slotCard);
    });

    test("logs and throws when a main line child is missing cardFactories[orthoLine]", () => {
        const rowWithoutFactory = segFactory({
            typeName: "RowSeg",
            cardFactories: {},
        });
        const mainSeg = segFactory({
            typeName: "MainSeg",
            nested: [rowWithoutFactory],
        });
        const orthoSeg = segFactory({ typeName: "ColSeg" });

        const table = mainSeg.extrude(orthoSeg);
        const expectedMessage = buildMissingOrthoCardFactoryMessage(
            "MainSeg",
            "ColSeg",
            "RowSeg",
        );

        expect(() =>
            table.setBasis({
                [mainSeg.id]: mainSeg,
                [orthoSeg.id]: orthoSeg,
            }),
        ).toThrow(expectedMessage);
        expect(consoleErrorSpy).toHaveBeenCalledWith(expectedMessage);
    });
});
