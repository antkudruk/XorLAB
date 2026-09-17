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

import { MethodUsageInfo } from './method_finder';

export interface GroupedImport {
    readonly modulePath: string;
    readonly typeNames: string[];
    readonly isNodeModule: boolean;
}

export interface PrettyImports {
    readonly external: GroupedImport[];
    readonly internal: GroupedImport[];
}


export function groupAndSortImports(imports: MethodUsageInfo[]): PrettyImports {
    const external: GroupedImport[] = [];
    const internal: GroupedImport[] = [];
    
    // Create a map to group imports by module path
    const externalMap = new Map<string, Set<string>>();
    const internalMap = new Map<string, Set<string>>();
    
    // Process each method usage info
    for (const usage of imports) {
        for (const importInfo of usage.imports) {
            const targetMap = importInfo.isNodeModules ? externalMap : internalMap;
            
            if (!targetMap.has(importInfo.modulePath)) {
                targetMap.set(importInfo.modulePath, new Set());
            }
            
            const typeNamesSet = targetMap.get(importInfo.modulePath)!;
            typeNamesSet.add(importInfo.typeName);
        }
    }
    
    // Convert maps to GroupedImport arrays
    for (const [modulePath, typeNamesSet] of externalMap) {
        external.push({
            modulePath,
            typeNames: Array.from(typeNamesSet).sort(),
            isNodeModule: true
        });
    }
    
    for (const [modulePath, typeNamesSet] of internalMap) {
        internal.push({
            modulePath,
            typeNames: Array.from(typeNamesSet).sort(),
            isNodeModule: false
        });
    }
    
    // Sort both arrays by modulePath alphabetically
    external.sort((a, b) => a.modulePath.localeCompare(b.modulePath));
    internal.sort((a, b) => a.modulePath.localeCompare(b.modulePath));
    
    return {
        external,
        internal
    };
}
