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

import * as ts from 'typescript';
import { getTypeImports, ImportInfo } from '../import_utils';
import { PreprocessorOptions } from '../preprocessor';
import { normalizeSegTypeName, unwrapExpression } from '../types/entity_inference';
import { buildPropertyInitializers, serializePropertyType } from '../types/serializers';
import type { MethodUsageInfo } from '../method_finder';

export function visitNode(
    node: ts.Node,
    sourceFile: ts.SourceFile,
    methodName: string,
    usages: MethodUsageInfo[],
    checker: ts.TypeChecker,
    projectRoot: string,
    options?: PreprocessorOptions,
) {
    if (ts.isCallExpression(node)) {
        const expression = node.expression;

        if (
            (ts.isPropertyAccessExpression(expression) &&
                ts.isIdentifier(expression.name) &&
                expression.name.text === methodName) ||
            (ts.isIdentifier(expression) && expression.text === methodName)
        ) {
            if (node.arguments.length === 0) {
                ts.forEachChild(node, (childNode) => {
                    visitNode(childNode, sourceFile, methodName, usages, checker, projectRoot, options);
                });
                return;
            }

            const unwrappedFirst = unwrapExpression(node.arguments[0]);
            if (!ts.isObjectLiteralExpression(unwrappedFirst)) {
                ts.forEachChild(node, (childNode) => {
                    visitNode(childNode, sourceFile, methodName, usages, checker, projectRoot, options);
                });
                return;
            }

            const firstArg = unwrappedFirst;
            const argumentTypes: Record<string, string> = {};
            const imports: ImportInfo[] = [];

            const propertyInitializers = buildPropertyInitializers(firstArg);
            const ownerSegTypeName = normalizeSegTypeName(propertyInitializers.get('typeName')?.getText(sourceFile));
            const argType = checker.getTypeAtLocation(firstArg);

            if (argType && argType.getProperties) {
                const properties = argType.getProperties();

                properties.forEach((propertySymbol) => {
                    const propertyName = propertySymbol.getName();

                    const propertyType = checker.getTypeOfSymbolAtLocation(propertySymbol, firstArg);
                    const typeString = serializePropertyType(
                        propertyName,
                        propertyType,
                        propertyInitializers.get(propertyName),
                        checker,
                        ownerSegTypeName
                    );
                    argumentTypes[propertyName] = typeString;

                    const typeImports = getTypeImports(propertyType, projectRoot, options);
                    typeImports.forEach((importInfo) => {
                        if (!imports.some((i) => i.typeName === importInfo.typeName && i.modulePath === importInfo.modulePath)) {
                            imports.push(importInfo);
                        }
                    });
                });
            }

            const mainTypeImports = getTypeImports(argType, projectRoot, options);
            mainTypeImports.forEach((importInfo) => {
                if (!imports.some((i) => i.typeName === importInfo.typeName && i.modulePath === importInfo.modulePath)) {
                    imports.push(importInfo);
                }
            });

            const { line } = sourceFile.getLineAndCharacterOfPosition(node.getStart());

            usages.push({
                filePath: sourceFile.fileName,
                lineNumber: line + 1,
                argumentTypes,
                imports
            });
        }
    }

    ts.forEachChild(node, (childNode) => {
        visitNode(childNode, sourceFile, methodName, usages, checker, projectRoot, options);
    });
}
