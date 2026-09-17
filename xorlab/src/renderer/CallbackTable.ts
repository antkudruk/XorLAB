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
 * Typed mouse callback table for Widget configuration.
 *
 * Keys are typeName values from preprocessor-generated `GenEntities`
 * (segments and cards share one namespace). Prefer passing `callbackTable`
 * to `Widget` rather than inline mouse handlers on factories.
 *
 * @see ../../README.md#widget-configuration
 */
import type { ICard } from "../facade/card";
import type { ISeg } from "../facade/line";
import type {
    MouseClickHandler,
    MouseDoubleClickHandler,
    MouseDownHandler,
    MouseDragHandler,
    MouseOverHandler,
    MouseUpHandler,
} from "./MouseInteraction";

export type CallbackTableEntry<Self extends ICard | ISeg = ICard | ISeg> = {
    readonly mouseOver?: MouseOverHandler<Self>;
    readonly mouseClick?: MouseClickHandler<Self>;
    readonly mouseDoubleClick?: MouseDoubleClickHandler<Self>;
    readonly mouseDown?: MouseDownHandler<Self>;
    readonly mouseDrag?: MouseDragHandler<Self>;
    readonly mouseUp?: MouseUpHandler<Self>;
};

type LooseCallbackTable = Partial<Record<string, CallbackTableEntry>>;

type GenEntityKey = keyof GenSegments | keyof GenCards;

type GenEntityForKey<K extends GenEntityKey> = K extends keyof GenSegments
    ? GenSegments[K]
    : K extends keyof GenCards
      ? GenCards[K]
      : never;

type TypedCallbackTable = Partial<{
    [K in GenEntityKey]: CallbackTableEntry<GenEntityForKey<K>>;
}>;

/** When GenEntities is empty (xorlab package build), accepts any typeName key. */
export type CallbackTable = [GenEntityKey] extends [never]
    ? LooseCallbackTable
    : TypedCallbackTable;
