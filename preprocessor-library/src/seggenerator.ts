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

import { groupAndSortImports } from "./import_processing";
import { MethodUsageInfo } from "./method_finder";
import type { ImportInfo } from "./import_utils";
import { parseQuotedTypeNameLiteral } from "./typeName";

function removeSelfImports(methodUsages: MethodUsageInfo[]): MethodUsageInfo[] {
  return methodUsages.map((usage) => ({
    ...usage,
    imports: usage.imports.filter((importInfo) => importInfo.modulePath !== "generated/generated-lines.d.ts"),
  }));
}

function generateSegType(argumentTypes: Record<string, string>) {
    const typeName = argumentTypes["typeName"];
    if(!typeName) {
        throw "The type may be generated only for named segments";
    }
    const nested = sanitizeEmittedSegTypeString(argumentTypes["nested"] || "never"); // TODO: never[]
    const attrs = sanitizeEmittedSegTypeString(argumentTypes["attrs"] || "never"); // TODO: Consider `never` type instead
    const cardFactories = sanitizeEmittedSegTypeString(argumentTypes["cardFactories"] || "{}");
    const result = `interface ${parseQuotedTypeNameLiteral(typeName)} extends Seg<${nested}, ${typeName}, ${attrs}, ${cardFactories}> {}`;
    return result;
}

function mergeAsUnion(values: string[], fallback: string): string {
    const uniqueValues = Array.from(new Set(values.filter((value) => !!value && value !== "undefined")));
    if (uniqueValues.length === 0) {
        return fallback;
    }

    if (uniqueValues.length === 1) {
        return uniqueValues[0];
    }

    return uniqueValues.map((value) => `(${value})`).join(" | ");
}

function mergeArgumentTypes(argumentTypesList: Record<string, string>[]): Record<string, string> {
    return {
        typeName: argumentTypesList[0]?.typeName,
        nested: mergeAsUnion(argumentTypesList.map((types) => types.nested), "never"),
        attrs: mergeAsUnion(argumentTypesList.map((types) => types.attrs), "never"),
        cardFactories: mergeAsUnion(argumentTypesList.map((types) => types.cardFactories), "{}"),
    };
}

function getMergedArgumentTypesByTypeName(methodUsages: MethodUsageInfo[]): Record<string, string>[] {
    const groupedArgumentTypes = new Map<string, Record<string, string>[]>();
    for (const usage of methodUsages) {
        const argumentTypes = usage.argumentTypes;
        const typeName = argumentTypes.typeName;
        if (!typeName || typeName === "undefined") {
            continue;
        }

        const existing = groupedArgumentTypes.get(typeName) ?? [];
        existing.push(argumentTypes);
        groupedArgumentTypes.set(typeName, existing);
    }

    return Array.from(groupedArgumentTypes.values()).map((group) => mergeArgumentTypes(group));
}

function generateSegTypes(methodUsages: MethodUsageInfo[]) {
    const result = getMergedArgumentTypesByTypeName(methodUsages)
        .map(t => generateSegType(t))
        .map(t => `\t\t${t}`)
        .join("\n");
    return result;
}

function generateGenSegmentsEntry(segType: string) {
  const typeName = parseQuotedTypeNameLiteral(segType);
  const result = `  "${typeName}": GenSegTypes.${typeName},`;
  return result;
}

function generateGenSegmentsEntries(methodUsages: MethodUsageInfo[]) {
  const result = getMergedArgumentTypesByTypeName(methodUsages)
    .map(t => generateGenSegmentsEntry(t.typeName))
    .map(t => `\t\t${t}`)
    .join("\n");
  return result;
}

function generateOrthoCardFactoryMethod(segType: string) {
  const typeName = parseQuotedTypeNameLiteral(segType);
  return `  ${typeName}(ortho: GenSegTypes.${typeName}, self: Self): ICard;`;
}

function generateOrthoCardFactoryMethods(methodUsages: MethodUsageInfo[]) {
  return getMergedArgumentTypesByTypeName(methodUsages)
    .map((t) => generateOrthoCardFactoryMethod(t.typeName))
    .map((t) => `\t${t}`)
    .join("\n");
}

function filterXorlabImportsForEmit(imports: ImportInfo[]): ImportInfo[] {
  return imports;
}

function augmentUsagesForImports(methodUsages: MethodUsageInfo[], segTypesBody: string): MethodUsageInfo[] {
  const base = methodUsages.map((u) => ({
    ...u,
    imports: filterXorlabImportsForEmit(u.imports),
  }));
  if (!/\bTreeSeg\b/.test(segTypesBody)) {
    return base;
  }
  return [
    ...base,
    {
      filePath: "",
      lineNumber: 0,
      argumentTypes: {},
      imports: [{ typeName: "TreeSeg", modulePath: "xorlab", isNodeModules: true }],
    },
  ];
}

export function generateFileContent(methodUsages: MethodUsageInfo[]) {
  const segTypesBody = generateSegTypes(methodUsages);
  const usagesForImports = augmentUsagesForImports(methodUsages, segTypesBody);
  const prettyImports = groupAndSortImports(removeSelfImports(usagesForImports));
  const importsFromNodeModules = 
    prettyImports
    .external
    .map(i => `import { ${i.typeNames.join(', ')} } from "${i.modulePath}";`)
    .join("\n");

  const importsFromProject = 
    prettyImports
    .internal
    .map(i => `import { ${i.typeNames.join(', ')} } from "${i.modulePath}";`)
    .join("\n");

  const result = `
/*
The file is generated by XorLAB preprocessor.
Don't update it manually.

Segment and card typeName values must be globally unique within a preprocessed project.
*/

import { ICard, Card, ISeg, Seg, EReadCollection } from "xorlab";

${importsFromNodeModules}

${importsFromProject}

declare global {
  export interface GenOrthoCardFactories<Self extends ISeg> {
${generateOrthoCardFactoryMethods(methodUsages)}
  }

  export interface GenSegments {
${generateGenSegmentsEntries(methodUsages)}
  }

  export namespace GenSegTypes {
${segTypesBody}
  }
}

export {};
  `;

  return result;
}

/** Keep emitted global segment types importable from xorlab (no non-exported internal names). */
function sanitizeEmittedSegTypeString(typeString: string): string {
    return typeString
        .replace(/\bInternalRuntimeISeg\b/g, "ISeg")
        .replace(/\bInternalRuntimeSeg\b/g, "Seg");
}
