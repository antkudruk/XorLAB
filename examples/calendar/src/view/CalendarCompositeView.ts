import { ICard, ISeg, scrollableSystemFactory } from "xorlab";

export interface ScrollableCalendarLayout {
    readonly verticalContentSeg: ISeg;
    readonly horizontalContentSeg: ISeg;
    readonly widgetCard: ICard;
}

export function calendarScrollableSystemFactory(
    layout: ScrollableCalendarLayout,
) {
    return scrollableSystemFactory({
        verticalContentSeg: layout.verticalContentSeg,
        horizontalContentSeg: layout.horizontalContentSeg,
        widgetCard: layout.widgetCard,
    });
}
