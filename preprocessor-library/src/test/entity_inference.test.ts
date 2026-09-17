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
import * as path from "path";
import { findMethodUsages } from "../method_finder";

const fixtureRoot = path.resolve(__dirname, "../../test-fixtures/emapped-cards");

test("eMappedFactory nested type uses mapper return card type, not GenCards", () => {
    const usages = findMethodUsages(fixtureRoot, "cardFactory");
    const lessonListUsage = usages.find((usage) => usage.argumentTypes.typeName === '"LessonListCard"');

    assert.ok(lessonListUsage, "Expected LessonListCard cardFactory usage to be discovered.");
    assert.match(
        lessonListUsage.argumentTypes.nested,
        /EMapped<Array<Lesson>, LessonCard>/,
        "eMappedFactory nested should use domain source type and mapper return card type."
    );
    assert.doesNotMatch(
        lessonListUsage.argumentTypes.nested,
        /\bGenCards\b/,
        "eMappedFactory nested should not widen to the GenCards map interface."
    );
});

test("eMappedFactory with inline arrow mapper infers ElementCard result type", () => {
    const usages = findMethodUsages(fixtureRoot, "cardFactory");
    const elementListUsage = usages.find((usage) => usage.argumentTypes.typeName === '"ElementListCard"');

    assert.ok(elementListUsage, "Expected ElementListCard cardFactory usage to be discovered.");
    assert.match(
        elementListUsage.argumentTypes.nested,
        /EMapped<Array<ChemicalElement>, ElementCard>/,
        "Inline arrow mapper should preserve domain source and named card result types."
    );
    assert.doesNotMatch(
        elementListUsage.argumentTypes.nested,
        /\bGenCards\b/,
        "Inline arrow mapper should not widen to the GenCards map interface."
    );
});
