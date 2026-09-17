import { SelectController } from "xorlab-interactive";
import { createMonthlyGridLayout } from "../calendarView/calendar";
import { createCalendarLayout } from "../domain2/calendar";
import { createCalendarCallbackTable } from "./callbackTable";
import { calendarScrollableSystemFactory } from "./CalendarCompositeView";
import { mountWidget, type MountedWidget } from "./mountWidget";
import {
  createCalendarStyleSheet,
  createMonthlyGridStyleSheet,
} from "./styleSheet";

export interface MountedCalendar {
    readonly mounted: MountedWidget;
    readonly daySelect: SelectController<string>;
}

export interface MountedMonthlyGrid {
    readonly mounted: MountedWidget;
    readonly daySelect: SelectController<string>;
}

export function mountDomain2Calendar(host: HTMLElement): MountedCalendar {
  const layout = createCalendarLayout();
  const { vertical, horizontal, card } = calendarScrollableSystemFactory(layout);

  const mounted = mountWidget({
    host,
    vertical: vertical,
    horizontal: horizontal,
    card: card,
    styleSheet: createCalendarStyleSheet(),
    callbackTable: createCalendarCallbackTable({
      daySelect: layout.daySelect,
    }),
  });

  layout.daySelect.bindWidget(mounted.widget);

  return {
    mounted,
    daySelect: layout.daySelect,
  };
}

export function mountMonthlyGridCalendar(host: HTMLElement): MountedMonthlyGrid {
  const layout = createMonthlyGridLayout();
  const { vertical, horizontal, card } = calendarScrollableSystemFactory(layout);

  const mounted = mountWidget({
    host,
    vertical: vertical,
    horizontal: horizontal,
    card: card,
    styleSheet: createMonthlyGridStyleSheet(),
    callbackTable: createCalendarCallbackTable({
      daySelect: layout.daySelect,
    }),
  });

  layout.daySelect.bindWidget(mounted.widget);

  return {
    mounted,
    daySelect: layout.daySelect,
  };
}
