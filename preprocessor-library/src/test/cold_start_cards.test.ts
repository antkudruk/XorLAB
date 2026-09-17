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
import { run } from "../preprocessor";

const fixtureRoot = path.resolve(__dirname, "../../test-fixtures/emapped-cards");
const generatedCardsPath = path.join(fixtureRoot, "generated", "generated-cards.d.ts");

function cleanupGeneratedFiles() {
    fs.rmSync(path.join(fixtureRoot, "generated"), { recursive: true, force: true });
}

test("cold start card generation resolves named nested card types", async () => {
    cleanupGeneratedFiles();
    const previousCwd = process.cwd();

    process.chdir(fixtureRoot);
    try {
        await run();
    } finally {
        process.chdir(previousCwd);
    }

    const generatedCards = fs.readFileSync(generatedCardsPath, "utf8");

    assert.match(
        generatedCards,
        /EMapped<Array<Lesson>, LessonCard>/,
        "LessonListCard should use the mapper return card type, not GenCards."
    );
    assert.doesNotMatch(
        generatedCards,
        /EMapped<Array<Lesson>, GenCards>/,
        "LessonListCard should not widen eMappedFactory result to GenCards."
    );
    assert.match(
        generatedCards,
        /GroupTimetableCard extends Card<\s*\n?\s*EArray<\[LessonListCard\]>/,
        "GroupTimetableCard should reference LessonListCard in its eArray nested tuple."
    );
    assert.doesNotMatch(
        generatedCards,
        /EArray<\[GenCards\]>/,
        "GroupTimetableCard should not widen eArrayFactory elements to GenCards."
    );

    cleanupGeneratedFiles();
});
