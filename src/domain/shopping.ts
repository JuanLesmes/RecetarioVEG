import type { Ingredient, Recipe, Unit } from './recipe';
import { normalize } from './text';
import { describeIngredient, formatQuantity, scaleQuantity, unitLabel } from './scaling';

export interface ShoppingItem {
  id: string;
  name: string;
  quantity: number | null;
  unit: Unit | null;
  note?: string;
  recipeId: string;
  recipeTitle: string;
  checked: boolean;
  addedAt: number;
}

export interface MergedShoppingItem {
  key: string;
  name: string;
  unit: Unit | null;
  quantity: number | null;
  display: string;
  recipes: string[];
  itemIds: string[];
  checked: boolean;
}

let counter = 0;
export function newItemId(): string {
  counter += 1;
  return `${Date.now().toString(36)}-${counter.toString(36)}-${Math.random().toString(36).slice(2, 6)}`;
}

export function itemsFromRecipe(recipe: Recipe, servings: number = recipe.servings, now = Date.now()): ShoppingItem[] {
  return recipe.ingredients.map((ing: Ingredient) => ({
    id: newItemId(),
    name: ing.name,
    quantity: ing.quantity === null ? null : scaleQuantity(ing.quantity, recipe.servings, servings),
    unit: ing.unit,
    note: ing.note,
    recipeId: recipe.id,
    recipeTitle: recipe.title,
    checked: false,
    addedAt: now,
  }));
}

/** Agrupa ítems por nombre normalizado + unidad, sumando cantidades numéricas. */
export function mergeItems(items: ShoppingItem[]): MergedShoppingItem[] {
  const map = new Map<string, MergedShoppingItem>();
  for (const item of items) {
    const key = `${normalize(item.name)}|${item.unit ?? ''}`;
    const existing = map.get(key);
    if (existing) {
      if (existing.quantity !== null && item.quantity !== null) existing.quantity += item.quantity;
      else if (item.quantity !== null && existing.quantity === null) existing.quantity = item.quantity;
      if (!existing.recipes.includes(item.recipeTitle)) existing.recipes.push(item.recipeTitle);
      existing.itemIds.push(item.id);
      existing.checked = existing.checked && item.checked;
    } else {
      map.set(key, {
        key,
        name: item.name,
        unit: item.unit,
        quantity: item.quantity,
        display: '',
        recipes: [item.recipeTitle],
        itemIds: [item.id],
        checked: item.checked,
      });
    }
  }
  const merged = [...map.values()].map((m) => ({ ...m, display: describe(m) }));
  return merged.sort((a, b) => Number(a.checked) - Number(b.checked) || a.name.localeCompare(b.name, 'es'));
}

function describe(m: MergedShoppingItem): string {
  if (m.quantity === null) return m.name;
  const qty = formatQuantity(m.quantity, m.unit);
  const unit = unitLabel(m.unit, m.quantity);
  return describeIngredient(m.name, [qty, unit].filter(Boolean).join(' '), m.unit);
}

export function toPlainText(merged: MergedShoppingItem[]): string {
  return merged.map((m) => `${m.checked ? '[x]' : '[ ]'} ${m.display}`).join('\n');
}
