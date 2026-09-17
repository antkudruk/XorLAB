import {
    cardFactory,
    distinctTypeLineCollectionFactory,
    eArrayFactory,
    segFactory,
    tableFactory,
} from "xorlab";
import { SelectController } from "xorlab-interactive";
import { labelPlaceSegFactory, monthLabelPlaceSegFactory } from "./common";
import { weekSegFactory } from "./week";
import { periodSegFactory } from "./period";

export const START_DATE = new Date(2025, 10, 1);
export const END_DATE = new Date(2026, 4, 31);

export function rowsHeaderSegFactory() {
    return segFactory({
        typeName: "RowsHeaderSeg",
        nested: distinctTypeLineCollectionFactory([
            labelPlaceSegFactory(),
            monthLabelPlaceSegFactory(),
            weekSegFactory(),
        ]),
    });
}

export function columnsHeaderSegFactory() {
    return segFactory({
        typeName: "ColumnsHeaderSeg",
        nested: distinctTypeLineCollectionFactory([
            labelPlaceSegFactory(),
            periodSegFactory(START_DATE, END_DATE),
        ]),
    });
}

export function calendarCardFactory() {
    return cardFactory({
        typeName: "CalendarCard",
        nested: eArrayFactory([            
            tableFactory({
                mainLine: "PeriodSeg",
                orthoLine: "WeekSeg",
                selfPos: {
                    RowsHeaderSeg: (place) => place.nested.getItemByType("WeekSeg"),
                    ColumnsHeaderSeg: (place) => place.nested.getItemByType("PeriodSeg"),
                },
            }),
            tableFactory({
                mainLine: "PeriodSeg",
                orthoLine: "MonthLabelPlaceSeg",
                selfPos: {
                    RowsHeaderSeg: (place) => place.nested.getItemByType("MonthLabelPlaceSeg"),
                    ColumnsHeaderSeg: (place) => place.nested.getItemByType("PeriodSeg"),
                },
            }),
            tableFactory({
                mainLine: "PeriodSeg",
                orthoLine: "LabelPlaceSeg",
                selfPos: {
                    RowsHeaderSeg: (place) => place.nested.getItemByType("LabelPlaceSeg"),
                    ColumnsHeaderSeg: (place) => place.nested.getItemByType("PeriodSeg"),
                },
            }),
            tableFactory({
                mainLine: "WeekSeg",
                orthoLine: "LabelPlaceSeg",
                selfPos: {
                    RowsHeaderSeg: (place) => place.nested.getItemByType("WeekSeg"),
                    ColumnsHeaderSeg: (place) => place.nested.getItemByType("LabelPlaceSeg"),
                },
            }),
        ]),
    });
}

export function createCalendarLayout() {
    const daySelect = new SelectController<string>({
        selectClassName: "DayCard--selected",
        cardTypeName: "DayCard",
        getValue: (card) =>
            card.typeName === "DayCard"
                ? (card.attrs as { dateIso: string }).dateIso
                : undefined,
    });

    return {
        widgetCard: calendarCardFactory(),
        daySelect,
        verticalContentSeg: rowsHeaderSegFactory(),
        horizontalContentSeg: columnsHeaderSegFactory(),
    };
}
