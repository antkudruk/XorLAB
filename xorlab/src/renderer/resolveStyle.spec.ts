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

import type { ISeg } from "../facade/line";
import { resolveSegStyle } from "./resolveStyle";
import type { EStyle, EStyleSheet } from "./Size";

function mockSeg(typeName: string, style: EStyle): ISeg {
    return {
        typeName,
        style,
    } as ISeg;
}

describe("resolveSegStyle", () => {
    it("returns inline style when styleSheet has no entry", () => {
        const seg = mockSeg("GroupSeg", { window: "50px" });
        expect(resolveSegStyle(seg, {})).toEqual({ window: "50px" });
    });

    it("merges styleSheet entry over inline style", () => {
        const seg = mockSeg("GroupSeg", { window: "50px", collapsed: false });
        const styleSheet: EStyleSheet = {
            GroupSeg: { window: "100flex" },
        };

        expect(resolveSegStyle(seg, styleSheet)).toEqual({
            window: "100flex",
            collapsed: false,
        });
    });
});
