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
import { ImportInfo } from './import_utils';
import { PreprocessorOptions } from './preprocessor';
import { visitNode } from './ast/usage_scanner';

export interface MethodUsageInfo {
    readonly filePath: string;
    readonly lineNumber: number;
    readonly argumentTypes: Record<string, string>;
    readonly imports: ImportInfo[];
}

export function findMethodUsages(
    projectRoot: string,
    methodName: string,
    options?: PreprocessorOptions
): MethodUsageInfo[] {
    const usages: MethodUsageInfo[] = [];
    const configPath = ts.findConfigFile(projectRoot, ts.sys.fileExists, 'tsconfig.json');

    if (!configPath) {
        throw new Error('Could not find tsconfig.json');
    }

    const configFile = ts.readConfigFile(configPath, ts.sys.readFile);
    const compilerOptions = ts.parseJsonConfigFileContent(
        configFile.config,
        ts.sys,
        path.dirname(configPath)
    );

    const program = ts.createProgram(compilerOptions.fileNames, compilerOptions.options);
    const checker = program.getTypeChecker();

    for (const sourceFile of program.getSourceFiles()) {
        if (sourceFile.isDeclarationFile) {
            continue;
        }

        ts.forEachChild(sourceFile, (node) => {
            visitNode(node, sourceFile, methodName, usages, checker, projectRoot, options);
        });
    }

    return usages;
}