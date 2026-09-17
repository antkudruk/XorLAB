import type { ChemicalElement } from "../domain/types";

/** Parse atomic number, symbol, or name. Empty input clears selection. */
export function parseElementSelection(
    input: string,
    elements: readonly ChemicalElement[],
): ChemicalElement | undefined | null {
    const trimmed = input.trim();
    if (trimmed === "") {
        return undefined;
    }
    if (/^\d+$/.test(trimmed)) {
        const atomicNumber = Number(trimmed);
        const byNumber = elements.find((element) => element.atomicNumber === atomicNumber);
        return byNumber ?? null;
    }
    const lower = trimmed.toLowerCase();
    const bySymbol = elements.find((element) => element.symbol.toLowerCase() === lower);
    if (bySymbol) {
        return bySymbol;
    }
    const byName = elements.find((element) => element.name.toLowerCase() === lower);
    return byName ?? null;
}

export function formatElementSelectionStatus(element: ChemicalElement | undefined): string {
    return element
        ? `Selected: ${element.name} (${element.symbol}), atomic number ${element.atomicNumber}.`
        : "Click an element to select it.";
}
