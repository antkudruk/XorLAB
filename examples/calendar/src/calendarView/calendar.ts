import { SelectController } from "xorlab-interactive";
import { monthColListSegFactory, monthRowListSegFactory } from "./monthAxes";
import { yearCardFactory } from "./monthCards";

export const MONTHLY_GRID_YEAR = 2025;

export interface MonthlyGridLayout {
    widgetCard: GenCardTypes.YearCard;
    daySelect: SelectController<string>;
    verticalContentSeg: GenSegTypes.MonthRowListSeg;
    horizontalContentSeg: GenSegTypes.MonthColListSeg;
}

export function createMonthlyGridLayout(year: number = MONTHLY_GRID_YEAR): MonthlyGridLayout {
    const daySelect = new SelectController<string>({
        selectClassName: "DayCard--selected",
        cardTypeName: "DayCard",
        getValue: (card) =>
            card.typeName === "DayCard"
                ? (card.attrs as { dateIso: string }).dateIso
                : undefined,
    });

    return {
        widgetCard: yearCardFactory(year),
        daySelect,
        verticalContentSeg: monthRowListSegFactory(),
        horizontalContentSeg: monthColListSegFactory(),
    };
}
