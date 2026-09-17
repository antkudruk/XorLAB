# Calendar example

Vanilla TypeScript calendar demo for xorlab with two views on one page:

- **Monthly grid** — twelve `MonthCard` items in a 4×3 grid, each containing day cards.
- **Year overview** — weekday rows, week-of-year columns, and year/month headers generated via `cardFactories`, `extrude`, and `tableFactory`.

## Widget configuration

Mount wiring is in [`src/view/mountWidget.ts`](src/view/mountWidget.ts). Day selection and segment layout presets live in [`src/view/callbackTable.ts`](src/view/callbackTable.ts) and [`src/view/styleSheet.ts`](src/view/styleSheet.ts).

## Selection

Click a `DayCard` to select it, or use **Set selection** with compact input `YYYY-MM-DD` (for example `2025-12-15`). Empty input clears selection. Parsing lives in [`src/view/parseDaySelection.ts`](src/view/parseDaySelection.ts).

## Prerequisites

Build xorlab first:

```bash
npm run build -w @my/alert-library
```

## Commands

```bash
cd examples/calendar
npm install
npm run dev
npm test
npm run test:bdd
npm run preprocess
```

## Parameters

Use the **Parameters** button to change:

1. Year
2. Week start (Monday or Sunday)
