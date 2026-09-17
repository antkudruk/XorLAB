import { scrollableSystemFactory } from "xorlab";
import { PeriodicTableModel } from "../domain/periodicTableModel";

export function periodicTableScrollableSystemFactory(model: PeriodicTableModel) {
  return scrollableSystemFactory({
    verticalContentSeg: model.rowsHeaderSeg,
    horizontalContentSeg: model.columnsHeaderSeg,
    widgetCard: model.widgetCard,
  });
}
