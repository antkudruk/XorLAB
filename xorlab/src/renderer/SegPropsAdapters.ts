import { Direction } from "./CardVi";

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
export interface SegWidgetProps {
    offset?: number;
    window?: number;
}

export interface SegPropsAdapter {
    readonly direction: Direction;
    patchProps(into: CSSStyleDeclaration, patch: SegWidgetProps): void;
}

export class HorizontalSegPropsAdapter implements SegPropsAdapter {

    static INSTANCE = new HorizontalSegPropsAdapter();

    readonly direction: Direction = 'HORIZONTAL';

    patchProps(into: CSSStyleDeclaration, patch: SegWidgetProps): void {
        into.position = 'absolute';
        if(patch.window != undefined) {
            into.width = `${patch.window}px`;
        }
        if(patch.offset != undefined) {
            into.left = `${patch.offset}px`;
        }
        // TODO: Consider opportunity of a border in the card
        into.borderLeftWidth = '0px';
    }
}

export class VerticalSegPropsAdapter implements SegPropsAdapter {

    static INSTANCE = new VerticalSegPropsAdapter();

    readonly direction: Direction = 'VERTICAL';

    patchProps(into: CSSStyleDeclaration, patch: SegWidgetProps): void {
        into.position = 'absolute';
        if(patch.window != undefined) {
            into.height = `${patch.window}px`;
        }
        if(patch.offset != undefined) {
            into.top = `${patch.offset}px`;
        }
        // TODO: Consider opportunity of a border in the card
        into.borderTopWidth = '0px';
    }
}

export const STYLE_ADAPTERS = {
    VERTICAL: VerticalSegPropsAdapter.INSTANCE,
    HORIZONTAL: HorizontalSegPropsAdapter.INSTANCE
};