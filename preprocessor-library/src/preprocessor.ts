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

import * as fs from 'fs';
import * as path from 'path';
import { generateFileContent } from './seggenerator';
import { findMethodUsages } from './method_finder';
import { generateCardFileContent } from './card_generator';
import { validate } from './validate';
import { validateCrossKindTypeNames } from './validate_cross';

export type XorlabImportsMode = 'package' | 'relative';

export interface PreprocessorOptions {
    readonly xorlabImportsMode?: XorlabImportsMode;
    readonly verbose?: boolean;
}

const DEFAULT_OPTIONS: Required<PreprocessorOptions> = {
    xorlabImportsMode: 'package',
    verbose: false,
};

type PrettierModule = typeof import('prettier');
const loadPrettier = new Function("return import('prettier');") as () => Promise<PrettierModule>;

export function withDefaults(options?: PreprocessorOptions): Required<PreprocessorOptions> {
    return { ...DEFAULT_OPTIONS, ...(options ?? {}) };
}

async function formatGeneratedDeclaration(content: string, filePath: string): Promise<string> {
    const prettier = await loadPrettier();
    return prettier.format(content, {
        parser: 'typescript',
        filepath: path.resolve(filePath),
    });
}

function ensureGeneratedDirectoryExists() {
    if (!fs.existsSync('generated')) {
        fs.mkdirSync('generated', { recursive: true });
    }
}

async function writeGeneratedFile(filePath: string, content: string) {
    ensureGeneratedDirectoryExists();
    const formattedContent = await formatGeneratedDeclaration(content, filePath);
    const previousContent = fs.existsSync(filePath)
        ? fs.readFileSync(filePath, 'utf-8')
        : undefined;
    fs.writeFileSync(filePath, formattedContent, 'utf-8');
    return previousContent !== formattedContent;
}

type FactoryMethod = 'segFactory' | 'cardFactory';

interface PipelineArtifacts {
    readonly lines: string;
    readonly cards: string;
}

function getOutputFilePath(factoryMethod: FactoryMethod): string {
    return path.join(
        'generated',
        factoryMethod === 'segFactory' ? 'generated-lines.d.ts' : 'generated-cards.d.ts'
    );
}

function validateAll(
    projectRoot: string,
    options: Required<PreprocessorOptions>,
): void {
    const segUsages = findMethodUsages(projectRoot, 'segFactory', options);
    const cardUsages = findMethodUsages(projectRoot, 'cardFactory', options);
    const segValidation = validate(segUsages);
    const cardValidation = validate(cardUsages);
    const crossErrors = validateCrossKindTypeNames(segUsages, cardUsages);
    const errors = [
        ...segValidation.errors,
        ...cardValidation.errors,
        ...crossErrors,
    ];
    if (errors.length > 0) {
        const header =
            'xorlab-preprocessor: validation failed, so nothing was written to generated/.';
        throw new Error(`${header}\n\n${errors.join('\n\n')}`);
    }
}

function generateOutput(factoryMethod: FactoryMethod, projectRoot: string, options: Required<PreprocessorOptions>): string {
    const usages = findMethodUsages(projectRoot, factoryMethod, options);
    const validation = validate(usages);
    if (!validation.isValid) {
        const header =
            'xorlab-preprocessor: validation failed, so nothing was written to generated/.';
        const detail = validation.errors.join('\n\n');
        throw new Error(`${header}\n\n${detail}`);
    }

    return factoryMethod === 'segFactory'
        ? generateFileContent(usages)
        : generateCardFileContent(usages);
}

async function writeFactoryOutput(factoryMethod: FactoryMethod, content: string): Promise<boolean> {
    return writeGeneratedFile(getOutputFilePath(factoryMethod), content);
}

const MAX_CARD_GENERATION_PASSES = 5;
const MAX_SEG_GENERATION_PASSES = 5;

async function generateCardsUntilStable(
    projectRoot: string,
    options: Required<PreprocessorOptions>,
): Promise<string> {
    let content = generateOutput('cardFactory', projectRoot, options);
    let changed = await writeFactoryOutput('cardFactory', content);
    let passCount = 1;

    while (changed && passCount < MAX_CARD_GENERATION_PASSES) {
        content = generateOutput('cardFactory', projectRoot, options);
        changed = await writeFactoryOutput('cardFactory', content);
        passCount++;
    }

    return content;
}

async function generateSegsUntilStable(
    projectRoot: string,
    options: Required<PreprocessorOptions>,
): Promise<string> {
    let content = generateOutput('segFactory', projectRoot, options);
    let changed = await writeFactoryOutput('segFactory', content);
    let passCount = 1;

    while (changed && passCount < MAX_SEG_GENERATION_PASSES) {
        content = generateOutput('segFactory', projectRoot, options);
        changed = await writeFactoryOutput('segFactory', content);
        passCount++;
    }

    return content;
}

export function runPipeline(projectRoot: string, options?: PreprocessorOptions): PipelineArtifacts {
    const resolvedOptions = withDefaults(options);
    const lines = generateOutput('segFactory', projectRoot, resolvedOptions);
    const cards = generateOutput('cardFactory', projectRoot, resolvedOptions);
    return { lines, cards };
}

export async function run(options?: PreprocessorOptions) {
    const resolvedOptions = withDefaults(options);
    const projectRoot = process.cwd();
    validateAll(projectRoot, resolvedOptions);
    await generateCardsUntilStable(projectRoot, resolvedOptions);
    await generateSegsUntilStable(projectRoot, resolvedOptions);
}