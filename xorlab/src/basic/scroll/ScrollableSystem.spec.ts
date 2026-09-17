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

import { cardFactory } from "../../facade/card";
import { distinctTypeLineCollectionFactory, eArrayFactory } from "../../facade/collection";
import { segFactory } from "../../facade/line";
import { scrollableSystemFactory } from "../../facade/scrollable";
import type { ISeg } from "../../facade/line";

describe("ScrollableSystem", () => {
    test("builds scrollable hosts and composite card from content segments and widget card", () => {
        const verticalContentSeg = segFactory({
            typeName: "ContentVerticalSeg",
            style: { window: "100flex" },
        });
        const horizontalContentSeg = segFactory({
            typeName: "ContentHorizontalSeg",
            style: { window: "100flex" },
        });
        const widgetCard = cardFactory({
            typeName: "WidgetCard",
            nested: eArrayFactory([]),
        });

        const system = scrollableSystemFactory({
            verticalContentSeg,
            horizontalContentSeg,
            widgetCard,
            scrollbarWidth: "20px" as const,
        });

        const vertical = system.vertical;
        const horizontal = system.horizontal;
        const verticalNested = vertical.nested as unknown as {
            getItemByType(type: string): ISeg;
        };
        const horizontalNested = horizontal.nested as unknown as {
            getItemByType(type: string): ISeg;
        };

        expect(vertical.typeName).toBe("ScrollableVerticalSeg");
        expect(horizontal.typeName).toBe("ScrollableHorizontalSeg");
        expect(system.card.typeName).toBe("ScrollableCard");

        expect(verticalNested.getItemByType("ContentVerticalSeg")).toBe(verticalContentSeg);
        expect(verticalNested.getItemByType("TreeSeg")).toBeDefined();
        expect(horizontalNested.getItemByType("ContentHorizontalSeg")).toBe(
            horizontalContentSeg,
        );
        expect(horizontalNested.getItemByType("TreeSeg")).toBeDefined();

        expect(system.card.nested.length).toBe(3);
        expect(system.card.nested.at(0)?.typeName).toBe("WidgetCard");
    });

    test("uses default scrollbar width when not provided", () => {
        const verticalContentSeg = segFactory({
            typeName: "ContentVerticalSeg",
            nested: distinctTypeLineCollectionFactory([]),
            style: { window: "100flex" },
        });
        const horizontalContentSeg = segFactory({
            typeName: "ContentHorizontalSeg",
            nested: distinctTypeLineCollectionFactory([]),
            style: { window: "100flex" },
        });

        const system = scrollableSystemFactory({
            verticalContentSeg,
            horizontalContentSeg,
            widgetCard: cardFactory({ typeName: "WidgetCard", nested: eArrayFactory([]) }),
        });

        const vertical = system.vertical;
        const verticalNested = vertical.nested as unknown as {
            getItemByType(type: string): ISeg;
        };
        const treeSeg = verticalNested.getItemByType("TreeSeg");
        const scrollbarPlaceSeg = treeSeg.nested.at(0);
        expect(scrollbarPlaceSeg?.style.window).toBe("16px");
    });
});
