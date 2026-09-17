import {
  cardFactory,
  eArrayFactory,
  tableFactory,
  type ICard,
} from "xorlab";

export function requestedWidgetCardFactory(dataListCard: ICard) {
  return cardFactory({
    typeName: "RequestedWidgetCard",
    nested: eArrayFactory([
      cardFactory({
        nested: eArrayFactory([dataListCard]),
        selfPos: {
          RequestedRowsHeaderSeg: (place) =>
            place.nested.getItemByType("PoissonListSeg"),
          RequestedColumnsHeaderSeg: (place) =>
            place.nested.getItemByType("MonthListSeg"),
        },
      }),
      tableFactory({
        mainLine: "MonthListSeg",
        orthoLine: "LabelPlaceSeg",
        selfPos: {
          RequestedRowsHeaderSeg: (place) =>
            place.nested.getItemByType("LabelPlaceSeg"),
          RequestedColumnsHeaderSeg: (place) =>
            place.nested.getItemByType("MonthListSeg"),
        },
      }),
      tableFactory({
        mainLine: "PoissonListSeg",
        orthoLine: "LabelPlaceSeg",
        selfPos: {
          RequestedRowsHeaderSeg: (place) =>
            place.nested.getItemByType("PoissonListSeg"),
          RequestedColumnsHeaderSeg: (place) =>
            place.nested.getItemByType("LabelPlaceSeg"),
        },
      }),
    ]),
  });
}

export function recipeWidgetCardFactory(dataListCard: ICard) {
  return cardFactory({
    typeName: "RecipeWidgetCard",
    nested: eArrayFactory([
      cardFactory({
        nested: eArrayFactory([dataListCard]),
        selfPos: {
          RecipeRowsHeaderSeg: (place) =>
            place.nested.getItemByType("PoissonListSeg"),
          RecipeColumnsHeaderSeg: (place) =>
            place.nested.getItemByType("IngredientListSeg"),
        },
      }),
      tableFactory({
        mainLine: "IngredientListSeg",
        orthoLine: "LabelPlaceSeg",
        selfPos: {
          RecipeRowsHeaderSeg: (place) =>
            place.nested.getItemByType("LabelPlaceSeg"),
          RecipeColumnsHeaderSeg: (place) =>
            place.nested.getItemByType("IngredientListSeg"),
        },
      }),
      tableFactory({
        mainLine: "PoissonListSeg",
        orthoLine: "LabelPlaceSeg",
        selfPos: {
          RecipeRowsHeaderSeg: (place) =>
            place.nested.getItemByType("PoissonListSeg"),
          RecipeColumnsHeaderSeg: (place) =>
            place.nested.getItemByType("LabelPlaceSeg"),
        },
      }),
    ]),
  });
}

export function ingredientsMonthWidgetCardFactory(dataListCard: ICard) {
  return cardFactory({
    typeName: "IngredientsMonthWidgetCard",
    nested: eArrayFactory([
      cardFactory({
        nested: eArrayFactory([dataListCard]),
        selfPos: {
          IngMonthRowsHeaderSeg: (place) =>
            place.nested.getItemByType("MonthListSeg"),
          IngMonthColumnsHeaderSeg: (place) =>
            place.nested.getItemByType("IngredientListSeg"),
        },
      }),
      tableFactory({
        mainLine: "IngredientListSeg",
        orthoLine: "LabelPlaceSeg",
        selfPos: {
          IngMonthRowsHeaderSeg: (place) =>
            place.nested.getItemByType("LabelPlaceSeg"),
          IngMonthColumnsHeaderSeg: (place) =>
            place.nested.getItemByType("IngredientListSeg"),
        },
      }),
      tableFactory({
        mainLine: "MonthListSeg",
        orthoLine: "LabelPlaceSeg",
        selfPos: {
          IngMonthRowsHeaderSeg: (place) =>
            place.nested.getItemByType("MonthListSeg"),
          IngMonthColumnsHeaderSeg: (place) =>
            place.nested.getItemByType("LabelPlaceSeg"),
        },
      }),
    ]),
  });
}

export function priceWidgetCardFactory(dataListCard: ICard) {
  return cardFactory({
    typeName: "PriceWidgetCard",
    nested: eArrayFactory([
      cardFactory({
        nested: eArrayFactory([dataListCard]),
        selfPos: {
          PriceRowsHeaderSeg: (place) =>
            place.nested.getItemByType("IngredientListSeg"),
          PriceColumnsHeaderSeg: (place) =>
            place.nested.getItemByType("MonthListSeg"),
        },
      }),
      tableFactory({
        mainLine: "MonthListSeg",
        orthoLine: "LabelPlaceSeg",
        selfPos: {
          PriceRowsHeaderSeg: (place) =>
            place.nested.getItemByType("LabelPlaceSeg"),
          PriceColumnsHeaderSeg: (place) =>
            place.nested.getItemByType("MonthListSeg"),
        },
      }),
      tableFactory({
        mainLine: "IngredientListSeg",
        orthoLine: "LabelPlaceSeg",
        selfPos: {
          PriceRowsHeaderSeg: (place) =>
            place.nested.getItemByType("IngredientListSeg"),
          PriceColumnsHeaderSeg: (place) =>
            place.nested.getItemByType("LabelPlaceSeg"),
        },
      }),
    ]),
  });
}

export function costWidgetCardFactory(
  costsCard: ICard,
  costPerIngredientCard: ICard,
  costPerMonthCard: ICard,
) {
  return cardFactory({
    typeName: "CostWidgetCard",
    nested: eArrayFactory([
      cardFactory({
        nested: eArrayFactory([costsCard]),
        selfPos: {
          CostRowsHeaderSeg: (place) =>
            place.nested.getItemByType("IngredientListSeg"),
          CostColumnsHeaderSeg: (place) =>
            place.nested.getItemByType("MonthListSeg"),
        },
      }),
      cardFactory({
        nested: eArrayFactory([costPerIngredientCard]),
        selfPos: {
          CostRowsHeaderSeg: (place) =>
            place.nested.getItemByType("IngredientListSeg"),
          CostColumnsHeaderSeg: (place) =>
            place.nested.getItemByType("UnitColumnListSeg"),
        },
      }),
      cardFactory({
        nested: eArrayFactory([costPerMonthCard]),
        selfPos: {
          CostRowsHeaderSeg: (place) =>
            place.nested.getItemByType("UnitRowListSeg"),
          CostColumnsHeaderSeg: (place) =>
            place.nested.getItemByType("MonthListSeg"),
        },
      }),
      tableFactory({
        mainLine: "MonthListSeg",
        orthoLine: "LabelPlaceSeg",
        selfPos: {
          CostRowsHeaderSeg: (place) =>
            place.nested.getItemByType("LabelPlaceSeg"),
          CostColumnsHeaderSeg: (place) =>
            place.nested.getItemByType("MonthListSeg"),
        },
      }),
      tableFactory({
        mainLine: "IngredientListSeg",
        orthoLine: "LabelPlaceSeg",
        selfPos: {
          CostRowsHeaderSeg: (place) =>
            place.nested.getItemByType("IngredientListSeg"),
          CostColumnsHeaderSeg: (place) =>
            place.nested.getItemByType("LabelPlaceSeg"),
        },
      }),
      tableFactory({
        mainLine: "UnitColumnListSeg",
        orthoLine: "LabelPlaceSeg",
        selfPos: {
          CostRowsHeaderSeg: (place) =>
            place.nested.getItemByType("LabelPlaceSeg"),
          CostColumnsHeaderSeg: (place) =>
            place.nested.getItemByType("UnitColumnListSeg"),
        },
      }),
      tableFactory({
        mainLine: "UnitRowListSeg",
        orthoLine: "LabelPlaceSeg",
        selfPos: {
          CostRowsHeaderSeg: (place) =>
            place.nested.getItemByType("UnitRowListSeg"),
          CostColumnsHeaderSeg: (place) =>
            place.nested.getItemByType("LabelPlaceSeg"),
        },
      }),
    ]),
  });
}

export function costIngredientWidgetCardFactory(dataListCard: ICard) {
  return cardFactory({
    typeName: "CostIngredientWidgetCard",
    nested: eArrayFactory([
      cardFactory({
        nested: eArrayFactory([dataListCard]),
        selfPos: {
          CostIngRowsHeaderSeg: (place) =>
            place.nested.getItemByType("IngredientListSeg"),
          CostIngColumnsHeaderSeg: (place) =>
            place.nested.getItemByType("UnitColumnListSeg"),
        },
      }),
      tableFactory({
        mainLine: "UnitColumnListSeg",
        orthoLine: "LabelPlaceSeg",
        selfPos: {
          CostIngRowsHeaderSeg: (place) =>
            place.nested.getItemByType("LabelPlaceSeg"),
          CostIngColumnsHeaderSeg: (place) =>
            place.nested.getItemByType("UnitColumnListSeg"),
        },
      }),
      tableFactory({
        mainLine: "IngredientListSeg",
        orthoLine: "LabelPlaceSeg",
        selfPos: {
          CostIngRowsHeaderSeg: (place) =>
            place.nested.getItemByType("IngredientListSeg"),
          CostIngColumnsHeaderSeg: (place) =>
            place.nested.getItemByType("LabelPlaceSeg"),
        },
      }),
    ]),
  });
}

export function costMonthWidgetCardFactory(dataListCard: ICard) {
  return cardFactory({
    typeName: "CostMonthWidgetCard",
    nested: eArrayFactory([
      cardFactory({
        nested: eArrayFactory([dataListCard]),
        selfPos: {
          CostMonthRowsHeaderSeg: (place) =>
            place.nested.getItemByType("MonthListSeg"),
          CostMonthColumnsHeaderSeg: (place) =>
            place.nested.getItemByType("UnitColumnListSeg"),
        },
      }),
      tableFactory({
        mainLine: "UnitColumnListSeg",
        orthoLine: "LabelPlaceSeg",
        selfPos: {
          CostMonthRowsHeaderSeg: (place) =>
            place.nested.getItemByType("LabelPlaceSeg"),
          CostMonthColumnsHeaderSeg: (place) =>
            place.nested.getItemByType("UnitColumnListSeg"),
        },
      }),
      tableFactory({
        mainLine: "MonthListSeg",
        orthoLine: "LabelPlaceSeg",
        selfPos: {
          CostMonthRowsHeaderSeg: (place) =>
            place.nested.getItemByType("MonthListSeg"),
          CostMonthColumnsHeaderSeg: (place) =>
            place.nested.getItemByType("LabelPlaceSeg"),
        },
      }),
    ]),
  });
}
