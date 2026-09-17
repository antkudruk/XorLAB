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
import { groupAndSortImports } from "../import_processing";
import { MethodUsageInfo } from "../method_finder";

const usages: MethodUsageInfo[] = [
    {
        filePath: "a.ts",
        lineNumber: 1,
        argumentTypes: {},
        imports: [
            { typeName: "B", modulePath: "pkg-b", isNodeModules: true },
            { typeName: "A", modulePath: "pkg-a", isNodeModules: true },
            { typeName: "LocalB", modulePath: "src/b", isNodeModules: false },
        ],
    },
    {
        filePath: "b.ts",
        lineNumber: 2,
        argumentTypes: {},
        imports: [
            { typeName: "A", modulePath: "pkg-a", isNodeModules: true },
            { typeName: "LocalA", modulePath: "src/a", isNodeModules: false },
        ],
    },
];

test("groupAndSortImports groups, dedupes and sorts", () => {
    const result = groupAndSortImports(usages);
    assert.deepEqual(result.external.map((x) => x.modulePath), ["pkg-a", "pkg-b"]);
    assert.deepEqual(result.external[0].typeNames, ["A"]);
    assert.deepEqual(result.internal.map((x) => x.modulePath), ["src/a", "src/b"]);
});
