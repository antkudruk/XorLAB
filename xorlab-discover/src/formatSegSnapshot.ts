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

function isPropertyLike(value: unknown): value is { value: unknown } {
    return (
        typeof value === "object" &&
        value !== null &&
        "value" in value &&
        "subscribe" in value &&
        typeof (value as { subscribe: unknown }).subscribe === "function"
    );
}

function snapshotValue(value: unknown, seen: WeakSet<object>): unknown {
    if (value === null || value === undefined) {
        return value;
    }
    if (typeof value === "function") {
        return `[Function ${value.name || "anonymous"}]`;
    }
    if (typeof value !== "object") {
        return value;
    }
    if (seen.has(value as object)) {
        return "[Circular]";
    }
    if (isPropertyLike(value)) {
        return { value: snapshotValue(value.value, seen) };
    }
    seen.add(value as object);
    if (Array.isArray(value)) {
        return value.map((item) => snapshotValue(item, seen));
    }
    const result: Record<string, unknown> = {};
    for (const [key, entry] of Object.entries(value as Record<string, unknown>)) {
        result[key] = snapshotValue(entry, seen);
    }
    return result;
}

export function prettyPrint(value: unknown): string {
    return JSON.stringify(snapshotValue(value, new WeakSet()), null, "\t");
}

export function formatCardFactories(
    cardFactories: Record<string, unknown> | undefined,
): string {
    if (!cardFactories) {
        return "{}";
    }
    const entries = Object.entries(cardFactories);
    if (entries.length === 0) {
        return "{}";
    }
    const lines: string[] = ["{"];
    for (const [key, handler] of entries) {
        const body =
            typeof handler === "function"
                ? Function.prototype.toString.call(handler)
                : String(handler);
        const bodyLines = body.split("\n");
        for (let i = 0; i < bodyLines.length; i++) {
            if (i === 0) {
                lines.push(`\t${key}: ${bodyLines[i]}`);
            } else {
                lines.push(`\t${bodyLines[i]}`);
            }
        }
        lines[lines.length - 1] += ",";
    }
    lines.push("}");
    return lines.join("\n");
}
