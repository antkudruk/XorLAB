import "./app.css";
import { createPoissonsModel } from "./domain/model";
import { mountLayout } from "./view/render";

function requireHost(id: string) {
  const el = document.getElementById(id);
  if (!el) {
    throw new Error(`Missing host #${id}`);
  }
  return el;
}

const model = createPoissonsModel();

mountLayout(requireHost("host-requested"), model.requested);
mountLayout(requireHost("host-recipe"), model.recipe);
mountLayout(requireHost("host-ingredients-month"), model.ingredientsMonth);
mountLayout(requireHost("host-prices"), model.prices);
mountLayout(requireHost("host-costs"), model.costs);
mountLayout(requireHost("host-cost-ingredient"), model.costIngredient);
mountLayout(requireHost("host-cost-month"), model.costMonth);
