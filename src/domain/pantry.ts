import type { Diet, Ingredient, Recipe } from './recipe';
import { normalize } from './text';

/** Ingredientes básicos que casi toda cocina tiene; pueden ignorarse al calcular coincidencias. */
export const STAPLES = ['sal', 'pimienta', 'aceite', 'agua', 'azúcar', 'vinagre', 'hielo'] as const;

const STAPLE_TOKENS = STAPLES.map((s) => normalize(s));

/** Palabras vacías que no aportan al comparar ingredientes ("de", "en", ...). */
const STOP = new Set(['de', 'del', 'la', 'el', 'los', 'las', 'en', 'con', 'sin', 'y', 'o', 'a', 'al', 'para', 'tipo']);

/** Reduce plurales simples y devuelve los tokens relevantes de un nombre de ingrediente. */
export function ingredientTokens(text: string): string[] {
  return normalize(text)
    .split(' ')
    .filter((t) => t.length > 1 && !STOP.has(t))
    .map(singular);
}

/**
 * Singular aproximado en español: "nueces" → "nuez", "fríjoles" → "frijol", "aguacates" → "aguacate".
 * Solo se quita "-es" cuando la consonante anterior puede terminar una palabra (l, r, n, d, z, s, j).
 */
function singular(word: string): string {
  if (word.length <= 3) return word;
  if (word.endsWith('ces')) return `${word.slice(0, -3)}z`;
  if (word.endsWith('es') && word.length > 4 && /[lrndsj]es$/.test(word)) return word.slice(0, -2);
  if (word.endsWith('s') && !word.endsWith('us')) return word.slice(0, -1);
  return word;
}

export function isStaple(ingredient: Pick<Ingredient, 'name'>): boolean {
  const tokens = ingredientTokens(ingredient.name);
  return tokens.length > 0 && tokens.every((t) => STAPLE_TOKENS.includes(t) || STOP.has(t)) ;
}

/** Nombres por los que se puede reconocer un ingrediente (nombre + aliases), tokenizados. */
function ingredientNames(ingredient: Ingredient): string[][] {
  return [ingredient.name, ...(ingredient.aliases ?? [])].map(ingredientTokens).filter((t) => t.length > 0);
}

/**
 * Un ingrediente de la despensa coincide con uno de la receta cuando todos los tokens
 * del término escrito aparecen en el nombre (o alias) del ingrediente, o al revés cuando
 * el nombre de la receta es de una sola palabra ("tomate" ↔ "tomate chonto", "fríjol negro" ↔ "fríjol").
 */
export function ingredientMatches(pantryTerm: string, ingredient: Ingredient): boolean {
  const have = ingredientTokens(pantryTerm);
  if (have.length === 0) return false;
  return ingredientNames(ingredient).some((name) => {
    const all = have.every((h) => name.some((n) => n === h || (n.length > 4 && h.length > 4 && (n.startsWith(h) || h.startsWith(n)))));
    if (all) return true;
    return name.length === 1 && have.some((h) => h === name[0]);
  });
}

export interface PantryOptions {
  ignoreStaples?: boolean;
  diet?: Diet | 'todas';
  maxMissing?: number | null;
  onlyComplete?: boolean;
}

export interface PantryMatch {
  recipe: Recipe;
  have: Ingredient[];
  missing: Ingredient[];
  /** Ingredientes considerados (sin básicos si se ignoran). */
  total: number;
  /** Proporción de ingredientes que ya tienes, entre 0 y 1. */
  coverage: number;
  /** Cuántos términos de la despensa se usan en esta receta. */
  usedTerms: string[];
}

/**
 * Cruza la despensa con el catálogo. Devuelve solo recetas con al menos un ingrediente
 * en común, ordenadas por cobertura descendente, menos faltantes y más términos usados.
 */
export function matchPantry(recipes: readonly Recipe[], pantry: readonly string[], options: PantryOptions = {}): PantryMatch[] {
  const { ignoreStaples = true, diet = 'todas', maxMissing = null, onlyComplete = false } = options;
  const terms = [...new Set(pantry.map((p) => p.trim()).filter(Boolean))];
  if (terms.length === 0) return [];

  const out: PantryMatch[] = [];
  for (const recipe of recipes) {
    if (diet !== 'todas' && recipe.diet !== diet) continue;
    const considered = ignoreStaples ? recipe.ingredients.filter((i) => !isStaple(i)) : recipe.ingredients;
    if (considered.length === 0) continue;
    const have: Ingredient[] = [];
    const missing: Ingredient[] = [];
    const used = new Set<string>();
    for (const ing of considered) {
      const term = terms.find((t) => ingredientMatches(t, ing));
      if (term) {
        have.push(ing);
        used.add(term);
      } else missing.push(ing);
    }
    if (have.length === 0) continue;
    if (onlyComplete && missing.length > 0) continue;
    if (maxMissing !== null && missing.length > maxMissing) continue;
    out.push({ recipe, have, missing, total: considered.length, coverage: have.length / considered.length, usedTerms: [...used] });
  }
  return out.sort(
    (a, b) =>
      b.coverage - a.coverage ||
      a.missing.length - b.missing.length ||
      b.usedTerms.length - a.usedTerms.length ||
      a.recipe.title.localeCompare(b.recipe.title, 'es'),
  );
}

export interface VocabularyEntry {
  name: string;
  count: number;
}

/**
 * Vocabulario de ingredientes del catálogo (nombre canónico + aliases) para autocompletar
 * la despensa, ordenado por frecuencia. Excluye básicos.
 */
export function pantryVocabulary(recipes: readonly Recipe[]): VocabularyEntry[] {
  const counts = new Map<string, VocabularyEntry>();
  const bump = (name: string, weight: number) => {
    const key = normalize(name);
    if (!key) return;
    const entry = counts.get(key);
    if (entry) entry.count += weight;
    else counts.set(key, { name: name.toLowerCase(), count: weight });
  };
  for (const r of recipes) {
    for (const ing of r.ingredients) {
      if (isStaple(ing)) continue;
      bump(ing.name, 1);
      for (const a of ing.aliases ?? []) bump(a, 0.25);
    }
  }
  return [...counts.values()].sort((a, b) => b.count - a.count || a.name.localeCompare(b.name, 'es'));
}

export function suggestIngredients(vocabulary: readonly VocabularyEntry[], query: string, exclude: readonly string[] = [], limit = 8): string[] {
  const q = normalize(query);
  if (q.length < 2) return [];
  const excluded = new Set(exclude.map(normalize));
  const starts: string[] = [];
  const contains: string[] = [];
  for (const v of vocabulary) {
    const n = normalize(v.name);
    if (excluded.has(n)) continue;
    if (n.startsWith(q)) starts.push(v.name);
    else if (n.includes(q)) contains.push(v.name);
    if (starts.length >= limit) break;
  }
  return [...starts, ...contains].slice(0, limit);
}
