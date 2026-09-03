import { describe, expect, it } from 'vitest';
import type { Recipe } from './recipe';
import { countActiveFilters, EMPTY_FILTERS, matchesFilters, relatedRecipes, searchRecipes, suggest } from './search';

function make(partial: Partial<Recipe> & { id: string; title: string }): Recipe {
  return {
    description: 'Descripción de prueba suficientemente larga.',
    diet: 'vegana',
    category: 'plato-principal',
    cuisine: 'Internacional',
    difficulty: 'fácil',
    prepTimeMinutes: 10,
    cookTimeMinutes: 10,
    servings: 2,
    ingredients: [
      { name: 'garbanzos cocidos', quantity: 400, unit: 'g' },
      { name: 'cebolla', quantity: 1, unit: 'unidad' },
      { name: 'sal', quantity: null, unit: null, note: 'al gusto' },
    ],
    steps: ['Paso uno de la receta.', 'Paso dos de la receta.', 'Paso tres de la receta.'],
    tags: ['rápido'],
    tips: ['Consejo de prueba'],
    nutrition: { calories: 300, protein: 12, carbs: 40, fat: 8, fiber: 9 },
    sources: [{ name: 'Fuente', url: 'https://ejemplo.com/receta' }],
    ...partial,
  };
}

const RECIPES: Recipe[] = [
  make({ id: 'curry-de-garbanzos', title: 'Curry de garbanzos', cuisine: 'India', tags: ['picante', 'una olla'], nutrition: { calories: 420, protein: 15, carbs: 50, fat: 14, fiber: 12 } }),
  make({ id: 'ensalada-griega', title: 'Ensalada griega', category: 'ensalada', cuisine: 'Griega', diet: 'vegetariana', veganAlternative: 'Sustituye el feta por tofu marinado.', ingredients: [{ name: 'tomate', quantity: 2, unit: 'unidad' }, { name: 'queso feta', quantity: 100, unit: 'g' }, { name: 'pepino', quantity: 1, unit: 'unidad' }], prepTimeMinutes: 15, cookTimeMinutes: 0, nutrition: { calories: 250, protein: 8, carbs: 12, fat: 18, fiber: 4 } }),
  make({ id: 'sopa-de-lentejas', title: 'Sopa de lentejas', category: 'sopa', difficulty: 'media', cookTimeMinutes: 40, tags: ['reconfortante'], ingredients: [{ name: 'lentejas', quantity: 300, unit: 'g' }, { name: 'zanahoria', quantity: 2, unit: 'unidad' }, { name: 'cebolla', quantity: 1, unit: 'unidad' }], nutrition: { calories: 320, protein: 18, carbs: 45, fat: 4, fiber: 15 } }),
  make({ id: 'tacos-de-coliflor', title: 'Tacos de coliflor al pastor', cuisine: 'Mexicana', tags: ['picante'], ingredients: [{ name: 'coliflor', quantity: 1, unit: 'unidad' }, { name: 'tortillas de maíz', quantity: 8, unit: 'unidad' }, { name: 'piña', quantity: 150, unit: 'g' }] }),
];

describe('searchRecipes', () => {
  it('sin consulta devuelve todo ordenado por título', () => {
    const r = searchRecipes(RECIPES, EMPTY_FILTERS).map((x) => x.recipe.id);
    expect(r).toEqual(['curry-de-garbanzos', 'ensalada-griega', 'sopa-de-lentejas', 'tacos-de-coliflor']);
  });

  it('busca por título ignorando tildes y mayúsculas', () => {
    const r = searchRecipes(RECIPES, { ...EMPTY_FILTERS, query: 'GARBÁNZOS' });
    expect(r[0].recipe.id).toBe('curry-de-garbanzos');
  });

  it('busca por ingrediente', () => {
    const r = searchRecipes(RECIPES, { ...EMPTY_FILTERS, query: 'cebolla' }).map((x) => x.recipe.id);
    expect(r).toEqual(expect.arrayContaining(['curry-de-garbanzos', 'sopa-de-lentejas']));
    expect(r).not.toContain('ensalada-griega');
  });

  it('exige que todos los tokens coincidan (AND)', () => {
    const r = searchRecipes(RECIPES, { ...EMPTY_FILTERS, query: 'coliflor pastor' }).map((x) => x.recipe.id);
    expect(r).toEqual(['tacos-de-coliflor']);
    expect(searchRecipes(RECIPES, { ...EMPTY_FILTERS, query: 'coliflor lentejas' })).toHaveLength(0);
  });

  it('prioriza coincidencias en título sobre coincidencias en descripción', () => {
    const list = [
      make({ id: 'a', title: 'Otra cosa', description: 'Una receta con tofu marinado muy sabrosa.' }),
      make({ id: 'b', title: 'Tofu crujiente' }),
    ];
    const r = searchRecipes(list, { ...EMPTY_FILTERS, query: 'tofu' }).map((x) => x.recipe.id);
    expect(r).toEqual(['b', 'a']);
  });

  it('coincide por prefijo de palabra del título', () => {
    const r = searchRecipes(RECIPES, { ...EMPTY_FILTERS, query: 'lent' }).map((x) => x.recipe.id);
    expect(r).toEqual(['sopa-de-lentejas']);
  });

  it('filtra por dieta, categoría, cocina, dificultad y tiempo', () => {
    expect(searchRecipes(RECIPES, { ...EMPTY_FILTERS, diet: 'vegetariana' }).map((x) => x.recipe.id)).toEqual(['ensalada-griega']);
    expect(searchRecipes(RECIPES, { ...EMPTY_FILTERS, categories: ['sopa'] }).map((x) => x.recipe.id)).toEqual(['sopa-de-lentejas']);
    expect(searchRecipes(RECIPES, { ...EMPTY_FILTERS, cuisines: ['Mexicana', 'India'] })).toHaveLength(2);
    expect(searchRecipes(RECIPES, { ...EMPTY_FILTERS, difficulties: ['media'] }).map((x) => x.recipe.id)).toEqual(['sopa-de-lentejas']);
    expect(searchRecipes(RECIPES, { ...EMPTY_FILTERS, maxTime: 20 })).toHaveLength(3);
  });

  it('filtra por etiquetas (todas deben estar)', () => {
    expect(searchRecipes(RECIPES, { ...EMPTY_FILTERS, tags: ['picante'] })).toHaveLength(2);
    expect(searchRecipes(RECIPES, { ...EMPTY_FILTERS, tags: ['picante', 'una olla'] }).map((x) => x.recipe.id)).toEqual(['curry-de-garbanzos']);
  });

  it('incluye y excluye ingredientes', () => {
    expect(searchRecipes(RECIPES, { ...EMPTY_FILTERS, includeIngredients: ['cebolla'] })).toHaveLength(2);
    expect(searchRecipes(RECIPES, { ...EMPTY_FILTERS, excludeIngredients: ['cebolla'] }).map((x) => x.recipe.id)).toEqual(['ensalada-griega', 'tacos-de-coliflor']);
    expect(searchRecipes(RECIPES, { ...EMPTY_FILTERS, includeIngredients: ['cebolla'], excludeIngredients: ['lentejas'] }).map((x) => x.recipe.id)).toEqual(['curry-de-garbanzos']);
  });

  it('ordena por rapidez, calorías y proteína', () => {
    expect(searchRecipes(RECIPES, { ...EMPTY_FILTERS, sort: 'rapidas' })[0].recipe.id).toBe('ensalada-griega');
    expect(searchRecipes(RECIPES, { ...EMPTY_FILTERS, sort: 'calorias' })[0].recipe.id).toBe('ensalada-griega');
    expect(searchRecipes(RECIPES, { ...EMPTY_FILTERS, sort: 'proteina' })[0].recipe.id).toBe('sopa-de-lentejas');
  });
});

describe('matchesFilters / countActiveFilters', () => {
  it('cuenta filtros activos', () => {
    expect(countActiveFilters(EMPTY_FILTERS)).toBe(0);
    expect(countActiveFilters({ ...EMPTY_FILTERS, diet: 'vegana', categories: ['sopa', 'postre'], maxTime: 30, includeIngredients: ['tofu'] })).toBe(5);
  });
  it('matchesFilters respeta el tiempo máximo', () => {
    expect(matchesFilters(RECIPES[2], { ...EMPTY_FILTERS, maxTime: 30 })).toBe(false);
    expect(matchesFilters(RECIPES[2], { ...EMPTY_FILTERS, maxTime: 60 })).toBe(true);
  });
});

describe('suggest', () => {
  it('sugiere títulos e ingredientes sin duplicar', () => {
    expect(suggest(RECIPES, 'col')).toEqual(['Tacos de coliflor al pastor', 'coliflor']);
    expect(suggest(RECIPES, 'x')).toEqual([]);
    expect(suggest(RECIPES, 'a')).toEqual([]);
    expect(suggest(RECIPES, 'de', 2)).toHaveLength(2);
  });
});

describe('relatedRecipes', () => {
  it('prioriza misma categoría e ingredientes en común y excluye la actual', () => {
    const related = relatedRecipes(RECIPES, RECIPES[0], 2).map((r) => r.id);
    expect(related).not.toContain('curry-de-garbanzos');
    expect(related[0]).toBe('tacos-de-coliflor');
  });
});
