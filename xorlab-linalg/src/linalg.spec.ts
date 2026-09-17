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

import {
    cardFactory,
    eArrayFactory,
    segFactory,
    type ICard,
    type ISeg,
} from "xorlab";
import { matrixProductCardFactory } from "./matrixProductCardFactory";
import { zippedProductCardFactory } from "./zippedProductCardFactory";
import { sumUpCardFactory } from "./sumUpCardFactory";
import { scalar, type Scalar } from "./LinearSpace";

declare global {
    interface GenSegments {
        RowListSeg: ISeg;
        RowSeg: ISeg;
        ColListSeg: ISeg;
        ColSeg: ISeg;
        SharedListSeg: ISeg;
        SharedSeg: ISeg;
        ExtraListSeg: ISeg;
        ExtraSeg: ISeg;
        UnitColumnListSeg: ISeg;
        UnitColumnSeg: ISeg;
    }
}

function axisList(
    listTypeName: string,
    itemTypeName: string,
    labels: string[],
): { list: ISeg; items: ISeg[] } {
    const items = labels.map((label) =>
        segFactory({
            typeName: itemTypeName,
            attrs: { label },
        }),
    );
    const list = segFactory({
        typeName: listTypeName,
        nested: eArrayFactory(items),
    });
    return { list, items };
}

function cellCard(
    value: number,
    selfPos: { [typeName: string]: (place: ISeg) => ISeg | null | undefined },
): ICard {
    return cardFactory({
        attrs: scalar(value),
        selfPos: selfPos as {},
    });
}

function scalarValues(card: ICard): number[] {
    return card.nested.map((child) => (child.attrs as Scalar).value).sort((a, b) => a - b);
}

function seedBasis(matrix: ICard, ...places: ISeg[]): void {
    const patch: { [placeId: string]: ISeg } = {};
    for (const place of places) {
        patch[place.id] = place;
    }
    matrix.setBasis(patch);
}

/** Seed place lists on the matrix and fire so nested cells get leaf Basis. */
function seedAndFire(matrix: ICard, ...places: ISeg[]): void {
    seedBasis(matrix, ...places);
    matrix.fire();
}

describe("matrixProductCardFactory", () => {
    it("computes a 2x2 matmul over Scalar cells", () => {
        // A: rows R × shared K   B: shared K × cols C
        // A = [[1, 2], [3, 4]]  B = [[5, 6], [7, 8]]
        // C = [[19, 22], [43, 50]]
        const rows = axisList("RowListSeg", "RowSeg", ["r0", "r1"]);
        const cols = axisList("ColListSeg", "ColSeg", ["c0", "c1"]);
        const shared = axisList("SharedListSeg", "SharedSeg", ["k0", "k1"]);

        const matrixA = cardFactory({
            nested: eArrayFactory([
                cellCard(1, {
                    RowListSeg: () => rows.items[0],
                    SharedListSeg: () => shared.items[0],
                }),
                cellCard(2, {
                    RowListSeg: () => rows.items[0],
                    SharedListSeg: () => shared.items[1],
                }),
                cellCard(3, {
                    RowListSeg: () => rows.items[1],
                    SharedListSeg: () => shared.items[0],
                }),
                cellCard(4, {
                    RowListSeg: () => rows.items[1],
                    SharedListSeg: () => shared.items[1],
                }),
            ]),
        });

        const matrixB = cardFactory({
            nested: eArrayFactory([
                cellCard(5, {
                    SharedListSeg: () => shared.items[0],
                    ColListSeg: () => cols.items[0],
                }),
                cellCard(6, {
                    SharedListSeg: () => shared.items[0],
                    ColListSeg: () => cols.items[1],
                }),
                cellCard(7, {
                    SharedListSeg: () => shared.items[1],
                    ColListSeg: () => cols.items[0],
                }),
                cellCard(8, {
                    SharedListSeg: () => shared.items[1],
                    ColListSeg: () => cols.items[1],
                }),
            ]),
        });

        seedAndFire(matrixA, rows.list, shared.list);
        seedAndFire(matrixB, shared.list, cols.list);

        const product = matrixProductCardFactory({
            first: matrixA,
            second: matrixB,
            sumAxisPlace: "SharedSeg",
        });

        expect(product.nested.length).toBe(4);
        expect(scalarValues(product)).toEqual([19, 22, 43, 50]);
    });

    it("resolves keep axes via axisPlaces leaf typeNames", () => {
        const rows = axisList("RowListSeg", "RowSeg", ["r0", "r1"]);
        const cols = axisList("ColListSeg", "ColSeg", ["c0", "c1"]);
        const shared = axisList("SharedListSeg", "SharedSeg", ["k0", "k1"]);

        const matrixA = cardFactory({
            nested: eArrayFactory([
                cellCard(1, {
                    RowListSeg: () => rows.items[0],
                    SharedListSeg: () => shared.items[0],
                }),
                cellCard(2, {
                    RowListSeg: () => rows.items[0],
                    SharedListSeg: () => shared.items[1],
                }),
                cellCard(3, {
                    RowListSeg: () => rows.items[1],
                    SharedListSeg: () => shared.items[0],
                }),
                cellCard(4, {
                    RowListSeg: () => rows.items[1],
                    SharedListSeg: () => shared.items[1],
                }),
            ]),
        });

        const matrixB = cardFactory({
            nested: eArrayFactory([
                cellCard(5, {
                    SharedListSeg: () => shared.items[0],
                    ColListSeg: () => cols.items[0],
                }),
                cellCard(6, {
                    SharedListSeg: () => shared.items[0],
                    ColListSeg: () => cols.items[1],
                }),
                cellCard(7, {
                    SharedListSeg: () => shared.items[1],
                    ColListSeg: () => cols.items[0],
                }),
                cellCard(8, {
                    SharedListSeg: () => shared.items[1],
                    ColListSeg: () => cols.items[1],
                }),
            ]),
        });

        seedAndFire(matrixA, rows.list, shared.list);
        seedAndFire(matrixB, shared.list, cols.list);

        const product = matrixProductCardFactory({
            first: matrixA,
            second: matrixB,
            sumAxisPlace: "SharedSeg",
            axisPlaces: ["SharedSeg", "RowSeg", "ColSeg"],
        });

        expect(product.nested.length).toBe(4);
        expect(scalarValues(product)).toEqual([19, 22, 43, 50]);
    });

    it("keeps all non-sum dimensions from both factors (3D result)", () => {
        // A: Shared × Row × Extra   B: Shared × Col
        // One cell each: A(k0,r0,e0)=2, B(k0,c0)=3 → product at (r0,e0,c0)=6
        const rows = axisList("RowListSeg", "RowSeg", ["r0"]);
        const cols = axisList("ColListSeg", "ColSeg", ["c0"]);
        const extras = axisList("ExtraListSeg", "ExtraSeg", ["e0"]);
        const shared = axisList("SharedListSeg", "SharedSeg", ["k0"]);

        const matrixA = cardFactory({
            nested: eArrayFactory([
                cellCard(2, {
                    RowListSeg: () => rows.items[0],
                    ExtraListSeg: () => extras.items[0],
                    SharedListSeg: () => shared.items[0],
                }),
            ]),
        });
        const matrixB = cardFactory({
            nested: eArrayFactory([
                cellCard(3, {
                    SharedListSeg: () => shared.items[0],
                    ColListSeg: () => cols.items[0],
                }),
            ]),
        });

        seedAndFire(matrixA, rows.list, extras.list, shared.list);
        seedAndFire(matrixB, shared.list, cols.list);

        let capturedPositions: ISeg[] | undefined;
        const product = matrixProductCardFactory({
            first: matrixA,
            second: matrixB,
            sumAxisPlace: "SharedSeg",
            resultCardFactory: (result, placement) => {
                capturedPositions = [...placement.positions];
                return cardFactory({ attrs: result });
            },
        });

        expect(product.nested.length).toBe(1);
        expect(scalarValues(product)).toEqual([6]);
        expect(capturedPositions?.map((seg) => seg.typeName).sort()).toEqual([
            "ColSeg",
            "ExtraSeg",
            "RowSeg",
        ]);
    });

    it("recomputes when an input nested collection changes", () => {
        const rows = axisList("RowListSeg", "RowSeg", ["r0"]);
        const cols = axisList("ColListSeg", "ColSeg", ["c0"]);
        const shared = axisList("SharedListSeg", "SharedSeg", ["k0"]);

        const aNested = eArrayFactory([
            cellCard(2, {
                RowListSeg: () => rows.items[0],
                SharedListSeg: () => shared.items[0],
            }),
        ]);
        const matrixA = cardFactory({ nested: aNested });

        const matrixB = cardFactory({
            nested: eArrayFactory([
                cellCard(3, {
                    SharedListSeg: () => shared.items[0],
                    ColListSeg: () => cols.items[0],
                }),
            ]),
        });

        seedAndFire(matrixA, rows.list, shared.list);
        seedAndFire(matrixB, shared.list, cols.list);

        const product = matrixProductCardFactory({
            first: matrixA,
            second: matrixB,
            sumAxisPlace: "SharedSeg",
        });

        expect(scalarValues(product)).toEqual([6]);

        aNested.push(
            cellCard(4, {
                RowListSeg: () => rows.items[0],
                SharedListSeg: () => shared.items[0],
            }),
        );

        // Two cells at same (r0,k0) both multiply with B's 3 and sum: 2*3 + 4*3 = 18
        expect(scalarValues(product)).toEqual([18]);
    });

    it("places result children via parent childPos without child selfPos", () => {
        const rows = axisList("RowListSeg", "RowSeg", ["r0"]);
        const cols = axisList("ColListSeg", "ColSeg", ["c0"]);
        const shared = axisList("SharedListSeg", "SharedSeg", ["k0"]);

        const matrixA = cardFactory({
            nested: eArrayFactory([
                cellCard(2, {
                    RowListSeg: () => rows.items[0],
                    SharedListSeg: () => shared.items[0],
                }),
            ]),
        });
        const matrixB = cardFactory({
            nested: eArrayFactory([
                cellCard(3, {
                    SharedListSeg: () => shared.items[0],
                    ColListSeg: () => cols.items[0],
                }),
            ]),
        });

        seedAndFire(matrixA, rows.list, shared.list);
        seedAndFire(matrixB, shared.list, cols.list);

        const product = matrixProductCardFactory({
            first: matrixA,
            second: matrixB,
            sumAxisPlace: "SharedSeg",
            resultCardFactory: (result) => cardFactory({ attrs: result }),
        });

        expect(product.nested.length).toBe(1);
        seedBasis(product, rows.list, cols.list);
        const child = product.nested.at(0);

        expect(product.resolveChildPosition(rows.list, child)).toBe(rows.items[0]);
        expect(product.resolveChildPosition(cols.list, child)).toBe(cols.items[0]);
    });
});

describe("zippedProductCardFactory", () => {
    it("multiplies cells that share both axis positions", () => {
        const rows = axisList("RowListSeg", "RowSeg", ["r0", "r1"]);
        const cols = axisList("ColListSeg", "ColSeg", ["c0"]);

        const first = cardFactory({
            nested: eArrayFactory([
                cellCard(2, {
                    RowListSeg: () => rows.items[0],
                    ColListSeg: () => cols.items[0],
                }),
                cellCard(5, {
                    RowListSeg: () => rows.items[1],
                    ColListSeg: () => cols.items[0],
                }),
            ]),
        });

        const second = cardFactory({
            nested: eArrayFactory([
                cellCard(3, {
                    RowListSeg: () => rows.items[0],
                    ColListSeg: () => cols.items[0],
                }),
                // no match for r1 — should be omitted
            ]),
        });

        seedAndFire(first, rows.list, cols.list);
        seedAndFire(second, rows.list, cols.list);

        const product = zippedProductCardFactory({
            first,
            second,
            axisPlaces: ["RowSeg", "ColSeg"],
        });

        expect(product.nested.length).toBe(1);
        expect(scalarValues(product)).toEqual([6]);
    });

    it("places result children via parent childPos without child selfPos", () => {
        const rows = axisList("RowListSeg", "RowSeg", ["r0"]);
        const cols = axisList("ColListSeg", "ColSeg", ["c0"]);

        const first = cardFactory({
            nested: eArrayFactory([
                cellCard(2, {
                    RowListSeg: () => rows.items[0],
                    ColListSeg: () => cols.items[0],
                }),
            ]),
        });
        const second = cardFactory({
            nested: eArrayFactory([
                cellCard(3, {
                    RowListSeg: () => rows.items[0],
                    ColListSeg: () => cols.items[0],
                }),
            ]),
        });

        seedAndFire(first, rows.list, cols.list);
        seedAndFire(second, rows.list, cols.list);

        const product = zippedProductCardFactory({
            first,
            second,
            axisPlaces: ["RowSeg", "ColSeg"],
            resultCardFactory: (result) => cardFactory({ attrs: result }),
        });

        seedBasis(product, rows.list, cols.list);
        const child = product.nested.at(0);

        expect(product.resolveChildPosition(rows.list, child)).toBe(rows.items[0]);
        expect(product.resolveChildPosition(cols.list, child)).toBe(cols.items[0]);
    });
});

describe("sumUpCardFactory", () => {
    it("sums along one axis and keeps the other", () => {
        const rows = axisList("RowListSeg", "RowSeg", ["r0", "r1"]);
        const cols = axisList("ColListSeg", "ColSeg", ["c0", "c1"]);

        const source = cardFactory({
            nested: eArrayFactory([
                cellCard(1, {
                    RowListSeg: () => rows.items[0],
                    ColListSeg: () => cols.items[0],
                }),
                cellCard(2, {
                    RowListSeg: () => rows.items[0],
                    ColListSeg: () => cols.items[1],
                }),
                cellCard(10, {
                    RowListSeg: () => rows.items[1],
                    ColListSeg: () => cols.items[0],
                }),
                cellCard(20, {
                    RowListSeg: () => rows.items[1],
                    ColListSeg: () => cols.items[1],
                }),
            ]),
        });

        seedAndFire(source, rows.list, cols.list);

        const byRow = sumUpCardFactory({
            source,
            sumAxisPlace: "ColSeg",
            keepAxisPlace: "RowSeg",
        });

        expect(byRow.nested.length).toBe(2);
        expect(scalarValues(byRow)).toEqual([3, 30]);
    });

    it("places result children via parent childPos; stretches unknown places", () => {
        const rows = axisList("RowListSeg", "RowSeg", ["r0"]);
        const cols = axisList("ColListSeg", "ColSeg", ["c0"]);
        const unit = axisList("UnitColumnListSeg", "UnitColumnSeg", ["total"]);

        const source = cardFactory({
            nested: eArrayFactory([
                cellCard(5, {
                    RowListSeg: () => rows.items[0],
                    ColListSeg: () => cols.items[0],
                }),
            ]),
        });

        seedAndFire(source, rows.list, cols.list);

        const byRow = sumUpCardFactory({
            source,
            sumAxisPlace: "ColSeg",
            keepAxisPlace: "RowSeg",
            resultCardFactory: (result) => cardFactory({ attrs: result }),
        });

        expect(byRow.nested.length).toBe(1);
        seedBasis(byRow, rows.list, unit.list);
        const child = byRow.nested.at(0);

        expect(byRow.resolveChildPosition(rows.list, child)).toBe(rows.items[0]);
        // No keep position for unit axis → undefined miss → identity stretch
        expect(byRow.resolveChildPosition(unit.list, child)).toBe(unit.list);
    });
});
