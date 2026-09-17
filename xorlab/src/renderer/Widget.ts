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

import type { ISeg } from "../facade/line";
import type { ICard } from "../facade/card";
import { PropertyImpl } from "../collection";
import { HasHtmlElement, CardVi, Direction } from "./CardVi";
import { STYLE_ADAPTERS } from "./SegPropsAdapters";
import { SegVi, SegViCeiling, unsubscribeSegViTree } from "./segment/SegVi";
import { ElementMetaFactory } from "./ElementFactory";
import { v4 as uuidv4 } from 'uuid';
import { EStyleSheet } from "./Size";
import type { CallbackTable } from "./CallbackTable";
import {
    beginWidgetDragSession,
    buildWidgetTreeUuids,
    dispatchWidgetDragEvent,
    dispatchWidgetMouseEvent,
    DRAG_THRESHOLD_PX,
    movementFromStart,
    widgetCoordFromNative,
    type WidgetDragSession,
} from "./WidgetMouse";
import type { WidgetTreeUuids } from "./MouseInteraction";

function parseCssPx(value: string): number {
    if (!value || value === "auto" || value === "none") {
        return 0;
    }
    const parsed = Number.parseFloat(value);
    return Number.isFinite(parsed) ? parsed : 0;
}

/**
 * Scrollable widget host that mounts segment and card Vi trees.
 *
 * Prefer Widget-level configuration over inline factory props:
 * - `callbackTable` — typed mouse handlers keyed by typeName
 * - `styleSheet` — segment layout styles keyed by segment typeName
 *
 * When a callbackTable entry exists for a typeName + event, it overrides any
 * inline handler on the segment or card. Otherwise the inline handler is used.
 *
 * Drag session: `mousedown` starts a capture; after {@link DRAG_THRESHOLD_PX} movement,
 * `mouseDrag` fires on the captured chain; `mouseup` ends the session. An active drag
 * suppresses the following `click`.
 *
 * Widget fully owns {@link CardVi} and {@link SegVi}. Application code must not store
 * those instances; look up `card.vis[treeUuid]` / `seg.vis[treeUuid]` at the call site.
 *
 * @see ../../README.md#widget-configuration
 * @see ../../README.md#cardvi-and-segvi
 */
export class Widget implements HasHtmlElement {
    private _htmlElement: HTMLElement;
    private _stylesheet: EStyleSheet;
    private readonly _callbackTable?: CallbackTable;
    private _segs: { [seg in Direction]: SegVi};
    private _rootCardVi: CardVi;
    private readonly _hostSizes: { [seg in Direction]: PropertyImpl<number> };
    private _resizeObserver?: ResizeObserver;
    private _resizeFrameId?: number;
    private _onMouseMove?: (event: MouseEvent) => void;
    private _onMouseClick?: (event: MouseEvent) => void;
    private _onMouseDoubleClick?: (event: MouseEvent) => void;
    private _onMouseDown?: (event: MouseEvent) => void;
    private _onDocumentMouseMove?: (event: MouseEvent) => void;
    private _onDocumentMouseUp?: (event: MouseEvent) => void;
    private _dragSession?: WidgetDragSession;
    private _suppressNextClick = false;
   
    constructor(props: {
           htmlElement: HTMLElement,
           styleSheet?: EStyleSheet,
           callbackTable?: CallbackTable,
           elementMetaFactory: ElementMetaFactory,
           vertical: ISeg,
           horizontal: ISeg,
           card: ICard
    }) {
        this._htmlElement = props.htmlElement;
        this._stylesheet = props.styleSheet ?? {};
        this._callbackTable = props.callbackTable;
        props.htmlElement.style.position = "relative";
        props.htmlElement.style.overflow = "auto";
        // props.htmlElement.style.width = "100%";
        // props.htmlElement.style.minHeight = "420px";
        this._hostSizes = {
            HORIZONTAL: new PropertyImpl(0),
            VERTICAL: new PropertyImpl(0),
        };
        this._segs = {
               HORIZONTAL: new SegVi({
                    parent: undefined, 
                    styleSheet: this._stylesheet, 
                    source: props.horizontal, 
                    treeUuid: uuidv4(), 
                    cssUpdater: STYLE_ADAPTERS.HORIZONTAL,
                    next: new SegViCeiling(),
                    hostAvailableSpace: this._hostSizes.HORIZONTAL,
                }),
                VERTICAL: new SegVi({
                    parent: undefined, 
                    styleSheet: this._stylesheet, 
                    source: props.vertical,
                    treeUuid: uuidv4(), 
                    cssUpdater: STYLE_ADAPTERS.VERTICAL,
                    next: new SegViCeiling(),
                    hostAvailableSpace: this._hostSizes.VERTICAL,
                }),
        };

        props.horizontal.subscribeVi(this._segs.HORIZONTAL.treeUuid, this._segs.HORIZONTAL);
        props.vertical.subscribeVi(this._segs.VERTICAL.treeUuid, this._segs.VERTICAL);

        this._rootCardVi = new CardVi({
            parent: this,
            treeUuid: uuidv4(),
            source: props.card,
            elementMetaFactory: props.elementMetaFactory,
            basis: this._segs,
            stylesheet: this._stylesheet
        });

        this._rootCardVi.render(this);
        props.card.setBasis({
            [props.vertical.id]: props.vertical,
            [props.horizontal.id]: props.horizontal,
        });
        this._rootCardVi.render(this);
        this._updateHostSizes();
        if (typeof ResizeObserver !== "undefined") {
            this._resizeObserver = new ResizeObserver(() => {
                this._scheduleHostSizeUpdate();
            });
            this._resizeObserver.observe(props.htmlElement);
        }
        const onMouseMove = (event: MouseEvent) => {
            if (this._dragSession) {
                return;
            }
            dispatchWidgetMouseEvent(this._rootCardVi, this._htmlElement, event, "mouseOver", this._callbackTable);
        };
        const onMouseClick = (event: MouseEvent) => {
            if (this._suppressNextClick) {
                this._suppressNextClick = false;
                event.preventDefault();
                event.stopPropagation();
                return;
            }
            dispatchWidgetMouseEvent(this._rootCardVi, this._htmlElement, event, "mouseClick", this._callbackTable);
        };
        const onMouseDoubleClick = (event: MouseEvent) => {
            dispatchWidgetMouseEvent(this._rootCardVi, this._htmlElement, event, "mouseDoubleClick", this._callbackTable);
        };
        const onMouseDown = (event: MouseEvent) => {
            if (event.button !== 0) {
                return;
            }
            this._attachDocumentDragListeners();
            this._dragSession = beginWidgetDragSession(
                this._rootCardVi,
                this._htmlElement,
                event,
                this._callbackTable,
            );
        };
        const onDocumentMouseMove = (event: MouseEvent) => {
            const session = this._dragSession;
            if (!session) {
                return;
            }
            const widgetCoord = widgetCoordFromNative(event, this._htmlElement);
            if (!session.isActiveDrag) {
                if (movementFromStart(session, widgetCoord) < DRAG_THRESHOLD_PX) {
                    return;
                }
                session.isActiveDrag = true;
            }
            dispatchWidgetDragEvent(
                this._rootCardVi,
                this._htmlElement,
                event,
                session,
                "mouseDrag",
                this._callbackTable,
            );
        };
        const onDocumentMouseUp = (event: MouseEvent) => {
            const session = this._dragSession;
            this._detachDocumentDragListeners();
            if (!session) {
                return;
            }
            if (session.isActiveDrag) {
                this._suppressNextClick = true;
            }
            dispatchWidgetDragEvent(
                this._rootCardVi,
                this._htmlElement,
                event,
                session,
                "mouseUp",
                this._callbackTable,
            );
            this._dragSession = undefined;
        };
        props.htmlElement.addEventListener("mousemove", onMouseMove);
        props.htmlElement.addEventListener("click", onMouseClick);
        props.htmlElement.addEventListener("dblclick", onMouseDoubleClick);
        props.htmlElement.addEventListener("mousedown", onMouseDown);
        this._onMouseMove = onMouseMove;
        this._onMouseClick = onMouseClick;
        this._onMouseDoubleClick = onMouseDoubleClick;
        this._onMouseDown = onMouseDown;
        this._onDocumentMouseMove = onDocumentMouseMove;
        this._onDocumentMouseUp = onDocumentMouseUp;
    }

    private _attachDocumentDragListeners(): void {
        const doc = this._htmlElement.ownerDocument;
        if (this._onDocumentMouseMove) {
            doc.addEventListener("mousemove", this._onDocumentMouseMove);
        }
        if (this._onDocumentMouseUp) {
            doc.addEventListener("mouseup", this._onDocumentMouseUp);
        }
    }

    private _detachDocumentDragListeners(): void {
        const doc = this._htmlElement.ownerDocument;
        if (this._onDocumentMouseMove) {
            doc.removeEventListener("mousemove", this._onDocumentMouseMove);
        }
        if (this._onDocumentMouseUp) {
            doc.removeEventListener("mouseup", this._onDocumentMouseUp);
        }
    }

    private _scheduleHostSizeUpdate(): void {
        if (this._resizeFrameId !== undefined) {
            return;
        }
        const schedule = this._htmlElement.ownerDocument.defaultView?.requestAnimationFrame;
        if (!schedule) {
            this._updateHostSizes();
            return;
        }
        this._resizeFrameId = schedule.call(
            this._htmlElement.ownerDocument.defaultView,
            () => {
                this._resizeFrameId = undefined;
                this._updateHostSizes();
            },
        );
    }

    private _measureHostAxis(axis: Direction): number {
        const el = this._htmlElement;
        const isHorizontal = axis === "HORIZONTAL";
        const client = isHorizontal ? el.clientWidth : el.clientHeight;
        if (client > 0) {
            return client;
        }

        const offset = isHorizontal ? el.offsetWidth : el.offsetHeight;
        const rect = el.getBoundingClientRect();
        const rectSize = isHorizontal ? rect.width : rect.height;

        const getComputedStyle = el.ownerDocument.defaultView?.getComputedStyle;
        if (!getComputedStyle) {
            return Math.max(offset, rectSize);
        }

        const cs = getComputedStyle(el);
        const minFromStyle = parseCssPx(isHorizontal ? cs.minWidth : cs.minHeight);

        let parentSize = 0;
        const parent = el.parentElement;
        if (parent) {
            const parentClient = isHorizontal ? parent.clientWidth : parent.clientHeight;
            if (parentClient > 0) {
                parentSize = parentClient;
            } else {
                parentSize = parseCssPx(
                    isHorizontal
                        ? getComputedStyle(parent).width
                        : getComputedStyle(parent).height,
                );
            }
        }

        return Math.max(offset, rectSize, minFromStyle, parentSize);
    }

    private _updateHostSizes(): void {
        const measuredHorizontal = this._measureHostAxis("HORIZONTAL");
        const measuredVertical = this._measureHostAxis("VERTICAL");
        if (
            measuredHorizontal === this._hostSizes.HORIZONTAL.value
            && measuredVertical === this._hostSizes.VERTICAL.value
        ) {
            return;
        }
        this._hostSizes.HORIZONTAL.value = measuredHorizontal;
        this._hostSizes.VERTICAL.value = measuredVertical;
    }
   
    get htmlElement(): HTMLElement {
        return this._htmlElement;
    }
   
    get viBasis() {
        return {...this._segs};
    }

    get rootCardVi(): CardVi {
        return this._rootCardVi;
    }

    /** Vi tree UUIDs for this widget (vertical seg, horizontal seg, root card). */
    get treeUuids(): WidgetTreeUuids {
        return buildWidgetTreeUuids(this._rootCardVi);
    }

    destroy(): void {
        this._detachDocumentDragListeners();
        this._dragSession = undefined;
        const cancel = this._htmlElement.ownerDocument.defaultView?.cancelAnimationFrame;
        if (this._resizeFrameId !== undefined && cancel) {
            cancel.call(this._htmlElement.ownerDocument.defaultView, this._resizeFrameId);
        }
        this._resizeObserver?.disconnect();
        if (this._onMouseMove) {
            this._htmlElement.removeEventListener("mousemove", this._onMouseMove);
        }
        if (this._onMouseClick) {
            this._htmlElement.removeEventListener("click", this._onMouseClick);
        }
        if (this._onMouseDoubleClick) {
            this._htmlElement.removeEventListener("dblclick", this._onMouseDoubleClick);
        }
        if (this._onMouseDown) {
            this._htmlElement.removeEventListener("mousedown", this._onMouseDown);
        }
        unsubscribeSegViTree(this._segs.HORIZONTAL);
        unsubscribeSegViTree(this._segs.VERTICAL);
        this._rootCardVi.removeElement();
    }
}
