import { cardFactory, eArrayFactory, eMappedFactory, segFactory, tableFactory, TEXT_RENDERER, VALUE_RENDERER } from "xorlab";


export interface Teacher {
    readonly id: number;
    readonly firstName: string;
    readonly lastName: string;
}

export const teacherList = eArrayFactory<Teacher[]>([
    { id: 1, firstName: "John", lastName: "Doe" },
    { id: 2, firstName: "Jane", lastName: "Smith" },
    { id: 3, firstName: "Jim", lastName: "Beam" },
    { id: 4, firstName: "Jill", lastName: "Johnson" },
    { id: 5, firstName: "Jack", lastName: "Daniels" },
    { id: 6, firstName: "Jill", lastName: "Johnson" },
    { id: 7, firstName: "Jack", lastName: "Daniels" },
    { id: 8, firstName: "Jill", lastName: "Johnson" },
    { id: 9, firstName: "Jack", lastName: "Daniels" },
    { id: 10, firstName: "Jill", lastName: "Johnson" },
    { id: 11, firstName: "Jack", lastName: "Daniels" },
    { id: 12, firstName: "Jill", lastName: "Johnson" },
    { id: 13, firstName: "Jack", lastName: "Daniels" },
    { id: 14, firstName: "Jill", lastName: "Johnson" },
    { id: 15, firstName: "Jack", lastName: "Daniels" },
]);

export const teacherSegFactory = (teacher: Teacher) => segFactory({
    typeName: "TeacherSeg",
    attrs: teacher,
    cardFactories: {
        TeacherColumnsSeg: (ortho, self) => {
            return ortho.extrude(self);
        }
    },
});


export const teacherListSeg = segFactory({
    typeName: "TeacherListSeg",
    nested: eMappedFactory(teacherList, teacherSegFactory),
    cardFactories: {
        TeacherColumnsSeg: (ortho, self) => {
            return self.extrude(ortho);
        }
    },
});


export const teacherHeaderPlaceSeg = segFactory({
    typeName: "TeacherHeaderPlaceSeg", 
});

export const teacherVerticalSeg = segFactory({
    nested: eArrayFactory([
        teacherHeaderPlaceSeg,
        teacherListSeg
    ])
});

export const teacherColumnsSeg = segFactory({
    typeName: "TeacherColumnsSeg",
    nested: eArrayFactory([
        segFactory({
            typeName: "TeacherIdColumnSeg",
            cardFactories: {
                TeacherHeaderPlaceSeg: () => cardFactory({ attrs: { text: "Id" }, renderer: TEXT_RENDERER }),
                TeacherSeg: (ortho) => {
                    return cardFactory({ attrs: { value: String(ortho.attrs.id) }, renderer: VALUE_RENDERER });
                }
            }
        }),
        segFactory({
            typeName: "TeacherFirstNameColumnSeg",
            cardFactories: {
                TeacherHeaderPlaceSeg: () => cardFactory({ attrs: { text: "First Name" }, renderer: TEXT_RENDERER }),
                TeacherSeg: (ortho) => {
                    return cardFactory({ attrs: { value: ortho.attrs.firstName }, renderer: VALUE_RENDERER });
                }
            }
        }),
        segFactory({
            typeName: "TeacherLastNameColumnSeg",
            cardFactories: {
                TeacherHeaderPlaceSeg: () => cardFactory({ attrs: { text: "Last Name" }, renderer: TEXT_RENDERER }),
                TeacherSeg: (ortho) => {
                    return cardFactory({ attrs: { value: ortho.attrs.lastName }, renderer: VALUE_RENDERER });
                }
            }
        })
    ]),
    cardFactories: {
        TeacherSeg: (ortho, self) => {
            return cardFactory({
                typeName: "TeacherDetailsCard",
                nested: eMappedFactory(self.nested, (colSeg) =>
                    colSeg.extrude(ortho),
                ),
            });
        },
        TeacherListSeg: (ortho, self) => {
            return self.extrude(ortho);
        },
        TeacherHeaderPlaceSeg: (ortho, self) => {
            return ortho.extrude(self);
        },
        GroupListSeg: (ortho, self) => ortho.extrude(self),
    }
});

export function teacherListCardFactory() {
    return tableFactory({
        mainLine: "TeacherListSeg",
        orthoLine: "TeacherColumnsSeg",
        selfPos: {
            TimetableHorizontalSeg: (place) => place.nested.getItemByType("TeacherColumnsSeg"),
            TimetableVerticalSeg: (place) => place.nested.getItemByType("TeacherListSeg"),
        },
    });
}

export const teacherListCard = teacherListCardFactory();

