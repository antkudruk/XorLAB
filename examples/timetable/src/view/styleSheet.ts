import type { EStyleSheet } from "xorlab";

export function createTimetableStyleSheet(): EStyleSheet {
  return {
    GroupSeg: { window: "60px" },
    GroupListSeg: { window: "30flex" },
    HourSeg: { window: "50px" },
    WeekSeg: { window: "100flex" },
    WeekdayPlaceSeg: { window: "50px" },
    HourPlaceSeg: { window: "50px" },
    TeacherSeg: { window: "60px" },
    TeacherListSeg: { window: "100rem" },
    TeacherIdColumnSeg: { window: "50px" },
    TeacherFirstNameColumnSeg: { window: "100px" },
    TeacherLastNameColumnSeg: { window: "100px" },
    TimetableHorizontalSeg: { window: "100flex" },
    TimetableVerticalSeg: { window: "100flex" },
  };
}
