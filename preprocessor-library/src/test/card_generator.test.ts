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

import * as assert from "node:assert/strict";
import { test } from "node:test";
import { generateCardFileContent } from "../card_generator";
import { MethodUsageInfo } from "../method_finder";

function usage(partial: Partial<MethodUsageInfo>): MethodUsageInfo {
    return {
        filePath: partial.filePath ?? "src/example.ts",
        lineNumber: partial.lineNumber ?? 1,
        argumentTypes: partial.argumentTypes ?? {},
        imports: partial.imports ?? [],
    };
}

test("generateCardFileContent deduplicates duplicate card typeNames", () => {
    const content = generateCardFileContent([
        usage({
            argumentTypes: {
                typeName: '"ElementCard"',
                attrs: "ChemicalElement",
                nested: "never",
                mouseOver: "() => void",
            },
        }),
        usage({
            lineNumber: 2,
            argumentTypes: {
                typeName: '"ElementCard"',
                attrs: "ChemicalElement",
                nested: "never",
                mouseClick: "() => void",
            },
        }),
    ]);

    assert.equal((content.match(/interface ElementCard extends Card/g) ?? []).length, 1);
    assert.equal((content.match(/"ElementCard": GenCardTypes.ElementCard/g) ?? []).length, 1);
});
