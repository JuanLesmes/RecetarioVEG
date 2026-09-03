import { z } from 'zod';

/* ------------------------------------------------------------------ */
/* Vocabularios controlados                                            */
/* ------------------------------------------------------------------ */

export const DIETS = ['vegana', 'vegetariana'] as const;
export type Diet = (typeof DIETS)[number];

export const DIET_LABELS: Record<Diet, string> = {
  vegana: 'Vegana',
  vegetariana: 'Vegetariana',
};

export const CATEGORIES = [
  'desayuno',
  'plato-principal',
  'entrada',
  'sopa',
  'ensalada',
  'postre',
  'snack',
  'bebida',
  'salsa',
  'pan',
] as const;
export type Category = (typeof CATEGORIES)[number];

export const CATEGORY_LABELS: Record<Category, string> = {
  desayuno: 'Desayunos',
  'plato-principal': 'Platos principales',
  entrada: 'Entradas',
  sopa: 'Sopas y guisos',
  ensalada: 'Ensaladas y bowls',
  postre: 'Postres',
  snack: 'Snacks',
  bebida: 'Bebidas',
  salsa: 'Salsas y untables',
  pan: 'Panes',
};

/**
 * Ilustraciones vectoriales disponibles para representar una receta.
 * Cada receta elige la más parecida a su plato; si no indica ninguna se usa la de su categoría.
 */
export const VISUALS = [
  'bowl',
  'salad',
  'soup',
  'stew',
  'curry',
  'noodles',
  'rice',
  'taco',
  'wrap',
  'sandwich',
  'toast',
  'arepa',
  'pancakes',
  'eggs',
  'porridge',
  'parfait',
  'granola',
  'muffin',
  'dumplings',
  'empanada',
  'pie',
  'casserole',
  'pizza',
  'pasta',
  'stuffed',
  'skillet',
  'flatbread',
  'bread',
  'tortilla',
  'falafel',
  'plantain',
  'tofu',
  'tempura',
  'sushi',
  'cake',
  'cookie',
  'brownie',
  'pudding',
  'icecream',
  'truffles',
  'churros',
  'dip',
  'sauce',
  'drink',
  'hotdrink',
  'snack',
] as const;
export type Visual = (typeof VISUALS)[number];

export const VISUAL_LABELS: Record<Visual, string> = {
  bowl: 'Bowl de granos y verduras (buddha bowl, poke, gado-gado, bibimbap)',
  salad: 'Ensalada fresca en bowl',
  soup: 'Sopa, crema o caldo en plato hondo',
  stew: 'Guiso u olla de cuchara (chili, sancocho, potaje, feijoada)',
  curry: 'Plato con arroz y salsa (curry, dal, chana masala, mapo tofu)',
  noodles: 'Fideos en bowl con palillos (pad thai, ramen, soba, mie goreng)',
  rice: 'Plato de arroz (arroz frito, paella, risotto, koshari)',
  taco: 'Tacos',
  wrap: 'Rollo o burrito (rollitos primavera, burritos, enchiladas)',
  sandwich: 'Sánduche o bánh mì',
  toast: 'Tostada o pan con topping (bruschetta, tostada de aguacate)',
  arepa: 'Arepa, pupusa o disco de masa relleno',
  pancakes: 'Torre de pancakes, crepes o tortitas (chilla, okonomiyaki)',
  eggs: 'Huevos o revuelto en sartén (shakshuka, pericos, tofu revuelto, omelette)',
  porridge: 'Avena o porridge en bowl',
  parfait: 'Vaso con capas (pudín de chía, smoothie bowl, yogur con fruta)',
  granola: 'Granola o barritas',
  muffin: 'Muffin o ponqué individual',
  dumplings: 'Dumplings o empanaditas al vapor',
  empanada: 'Empanada, tequeño o pastel horneado en media luna',
  pie: 'Tarta, quiche, pastel de papa o crumble en molde',
  casserole: 'Bandeja horneada por capas (lasaña, moussaka, gratín)',
  pizza: 'Pizza',
  pasta: 'Plato de pasta o ñoquis',
  stuffed: 'Verduras rellenas (pimentones, berenjenas, chiles, champiñones)',
  skillet: 'Salteado en sartén (lomo saltado, kung pao, tinga, stir fry)',
  flatbread: 'Pan plano (pita, chapati, focaccia, naan)',
  bread: 'Pan de molde, cornbread o banana bread',
  tortilla: 'Tortilla de papa o frittata en porción',
  falafel: 'Bolitas fritas u horneadas (falafel, croquetas, albóndigas)',
  plantain: 'Plátano (patacones, tostones, maduros)',
  tofu: 'Cubos de tofu o tempeh en plato',
  tempura: 'Frituras rebozadas (tempura, milanesas)',
  sushi: 'Sushi o rollos de arroz',
  cake: 'Torta, cheesecake, tres leches o tiramisú en porción',
  cookie: 'Galletas o alfajores',
  brownie: 'Brownie o cuadrado horneado',
  pudding: 'Postre cremoso en copa (flan, natilla, panna cotta, arroz con leche, mousse)',
  icecream: 'Helado o nice cream',
  truffles: 'Trufas o bolitas energéticas',
  churros: 'Churros',
  dip: 'Untable con crudités o pan (hummus, guacamole, baba ganoush, tzatziki)',
  sauce: 'Salsa en frasco o bowl con cuchara (pesto, chimichurri, hogao)',
  drink: 'Bebida fría en vaso (limonada, horchata, lassi, batido)',
  hotdrink: 'Bebida caliente en taza (chai, chocolate, leche dorada)',
  snack: 'Snack crujiente en bowl (garbanzos tostados, chips, palomitas)',
};

export const CATEGORY_VISUAL: Record<Category, Visual> = {
  desayuno: 'eggs',
  'plato-principal': 'curry',
  entrada: 'empanada',
  sopa: 'soup',
  ensalada: 'salad',
  postre: 'cake',
  snack: 'snack',
  bebida: 'drink',
  salsa: 'dip',
  pan: 'bread',
};

export const CUISINES = [
  'Mexicana',
  'Colombiana',
  'Peruana',
  'Argentina',
  'Venezolana',
  'Brasileña',
  'Cubana',
  'Chilena',
  'Latinoamericana',
  'Caribeña',
  'Estadounidense',
  'Italiana',
  'Española',
  'Francesa',
  'Griega',
  'Mediterránea',
  'Medio Oriente',
  'Marroquí',
  'Turca',
  'Alemana',
  'Británica',
  'Europea',
  'India',
  'Tailandesa',
  'China',
  'Japonesa',
  'Vietnamita',
  'Coreana',
  'Indonesia',
  'Asiática',
  'Africana',
  'Etíope',
  'Internacional',
] as const;
export type Cuisine = (typeof CUISINES)[number];

export const DIFFICULTIES = ['fácil', 'media', 'difícil'] as const;
export type Difficulty = (typeof DIFFICULTIES)[number];

export const DIFFICULTY_LABELS: Record<Difficulty, string> = {
  fácil: 'Fácil',
  media: 'Media',
  difícil: 'Difícil',
};

export const UNITS = [
  'g',
  'kg',
  'ml',
  'l',
  'cucharada',
  'cucharadita',
  'taza',
  'unidad',
  'pizca',
  'diente',
  'rama',
  'hoja',
  'rebanada',
  'lata',
  'puñado',
  'sobre',
  'manojo',
  'chorrito',
] as const;
export type Unit = (typeof UNITS)[number];

export const TAGS = [
  'rápido',
  'sin gluten',
  'alto en proteína',
  'sin frutos secos',
  'sin soya',
  'económico',
  'para niños',
  'meal prep',
  'picante',
  'sin azúcar añadida',
  'crudo',
  'una olla',
  'al horno',
  'sin horno',
  'bajo en calorías',
  'reconfortante',
  'para fiestas',
  'verano',
  'invierno',
  'tradicional',
  'fusión',
  'airfryer',
] as const;
export type Tag = (typeof TAGS)[number];

/* ------------------------------------------------------------------ */
/* Esquema Zod                                                          */
/* ------------------------------------------------------------------ */

export const ingredientSchema = z.object({
  name: z.string().trim().min(2),
  quantity: z.number().positive().nullable(),
  unit: z.enum(UNITS).nullable(),
  note: z.string().trim().min(1).optional(),
  /** Otros nombres del mismo ingrediente en el mundo hispano (para búsqueda y despensa). */
  aliases: z.array(z.string().trim().min(2)).max(6).optional(),
});

export const nutritionSchema = z.object({
  calories: z.number().int().nonnegative(),
  protein: z.number().int().nonnegative(),
  carbs: z.number().int().nonnegative(),
  fat: z.number().int().nonnegative(),
  fiber: z.number().int().nonnegative(),
});

export const sourceSchema = z.object({
  name: z.string().trim().min(2),
  url: z
    .string()
    .url()
    .refine((u) => /^https?:\/\//.test(u), 'Debe ser http(s)'),
});

export const recipeSchema = z
  .object({
    id: z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'id debe ser kebab-case ASCII'),
    title: z.string().trim().min(3).max(90),
    description: z.string().trim().min(20).max(400),
    visual: z.enum(VISUALS).optional(),
    diet: z.enum(DIETS),
    category: z.enum(CATEGORIES),
    cuisine: z.enum(CUISINES),
    difficulty: z.enum(DIFFICULTIES),
    prepTimeMinutes: z.number().int().positive(),
    cookTimeMinutes: z.number().int().nonnegative(),
    servings: z.number().int().min(1).max(12),
    ingredients: z.array(ingredientSchema).min(3).max(20),
    steps: z.array(z.string().trim().min(10)).min(3).max(14),
    tags: z.array(z.enum(TAGS)).min(1).max(6),
    tips: z.array(z.string().trim().min(5)).min(1).max(6),
    nutrition: nutritionSchema,
    veganAlternative: z.string().trim().min(10).optional(),
    sources: z.array(sourceSchema).min(1).max(4),
  })
  .strict()
  .superRefine((r, ctx) => {
    if (r.diet === 'vegetariana' && !r.veganAlternative) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['veganAlternative'],
        message: 'Las recetas vegetarianas deben indicar cómo veganizarlas',
      });
    }
    if (r.diet === 'vegana' && r.veganAlternative) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['veganAlternative'],
        message: 'Las recetas veganas no llevan veganAlternative',
      });
    }
    const total = r.prepTimeMinutes + r.cookTimeMinutes;
    if (r.tags.includes('rápido') && total > 30) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['tags'],
        message: `"rápido" requiere ≤ 30 min en total (tiene ${total})`,
      });
    }
  });

export const recipeCollectionSchema = z.array(recipeSchema);

export type Ingredient = z.infer<typeof ingredientSchema>;
export type Nutrition = z.infer<typeof nutritionSchema>;
export type Source = z.infer<typeof sourceSchema>;
export type Recipe = z.infer<typeof recipeSchema>;

/* ------------------------------------------------------------------ */
/* Helpers de dominio                                                   */
/* ------------------------------------------------------------------ */

export function totalTime(recipe: Pick<Recipe, 'prepTimeMinutes' | 'cookTimeMinutes'>): number {
  return recipe.prepTimeMinutes + recipe.cookTimeMinutes;
}

/** Ilustración de una receta: la propia o, si no tiene, la de su categoría. */
export function recipeVisual(recipe: Pick<Recipe, 'visual' | 'category'>): Visual {
  return recipe.visual ?? CATEGORY_VISUAL[recipe.category];
}

export function formatMinutes(minutes: number): string {
  if (minutes < 60) return `${minutes} min`;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return m === 0 ? `${h} h` : `${h} h ${m} min`;
}

export function isCategory(value: string): value is Category {
  return (CATEGORIES as readonly string[]).includes(value);
}

export function isDiet(value: string): value is Diet {
  return (DIETS as readonly string[]).includes(value);
}

export function isDifficulty(value: string): value is Difficulty {
  return (DIFFICULTIES as readonly string[]).includes(value);
}

export function isCuisine(value: string): value is Cuisine {
  return (CUISINES as readonly string[]).includes(value);
}

export function isTag(value: string): value is Tag {
  return (TAGS as readonly string[]).includes(value);
}
