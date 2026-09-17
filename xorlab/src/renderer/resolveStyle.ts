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
import type { EStyle, EStyleSheet } from "./Size";

/**
 * Resolves segment layout style: merges inline `source.style` with Widget `styleSheet`
 * entry for the segment typeName. StyleSheet fields override inline fields.
 */
export function resolveSegStyle(source: ISeg, styleSheet: EStyleSheet = {}): EStyle {
    const sheetStyle = styleSheet[source.typeName];
    if (!sheetStyle) {
        return source.style;
    }
    return {
        ...source.style,
        ...sheetStyle,
    };
}
