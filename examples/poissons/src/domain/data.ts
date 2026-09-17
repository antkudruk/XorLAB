export interface Poisson {
  readonly id: number;
  readonly name: string;
}

export interface Ingredient {
  readonly id: number;
  readonly name: string;
}

export interface Month {
  readonly id: number;
  readonly name: string;
}

export interface RequestedEntry {
  readonly poissonId: number;
  readonly monthId: number;
  readonly value: number;
}

export interface RecipeEntry {
  readonly poissonId: number;
  readonly ingredientId: number;
  readonly value: number;
}

export interface PriceEntry {
  readonly ingredientId: number;
  readonly monthId: number;
  readonly value: number;
}

export const poissons: Poisson[] = [
  { id: 1, name: "Roast Hog" },
  { id: 2, name: "Pumpkin Pasties" },
  { id: 3, name: "Butterbeer Stew" },
  { id: 4, name: "Treacle Tart" },
  { id: 5, name: "Shepherd's Pie" },
  { id: 6, name: "Chocolate Frogs" },
  { id: 7, name: "Cornish Pasties" },
  { id: 8, name: "Haggis Flambé" },
];

export const ingredients: Ingredient[] = [
  { id: 1, name: "Flour" },
  { id: 2, name: "Pumpkin" },
  { id: 3, name: "Butterbeer" },
  { id: 4, name: "Dragon liver" },
  { id: 5, name: "Sugar" },
  { id: 6, name: "Chocolate" },
  { id: 7, name: "Potato" },
  { id: 8, name: "Mutton" },
  { id: 9, name: "Pastry" },
  { id: 10, name: "Treacle" },
  { id: 11, name: "Egg" },
  { id: 12, name: "Milk" },
  { id: 13, name: "Onion" },
  { id: 14, name: "Herbs" },
];

export const months: Month[] = [
  { id: 1, name: "Jan" },
  { id: 2, name: "Feb" },
  { id: 3, name: "Mar" },
  { id: 4, name: "Apr" },
  { id: 5, name: "May" },
  { id: 6, name: "Jun" },
  { id: 7, name: "Jul" },
  { id: 8, name: "Aug" },
  { id: 9, name: "Sep" },
  { id: 10, name: "Oct" },
  { id: 11, name: "Nov" },
  { id: 12, name: "Dec" },
];

/** Portions requested per poisson per month. */
export const requestedEntries: RequestedEntry[] = [
  // Original autumn requests remapped: Sep=9, Oct=10, Nov=11
  { poissonId: 1, monthId: 9, value: 2 },
  { poissonId: 1, monthId: 10, value: 1 },
  { poissonId: 2, monthId: 9, value: 4 },
  { poissonId: 2, monthId: 10, value: 3 },
  { poissonId: 2, monthId: 11, value: 2 },
  { poissonId: 3, monthId: 10, value: 2 },
  { poissonId: 3, monthId: 11, value: 5 },
  // Extended across the year
  { poissonId: 1, monthId: 1, value: 1 },
  { poissonId: 1, monthId: 12, value: 3 },
  { poissonId: 2, monthId: 2, value: 2 },
  { poissonId: 2, monthId: 6, value: 1 },
  { poissonId: 3, monthId: 3, value: 2 },
  { poissonId: 3, monthId: 7, value: 1 },
  { poissonId: 4, monthId: 4, value: 3 },
  { poissonId: 4, monthId: 9, value: 2 },
  { poissonId: 4, monthId: 12, value: 4 },
  { poissonId: 5, monthId: 1, value: 2 },
  { poissonId: 5, monthId: 5, value: 3 },
  { poissonId: 5, monthId: 11, value: 2 },
  { poissonId: 6, monthId: 2, value: 5 },
  { poissonId: 6, monthId: 6, value: 3 },
  { poissonId: 6, monthId: 10, value: 4 },
  { poissonId: 7, monthId: 3, value: 2 },
  { poissonId: 7, monthId: 8, value: 3 },
  { poissonId: 7, monthId: 11, value: 1 },
  { poissonId: 8, monthId: 1, value: 1 },
  { poissonId: 8, monthId: 7, value: 2 },
  { poissonId: 8, monthId: 12, value: 2 },
];

/** Ingredient units required per poisson. */
export const recipeEntries: RecipeEntry[] = [
  { poissonId: 1, ingredientId: 1, value: 2 },
  { poissonId: 1, ingredientId: 4, value: 1 },
  { poissonId: 1, ingredientId: 14, value: 1 },
  { poissonId: 2, ingredientId: 1, value: 1 },
  { poissonId: 2, ingredientId: 2, value: 3 },
  { poissonId: 2, ingredientId: 9, value: 1 },
  { poissonId: 3, ingredientId: 3, value: 2 },
  { poissonId: 3, ingredientId: 4, value: 1 },
  { poissonId: 3, ingredientId: 13, value: 1 },
  { poissonId: 4, ingredientId: 1, value: 2 },
  { poissonId: 4, ingredientId: 5, value: 1 },
  { poissonId: 4, ingredientId: 10, value: 2 },
  { poissonId: 4, ingredientId: 11, value: 1 },
  { poissonId: 5, ingredientId: 7, value: 3 },
  { poissonId: 5, ingredientId: 8, value: 2 },
  { poissonId: 5, ingredientId: 13, value: 1 },
  { poissonId: 5, ingredientId: 14, value: 1 },
  { poissonId: 6, ingredientId: 5, value: 1 },
  { poissonId: 6, ingredientId: 6, value: 3 },
  { poissonId: 6, ingredientId: 12, value: 1 },
  { poissonId: 7, ingredientId: 1, value: 1 },
  { poissonId: 7, ingredientId: 8, value: 1 },
  { poissonId: 7, ingredientId: 9, value: 2 },
  { poissonId: 7, ingredientId: 13, value: 1 },
  { poissonId: 8, ingredientId: 8, value: 2 },
  { poissonId: 8, ingredientId: 13, value: 1 },
  { poissonId: 8, ingredientId: 14, value: 2 },
];

/** Base Knuts price per ingredient; month variation applied below. */
const priceBase: ReadonlyArray<{ ingredientId: number; base: number }> = [
  { ingredientId: 1, base: 3 },
  { ingredientId: 2, base: 5 },
  { ingredientId: 3, base: 8 },
  { ingredientId: 4, base: 20 },
  { ingredientId: 5, base: 2 },
  { ingredientId: 6, base: 6 },
  { ingredientId: 7, base: 3 },
  { ingredientId: 8, base: 10 },
  { ingredientId: 9, base: 4 },
  { ingredientId: 10, base: 5 },
  { ingredientId: 11, base: 2 },
  { ingredientId: 12, base: 3 },
  { ingredientId: 13, base: 2 },
  { ingredientId: 14, base: 4 },
];

/** Preserve original Sep–Nov prices for ingredients 1–4. */
const autumnOverrides: ReadonlyMap<string, number> = new Map([
  ["1-9", 3],
  ["1-10", 4],
  ["1-11", 3],
  ["2-9", 5],
  ["2-10", 6],
  ["2-11", 5],
  ["3-9", 8],
  ["3-10", 7],
  ["3-11", 9],
  ["4-9", 20],
  ["4-10", 22],
  ["4-11", 18],
]);

/** Price in Knuts per ingredient per month (dense). */
export const priceEntries: PriceEntry[] = priceBase.flatMap(({ ingredientId, base }) =>
  months.map((month) => {
    const key = `${ingredientId}-${month.id}`;
    const override = autumnOverrides.get(key);
    if (override !== undefined) {
      return { ingredientId, monthId: month.id, value: override };
    }
    // Light seasonal wobble: ±1 around base by month parity
    const wobble = ((month.id + ingredientId) % 3) - 1;
    return { ingredientId, monthId: month.id, value: Math.max(1, base + wobble) };
  }),
);
