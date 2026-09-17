/**
 * LessonCard drag that reschedules lessons via attrs weekday/hour.
 *
 * One instance per LessonListCard region (GroupTimetableCard vs TeacherTimetableCard).
 * Mouse handlers live on LessonListCard so `event.local` is already WeekSeg-aligned.
 * Shared callbackTable may fan events to both region controllers; foreign regions no-op
 * via DragController.containsCard on begin (no listCard identity checks).
 *
 * Reactive chain (do not set div left/top directly):
 * 1. mouseDown on LessonListCard → childCardAtCoord → begin(lesson)
 * 2. mouseDrag → CoordHelper fold on WeekSeg → mutate weekday/hour
 * 3. DragController calls dragged card.fire(); this helper fires the sibling region's card
 * 4. selfPos rebinds HourSeg → CardVi updates DOM
 *
 * Row placement stays fixed because `groupId` / `teacherId` are not updated by the callback.
 * Nested LessonListCard is a uniform EMapped of LessonCard — trust typed hits, no typeName guards.
 */
import {
    type CardCoord,
    type MouseInteractionEvent,
} from "xorlab";
import { DragController } from "xorlab-interactive";
import { type Lesson } from "../domain/Lesson";
import { resolveWeekdayHour } from "./timetableSlotResolve";

export class TimetableLessonDrag {
    private readonly dragController: DragController;
    private readonly siblingListCard?: GenCardTypes.LessonListCard;

    constructor(
        listCard: GenCardTypes.LessonListCard,
        siblingListCard?: GenCardTypes.LessonListCard,
    ) {
        this.siblingListCard = siblingListCard;
        this.dragController = new DragController({
            regionCard: listCard,
            updateAttrs: ({ card, regionCard, event }) => {
                const lesson = (card as GenCardTypes.LessonCard).attrs as Lesson;
                const target = resolveWeekdayHour(
                    regionCard as GenCardTypes.LessonListCard,
                    event as MouseInteractionEvent<CardCoord>,
                );
                if (!target) {
                    return;
                }
                if (target.weekday === lesson.weekday && target.hour === lesson.hour) {
                    return;
                }
                lesson.weekday = target.weekday;
                lesson.hour = target.hour;
                this.fireSiblingCard(lesson.id);
            },
        });
    }

    destroy(): void {
        this.dragController.clear();
    }

    handleMouseDown(
        listCard: GenCardTypes.LessonListCard,
        event: MouseInteractionEvent<CardCoord>,
    ): void {
        const local = event.local;
        const hit = listCard.childCardAtCoord(local);
        if (!hit) {
            return;
        }
        this.dragController.begin(hit, event);
    }

    handleMouseDrag(
        _listCard: GenCardTypes.LessonListCard,
        event: MouseInteractionEvent,
    ): void {
        this.dragController.move(event);
    }

    handleMouseUp(
        _listCard: GenCardTypes.LessonListCard,
        event: MouseInteractionEvent,
    ): void {
        this.dragController.end(event);
    }

    private fireSiblingCard(lessonId: number): void {
        const siblingList = this.siblingListCard;
        if (!siblingList) {
            return;
        }
        siblingList.nested.forEach((nested) => {
            if (nested.attrs.id === lessonId) {
                nested.fire();
            }
        });
    }
}

export function createGroupLessonDrag(
    listCard: GenCardTypes.LessonListCard,
    siblingListCard?: GenCardTypes.LessonListCard,
): TimetableLessonDrag {
    return new TimetableLessonDrag(listCard, siblingListCard);
}

export function createTeacherLessonDrag(
    listCard: GenCardTypes.LessonListCard,
    siblingListCard?: GenCardTypes.LessonListCard,
): TimetableLessonDrag {
    return new TimetableLessonDrag(listCard, siblingListCard);
}
