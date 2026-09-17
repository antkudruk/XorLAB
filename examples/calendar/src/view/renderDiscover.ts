import {
  scrollableSystemFactory,
  type EStyleSheet,
  type ISeg,
} from "xorlab";
import { discoveryTreePlaceSeg, segDiscovery } from "xorlab-discover";
import { createMonthlyGridLayout } from "../calendarView/calendar";
import { createCalendarLayout } from "../domain2/calendar";
import { mountWidget, type MountedWidget } from "./mountWidget";
import {
  createCalendarStyleSheet,
  createMonthlyGridStyleSheet,
} from "./styleSheet";

function mountDiscoveryWidget(options: {
  readonly host: HTMLElement;
  readonly horizontalContentSeg: ISeg;
  readonly verticalContentSeg: ISeg;
  readonly styleSheet: EStyleSheet;
}): MountedWidget {
  const { vertical, horizontal, card } = scrollableSystemFactory({
    horizontalContentSeg: options.horizontalContentSeg,
    verticalContentSeg: options.verticalContentSeg,
    widgetCard: segDiscovery(),
  });

  return mountWidget({
    host: options.host,
    vertical,
    horizontal,
    card,
    styleSheet: options.styleSheet,
  });
}

export function mountDiscoverPage(): MountedWidget[] {
  const monthlyHorizontalHost = document.querySelector<HTMLElement>(
    "#discover-monthly-horizontal",
  );
  const monthlyVerticalHost = document.querySelector<HTMLElement>(
    "#discover-monthly-vertical",
  );
  const yearHorizontalHost = document.querySelector<HTMLElement>(
    "#discover-year-horizontal",
  );
  const yearVerticalHost = document.querySelector<HTMLElement>(
    "#discover-year-vertical",
  );

  if (
    !monthlyHorizontalHost ||
    !monthlyVerticalHost ||
    !yearHorizontalHost ||
    !yearVerticalHost
  ) {
    throw new Error("Discover page markup is missing required hosts.");
  }

  const monthlyH = createMonthlyGridLayout();
  const monthlyV = createMonthlyGridLayout();
  const yearH = createCalendarLayout();
  const yearV = createCalendarLayout();

  const monthlyStyle = createMonthlyGridStyleSheet();
  const yearStyle = createCalendarStyleSheet();

  return [
    mountDiscoveryWidget({
      host: monthlyHorizontalHost,
      horizontalContentSeg: monthlyH.horizontalContentSeg,
      verticalContentSeg: discoveryTreePlaceSeg(),
      styleSheet: monthlyStyle,
    }),
    mountDiscoveryWidget({
      host: monthlyVerticalHost,
      horizontalContentSeg: discoveryTreePlaceSeg(),
      verticalContentSeg: monthlyV.verticalContentSeg,
      styleSheet: monthlyStyle,
    }),
    mountDiscoveryWidget({
      host: yearHorizontalHost,
      horizontalContentSeg: yearH.horizontalContentSeg,
      verticalContentSeg: discoveryTreePlaceSeg(),
      styleSheet: yearStyle,
    }),
    mountDiscoveryWidget({
      host: yearVerticalHost,
      horizontalContentSeg: discoveryTreePlaceSeg(),
      verticalContentSeg: yearV.verticalContentSeg,
      styleSheet: yearStyle,
    }),
  ];
}
