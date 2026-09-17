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

import { ImportInfo } from "./import_utils";
import { MethodUsageInfo } from "./method_finder";
import {
    formatTypeNameCapitalizationError,
    isValidTypeNameStart,
    parseQuotedTypeNameLiteral,
} from "./typeName";

export interface Usage {
    readonly filePath: string;
    readonly lineNumber: number;
}

export interface TypeNameGroup {
    readonly typeName: string;
    readonly argumentTypes: Record<string, string>;
    imports: ImportInfo[];   // TODO: Make read only
    readonly usages: Usage[];
}

export interface ValidationResult {
    readonly isValid: boolean;
    readonly groups: TypeNameGroup[];
    readonly errors: string[];
}

export function validate(usages: MethodUsageInfo[]): ValidationResult {
    const typeNameGroups = new Map<string, TypeNameGroup>();
    const errors: string[] = [];

    for (const usage of usages) {
        const typeName = usage.argumentTypes.typeName;
        if (!typeName) {
            continue;
        }

        const capitalizationError = validateTypeNameCapitalization(typeName, usage);
        if (capitalizationError && !errors.includes(capitalizationError)) {
            errors.push(capitalizationError);
        }

        const existingGroup = typeNameGroups.get(typeName);
        if (!existingGroup) {
            typeNameGroups.set(typeName, {
                typeName,
                argumentTypes: usage.argumentTypes,
                imports: dedupeImports(usage.imports),
                usages: [{
                    filePath: usage.filePath,
                    lineNumber: usage.lineNumber
                }]
            });
            continue;
        }

        existingGroup.usages.push({
            filePath: usage.filePath,
            lineNumber: usage.lineNumber
        });
        existingGroup.imports = dedupeImports([...existingGroup.imports, ...usage.imports]);

        if (!areArgumentTypesCompatible(existingGroup.argumentTypes, usage.argumentTypes)) {
            const allGroupUsages = usages.filter((u) => u.argumentTypes.typeName === typeName);
            const errorMessage = createErrorMessage(typeName, allGroupUsages);
            if (!errors.includes(errorMessage)) {
                errors.push(errorMessage);
            }
        }
    }

    const groups = Array.from(typeNameGroups.values())
        .sort((a, b) => a.typeName.localeCompare(b.typeName));

    return {
        isValid: errors.length === 0,
        groups,
        errors
    };
}

function areArgumentTypesCompatible(argTypes1: Record<string, string>, argTypes2: Record<string, string>): boolean {
    const comparableKeys = ["attrs", "nested"] as const;

    for (const key of comparableKeys) {
        const value1 = argTypes1[key] ?? "never";
        const value2 = argTypes2[key] ?? "never";
        if (value1 !== value2) {
            return false;
        }
    }

    return true;
}

function dedupeImports(imports: ImportInfo[]): ImportInfo[] {
    const seen = new Set<string>();
    const result: ImportInfo[] = [];

    for (const item of imports) {
        const key = `${item.typeName}|${item.modulePath}`;
        if (seen.has(key)) {
            continue;
        }
        seen.add(key);
        result.push(item);
    }

    return result;
}

function validateTypeNameCapitalization(
    typeNameQuoted: string,
    usage: MethodUsageInfo,
): string | undefined {
    try {
        const name = parseQuotedTypeNameLiteral(typeNameQuoted);
        if (!isValidTypeNameStart(name)) {
            return formatTypeNameCapitalizationError(
                name,
                usage.filePath,
                usage.lineNumber,
            );
        }
    } catch {
        return undefined;
    }

    return undefined;
}

function createErrorMessage(typeName: string, inconsistentUsages: MethodUsageInfo[]): string {
    const usageDetails = inconsistentUsages.map(usage => 
        `  - ${usage.filePath}:${usage.lineNumber}`
    ).join('\n');
    
    return `Inconsistent argumentTypes found for typeName "${typeName}":\n${usageDetails}`;
}