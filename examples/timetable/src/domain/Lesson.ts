/**
 * Lesson cards placed into the week grid via Coordinate Placement.
 *
 * One shared {@link lessonCardFactory} lists handlers for every coordinate
 * (`GroupListSeg` and `TeacherListSeg`). Parent layer anchors choose which row
 * axis applies at runtime. See README "selfPos scope — no axis conditionals"
 * and Layer Anchor Pattern.
 *
 * Drag mutates `weekday` / `hour` on the domain attrs object in place, then
 * `DragController` calls `card.fire()` so `selfPos` rebinds.
 */
import {
    cardFactory,
    eArrayFactory,
    eMappedFactory,
    textRendererFactory,
} from "xorlab";

export interface Lesson {
    readonly id: number;
    readonly subjectId: number;
    readonly groupId: number;
    readonly teacherId: number;
    weekday: number;
    hour: number;
}

export const lessonList = eArrayFactory<Lesson[]>([
    {
        id: 1,
        subjectId: 1,
        groupId: 1,
        teacherId: 1,
        weekday: 1,
        hour: 1,
    },
    {
        id: 2,
        subjectId: 2,
        groupId: 2,
        teacherId: 3,
        weekday: 2,
        hour: 2,
    },
    {
        id: 3,
        subjectId: 3,
        groupId: 3,
        teacherId: 2,
        weekday: 3,
        hour: 3,
    },
    {
        id: 4,
        subjectId: 1,
        groupId: 4,
        teacherId: 4,
        weekday: 1,
        hour: 3,
    },
    {
        id: 5,
        subjectId: 2,
        groupId: 5,
        teacherId: 5,
        weekday: 2,
        hour: 5,
    },
    {
        id: 6,
        subjectId: 3,
        groupId: 6,
        teacherId: 6,
        weekday: 3,
        hour: 1,
    },
    {
        id: 7,
        subjectId: 1,
        groupId: 7,
        teacherId: 7,
        weekday: 4,
        hour: 2,
    },
    {
        id: 8,
        subjectId: 2,
        groupId: 8,
        teacherId: 8,
        weekday: 4,
        hour: 6,
    },
    {
        id: 9,
        subjectId: 3,
        groupId: 1,
        teacherId: 9,
        weekday: 5,
        hour: 1,
    },
    {
        id: 10,
        subjectId: 1,
        groupId: 2,
        teacherId: 10,
        weekday: 5,
        hour: 4,
    },
    {
        id: 11,
        subjectId: 2,
        groupId: 3,
        teacherId: 11,
        weekday: 1,
        hour: 6,
    },
    {
        id: 12,
        subjectId: 3,
        groupId: 4,
        teacherId: 12,
        weekday: 3,
        hour: 7,
    },
]);

export const lessonCardFactory = (lesson: Lesson) =>
    cardFactory({
        typeName: "LessonCard",
        attrs: lesson,
        selfPos: {
            WeekSeg: (place) =>
                place
                    .nested
                    .find((seg) => seg.attrs.weekday.order === lesson.weekday)
                    ?.nested
                    ?.find((seg) => seg.attrs.hour === lesson.hour),
            WeekdaySeg: (place) =>
                place.nested.find((it) => it.attrs.hour === lesson.hour),
            GroupListSeg: (place) =>
                place.nested.find((it) => it.attrs.id === lesson.groupId),
            TeacherListSeg: (place) =>
                place.nested.find((it) => it.attrs.id === lesson.teacherId),
        },
        renderer: textRendererFactory(() => `*`),
    });

export function lessonListCardFactory() {
    return cardFactory({
        typeName: "LessonListCard",
        nested: eMappedFactory(lessonList, lessonCardFactory),
        zIndex: 1,
    });
}
