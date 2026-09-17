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

import type { ICard, ISeg } from "xorlab";

/**
 * Resolve a child's keep-axis leaf under `place`.
 * Returns `undefined` on miss so CardChildPos falls through to child selfPos / identity stretch.
 */
export function resolveChildAlongPlace(
    place: ISeg,
    positions: readonly ISeg[],
): ISeg | null | undefined {
    for (const pos of positions) {
        if (pos.id === place.id) {
            return place;
        }
        const byId = place.nested.find((seg) => seg.id === pos.id);
        if (byId) {
            return byId;
        }
    }
    for (const pos of positions) {
        const posId = (pos.attrs as { id?: unknown }).id;
        const byAttrs = place.nested.find(
            (seg) =>
                seg.typeName === pos.typeName &&
                posId !== undefined &&
                (seg.attrs as { id?: unknown }).id === posId,
        );
        if (byAttrs) {
            return byAttrs;
        }
    }
    const byType = positions.find((p) => p.typeName === place.typeName);
    return byType ?? undefined;
}

/**
 * Resolve where `card` sits along an axis identified by exact leaf `typeName` in Basis.
 */
export function resolveCardAlongTypeName(card: ICard, typeName: string): ISeg | null {
    const fromDict = card.getSelfPos()[typeName];
    if (fromDict) {
        return fromDict;
    }
    return card.getBasis().getOneByTypeName(typeName) ?? null;
}

/**
 * Stable key for matching leaves across independently created axis trees
 * (same attrs.id, different seg.id). Falls back to seg.id when attrs.id is absent.
 */
export function segStableKey(seg: ISeg): string {
    const attrId = (seg.attrs as { id?: unknown }).id;
    if (attrId !== undefined && attrId !== null) {
        return `${seg.typeName}:${String(attrId)}`;
    }
    return `${seg.typeName}:${seg.id}`;
}

/**
 * childPos keyed by any place.typeName via Proxy.
 * ownKeys must be non-empty so createCardChildPos does not drop an "empty" childPos map.
 */
export function createChildPlacementsChildPos(
    childPlacements: Map<string, readonly ISeg[]>,
): {} {
    const handler = (place: ISeg, child: ICard) => {
        const positions = childPlacements.get(child.uuid) ?? [];
        return resolveChildAlongPlace(place, positions);
    };
    return new Proxy(
        {},
        {
            get(_target, prop) {
                if (typeof prop !== "string") {
                    return undefined;
                }
                return handler;
            },
            has(_target, prop) {
                return typeof prop === "string";
            },
            ownKeys() {
                return ["__childPlacementsChildPos"];
            },
            getOwnPropertyDescriptor() {
                return {
                    enumerable: true,
                    configurable: true,
                };
            },
        },
    );
}
