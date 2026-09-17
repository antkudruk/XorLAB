import { SelectController } from "xorlab-interactive";
import { createPeriodicTableLayout } from "./periodicTable";
import { ChemicalElement } from "./types";
import { ICard, ISeg } from "xorlab";

export interface PeriodicTableModel {
  readonly elementSelect: SelectController<ChemicalElement>;
  readonly rowsHeaderSeg: ISeg;
  readonly columnsHeaderSeg: ISeg;
  readonly widgetCard: ICard;
}

export function createPeriodicTableModel(
  elements: ChemicalElement[]
) {
  return createPeriodicTableLayout(elements);
}
