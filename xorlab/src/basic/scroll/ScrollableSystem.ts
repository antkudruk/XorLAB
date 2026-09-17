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

import { PropertyImpl } from "../../collection";
import { BiProperty } from "../../collection/property/BiProperty";
import { distinctTypeLineCollectionFactory } from "../../collection/facadeFactories";
import { EArray } from "../../collection/EArray";
import { getScrollBarRenderer } from "./ScrollBarRenderer";
import { SizeString } from "../../renderer/SizeStyle";
import { cardFactory, type SelfPosFactories } from "../../facade/card";
import type { ICard } from "../../facade/card";
import { segFactory } from "../../facade/line";
import type { ISeg } from "../../facade/line";
import { createTree } from "../tree/TreeCard";
import { TREE_SEG_TYPE_NAME, treeSeg } from "../tree/TreeSeg";

export const SCROLLABLE_VERTICAL_SEG_TYPE_NAME = "ScrollableVerticalSeg";
export const SCROLLABLE_HORIZONTAL_SEG_TYPE_NAME = "ScrollableHorizontalSeg";
export const SCROLLABLE_CARD_TYPE_NAME = "ScrollableCard";
export const SCROLLBAR_PLACE_SEG_TYPE_NAME = "ScrollbarPlaceSeg";
export const DEFAULT_SCROLLBAR_WIDTH = "16px" as const satisfies SizeString;

export interface CreateScrollableSystemProps {
    readonly verticalContentSeg: ISeg;
    readonly horizontalContentSeg: ISeg;
    readonly widgetCard: ICard;
    readonly scrollbarWidth?: SizeString;
}

export interface ScrollableSystemResult {
    readonly vertical: ISeg;
    readonly horizontal: ISeg;
    readonly card: ICard;
}

function createScrollbarPlaceSeg(width: SizeString): ISeg {
    return segFactory({
        typeName: SCROLLBAR_PLACE_SEG_TYPE_NAME,
        style: { window: width },
    });
}

function getItemByType(place: ISeg, typeName: string): ISeg {
    return (place.nested as unknown as { getItemByType(type: string): ISeg }).getItemByType(typeName);
}

function createScrollableVerticalHost(contentSeg: ISeg, scrollbarWidth: SizeString): ISeg {
    return segFactory({
        typeName: SCROLLABLE_VERTICAL_SEG_TYPE_NAME,
        style: { window: "100%" },
        nested: distinctTypeLineCollectionFactory([
            contentSeg,
            treeSeg({
                order: "backward",
                nodeSegFactory: () => createScrollbarPlaceSeg(scrollbarWidth),
            }),
        ]),
    });
}

function createScrollableHorizontalHost(contentSeg: ISeg, scrollbarWidth: SizeString): ISeg {
    return segFactory({
        typeName: SCROLLABLE_HORIZONTAL_SEG_TYPE_NAME,
        style: { window: "100%" },
        nested: distinctTypeLineCollectionFactory([
            contentSeg,
            treeSeg({
                order: "backward",
                nodeSegFactory: () => createScrollbarPlaceSeg(scrollbarWidth),
            }),
        ]),
    });
}

function createScrollBarCard(
    selfPos: Record<string, (place: ISeg) => ISeg | null | undefined>,
): ICard {
    return createTree({
        typeName: "ScrollbarTreeCard",
        cardFactory: () =>
            cardFactory({
                typeName: "ScrollbarWidgetCard",
                renderer: getScrollBarRenderer(),
            }),
        renderCondition: (it, _) => {
            const visList = Object.values(it?.vis ?? {});
            if (visList.length > 1) {
                throw new Error("ScrollbarCard renderCondition: more than one vis");
            }
            const segVi = visList[0];
            if (segVi) {
                return new BiProperty(
                    segVi.window,
                    segVi.client,
                    (w: number, c: number) => w > 0 && w < c,
                );
            }
            return new PropertyImpl(false);
        },
        // Framework segment names (ScrollableVerticalSeg, etc.) are not in GenSegments until preprocess runs.
        selfPos: selfPos as Parameters<typeof createTree>[0]["selfPos"],
    }) as unknown as ICard;
}

export function createScrollableSystem(
    props: CreateScrollableSystemProps,
): ScrollableSystemResult {
    const scrollbarWidth = props.scrollbarWidth ?? DEFAULT_SCROLLBAR_WIDTH;
    const verticalContentTypeName = props.verticalContentSeg.typeName;
    const horizontalContentTypeName = props.horizontalContentSeg.typeName;

    const vertical = createScrollableVerticalHost(props.verticalContentSeg, scrollbarWidth);
    const horizontal = createScrollableHorizontalHost(props.horizontalContentSeg, scrollbarWidth);

    const wrappedWidgetCard = cardFactory({
        typeName: props.widgetCard.typeName,
        nested: props.widgetCard.nested,
        attrs: props.widgetCard.attrs,
        renderer: props.widgetCard.renderer,
        // Framework segment names (ScrollableVerticalSeg, etc.) are not in GenSegments until preprocess runs.
        selfPos: {
            [SCROLLABLE_VERTICAL_SEG_TYPE_NAME]: (place: ISeg) =>
                getItemByType(place, verticalContentTypeName),
            [SCROLLABLE_HORIZONTAL_SEG_TYPE_NAME]: (place: ISeg) =>
                getItemByType(place, horizontalContentTypeName),
        } as unknown as SelfPosFactories<ICard>,
    });

    const horizontalScrollBarCard = createScrollBarCard({
        [SCROLLABLE_VERTICAL_SEG_TYPE_NAME]: (place) =>
            getItemByType(place, verticalContentTypeName),
        [SCROLLABLE_HORIZONTAL_SEG_TYPE_NAME]: (place) =>
            getItemByType(place, TREE_SEG_TYPE_NAME),
    });

    const verticalScrollBarCard = createScrollBarCard({
        [SCROLLABLE_VERTICAL_SEG_TYPE_NAME]: (place) =>
            getItemByType(place, TREE_SEG_TYPE_NAME),
        [SCROLLABLE_HORIZONTAL_SEG_TYPE_NAME]: (place) =>
            getItemByType(place, horizontalContentTypeName),
    });

    const card = cardFactory({
        typeName: SCROLLABLE_CARD_TYPE_NAME,
        nested: new EArray(wrappedWidgetCard, horizontalScrollBarCard, verticalScrollBarCard),
    });

    return { vertical, horizontal, card };
}
