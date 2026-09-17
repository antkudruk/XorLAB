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
    TREE_SEG_TYPE_NAME,
    type CardVi,
    type ISeg,
    type Renderer,
    type RendererCard,
} from "xorlab";
import { formatCardFactories, prettyPrint } from "./formatSegSnapshot";

function resolveDiscoveredSeg(cardVi: CardVi): ISeg | undefined {
    const candidates = Object.values(cardVi.viBasis).filter(
        (segVi) =>
            segVi.parent?.source.typeName !== TREE_SEG_TYPE_NAME,
    );
    return candidates.length === 1 ? candidates[0]!.source : undefined;
}

function buildDialogContent(seg: ISeg): HTMLElement {
    const container = document.createElement("div");
    container.style.display = "flex";
    container.style.flexDirection = "column";
    container.style.gap = "0.75rem";
    container.style.maxWidth = "min(90vw, 640px)";
    container.style.maxHeight = "80vh";
    container.style.overflow = "auto";

    const title = document.createElement("h2");
    title.textContent = "Segment discovery";
    title.style.margin = "0";
    title.style.fontSize = "1.1rem";
    container.appendChild(title);

    const sections: Array<{ label: string; body: string }> = [
        { label: "typeName", body: prettyPrint(seg.typeName) },
        { label: "attrs", body: prettyPrint(seg.attrs) },
        {
            label: "cardFactories",
            body: formatCardFactories(
                seg.cardFactories as Record<string, unknown> | undefined,
            ),
        },
        { label: "style", body: prettyPrint(seg.style) },
    ];

    for (const section of sections) {
        const heading = document.createElement("h3");
        heading.textContent = section.label;
        heading.style.margin = "0";
        heading.style.fontSize = "0.95rem";
        container.appendChild(heading);

        const pre = document.createElement("pre");
        pre.textContent = section.body;
        pre.style.margin = "0";
        pre.style.padding = "0.5rem";
        pre.style.background = "#f4f5f7";
        pre.style.borderRadius = "4px";
        pre.style.overflow = "auto";
        pre.style.fontSize = "0.85rem";
        pre.style.whiteSpace = "pre-wrap";
        pre.style.wordBreak = "break-word";
        container.appendChild(pre);
    }

    const closeBtn = document.createElement("button");
    closeBtn.type = "button";
    closeBtn.textContent = "Close";
    closeBtn.style.alignSelf = "flex-end";
    closeBtn.style.padding = "0.35rem 0.75rem";
    closeBtn.style.cursor = "pointer";
    container.appendChild(closeBtn);

    return container;
}

function openSegDialog(seg: ISeg): void {
    const dialog = document.createElement("dialog");
    dialog.style.border = "1px solid #cbd5e1";
    dialog.style.borderRadius = "8px";
    dialog.style.padding = "1rem";
    dialog.style.fontFamily = "system-ui, sans-serif";

    const content = buildDialogContent(seg);
    const closeBtn = content.querySelector("button");
    dialog.appendChild(content);
    document.body.appendChild(dialog);

    const cleanup = () => {
        dialog.close();
        dialog.remove();
    };
    closeBtn?.addEventListener("click", cleanup);
    dialog.addEventListener("cancel", cleanup);
    dialog.showModal();
}

export const SegDiscoveryRenderer: Renderer = {
    updateCardHtmlelement(
        _value: RendererCard,
        cardElement: HTMLElement,
        cardVi: CardVi,
    ): void {
        const seg = resolveDiscoveredSeg(cardVi);

        cardElement.style.display = "flex";
        cardElement.style.flexDirection = "column";
        cardElement.style.alignItems = "stretch";
        cardElement.style.justifyContent = "flex-start";
        cardElement.style.boxSizing = "border-box";
        cardElement.style.padding = "4px";
        cardElement.style.gap = "4px";
        cardElement.style.overflow = "hidden";
        cardElement.style.background = "#fff";
        cardElement.style.border = "1px solid #cbd5e1";

        cardElement.replaceChildren();

        const typeLabel = document.createElement("div");
        typeLabel.textContent = seg?.typeName ?? "(unknown segment)";
        typeLabel.style.fontSize = "12px";
        typeLabel.style.fontWeight = "600";
        typeLabel.style.overflow = "hidden";
        typeLabel.style.textOverflow = "ellipsis";
        typeLabel.style.whiteSpace = "nowrap";
        cardElement.appendChild(typeLabel);

        const moreBtn = document.createElement("button");
        moreBtn.type = "button";
        moreBtn.textContent = "...";
        moreBtn.style.alignSelf = "flex-start";
        moreBtn.style.padding = "0 6px";
        moreBtn.style.lineHeight = "1.4";
        moreBtn.style.cursor = "pointer";
        moreBtn.disabled = !seg;
        moreBtn.addEventListener("click", (event) => {
            event.stopPropagation();
            if (seg) {
                openSegDialog(seg);
            }
        });
        cardElement.appendChild(moreBtn);
    },
};
