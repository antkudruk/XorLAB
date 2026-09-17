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
import { FLAGS } from '../flags';
import {
    buildEArrayTupleFromFactoryInitializer,
    buildEMappedFactoryTypeString,
    getEArrayFactoryArrayLiteralLength,
    inferCollectionElementType,
    replaceArrayElementType,
    unwrapExpression,
} from './entity_inference';

export function buildPropertyInitializers(firstArg: ts.Expression): Map<string, ts.Expression> {
    const result = new Map<string, ts.Expression>();
    if (!ts.isObjectLiteralExpression(firstArg)) {
        return result;
    }

    firstArg.properties.forEach((property) => {
        if (ts.isPropertyAssignment(property)) {
            const propertyName = getPropertyName(property.name);
            if (propertyName) {
                result.set(propertyName, property.initializer);
            }
        }

        if (ts.isShorthandPropertyAssignment(property)) {
            result.set(property.name.text, property.name);
        }
    });

    return result;
}

export function getPropertyName(name: ts.PropertyName): string | undefined {
    if (ts.isIdentifier(name) || ts.isStringLiteral(name) || ts.isNumericLiteral(name)) {
        return name.text;
    }

    return undefined;
}

export function serializePropertyType(
    propertyName: string,
    propertyType: ts.Type,
    initializer: ts.Expression | undefined,
    checker: ts.TypeChecker,
    ownerSegTypeName?: string
): string {
    const fallback = checker.typeToString(propertyType, undefined, FLAGS);

    if (propertyName === 'typeName') {
        if (!initializer) {
            return '';
        }
        const unwrapped = unwrapExpression(initializer);
        if (ts.isStringLiteralLike(unwrapped)) {
            return JSON.stringify(unwrapped.text);
        }
        if (ts.isIdentifier(unwrapped)) {
            const symbol = checker.getSymbolAtLocation(unwrapped);
            const initializerType = symbol
                ? checker.getTypeOfSymbolAtLocation(symbol, unwrapped)
                : checker.getTypeAtLocation(unwrapped);
            if (initializerType?.isStringLiteral()) {
                return JSON.stringify(initializerType.value);
            }
        }
        return '';
    }

    if (!initializer) {
        return fallback;
    }

    if (propertyName === 'nested') {
        const unwrappedInitializer = unwrapExpression(initializer);
        const eMappedType = buildEMappedFactoryTypeString(unwrappedInitializer, checker);
        if (eMappedType) {
            return eMappedType;
        }

        const elementType = inferCollectionElementType(initializer, checker);
        const eArrayTupleLength = getEArrayFactoryArrayLiteralLength(initializer);
        if (
            elementType &&
            eArrayTupleLength !== undefined &&
            eArrayTupleLength >= 2
        ) {
            const tupleFromLiteral = buildEArrayTupleFromFactoryInitializer(
                initializer,
                elementType
            );
            if (tupleFromLiteral) {
                return tupleFromLiteral;
            }
        }

        const normalizedType = elementType
            ? replaceArrayElementType(fallback, elementType)
            : undefined;

        if (normalizedType) {
            return normalizedType;
        }

        if (elementType) {
            const tupleFromLiteral = buildEArrayTupleFromFactoryInitializer(
                initializer,
                elementType
            );
            if (tupleFromLiteral) {
                return tupleFromLiteral;
            }
        }
    }

    if (propertyName === 'cardFactories' && ownerSegTypeName) {
        return addSelfParameterToCardFactories(fallback, ownerSegTypeName);
    }

    return fallback;
}
function addSelfParameterToCardFactories(typeDefinition: string, ownerSegTypeName: string): string {
    const callbackPattern = /\(\s*(\w+)\s*:\s*([^,)]+?)\s*\)\s*=>/g;
    return typeDefinition.replace(callbackPattern, (_match, argumentName, argumentType) => {
        return `(${argumentName}: ${argumentType}, self: ${ownerSegTypeName}) =>`;
    });
}
