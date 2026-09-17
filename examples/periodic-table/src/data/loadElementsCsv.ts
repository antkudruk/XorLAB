import { ChemicalElement } from "../domain/types";

const ELEMENTS_CSV_URL = "/data/elements.csv";

export async function loadElementsCsv(
  input: RequestInfo | URL = ELEMENTS_CSV_URL
): Promise<ChemicalElement[]> {
  const response = await fetch(input);
  if (!response.ok) {
    throw new Error(`Unable to load chemical elements CSV: ${response.status}`);
  }

  const csvText = await response.text();
  return parseElementsCsv(csvText);
}

export function parseElementsCsv(csvText: string): ChemicalElement[] {
  const rows = parseCsv(csvText);
  if (rows.length === 0) {
    return [];
  }

  const [header, ...dataRows] = rows;
  return dataRows
    .filter((row) => row.some((cell) => cell.trim().length > 0))
    .map((row) => mapRowToElement(header, row));
}

function mapRowToElement(header: string[], row: string[]): ChemicalElement {
  const rowRecord = Object.fromEntries(
    header.map((columnName, index) => [columnName, row[index] ?? ""])
  );

  return {
    atomicNumber: parseRequiredNumber(rowRecord.atomicNumber, "atomicNumber"),
    symbol: parseRequiredText(rowRecord.symbol, "symbol"),
    name: parseRequiredText(rowRecord.name, "name"),
    period: parseRequiredNumber(rowRecord.period, "period"),
    group: parseRequiredNumber(rowRecord.group, "group"),
    block: parseRequiredText(rowRecord.block, "block"),
    series: parseOptionalText(rowRecord.series),
    seriesOrder: parseOptionalNumber(rowRecord.seriesOrder),
    category: parseRequiredText(rowRecord.category, "category"),
    phase: parseOptionalText(rowRecord.phase),
    atomicMass: parseOptionalNumber(rowRecord.atomicMass),
    electronegativity: parseOptionalNumber(rowRecord.electronegativity),
    density: parseOptionalNumber(rowRecord.density),
    meltingPointK: parseOptionalNumber(rowRecord.meltingPointK),
    boilingPointK: parseOptionalNumber(rowRecord.boilingPointK),
    electronConfiguration: parseOptionalText(rowRecord.electronConfiguration),
    discoveredBy: parseOptionalText(rowRecord.discoveredBy),
    year: parseOptionalNumber(rowRecord.year),
  };
}

function parseCsv(csvText: string): string[][] {
  const rows: string[][] = [];
  let currentRow: string[] = [];
  let currentCell = "";
  let isInQuotes = false;

  for (let index = 0; index < csvText.length; index += 1) {
    const character = csvText[index];
    const nextCharacter = csvText[index + 1];

    if (character === "\"") {
      if (isInQuotes && nextCharacter === "\"") {
        currentCell += "\"";
        index += 1;
      } else {
        isInQuotes = !isInQuotes;
      }
      continue;
    }

    if (!isInQuotes && character === ",") {
      currentRow.push(currentCell);
      currentCell = "";
      continue;
    }

    if (!isInQuotes && (character === "\n" || character === "\r")) {
      if (character === "\r" && nextCharacter === "\n") {
        index += 1;
      }

      currentRow.push(currentCell);
      if (currentRow.length > 1 || currentRow[0] !== "") {
        rows.push(currentRow);
      }
      currentRow = [];
      currentCell = "";
      continue;
    }

    currentCell += character;
  }

  if (currentCell.length > 0 || currentRow.length > 0) {
    currentRow.push(currentCell);
    rows.push(currentRow);
  }

  return rows;
}

function parseRequiredText(value: string, fieldName: string): string {
  const normalizedValue = value.trim();
  if (!normalizedValue) {
    throw new Error(`Field "${fieldName}" is required`);
  }
  return normalizedValue;
}

function parseOptionalText(value: string): string | null {
  const normalizedValue = value.trim();
  return normalizedValue ? normalizedValue : null;
}

function parseRequiredNumber(value: string, fieldName: string): number {
  const parsedValue = parseOptionalNumber(value);
  if (parsedValue === null) {
    throw new Error(`Field "${fieldName}" must be a number`);
  }
  return parsedValue;
}

function parseOptionalNumber(value: string): number | null {
  const normalizedValue = value.trim();
  if (!normalizedValue) {
    return null;
  }

  const parsedValue = Number(normalizedValue);
  if (Number.isNaN(parsedValue)) {
    throw new Error(`Field "${normalizedValue}" is not a valid number`);
  }

  return parsedValue;
}
