import {
    cardFactory,
    distinctTypeLineCollectionFactory,
    eArrayFactory,
    scrollableSystemFactory,
    segFactory,
} from "xorlab";
import {
    teacherColumnsSeg,
    teacherListCardFactory,
    teacherListSeg,
} from "../domain/Teacher";
import {
    timeHeaderCardFactory,
    timePlaceSeg,
    weekSegFactory,
} from "../domain/Time";
import { groupListSeg, groupTableFactory } from "src/domain/Group";
import { lessonListCardFactory } from "src/domain/Lesson";
import { slotListCardFactory } from "src/domain/SlotSelection";

export function timetableHorizontalSegFactory() {
    return segFactory({
        typeName: "TimetableHorizontalSeg",
        nested: distinctTypeLineCollectionFactory([
            teacherColumnsSeg,
            weekSegFactory(),
        ]),
    });
}

export function timetableVerticalSegFactory() {
    return segFactory({
        typeName: "TimetableVerticalSeg",
        nested: distinctTypeLineCollectionFactory([
            timePlaceSeg,
            groupListSeg,
            teacherListSeg,
        ]),
    });
}

export function timetableWidgetCardFactory() {
    return cardFactory({
        typeName: "TimetableWidgetCard",
        nested: eArrayFactory([
            timeHeaderCardFactory(),
            teacherListCardFactory(),
            groupTableFactory(),
            cardFactory({
                typeName: "GroupTimetableCard",
                nested: eArrayFactory([
                    slotListCardFactory(),
                    lessonListCardFactory(),
                ]),
                selfPos: {
                    TimetableVerticalSeg: (place) => place.nested.getItemByType("GroupListSeg"),
                    TimetableHorizontalSeg: (place) => place.nested.getItemByType("WeekSeg"),
                },
            }),
            cardFactory({
                typeName: "TeacherTimetableCard",
                nested: eArrayFactory([
                    slotListCardFactory(),
                    lessonListCardFactory(),
                ]),
                selfPos: {
                    TimetableVerticalSeg: (place) => place.nested.getItemByType("TeacherListSeg"),
                    TimetableHorizontalSeg: (place) => place.nested.getItemByType("WeekSeg"),
                },
            }),
        ]),
    });
}

export function timetableScrollableSystemFactory() {
    return scrollableSystemFactory({
        verticalContentSeg: timetableVerticalSegFactory(),
        horizontalContentSeg: timetableHorizontalSegFactory(),
        widgetCard: timetableWidgetCardFactory(),
    });
}
