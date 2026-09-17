import {
  cardFactory,
  eArrayFactory,
  eMappedFactory,
  textRendererFactory,
} from "xorlab";
import { scalar, type Scalar } from "xorlab-linalg";
import type { PriceEntry, RecipeEntry, RequestedEntry } from "./data";

function qtyRenderer(attrs: Scalar) {
  return textRendererFactory(() => String(attrs.value));
}

export function createRequestedMatrixCard(entries: RequestedEntry[]) {
  const collection = eArrayFactory(entries);
  return cardFactory({
    typeName: "RequestedListCard",
    nested: eMappedFactory(collection, (entry) => {
      const attrs = scalar(entry.value);
      return cardFactory({
        typeName: "RequestedCellCard",
        attrs,
        selfPos: {
          PoissonListSeg: (place) =>
            place.nested.find((seg) => seg.attrs.id === entry.poissonId),
          MonthListSeg: (place) =>
            place.nested.find((seg) => seg.attrs.id === entry.monthId),
        },
        renderer: qtyRenderer(attrs),
      });
    }),
  });
}

export function createRecipeMatrixCard(entries: RecipeEntry[]) {
  const collection = eArrayFactory(entries);
  return cardFactory({
    typeName: "RecipeListCard",
    nested: eMappedFactory(collection, (entry) => {
      const attrs = scalar(entry.value);
      return cardFactory({
        typeName: "RecipeCellCard",
        attrs,
        selfPos: {
          PoissonListSeg: (place) =>
            place.nested.find((seg) => seg.attrs.id === entry.poissonId),
          IngredientListSeg: (place) =>
            place.nested.find((seg) => seg.attrs.id === entry.ingredientId),
        },
        renderer: qtyRenderer(attrs),
      });
    }),
  });
}

export function createPriceMatrixCard(entries: PriceEntry[]) {
  const collection = eArrayFactory(entries);
  return cardFactory({
    typeName: "PriceListCard",
    nested: eMappedFactory(collection, (entry) => {
      const attrs = scalar(entry.value);
      return cardFactory({
        typeName: "PriceCellCard",
        attrs,
        selfPos: {
          IngredientListSeg: (place) =>
            place.nested.find((seg) => seg.attrs.id === entry.ingredientId),
          MonthListSeg: (place) =>
            place.nested.find((seg) => seg.attrs.id === entry.monthId),
        },
        renderer: qtyRenderer(attrs),
      });
    }),
  });
}
