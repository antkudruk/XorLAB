import { cardFactory, eArrayFactory, ISeg, segFactory } from "xorlab";

export interface Teacher {
    readonly name: string;
}

export const teacherCardFactory = () => cardFactory({
    typeName: "TeacherCard",
});

export const teacherSeg = segFactory({
    typeName: "TeacherSeg",
    attrs: { name: "Ada" } as Teacher,
});

export const horizontalTeacherSeg = segFactory({
    typeName: "HorizontalTeacherSeg",
    nested: eArrayFactory([
        segFactory({
            typeName: "TeacherColumnSeg",
            cardFactories: {
                TeacherSeg: () => teacherCardFactory(),
            },
        }) as ISeg,
    ]),
    cardFactories: {
        TeacherSeg: () => teacherCardFactory(),
    },
});
