import type { EStyleSheet } from "xorlab";

const CELL = "25px" as const;

export function createPoissonsStyleSheet() {
  return {
    LabelPlaceSeg: { windowH: "125px", windowV: "25px" },
    PoissonSeg: { window: CELL },
    PoissonListSeg: { window: "100flex" },
    IngredientSeg: { windowV: "25px", windowH: "70px" },
    IngredientListSeg: { window: "100flex" },
    MonthSeg: { windowV: "25px",  windowH: "70px" },
    MonthListSeg: { window: "100flex" },
    UnitColumnSeg: { window: CELL },
    UnitColumnListSeg: { window: CELL },
    UnitRowSeg: { window: CELL },
    UnitRowListSeg: { window: CELL },
    RequestedRowsHeaderSeg: { window: "100flex" },
    RequestedColumnsHeaderSeg: { window: "100flex" },
    RecipeRowsHeaderSeg: { window: "100flex" },
    RecipeColumnsHeaderSeg: { window: "100flex" },
    IngMonthRowsHeaderSeg: { window: "100flex" },
    IngMonthColumnsHeaderSeg: { window: "100flex" },
    PriceRowsHeaderSeg: { window: "100flex" },
    PriceColumnsHeaderSeg: { window: "100flex" },
    CostRowsHeaderSeg: { window: "100flex" },
    CostColumnsHeaderSeg: { window: "100flex" },
    CostIngRowsHeaderSeg: { window: "100flex" },
    CostIngColumnsHeaderSeg: { window: "100flex" },
    CostMonthRowsHeaderSeg: { window: "100flex" },
    CostMonthColumnsHeaderSeg: { window: "100flex" },
  } satisfies EStyleSheet;
}
