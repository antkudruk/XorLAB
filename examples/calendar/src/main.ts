import "./app.css";
import {
  mountDomain2Calendar,
  mountMonthlyGridCalendar,
} from "./view/renderCalendar";
import { mountDiscoverPage } from "./view/renderDiscover";
import {
  formatDaySelectionStatus,
  parseDaySelection,
} from "./view/parseDaySelection";

const isDiscoverPath =
  location.pathname === "/discover" ||
  location.pathname === "/discover/" ||
  location.pathname.endsWith("/discover") ||
  location.pathname.endsWith("/discover/");

if (isDiscoverPath) {
  mountDiscoverPage();
} else {
  const host = document.querySelector<HTMLElement>("#calendar-grid-host");
  const monthlyHost = document.querySelector<HTMLElement>("#monthly-grid-host");
  const statusElement = document.querySelector<HTMLElement>("#calendar-status");
  const monthlyStatusElement = document.querySelector<HTMLElement>(
    "#monthly-grid-status",
  );
  const selectionInput = document.querySelector<HTMLInputElement>(
    "#calendar-selection-input",
  );
  const selectionApply = document.querySelector<HTMLButtonElement>(
    "#calendar-selection-apply",
  );
  const selectionError = document.querySelector<HTMLElement>(
    "#calendar-selection-error",
  );

  if (!host || !monthlyHost) {
    throw new Error("Calendar example markup is missing required elements.");
  }

  const { daySelect } = mountDomain2Calendar(host);
  const { daySelect: monthlyDaySelect } = mountMonthlyGridCalendar(monthlyHost);

  function syncStatus(dateIso: string | undefined): void {
    if (statusElement) {
      statusElement.textContent = formatDaySelectionStatus(dateIso);
    }
  }

  function syncMonthlyStatus(dateIso: string | undefined): void {
    if (monthlyStatusElement) {
      monthlyStatusElement.textContent = formatDaySelectionStatus(dateIso);
    }
  }

  function applySelectionInput(): void {
    if (!selectionInput || !selectionError) {
      return;
    }
    const parsed = parseDaySelection(selectionInput.value);
    if (parsed === null) {
      selectionError.textContent = "Use YYYY-MM-DD, for example 2025-12-15.";
      selectionError.hidden = false;
      return;
    }
    selectionError.hidden = true;
    if (parsed === undefined) {
      daySelect.clear();
    } else {
      daySelect.value = parsed;
    }
    syncStatus(parsed);
  }

  if (statusElement) {
    syncStatus(daySelect.value);

    daySelect.onChange = (dateIso) => {
      syncStatus(dateIso);
      if (selectionInput && dateIso) {
        selectionInput.value = dateIso;
      }
    };
  }

  if (monthlyStatusElement) {
    syncMonthlyStatus(monthlyDaySelect.value);
    monthlyDaySelect.onChange = (dateIso) => {
      syncMonthlyStatus(dateIso);
    };
  }

  selectionApply?.addEventListener("click", applySelectionInput);
  selectionInput?.addEventListener("keydown", (event) => {
    if (event.key === "Enter") {
      applySelectionInput();
    }
  });
}
