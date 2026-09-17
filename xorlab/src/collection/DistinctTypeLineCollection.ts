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

import { EArray } from "./EArray";

export class DistinctTypeLineCollection<Item extends { readonly typeName: string }> extends EArray<Item> {
    getItemByType<TypeName extends Item["typeName"]>(type: TypeName): Extract<Item, { readonly typeName: TypeName }> {
        const item = this.find(candidate => candidate.typeName === type);

        if(!item) {
            throw new Error(`Collection item with type "${type}" is not found.`);
        }

        return item as Extract<Item, { readonly typeName: TypeName }>;
    }
}
