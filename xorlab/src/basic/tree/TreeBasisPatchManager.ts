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

export class TreeBasisPatchManager {
    private _previousNodeSeg: ISeg | undefined = undefined;
    private _previousTreeSeg: ISeg | undefined = undefined;

    drop() {
        this._previousNodeSeg = undefined;
        this._previousTreeSeg = undefined;
    }

    get shouldCreateFromScratch(): boolean {
        return !this._previousNodeSeg || !this._previousTreeSeg;
    }

    refresh(nodeSeg: ISeg, treeSeg: ISeg): void {
        this._previousNodeSeg = nodeSeg;
        this._previousTreeSeg = treeSeg;
    }

    get previousNodeSeg(): ISeg | undefined {
        return this._previousNodeSeg;
    }
}
