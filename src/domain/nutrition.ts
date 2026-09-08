import type { Ingredient, Nutrition, Unit } from './recipe';
import { ingredientTokens } from './pantry';
import { NUTRITION_TABLE, type NutritionEntry, type UnitKey } from './nutritionTable';

/** Gramos por unidad cuando la tabla no especifica un peso propio para el ingrediente. */
export const DEFAULT_UNIT_GRAMS: Record<Unit, number> = {
  g: 1,
  kg: 1000,
  ml: 1,
  l: 1000,
  cucharada: 15,
  cucharadita: 5,
  taza: 150,
  unidad: 100,
  pizca: 0.3,
  diente: 3,
  rama: 5,
  hoja: 1,
  rebanada: 25,
  lata: 400,
  puñado: 30,
  sobre: 10,
  manojo: 50,
  chorrito: 5,
};

const LIQUID_UNITS = new Set<Unit>(['ml', 'l']);

interface IndexedEntry {
  entry: NutritionEntry;
  terms: string[][];
}

let index: IndexedEntry[] | null = null;

function getIndex(): IndexedEntry[] {
  if (!index) {
    index = NUTRITION_TABLE.map((entry) => ({
      entry,
      terms: [entry.name, ...entry.match].map(ingredientTokens).filter((t) => t.length > 0),
    }));
  }
  return index;
}

/**
 * Busca la entrada nutricional más específica para un ingrediente: gana el término
 * de la tabla con más palabras contenidas en el nombre (o en sus alias).
 */
export function findNutritionEntry(name: string, aliases: readonly string[] = []): NutritionEntry | undefined {
  const candidates = [name, ...aliases].map(ingredientTokens).filter((t) => t.length > 0);
  if (candidates.length === 0) return undefined;
  let best: { entry: NutritionEntry; score: number } | null = null;
  for (const { entry, terms } of getIndex()) {
    for (const term of terms) {
      for (const tokens of candidates) {
        if (term.every((t) => tokens.includes(t))) {
          const score = term.length * 10 + (term.length === tokens.length ? 5 : 0);
          if (!best || score > best.score) best = { entry, score };
        }
      }
    }
  }
  return best?.entry;
}

/** Convierte la cantidad de un ingrediente a gramos; null cuando es "al gusto" o no se puede estimar. */
export function ingredientGrams(ingredient: Pick<Ingredient, 'quantity' | 'unit'>, entry?: NutritionEntry): number | null {
  if (ingredient.quantity === null || ingredient.quantity <= 0) return null;
  const unit: Unit = ingredient.unit ?? 'unidad';
  if (LIQUID_UNITS.has(unit)) return ingredient.quantity * DEFAULT_UNIT_GRAMS[unit] * (entry?.density ?? 1);
  if (unit === 'g' || unit === 'kg') return ingredient.quantity * DEFAULT_UNIT_GRAMS[unit];
  const specific = entry?.unitGrams?.[unit as UnitKey];
  return ingredient.quantity * (specific ?? DEFAULT_UNIT_GRAMS[unit]);
}

export interface NutritionEstimateLine {
  name: string;
  grams: number;
  entry: NutritionEntry;
  calories: number;
}

export interface NutritionEstimate {
  perServing: Nutrition;
  total: Nutrition;
  lines: NutritionEstimateLine[];
  /** Ingredientes con cantidad que no se pudieron reconocer en la tabla. */
  unmatched: string[];
  /** Ingredientes "al gusto" o sin cantidad, que no aportan al cálculo. */
  skipped: string[];
  /** Proporción de ingredientes con cantidad que sí se reconocieron (0 a 1). */
  coverage: number;
}

const ZERO: Nutrition = { calories: 0, protein: 0, carbs: 0, fat: 0, fiber: 0 };

/** Estima la composición nutricional por porción a partir de la lista de ingredientes. */
export function estimateNutrition(ingredients: readonly Ingredient[], servings: number): NutritionEstimate {
  const total = { ...ZERO };
  const lines: NutritionEstimateLine[] = [];
  const unmatched: string[] = [];
  const skipped: string[] = [];

  for (const ing of ingredients) {
    if (!ing.name.trim()) continue;
    if (ing.quantity === null) {
      skipped.push(ing.name);
      continue;
    }
    const entry = findNutritionEntry(ing.name, ing.aliases ?? []);
    if (!entry) {
      unmatched.push(ing.name);
      continue;
    }
    const grams = ingredientGrams(ing, entry);
    if (grams === null) {
      skipped.push(ing.name);
      continue;
    }
    const factor = grams / 100;
    const calories = entry.per100g.calories * factor;
    total.calories += calories;
    total.protein += entry.per100g.protein * factor;
    total.carbs += entry.per100g.carbs * factor;
    total.fat += entry.per100g.fat * factor;
    total.fiber += entry.per100g.fiber * factor;
    lines.push({ name: ing.name, grams, entry, calories });
  }

  const divisor = Math.max(1, servings);
  const round = (n: number) => Math.round(n);
  const perServing: Nutrition = {
    calories: round(total.calories / divisor),
    protein: round(total.protein / divisor),
    carbs: round(total.carbs / divisor),
    fat: round(total.fat / divisor),
    fiber: round(total.fiber / divisor),
  };
  const considered = lines.length + unmatched.length;
  return {
    perServing,
    total: { calories: round(total.calories), protein: round(total.protein), carbs: round(total.carbs), fat: round(total.fat), fiber: round(total.fiber) },
    lines: lines.sort((a, b) => b.calories - a.calories),
    unmatched,
    skipped,
    coverage: considered === 0 ? 0 : lines.length / considered,
  };
}
