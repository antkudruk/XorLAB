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

import type { ICard } from "xorlab";
import type { MouseInteractionEvent } from "xorlab";

export const TREE_UUID = "card-tree-uuid";

export function createMockSelectableCard(
    id: number,
    typeName = "ItemCard",
    treeUuid = TREE_UUID,
): ICard {
    const element = document.createElement("div");
    element.className = typeName;
    return {
        uuid: `card-${id}`,
        nested: { forEach: () => {} } as unknown as ICard["nested"],
        attrs: { id },
        vis: {
            [treeUuid]: { htmlElement: element } as unknown as ICard["vis"][string],
        },
        renderer: {} as ICard["renderer"],
        typeName,
        zIndex: 0,
        setBasis: () => ({ droppedBasisPart: {}, updatedBasisPart: {} }),
        getBasis: () => ({} as ICard["getBasis"] extends () => infer R ? R : never),
        fire: () => {},
        segAtPlace: () => undefined,
        addWidget: () => {},
        removeWidget: () => {},
        getViByUuid: () => undefined,
        getSelfPos: () => ({}),
        resolveSelfPosition: () => null,
        resolveChildPosition: () => null,
        childCardAtCoord: () => undefined,
        coordHelper: () => {
            throw new Error("coordHelper is not implemented on mock selectable card");
        },
    };
}

export function mockMouseEvent(treeUuid = TREE_UUID): MouseInteractionEvent {
    return {
        absolute: { x: 0, y: 0 },
        viewport: { x: 0, y: 0 },
        widget: [0, 0],
        local: [0, 0],
        treeUuid,
        widgetTreeUuids: {
            vertical: "vertical-uuid",
            horizontal: "horizontal-uuid",
            card: treeUuid,
        },
    };
}

export function mockBindWidget(treeUuid = TREE_UUID) {
    return {
        treeUuids: mockMouseEvent(treeUuid).widgetTreeUuids,
        rootCardVi: { source: {} as ICard },
    } as never;
}
