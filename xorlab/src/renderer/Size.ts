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


import { Direction } from "./CardVi";
import { SizeString, SizeStyleItem, sizeStyleItemFactory } from "./SizeStyle";

export interface EStyle {
    window?: SizeString;
    windowH?: SizeString;
    windowV?: SizeString;
    collapsed?: boolean;
}

export type EStyleSheet = Partial<Record<string, EStyle>>;


export interface EStyleAdapter {
    window?: SizeStyleItem;
    collapsed?: boolean;
}

export type EStyleSheetAdapter = {
    [name: string]: EStyleAdapter
}

export function segSizeFactory(style: EStyle, direction: Direction): SizeString {
    if (direction === "HORIZONTAL" && style.windowH !== undefined) {
        return style.windowH;
    } else if (direction === "VERTICAL" && style.windowV !== undefined) {
        return style.windowV;
    } else {
        return style.window || "auto";
    }
}

export function styleAdapterFactory(styleSheet: EStyle, direction: Direction): EStyleAdapter {
    return {
        window: sizeStyleItemFactory(segSizeFactory(styleSheet, direction)),
        collapsed: styleSheet.collapsed,
    };
}

export function styleSheetAdapterFactory(styleSheet: EStyleSheet, direction: Direction): EStyleSheetAdapter {
    return Object.fromEntries(
        Object.entries(styleSheet as Record<string, EStyle>).map(([name, style]) => {
            return [name, styleAdapterFactory(style, direction)];
        })
    )
}

 