import type { Category, Cuisine, Diet, Difficulty, Recipe, Tag } from './recipe';
import { totalTime } from './recipe';
import { normalize, tokenize } from './text';

export type SortOption = 'relevancia' | 'rapidas' | 'titulo' | 'calorias' | 'proteina';

export const SORT_OPTIONS: { value: SortOption; label: string }[] = [
  { value: 'relevancia', label: 'Relevancia' },
  { value: 'rapidas', label: 'Más rápidas' },
  { value: 'titulo', label: 'Título (A-Z)' },
  { value: 'calorias', label: 'Menos calorías' },
  { value: 'proteina', label: 'Más proteína' },
];

export interface SearchFilters {
  query: string;
  diet: Diet | 'todas';
  categories: Category[];
  cuisines: Cuisine[];
  difficulties: Difficulty[];
  maxTime: number | null;
  tags: Tag[];
  includeIngredients: string[];
  excludeIngredients: string[];
  sort: SortOption;
}

export const EMPTY_FILTERS: SearchFilters = {
  query: '',
  diet: 'todas',
  categories: [],
  cuisines: [],
  difficulties: [],
  maxTime: null,
  tags: [],
  includeIngredients: [],
  excludeIngredients: [],
  sort: 'relevancia',
};

export interface SearchResult {
  recipe: Recipe;
  score: number;
}

/** Índice pre-normalizado por receta para acelerar búsquedas repetidas. */
interface IndexedRecipe {
  recipe: Recipe;
  title: string;
  titleWords: string[];
  description: string;
  ingredients: string[];
  ingredientsText: string;
  tags: string;
  cuisine: string;
  category: string;
  steps: string;
}

const indexCache = new WeakMap<readonly Recipe[], IndexedRecipe[]>();

function buildIndex(recipes: readonly Recipe[]): IndexedRecipe[] {
  const cached = indexCache.get(recipes);
  if (cached) return cached;
  const index = recipes.map((recipe) => {
    const ingredients = recipe.ingredients.flatMap((i) => [normalize(i.name), ...(i.aliases ?? []).map(normalize)]);
    const title = normalize(recipe.title);
    return {
      recipe,
      title,
      titleWords: title.split(' '),
      description: normalize(recipe.description),
      ingredients,
      ingredientsText: ingredients.join(' | '),
      tags: normalize(recipe.tags.join(' ')),
      cuisine: normalize(recipe.cuisine),
      category: normalize(recipe.category.replace('-', ' ')),
      steps: normalize(recipe.steps.join(' ')),
    };
  });
  indexCache.set(recipes, index);
  return index;
}

/** Puntúa un token contra una receta indexada; 0 significa que no coincide. */
function scoreToken(entry: IndexedRecipe, token: string): number {
  let score = 0;
  if (entry.title === token) score += 100;
  else if (entry.titleWords.includes(token)) score += 60;
  else if (entry.titleWords.some((w) => w.startsWith(token))) score += 45;
  else if (entry.title.includes(token)) score += 30;

  if (entry.ingredients.some((i) => i === token || i.split(' ').includes(token))) score += 30;
  else if (entry.ingredientsText.includes(token)) score += 18;

  if (entry.tags.includes(token)) score += 15;
  if (entry.cuisine.includes(token)) score += 15;
  if (entry.category.includes(token)) score += 15;
  if (entry.description.includes(token)) score += 8;
  if (entry.steps.includes(token)) score += 2;
  return score;
}

export function matchesFilters(recipe: Recipe, filters: SearchFilters): boolean {
  if (filters.diet !== 'todas' && recipe.diet !== filters.diet) return false;
  if (filters.categories.length > 0 && !filters.categories.includes(recipe.category)) return false;
  if (filters.cuisines.length > 0 && !filters.cuisines.includes(recipe.cuisine)) return false;
  if (filters.difficulties.length > 0 && !filters.difficulties.includes(recipe.difficulty)) return false;
  if (filters.maxTime !== null && totalTime(recipe) > filters.maxTime) return false;
  if (filters.tags.length > 0 && !filters.tags.every((t) => recipe.tags.includes(t))) return false;

  if (filters.includeIngredients.length > 0 || filters.excludeIngredients.length > 0) {
    const names = recipe.ingredients.flatMap((i) => [normalize(i.name), ...(i.aliases ?? []).map(normalize)]);
    const has = (needle: string) => {
      const n = normalize(needle);
      return n.length > 0 && names.some((name) => name.includes(n));
    };
    if (!filters.includeIngredients.every(has)) return false;
    if (filters.excludeIngredients.some(has)) return false;
  }
  return true;
}

function compareBy(sort: SortOption): (a: SearchResult, b: SearchResult) => number {
  const byTitle = (a: SearchResult, b: SearchResult) => a.recipe.title.localeCompare(b.recipe.title, 'es');
  switch (sort) {
    case 'rapidas':
      return (a, b) => totalTime(a.recipe) - totalTime(b.recipe) || byTitle(a, b);
    case 'titulo':
      return byTitle;
    case 'calorias':
      return (a, b) => a.recipe.nutrition.calories - b.recipe.nutrition.calories || byTitle(a, b);
    case 'proteina':
      return (a, b) => b.recipe.nutrition.protein - a.recipe.nutrition.protein || byTitle(a, b);
    case 'relevancia':
    default:
      return (a, b) => b.score - a.score || byTitle(a, b);
  }
}

/**
 * Busca y filtra recetas. Todos los tokens de la consulta deben coincidir en
 * algún campo (AND). Sin consulta, la relevancia es neutra y se ordena por título.
 */
export function searchRecipes(recipes: readonly Recipe[], filters: SearchFilters): SearchResult[] {
  const tokens = tokenize(filters.query);
  const index = buildIndex(recipes);
  const results: SearchResult[] = [];

  for (const entry of index) {
    if (!matchesFilters(entry.recipe, filters)) continue;
    let score = 0;
    let allMatch = true;
    for (const token of tokens) {
      const s = scoreToken(entry, token);
      if (s === 0) {
        allMatch = false;
        break;
      }
      score += s;
    }
    if (!allMatch) continue;
    results.push({ recipe: entry.recipe, score });
  }

  const sort = tokens.length === 0 && filters.sort === 'relevancia' ? 'titulo' : filters.sort;
  return results.sort(compareBy(sort));
}

export function countActiveFilters(filters: SearchFilters): number {
  let n = 0;
  if (filters.diet !== 'todas') n++;
  n += filters.categories.length;
  n += filters.cuisines.length;
  n += filters.difficulties.length;
  if (filters.maxTime !== null) n++;
  n += filters.tags.length;
  n += filters.includeIngredients.length;
  n += filters.excludeIngredients.length;
  return n;
}

/** Sugerencias de autocompletado a partir de títulos e ingredientes. */
export function suggest(recipes: readonly Recipe[], query: string, limit = 6): string[] {
  const q = normalize(query);
  if (q.length < 2) return [];
  const seen = new Set<string>();
  const out: string[] = [];
  const push = (value: string) => {
    const key = normalize(value);
    if (seen.has(key) || !key.includes(q)) return;
    seen.add(key);
    out.push(value);
  };
  for (const r of recipes) {
    push(r.title);
    if (out.length >= limit) return out;
  }
  for (const r of recipes) {
    for (const i of r.ingredients) {
      push(i.name);
      if (out.length >= limit) return out;
    }
  }
  return out;
}

/** Recetas relacionadas: misma categoría o cocina, con ingredientes en común. */
export function relatedRecipes(recipes: readonly Recipe[], current: Recipe, limit = 4): Recipe[] {
  const currentIngredients = new Set(current.ingredients.map((i) => normalize(i.name)));
  return recipes
    .filter((r) => r.id !== current.id)
    .map((r) => {
      let score = 0;
      if (r.category === current.category) score += 3;
      if (r.cuisine === current.cuisine) score += 2;
      if (r.diet === current.diet) score += 1;
      for (const i of r.ingredients) if (currentIngredients.has(normalize(i.name))) score += 1;
      for (const t of r.tags) if (current.tags.includes(t)) score += 0.5;
      return { r, score };
    })
    .sort((a, b) => b.score - a.score || a.r.title.localeCompare(b.r.title, 'es'))
    .slice(0, limit)
    .map((x) => x.r);
}
