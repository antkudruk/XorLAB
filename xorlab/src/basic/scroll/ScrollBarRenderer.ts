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

import { Basis } from "../card/Basis";
import { TREE_SEG_TYPE_NAME } from "../tree/TreeSeg";
import type { TreeSegAttributes } from "../tree/TreeSeg";
import type { ISeg } from "../../facade/line";
import { PropertyImpl, ReadOnlyProperty } from "../../collection/property/Property";
import { CardVi } from "../../renderer/CardVi";
import { SegVi } from "../../renderer/segment/SegVi";
import type { Renderer, RendererCard } from "../../renderer/Renderer";

export function getTreeSegIsVertical(cardVi: CardVi): boolean {
    const parentTreeSeg = cardVi
        .source
        .getBasis()
        .getOneByTypeName(TREE_SEG_TYPE_NAME);

    if (!parentTreeSeg) {
        throw new Error("Tree segment is missing from the basis");
    }

    const parentTreeSegVi = Object.values(parentTreeSeg.vis)[0];
    return cardVi.vertical === parentTreeSegVi;
}

export function getScrollBarContent(segVi: SegVi): HTMLElement {
    const scrollBar = document.createElement("div");
    scrollBar.style.height = `${segVi.client.value}px`;
    scrollBar.style.width = `${segVi.client.value}px`;

    segVi.client.subscribe({
        onChange(_oldVal: number, newVal: number) {
            scrollBar.style.height = `${newVal}px`;
            scrollBar.style.width = `${newVal}px`;
        },
    });

    return scrollBar;
}

export function getScrollBar(
    segVi: SegVi,
    isVertical: boolean,
): { element: HTMLElement; applyModelOffset: () => void } {
    const scrollBarContent = getScrollBarContent(segVi);

    const scrollBar = document.createElement("div");
    scrollBar.append(scrollBarContent);

    scrollBar.style.width = `100%`;
    scrollBar.style.height = `100%`;

    let applyingModelOffset = false;

    const readDomOffset = () => (isVertical ? scrollBar.scrollTop : scrollBar.scrollLeft);

    const applyModelOffset = () => {
        const wanted = segVi.scrollOffset.value;
        applyingModelOffset = true;
        if (isVertical) {
            scrollBar.scrollTop = wanted;
        } else {
            scrollBar.scrollLeft = wanted;
        }
        applyingModelOffset = false;
    };

    const onScroll = () => {
        if (applyingModelOffset) {
            return;
        }
        const domOffset = readDomOffset();
        // Layout may clamp to 0 before the viewport has size — do not wipe model offset.
        const canScroll = isVertical
            ? scrollBar.scrollHeight > scrollBar.clientHeight + 1
            : scrollBar.scrollWidth > scrollBar.clientWidth + 1;
        if (!canScroll && domOffset === 0 && segVi.scrollOffset.value !== 0) {
            return;
        }
        segVi.scrollOffset.value = domOffset;
    };

    if (isVertical) {
        scrollBar.style.overflowY = "scroll";
        scrollBar.style.overflowX = "hidden";
        scrollBar.addEventListener("scroll", onScroll);
    } else {
        scrollBar.style.overflowY = "hidden";
        scrollBar.style.overflowX = "scroll";
        scrollBar.addEventListener("scroll", onScroll);
    }

    // Re-apply when content or viewport size changes (expand restores window after DOM mount).
    const reapplyIfNeeded = () => {
        if (segVi.scrollOffset.value !== 0 && readDomOffset() !== segVi.scrollOffset.value) {
            applyModelOffset();
        }
    };
    segVi.client.subscribe({ onChange: reapplyIfNeeded });
    segVi.window.subscribe({ onChange: reapplyIfNeeded });

    return { element: scrollBar, applyModelOffset };
}

/**
 * TreeCard renderCondition helper: true when the tree node segment's client extent
 * exceeds its window ({@link SegVi.scrollable} on the inner node of TreeSeg).
 */
export function scrollbarOverflowRenderCondition(
    _nodeSeg: ISeg,
    basis: Basis,
): ReadOnlyProperty<boolean> {
    const treeSeg = basis.getOneByTypeName(TREE_SEG_TYPE_NAME);
    if (!treeSeg || treeSeg.typeName !== TREE_SEG_TYPE_NAME) {
        return new PropertyImpl(false);
    }
    const innerNode = (treeSeg.attrs as TreeSegAttributes).getNodeSeg();
    const visList = Object.values(innerNode.vis);
    if (visList.length === 0) {
        return new PropertyImpl(true);
    }
    return visList[0]!.scrollable;
}

export function getScrollBarRenderer(): Renderer {
    return {
        updateCardHtmlelement(_value: RendererCard, cardElement: HTMLElement, cardVi: CardVi): void {
            const parentCardVi = cardVi.parent as CardVi;
            const treeSegIsVertical = getTreeSegIsVertical(parentCardVi);
            // Re-render replaces prior scrollbar DOM (render/attachHtml may call this repeatedly).
            cardElement.replaceChildren();
            const { element: scrollBar, applyModelOffset } = treeSegIsVertical
                ? getScrollBar(cardVi.horizontal, !treeSegIsVertical)
                : getScrollBar(cardVi.vertical, !treeSegIsVertical);
            cardElement.appendChild(scrollBar);
            // Restore after attach — disconnected elements do not keep scrollTop/scrollLeft in browsers.
            applyModelOffset();
        },
    };
}
