import { describe, expect, it } from 'vitest';
import type { Recipe } from './recipe';
import { ingredientMatches, ingredientTokens, isStaple, matchPantry, pantryVocabulary, suggestIngredients } from './pantry';

function make(partial: Partial<Recipe> & { id: string; title: string; ingredients: Recipe['ingredients'] }): Recipe {
  return {
    description: 'Descripción de prueba suficientemente larga.',
    diet: 'vegana',
    category: 'plato-principal',
    cuisine: 'Colombiana',
    difficulty: 'fácil',
    prepTimeMinutes: 10,
    cookTimeMinutes: 10,
    servings: 2,
    steps: ['Paso uno de la receta.', 'Paso dos de la receta.', 'Paso tres de la receta.'],
    tags: ['rápido'],
    tips: ['Consejo de prueba'],
    nutrition: { calories: 300, protein: 12, carbs: 40, fat: 8, fiber: 9 },
    sources: [{ name: 'Fuente', url: 'https://ejemplo.com/receta' }],
    ...partial,
  };
}

const RECIPES = [
  make({
    id: 'lentejas',
    title: 'Lentejas guisadas',
    ingredients: [
      { name: 'lentejas', quantity: 300, unit: 'g' },
      { name: 'cebolla cabezona', quantity: 1, unit: 'unidad', aliases: ['cebolla'] },
      { name: 'tomate chonto', quantity: 2, unit: 'unidad', aliases: ['tomate', 'jitomate'] },
      { name: 'zanahoria', quantity: 1, unit: 'unidad' },
      { name: 'sal', quantity: null, unit: null, note: 'al gusto' },
      { name: 'aceite de oliva', quantity: 2, unit: 'cucharada' },
    ],
  }),
  make({
    id: 'guacamole',
    title: 'Guacamole',
    category: 'salsa',
    ingredients: [
      { name: 'aguacates', quantity: 2, unit: 'unidad', aliases: ['palta'] },
      { name: 'limón', quantity: 1, unit: 'unidad', aliases: ['lima'] },
      { name: 'cilantro', quantity: 1, unit: 'manojo' },
      { name: 'sal', quantity: null, unit: null },
    ],
  }),
  make({
    id: 'tortilla',
    title: 'Tortilla de papa',
    diet: 'vegetariana',
    veganAlternative: 'Usa harina de garbanzo en lugar de huevo.',
    ingredients: [
      { name: 'papas', quantity: 4, unit: 'unidad', aliases: ['patatas'] },
      { name: 'huevos', quantity: 5, unit: 'unidad' },
      { name: 'cebolla cabezona', quantity: 1, unit: 'unidad' },
      { name: 'aceite de oliva', quantity: 100, unit: 'ml' },
      { name: 'sal', quantity: null, unit: null },
    ],
  }),
];

describe('ingredientTokens / isStaple', () => {
  it('normaliza, quita palabras vacías y singulariza', () => {
    expect(ingredientTokens('Aguacates maduros')).toEqual(['aguacate', 'maduro']);
    expect(ingredientTokens('aceite de oliva')).toEqual(['aceite', 'oliva']);
    expect(ingredientTokens('fríjoles rojos')).toEqual(['frijol', 'rojo']);
    expect(ingredientTokens('nueces')).toEqual(['nuez']);
    expect(ingredientTokens('limones y tomates')).toEqual(['limon', 'tomate']);
    expect(ingredientTokens('champiñones')).toEqual(['champinon']);
  });
  it('reconoce básicos', () => {
    expect(isStaple({ name: 'sal' })).toBe(true);
    expect(isStaple({ name: 'pimienta negra' })).toBe(false);
    expect(isStaple({ name: 'aceite de oliva' })).toBe(false);
    expect(isStaple({ name: 'aceite' })).toBe(true);
    expect(isStaple({ name: 'agua' })).toBe(true);
    expect(isStaple({ name: 'lentejas' })).toBe(false);
  });
});

describe('ingredientMatches', () => {
  const tomate = RECIPES[0].ingredients[2];
  it('coincide por nombre, alias, plural y palabra suelta', () => {
    expect(ingredientMatches('tomate', tomate)).toBe(true);
    expect(ingredientMatches('tomates', tomate)).toBe(true);
    expect(ingredientMatches('jitomate', tomate)).toBe(true);
    expect(ingredientMatches('tomate chonto', tomate)).toBe(true);
    expect(ingredientMatches('Tomaté', tomate)).toBe(true);
  });
  it('no coincide con ingredientes distintos', () => {
    expect(ingredientMatches('tomillo', tomate)).toBe(false);
    expect(ingredientMatches('cebolla', tomate)).toBe(false);
    expect(ingredientMatches('', tomate)).toBe(false);
  });
  it('un término de una palabra coincide con nombres compuestos que la contienen', () => {
    expect(ingredientMatches('cebolla', RECIPES[2].ingredients[2])).toBe(true);
    expect(ingredientMatches('aceite', RECIPES[2].ingredients[3])).toBe(true);
    expect(ingredientMatches('papa', RECIPES[2].ingredients[0])).toBe(true);
    expect(ingredientMatches('patata', RECIPES[2].ingredients[0])).toBe(true);
  });
});

describe('matchPantry', () => {
  it('sin despensa no devuelve nada', () => {
    expect(matchPantry(RECIPES, [])).toEqual([]);
    expect(matchPantry(RECIPES, ['  '])).toEqual([]);
  });

  it('ordena por cobertura y lista los faltantes ignorando básicos', () => {
    const result = matchPantry(RECIPES, ['aguacate', 'limón', 'cebolla', 'papa']);
    expect(result.map((m) => m.recipe.id)).toEqual(['guacamole', 'tortilla', 'lentejas']);
    const guac = result[0];
    expect(guac.total).toBe(3);
    expect(guac.have.map((i) => i.name)).toEqual(['aguacates', 'limón']);
    expect(guac.missing.map((i) => i.name)).toEqual(['cilantro']);
    expect(guac.coverage).toBeCloseTo(2 / 3);
    expect(guac.usedTerms).toEqual(['aguacate', 'limón']);
  });

  it('puede contar los básicos y filtrar por dieta, faltantes máximos o completas', () => {
    const withStaples = matchPantry(RECIPES, ['aguacate'], { ignoreStaples: false });
    expect(withStaples[0].total).toBe(4);

    expect(matchPantry(RECIPES, ['cebolla'], { diet: 'vegetariana' }).map((m) => m.recipe.id)).toEqual(['tortilla']);
    expect(matchPantry(RECIPES, ['cebolla'], { maxMissing: 2 })).toHaveLength(0);
    expect(matchPantry(RECIPES, ['cebolla', 'papa', 'huevo', 'aceite de oliva'], { maxMissing: 0 }).map((m) => m.recipe.id)).toEqual(['tortilla']);
    expect(matchPantry(RECIPES, ['aguacate', 'limón', 'cilantro'], { onlyComplete: true }).map((m) => m.recipe.id)).toEqual(['guacamole']);
  });
});

describe('pantryVocabulary / suggestIngredients', () => {
  it('construye el vocabulario por frecuencia sin básicos y sugiere por prefijo', () => {
    const vocab = pantryVocabulary(RECIPES);
    const names = vocab.map((v) => v.name);
    expect(names.slice(0, 2).sort()).toEqual(['aceite de oliva', 'cebolla cabezona']);
    expect(names).not.toContain('sal');
    expect(names).toContain('palta');
    expect(suggestIngredients(vocab, 'ceb')).toEqual(['cebolla cabezona', 'cebolla']);
    expect(suggestIngredients(vocab, 'ceb', ['cebolla cabezona'])).toEqual(['cebolla']);
    expect(suggestIngredients(vocab, 'a')).toEqual([]);
    expect(suggestIngredients(vocab, 'oliva')).toEqual(['aceite de oliva']);
  });
});
