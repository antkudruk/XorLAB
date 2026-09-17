import { cardFactory, eArrayFactory, eMappedFactory } from "xorlab";
import { MONTHS } from "../domain2/period";

const DAY_MS = 86_400_000;

function startOfDay(date: Date): Date {
    return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

function startOfWeekMonday(date: Date): Date {
    const result = startOfDay(date);
    const offset = (result.getDay() + 6) % 7;
    result.setDate(result.getDate() - offset);
    return result;
}

function formatDateIso(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
}

/** Monday-based weekday order matching WEEK_DAYS (1 = Monday … 7 = Sunday). */
function mondayBasedWeekdayOrder(date: Date): number {
    return ((date.getDay() + 6) % 7) + 1;
}

/**
 * Week row index in a traditional month grid: week 0 is the week containing
 * the 1st of the month (Monday may fall in the previous month).
 */
function weekNumberInMonthForDate(date: Date): number {
    const firstOfMonth = new Date(date.getFullYear(), date.getMonth(), 1);
    const firstWeekStart = startOfWeekMonday(firstOfMonth);
    const diffDays =
        (startOfDay(date).getTime() - firstWeekStart.getTime()) / DAY_MS;
    return Math.floor(diffDays / 7);
}

function daysInMonth(year: number, month: number): number {
    return new Date(year, month + 1, 0).getDate();
}

function dayCardFactory(date: Date) {
    const dateIso = formatDateIso(date);
    const weekdayOrder = mondayBasedWeekdayOrder(date);
    const weekIndex = weekNumberInMonthForDate(date);
    const dayOfMonth = date.getDate();

    return cardFactory({
        typeName: "DayCard",
        attrs: { dateIso },
        selfPos: {
            MonthRowSeg: (place) =>
                place.nested
                    .getItemByType("WeekSeg")
                    .nested
                    .find(
                        (weekdaySeg) =>
                            weekdaySeg.attrs.weekday.order === weekdayOrder,
                    ),
            MonthColSeg: (place) =>
                place.nested.find(
                    (weekSeg) => weekSeg.attrs.week === weekIndex,
                ),
        },
        renderer: {
            updateCardHtmlelement(_card, cardElement) {
                cardElement.innerText = `${dayOfMonth}`;
            },
        },
    });
}

function monthHeaderCardFactory(year: number, month: number) {
    const label =
        MONTHS.find((entry) => entry.month === month)?.label ??
        String(month + 1);

    return cardFactory({
        typeName: "MonthHeaderCard",
        selfPos: {
            MonthRowSeg: (place) =>
                place.nested.getItemByType("MonthHeaderPlaceSeg"),
        },
        renderer: {
            updateCardHtmlelement(_card, cardElement) {
                cardElement.innerText = `${label} ${year}`;
            },
        },
    });
}

function dayListCardFactory(year: number, month: number) {
    const lastDay = daysInMonth(year, month);
    const dates: Date[] = [];
    for (let day = 1; day <= lastDay; day++) {
        dates.push(new Date(year, month, day));
    }
    const dateCollection = eArrayFactory(dates);

    return cardFactory({
        typeName: "DayListCard",
        nested: eMappedFactory(
            dateCollection,
            (date) => dayCardFactory(date)
        ),
    });
}

export function monthCardFactory(year: number, month: number) {
    return cardFactory({
        typeName: "MonthCard",
        attrs: { month, year },
        selfPos: {
            MonthRowListSeg: (place) =>
                place.nested.find(
                    (rowSeg) =>
                        rowSeg.attrs.row === Math.floor(month / 3),
                ),
            MonthColListSeg: (place) =>
                place.nested.find(
                    (colSeg) => colSeg.attrs.col === month % 3,
                ),
        },
        nested: eArrayFactory([
            monthHeaderCardFactory(year, month),
            dayListCardFactory(year, month),
        ]),
    });
}

export function yearCardFactory(year: number) {
    const months = MONTHS.map((entry) => entry.month);
    const monthCollection = eArrayFactory(months);

    return cardFactory({
        typeName: "YearCard",
        attrs: { year },
        nested: eMappedFactory(monthCollection, (month) =>
            monthCardFactory(year, month),
        ),
    });
}
