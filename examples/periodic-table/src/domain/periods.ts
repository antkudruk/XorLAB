import {
  cardFactory,
  eArrayFactory,
  eMappedFactory,
  segFactory,
  textRendererFactory,
} from "xorlab";
import { ChemicalElement, PeriodEntry } from "./types";

export function createPeriodEntries(elements: ChemicalElement[]): PeriodEntry[] {
  const periods = Array.from(new Set(elements.map((element) => element.period)));

  return periods
    .sort((left, right) => left - right)
    .map((period) => ({
      id: period,
      period,
      label: `Period ${period}`,
    }));
}

export function createPeriodListSeg(periodEntries: PeriodEntry[]) {
  const periodCollection = eArrayFactory<PeriodEntry[]>(periodEntries);

  return segFactory({
    typeName: "PeriodListSeg",
    nested: eMappedFactory(periodCollection, (periodEntry) =>
      segFactory({
        typeName: "PeriodSeg",
        attrs: periodEntry,
        cardFactories: {
          LabelPlaceSeg: (_, self) =>
            cardFactory({
              typeName: "PeriodHeaderCard",
              renderer: textRendererFactory(() => String(self.attrs.period)),
            }),
        },
      })
    ),
  });
}
