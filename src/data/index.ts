import { recipeCollectionSchema, type Category, type Cuisine, type Recipe, type Tag } from '@/domain/recipe';

/**
 * Carga todos los archivos JSON de recetas de forma estática (Vite los incluye en el bundle).
 * Cada archivo es validado con Zod al arrancar: si un dato es inválido, la app falla
 * ruidosamente en desarrollo y en pruebas en lugar de renderizar información corrupta.
 */
const modules = import.meta.glob('./recipes/*.json', { eager: true, import: 'default' }) as Record<string, unknown>;

function loadRecipes(): Recipe[] {
  const all: Recipe[] = [];
  const seen = new Set<string>();
  const files = Object.keys(modules).sort();
  for (const file of files) {
    const parsed = recipeCollectionSchema.safeParse(modules[file]);
    if (!parsed.success) {
      const issues = parsed.error.issues
        .slice(0, 5)
        .map((i) => `  - ${i.path.join('.')}: ${i.message}`)
        .join('\n');
      throw new Error(`Recetas inválidas en ${file}:\n${issues}`);
    }
    for (const recipe of parsed.data) {
      if (seen.has(recipe.id)) throw new Error(`Id de receta duplicado: "${recipe.id}" (${file})`);
      seen.add(recipe.id);
      all.push(recipe);
    }
  }
  return all.sort((a, b) => a.title.localeCompare(b.title, 'es'));
}

export const recipes: readonly Recipe[] = Object.freeze(loadRecipes());

const byId = new Map(recipes.map((r) => [r.id, r]));

export function getRecipeById(id: string): Recipe | undefined {
  return byId.get(id);
}

export function getRecipesByIds(ids: readonly string[]): Recipe[] {
  return ids.map((id) => byId.get(id)).filter((r): r is Recipe => r !== undefined);
}

export interface CatalogStats {
  total: number;
  vegan: number;
  vegetarian: number;
  byCategory: Record<Category, number>;
  cuisines: { name: Cuisine; count: number }[];
  tags: { name: Tag; count: number }[];
}

function computeStats(list: readonly Recipe[]): CatalogStats {
  const byCategory = {} as Record<Category, number>;
  const cuisineCount = new Map<Cuisine, number>();
  const tagCount = new Map<Tag, number>();
  for (const r of list) {
    byCategory[r.category] = (byCategory[r.category] ?? 0) + 1;
    cuisineCount.set(r.cuisine, (cuisineCount.get(r.cuisine) ?? 0) + 1);
    for (const t of r.tags) tagCount.set(t, (tagCount.get(t) ?? 0) + 1);
  }
  const sortDesc = <T extends string>(m: Map<T, number>) =>
    [...m.entries()].map(([name, count]) => ({ name, count })).sort((a, b) => b.count - a.count || a.name.localeCompare(b.name, 'es'));
  return {
    total: list.length,
    vegan: list.filter((r) => r.diet === 'vegana').length,
    vegetarian: list.filter((r) => r.diet === 'vegetariana').length,
    byCategory,
    cuisines: sortDesc(cuisineCount),
    tags: sortDesc(tagCount),
  };
}

export const stats: CatalogStats = computeStats(recipes);

/** Selección pseudoaleatoria determinista por día, para "Recetas del día" estables durante la jornada. */
export function dailyPicks(count: number, date = new Date()): Recipe[] {
  if (recipes.length === 0) return [];
  const seed = date.getFullYear() * 10000 + (date.getMonth() + 1) * 100 + date.getDate();
  let x = seed;
  const rand = () => {
    x = (x * 1103515245 + 12345) & 0x7fffffff;
    return x / 0x7fffffff;
  };
  const pool = [...recipes];
  const picks: Recipe[] = [];
  while (picks.length < Math.min(count, pool.length)) {
    const idx = Math.floor(rand() * pool.length);
    picks.push(pool.splice(idx, 1)[0]);
  }
  return picks;
}

export function randomRecipe(exclude: readonly string[] = []): Recipe | undefined {
  const pool = recipes.filter((r) => !exclude.includes(r.id));
  if (pool.length === 0) return recipes[0];
  return pool[Math.floor(Math.random() * pool.length)];
}
