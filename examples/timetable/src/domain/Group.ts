import { cardFactory, eArrayFactory, eMappedFactory, segFactory, tableFactory, textRendererFactory } from "xorlab";

export interface Group {
    readonly id: number;
    readonly name: string;
}

export const groupList = eArrayFactory<Group[]>([
    { id: 1, name: "Griffindor-1"},
    { id: 2, name: "Griffindor-2"},
    { id: 3, name: "Slytherin-1"},
    { id: 4, name: "Slytherin-2"},
    { id: 5, name: "Hufflepuff-1"},
    { id: 6, name: "Hufflepuff-2"},
    { id: 7, name: "Ravenclaw-1"},
    { id: 8, name: "Ravenclaw-2"},
]);

export const groupSegFactory = (group: Group) => segFactory({
    typeName: "GroupSeg",
    attrs: group,
    cardFactories: {
        GroupHeaderSeg(ortho, self) {
            return cardFactory({
                typeName: "GroupHeaderCard",
                renderer: textRendererFactory(() => `${self.attrs.name}`),
            });
        },
        TeacherColumnsSeg: (ortho, self) => 
            cardFactory({
                typeName: "GroupRowCard",
                renderer: textRendererFactory(() => `${self.attrs.name}`)
            }),
    },
});


export const groupListSeg = segFactory({
    typeName: "GroupListSeg",
    nested: eMappedFactory(groupList, groupSegFactory),
    cardFactories: {
        GroupHeaderSeg: (ortho, self) => self.extrude(ortho),
    }
});

export const groupHeaderSeg = segFactory({
    typeName: "GroupHeaderSeg"
});

export const groupTableFactory = () => {
    const result = tableFactory({
        mainLine: "GroupListSeg",
        orthoLine: "TeacherColumnsSeg",
        selfPos: {
            TimetableHorizontalSeg: (place) => place.nested.getItemByType("TeacherColumnsSeg"),
            TimetableVerticalSeg: (place) => place.nested.getItemByType("GroupListSeg"),
        }
    });
    return result;
}
