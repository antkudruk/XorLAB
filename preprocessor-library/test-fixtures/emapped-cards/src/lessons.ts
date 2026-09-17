import { cardFactory, eArrayFactory, eMappedFactory } from "xorlab";

export interface Lesson {
    readonly id: number;
}

export const lessonList = eArrayFactory<Lesson[]>([{ id: 1 }]);

export const LessonCardFactory = (lesson: Lesson) => cardFactory({
    typeName: "LessonCard",
    attrs: lesson,
});

export const lessonListCardFactory = () => cardFactory({
    typeName: "LessonListCard",
    nested: eMappedFactory(lessonList, LessonCardFactory),
});
