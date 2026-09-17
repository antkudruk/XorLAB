import {
  scrollableSystemFactory,
  type ICard,
  type ISeg,
} from "xorlab";
import { mountWidget } from "./mountWidget";
import { createPoissonsStyleSheet } from "./styleSheet";

export interface Layout {
  readonly rowsHeaderSeg: ISeg;
  readonly columnsHeaderSeg: ISeg;
  readonly widgetCard: ICard;
}

export function mountLayout(host: HTMLElement, layout: Layout) {
  const { vertical, horizontal, card } = scrollableSystemFactory({
    verticalContentSeg: layout.rowsHeaderSeg,
    horizontalContentSeg: layout.columnsHeaderSeg,
    widgetCard: layout.widgetCard,
  });
  return mountWidget({
    host,
    vertical: vertical,
    horizontal: horizontal,
    card,
    styleSheet: createPoissonsStyleSheet(),
  });
}
