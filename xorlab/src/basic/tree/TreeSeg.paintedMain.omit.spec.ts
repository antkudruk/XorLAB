/*
 * Tree-card shells (omitDomUntilPainted) stay in the DOM when a painted main card
 * exists — including non-ScrollbarWidgetCard mains (discovery-style).
 */
import { JSDOM } from "jsdom";
import { Widget, ScalarElementMetaFactory } from "../../index";
import {
    cardFactory,
    distinctTypeLineCollectionFactory,
    eArrayFactory,
    eMappedFactory,
    segFactory,
} from "../../facade";
import { PropertyImpl } from "../../collection/property/Property";
import { createTree } from "./TreeCard";
import { TREE_SEG_TYPE_NAME, treeSeg } from "./TreeSeg";
import type { Renderer } from "../../renderer/Renderer";

function ensureDom(): void {
    if (typeof global.document !== "undefined") {
        return;
    }
    const dom = new JSDOM("<!DOCTYPE html><html><body></body></html>", {
        pretendToBeVisual: true,
        url: "http://localhost/",
    });
    (global as unknown as { document: Document }).document = dom.window.document;
    (global as unknown as { window: Window }).window = dom.window as unknown as Window;
    (global as unknown as { HTMLElement: typeof HTMLElement }).HTMLElement = dom.window.HTMLElement;
    (global as unknown as { ResizeObserver: unknown }).ResizeObserver = class {
        observe() {}
        unobserve() {}
        disconnect() {}
    };
}

const paintedRenderer: Renderer = {
    updateCardHtmlelement(_value, cardElement) {
        cardElement.innerText = "painted";
    },
};

describe("Tree card omitDomUntilPainted shell", () => {
    beforeAll(() => {
        ensureDom();
    });

    test("always-true tree with non-ScrollbarWidgetCard painted main appears in the DOM", () => {
        const host = document.createElement("div");
        Object.defineProperty(host, "clientWidth", { configurable: true, value: 900 });
        Object.defineProperty(host, "clientHeight", { configurable: true, value: 600 });
        document.body.appendChild(host);

        const contentList = segFactory({
            typeName: "DiscoverContentListSeg",
            nested: eMappedFactory(
                eArrayFactory([{ id: 0 }, { id: 1 }]),
                (item) =>
                    segFactory({
                        typeName: "DiscoverContentItemSeg",
                        attrs: item,
                        style: { window: "80px" },
                    }),
            ),
            style: { window: "100flex" },
        });

        const discoveryPlace = segFactory({
            typeName: "DiscoveryTreePlaceSeg",
            style: { window: "100flex" },
            nested: distinctTypeLineCollectionFactory([
                treeSeg({
                    nodeSegFactory: () =>
                        segFactory({
                            typeName: "DiscoveryNodeSeg",
                            style: { window: "70px" },
                        }),
                }),
            ]),
        });

        const discoveryTreeCard = createTree({
            typeName: "PaintedDiscoveryTreeCard",
            renderCondition: () => new PropertyImpl(true),
            cardFactory: () =>
                cardFactory({
                    typeName: "PaintedDiscoveryMainCard",
                    renderer: paintedRenderer,
                }),
            // DiscoveryTreePlaceSeg is not in GenSegments in this package test.
            selfPos: {
                DiscoveryTreePlaceSeg: (place: { nested: { getItemByType(type: string): unknown } }) =>
                    place.nested.getItemByType(TREE_SEG_TYPE_NAME),
            } as Parameters<typeof createTree>[0]["selfPos"],
        });

        const widget = new Widget({
            htmlElement: host,
            styleSheet: {
                DiscoverContentListSeg: { window: "100flex" as const },
                DiscoverContentItemSeg: { window: "80px" as const },
                DiscoveryTreePlaceSeg: { window: "100flex" as const },
                DiscoveryNodeSeg: { window: "70px" as const },
            },
            elementMetaFactory: ScalarElementMetaFactory,
            vertical: discoveryPlace,
            horizontal: contentList,
            card: cardFactory({
                typeName: "PaintedDiscoveryHostCard",
                nested: eArrayFactory([discoveryTreeCard]),
            }),
        });

        expect(host.querySelectorAll(".PaintedDiscoveryMainCard").length).toBeGreaterThan(0);
        expect(host.querySelectorAll(".ScrollbarWidgetCard").length).toBe(0);

        // Nested items are also placeActive → deepen and paint child mains.
        expect(host.querySelectorAll(".PaintedDiscoveryMainCard.DiscoverContentItemSeg").length).toBe(2);

        widget.destroy();
    });
});
