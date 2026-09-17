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
    DistinctTypeLineCollection,
    EArray,
    EMapped,
    EReadCollection,
    ItemOf,
    NumberedArray
} from "../facade/collection";
import type { ISeg } from "../facade/line";
import { DistinctTypeLineCollection as DistinctTypeLineCollectionImpl } from "./DistinctTypeLineCollection";
import { EArray as EArrayImpl } from "./EArray";
import { EMapped as EMappedImpl } from "./EMapped";
import { NumberedArray as NumberedArrayImpl } from "./NumberedArray";

export function eArrayFactory<Items extends any[]>(items: [...Items]): EArray<Items> {
    return new EArrayImpl<ItemOf<Items>>(...items) as unknown as EArray<Items>;
}

export function eMappedFactory<SourceItems extends any[], Result>(
    source: EReadCollection<SourceItems> | null,
    factory: (src: ItemOf<SourceItems>, newIndex: number, source: EReadCollection<SourceItems>) => Result
): EMapped<SourceItems, Result> {
    return new EMappedImpl<ItemOf<SourceItems>, Result>(
        source as EReadCollection<ItemOf<SourceItems>[]> | null,
        (src, newIndex, mappedSource) => factory(
            src,
            newIndex,
            mappedSource as EReadCollection<SourceItems>
        )
    ) as unknown as EMapped<SourceItems, Result>;
}

export function numberedArrayFactory<Items extends any[]>(source: EReadCollection<Items>): NumberedArray<Items> {
    return new NumberedArrayImpl<ItemOf<Items>>(
        source as EReadCollection<ItemOf<Items>[]>
    ) as unknown as NumberedArray<Items>;
}

export function distinctTypeLineCollectionFactory<Items extends ISeg[]>(
    items: [...Items]
): DistinctTypeLineCollection<Items> {
    return new DistinctTypeLineCollectionImpl<ItemOf<Items> & { readonly typeName: string }>(
        ...(items as unknown as Array<ItemOf<Items> & { readonly typeName: string }>)
    ) as unknown as DistinctTypeLineCollection<Items>;
}
