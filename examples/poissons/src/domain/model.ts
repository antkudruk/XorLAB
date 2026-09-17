import {
  cardFactory,
  eArrayFactory,
  segFactory,
  textRendererFactory,
} from "xorlab";
import {
  matrixProductCardFactory,
  sumUpCardFactory,
  zippedProductCardFactory,
} from "xorlab-linalg";
import {
  createIngredientListSeg,
  createMonthListSeg,
  createPoissonListSeg,
} from "./axes";
import {
  ingredients,
  months,
  poissons,
  priceEntries,
  recipeEntries,
  requestedEntries,
} from "./data";
import {
  costHeaders,
  costIngHeaders,
  costMonthHeaders,
  ingMonthHeaders,
  priceHeaders,
  recipeHeaders,
  requestedHeaders,
} from "./headers";
import {
  createPriceMatrixCard,
  createRecipeMatrixCard,
  createRequestedMatrixCard,
} from "./matrices";
import {
  costIngredientWidgetCardFactory,
  costMonthWidgetCardFactory,
  costWidgetCardFactory,
  ingredientsMonthWidgetCardFactory,
  priceWidgetCardFactory,
  recipeWidgetCardFactory,
  requestedWidgetCardFactory,
} from "./widgetCards";

function createUnitColumnListSeg() {
  const unit = segFactory({
    typeName: "UnitColumnSeg",
    attrs: { label: "Total" },
    cardFactories: {
      LabelPlaceSeg: (_, self) =>
        cardFactory({
          typeName: "UnitHeaderCard",
          renderer: textRendererFactory(() => String(self.attrs.label)),
        }),
    },
  });
  return segFactory({
    typeName: "UnitColumnListSeg",
    nested: eArrayFactory([unit]),
  });
}

function createUnitRowListSeg() {
  const unit = segFactory({
    typeName: "UnitRowSeg",
    attrs: { label: "Total" },
    cardFactories: {
      LabelPlaceSeg: (_, self) =>
        cardFactory({
          typeName: "UnitRowHeaderCard",
          renderer: textRendererFactory(() => String(self.attrs.label)),
        }),
    },
  });
  return segFactory({
    typeName: "UnitRowListSeg",
    nested: eArrayFactory([unit]),
  });
}

export interface RequestedLayout {
  rowsHeaderSeg: GenSegTypes.RequestedRowsHeaderSeg;
  columnsHeaderSeg: GenSegTypes.RequestedColumnsHeaderSeg;
  widgetCard: GenCardTypes.RequestedWidgetCard;
}

export interface RecipeLayout {
  rowsHeaderSeg: GenSegTypes.RecipeRowsHeaderSeg;
  columnsHeaderSeg: GenSegTypes.RecipeColumnsHeaderSeg;
  widgetCard: GenCardTypes.RecipeWidgetCard;
}

export interface IngredientsMonthLayout {
  rowsHeaderSeg: GenSegTypes.IngMonthRowsHeaderSeg;
  columnsHeaderSeg: GenSegTypes.IngMonthColumnsHeaderSeg;
  widgetCard: GenCardTypes.IngredientsMonthWidgetCard;
}

export interface PriceLayout {
  rowsHeaderSeg: GenSegTypes.PriceRowsHeaderSeg;
  columnsHeaderSeg: GenSegTypes.PriceColumnsHeaderSeg;
  widgetCard: GenCardTypes.PriceWidgetCard;
}

export interface CostLayout {
  rowsHeaderSeg: GenSegTypes.CostRowsHeaderSeg;
  columnsHeaderSeg: GenSegTypes.CostColumnsHeaderSeg;
  widgetCard: GenCardTypes.CostWidgetCard;
}

export interface CostIngredientLayout {
  rowsHeaderSeg: GenSegTypes.CostIngRowsHeaderSeg;
  columnsHeaderSeg: GenSegTypes.CostIngColumnsHeaderSeg;
  widgetCard: GenCardTypes.CostIngredientWidgetCard;
}

export interface CostMonthLayout {
  rowsHeaderSeg: GenSegTypes.CostMonthRowsHeaderSeg;
  columnsHeaderSeg: GenSegTypes.CostMonthColumnsHeaderSeg;
  widgetCard: GenCardTypes.CostMonthWidgetCard;
}

export interface PoissonsModel {
  requested: RequestedLayout;
  recipe: RecipeLayout;
  ingredientsMonth: IngredientsMonthLayout;
  prices: PriceLayout;
  costs: CostLayout;
  costIngredient: CostIngredientLayout;
  costMonth: CostMonthLayout;
}

export function createPoissonsModel(): PoissonsModel {
  const requestedCard = createRequestedMatrixCard(requestedEntries);
  const recipeCard = createRecipeMatrixCard(recipeEntries);
  const priceCard = createPriceMatrixCard(priceEntries);

  const ingredientsPerMonthCard = matrixProductCardFactory({
    first: requestedCard,
    second: recipeCard,
    sumAxisPlace: "PoissonSeg",
    axisPlaces: ["MonthSeg", "IngredientSeg"],
    resultCardFactory: (result) =>
      cardFactory({
        typeName: "IngredientMonthQtyCard",
        attrs: result,
        renderer: textRendererFactory(() => String(result.value)),
      }),
  });

  const costsCard = zippedProductCardFactory({
    first: ingredientsPerMonthCard,
    second: priceCard,
    axisPlaces: ["IngredientSeg", "MonthSeg"],
    resultCardFactory: (result) =>
      cardFactory({
        typeName: "CostCellCard",
        attrs: result,
        renderer: textRendererFactory(() => String(result.value)),
      }),
  });

  const costPerIngredientCard = sumUpCardFactory({
    source: costsCard,
    sumAxisPlace: "MonthSeg",
    keepAxisPlace: "IngredientSeg",
    resultCardFactory: (result) =>
      cardFactory({
        typeName: "CostIngredientCard",
        attrs: result,
        renderer: textRendererFactory(() => String(result.value)),
      }),
  });

  const costPerMonthCard = sumUpCardFactory({
    source: costsCard,
    sumAxisPlace: "IngredientSeg",
    keepAxisPlace: "MonthSeg",
    resultCardFactory: (result) =>
      cardFactory({
        typeName: "CostMonthCard",
        attrs: result,
        renderer: textRendererFactory(() => String(result.value)),
      }),
  });

  const displayPoisson = () => createPoissonListSeg(poissons);
  const displayIngredient = () => createIngredientListSeg(ingredients);
  const displayMonth = () => createMonthListSeg(months);

  return {
    requested: {
      ...requestedHeaders(displayPoisson(), displayMonth()),
      widgetCard: requestedWidgetCardFactory(requestedCard),
    },
    recipe: {
      ...recipeHeaders(displayPoisson(), displayIngredient()),
      widgetCard: recipeWidgetCardFactory(recipeCard),
    },
    ingredientsMonth: {
      ...ingMonthHeaders(displayMonth(), displayIngredient()),
      widgetCard: ingredientsMonthWidgetCardFactory(ingredientsPerMonthCard),
    },
    prices: {
      ...priceHeaders(displayIngredient(), displayMonth()),
      widgetCard: priceWidgetCardFactory(priceCard),
    },
    costs: {
      ...costHeaders(
        displayIngredient(),
        createUnitRowListSeg(),
        displayMonth(),
        createUnitColumnListSeg(),
      ),
      widgetCard: costWidgetCardFactory(
        costsCard,
        costPerIngredientCard,
        costPerMonthCard,
      ),
    },
    costIngredient: {
      ...costIngHeaders(displayIngredient(), createUnitColumnListSeg()),
      widgetCard: costIngredientWidgetCardFactory(costPerIngredientCard),
    },
    costMonth: {
      ...costMonthHeaders(displayMonth(), createUnitColumnListSeg()),
      widgetCard: costMonthWidgetCardFactory(costPerMonthCard),
    },
  };
}
