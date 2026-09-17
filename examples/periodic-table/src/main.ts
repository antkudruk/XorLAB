import "./app.css";
import { loadElementsCsv } from "./data/loadElementsCsv";
import { createPeriodicTableModel } from "./domain/periodicTableModel";
import { mountPeriodicTable } from "./view/renderPeriodicTable";
import {
  formatElementSelectionStatus,
  parseElementSelection,
} from "./view/parseElementSelection";

function getRequiredElement(selector: string): HTMLElement {
  const element = document.querySelector<HTMLElement>(selector);
  if (!element) {
    throw new Error(`Periodic table example markup is missing ${selector}.`);
  }
  return element;
}

const hostElement = getRequiredElement("#periodic-table-host");
const statusElement = getRequiredElement("#periodic-table-status");
const selectionInput = document.querySelector<HTMLInputElement>("#periodic-table-selection-input");
const selectionApply = document.querySelector<HTMLButtonElement>("#periodic-table-selection-apply");
const selectionError = document.querySelector<HTMLElement>("#periodic-table-selection-error");

async function bootstrap(): Promise<void> {
  try {
    const elements = await loadElementsCsv();
    const model = createPeriodicTableModel(elements);
    mountPeriodicTable(hostElement, model);

    function syncStatus(element: typeof model.elementSelect.value): void {
      statusElement.textContent = formatElementSelectionStatus(element);
    }

    function applySelectionInput(): void {
      if (!selectionInput || !selectionError) {
        return;
      }
      const parsed = parseElementSelection(selectionInput.value, elements);
      if (parsed === null) {
        selectionError.textContent = "Use atomic number, symbol, or element name.";
        selectionError.hidden = false;
        return;
      }
      selectionError.hidden = true;
      if (parsed === undefined) {
        model.elementSelect.clear();
      } else {
        model.elementSelect.value = parsed;
      }
      syncStatus(parsed);
    }

    model.elementSelect.onChange = (element) => {
      syncStatus(element);
      if (selectionInput && element) {
        selectionInput.value = String(element.atomicNumber);
      }
    };

    const lanthanideCount = elements.filter(
      (element) => element.series === "lanthanide"
    ).length;
    const actinideCount = elements.filter(
      (element) => element.series === "actinide"
    ).length;

    statusElement.textContent =
      `Loaded ${elements.length} elements across ${model.periodListSeg.nested.length} periods and ${model.groupListSeg.nested.length} groups (${lanthanideCount} lanthanides, ${actinideCount} actinides in shared cards). Click an element to select it.`;

    selectionApply?.addEventListener("click", applySelectionInput);
    selectionInput?.addEventListener("keydown", (event) => {
      if (event.key === "Enter") {
        applySelectionInput();
      }
    });
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "Unable to load the periodic table example";
    statusElement.textContent = `Unable to initialize the model: ${message}`;
    statusElement.setAttribute("role", "alert");
  }
}

void bootstrap();
