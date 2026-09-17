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

import type { ISeg, SegAdapter } from "../../facade/line";
import type { EReadCollection } from "../../facade/collection";
import type { ICard } from "../../facade/card";
import { CardToSegRef, createCardToSegRef } from "./CardToSegRef";

export type BasisPatch = { [placeId: string]: ISeg | null };

export type SelfPosPatch = { [dimId: string]: ISeg | null };

export interface PatchBasisResult {
    readonly droppedBasisPart: SelfPosPatch;
    readonly updatedBasisPart: SelfPosPatch;
}

export interface Place {
    readonly id: string;
}

export interface Basis {
    getBasis(): { [place: string]: CardToSegRef };
    getPlaceToSegIds(): { [id: string]: string };
    setBasis(basisPart: BasisPatch, card: ICard): PatchBasisResult;
    at(seg: Place): ISeg | undefined;
    findBySegId(segId: string): ISeg | undefined;
    getOneByTypeName<TypeName extends string>(typeName: TypeName): SegAdapter<EReadCollection<ISeg[]>, TypeName, {}, {}> | undefined;
    findAllByTypeName<TypeName extends string>(typeName: TypeName): { [segId: string]: SegAdapter<EReadCollection<ISeg[]>, TypeName, {}, {}> };
    findAllByTypeNameNotEqualTo(typeName: string): { [segId: string]: ISeg };
    basisToStretchChildren(): { [placeId: string]: ISeg };
    readonly segTypeNameToSegDict: { [key: string]: ISeg };
}

export function createBasis(): Basis {
    return new BasisImpl();
}

export class BasisImpl implements Basis {
    private basis: { [place: string]: CardToSegRef } = {};
    private placeToSegIds: { [id: string]: string } = {};

    getBasis(): { [place: string]: CardToSegRef } {
        return this.basis;
    }

    getPlaceToSegIds(): { [id: string]: string } {
        return this.placeToSegIds;
    }

    setBasis(basisPart: BasisPatch, card: ICard): PatchBasisResult {
        const droppedBasisPart: SelfPosPatch = {};
        const updatedBasisPart: SelfPosPatch = {};

        for (const [place, newSeg] of Object.entries(basisPart)) {
            const previousSegId = this.placeToSegIds[place];

            if (!newSeg) {
                if (previousSegId !== undefined) {
                    this.detachSegment(previousSegId, droppedBasisPart, card);
                    delete this.placeToSegIds[place];
                }
                continue;
            }

            if (previousSegId === newSeg.id) {
                continue;
            }

            if (previousSegId !== undefined) {
                this.detachSegment(previousSegId, droppedBasisPart, card);
            }

            this.placeToSegIds[place] = newSeg.id;
            if (this.basis[newSeg.id]) {
                this.basis[newSeg.id].plus();
            } else {
                this.basis[newSeg.id] = createCardToSegRef(newSeg);
                newSeg.subscribeCard(card);
                updatedBasisPart[newSeg.id] = newSeg;
            }
        }

        return { droppedBasisPart, updatedBasisPart };
    }

    at(place: Place): ISeg | undefined {
        const segId = this.placeToSegIds[place.id];
        return segId ? this.basis[segId]?.seg : undefined;
    }

    findBySegId(segId: string): ISeg | undefined {
        return this.basis[segId]?.seg;
    }

    getOneByTypeName<TypeName extends string>(typeName: TypeName): SegAdapter<EReadCollection<ISeg[]>, TypeName, {}, {}> | undefined {
        return Object.values(this.basis)
            .map(it => it.seg)
            .find(it => it.typeName === typeName) as SegAdapter<EReadCollection<ISeg[]>, TypeName, {}, {}> | undefined;
    }

    findAllByTypeName<TypeName extends string>(typeName: TypeName): { [segId: string]: SegAdapter<EReadCollection<ISeg[]>, TypeName, {}, {}> } {
        return Object.fromEntries(
            Object.entries(this.basis)
                .filter(([, cardToSegRef]) => cardToSegRef.seg.typeName === typeName)
                .map(([segId, cardToSegRef]) => [segId, cardToSegRef.seg])
        ) as { [segId: string]: SegAdapter<EReadCollection<ISeg[]>, TypeName, {}, {}> };
    }

    findAllByTypeNameNotEqualTo(typeName: string): { [segId: string]: ISeg } {
        return Object.fromEntries(
            Object.entries(this.basis)
                .filter(([, cardToSegRef]) => cardToSegRef.seg.typeName !== typeName)
                .map(([segId, cardToSegRef]) => [segId, cardToSegRef.seg])
        );
    }

    /**
     * 
     * Constructs basis for a child card by default.
     * 
     * By default, a card stretches to the whole parent card. So, this method
     * returns a dictionary where the key is a segment id and the value is a segment.
     * 
     * 
     * @returns basis for a child card by default.
     */
    basisToStretchChildren(): { [placeId: string]: ISeg } {
        return Object.fromEntries(
            Object.values(this.basis)
                .map(it => it.seg)
                .filter(Boolean)
                .map(it => [it.id, it])
        );
    }

    get segTypeNameToSegDict(): { [key: string]: ISeg } {
        const duplicates: { [key: string]: true } = {};
        const result: { [key: string]: ISeg } = {};

        Object.values(this.basis)
            .map(cardToSegRef => cardToSegRef.seg)
            .filter(seg => !duplicates[seg.typeName])
            .forEach(seg => {
                if (result[seg.typeName]) {
                    duplicates[seg.typeName] = true;
                    delete result[seg.typeName];
                } else {
                    result[seg.typeName] = seg;
                }
            });

        return result;
    }

    private detachSegment(segId: string, droppedBasisPart: SelfPosPatch, card: ICard): void {
        const segRef = this.basis[segId];
        if (!segRef) {
            return;
        }

        const remained = segRef.minusAndGet();
        if (remained === 0) {
            segRef.seg.unsubscribeCard(card);
            delete this.basis[segId];
            droppedBasisPart[segId] = null;
        }
    }
}
