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
import { parseXorlabImportsMode } from "../cli";

test("parseXorlabImportsMode uses package by default", () => {
    assert.equal(parseXorlabImportsMode(["node", "cli.js"]), "package");
});

test("parseXorlabImportsMode parses relative mode", () => {
    assert.equal(
        parseXorlabImportsMode(["node", "cli.js", "--xorlab-imports=relative"]),
        "relative"
    );
});

test("parseXorlabImportsMode rejects invalid value", () => {
    assert.throws(
        () => parseXorlabImportsMode(["node", "cli.js", "--xorlab-imports=invalid"]),
        /Invalid --xorlab-imports value: invalid/
    );
});
