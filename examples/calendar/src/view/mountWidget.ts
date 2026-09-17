import {
  ICard,
  ISeg,
  ScalarElementMetaFactory,
  Widget,
  type CallbackTable,
  type EStyleSheet,
} from "xorlab";

export interface MountedWidget {
  readonly widget: Widget;
  destroy(): void;
}

export interface MountWidgetOptions {
  readonly host: HTMLElement;
  readonly vertical: ISeg;
  readonly horizontal: ISeg;
  readonly card: ICard;
  readonly styleSheet?: EStyleSheet;
  readonly callbackTable?: CallbackTable;
}

export function mountWidget(options: MountWidgetOptions): MountedWidget {
  options.host.replaceChildren();

  const widget = new Widget({
    htmlElement: options.host,
    styleSheet: options.styleSheet,
    callbackTable: options.callbackTable,
    elementMetaFactory: ScalarElementMetaFactory,
    vertical: options.vertical,
    horizontal: options.horizontal,
    card: options.card,
  });

  return {
    widget,
    destroy() {
      widget.destroy();
      options.host.replaceChildren();
    },
  };
}
