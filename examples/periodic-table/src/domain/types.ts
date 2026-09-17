export interface ChemicalElement {
  readonly atomicNumber: number;
  readonly symbol: string;
  readonly name: string;
  readonly period: number;
  readonly group: number;
  readonly block: string;
  readonly series: string | null;
  readonly seriesOrder: number | null;
  readonly category: string;
  readonly phase: string | null;
  readonly atomicMass: number | null;
  readonly electronegativity: number | null;
  readonly density: number | null;
  readonly meltingPointK: number | null;
  readonly boilingPointK: number | null;
  readonly electronConfiguration: string | null;
  readonly discoveredBy: string | null;
  readonly year: number | null;
}

export interface PeriodEntry {
  readonly id: number;
  readonly period: number;
  readonly label: string;
}

export interface GroupEntry {
  readonly id: number;
  readonly group: number;
  readonly label: string;
}
