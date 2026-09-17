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

import { segSizeFactory } from "./Size";

describe("segSizeFactory", () => {
    const style = {
        windowH: "100px" as const,
        windowV: "15px" as const,
        window: "20px" as const,
    };

    it("prefers windowH for HORIZONTAL", () => {
        expect(segSizeFactory(style, "HORIZONTAL")).toBe("100px");
    });

    it("prefers windowV for VERTICAL", () => {
        expect(segSizeFactory(style, "VERTICAL")).toBe("15px");
    });

    it("falls back to window when directional size is unset", () => {
        expect(segSizeFactory({ window: "72px" }, "HORIZONTAL")).toBe("72px");
        expect(segSizeFactory({ window: "72px" }, "VERTICAL")).toBe("72px");
    });

    it("falls back to auto when no size is set", () => {
        expect(segSizeFactory({}, "HORIZONTAL")).toBe("auto");
        expect(segSizeFactory({}, "VERTICAL")).toBe("auto");
    });

    it("uses explicit directional auto over window", () => {
        expect(
            segSizeFactory({ windowH: "auto", window: "50px" }, "HORIZONTAL"),
        ).toBe("auto");
        expect(
            segSizeFactory({ windowV: "auto", window: "50px" }, "VERTICAL"),
        ).toBe("auto");
    });
});
