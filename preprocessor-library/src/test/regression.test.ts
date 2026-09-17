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
import * as fs from "fs";
import * as path from "path";
import { findMethodUsages } from "../method_finder";
import { run } from "../preprocessor";
import { generateFileContent } from "../seggenerator";

const fixtureRoot = path.resolve(__dirname, "../../test-fixtures/named-nested-segments");
const generatedDir = path.join(fixtureRoot, "generated");
const generatedLinesPath = path.join(generatedDir, "generated-lines.d.ts");

function cleanupGeneratedFiles() {
    fs.rmSync(generatedDir, { recursive: true, force: true });
}

function getHorizontalTeacherUsage() {
    const usages = findMethodUsages(fixtureRoot, "segFactory");
    const horizontalUsage = usages.find((usage) => usage.argumentTypes.typeName === '"HorizontalTeacherSeg"');

    assert.ok(horizontalUsage, "Expected HorizontalTeacherSeg usage to be discovered.");
    return { usages, horizontalUsage };
}

function assertPreviewUsesNamedNestedSegment() {
    const { usages, horizontalUsage } = getHorizontalTeacherUsage();

    const nested = horizontalUsage.argumentTypes.nested;
    assert.ok(
        nested === "EArray<Array<TeacherColumnSeg>>" || nested === "EArray<[TeacherColumnSeg]>",
        "Named nested segments should survive even when the collection item is widened to ISeg."
    );

    const generatedPreview = generateFileContent(usages);
    const hasArrayForm = /interface HorizontalTeacherSeg extends Seg<EArray<Array<TeacherColumnSeg>>, "HorizontalTeacherSeg", never,/
        .test(generatedPreview);
    const hasTupleForm = /interface HorizontalTeacherSeg extends Seg<EArray<\[TeacherColumnSeg\]>, "HorizontalTeacherSeg", never,/
        .test(generatedPreview);
    assert.ok(
        hasArrayForm || hasTupleForm,
        "Generated segment typings should use the recovered nested segment type."
    );
    assert.match(
        generatedPreview,
        /TeacherSeg: \(\) => (TeacherCard|GenCards);/,
        "Generated segment typings should preserve the inferred card factory return type."
    );
    assert.match(
        generatedPreview,
        /export interface GenOrthoCardFactories<Self extends ISeg> \{/,
        "Generated segment typings should include the ortho card factory interface."
    );
    assert.match(
        generatedPreview,
        /TeacherColumnSeg\(ortho: GenSegTypes\.TeacherColumnSeg, self: Self\): ICard;/,
        "The generated ortho card factory interface should contain one method per segment type."
    );
}

async function assertFinalRunUsesGeneratedCardTypes() {
    const previousCwd = process.cwd();

    process.chdir(fixtureRoot);
    try {
        await run();
    } finally {
        process.chdir(previousCwd);
    }

    const generatedLines = fs.readFileSync(generatedLinesPath, "utf8");

    assert.ok(
        generatedLines.includes("TeacherCard"),
        "The final line-generation pass should see generated card types."
    );
    assert.ok(
        !generatedLines.includes('import { TeacherColumnSeg } from "generated/generated-lines.d.ts";'),
        "Generated segment declarations must not import themselves."
    );
    assert.match(
        generatedLines,
        /interface TeacherColumnSeg extends Seg<\s*\n/,
        "Long generated segment declarations should be wrapped across multiple lines."
    );
    assert.match(
        generatedLines,
        /export interface GenOrthoCardFactories<Self extends ISeg> \{/,
        "The final generated lines file should contain the ortho card factory interface."
    );
    assert.match(
        generatedLines,
        /TeacherColumnSeg\(ortho: GenSegTypes\.TeacherColumnSeg, self: Self\): ICard;/,
        "The final generated lines file should list generated segment methods in the ortho card factory interface."
    );
}

test("regression: nested segments and final pass output", async () => {
    cleanupGeneratedFiles();
    try {
        assertPreviewUsesNamedNestedSegment();
        await assertFinalRunUsesGeneratedCardTypes();
    } finally {
        cleanupGeneratedFiles();
    }
});
