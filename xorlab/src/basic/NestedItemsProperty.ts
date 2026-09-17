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

import { EArray } from "../collection";
import { ECollection, EReadCollection } from "../collection/ECollection";

export type ModelInput<Item> = Item[]
    | EReadCollection<Item[]>
    | ECollection<Item[]> ;

// TODO: Deprecate
export type NestedSegType<T> = T extends {nested: ModelInput<infer N>}
    ? N 
    : never;

export function nestedPropertyAdapter<Item>(input?: ModelInput<Item>): EReadCollection<Item[]> {
    if(input === undefined) {
        return new EArray;
    }
    else if(Array.isArray(input)) {
        return new EArray(...input);
    } else {
        return input;
    }
}