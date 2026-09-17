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
import * as fs from "fs";
import * as path from "path";
import { execFileSync } from "node:child_process";
import { test } from "node:test";
import { run } from "../preprocessor";

const fixtureRoot = path.resolve(__dirname, "../../test-fixtures/named-nested-segments");
const generatedDir = path.join(fixtureRoot, "generated");
const generatedLinesPath = path.join(generatedDir, "generated-lines.d.ts");
const generatedCardsPath = path.join(generatedDir, "generated-cards.d.ts");

function cleanupGeneratedFiles() {
    fs.rmSync(generatedDir, { recursive: true, force: true });
}

async function runInFixture(options?: Parameters<typeof run>[0]) {
    const previousCwd = process.cwd();
    process.chdir(fixtureRoot);
    try {
        await run(options);
    } finally {
        process.chdir(previousCwd);
    }
}

test("run supports package and relative import modes", async () => {
    cleanupGeneratedFiles();
    try {
        await runInFixture({ xorlabImportsMode: "package" });
        const packageModeContent = fs.readFileSync(generatedLinesPath, "utf8");
        assert.match(packageModeContent, /from "xorlab";/);

        await runInFixture({ xorlabImportsMode: "relative" });
        const relativeModeContent = fs.readFileSync(generatedLinesPath, "utf8");
        assert.match(relativeModeContent, /from "..\/..\/..\/xorlab\/dist\/facade\/line\.d\.ts";/);
        assert.ok(fs.existsSync(generatedCardsPath));
    } finally {
        cleanupGeneratedFiles();
    }
});

test("cli black-box generates declarations", () => {
    cleanupGeneratedFiles();
    const cliPath = path.resolve(__dirname, "../cli.js");
    execFileSync("node", [cliPath, "--xorlab-imports=relative"], {
        cwd: fixtureRoot,
        stdio: "pipe",
    });

    assert.ok(fs.existsSync(generatedLinesPath));
    assert.ok(fs.existsSync(generatedCardsPath));
    const lines = fs.readFileSync(generatedLinesPath, "utf8");
    assert.match(lines, /interface TeacherColumnSeg extends Seg</);

    cleanupGeneratedFiles();
});
