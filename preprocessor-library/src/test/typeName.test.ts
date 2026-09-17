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
import {
    formatTypeNameCapitalizationError,
    isValidTypeNameStart,
    parseQuotedTypeNameLiteral,
} from "../typeName";

test("parseQuotedTypeNameLiteral extracts content from quoted strings", () => {
    assert.equal(parseQuotedTypeNameLiteral('"GroupSeg"'), "GroupSeg");
    assert.equal(parseQuotedTypeNameLiteral("'WeekSeg'"), "WeekSeg");
    assert.equal(parseQuotedTypeNameLiteral("`DaySeg`"), "DaySeg");
});

test("parseQuotedTypeNameLiteral rejects invalid formats", () => {
    assert.throws(
        () => parseQuotedTypeNameLiteral("GroupSeg"),
        /quoted string literal/,
    );
    assert.throws(
        () => parseQuotedTypeNameLiteral('""'),
        /must not be empty/,
    );
});

test("isValidTypeNameStart accepts uppercase-leading names", () => {
    assert.equal(isValidTypeNameStart("GroupSeg"), true);
    assert.equal(isValidTypeNameStart("TimetableVerticalSeg"), true);
});

test("isValidTypeNameStart rejects lowercase-leading and empty names", () => {
    assert.equal(isValidTypeNameStart("timetableScrollableVerticalSeg"), false);
    assert.equal(isValidTypeNameStart(""), false);
    assert.equal(isValidTypeNameStart("3Bad"), false);
});

test("formatTypeNameCapitalizationError includes file, line, and suggestion", () => {
    const message = formatTypeNameCapitalizationError(
        "timetableScrollableVerticalSeg",
        "src/view/Foo.ts",
        53,
    );

    assert.match(message, /src\/view\/Foo\.ts:53/);
    assert.match(message, /timetableScrollableVerticalSeg/);
    assert.match(message, /TimetableScrollableVerticalSeg/);
    assert.match(message, /uppercase letter/);
});
