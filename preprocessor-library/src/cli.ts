#!/usr/bin/env node
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

import { run } from './preprocessor';

type XorlabImportsMode = 'package' | 'relative';

export function parseXorlabImportsMode(argv: string[]): XorlabImportsMode {
  const prefix = '--xorlab-imports=';
  const arg = argv.find((a) => a.startsWith(prefix));
  if (!arg) {
    return 'package';
  }
  const value = arg.slice(prefix.length);
  if (value === 'package' || value === 'relative') {
    return value;
  }
  throw new Error(`Invalid --xorlab-imports value: ${value}`);
}

// Run when invoked from CLI
if (require.main === module) {
  run({
    xorlabImportsMode: parseXorlabImportsMode(process.argv),
  }).catch((error: unknown) => {
    if (error instanceof Error && error.message.startsWith('xorlab-preprocessor:')) {
      console.error(error.message);
    } else {
      console.error(error);
    }
    process.exit(1);
  });
}
