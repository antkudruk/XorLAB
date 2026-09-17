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
import { parseQuotedTypeNameLiteral } from '../typeName';

export function unwrapExpression(expression: ts.Expression): ts.Expression {
    let currentExpression = expression;

    while (
        ts.isParenthesizedExpression(currentExpression) ||
        ts.isAsExpression(currentExpression) ||
        ts.isSatisfiesExpression(currentExpression) ||
        ts.isNonNullExpression(currentExpression)
    ) {
        if (ts.isParenthesizedExpression(currentExpression)) {
            currentExpression = currentExpression.expression;
            continue;
        }

        if (ts.isNonNullExpression(currentExpression)) {
            currentExpression = currentExpression.expression;
            continue;
        }

        currentExpression = currentExpression.expression;
    }

    return currentExpression;
}

export function inferCollectionElementType(
    expression: ts.Expression,
    checker: ts.TypeChecker
): string | undefined {
    const unwrappedExpression = unwrapExpression(expression);

    if (ts.isArrayLiteralExpression(unwrappedExpression)) {
        return inferArrayLiteralElementType(unwrappedExpression, checker);
    }

    if (ts.isCallExpression(unwrappedExpression)) {
        const eMappedElementType = inferEMappedFactoryElementType(unwrappedExpression, checker);
        if (eMappedElementType) {
            return eMappedElementType;
        }

        const namedFactoryType = inferNamedFactoryCallType(unwrappedExpression);
        if (namedFactoryType) {
            return namedFactoryType;
        }

        const factoryCallType = inferEntityTypeFromFactoryCall(unwrappedExpression, checker);
        if (factoryCallType && factoryCallType !== 'GenCards') {
            return factoryCallType;
        }

        const mappedElementType = inferMappedElementType(unwrappedExpression, checker);
        if (mappedElementType) {
            return mappedElementType;
        }

        const collectionArgumentType = inferCollectionArgumentElementType(unwrappedExpression, checker);
        if (collectionArgumentType) {
            return collectionArgumentType;
        }

        const returnType = inferCallReturnEntityType(unwrappedExpression, checker);
        if (returnType) {
            return returnType;
        }
    }

    const expressionType = checker.getTypeAtLocation(unwrappedExpression);
    return inferElementTypeFromCollectionType(expressionType, unwrappedExpression, checker);
}

export function inferEntityReferenceFromExpression(
    expression: ts.Expression,
    checker: ts.TypeChecker
): string | undefined {
    const unwrappedExpression = unwrapExpression(expression);

    if (ts.isCallExpression(unwrappedExpression)) {
        const anonymousSegType = trySerializeAnonymousSegFactoryCall(unwrappedExpression, checker);
        if (anonymousSegType) {
            return anonymousSegType;
        }

        const namedFactoryType = inferNamedFactoryCallType(unwrappedExpression);
        if (namedFactoryType) {
            return namedFactoryType;
        }

        const factoryCallType = inferEntityTypeFromFactoryCall(unwrappedExpression, checker);
        if (factoryCallType && factoryCallType !== 'GenCards') {
            return factoryCallType;
        }
    }

    const expressionType = checker.getTypeAtLocation(unwrappedExpression);
    return inferEntityReferenceFromType(expressionType, unwrappedExpression, checker);
}

export function inferNamedFactoryCallType(callExpression: ts.CallExpression): string | undefined {
    const expression = callExpression.expression;
    if (!ts.isIdentifier(expression)) {
        return undefined;
    }

    if (expression.text !== 'segFactory' && expression.text !== 'cardFactory') {
        return undefined;
    }

    const firstArgument = callExpression.arguments[0];
    if (!firstArgument || !ts.isObjectLiteralExpression(firstArgument)) {
        return undefined;
    }

    return extractTypeNameFromObjectLiteral(firstArgument);
}

export function getEArrayFactoryArrayLiteralLength(
    initializer: ts.Expression | undefined
): number | undefined {
    if (!initializer) {
        return undefined;
    }

    const unwrapped = unwrapExpression(initializer);
    if (!ts.isCallExpression(unwrapped)) {
        return undefined;
    }

    if (!ts.isIdentifier(unwrapped.expression) || unwrapped.expression.text !== 'eArrayFactory') {
        return undefined;
    }

    const firstArgument = unwrapped.arguments[0];
    if (!firstArgument || !ts.isArrayLiteralExpression(firstArgument)) {
        return undefined;
    }

    return firstArgument.elements.length;
}

export function buildEArrayTupleFromFactoryInitializer(
    initializer: ts.Expression,
    elementType: string
): string | undefined {
    const unwrapped = unwrapExpression(initializer);
    if (!ts.isCallExpression(unwrapped)) {
        return undefined;
    }

    if (!ts.isIdentifier(unwrapped.expression) || unwrapped.expression.text !== 'eArrayFactory') {
        return undefined;
    }

    const firstArgument = unwrapped.arguments[0];
    if (!firstArgument || !ts.isArrayLiteralExpression(firstArgument)) {
        return undefined;
    }

    const length = firstArgument.elements.length;
    if (length === 0) {
        return undefined;
    }

    const tupleInner = Array.from({ length }, () => elementType).join(', ');
    return `EArray<[${tupleInner}]>`;
}

export function replaceArrayElementType(
    collectionType: string,
    elementType: string
): string | undefined {
    const arrayMarker = 'Array<';
    let searchEnd = collectionType.length;

    while (searchEnd > 0) {
        const arrayStart = collectionType.lastIndexOf(arrayMarker, searchEnd - 1);
        if (arrayStart < 0) {
            return undefined;
        }

        if (arrayStart > 0 && collectionType[arrayStart - 1] === 'E') {
            searchEnd = arrayStart;
            continue;
        }

        const elementStart = arrayStart + arrayMarker.length;
        let depth = 1;

        for (let index = elementStart; index < collectionType.length; index++) {
            const currentChar = collectionType[index];
            if (currentChar === '<') {
                depth++;
            }

            if (currentChar === '>') {
                depth--;
                if (depth === 0) {
                    return collectionType.slice(0, elementStart)
                        + elementType
                        + collectionType.slice(index);
                }
            }
        }

        return undefined;
    }

    return undefined;
}

export function extractTypeNameFromObjectLiteral(objectLiteral: ts.ObjectLiteralExpression): string | undefined {
    for (const property of objectLiteral.properties) {
        if (!ts.isPropertyAssignment(property)) {
            continue;
        }

        const propertyName = getPropertyName(property.name);
        if (propertyName !== 'typeName') {
            continue;
        }

        const initializer = unwrapExpression(property.initializer);
        if (!ts.isStringLiteralLike(initializer)) {
            continue;
        }

        return initializer.text;
    }

    return undefined;
}

export function normalizeSegTypeName(typeNameValue: string | undefined): string | undefined {
    if (!typeNameValue) {
        return undefined;
    }

    try {
        return parseQuotedTypeNameLiteral(typeNameValue);
    } catch {
        return undefined;
    }
}

function inferArrayLiteralElementType(
    expression: ts.ArrayLiteralExpression,
    checker: ts.TypeChecker
): string | undefined {
    const elementTypes = expression.elements
        .map((item) => inferEntityReferenceFromExpression(item as ts.Expression, checker))
        .filter((item): item is string => !!item);

    if (elementTypes.length === 0) {
        return undefined;
    }

    return Array.from(new Set(elementTypes)).join(' | ');
}

function inferEMappedFactoryElementType(
    callExpression: ts.CallExpression,
    checker: ts.TypeChecker
): string | undefined {
    const expression = callExpression.expression;
    if (!ts.isIdentifier(expression) || expression.text !== 'eMappedFactory') {
        return undefined;
    }

    const factory = callExpression.arguments[1];
    if (!factory) {
        return undefined;
    }

    return inferMapperReturnEntityType(factory, checker);
}

function inferEMappedSourceItemsType(
    sourceArg: ts.Expression,
    checker: ts.TypeChecker
): string | undefined {
    const unwrappedSource = unwrapExpression(sourceArg);
    const sourceType = checker.getTypeAtLocation(unwrappedSource);
    const itemType = getCollectionItemType(sourceType, checker);
    if (itemType) {
        const elementName = formatEntityType(itemType, unwrappedSource, checker);
        if (elementName) {
            return `Array<${elementName}>`;
        }
    }

    if (ts.isArrayLiteralExpression(unwrappedSource)) {
        const elementName = inferArrayLiteralElementType(unwrappedSource, checker);
        if (elementName) {
            return `Array<${elementName}>`;
        }
    }

    const fallback = checker.typeToString(sourceType, unwrappedSource, FLAGS);
    if (fallback.startsWith('Array<')) {
        return fallback;
    }

    return undefined;
}

export function buildEMappedFactoryTypeString(
    expression: ts.Expression,
    checker: ts.TypeChecker
): string | undefined {
    const unwrappedExpression = unwrapExpression(expression);
    if (!ts.isCallExpression(unwrappedExpression)) {
        return undefined;
    }

    const callee = unwrappedExpression.expression;
    if (!ts.isIdentifier(callee) || callee.text !== 'eMappedFactory') {
        return undefined;
    }

    const sourceArg = unwrappedExpression.arguments[0];
    const mapperArg = unwrappedExpression.arguments[1];
    if (!sourceArg || !mapperArg) {
        return undefined;
    }

    const sourceItemsType = inferEMappedSourceItemsType(sourceArg, checker);
    const resultType = inferMapperReturnEntityType(mapperArg, checker);
    if (!sourceItemsType || !resultType) {
        return undefined;
    }

    return `EMapped<${sourceItemsType}, ${resultType}>`;
}

function inferMappedElementType(
    callExpression: ts.CallExpression,
    checker: ts.TypeChecker
): string | undefined {
    if (!ts.isPropertyAccessExpression(callExpression.expression)) {
        return undefined;
    }

    if (callExpression.expression.name.text !== 'map') {
        return undefined;
    }

    const mapper = callExpression.arguments[0];
    if (!mapper) {
        return undefined;
    }

    return inferMapperReturnEntityType(mapper, checker);
}

function inferCollectionArgumentElementType(
    callExpression: ts.CallExpression,
    checker: ts.TypeChecker
): string | undefined {
    const firstArgument = callExpression.arguments[0];
    if (!firstArgument) {
        return undefined;
    }

    return inferCollectionElementType(firstArgument, checker);
}

function inferEntityTypeFromFactoryReference(
    identifier: ts.Identifier,
    checker: ts.TypeChecker,
): string | undefined {
    const symbol = checker.getSymbolAtLocation(identifier);
    if (!symbol) {
        return undefined;
    }

    const declaration = symbol.valueDeclaration ?? symbol.declarations?.[0];
    if (!declaration || !ts.isVariableDeclaration(declaration) || !declaration.initializer) {
        return undefined;
    }

    const initializer = unwrapExpression(declaration.initializer);
    if (ts.isArrowFunction(initializer) || ts.isFunctionExpression(initializer)) {
        return inferEntityReferenceFromFunctionBody(initializer, checker);
    }

    return undefined;
}

function inferEntityTypeFromFactoryCall(
    callExpression: ts.CallExpression,
    checker: ts.TypeChecker,
): string | undefined {
    const expression = unwrapExpression(callExpression.expression);
    if (!ts.isIdentifier(expression)) {
        return undefined;
    }

    return inferEntityTypeFromFactoryReference(expression, checker);
}

function inferMapperReturnEntityType(
    mapper: ts.Expression,
    checker: ts.TypeChecker
): string | undefined {
    const unwrappedMapper = unwrapExpression(mapper);

    if (ts.isArrowFunction(unwrappedMapper) || ts.isFunctionExpression(unwrappedMapper)) {
        const entityFromBody = inferEntityReferenceFromFunctionBody(unwrappedMapper, checker);
        if (entityFromBody) {
            return entityFromBody;
        }
    }

    if (ts.isIdentifier(unwrappedMapper)) {
        const entityFromReference = inferEntityTypeFromFactoryReference(unwrappedMapper, checker);
        if (entityFromReference && entityFromReference !== 'GenCards') {
            return entityFromReference;
        }
    }

    const mapperType = checker.getTypeAtLocation(unwrappedMapper);
    const signature = mapperType.getCallSignatures()[0];
    if (!signature) {
        return undefined;
    }

    const entityFromReturnType = inferEntityReferenceFromType(signature.getReturnType(), unwrappedMapper, checker);
    if (entityFromReturnType && entityFromReturnType !== 'GenCards') {
        return entityFromReturnType;
    }

    return undefined;
}

function inferEntityReferenceFromFunctionBody(
    mapper: ts.ArrowFunction | ts.FunctionExpression,
    checker: ts.TypeChecker
): string | undefined {
    if (!ts.isBlock(mapper.body)) {
        return inferEntityReferenceFromExpression(mapper.body, checker);
    }

    for (const statement of mapper.body.statements) {
        if (ts.isReturnStatement(statement) && statement.expression) {
            const returnedEntity = inferEntityReferenceFromExpression(statement.expression, checker);
            if (returnedEntity) {
                return returnedEntity;
            }
        }
    }

    return undefined;
}

function inferCallReturnEntityType(
    callExpression: ts.CallExpression,
    checker: ts.TypeChecker
): string | undefined {
    const factoryCallType = inferEntityTypeFromFactoryCall(callExpression, checker);
    if (factoryCallType && factoryCallType !== 'GenCards') {
        return factoryCallType;
    }

    const callType = checker.getTypeAtLocation(callExpression);
    const entityFromCallType = inferElementTypeFromCollectionType(callType, callExpression, checker)
        ?? inferEntityReferenceFromType(callType, callExpression, checker);
    if (entityFromCallType && entityFromCallType !== 'GenCards') {
        return entityFromCallType;
    }

    return undefined;
}

function trySerializeAnonymousSegFactoryCall(
    callExpression: ts.CallExpression,
    checker: ts.TypeChecker
): string | undefined {
    let callee = callExpression.expression;
    callee = unwrapExpression(callee) as typeof callee;
    if (!ts.isIdentifier(callee) || callee.text !== 'segFactory') {
        return undefined;
    }

    const firstArgRaw = callExpression.arguments[0];
    if (!firstArgRaw) {
        return undefined;
    }

    const firstArg = unwrapExpression(firstArgRaw);
    if (!ts.isObjectLiteralExpression(firstArg)) {
        return undefined;
    }

    if (extractTypeNameFromObjectLiteral(firstArg)) {
        return undefined;
    }

    return buildAnonymousSegTypeString(firstArg, checker);
}

function buildAnonymousSegTypeString(
    objectLiteral: ts.ObjectLiteralExpression,
    checker: ts.TypeChecker
): string {
    const inits = buildPropertyInitializers(objectLiteral);

    const nestedInit = inits.get('nested');
    let nestedSerialized = 'never';
    if (nestedInit) {
        const propertyType = checker.getTypeAtLocation(nestedInit);
        const fallback = checker.typeToString(propertyType, undefined, FLAGS);
        const elementType = inferCollectionElementType(nestedInit, checker);
        const eArrayTupleLength = getEArrayFactoryArrayLiteralLength(nestedInit);
        const preferTupleFirst =
            elementType !== undefined &&
            eArrayTupleLength !== undefined &&
            eArrayTupleLength >= 2;
        const tupleFromLiteral =
            preferTupleFirst && elementType
                ? buildEArrayTupleFromFactoryInitializer(nestedInit, elementType)
                : undefined;
        const replaced =
            elementType ? replaceArrayElementType(fallback, elementType) : undefined;
        const tupleFallback =
            !tupleFromLiteral && elementType
                ? buildEArrayTupleFromFactoryInitializer(nestedInit, elementType)
                : undefined;
        nestedSerialized =
            tupleFromLiteral ?? replaced ?? tupleFallback ?? fallback;
    }

    const attrsInit = inits.get('attrs');
    const attrsSerialized = attrsInit
        ? checker.typeToString(checker.getTypeAtLocation(attrsInit), undefined, FLAGS)
        : 'never';

    const cardFactoriesInit = inits.get('cardFactories');
    const cardFactoriesSerialized = serializeAnonymousCardFactoriesInitializer(
        cardFactoriesInit,
        checker
    );

    return `Seg<${nestedSerialized}, string, ${attrsSerialized}, ${cardFactoriesSerialized}>`;
}

function serializeAnonymousCardFactoriesInitializer(
    initializer: ts.Expression | undefined,
    checker: ts.TypeChecker
): string {
    if (!initializer) {
        return '{}';
    }

    const unwrapped = unwrapExpression(initializer);
    if (ts.isObjectLiteralExpression(unwrapped)) {
        if (unwrapped.properties.length === 0) {
            return '{}';
        }

        const parts: string[] = [];
        for (const property of unwrapped.properties) {
            if (!ts.isPropertyAssignment(property)) {
                continue;
            }

            const key = getPropertyName(property.name);
            if (!key) {
                continue;
            }

            const value = unwrapExpression(property.initializer);
            const valueType = checker.getTypeAtLocation(value);
            const valueString = checker.typeToString(valueType, undefined, FLAGS);
            if (isBloatedMappedCardFactoriesTypeString(valueString)) {
                return '{}';
            }

            parts.push(`${key}: ${valueString}`);
        }

        return `{ ${parts.join(', ')} }`;
    }

    const fallback = checker.typeToString(checker.getTypeAtLocation(initializer), undefined, FLAGS);
    if (isBloatedMappedCardFactoriesTypeString(fallback)) {
        return '{}';
    }

    return fallback;
}

function isBloatedMappedCardFactoriesTypeString(typeString: string): boolean {
    return typeString.includes('GroupSeg?:');
}

function inferElementTypeFromCollectionType(
    type: ts.Type,
    node: ts.Node,
    checker: ts.TypeChecker
): string | undefined {
    const collectionItemType = getCollectionItemType(type, checker);
    if (!collectionItemType) {
        return undefined;
    }

    return formatEntityType(collectionItemType, node, checker);
}

function inferEntityReferenceFromType(
    type: ts.Type,
    node: ts.Node,
    checker: ts.TypeChecker
): string | undefined {
    return formatEntityType(type, node, checker);
}

function formatEntityType(
    type: ts.Type,
    node: ts.Node,
    checker: ts.TypeChecker
): string | undefined {
    if (type.isUnion()) {
        const parts = type.types
            .map((item) => formatEntityType(item, node, checker))
            .filter((item): item is string => !!item);

        if (parts.length === 0) {
            return undefined;
        }

        return Array.from(new Set(parts)).join(' | ');
    }

    const namedEntityType = extractNamedEntityType(type, node, checker);
    if (namedEntityType) {
        return namedEntityType;
    }

    const fallback = checker.typeToString(type, undefined, FLAGS);
    return fallback === 'ISeg' || fallback === 'ICard' ? undefined : fallback;
}

function extractNamedEntityType(
    type: ts.Type,
    node: ts.Node,
    checker: ts.TypeChecker
): string | undefined {
    const typeNameProperty = checker.getPropertyOfType(type, 'typeName');
    if (!typeNameProperty) {
        return undefined;
    }

    const typeNameType = checker.getTypeOfSymbolAtLocation(typeNameProperty, node);
    const literalTypeName = extractStringLiteralValue(typeNameType);
    return literalTypeName ?? undefined;
}

function extractStringLiteralValue(type: ts.Type): string | undefined {
    if (type.isStringLiteral()) {
        return type.value;
    }

    if (!type.isUnion()) {
        return undefined;
    }

    const literalValues = Array.from(new Set(
        type.types
            .filter((item): item is ts.StringLiteralType => item.isStringLiteral())
            .map((item) => item.value)
    ));

    return literalValues.length === 1 ? literalValues[0] : undefined;
}

function getCollectionItemType(
    type: ts.Type,
    checker: ts.TypeChecker
): ts.Type | undefined {
    const typeArguments = getTypeArguments(type, checker);
    if (typeArguments.length === 0) {
        return undefined;
    }

    return getArrayElementType(typeArguments[0], checker);
}

function getArrayElementType(
    type: ts.Type,
    checker: ts.TypeChecker
): ts.Type | undefined {
    if (checker.isArrayType(type) || checker.isTupleType(type)) {
        const arrayTypeArguments = getTypeArguments(type, checker);
        return arrayTypeArguments[0];
    }

    return undefined;
}

function getTypeArguments(type: ts.Type, checker: ts.TypeChecker): readonly ts.Type[] {
    if (!(type.flags & ts.TypeFlags.Object)) {
        return [];
    }

    const objectType = type as ts.ObjectType;
    if (!(objectType.objectFlags & ts.ObjectFlags.Reference)) {
        return [];
    }

    return checker.getTypeArguments(objectType as ts.TypeReference);
}

function buildPropertyInitializers(firstArg: ts.Expression): Map<string, ts.Expression> {
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

function getPropertyName(name: ts.PropertyName): string | undefined {
    if (ts.isIdentifier(name) || ts.isStringLiteral(name) || ts.isNumericLiteral(name)) {
        return name.text;
    }

    return undefined;
}
