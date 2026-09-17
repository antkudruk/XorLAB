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

import { createBasis } from "../card/Basis";
import { cardFactory } from "../../facade/card";
import type { ICard } from "../../facade/card";
import type { ISeg } from "../../facade/line";
import { segFactory } from "../../facade/line";
import { PropertyImpl } from "../../collection/property/Property";
import { distinctTypeLineCollectionFactory, eArrayFactory } from "../../facade/collection";
import { STYLE_ADAPTERS } from "../../renderer/SegPropsAdapters";
import { SegVi, SegViCeiling } from "../../renderer/segment/SegVi";
import { TreeCardContentModel } from "./TreeCardContentModel";
import { TreeCardModel } from "./TreeCardModel";
import { TreeBasisPatchManager } from "./TreeBasisPatchManager";
import { treeSeg } from "./TreeSeg";

const SCROLLBAR_WIDTH_PX = 16;

function scrollableRowSeg(typeName: string) {
    return segFactory({
        typeName,
        nested: eArrayFactory([
            segFactory({
                typeName: `${typeName}Item`,
                style: { window: "10px" },
            }),
        ]),
        style: { window: "50flex" },
    });
}

/** Nested composite whose child lists are marked active — forces an inner TreeSeg level. */
function nestedCompositeRowSeg(typeName: string) {
    return segFactory({
        typeName,
        nested: distinctTypeLineCollectionFactory([
            scrollableRowSeg(`${typeName}ListA`),
            scrollableRowSeg(`${typeName}ListB`),
        ]),
        style: { window: "50flex" },
    });
}

function createSharedScrollHost(options?: { withNestedComposite?: boolean }) {
    const tree = treeSeg({
        nodeSegFactory: () =>
            segFactory({
                typeName: "ScrollbarPlaceSeg",
                style: { window: `${SCROLLBAR_WIDTH_PX}px` },
            }),
    });
    const contentRows = options?.withNestedComposite
        ? distinctTypeLineCollectionFactory([
            segFactory({ typeName: "TimePlaceSeg", style: { window: "40px" } }),
            nestedCompositeRowSeg("NestedBlockSeg"),
        ])
        : distinctTypeLineCollectionFactory([
            segFactory({ typeName: "TimePlaceSeg", style: { window: "40px" } }),
            scrollableRowSeg("GroupListSeg"),
            scrollableRowSeg("TeacherListSeg"),
        ]);
    const compositeContainer = segFactory({
        typeName: "TimetableVerticalSeg",
        nested: contentRows,
        style: { window: "100flex" },
    });
    const scrollHost = segFactory({
        typeName: "TimetableScrollableVerticalSeg",
        style: { window: "100%" },
        nested: distinctTypeLineCollectionFactory([
            compositeContainer,
            tree,
        ]),
    });
    return { scrollHost, tree, compositeContainer };
}

/**
 * placeActive marks which places need a main/nested tree card.
 * Specs inject this so nesting/deepen can be tested without a full Widget mount.
 */
function createTreeCardModel(placeActive: (seg: ISeg) => boolean): TreeCardModel {
    return new TreeCardModel({
        nestedFactory: () => cardFactory({ typeName: "NestedTreeCard" }),
        mainCardFactory: () => cardFactory({ typeName: "ScrollbarWidgetCard" }),
        content: new TreeCardContentModel(),
        basisPatchManager: new TreeBasisPatchManager(),
        placeActive,
    });
}

/** Active iff typeName is in the set (simulates overflow / always-true per place). */
function activeByType(...typeNames: string[]) {
    const set = new Set(typeNames);
    return (seg: ISeg) => set.has(seg.typeName);
}

function basisForContainer(
    compositeContainer: ISeg,
    tree: ReturnType<typeof treeSeg>,
) {
    const basis = createBasis();
    const mockCard = cardFactory({ typeName: "BasisMockCard" }) as ICard;
    basis.setBasis({
        [compositeContainer.id]: compositeContainer,
        [tree.id]: tree,
    }, mockCard);
    return basis;
}

describe("TreeCardModel inner level refcount", () => {
    test("leaf-list children active on host without deepening TreeSeg", () => {
        const { tree, compositeContainer } = createSharedScrollHost();
        // GroupListSeg / TeacherListSeg overflow; their leaf items do not → no deepen.
        const model = createTreeCardModel(
            activeByType("GroupListSeg", "TeacherListSeg", "TimetableVerticalSeg"),
        );
        const basis = basisForContainer(compositeContainer, tree);

        model.refreshNestedItemsTableOnInnerLevel(basis);

        expect(tree.nested.length).toBe(1);
        expect(tree.nested.at(0).typeName).toBe("ScrollbarPlaceSeg");
    });

    test("nested active descendants deepen TreeSeg and release restores host", () => {
        const { tree, compositeContainer } = createSharedScrollHost({ withNestedComposite: true });
        // NestedBlockSeg's child lists are active → deepen under TimetableVerticalSeg.
        const placeActive = activeByType(
            "TimetableVerticalSeg",
            "NestedBlockSegListA",
            "NestedBlockSegListB",
        );
        const models = [
            createTreeCardModel(placeActive),
            createTreeCardModel(placeActive),
            createTreeCardModel(placeActive),
        ];
        const basis = basisForContainer(compositeContainer, tree);

        for (let i = 0; i < 3; i++) {
            models[i].refreshNestedItemsTableOnInnerLevel(basis);
        }

        expect(tree.nested.length).toBe(2);

        for (let i = 0; i < 3; i++) {
            models[i].refreshNestedItemsTableOnSameLevel(basis);
        }

        expect(tree.nested.length).toBe(1);
        expect(tree.nested.at(0).typeName).toBe("ScrollbarPlaceSeg");
    });

    test("shared TreeSeg width returns to node lane after inner level release", () => {
        const hostSize = new PropertyImpl(1000);
        const { scrollHost, tree, compositeContainer } = createSharedScrollHost({
            withNestedComposite: true,
        });

        const rootVi = new SegVi({
            parent: undefined,
            styleSheet: {},
            source: scrollHost,
            cssUpdater: STYLE_ADAPTERS.HORIZONTAL,
            next: new SegViCeiling(),
            hostAvailableSpace: hostSize,
        });
        hostSize.value = 1000;

        const treeVi = tree.getViByUuid(rootVi.treeUuid);
        if (!treeVi) {
            throw new Error("Missing TreeSeg SegVi");
        }

        expect(treeVi.window.value).toBe(SCROLLBAR_WIDTH_PX);

        const placeActive = activeByType(
            "TimetableVerticalSeg",
            "NestedBlockSegListA",
            "NestedBlockSegListB",
        );
        const models = [
            createTreeCardModel(placeActive),
            createTreeCardModel(placeActive),
            createTreeCardModel(placeActive),
        ];
        const basis = basisForContainer(compositeContainer, tree);
        for (let i = 0; i < 3; i++) {
            models[i].refreshNestedItemsTableOnInnerLevel(basis);
        }

        expect(treeVi.window.value).toBeGreaterThan(SCROLLBAR_WIDTH_PX);

        for (let i = 0; i < 3; i++) {
            models[i].refreshNestedItemsTableOnSameLevel(basis);
        }

        expect(tree.nested.length).toBe(1);
        expect(treeVi.window.value).toBe(SCROLLBAR_WIDTH_PX);
    });

    test("clear releases inner level acquired by the tree card", () => {
        const { tree, compositeContainer } = createSharedScrollHost({ withNestedComposite: true });
        const model = createTreeCardModel(
            activeByType("TimetableVerticalSeg", "NestedBlockSegListA", "NestedBlockSegListB"),
        );
        const basis = basisForContainer(compositeContainer, tree);

        model.refreshNestedItemsTableOnInnerLevel(basis);
        expect(tree.nested.length).toBe(2);

        model.clear();
        expect(tree.nested.length).toBe(1);
    });

    test("list with only inactive leaf children does not deepen TreeSeg", () => {
        const tree = treeSeg({
            nodeSegFactory: () =>
                segFactory({
                    typeName: "ScrollbarPlaceSeg",
                    style: { window: `${SCROLLBAR_WIDTH_PX}px` },
                }),
        });
        const groupListSeg = scrollableRowSeg("GroupListSeg");
        const basis = createBasis();
        const mockCard = cardFactory({ typeName: "BasisMockCard" }) as ICard;
        basis.setBasis({
            [groupListSeg.id]: groupListSeg,
            [tree.id]: tree,
        }, mockCard);

        // List itself active; leaf items inactive → nested table optional, no deepen.
        const model = createTreeCardModel(activeByType("GroupListSeg"));
        model.refreshNestedItemsTableOnInnerLevel(basis);

        expect(tree.nested.length).toBe(1);
    });

    test("MonthRowListSeg deepens when WeekSeg descendants are active", () => {
        const tree = treeSeg({
            nodeSegFactory: () =>
                segFactory({
                    typeName: "ScrollbarPlaceSeg",
                    style: { window: `${SCROLLBAR_WIDTH_PX}px` },
                }),
        });
        const monthRowListSeg = segFactory({
            typeName: "MonthRowListSeg",
            nested: eArrayFactory(
                Array.from({ length: 4 }, (_, row) =>
                    segFactory({
                        typeName: "MonthRowSeg",
                        attrs: { row },
                        nested: distinctTypeLineCollectionFactory([
                            segFactory({ typeName: "MonthHeaderPlaceSeg", style: { window: "28px" } }),
                            segFactory({
                                typeName: "WeekSeg",
                                nested: eArrayFactory(
                                    Array.from({ length: 7 }, (_, i) =>
                                        segFactory({
                                            typeName: "WeekDaySeg",
                                            attrs: { order: i },
                                            style: { window: "25px" },
                                        }),
                                    ),
                                ),
                                style: { window: "160px" },
                            }),
                        ]),
                        style: { window: "auto" },
                    }),
                ),
            ),
            style: { window: "100flex" },
        });
        const basis = createBasis();
        const mockCard = cardFactory({ typeName: "BasisMockCard" }) as ICard;
        basis.setBasis({
            [monthRowListSeg.id]: monthRowListSeg,
            [tree.id]: tree,
        }, mockCard);

        const model = createTreeCardModel(activeByType("MonthRowListSeg", "WeekSeg"));
        model.refreshNestedItemsTableOnInnerLevel(basis);

        expect(tree.nested.length).toBe(2);
        expect(tree.nested.at(1).typeName).toBe("TreeSeg");
    });

    test("inactive place with children still seeds nested table for child listeners", () => {
        const { tree, compositeContainer } = createSharedScrollHost();
        const content = new TreeCardContentModel();
        const model = new TreeCardModel({
            nestedFactory: () => cardFactory({ typeName: "NestedTreeCard" }),
            mainCardFactory: () => cardFactory({ typeName: "ScrollbarWidgetCard" }),
            content,
            basisPatchManager: new TreeBasisPatchManager(),
            placeActive: () => false,
        });
        const basis = basisForContainer(compositeContainer, tree);

        model.refreshNestedItemsTableOnSameLevel(basis);

        // Seed even when no place is active yet — children subscribe and show later.
        expect(tree.nested.length).toBe(1);
        expect(content.nestedItemsTable.value).toBeDefined();
    });

    test("inactive leaf place with no children drops nested table", () => {
        const { tree } = createSharedScrollHost();
        const leaf = segFactory({ typeName: "TimePlaceSeg", style: { window: "40px" } });
        const content = new TreeCardContentModel();
        const model = new TreeCardModel({
            nestedFactory: () => cardFactory({ typeName: "NestedTreeCard" }),
            mainCardFactory: () => cardFactory({ typeName: "ScrollbarWidgetCard" }),
            content,
            basisPatchManager: new TreeBasisPatchManager(),
            placeActive: () => false,
        });
        const basis = createBasis();
        const mockCard = cardFactory({ typeName: "BasisMockCard" }) as ICard;
        basis.setBasis({ [leaf.id]: leaf, [tree.id]: tree }, mockCard);

        model.refreshNestedItemsTableOnSameLevel(basis);

        expect(content.nestedItemsTable.value).toBeUndefined();
    });
});
