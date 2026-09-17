import { type CallbackTable } from "xorlab";
import { HoverController, type SelectController } from "xorlab-interactive";
import { ChemicalElement } from "../domain/types";

const groupHover = new HoverController("GroupHeaderCard--hovered");
const periodHover = new HoverController("PeriodHeaderCard--hovered");
const elementHover = new HoverController("ElementCard--hovered");

export interface PeriodicTableCallbackTableDeps {
  readonly elementSelect: SelectController<ChemicalElement>;
}

export function createPeriodicTableCallbackTable(
  deps: PeriodicTableCallbackTableDeps,
): CallbackTable {
  return {
    GroupSeg: {
      mouseOver: (event, groupSeg) => {
        groupHover.highlightCards(
          groupSeg.cards.filter((card) => card.typeName === "GroupHeaderCard"),
          event,
        );
      },
    },
    PeriodSeg: {
      mouseOver: (event, periodSeg) => {
        periodHover.highlightCards(
          periodSeg.cards.filter((card) => card.typeName === "PeriodHeaderCard"),
          event,
        );
      },
    },
    ElementCard: {
      mouseOver: (event, self) => {
        elementHover.highlightCards([self], event);
      },
      mouseClick: (event, self) => {
        deps.elementSelect.handleCardClick(self, event);
      },
    },
  };
}
