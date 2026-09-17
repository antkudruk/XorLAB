/**
 * Type Partition slot-selection display cards for timetable Layer Anchors.
 *
 * Under GroupTimetableCard / TeacherTimetableCard, a stretch list card holds the
 * SlotCard **only while a slot is selected**. Nest the card with complete attrs on
 * select; leave the list empty when cleared. SelectController slot mode: ensure the
 * SlotCard exists, call `fire()`, then `commitValue(slot, event)`.
 *
 * Do **not** gate `selfPos` on completeness checks (`isComplete*`). If the SlotCard
 * is nested, attrs are already complete; if nothing is selected, the SlotCard is
 * absent and `selfPos` never runs. Guarding `selfPos` for incomplete attrs papers
 * over a lifecycle bug.
 *
 * @see ../../../../README.md#type-partition-pattern
 * @see ../../../../README.md#selectcontroller
 */
import {
    cardFactory,
    eArrayFactory,
} from "xorlab";

/** Complete grid intersection; `rowId` is GroupSeg.id or TeacherSeg.id. */
export type TimetableSlot = {
    weekday: number;
    hour: number;
    rowId: number;
};

export function slotsEqual(a: TimetableSlot, b: TimetableSlot): boolean {
    return a.weekday === b.weekday && a.hour === b.hour && a.rowId === b.rowId;
}

export function applySlot(attrs: TimetableSlot, slot: TimetableSlot): void {
    attrs.weekday = slot.weekday;
    attrs.hour = slot.hour;
    attrs.rowId = slot.rowId;
}

/**
 * Create a SlotCard for a selected slot. Pass a complete `TimetableSlot` — do not
 * nest this card until a slot is selected, and do not check completeness in `selfPos`.
 */
export function slotCardFactory(slot: TimetableSlot) {
    return cardFactory({
        typeName: "SlotCard",
        attrs: slot,
        selfPos: {
            WeekSeg: (place) =>
                place.nested
                    .find((seg) => seg.attrs.weekday.order === slot.weekday)
                    ?.nested?.find((seg) => seg.attrs.hour === slot.hour),
            WeekdaySeg: (place) =>
                place.nested.find((it) => it.attrs.hour === slot.hour),
            GroupListSeg: (place) =>
                place.nested.find((it) => it.attrs.id === slot.rowId),
            TeacherListSeg: (place) =>
                place.nested.find((it) => it.attrs.id === slot.rowId),
        },
    });
}

/** Stretch container; nested stays empty until a slot is selected. */
export function slotListCardFactory() {
    return cardFactory({
        typeName: "SlotListCard",
        nested: eArrayFactory([]),
        zIndex: 0,
    });
}
