/**
 * Resolves WeekdaySeg / HourSeg under WeekSeg and row segments under
 * GroupListSeg / TeacherListSeg at a LessonListCard coordinate.
 *
 * Prefer CoordHelper.fold over nested childSegAtCoord + manual local offsets.
 * Returns undefined when a place seg is missing or no nested seg covers the pointer
 * (CoordHelper.inner throws on miss).
 */
import type { CardCoord, MouseInteractionEvent } from "xorlab";
import type { TimetableSlot } from "../domain/SlotSelection";

export function resolveWeekdayHour(
    listCard: GenCardTypes.LessonListCard,
    event: MouseInteractionEvent<CardCoord>,
): { weekday: number; hour: number } | undefined {
    const weekSeg = listCard.getBasis().getOneByTypeName("WeekSeg");
    if (!weekSeg) {
        return undefined;
    }

    const localX = event.local[0];
    try {
        return weekSeg
            .coordHelper(localX, event.widgetTreeUuids.horizontal)
            .inner()
            .fold((weekdaySeg) => ({ weekday: weekdaySeg.attrs.weekday.order }))
            .inner()
            .fold((hourSeg) => ({ hour: hourSeg.attrs.hour }))
            .get();
    } catch {
        return undefined;
    }
}

function resolveGroupRowId(
    listCard: GenCardTypes.LessonListCard,
    event: MouseInteractionEvent<CardCoord>,
): number | undefined {
    const groupList = listCard.getBasis().getOneByTypeName("GroupListSeg");
    if (!groupList) {
        return undefined;
    }

    const localY = event.local[1];
    try {
        return groupList
            .coordHelper(localY, event.widgetTreeUuids.vertical)
            .inner()
            .fold((groupSeg) => ({ rowId: groupSeg.attrs.id }))
            .get().rowId;
    } catch {
        return undefined;
    }
}

function resolveTeacherRowId(
    listCard: GenCardTypes.LessonListCard,
    event: MouseInteractionEvent<CardCoord>,
): number | undefined {
    const teacherList = listCard.getBasis().getOneByTypeName("TeacherListSeg");
    if (!teacherList) {
        return undefined;
    }

    const localY = event.local[1];
    try {
        return teacherList
            .coordHelper(localY, event.widgetTreeUuids.vertical)
            .inner()
            .fold((teacherSeg) => ({ rowId: teacherSeg.attrs.id }))
            .get().rowId;
    } catch {
        return undefined;
    }
}

export function resolveGroupSlot(
    listCard: GenCardTypes.LessonListCard,
    event: MouseInteractionEvent<CardCoord>,
): TimetableSlot | undefined {
    const time = resolveWeekdayHour(listCard, event);
    const rowId = resolveGroupRowId(listCard, event);
    if (!time || rowId === undefined) {
        return undefined;
    }
    return { weekday: time.weekday, hour: time.hour, rowId };
}

export function resolveTeacherSlot(
    listCard: GenCardTypes.LessonListCard,
    event: MouseInteractionEvent<CardCoord>,
): TimetableSlot | undefined {
    const time = resolveWeekdayHour(listCard, event);
    const rowId = resolveTeacherRowId(listCard, event);
    if (!time || rowId === undefined) {
        return undefined;
    }
    return { weekday: time.weekday, hour: time.hour, rowId };
}
