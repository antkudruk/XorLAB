/** Parse compact input: `YYYY-MM-DD`. Empty input clears selection. */
export function parseDaySelection(input: string): string | undefined | null {
    const trimmed = input.trim();
    if (trimmed === "") {
        return undefined;
    }
    const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(trimmed);
    if (!match) {
        return null;
    }
    const year = Number(match[1]);
    const month = Number(match[2]);
    const day = Number(match[3]);
    const date = new Date(year, month - 1, day);
    if (
        date.getFullYear() !== year
        || date.getMonth() !== month - 1
        || date.getDate() !== day
    ) {
        return null;
    }
    return trimmed;
}

export function formatDaySelectionStatus(dateIso: string | undefined): string {
    return dateIso ? `Selected: ${dateIso}` : "Click a day cell to select it.";
}
