import { cardFactory, eArrayFactory, eMappedFactory } from "xorlab";
import { ChemicalElement } from "./types";

function categoryModifier(category: string): string {
  return `ElementCard--${category.toLowerCase().replace(/\s+/g, "-")}`;
}

export function createElementListCard(elements: ChemicalElement[]) {
  const elementCollection = eArrayFactory<ChemicalElement[]>(elements);

  return cardFactory({
    typeName: "ElementListCard",
    nested: eMappedFactory(elementCollection, (element) =>
      cardFactory({
        typeName: "ElementCard",
        attrs: element,
        selfPos: {
          PeriodListSeg: (place) =>
            place.nested.find(
              (periodSeg) => periodSeg.attrs.period === element.period
            ),
          GroupListSeg: (place) =>
            place.nested.find(
              (groupSeg) => groupSeg.attrs.group === element.group
            ),
        },
        renderer: {
          updateCardHtmlelement(_card, cardElement) {
            cardElement.replaceChildren();

            const atomicNumber = document.createElement("span");
            atomicNumber.className = "ElementCard-atomicNumber";
            atomicNumber.textContent = String(element.atomicNumber);

            const symbol = document.createElement("span");
            symbol.className = "ElementCard-symbol";
            symbol.textContent = element.symbol;

            cardElement.append(atomicNumber, symbol);
            cardElement.classList.add(categoryModifier(element.category));
            cardElement.title = `${element.name} (${element.symbol})`;
          },
        },
      })
    ),
  });
}
