import type { CallbackTable } from "xorlab";
import type { TimetableLessonDrag } from "./timetableLessonDrag";
import type { TimetableSlotSelect } from "./timetableSlotSelect";

export interface TimetableCallbackTableDeps {
  readonly groupLessonDrag: TimetableLessonDrag;
  readonly teacherLessonDrag: TimetableLessonDrag;
  readonly groupSlotSelect: TimetableSlotSelect;
  readonly teacherSlotSelect: TimetableSlotSelect;
}

export function createTimetableCallbackTable(
  deps: TimetableCallbackTableDeps,
): CallbackTable {
  return {
    LessonListCard: {
      mouseDown: (event, self) => {
        deps.groupLessonDrag.handleMouseDown(self, event);
        deps.teacherLessonDrag.handleMouseDown(self, event);
      },
      mouseDrag: (event, self) => {
        deps.groupLessonDrag.handleMouseDrag(self, event);
        deps.teacherLessonDrag.handleMouseDrag(self, event);
      },
      mouseUp: (event, self) => {
        deps.groupLessonDrag.handleMouseUp(self, event);
        deps.teacherLessonDrag.handleMouseUp(self, event);
      },
      mouseClick: (event, self) => {
        deps.groupSlotSelect.handleMouseClick(self, event);
        deps.teacherSlotSelect.handleMouseClick(self, event);
      },
    },
  };
}
