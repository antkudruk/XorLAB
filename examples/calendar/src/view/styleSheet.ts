import type { EStyleSheet } from "xorlab";

export function createCalendarStyleSheet(): EStyleSheet {
  return {
    LabelPlaceSeg: { window: "50px" },
    MonthLabelPlaceSeg: { window: "50px" },
    WeekSeg: { window: "100flex" },
    WeekDaySeg: { window: "50px" },
    WeekNumberSeg: { window: "50px" },
    PeriodSeg: { window: "100flex" },
    RowsHeaderSeg: { window: "100flex" },
    ColumnsHeaderSeg: { window: "100flex" },
  };
}

export function createMonthlyGridStyleSheet(): EStyleSheet {
  return {
    MonthRowListSeg: { window: "100flex" },
    MonthColListSeg: { window: "100flex" },
    MonthRowSeg: { window: "auto" },
    MonthColSeg: { window: "auto" },
    MonthHeaderPlaceSeg: { window: "28px" },
    WeekSeg: { window: "160px" },
    WeekDaySeg: { window: "25px" },
    WeekNumberInMonthSeg: { window: "25px" },
  };
}
