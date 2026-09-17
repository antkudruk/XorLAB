import type { EStyleSheet } from "xorlab";

const GROUP_CARD_SIZE = "56px";
const PERIOD_CARD_SIZE = "56px";

export function createPeriodicTableStyleSheet(): EStyleSheet {
  return {
    LabelPlaceSeg: { window: "40px" },
    GroupSeg: { window: GROUP_CARD_SIZE },
    GroupListSeg: { window: "100flex" },
    PeriodSeg: { window: PERIOD_CARD_SIZE },
    PeriodListSeg: { window: "100flex" },
    RowsHeaderSeg: { window: "100flex" },
    ColumnsHeaderSeg: { window: "100flex" },
  };
}
