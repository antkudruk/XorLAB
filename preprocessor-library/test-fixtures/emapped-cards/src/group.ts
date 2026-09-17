import { cardFactory, eArrayFactory } from "xorlab";
import { lessonListCardFactory } from "./lessons";

export const groupTimetableCardFactory = () => cardFactory({
    typeName: "GroupTimetableCard",
    nested: eArrayFactory([lessonListCardFactory()]),
});
