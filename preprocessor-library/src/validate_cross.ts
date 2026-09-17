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

import { MethodUsageInfo } from "./method_finder";
import { parseQuotedTypeNameLiteral } from "./typeName";

interface NamedUsage {
    readonly name: string;
    readonly filePath: string;
    readonly lineNumber: number;
    readonly kind: "segment" | "card";
}

function collectNamedUsages(
    usages: MethodUsageInfo[],
    kind: "segment" | "card",
): NamedUsage[] {
    const result: NamedUsage[] = [];
    for (const usage of usages) {
        const typeName = usage.argumentTypes.typeName;
        if (!typeName || typeName === "undefined") {
            continue;
        }
        try {
            result.push({
                name: parseQuotedTypeNameLiteral(typeName),
                filePath: usage.filePath,
                lineNumber: usage.lineNumber,
                kind,
            });
        } catch {
            continue;
        }
    }
    return result;
}

function formatUsage(usage: NamedUsage): string {
    const label = usage.kind === "segment" ? "segment" : "card";
    return `  - ${label} at ${usage.filePath}:${usage.lineNumber}`;
}

/**
 * Ensures no typeName is used as both a segment and a card within one project.
 */
export function validateCrossKindTypeNames(
    segUsages: MethodUsageInfo[],
    cardUsages: MethodUsageInfo[],
): string[] {
    const segByName = new Map<string, NamedUsage[]>();
    const cardByName = new Map<string, NamedUsage[]>();

    for (const usage of collectNamedUsages(segUsages, "segment")) {
        const existing = segByName.get(usage.name) ?? [];
        existing.push(usage);
        segByName.set(usage.name, existing);
    }

    for (const usage of collectNamedUsages(cardUsages, "card")) {
        const existing = cardByName.get(usage.name) ?? [];
        existing.push(usage);
        cardByName.set(usage.name, existing);
    }

    const errors: string[] = [];
    for (const name of Array.from(segByName.keys()).sort()) {
        const cardUsagesForName = cardByName.get(name);
        if (!cardUsagesForName) {
            continue;
        }
        const details = [
            ...segByName.get(name)!.map(formatUsage),
            ...cardUsagesForName.map(formatUsage),
        ].join("\n");
        errors.push(
            `typeName "${name}" is used as both a segment and a card:\n${details}`,
        );
    }

    return errors;
}
