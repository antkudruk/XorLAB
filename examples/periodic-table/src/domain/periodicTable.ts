import {
  cardFactory,
  distinctTypeLineCollectionFactory,
  eArrayFactory,
  segFactory,
  tableFactory,
} from "xorlab";
import { SelectController } from "xorlab-interactive";
import { labelPlaceSegFactory } from "./common";
import { createElementListCard } from "./elements";
import { createGroupEntries, createGroupListSeg } from "./groups";
import { createPeriodEntries, createPeriodListSeg } from "./periods";
import { ChemicalElement } from "./types";

export function rowsHeaderSegFactory(
  periodListSeg: GenSegTypes.PeriodListSeg
) {
  return segFactory({
    typeName: "RowsHeaderSeg",
    nested: distinctTypeLineCollectionFactory([
      labelPlaceSegFactory(),
      periodListSeg,
    ]),
  });
}

export function columnsHeaderSegFactory(
  groupListSeg: GenSegTypes.GroupListSeg
) {
  return segFactory({
    typeName: "ColumnsHeaderSeg",
    nested: distinctTypeLineCollectionFactory([
      labelPlaceSegFactory(),
      groupListSeg,
    ]),
  });
}

export function periodicTableCardFactory(
  elementListCard: GenCardTypes.ElementListCard
) {
  return cardFactory({
    typeName: "PeriodicTableCard",
    nested: eArrayFactory([
      cardFactory({
        nested: eArrayFactory([elementListCard]),
        selfPos: {
          RowsHeaderSeg: (place) => place.nested.getItemByType("PeriodListSeg"),
          ColumnsHeaderSeg: (place) => place.nested.getItemByType("GroupListSeg"),
        },
      }),
      tableFactory({
        mainLine: "GroupListSeg",
        orthoLine: "LabelPlaceSeg",
        selfPos: {
          RowsHeaderSeg: (place) => place.nested.getItemByType("LabelPlaceSeg"),
          ColumnsHeaderSeg: (place) => place.nested.getItemByType("GroupListSeg"),
        },
      }),
      tableFactory({
        mainLine: "PeriodListSeg",
        orthoLine: "LabelPlaceSeg",
        selfPos: {
          RowsHeaderSeg: (place) => place.nested.getItemByType("PeriodListSeg"),
          ColumnsHeaderSeg: (place) => place.nested.getItemByType("LabelPlaceSeg"),
        },
      }),
    ]),
  });
}

export function createPeriodicTableLayout(
  elements: ChemicalElement[]
) {
  const periodEntries = createPeriodEntries(elements);
  const groupEntries = createGroupEntries();
  const periodListSeg = createPeriodListSeg(periodEntries);
  const groupListSeg = createGroupListSeg(groupEntries);
  const elementSelect = new SelectController<ChemicalElement>({
    selectClassName: "ElementCard--selected",
    cardTypeName: "ElementCard",
    getValue: (card) =>
      card.typeName === "ElementCard" ? (card.attrs as ChemicalElement) : undefined,
    isEqual: (a, b) => a.atomicNumber === b.atomicNumber,
  });
  const elementListCard = createElementListCard(elements);

  return {
    periodListSeg,
    groupListSeg,
    rowsHeaderSeg: rowsHeaderSegFactory(periodListSeg),
    columnsHeaderSeg: columnsHeaderSegFactory(groupListSeg),
    widgetCard: periodicTableCardFactory(elementListCard),
    elementListCard,
    elementSelect,
  };
}
