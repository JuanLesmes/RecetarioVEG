import { describe, expect, it } from 'vitest';
import type { Recipe } from './recipe';
import { emptyDraft } from './userRecipe';
import { analyzeDraft, buildGlossary, detectDiet, draftCompleteness, isAnimalProduct, suggestColombianName, suggestDifficulty, suggestTags, suggestVisual } from './recipeAssistant';

const ing = (name: string) => ({ name, quantity: 1 as number | null, unit: 'unidad' as const });

describe('detectDiet / isAnimalProduct', () => {
  it('reconoce huevo, lácteos y miel como vegetariano', () => {
    expect(detectDiet([ing('huevos'), ing('papa')])).toBe('vegetariana');
    expect(detectDiet([ing('queso campesino')])).toBe('vegetariana');
    expect(detectDiet([ing('miel')])).toBe('vegetariana');
    expect(detectDiet([ing('leche entera')])).toBe('vegetariana');
    expect(detectDiet([ing('crema de leche')])).toBe('vegetariana');
  });
  it('no confunde alternativas vegetales', () => {
    expect(isAnimalProduct(ing('leche de coco'))).toBe(false);
    expect(isAnimalProduct(ing('mantequilla de maní'))).toBe(false);
    expect(isAnimalProduct(ing('miel de maple'))).toBe(false);
    expect(isAnimalProduct(ing('yogur vegetal natural'))).toBe(false);
    expect(detectDiet([ing('tofu firme'), ing('leche de almendras'), ing('margarina vegetal')])).toBe('vegana');
  });
});

describe('suggestTags', () => {
  it('sugiere etiquetas coherentes con ingredientes, tiempo y nutrición', () => {
    const draft = { ...emptyDraft(), prepTimeMinutes: 10, cookTimeMinutes: 15, ingredients: [ing('lentejas'), ing('ají'), ing('tofu')], steps: ['Cocina en la olla 15 minutos.', 'Sirve caliente.', 'Disfruta.'], nutrition: { calories: 320, protein: 18, carbs: 40, fat: 8, fiber: 12 } };
    const tags = suggestTags(draft);
    expect(tags).toContain('rápido');
    expect(tags).toContain('sin gluten');
    expect(tags).toContain('alto en proteína');
    expect(tags).toContain('bajo en calorías');
    expect(tags).toContain('picante');
    expect(tags).not.toContain('sin soya');
    expect(tags.length).toBeLessThanOrEqual(6);
  });
  it('detecta gluten y horno', () => {
    const draft = { ...emptyDraft(), prepTimeMinutes: 20, cookTimeMinutes: 40, ingredients: [ing('harina de trigo'), ing('nueces'), ing('banano')], steps: ['Mezcla todo.', 'Hornea a 180 °C por 40 minutos.', 'Deja enfriar.'], nutrition: { calories: 420, protein: 6, carbs: 60, fat: 14, fiber: 3 } };
    const tags = suggestTags(draft);
    expect(tags).not.toContain('sin gluten');
    expect(tags).not.toContain('sin frutos secos');
    expect(tags).toContain('al horno');
    expect(tags).not.toContain('rápido');
  });
});

describe('suggestVisual / suggestDifficulty', () => {
  it('elige la ilustración por palabras clave del título o por categoría', () => {
    expect(suggestVisual('Tacos de coliflor', 'plato-principal')).toBe('taco');
    expect(suggestVisual('Crema de ahuyama', 'sopa')).toBe('soup');
    expect(suggestVisual('Lentejas guisadas', 'plato-principal')).toBe('stew');
    expect(suggestVisual('Algo sin pistas', 'postre')).toBe('cake');
    expect(suggestVisual('Plato especial', 'plato-principal', [ing('tofu')])).toBe('tofu');
  });
  it('estima la dificultad por tiempo y pasos', () => {
    const base = emptyDraft();
    expect(suggestDifficulty({ ...base, prepTimeMinutes: 10, cookTimeMinutes: 10, steps: ['a', 'b', 'c'] })).toBe('fácil');
    expect(suggestDifficulty({ ...base, prepTimeMinutes: 30, cookTimeMinutes: 30, steps: ['a', 'b', 'c', 'd', 'e', 'f', 'g'] })).toBe('media');
    expect(suggestDifficulty({ ...base, prepTimeMinutes: 60, cookTimeMinutes: 60, steps: Array(11).fill('paso') })).toBe('difícil');
  });
});

describe('glosario colombiano', () => {
  const catalog = [
    { ingredients: [{ name: 'ahuyama', quantity: 1, unit: 'unidad', aliases: ['calabaza', 'zapallo'] }, { name: 'maní', quantity: 1, unit: 'taza', aliases: ['cacahuate'] }] },
  ] as unknown as Recipe[];
  const glossary = buildGlossary(catalog);

  it('construye el mapa alias -> canónico y sugiere el nombre colombiano', () => {
    expect(glossary.get('calabaza')).toBe('ahuyama');
    expect(suggestColombianName('calabaza', glossary)).toBe('ahuyama');
    expect(suggestColombianName('Calabaza asada', glossary)).toBe('ahuyama');
    expect(suggestColombianName('cacahuates tostados', glossary)).toBeNull();
    expect(suggestColombianName('ahuyama', glossary)).toBeNull();
    expect(suggestColombianName('papa', glossary)).toBeNull();
  });
});

describe('draftCompleteness / analyzeDraft', () => {
  it('mide el avance del borrador', () => {
    const empty = draftCompleteness(emptyDraft());
    expect(empty.percent).toBeLessThan(30);
    expect(empty.missing).toContain('Título');
  });

  it('genera sugerencias aplicables', () => {
    const draft = {
      ...emptyDraft(),
      title: 'Guacamole',
      description: 'Un guacamole cremoso con limón y cilantro, listo en minutos para acompañar.',
      diet: 'vegana' as const,
      ingredients: [ing('aguacate'), ing('queso campesino'), ing('calabaza')],
      steps: ['Machaca el aguacate con un tenedor.', 'Mezcla con el resto y sirve.', 'Ajusta la sal.'],
      tags: ['rápido' as const],
      prepTimeMinutes: 30,
      cookTimeMinutes: 20,
    };
    const glossary = new Map([['calabaza', 'ahuyama']]);
    const suggestions = analyzeDraft(draft, { catalogTitles: ['Guacamole'], glossary });
    const ids = suggestions.map((s) => s.id);
    expect(ids).toContain('titulo-duplicado');
    expect(ids).toContain('dieta');
    expect(ids).toContain('nombre-2');
    expect(ids).toContain('rapido');
    expect(ids).toContain('visual');

    const diet = suggestions.find((s) => s.id === 'dieta')!;
    expect(diet.apply!(draft).diet).toBe('vegetariana');
    const name = suggestions.find((s) => s.id === 'nombre-2')!;
    const applied = name.apply!(draft);
    expect(applied.ingredients[2].name).toBe('ahuyama');
    expect(applied.ingredients[2].aliases).toContain('calabaza');
    const quick = suggestions.find((s) => s.id === 'rapido')!;
    expect(quick.apply!(draft).tags).not.toContain('rápido');
  });

  it('devuelve "todo en orden" cuando no hay nada que sugerir', () => {
    const draft = {
      ...emptyDraft(),
      title: 'Arroz con coco de la casa',
      description: 'Arroz con coco al estilo de la costa, dulce y salado, ideal con patacones.',
      visual: 'rice' as const,
      diet: 'vegana' as const,
      difficulty: 'media' as const,
      ingredients: [ing('arroz'), ing('leche de coco'), ing('panela')],
      steps: ['Cocina la leche de coco 20 minutos hasta que suelte el aceite.', 'Agrega el arroz y la panela y cocina 25 minutos.', 'Deja reposar tapado 10 minutos antes de servir.'],
      tags: ['sin gluten' as const, 'sin soya' as const, 'sin frutos secos' as const, 'tradicional' as const, 'sin horno' as const],
      tips: ['Usa leche de coco de lata para más sabor.'],
      nutrition: { calories: 420, protein: 6, carbs: 70, fat: 12, fiber: 3 },
      prepTimeMinutes: 10,
      cookTimeMinutes: 45,
    };
    const suggestions = analyzeDraft(draft, { catalogTitles: [], glossary: new Map() });
    expect(suggestions.map((s) => s.id)).toEqual(['ok']);
    expect(draftCompleteness(draft).percent).toBe(100);
  });
});
