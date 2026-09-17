import {
  distinctTypeLineCollectionFactory,
  segFactory,
  type ISeg,
} from "xorlab";
import { labelPlaceSegFactory } from "./axes";

export function requestedHeaders(rowListSeg: ISeg, columnListSeg: ISeg) {
  return {
    rowsHeaderSeg: segFactory({
      typeName: "RequestedRowsHeaderSeg",
      nested: distinctTypeLineCollectionFactory([
        labelPlaceSegFactory(),
        rowListSeg,
      ]),
    }),
    columnsHeaderSeg: segFactory({
      typeName: "RequestedColumnsHeaderSeg",
      nested: distinctTypeLineCollectionFactory([
        labelPlaceSegFactory(),
        columnListSeg,
      ]),
    }),
  };
}

export function recipeHeaders(rowListSeg: ISeg, columnListSeg: ISeg) {
  return {
    rowsHeaderSeg: segFactory({
      typeName: "RecipeRowsHeaderSeg",
      nested: distinctTypeLineCollectionFactory([
        labelPlaceSegFactory(),
        rowListSeg,
      ]),
    }),
    columnsHeaderSeg: segFactory({
      typeName: "RecipeColumnsHeaderSeg",
      nested: distinctTypeLineCollectionFactory([
        labelPlaceSegFactory(),
        columnListSeg,
      ]),
    }),
  };
}

export function ingMonthHeaders(rowListSeg: ISeg, columnListSeg: ISeg) {
  return {
    rowsHeaderSeg: segFactory({
      typeName: "IngMonthRowsHeaderSeg",
      nested: distinctTypeLineCollectionFactory([
        labelPlaceSegFactory(),
        rowListSeg,
      ]),
    }),
    columnsHeaderSeg: segFactory({
      typeName: "IngMonthColumnsHeaderSeg",
      nested: distinctTypeLineCollectionFactory([
        labelPlaceSegFactory(),
        columnListSeg,
      ]),
    }),
  };
}

export function priceHeaders(rowListSeg: ISeg, columnListSeg: ISeg) {
  return {
    rowsHeaderSeg: segFactory({
      typeName: "PriceRowsHeaderSeg",
      nested: distinctTypeLineCollectionFactory([
        labelPlaceSegFactory(),
        rowListSeg,
      ]),
    }),
    columnsHeaderSeg: segFactory({
      typeName: "PriceColumnsHeaderSeg",
      nested: distinctTypeLineCollectionFactory([
        labelPlaceSegFactory(),
        columnListSeg,
      ]),
    }),
  };
}

export function costHeaders(
  rowListSeg: ISeg,
  rowTotalSeg: ISeg,
  columnListSeg: ISeg,
  columnTotalSeg: ISeg,
) {
  return {
    rowsHeaderSeg: segFactory({
      typeName: "CostRowsHeaderSeg",
      nested: distinctTypeLineCollectionFactory([
        labelPlaceSegFactory(),
        rowListSeg,
        rowTotalSeg,
      ]),
    }),
    columnsHeaderSeg: segFactory({
      typeName: "CostColumnsHeaderSeg",
      nested: distinctTypeLineCollectionFactory([
        labelPlaceSegFactory(),
        columnListSeg,
        columnTotalSeg,
      ]),
    }),
  };
}

export function costIngHeaders(rowListSeg: ISeg, columnListSeg: ISeg) {
  return {
    rowsHeaderSeg: segFactory({
      typeName: "CostIngRowsHeaderSeg",
      nested: distinctTypeLineCollectionFactory([
        labelPlaceSegFactory(),
        rowListSeg,
      ]),
    }),
    columnsHeaderSeg: segFactory({
      typeName: "CostIngColumnsHeaderSeg",
      nested: distinctTypeLineCollectionFactory([
        labelPlaceSegFactory(),
        columnListSeg,
      ]),
    }),
  };
}

export function costMonthHeaders(rowListSeg: ISeg, columnListSeg: ISeg) {
  return {
    rowsHeaderSeg: segFactory({
      typeName: "CostMonthRowsHeaderSeg",
      nested: distinctTypeLineCollectionFactory([
        labelPlaceSegFactory(),
        rowListSeg,
      ]),
    }),
    columnsHeaderSeg: segFactory({
      typeName: "CostMonthColumnsHeaderSeg",
      nested: distinctTypeLineCollectionFactory([
        labelPlaceSegFactory(),
        columnListSeg,
      ]),
    }),
  };
}
