import type { CalendarParameters, WeekStartsOn } from "../domain/calendarDates";

export interface ParametersPopupOptions {
  readonly dialog: HTMLDialogElement;
  readonly form: HTMLFormElement;
  readonly openButton: HTMLButtonElement;
  readonly cancelButton: HTMLButtonElement;
  readonly yearInput: HTMLInputElement;
  readonly weekStartSelect: HTMLSelectElement;
  readonly onApply: (params: CalendarParameters) => void;
}

export function setupParametersPopup(
  options: ParametersPopupOptions,
  initial: CalendarParameters,
): void {
  options.yearInput.value = String(initial.year);
  options.weekStartSelect.value = initial.weekStartsOn;

  options.openButton.addEventListener("click", () => {
    options.yearInput.value = String(initial.year);
    options.weekStartSelect.value = initial.weekStartsOn;
    options.dialog.showModal();
  });

  options.cancelButton.addEventListener("click", () => {
    options.dialog.close();
  });

  options.form.addEventListener("submit", (event) => {
    event.preventDefault();
    const year = Number(options.yearInput.value);
    const weekStartsOn = options.weekStartSelect.value as WeekStartsOn;
    if (!Number.isFinite(year) || year < 1) {
      return;
    }
    options.onApply({ year, weekStartsOn });
    options.dialog.close();
  });
}

export function readDefaultParameters(): CalendarParameters {
  return {
    year: new Date().getFullYear(),
    weekStartsOn: "monday",
  };
}
