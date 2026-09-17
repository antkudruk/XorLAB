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

export function parseQuotedTypeNameLiteral(quoted: string): string {
    const regex = /^(?<quote>['"`])(?<content>.*?)(?<!\\)\k<quote>$/;
    const match = quoted.match(regex);

    if (!match?.groups) {
        throw new Error("Invalid typeName format: expected a quoted string literal.");
    }

    const { content } = match.groups;

    if (content.length === 0) {
        throw new Error("Invalid typeName format: typeName must not be empty.");
    }

    return content;
}

export function isValidTypeNameStart(name: string): boolean {
    return name.length > 0 && /^[A-Z]/.test(name);
}

export function formatTypeNameCapitalizationError(
    name: string,
    filePath: string,
    lineNumber: number,
): string {
    const suggestion = name.charAt(0).toUpperCase() + name.slice(1);

    return (
        `${filePath}:${lineNumber}: typeName "${name}" must start with an uppercase letter ` +
        `(e.g. "${suggestion}"). Runtime lookups use the exact string literal.`
    );
}
