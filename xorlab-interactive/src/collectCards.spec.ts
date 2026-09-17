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

import { cardFactory, eArrayFactory } from "xorlab";
import { collectCardsByTypeName } from "./collectCards";

describe("collectCardsByTypeName", () => {
    it("collects cards matching typeName depth-first", () => {
        const leafA = cardFactory({ typeName: "LeafCard" });
        const leafB = cardFactory({ typeName: "LeafCard" });
        const wrapper = cardFactory({
            typeName: "WrapperCard",
            nested: eArrayFactory([leafA, leafB]),
        });
        const root = cardFactory({
            typeName: "RootCard",
            nested: eArrayFactory([wrapper, cardFactory({ typeName: "OtherCard" })]),
        });

        const collected = collectCardsByTypeName(root, "LeafCard");
        expect(collected).toEqual([leafA, leafB]);
    });
});
