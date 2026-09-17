/*
    Copyright 2023 - Present Anton Kudruk
   Licensed under the Apache License, Version 2.0 (the "License");
   you may not use this file except in compliance with the License.
   You may obtain a copy of the License at
       http://www.apache.org/licenses/LICENSE-2.0
   Unless required by applicable law or agreed to in writing, software
   distributed under the License is distributed on an "AS IS" BASIS,
   WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
    10|   See the License for the specific language governing permissions and
   limitations under the License.
 */

import { cardFactory } from "../../facade/card";
import { TreeCardContentModel } from "./TreeCardContentModel";

describe("TreeCardContentModel Property slots", () => {
    test("WHEN assign mainCard THEN it appears in nested", () => {
        const content = new TreeCardContentModel();
        const main = cardFactory({ typeName: "MainCard" });

        content.mainCard.value = main;

        expect(content.nested.length).toBe(1);
        expect(content.nested.at(0)).toBe(main);
    });

    test("WHEN replace mainCard THEN nested replaces in place", () => {
        const content = new TreeCardContentModel();
        const first = cardFactory({ typeName: "MainCardA" });
        const second = cardFactory({ typeName: "MainCardB" });
        content.mainCard.value = first;

        content.mainCard.value = second;

        expect(content.nested.length).toBe(1);
        expect(content.nested.at(0)).toBe(second);
    });

    test("WHEN clear mainCard THEN it is removed from nested", () => {
        const content = new TreeCardContentModel();
        content.mainCard.value = cardFactory({ typeName: "MainCard" });

        content.mainCard.value = undefined;

        expect(content.nested.length).toBe(0);
        expect(content.mainCard.value).toBeUndefined();
    });

    test("WHEN assign both slots THEN nested holds main then table", () => {
        const content = new TreeCardContentModel();
        const main = cardFactory({ typeName: "MainCard" });
        const table = cardFactory({ typeName: "NestedTable" });

        content.mainCard.value = main;
        content.nestedItemsTable.value = table;

        expect(content.nested.length).toBe(2);
        expect(content.nested.at(0)).toBe(main);
        expect(content.nested.at(1)).toBe(table);
    });

    test("WHEN dropAll THEN slots and nested are empty", () => {
        const content = new TreeCardContentModel();
        content.mainCard.value = cardFactory({ typeName: "MainCard" });
        content.nestedItemsTable.value = cardFactory({ typeName: "NestedTable" });

        content.dropAll();

        expect(content.mainCard.value).toBeUndefined();
        expect(content.nestedItemsTable.value).toBeUndefined();
        expect(content.nested.length).toBe(0);
    });

    test("WHEN setErrorCard THEN slots clear and nested is the error card", () => {
        const content = new TreeCardContentModel();
        content.mainCard.value = cardFactory({ typeName: "MainCard" });

        const errorCard = content.setErrorCard();

        expect(content.mainCard.value).toBeUndefined();
        expect(content.nestedItemsTable.value).toBeUndefined();
        expect(content.nested.length).toBe(1);
        expect(content.nested.at(0)).toBe(errorCard);
    });
});
