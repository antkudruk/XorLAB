import type { CallbackTable } from "xorlab";
import type { SelectController } from "xorlab-interactive";

export interface CalendarCallbackTableDeps {
  readonly daySelect: SelectController<string>;
}

export function createCalendarCallbackTable(
  deps: CalendarCallbackTableDeps,
): CallbackTable {
  return {
    DayCard: {
      mouseClick: (event, dayCard) => {
        deps.daySelect.handleCardClick(dayCard, event);
      },
    },
  };
}
