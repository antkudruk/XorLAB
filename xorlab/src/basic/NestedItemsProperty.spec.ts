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


import { nestedPropertyAdapter } from './NestedItemsProperty';

const item0 = {id: 0};
const item1 = {id: 1};

describe("Adapter to translate the property `nested` to the `ECollection` no matter what type has been passed to the parameter", () => {

    test("Pure JavaScript array", () => {
        // when
        const result = nestedPropertyAdapter([item0, item1]);

        // then
        expect(result.at(0)).toBe(item0);
        expect(result.at(1)).toBe(item1);
    });
});