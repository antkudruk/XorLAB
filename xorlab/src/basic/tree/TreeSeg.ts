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

import type { ISeg, Seg } from "../../facade/line";
import type { EReadCollection } from "../../facade/collection";
import { segFactory } from "../../facade/line";
import { EArray } from "../../collection/EArray";

export const TREE_SEG_TYPE_NAME = "TreeSeg";

export type TreeSegOrder = "forward" | "backward";

/**
 * Axis API on a {@link TreeSeg}: node placeholder, deepen to an inner TreeSeg,
 * release that level, and resolve the outermost host for setBasis.
 *
 * @see ../../README.md#tree-pattern
 */
export type TreeSegAttributes<NodeSeg extends ISeg = ISeg> = {
    /** Acquire (or return) the inner TreeSeg for the next recursion level. */
    getNestedLevel(): TreeSeg<NodeSeg>;
    /** Release the inner TreeSeg when no tree card still needs it (refcount). */
    freeNestedLevel(): void;
    /** Empty node segment on this level for the main card to occupy. */
    getNodeSeg(): NodeSeg;
    /**
     * Parent TreeSeg that owns this instance as a nested level (`getNestedLevel`),
     * or `this` when called on the outermost host itself.
     */
    getHostTreeSeg(): TreeSeg<NodeSeg>;
};

/**
 * Segment type for the tree axis: nests a node place and optional inner TreeSeg.
 * Created by {@link TreeSeg} / {@link treeSeg}.
 */
export type TreeSeg<NodeSeg extends ISeg = ISeg> = Seg<
    EReadCollection<ISeg[]>,
    typeof TREE_SEG_TYPE_NAME,
    TreeSegAttributes<NodeSeg>,
    {}
>;

class TreeSegCollectionModel<NodeSeg extends ISeg> extends EArray<ISeg> {
    private readonly nodeSeg: NodeSeg;
    private readonly order: TreeSegOrder;
    /** This model's own TreeSeg (the parent of any nested level created via getNestedLevel). */
    private hostSeg: TreeSeg<NodeSeg> | undefined = undefined;
    private nestedLevel: TreeSeg<NodeSeg> | undefined = undefined;

    constructor(nodeSeg: NodeSeg, order: TreeSegOrder) {
        super();
        this.nodeSeg = nodeSeg;
        this.order = order;
        this.push(this.nodeSeg);
    }

    setHostSeg(hostSeg: TreeSeg<NodeSeg>): void {
        this.hostSeg = hostSeg;
    }

    getHostSeg(): TreeSeg<NodeSeg> | undefined {
        return this.hostSeg;
    }

    getNodeSeg(): NodeSeg {
        return this.nodeSeg;
    }

    getNestedLevel(params: TreeSegParams<NodeSeg>): TreeSeg<NodeSeg> {
        if (!this.nestedLevel) {
            this.nestedLevel = TreeSeg({
                ...params,
                hostTreeSeg: this.hostSeg,
            });
            if (this.order === "forward") {
                this.push(this.nestedLevel);
            } else {
                this.insert(0, [this.nestedLevel]);
            }
        }

        return this.nestedLevel;
    }

    freeNestedLevel(): void {
        if (!this.nestedLevel) {
            return;
        }

        const nestedLevelIndex = this.indexOf(this.nestedLevel);
        if (nestedLevelIndex >= 0) {
            this.splice(nestedLevelIndex, 1);
        }
        this.nestedLevel = undefined;
    }
}

function createTreeSegAttributes<NodeSeg extends ISeg>(
    params: TreeSegParams<NodeSeg>,
    model: TreeSegCollectionModel<NodeSeg>,
    self: () => TreeSeg<NodeSeg>,
): TreeSegAttributes<NodeSeg> {
    let counter = 0;

    return {
        getNestedLevel(): TreeSeg<NodeSeg> {
            counter += 1;
            return model.getNestedLevel(params);
        },

        freeNestedLevel(): void {
            counter -= 1;
            if (counter <= 0) {
                model.freeNestedLevel();
                counter = 0;
            }
        },

        getNodeSeg(): NodeSeg {
            return model.getNodeSeg();
        },

        getHostTreeSeg(): TreeSeg<NodeSeg> {
            return params.hostTreeSeg ?? model.getHostSeg() ?? self();
        },
    };
}

export interface TreeSegParams<NodeSeg extends ISeg = ISeg> {
    nodeSegFactory?: () => NodeSeg;
    order?: TreeSegOrder;
    /**
     * Parent TreeSeg that inserted this instance via `getNestedLevel`.
     * Omit on the outermost host; required so a freed nested level can still
     * resolve back to the mounted host for setBasis.
     */
    hostTreeSeg?: TreeSeg<NodeSeg>;
}

/**
 * Build a {@link TreeSeg} host (or nested level when `hostTreeSeg` is set).
 *
 * `order: "forward"` appends the nested level after the node (typical vertical
 * scroll: content then rail). `"backward"` inserts it before the node (typical
 * horizontal scroll: rail then content). Nested levels created via
 * `attrs.getNestedLevel()` pass `hostTreeSeg` so `getHostTreeSeg()` still
 * resolves to the mounted outermost host after a free.
 *
 * @see ../../README.md#tree-pattern
 */
export function TreeSeg<NodeSeg extends ISeg = ISeg>(
    params: TreeSegParams<NodeSeg> = {}
): TreeSeg<NodeSeg> {
    const nodeSeg = (params.nodeSegFactory?.() || segFactory({ style: { window: "30px" } })) as NodeSeg;
    const nested = new TreeSegCollectionModel(nodeSeg, params.order ?? "forward");
    let result: TreeSeg<NodeSeg>;
    const attrs = createTreeSegAttributes(params, nested, () => result);

    result = segFactory({
        typeName: TREE_SEG_TYPE_NAME,
        nested: nested,
        attrs,
        style: { window: "auto" },
    });
    nested.setHostSeg(result);
    return result;
}

/** Alias for {@link TreeSeg}. */
export const treeSeg = TreeSeg;
