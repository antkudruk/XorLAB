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

/**
 * Fluent helpers for walking a nested segment tree along a scroll-invariant coordinate.
 *
 * Start from a segment that already owns the local coordinate (typically `self` in a mouse handler):
 * `self.coordHelper(event.local, event.treeUuid).inner()…`. Uses `treeUuid` for Vi lookup so
 * multi-widget mounts stay correct.
 *
 * @see ./CardCoordHelper.ts — card parallel (`CardCoordHelper` / `CardCoordBasedFold`)
 * @see ../../README.md#coord-helper-api
 */
import { childSegAtCoordFromSegVi } from "../renderer/CoordHitTest";
import type { SegCoord } from "../renderer/MouseInteraction";
import type { ISeg } from "./line";
import type { ECollectionItemType } from "./table";

/**
 * Coordinate-scoped view of a segment. Holds the segment, local {@link SegCoord}, and Vi tree UUID.
 *
 * @typeParam TSeg — current strongly-typed segment (often an `GenSegments` entry)
 */
export class CoordHelper<TSeg extends ISeg> {
    constructor(
        protected readonly segment: TSeg,
        protected readonly coordinate: SegCoord,
        protected readonly treeUuid: string,
    ) {}

    /** Returns the current strongly-typed segment. */
    getSeg(): TSeg {
        return this.segment;
    }

    /**
     * Runs a side-effect on the current segment and returns this helper for chaining.
     */
    peek(fn: (seg: TSeg) => void): this {
        fn(this.segment);
        return this;
    }

    /**
     * Descends into the nested child under {@link coordinate}.
     * Remaps the local coordinate into the child's client space.
     *
     * @throws If no Vi exists for `treeUuid`, or no nested segment covers the coordinate.
     */
    inner(): CoordHelper<ECollectionItemType<TSeg["nested"]>[number]> {
        const { child, childLocal } = resolveInnerSeg(this.segment, this.coordinate, this.treeUuid);
        return new CoordHelper(child, childLocal, this.treeUuid);
    }

    /**
     * Starts a {@link CoordBasedFold} by merging entries derived from the current segment.
     * Prefer object-literal returns: `(seg) => ({ field: seg.attrs… })`.
     */
    fold<E extends {}>(fn: (seg: TSeg) => E): CoordBasedFold<TSeg, E> {
        return new CoordBasedFold(this.segment, this.coordinate, this.treeUuid, fn(this.segment));
    }
}

/**
 * {@link CoordHelper} that accumulates a typed object while walking nested segments.
 *
 * @typeParam TSeg — current segment
 * @typeParam Acc — accumulated fold object
 */
export class CoordBasedFold<TSeg extends ISeg, Acc extends {}> extends CoordHelper<TSeg> {
    constructor(
        segment: TSeg,
        coordinate: SegCoord,
        treeUuid: string,
        private readonly acc: Acc,
    ) {
        super(segment, coordinate, treeUuid);
    }

    override peek(fn: (seg: TSeg) => void): this {
        fn(this.segment);
        return this;
    }

    override inner(): CoordBasedFold<ECollectionItemType<TSeg["nested"]>[number], Acc> {
        const { child, childLocal } = resolveInnerSeg(this.segment, this.coordinate, this.treeUuid);
        return new CoordBasedFold(child, childLocal, this.treeUuid, this.acc);
    }

    override fold<E extends {}>(fn: (seg: TSeg) => E): CoordBasedFold<TSeg, Acc & E> {
        return new CoordBasedFold(
            this.segment,
            this.coordinate,
            this.treeUuid,
            { ...this.acc, ...fn(this.segment) },
        );
    }

    /** Returns the accumulated fold object. */
    get(): Acc {
        return this.acc;
    }
}

/**
 * Creates a {@link CoordHelper} for `coordinate` relative to `segment` in the Vi tree `treeUuid`.
 */
export function createCoordHelper<TSeg extends ISeg>(
    segment: TSeg,
    coordinate: SegCoord,
    treeUuid: string,
): CoordHelper<TSeg> {
    return new CoordHelper(segment, coordinate, treeUuid);
}

type NestedSegOf<TSeg extends ISeg> = ECollectionItemType<TSeg["nested"]>[number];

function resolveInnerSeg<TSeg extends ISeg>(
    segment: TSeg,
    coordinate: SegCoord,
    treeUuid: string,
): { child: NestedSegOf<TSeg>; childLocal: SegCoord } {
    const segVi = segment.getViByUuid(treeUuid);
    if (!segVi) {
        throw new Error(
            `CoordHelper.inner: no SegVi for treeUuid "${treeUuid}" on segment "${segment.typeName}"`,
        );
    }
    const childVi = childSegAtCoordFromSegVi(segVi, coordinate);
    if (!childVi) {
        throw new Error(
            `CoordHelper.inner: no nested segment at coord ${coordinate} under "${segment.typeName}"`,
        );
    }
    return {
        // SegVi.source is ISeg; nested item type comes from TSeg["nested"].
        child: childVi.source as NestedSegOf<TSeg>,
        childLocal: coordinate - childVi.clientCoordinate.value,
    };
}
