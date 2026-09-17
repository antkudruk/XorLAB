import { ISeg } from "xorlab";
import { PeriodicTableModel } from "../domain/periodicTableModel";
import { createPeriodicTableCallbackTable } from "./callbackTable";
import { periodicTableScrollableSystemFactory } from "./PeriodicTableCompositeView";
import { mountWidget, type MountedWidget } from "./mountWidget";
import { createPeriodicTableStyleSheet } from "./styleSheet";

export function mountPeriodicTable(
  host: HTMLElement,
  model: PeriodicTableModel
): MountedWidget {
  const { vertical, horizontal, card } = periodicTableScrollableSystemFactory(model);

  const mounted = mountWidget({
    host,
    vertical: vertical,
    horizontal: horizontal,
    card: card,
    styleSheet: createPeriodicTableStyleSheet(),
    callbackTable: createPeriodicTableCallbackTable({
      elementSelect: model.elementSelect,
    }),
  });

  model.elementSelect.bindWidget(mounted.widget);

  return mounted;
}
