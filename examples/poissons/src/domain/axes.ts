import {
  cardFactory,
  eArrayFactory,
  eMappedFactory,
  segFactory,
  textRendererFactory,
} from "xorlab";
import type { Ingredient, Month, Poisson } from "./data";

export function labelPlaceSegFactory() {
  return segFactory({
    typeName: "LabelPlaceSeg",
  });
}

export function createPoissonListSeg(items: Poisson[]) {
  const collection = eArrayFactory(items);
  return segFactory({
    typeName: "PoissonListSeg",
    nested: eMappedFactory(collection, (poisson) =>
      segFactory({
        typeName: "PoissonSeg",
        attrs: poisson,
        cardFactories: {
          LabelPlaceSeg: (_, self) =>
            cardFactory({
              typeName: "PoissonHeaderCard",
              renderer: textRendererFactory(() => self.attrs.name),
            }),
        },
      })
    ),
  });
}

export function createIngredientListSeg(items: Ingredient[]) {
  const collection = eArrayFactory(items);
  return segFactory({
    typeName: "IngredientListSeg",
    nested: eMappedFactory(collection, (ingredient) =>
      segFactory({
        typeName: "IngredientSeg",
        attrs: ingredient,
        cardFactories: {
          LabelPlaceSeg: (_, self) =>
            cardFactory({
              typeName: "IngredientHeaderCard",
              renderer: textRendererFactory(() => self.attrs.name),
            }),
        },
      })
    ),
  });
}

export function createMonthListSeg(items: Month[]) {
  const collection = eArrayFactory(items);
  return segFactory({
    typeName: "MonthListSeg",
    nested: eMappedFactory(collection, (month) =>
      segFactory({
        typeName: "MonthSeg",
        attrs: month,
        cardFactories: {
          LabelPlaceSeg: (_, self) =>
            cardFactory({
              typeName: "MonthHeaderCard",
              renderer: textRendererFactory(() => self.attrs.name),
            }),
        },
      })
    ),
  });
}
