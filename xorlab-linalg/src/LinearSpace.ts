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

/**
 * Algebraic product and sum over card attrs for matrix operations.
 */
export interface LinearSpace<First, Second, Product> {
    product(first: First, second: Second): Product;
    sum(first: Product, second: Product): Product;
    getZero(): Product;
}

/** Numeric cell attrs used by the default ScalarLinearSpace. */
export interface Scalar {
    readonly value: number;
    get(): number;
}

export interface ScalarLinearSpace extends LinearSpace<Scalar, Scalar, Scalar> {}

export function scalar(value: number): Scalar {
    return {
        value,
        get() {
            return value;
        },
    };
}

export const scalarLinearSpace: ScalarLinearSpace = {
    product(first, second) {
        return scalar(first.value * second.value);
    },
    sum(first, second) {
        return scalar(first.value + second.value);
    },
    getZero() {
        return scalar(0);
    },
};
