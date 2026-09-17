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

import { EMapped } from "../../collection/EMapped";
import type { ISeg } from "../../facade/line";
import type { ICard } from "../../facade/card";
import {
    ChildPosersMapFromSchema,
} from "./ChildPos";

export interface ChildPosStrategy {
    resolve(
        place: ISeg,
        child: ICard,
        parent: ICard,
    ): ISeg | null | undefined;
}

export class ChildPosMapStrategy implements ChildPosStrategy {
    constructor(
        private readonly childPosers: ChildPosersMapFromSchema<{ [name: string]: ISeg }>,
    ) {}

    resolve(
        place: ISeg,
        child: ICard,
        parent: ICard,
    ): ISeg | null | undefined {
        const handler = this.childPosers[place.typeName];
        if (!handler) {
            return undefined;
        }

        return handler(place, child, parent);
    }
}

export class MappedNestedChildPosStrategy implements ChildPosStrategy {
    constructor(private readonly mappedNested: EMapped<unknown, ICard>) {}

    resolve(
        place: ISeg,
        child: ICard,
        parent: ICard,
    ): ISeg | null | undefined {
        if (parent.nested !== this.mappedNested) {
            return undefined;
        }

        const source = this.mappedNested.source;
        if (!source || place.nested !== source) {
            return undefined;
        }

        const index = this.mappedNested.indexOf(child);
        if (index < 0) {
            return undefined;
        }

        return place.nested.at(index) ?? undefined;
    }
}

function resolveWithStrategies(
    strategies: ChildPosStrategy[],
    place: ISeg,
    child: ICard,
    parent: ICard,
): ISeg | null {
    for (const strategy of strategies) {
        const result = strategy.resolve(place, child, parent);
        if (result !== undefined) {
            return result;
        }
    }

    return child.resolveSelfPosition(place);
}

export interface CardChildPosResolver {
    resolve(place: ISeg, child: ICard, parent: ICard): ISeg | null;
}

function buildCardChildPosResolver(strategies: ChildPosStrategy[]): CardChildPosResolver {
    return {
        resolve(place, child, parent) {
            return resolveWithStrategies(strategies, place, child, parent);
        },
    };
}

function mapStrategiesFromExplicitChildPos(
    explicitChildPos?: ChildPosersMapFromSchema<{ [name: string]: ISeg }>,
): ChildPosStrategy[] {
    if (!explicitChildPos || Object.keys(explicitChildPos).length === 0) {
        return [];
    }

    return [new ChildPosMapStrategy(explicitChildPos)];
}

export function createCardChildPos(
    explicitChildPos?: ChildPosersMapFromSchema<{ [name: string]: ISeg }>,
): CardChildPosResolver {
    return buildCardChildPosResolver(mapStrategiesFromExplicitChildPos(explicitChildPos));
}

export function createMappedCardChildPos<S>(
    mappedNested: EMapped<S, ICard>,
    explicitChildPos?: ChildPosersMapFromSchema<{ [name: string]: ISeg }>,
): CardChildPosResolver {
    return buildCardChildPosResolver([
        ...mapStrategiesFromExplicitChildPos(explicitChildPos),
        new MappedNestedChildPosStrategy(mappedNested),
    ]);
}
