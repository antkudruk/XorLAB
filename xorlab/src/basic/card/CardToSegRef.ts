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

import type { ISeg } from "../../facade/line";

export interface CardToSegRef {
    readonly seg: ISeg;
    readonly counter: number;
    plus(): void;
    minusAndGet(): number;
}

export function createCardToSegRef(seg: ISeg): CardToSegRef {
    const selfSeg: ISeg = seg;
    let counter: number = 1;

    return {
        get seg(): ISeg {
            return seg;
        },

        get counter(): number {
            return counter;
        },

        plus() {
            counter++;
        },

        minusAndGet(): number {
            --counter;
            return counter;
        }
    };
}
