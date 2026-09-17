import {
  ICard,
  ISeg,
  ScalarElementMetaFactory,
  Widget,
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
}

export function mountWidget(options: MountWidgetOptions) {
  options.host.replaceChildren();

  const widget = new Widget({
    htmlElement: options.host,
    styleSheet: options.styleSheet,
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
