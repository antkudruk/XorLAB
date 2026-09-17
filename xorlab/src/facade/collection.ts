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

import type {
    ECollection,
    EListener,
    EObservableCollection,
    EReadCollection,
    ItemOf,
} from "../collection/ECollection";
import type { NumberedArrayItem } from "../collection/NumberedArray";
import { ISeg } from "./line";

export type {
    ECollection,
    EListener,
    EObservableCollection,
    EReadCollection,
    ItemOf,
};
export type { NumberedArrayItem };

export interface EArray<Items extends any[]> extends ECollection<Items> {
    set(at: number, item: ItemOf<Items>): void;
    insert(at: number, items: ItemOf<Items>[]): void;
}

export interface EMapped<SourceItems extends any[], Result> extends EReadCollection<Result[]> {
    readonly source: EReadCollection<SourceItems> | null;
    replace(source: EReadCollection<SourceItems> | null): this;
}

export interface NumberedArray<Items extends any[]> extends EReadCollection<NumberedArrayItem<ItemOf<Items>>[]> {
}

/** Union of all TypeName values from Items (including custom Seg types not in GenSegments) */
export type AllTypeNamesFromArray<Items extends ISeg[]> = {
    [K in keyof Items]: Items[K] extends { typeName: infer T } ? T extends string ? T : never : never;
}[number];

export type SegByTypeName<Items extends ISeg[], T extends string> =
    Extract<Items[number], { readonly typeName: T }> extends never
        ? T extends keyof GenSegments
            ? GenSegments[T]
            : never
        : Extract<Items[number], { readonly typeName: T }>;

export interface DistinctTypeLineCollection<Items extends ISeg[]> extends EReadCollection<Items> {
    getItemByType<LineType extends AllTypeNamesFromArray<Items>>(type: LineType): SegByTypeName<Items, LineType>;
}

export {
    distinctTypeLineCollectionFactory,
    eArrayFactory,
    eMappedFactory,
    numberedArrayFactory
} from "../collection/facadeFactories";
