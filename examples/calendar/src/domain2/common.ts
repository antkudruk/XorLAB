import { segFactory } from "xorlab";


export function labelPlaceSegFactory() {
    return segFactory({
        typeName: "LabelPlaceSeg",
    });
}

export function monthLabelPlaceSegFactory() {
    return segFactory({
        typeName: "MonthLabelPlaceSeg",
    });
}
