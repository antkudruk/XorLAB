/**
 * Region-scoped slot SelectControllers for group / teacher Layer Anchors.
 *
 * Slot mode: resolve intersection from LessonListCard click → ensure a SlotCard
 * with complete attrs is nested under the stretch SlotListCard → fire() →
 * registerCards + commitValue. Shared callbackTable fans to both regions;
 * resolve*Slot no-ops when the row axis is absent on that list.
 */
import {
    type CardCoord,
    type EArray,
    type ICard,
    type MouseInteractionEvent,
} from "xorlab";
import { SelectController } from "xorlab-interactive";
import {
    applySlot,
    slotCardFactory,
    slotsEqual,
    type TimetableSlot,
} from "../domain/SlotSelection";
import { resolveGroupSlot, resolveTeacherSlot } from "./timetableSlotResolve";

export function createSlotSelect(): SelectController<TimetableSlot> {
    return new SelectController<TimetableSlot>({
        selectClassName: "SlotCard--selected",
        cardTypeName: "SlotCard",
        getValue: (card) =>
            card.typeName === "SlotCard"
                ? (card.attrs as TimetableSlot)
                : undefined,
        isEqual: slotsEqual,
    });
}

export class TimetableSlotSelect {
    constructor(
        private readonly slotListCard: ICard,
        private readonly select: SelectController<TimetableSlot>,
        private readonly axis: "group" | "teacher",
    ) {}

    handleMouseClick(
        listCard: GenCardTypes.LessonListCard,
        event: MouseInteractionEvent<CardCoord>,
    ): void {
        const slot =
            this.axis === "group"
                ? resolveGroupSlot(listCard, event)
                : resolveTeacherSlot(listCard, event);
        if (!slot) {
            return;
        }
        const slotCard = this.ensureSlotCard(slot);
        this.select.registerCards([slotCard]);
        this.select.commitValue(slot, event);
    }

    private nestedArray(): EArray<ICard[]> {
        return this.slotListCard.nested as EArray<ICard[]>;
    }

    private ensureSlotCard(slot: TimetableSlot): ICard {
        const nested = this.nestedArray();
        if (nested.length === 0) {
            const slotCard = slotCardFactory({ ...slot });
            nested.push(slotCard);
            this.slotListCard.fire();
            return slotCard;
        }
        const slotCard = nested.at(0);
        applySlot(slotCard.attrs as TimetableSlot, slot);
        slotCard.fire();
        return slotCard;
    }
}
