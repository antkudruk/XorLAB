import { cardFactory, eArrayFactory, eMappedFactory } from "xorlab";

export interface ChemicalElement {
    readonly symbol: string;
}

export const elementCollection = eArrayFactory<ChemicalElement[]>([
    { symbol: "H" },
]);

export const elementListCardFactory = () => cardFactory({
    typeName: "ElementListCard",
    nested: eMappedFactory(elementCollection, (element) =>
        cardFactory({
            typeName: "ElementCard",
            attrs: element,
        })
    ),
});
