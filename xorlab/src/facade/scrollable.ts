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

import { SizeString } from "../renderer/SizeStyle";
import {
    createScrollableSystem,
    type CreateScrollableSystemProps,
    type ScrollableSystemResult,
} from "../basic/scroll/ScrollableSystem";
import { ICard } from "./card";
import { ISeg } from "./line";

export interface ScrollableSystemProps {
    readonly verticalContentSeg: ISeg;
    readonly horizontalContentSeg: ISeg;
    readonly widgetCard: ICard;
    readonly scrollbarWidth?: SizeString;
}

export interface ScrollableSystem {
    readonly vertical: ISeg;
    readonly horizontal: ISeg;
    readonly card: ICard;
}

export function scrollableSystemFactory(
    props: ScrollableSystemProps,
): ScrollableSystem {
    const result: ScrollableSystemResult = createScrollableSystem(
        props as CreateScrollableSystemProps,
    );
    return {
        vertical: result.vertical,
        horizontal: result.horizontal,
        card: result.card,
    };
}
