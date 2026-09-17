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
import * as path from 'path';
import { PreprocessorOptions } from './preprocessor';

export interface ImportInfo {
    readonly typeName: string;
    readonly modulePath: string;
    readonly isNodeModules: boolean;
}

export function getTypeImports(
    type: ts.Type,
    typeRootPath: string,
    options?: PreprocessorOptions
): ImportInfo[] {
    const imports: ImportInfo[] = [];
    const visitedTypes = new Set<ts.Type>();

    function processType(currentType: ts.Type) {
        if (visitedTypes.has(currentType)) {
            return;
        }
        visitedTypes.add(currentType);

        // Skip synthetic/internal TypeScript types
        if (isSyntheticType(currentType)) {
            return;
        }

        // Handle union and intersection types
        if (currentType.isUnionOrIntersection()) {
            const types = (currentType as ts.UnionOrIntersectionType).types;
            types.forEach(t => processType(t));
            return;
        }

        // Handle type references (classes, interfaces, type aliases)
        if (currentType.isClassOrInterface() || (currentType.getFlags() & ts.TypeFlags.Object)) {
            const symbol = currentType.getSymbol();
            if (symbol) {
                processSymbol(symbol);
            }
        }

        // Handle type parameters
        if (currentType.getFlags() & ts.TypeFlags.TypeParameter) {
            const constraint = (currentType as ts.TypeParameter).getConstraint();
            if (constraint) {
                processType(constraint);
            }
        }

        // Handle array types and type references with type arguments
        if (currentType.getFlags() & ts.TypeFlags.Object && 
            (currentType as ts.ObjectType).objectFlags & ts.ObjectFlags.Reference) {
            const typeReference = currentType as ts.TypeReference;
            if (typeReference.target && typeReference.target !== typeReference) {
                processType(typeReference.target);
            }
            
            // Process type arguments
            const typeArguments = typeReference.typeArguments;
            if (typeArguments) {
                typeArguments.forEach(arg => processType(arg));
            }
        }

        // Handle mapped types, conditional types, etc.
        try {
            const aliasTypeArguments = (currentType as any).aliasTypeArguments;
            if (aliasTypeArguments && Array.isArray(aliasTypeArguments)) {
                aliasTypeArguments.forEach((arg: ts.Type) => {
                    if (arg) processType(arg);
                });
            }
        } catch (e) {
            // Ignore if aliasTypeArguments doesn't exist
        }
    }

    function processSymbol(symbol: ts.Symbol) {
        // Skip built-in types and primitives
        if (isBuiltInType(symbol)) {
            return;
        }

        // Skip synthetic symbols (like __object, __type, etc.)
        if (isSyntheticSymbol(symbol)) {
            return;
        }

        const declarations = symbol.getDeclarations();
        if (!declarations || declarations.length === 0) {
            return;
        }

        const declaration = declarations[0];
        const declarationFile = declaration.getSourceFile();
        
        // Skip if declaration is in a synthetic or internal file
        if (isSyntheticFile(declarationFile)) {
            return;
        }

        // Determine if this is from node_modules (moved up)
        const isNodeModules = isFromNodeModules(declarationFile.fileName, typeRootPath);

        // Get module specifier and type name
        const moduleSpecifier = getModuleSpecifier(declarationFile, typeRootPath, isNodeModules, options);
        const typeName = symbol.getName();
        
        // Skip if we couldn't determine a valid module specifier
        if (!isValidModuleSpecifier(moduleSpecifier)) {
            return;
        }

        // Avoid duplicates
        const existingImport = imports.find(imp => 
            imp.typeName === typeName && imp.modulePath === moduleSpecifier
        );
        
        if (!existingImport) {
            imports.push({
                typeName,
                modulePath: moduleSpecifier,
                isNodeModules,
            });
        }
    }

    function isFromNodeModules(filePath: string, projectRootPath: string): boolean {
        const normalizedPath = path.normalize(filePath);
        
        if (projectRootPath) {
            // If we know the project root, we can be more precise
            const relativePath = path.relative(projectRootPath, normalizedPath);
            
            // Check if the relative path starts with node_modules
            // This ensures we only catch the top-level node_modules
            return relativePath.startsWith('node_modules/') || 
                   relativePath.split(path.sep)[0] === 'node_modules';
        }
        
        return false;
    }


    

    function isSyntheticType(type: ts.Type): boolean {
        // Check for synthetic types like __object, __type, etc.
        const symbol = type.getSymbol();
        if (symbol && symbol.getName().startsWith('__')) {
            return true;
        }
        
        // Check for anonymous object types
        if ((type.getFlags() & ts.TypeFlags.Object) && 
            !type.getSymbol() && 
            !(type as ts.ObjectType).objectFlags) {
            return true;
        }
        
        return false;
    }

    function isSyntheticSymbol(symbol: ts.Symbol): boolean {
        // Skip symbols with names starting with __ (internal compiler symbols)
        return symbol.getName().startsWith('__');
    }

    function isSyntheticFile(file: ts.SourceFile): boolean {
        // Check for synthetic/in-memory files
        return file.fileName.includes('/*internal*/') || 
               file.fileName.startsWith('^') ||
               file.fileName.includes('in-memory://');
    }

    function isBuiltInType(symbol: ts.Symbol): boolean {
        const declaration = symbol.getDeclarations()?.[0];
        if (!declaration) return false;
        
        const fileName = declaration.getSourceFile().fileName;
        // Check for TypeScript lib files and built-in types
        return fileName.includes('lib.') || 
               (fileName.endsWith('.d.ts') && fileName.includes('typescript/lib')) ||
               (fileName.includes('/lib/') && !fileName.includes('node_modules')) ||
               fileName.includes('/lib.d.') ||
               fileName.includes('/lib.es');
    }

    function isValidModuleSpecifier(moduleSpecifier: string): boolean {
        // Skip invalid or internal module specifiers
        return !moduleSpecifier.startsWith('__') && 
               moduleSpecifier !== '' && 
               !moduleSpecifier.includes('/*internal*/') &&
               moduleSpecifier !== '.';
    }

    function getModuleSpecifier(
        declarationFile: ts.SourceFile, 
        rootPath: string,
        isNodeModules: boolean,
        options?: PreprocessorOptions
    ): string {
        const declarationPath = declarationFile.fileName;

        // Skip synthetic files
        if (isSyntheticFile(declarationFile)) {
            return '';
        }

        if (isNodeModules) {
            // Extract package name from node_modules path
            const normalizedPath = path.normalize(declarationPath);
            const pathSegments = normalizedPath.split(path.sep);
            
            // Find the node_modules segment and get the next segment (package name)
            const nodeModulesIndex = pathSegments.indexOf('node_modules');
            if (nodeModulesIndex !== -1 && nodeModulesIndex < pathSegments.length - 1) {
                const packageName = pathSegments[nodeModulesIndex + 1];
                
                // Handle scoped packages (@scope/package)
                if (packageName.startsWith('@') && nodeModulesIndex < pathSegments.length - 2) {
                    return `${packageName}/${pathSegments[nodeModulesIndex + 2]}`;
                }
                
                return packageName;
            }
            return declarationPath;
        }

        // For project files, return relative path from project root
        const relativePath = path.relative(rootPath, declarationPath);

        // Special handling for local build output of the `xorlab` package:
        // by default we want generated projects to import from the package name
        // (`from "xorlab"`) rather than from a relative path into a workspace
        // sibling like `../../xorlab/dist/...`.
        const normalizedRelative = relativePath.split(path.sep).join('/');
        const xorlabImportsMode = options?.xorlabImportsMode ?? 'package';
        const isXorlabDistPath = /(^|\/)xorlab\/dist\//.test(normalizedRelative);
        if (xorlabImportsMode === 'package' && isXorlabDistPath) {
            return 'xorlab';
        }

        const cleanPath = relativePath.replace(/^\.\/|^\.\\/, '');
        return cleanPath;
    }
    // Start processing the root type
    processType(type);

    return imports;
}