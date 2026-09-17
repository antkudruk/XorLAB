import {
  ScalarElementMetaFactory,
  Widget,
} from "xorlab";
import { collectCardsByTypeName } from "xorlab-interactive";
import { timetableScrollableSystemFactory } from "./TimetableCompositeView";
import { createTimetableCallbackTable } from "./callbackTable";
import { createTimetableStyleSheet } from "./styleSheet";
import {
  createGroupLessonDrag,
  createTeacherLessonDrag,
} from "./timetableLessonDrag";
import {
  createSlotSelect,
  TimetableSlotSelect,
} from "./timetableSlotSelect";

export interface MountedWidget {
  readonly widget?: Widget;
  destroy(): void;
}

export interface MountWidgetOptions {
  readonly host: HTMLElement;
}

export function mountWidget(options: MountWidgetOptions): MountedWidget {
  options.host.replaceChildren();

  const { vertical, horizontal, card } = timetableScrollableSystemFactory();

  const groupTimetable = collectCardsByTypeName(card, "GroupTimetableCard")[0];
  const teacherTimetable = collectCardsByTypeName(card, "TeacherTimetableCard")[0];
  const groupLessonList = groupTimetable
    ? collectCardsByTypeName(groupTimetable, "LessonListCard")[0]
    : undefined;
  const teacherLessonList = teacherTimetable
    ? collectCardsByTypeName(teacherTimetable, "LessonListCard")[0]
    : undefined;
  const groupSlotList = groupTimetable
    ? collectCardsByTypeName(groupTimetable, "SlotListCard")[0]
    : undefined;
  const teacherSlotList = teacherTimetable
    ? collectCardsByTypeName(teacherTimetable, "SlotListCard")[0]
    : undefined;

  if (!groupLessonList || !teacherLessonList || !groupSlotList || !teacherSlotList) {
    throw new Error("Timetable mount: missing lesson list or slot list cards");
  }

  const groupLessonDrag = createGroupLessonDrag(
    groupLessonList as GenCardTypes.LessonListCard,
    teacherLessonList as GenCardTypes.LessonListCard,
  );
  const teacherLessonDrag = createTeacherLessonDrag(
    teacherLessonList as GenCardTypes.LessonListCard,
    groupLessonList as GenCardTypes.LessonListCard,
  );

  const groupSlotSelectController = createSlotSelect();
  const teacherSlotSelectController = createSlotSelect();
  const groupSlotSelect = new TimetableSlotSelect(
    groupSlotList,
    groupSlotSelectController,
    "group",
  );
  const teacherSlotSelect = new TimetableSlotSelect(
    teacherSlotList,
    teacherSlotSelectController,
    "teacher",
  );

  const widget = new Widget({
    htmlElement: options.host,
    styleSheet: createTimetableStyleSheet(),
    callbackTable: createTimetableCallbackTable({
      groupLessonDrag,
      teacherLessonDrag,
      groupSlotSelect,
      teacherSlotSelect,
    }),
    elementMetaFactory: ScalarElementMetaFactory,
    vertical,
    horizontal,
    card,
  });

  groupSlotSelectController.bindWidget(widget);
  teacherSlotSelectController.bindWidget(widget);

  return {
    widget,
    destroy() {
      groupLessonDrag.destroy();
      teacherLessonDrag.destroy();
      groupSlotSelectController.clear();
      teacherSlotSelectController.clear();
      widget.destroy();
      options.host.replaceChildren();
    },
  };
}
