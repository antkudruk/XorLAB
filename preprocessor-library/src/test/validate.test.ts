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
import { validate } from "../validate";
import { validateCrossKindTypeNames } from "../validate_cross";
import { MethodUsageInfo } from "../method_finder";

function usage(partial: Partial<MethodUsageInfo>): MethodUsageInfo {
    return {
        filePath: partial.filePath ?? "src/example.ts",
        lineNumber: partial.lineNumber ?? 1,
        argumentTypes: partial.argumentTypes ?? {},
        imports: partial.imports ?? [],
    };
}

test("validate passes for compatible usages and dedupes imports", () => {
    const result = validate([
        usage({
            argumentTypes: { typeName: '"GroupSeg"', attrs: "A", nested: "B", cardFactories: "{}" },
            imports: [
                { typeName: "A", modulePath: "a", isNodeModules: false },
                { typeName: "A", modulePath: "a", isNodeModules: false },
            ],
        }),
        usage({
            lineNumber: 2,
            argumentTypes: { typeName: '"GroupSeg"', attrs: "A", nested: "B", cardFactories: "{x:1}" },
            imports: [{ typeName: "A", modulePath: "a", isNodeModules: false }],
        }),
    ]);

    assert.equal(result.isValid, true);
    assert.equal(result.errors.length, 0);
    assert.equal(result.groups.length, 1);
    assert.equal(result.groups[0].imports.length, 1);
});

test("validate fails for incompatible usages", () => {
    const result = validate([
        usage({
            argumentTypes: { typeName: '"GroupSeg"', attrs: "A", nested: "B" },
        }),
        usage({
            lineNumber: 3,
            argumentTypes: { typeName: '"GroupSeg"', attrs: "Different", nested: "B" },
        }),
    ]);

    assert.equal(result.isValid, false);
    assert.equal(result.errors.length, 1);
    assert.match(result.errors[0], /Inconsistent argumentTypes found for typeName/);
});

test("validate passes when duplicate usages differ only in mouseOver or style", () => {
    const result = validate([
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
                style: "{ window: '50px' }",
            },
        }),
    ]);

    assert.equal(result.isValid, true);
    assert.equal(result.errors.length, 0);
});

test("validateCrossKindTypeNames fails when segment and card share a typeName", () => {
    const errors = validateCrossKindTypeNames(
        [
            usage({
                filePath: "src/domain/foo.ts",
                lineNumber: 10,
                argumentTypes: { typeName: '"SharedName"', attrs: "never", nested: "never" },
            }),
        ],
        [
            usage({
                filePath: "src/domain/bar.ts",
                lineNumber: 20,
                argumentTypes: { typeName: '"SharedName"', attrs: "never", nested: "never" },
            }),
        ],
    );

    assert.equal(errors.length, 1);
    assert.match(errors[0], /SharedName/);
    assert.match(errors[0], /segment/);
    assert.match(errors[0], /card/);
});

test("validate fails when typeName does not start with an uppercase letter", () => {
    const result = validate([
        usage({
            filePath: "src/view/TimetableCompositeView.ts",
            lineNumber: 53,
            argumentTypes: {
                typeName: '"timetableScrollableVerticalSeg"',
                attrs: "never",
                nested: "never",
            },
        }),
    ]);

    assert.equal(result.isValid, false);
    assert.equal(result.errors.length, 1);
    assert.match(result.errors[0], /src\/view\/TimetableCompositeView\.ts:53/);
    assert.match(result.errors[0], /timetableScrollableVerticalSeg/);
    assert.match(result.errors[0], /uppercase letter/);
});

