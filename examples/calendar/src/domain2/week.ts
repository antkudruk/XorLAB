import { cardFactory, eArrayFactory, segFactory, textRendererFactory } from "xorlab";

export interface WeekdayDescription {
    readonly order: number;
    readonly label: string;
}

export const WEEK_DAYS: WeekdayDescription[] = [
    { order: 1, label: "Monday" },
    { order: 2, label: "Tuesday" },
    { order: 3, label: "Wednesday" },
    { order: 4, label: "Thursday" },
    { order: 5, label: "Friday" },
    { order: 6, label: "Saturday" },
    { order: 7, label: "Sunday" },
];

function formatDateIso(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
}

export function weekSegFactory() {
    return segFactory({
        typeName: "WeekSeg",
        nested: eArrayFactory(
            WEEK_DAYS.map((weekday) => weekdaySegFactory(weekday)),
        ),
        cardFactories: {
            WeekNumberSeg: (ortho, self) => ortho.extrude(self),
        },
    });
}

export function weekdaySegFactory(weekday: WeekdayDescription) {
    return segFactory({
        typeName: "WeekDaySeg",
        attrs: { weekday },
        cardFactories: {
            LabelPlaceSeg: (_, self) =>
                cardFactory({
                    typeName: "WeekdayHeaderCard",
                    renderer: textRendererFactory(
                        () => self.attrs.weekday.label,
                    ),
                }),
            WeekNumberSeg: (ortho, self) => {
                const date = new Date(ortho.attrs.startDate);
                date.setDate(date.getDate() + self.attrs.weekday.order - 1);
                const dateIso = formatDateIso(date);
                const monthNumber = date.getMonth() + 1;
                const monthModifier =
                    monthNumber % 2 === 1 ? "DayCard--oddMonth" : "DayCard--evenMonth";

                return cardFactory({
                    typeName: "DayCard",
                    attrs: { dateIso },
                    renderer: {
                        updateCardHtmlelement(_card, cardElement) {
                            cardElement.innerText = `${date.getDate()}`;
                            cardElement.classList.add(monthModifier);
                        },
                    },
                });
            }
        },
    });
}
