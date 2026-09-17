import { createPeriodicTableLayout } from "./periodicTable";
import { ChemicalElement } from "./types";

export function createPeriodicTableModel(
  elements: ChemicalElement[]
) {
  return createPeriodicTableLayout(elements);
}
