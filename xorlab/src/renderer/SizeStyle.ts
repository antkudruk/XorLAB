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


export type SizeUnit = 'px' | '%' | 'em' | 'rem' | 'flex' | 'auto';

export type SizeString = `${number}${Exclude<SizeUnit, 'auto'>}` | 'auto' | 'rem';
export interface SizeStyleItem {
    readonly unit: SizeUnit;
    readonly value: number;
}
   
export function sizeStyleItemFactory(sizeString: SizeString): SizeStyleItem {
    if (sizeString === 'auto') {
        return {
            unit: 'auto',
            value: Number.NaN,
        };
    }

    if (sizeString === 'rem') {
        return {
            unit: 'rem',
            value: 100,
        };
    }

    const match = sizeString.match(/^([\d.]+)(px|%|em|rem|flex)$/);
    if (!match) {
        throw 'Wrong style';
    }

    const [, value, unit] = match;
    return {
        unit: unit as Exclude<SizeUnit, 'auto'>,
        value: Number.parseFloat(value),
    };
}

   