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

/**
 * Segment sizing vocabulary:
 *
 * - Flexible segment — resolved `window` depends on the parent (or host for root):
 *   `windowStyle` is `%` / `rem` / `flex`, or `auto` with at least one flexible child.
 * - `windowStyle` — declared size from `EStyleSheet` / `EStyle` (`"100px"`, `"auto"`,
 *   `"50%"`, `"100flex"`, `"100rem"`, `"rem"`, …) as a `SizeString`.
 * - `window` — actual resolved length in px along this axis.
 * - `fixedPartSize` — sum of sibling windows that are not flexible.
 * - `flexiblePartWidth` (flex pool) — `window − fixedPartSize`; used by `Nflex`.
 * - `flexPartSize` — sum of sibling windows with unit `flex`.
 * - `remPartWidth` (rem pool) — `window − fixedPartSize − flexPartSize`; used by `Nrem` / `rem`.
 */

import type { ISeg } from "../../facade/line";
import { EReadCollection } from "../../collection";
import { BiProperty } from "../../collection/property/BiProperty";
import { MapProperty } from "../../collection/property/MapProperty";
import { PropertyImpl, ReadOnlyProperty } from "../../collection/property/Property";
import { QuintupleProperty } from "../../collection/property/QuintupleProperty";
import { TripleProperty } from "../../collection/property/TripleProperty";
import { QuadrupleProperty } from "../../collection/property/QuadrupleProperty";
import type { SegVi } from "./SegVi";

/** Resolved window length (px) while a segment is collapsed. Nested SegVis stay mounted. */
export const COLLAPSED_WINDOW_PX = 0;

export interface SegSizeProcessorParent {
    readonly availableSpace: ReadOnlyProperty<number>;
}

export interface SegSizeProcessor extends SegSizeProcessorParent {
    readonly window: ReadOnlyProperty<number>;
    readonly flexible: ReadOnlyProperty<boolean>;
    readonly hasFlexibleChildren: ReadOnlyProperty<boolean>;
    readonly flexiblePartWidth: ReadOnlyProperty<number>;
    readonly remPartWidth: ReadOnlyProperty<number>;
    readonly scrollable: ReadOnlyProperty<boolean>;
}

export interface SegSizeProcessorProps {
    readonly source: EReadCollection<ISeg[]>,
}

function resolveAutoBasis(
    isFlexible: boolean,
    fixedPartSize: number,
    parentFlexiblePartWidth: number,
    flexibleSiblingCount: number,
): number {
    if (!isFlexible) {
        return fixedPartSize;
    }
    if (flexibleSiblingCount <= 0) {
        return 0;
    }
    return parentFlexiblePartWidth / flexibleSiblingCount;
}

function resolveWindowSize(
    windowStyle: string,
    autoBasis: number,
    space: number,
    flexiblePartWidth: number,
    remPartWidth: number,
): number {
    if (windowStyle === "auto") {
        return autoBasis;
    } else if (windowStyle.endsWith("%")) {
        return space * Number.parseFloat(windowStyle.slice(0, -1)) / 100;
    } else if (windowStyle.endsWith("px")) {
        return Number.parseFloat(windowStyle.slice(0, -2));
    } else if (windowStyle === "rem" || windowStyle.endsWith("rem")) {
        // Check rem before any future em path ("10rem".endsWith("em") is true).
        const value = windowStyle === "rem"
            ? 100
            : Number.parseFloat(windowStyle.slice(0, -3));
        return value * remPartWidth / 100;
    } else if (windowStyle.endsWith("flex")) {
        return Number.parseFloat(windowStyle.slice(0, -4)) * flexiblePartWidth / 100;
    }
    throw "Wrong style";
}

export class SegSizeProcessorImpl implements SegSizeProcessor {

    private readonly context: SegVi;

    readonly window: ReadOnlyProperty<number>;
    readonly flexiblePartWidth: ReadOnlyProperty<number>;
    readonly remPartWidth: ReadOnlyProperty<number>;
    readonly hasFlexibleChildren: ReadOnlyProperty<boolean>;
    readonly availableSpace: ReadOnlyProperty<number>;
    readonly flexible: ReadOnlyProperty<boolean>;
    readonly source: EReadCollection<ISeg[]>;
    readonly scrollable: ReadOnlyProperty<boolean>;

    constructor(props: SegSizeProcessorProps, context: SegVi) {
        this.context = context;
        this.source = props.source;
    
        this.hasFlexibleChildren = new MapProperty(
            this.context.countFlexibleChildren, 
            (c) => c > 0
        );

        this.flexible = new BiProperty(
            this.hasFlexibleChildren,
            this.context.windowStyle,
            (hasFlexibleChildren, windowStyle) =>
                (windowStyle === 'auto' && hasFlexibleChildren)
                || windowStyle.endsWith('%')
                || windowStyle.endsWith('rem')
                || windowStyle.endsWith('flex')
        );

        const fallbackSpace = context.hostAvailableSpace ?? new PropertyImpl(800);

        let resolvedWindow: ReadOnlyProperty<number>;
        if(!!context.parent) {
            // Flexible auto shares the parent's flex pool equally among flexible siblings.
            // Non-flexible auto sizes to fixed children only (not flex/% children) so
            // nested Nflex cannot form a window ↔ ceiling feedback loop.
            const autoBasis = new QuadrupleProperty(
                this.flexible,
                this.context.fixedPartSize,
                context.parent.flexiblePartWidth,
                context.parent.countFlexibleChildren,
                resolveAutoBasis,
            );
            resolvedWindow = new QuintupleProperty(
                this.context.windowStyle,
                autoBasis,
                context.parent.availableSpace || fallbackSpace,
                context.parent.flexiblePartWidth,
                context.parent.remPartWidth,
                resolveWindowSize,
            );
        } else {
            // Flexible root auto fills the host axis (same reference as 100%).
            // Non-flexible root auto stays content-sized from the ceiling.
            const rootAutoBasis = new TripleProperty(
                this.flexible,
                this.context.ceiling,
                fallbackSpace,
                (isFlexible, ceiling, host) => (isFlexible ? host : ceiling),
            );
            resolvedWindow = new QuintupleProperty(
                this.context.windowStyle,
                rootAutoBasis,
                fallbackSpace,
                fallbackSpace,
                fallbackSpace,
                resolveWindowSize,
            );
        }

        this.window = new BiProperty(
            resolvedWindow,
            context.collapsed,
            (window, collapsed) => (collapsed ? COLLAPSED_WINDOW_PX : window),
        );

        
        
        this.flexiblePartWidth = new BiProperty(
            this.window,
            this.context.fixedPartSize,
            (window, fixedPart) => window - fixedPart
        );

        this.remPartWidth = new TripleProperty(
            this.window,
            this.context.fixedPartSize,
            this.context.flexPartSize,
            (window, fixedPart, flexPart) => window - fixedPart - flexPart
        );

        // Resolve this conflict with the different size policy
        this.availableSpace = new TripleProperty(
            this.context.windowStyle,
            context.parent?.availableSpace ?? fallbackSpace,
            this.window,
            (windowStyle, parentAvailableSpace, window) => {
                if (windowStyle === "auto") {
                    return parentAvailableSpace;
                } else {
                    return window;
                }
            }
        );

        this.scrollable = new BiProperty(
            this.context.ceiling,
            this.window,
            (client, window) => client > window
        );

        const self = this;

        this.window.subscribe({
            onChange(oldValue: number, newValue: number): void {
                self.context.resizeCardVis(newValue);
            }
        }); 
    }
}
