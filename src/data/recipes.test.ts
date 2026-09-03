import { describe, expect, it } from 'vitest';
import { dailyPicks, getRecipeById, getRecipesByIds, randomRecipe, recipes, stats } from './index';
import { CATEGORIES, CUISINES, recipeSchema, TAGS, totalTime, UNITS } from '@/domain/recipe';

/**
 * Pruebas de integridad del catálogo: garantizan que el contenido cumple los
 * requisitos del producto (≥100 recetas, ambas dietas, todas las categorías)
 * y que cada receta es coherente y completa.
 */
describe('catálogo de recetas', () => {
  it('tiene al menos 100 recetas, con veganas y vegetarianas suficientes', () => {
    expect(recipes.length).toBeGreaterThanOrEqual(100);
    expect(stats.vegan).toBeGreaterThanOrEqual(40);
    expect(stats.vegetarian).toBeGreaterThanOrEqual(30);
    expect(stats.vegan + stats.vegetarian).toBe(recipes.length);
  });

  it('cubre todas las categorías y al menos 15 cocinas', () => {
    for (const c of CATEGORIES) expect(stats.byCategory[c], `categoría ${c}`).toBeGreaterThan(0);
    expect(stats.cuisines.length).toBeGreaterThanOrEqual(15);
  });

  it('no repite ids ni títulos', () => {
    const ids = recipes.map((r) => r.id);
    expect(new Set(ids).size).toBe(ids.length);
    const titles = recipes.map((r) => r.title.trim().toLowerCase());
    expect(new Set(titles).size).toBe(titles.length);
  });

  it('todas las recetas pasan el esquema estricto', () => {
    for (const r of recipes) {
      const result = recipeSchema.safeParse(r);
      expect(result.success, `${r.id}: ${result.success ? '' : JSON.stringify(result.error.issues[0])}`).toBe(true);
    }
  });

  it('cada receta es completa y coherente', () => {
    for (const r of recipes) {
      expect(r.ingredients.length, r.id).toBeGreaterThanOrEqual(3);
      expect(r.steps.length, r.id).toBeGreaterThanOrEqual(3);
      expect(r.tips.length, r.id).toBeGreaterThanOrEqual(1);
      expect(r.sources.length, r.id).toBeGreaterThanOrEqual(1);
      expect(totalTime(r), r.id).toBeGreaterThan(0);
      expect(r.nutrition.calories, r.id).toBeGreaterThan(0);
      expect((CUISINES as readonly string[]).includes(r.cuisine), r.id).toBe(true);
      for (const t of r.tags) expect((TAGS as readonly string[]).includes(t), `${r.id} tag ${t}`).toBe(true);
      for (const i of r.ingredients) {
        if (i.unit !== null) expect((UNITS as readonly string[]).includes(i.unit), `${r.id} unidad ${i.unit}`).toBe(true);
        if (i.quantity !== null) expect(i.quantity, `${r.id} ${i.name}`).toBeGreaterThan(0);
      }
      if (r.diet === 'vegetariana') expect(r.veganAlternative, r.id).toBeTruthy();
      else expect(r.veganAlternative, r.id).toBeUndefined();
      if (r.tags.includes('rápido')) expect(totalTime(r), r.id).toBeLessThanOrEqual(30);
      for (const s of r.sources) expect(s.url, r.id).toMatch(/^https?:\/\//);
    }
  });

  it('está ordenado alfabéticamente por título', () => {
    const titles = recipes.map((r) => r.title);
    const sorted = [...titles].sort((a, b) => a.localeCompare(b, 'es'));
    expect(titles).toEqual(sorted);
  });
});

describe('helpers del catálogo', () => {
  it('getRecipeById y getRecipesByIds', () => {
    const first = recipes[0];
    expect(getRecipeById(first.id)).toBe(first);
    expect(getRecipeById('no-existe')).toBeUndefined();
    expect(getRecipesByIds([first.id, 'no-existe', recipes[1].id]).map((r) => r.id)).toEqual([first.id, recipes[1].id]);
  });

  it('dailyPicks es determinista por fecha y sin repetidos', () => {
    const d = new Date(2026, 8, 2);
    const a = dailyPicks(4, d).map((r) => r.id);
    const b = dailyPicks(4, d).map((r) => r.id);
    expect(a).toEqual(b);
    expect(new Set(a).size).toBe(4);
    const c = dailyPicks(4, new Date(2026, 8, 3)).map((r) => r.id);
    expect(c).not.toEqual(a);
  });

  it('randomRecipe respeta exclusiones', () => {
    const exclude = recipes.slice(1).map((r) => r.id);
    expect(randomRecipe(exclude)?.id).toBe(recipes[0].id);
    expect(randomRecipe()).toBeDefined();
  });
});
