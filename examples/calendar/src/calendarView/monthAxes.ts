import {
    distinctTypeLineCollectionFactory,
    eArrayFactory,
    segFactory,
} from "xorlab";
import { WEEK_DAYS, type WeekdayDescription } from "../domain2/week";

const WEEK_NUMBERS_IN_MONTH = [0, 1, 2, 3, 4, 5] as const;
const MONTH_ROWS = [0, 1, 2, 3] as const;
const MONTH_COLS = [0, 1, 2] as const;

function weekdaySegFactory(weekday: WeekdayDescription) {
    return segFactory({
        typeName: "WeekDaySeg",
        attrs: { weekday },
    });
}

function weekSegFactory() {
    return segFactory({
        typeName: "WeekSeg",
        nested: eArrayFactory(
            WEEK_DAYS.map((weekday) => weekdaySegFactory(weekday)),
        ),
    });
}

function monthHeaderPlaceSegFactory() {
    return segFactory({
        typeName: "MonthHeaderPlaceSeg",
    });
}

function monthRowFactory(row: number) {
    return segFactory({
        typeName: "MonthRowSeg",
        attrs: { row },
        nested: distinctTypeLineCollectionFactory([
            monthHeaderPlaceSegFactory(),
            weekSegFactory(),
        ]),
    });
}

function weekNumberInMonthSegFactory(week: number) {
    return segFactory({
        typeName: "WeekNumberInMonthSeg",
        attrs: { week },
    });
}

function monthColFactory(col: number) {
    return segFactory({
        typeName: "MonthColSeg",
        attrs: { col },
        nested: eArrayFactory(
            WEEK_NUMBERS_IN_MONTH.map((week) =>
                weekNumberInMonthSegFactory(week),
            ),
        ),
    });
}

export function monthRowListSegFactory() {
    return segFactory({
        typeName: "MonthRowListSeg",
        nested: eArrayFactory(MONTH_ROWS.map((row) => monthRowFactory(row))),
    });
}

export function monthColListSegFactory() {
    return segFactory({
        typeName: "MonthColListSeg",
        nested: eArrayFactory(MONTH_COLS.map((col) => monthColFactory(col))),
    });
}
