import { cardFactory, eArrayFactory, segFactory, tableFactory, textRendererFactory } from "xorlab";

function hourSegFactory(hour: number) {
    return segFactory({
        typeName: "HourSeg",
        attrs: { hour },
        cardFactories: {
            HourPlaceSeg: () => cardFactory({
                typeName: "HourHeaderCard",
                renderer: textRendererFactory(() => `${hour}`),
            }),
        },
    });
}

function weekdaySegFactory(weekday: { order: number, name: string }) {
    return segFactory({
        typeName: "WeekdaySeg",
        nested: eArrayFactory([
            hourSegFactory(1),
            hourSegFactory(2),
            hourSegFactory(3),
            hourSegFactory(4),
            hourSegFactory(5),
            hourSegFactory(6),
            hourSegFactory(7),
        ]),
        attrs: { weekday },
        cardFactories: {
            TimePlaceSeg: (ortho, self) => ortho.extrude(self),
            WeekdayPlaceSeg: (ortho, self) => ortho.extrude(self),
            HourPlaceSeg: () => tableFactory({ mainLine: "WeekdaySeg", orthoLine: "HourPlaceSeg" }),
        },
    });
}


export function weekSegFactory() {
    return segFactory({
        typeName: "WeekSeg",
        nested: eArrayFactory([
            weekdaySegFactory({ order: 1, name: "Monday" }),
            weekdaySegFactory({ order: 2, name: "Tuesday" }),
            weekdaySegFactory({ order: 3, name: "Wednesday" }),
            weekdaySegFactory({ order: 4, name: "Thursday" }),
            weekdaySegFactory({ order: 5, name: "Friday" }),
        ]),
        cardFactories: {
            TimePlaceSeg: (ortho, self) => self.extrude(ortho)
        },
    });
}



export const weekdayPlaceSegFactory = () => segFactory({
    typeName: "WeekdayPlaceSeg",
    cardFactories: {
        WeekdaySeg: (ortho) => cardFactory({
            typeName: "WeekdayHeaderCard",
            attrs: { weekday: ortho.attrs.weekday },
            renderer: textRendererFactory(() => `${ortho.attrs.weekday.name}`),
        })
    },
});

export const hourPlaceSegFactory = () => segFactory({
    typeName: "HourPlaceSeg",
    cardFactories: {
        WeekdaySeg: (ortho, self) => ortho.extrude(self),
        HourSeg: (ortho) => cardFactory({
            typeName: "HourVerticalHeaderCard",
            attrs: { hour: ortho.attrs.hour },
            renderer: textRendererFactory(() => `${ortho.attrs.hour}`),
        })
    },
});

export const hourPlaceSeg = hourPlaceSegFactory();

export const timePlaceSegFactory = () => segFactory({
    typeName: "TimePlaceSeg",
    nested: eArrayFactory([
        weekdayPlaceSegFactory(),
        hourPlaceSeg,
    ]),
    cardFactories: {
        WeekdaySeg: () => tableFactory({
            mainLine: "TimePlaceSeg",
            orthoLine: "WeekdaySeg",
        }),
    }
});

export const weekSeg = weekSegFactory();
export const timePlaceSeg = timePlaceSegFactory();

export function timeHeaderCardFactory() {
    return tableFactory({
        mainLine: "WeekSeg",
        orthoLine: "TimePlaceSeg",
        selfPos: {
            TimetableHorizontalSeg: (place) => place.nested.getItemByType("WeekSeg"),
            TimetableVerticalSeg: (place) => place.nested.getItemByType("TimePlaceSeg"),
        },
    });
}

export const timeHeaderCard = timeHeaderCardFactory();
