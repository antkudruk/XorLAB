import {
  cardFactory,
  eArrayFactory,
  eMappedFactory,
  segFactory,
  textRendererFactory,
} from "xorlab";
import { GroupEntry } from "./types";

export function createGroupEntries(): GroupEntry[] {
  return Array.from({ length: 18 }, (_, index) => {
    const group = index + 1;
    return {
      id: group,
      group,
      label: `Group ${group}`,
    };
  });
}

export function createGroupListSeg(groupEntries: GroupEntry[]) {
  const groupCollection = eArrayFactory<GroupEntry[]>(groupEntries);

  return segFactory({
    typeName: "GroupListSeg",
    nested: eMappedFactory(groupCollection, (groupEntry) =>
      segFactory({
        typeName: "GroupSeg",
        attrs: groupEntry,
        cardFactories: {
          LabelPlaceSeg: (_, self) =>
            cardFactory({
              typeName: "GroupHeaderCard",
              renderer: textRendererFactory(() => String(self.attrs.group)),
            }),
        },
      })
    ),
  });
}
