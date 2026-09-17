import { cardFactory, eArrayFactory, segFactory, tableFactory, textRendererFactory } from "xorlab";
import {
    getWeekDescriptionsForPeriod,
    groupWeekDescriptionsByYearAndMonth,
    type MonthWeekGroup,
    type WeekDescription,
    type YearMonthWeekGroup,
} from "./weekDescriptions";


/*
Horizontal header.
*/
export interface MonthDescription {
    readonly month: number;
    readonly label: string;
}

export const MONTHS = [
    { month: 0, label: "January" },
    { month: 1, label: "February" },
    { month: 2, label: "March" },
    { month: 3, label: "April" },
    { month: 4, label: "May" },
    { month: 5, label: "June" },
    { month: 6, label: "July" },
    { month: 7, label: "August" },
    { month: 8, label: "September" },
    { month: 9, label: "October" },
    { month: 10, label: "November" },
    { month: 11, label: "December" },
];

function weekNumberSegFactory(week: WeekDescription) {
    return segFactory({
        typeName: "WeekNumberSeg",
        attrs: week,
        cardFactories: {
            LabelPlaceSeg: (_, self) =>
                cardFactory({
                    renderer: textRendererFactory(
                        () => `${self.attrs.orderNumberInMonth + 1}`,
                    ),
                }),
            WeekSeg: (ortho, self) => ortho.extrude(self),
        },
    });
}

function monthSegFactory(monthGroup: MonthWeekGroup) {
    return segFactory({
        typeName: "MonthSeg",
        attrs: MONTHS[monthGroup.monthNumber],
        nested: eArrayFactory(monthGroup.weeks.map(weekNumberSegFactory)),
        cardFactories: {
            WeekSeg: (ortho, self) => self.extrude(ortho),
            LabelPlaceSeg: (_, self) =>
                cardFactory({
                    renderer: textRendererFactory(() => self.attrs.label),
                }),
            MonthLabelPlaceSeg: (_, self) => {
                const monthNumber = self.attrs.month + 1;
                const monthModifier =
                    monthNumber % 2 === 1
                        ? "MonthHeaderCard--oddMonth"
                        : "MonthHeaderCard--evenMonth";

                return cardFactory({
                    typeName: "MonthHeaderCard",
                    renderer: {
                        updateCardHtmlelement(_card, cardElement) {
                            cardElement.innerText = self.attrs.label;
                            cardElement.classList.add(monthModifier);
                        },
                    },
                });
            },
        },
    });
}

function yearSegFactory(yearGroup: YearMonthWeekGroup) {
    return segFactory({
        typeName: "YearSeg",
        attrs: { year: yearGroup.year },
        nested: eArrayFactory(yearGroup.months.map(monthSegFactory)),
        cardFactories: {
            WeekSeg: (ortho, self) => self.extrude(ortho),
            LabelPlaceSeg: (_, self) =>
                cardFactory({
                    renderer: textRendererFactory(
                        () => `${self.attrs.year}`,
                    ),
                }),
            MonthLabelPlaceSeg: (ortho, self) => self.extrude(ortho),
        },
    });
}

export function periodSegFactory(startDate: Date, endDate: Date) {
    const weekDescriptions = getWeekDescriptionsForPeriod(startDate, endDate);
    const yearGroups = groupWeekDescriptionsByYearAndMonth(weekDescriptions);

    return segFactory({
        typeName: "PeriodSeg",
        nested: eArrayFactory(yearGroups.map(yearSegFactory)),
        cardFactories: {
            WeekSeg: (ortho, self) => self.extrude(ortho),
        },
    });
}
