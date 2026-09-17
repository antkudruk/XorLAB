const DAY_MS = 86_400_000;

function startOfDay(date: Date): Date {
    return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

function addDays(date: Date, days: number): Date {
    return new Date(date.getTime() + days * DAY_MS);
}

function startOfWeekMonday(date: Date): Date {
    const result = startOfDay(date);
    const offset = (result.getDay() + 6) % 7;
    result.setDate(result.getDate() - offset);
    return result;
}

function orderNumberInMonth(startDate: Date): number {
    const year = startDate.getFullYear();
    const month = startDate.getMonth();
    const firstOfMonth = new Date(year, month, 1);
    let firstWeekStartInMonth = startOfWeekMonday(firstOfMonth);
    if (firstWeekStartInMonth.getMonth() !== month) {
        firstWeekStartInMonth = addDays(firstWeekStartInMonth, 7);
    }
    const diffDays =
        (startDate.getTime() - firstWeekStartInMonth.getTime()) / DAY_MS;
    return Math.floor(diffDays / 7);
}

function weekStartDatesForPeriod(periodStart: Date, periodEnd: Date): Date[] {
    const start = startOfDay(periodStart);
    const end = startOfDay(periodEnd);
    if (start > end) {
        return [];
    }

    const firstWeekStart = startOfWeekMonday(start);
    const weekStarts: Date[] = [];
    let weekStart = firstWeekStart;

    while (weekStart <= end || weekStarts.length === 0) {
        const weekEnd = addDays(weekStart, 6);
        const touchesPeriod = weekStart <= end && weekEnd >= start;

        if (touchesPeriod) {
            weekStarts.push(new Date(weekStart));
        }

        weekStart = addDays(weekStart, 7);
        if (weekStart > end && weekStarts.length > 0) {
            const lastWeekStart = weekStarts[weekStarts.length - 1];
            if (addDays(lastWeekStart, 6) >= end) {
                break;
            }
        }
    }

    return weekStarts;
}

export interface WeekDescription {
    readonly orderNumber: number;
    readonly orderNumberInMonth: number;
    readonly monthNumber: number;
    readonly startDate: Date;
}

export interface MonthWeekGroup {
    readonly monthNumber: number;
    readonly weeks: WeekDescription[];
}

export interface YearMonthWeekGroup {
    readonly year: number;
    readonly months: MonthWeekGroup[];
}

export function groupWeekDescriptionsByYearAndMonth(
    weekDescriptions: WeekDescription[],
): YearMonthWeekGroup[] {
    const byYear = new Map<number, Map<number, WeekDescription[]>>();

    for (const week of weekDescriptions) {
        const year = week.startDate.getFullYear();
        const monthNumber = week.monthNumber;
        let byMonth = byYear.get(year);
        if (!byMonth) {
            byMonth = new Map();
            byYear.set(year, byMonth);
        }
        let weeks = byMonth.get(monthNumber);
        if (!weeks) {
            weeks = [];
            byMonth.set(monthNumber, weeks);
        }
        weeks.push(week);
    }

    return Array.from(byYear.entries())
        .sort(([leftYear], [rightYear]) => leftYear - rightYear)
        .map(([year, byMonth]) => ({
            year,
            months: Array.from(byMonth.entries())
                .sort(([leftMonth], [rightMonth]) => leftMonth - rightMonth)
                .map(([monthNumber, weeks]) => ({ monthNumber, weeks })),
        }));
}

/**
 * Returns week descriptions for every week that overlaps [startDate, endDate],
 * starting from the week containing startDate. Sorted by week start date.
 */
export function getWeekDescriptionsForPeriod(
    startDate: Date,
    endDate: Date,
): WeekDescription[] {
    const weekStarts = weekStartDatesForPeriod(startDate, endDate);
    return weekStarts.map((weekStart, index) => ({
        orderNumber: index,
        orderNumberInMonth: orderNumberInMonth(weekStart),
        monthNumber: weekStart.getMonth(),
        startDate: new Date(weekStart),
    }));
}
