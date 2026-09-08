import { type Difficulty, type Diet, type Ingredient, type Recipe, type Tag, type Visual, RECIPE_LIMITS, VISUALS } from './recipe';
import { extractMinutes, normalize } from './text';
import { ingredientTokens } from './pantry';
import type { UserRecipeData } from './userRecipe';

/* ------------------------------------------------------------------ */
/* Detección de dieta                                                   */
/* ------------------------------------------------------------------ */

/** Términos que indican origen animal (huevo, lácteos, miel). Se comparan por tokens singularizados. */
const NON_VEGAN_TERMS = [
  'huevo',
  'queso',
  'mantequilla',
  'ghee',
  'paneer',
  'yogur',
  'yogurt',
  'crema de leche',
  'crema agria',
  'nata',
  'arequipe',
  'leche condensada',
  'leche evaporada',
  'leche entera',
  'leche deslactosada',
  'suero de leche',
  'mascarpone',
  'ricota',
  'feta',
  'mozzarella',
  'parmesano',
  'miel de abejas',
  'gelatina',
  'buttermilk',
];

/** Excepciones que contienen palabras "animales" pero son vegetales. */
const VEGAN_EXCEPTIONS = ['leche de coco', 'leche de almendras', 'leche de soya', 'leche de avena', 'leche vegetal', 'leche de arroz', 'leche de marañon', 'mantequilla de mani', 'mantequilla de almendras', 'crema de coco', 'crema vegetal', 'yogur vegetal', 'yogur de coco', 'queso vegano', 'queso de marañon', 'miel de maple', 'miel de agave', 'crema de mani', 'mantequilla vegetal', 'margarina'];

function nameHasTerm(name: string, term: string): boolean {
  const tokens = ingredientTokens(name);
  const termTokens = ingredientTokens(term);
  return termTokens.length > 0 && termTokens.every((t) => tokens.includes(t));
}

export function isAnimalProduct(ingredient: Pick<Ingredient, 'name'>): boolean {
  const n = normalize(ingredient.name);
  if (VEGAN_EXCEPTIONS.some((e) => n.includes(e))) return false;
  // "miel" a secas se considera de abejas; "miel de X" ya se trató en las excepciones.
  if (/^miel(\s|$)/.test(n) && !n.includes('miel de')) return true;
  if (/(^|\s)leche(\s|$)/.test(n) && !n.includes('leche de')) return true;
  return NON_VEGAN_TERMS.some((term) => nameHasTerm(ingredient.name, term));
}

export function detectDiet(ingredients: readonly Pick<Ingredient, 'name'>[]): Diet {
  return ingredients.some(isAnimalProduct) ? 'vegetariana' : 'vegana';
}

/* ------------------------------------------------------------------ */
/* Sugerencias de etiquetas, ilustración y dificultad                   */
/* ------------------------------------------------------------------ */

const GLUTEN_TERMS = ['harina de trigo', 'trigo', 'pan', 'pasta', 'espagueti', 'fideos', 'cuscus', 'bulgur', 'cebada', 'seitan', 'soletilla', 'panko', 'miga de pan', 'pan rallado', 'tortillas de trigo', 'galletas', 'cerveza', 'salsa de soya', 'harina'];
const GLUTEN_FREE_EXCEPTIONS = ['harina de garbanzo', 'harina de maiz', 'harina de arroz', 'harina de almendras', 'harina de avena', 'harina de yuca', 'fideos de arroz', 'fideos soba', 'pan sin gluten', 'tamari', 'maicena'];
const SOY_TERMS = ['soya', 'soja', 'tofu', 'tempeh', 'edamame', 'miso', 'salsa de soya', 'tamari', 'kecap manis'];
const NUT_TERMS = ['nuez', 'nueces', 'almendra', 'maranon', 'anacardo', 'pistacho', 'avellana', 'mani', 'cacahuate', 'pecana', 'macadamia', 'pinon'];
const SPICY_TERMS = ['aji', 'chile', 'sriracha', 'gochujang', 'harissa', 'jalapeno', 'chipotle', 'cayena', 'hojuelas de aji', 'pimienta de sichuan', 'sambal'];

function anyIngredient(ingredients: readonly Pick<Ingredient, 'name'>[], terms: readonly string[], exceptions: readonly string[] = []): boolean {
  return ingredients.some((i) => {
    const n = normalize(i.name);
    if (!n) return false;
    if (exceptions.some((e) => n.includes(e))) return false;
    return terms.some((t) => nameHasTerm(i.name, t) || n.includes(t));
  });
}

export function suggestTags(draft: Pick<UserRecipeData, 'ingredients' | 'steps' | 'prepTimeMinutes' | 'cookTimeMinutes' | 'nutrition'>): Tag[] {
  const tags: Tag[] = [];
  const total = draft.prepTimeMinutes + draft.cookTimeMinutes;
  const named = draft.ingredients.filter((i) => i.name.trim());
  const stepsText = normalize(draft.steps.join(' '));
  if (total > 0 && total <= 30) tags.push('rápido');
  if (named.length > 0 && !anyIngredient(named, GLUTEN_TERMS, GLUTEN_FREE_EXCEPTIONS)) tags.push('sin gluten');
  if (draft.nutrition.protein >= 15) tags.push('alto en proteína');
  if (draft.nutrition.calories > 0 && draft.nutrition.calories <= 350) tags.push('bajo en calorías');
  if (anyIngredient(named, SPICY_TERMS)) tags.push('picante');
  if (named.length > 0 && !anyIngredient(named, SOY_TERMS)) tags.push('sin soya');
  if (named.length > 0 && !anyIngredient(named, NUT_TERMS)) tags.push('sin frutos secos');
  if (/\bhorn(o|ea|ear)\b/.test(stepsText)) tags.push('al horno');
  else if (stepsText.length > 40) tags.push('sin horno');
  return tags.slice(0, RECIPE_LIMITS.tags.max);
}

const VISUAL_KEYWORDS: [Visual, string[]][] = [
  ['taco', ['taco']],
  ['arepa', ['arepa', 'pupusa']],
  ['pancakes', ['pancake', 'crepe', 'tortita', 'chilla', 'okonomiyaki', 'hot cake']],
  ['eggs', ['huevo', 'revuelto', 'omelette', 'shakshuka', 'pericos', 'tortilla de huevo']],
  ['porridge', ['avena', 'porridge', 'bircher']],
  ['parfait', ['chia', 'parfait', 'smoothie bowl', 'yogur']],
  ['granola', ['granola', 'barrita']],
  ['muffin', ['muffin', 'ponque', 'cupcake', 'magdalena']],
  ['noodles', ['fideo', 'noodle', 'ramen', 'pad thai', 'soba', 'udon', 'mie goreng', 'pho']],
  ['rice', ['arroz', 'risotto', 'paella', 'koshari', 'pilaf']],
  ['curry', ['curry', 'dal', 'masala', 'tikka', 'mapo']],
  ['soup', ['sopa', 'crema de', 'caldo', 'gazpacho', 'consome']],
  ['stew', ['guiso', 'guisad', 'estofado', 'sancocho', 'chili', 'potaje', 'feijoada', 'tajin', 'goulash', 'frijoles', 'lentejas', 'ajiaco', 'cocido', 'frijolada']],
  ['salad', ['ensalada', 'tabule', 'caprese', 'slaw']],
  ['bowl', ['bowl', 'poke', 'bibimbap', 'gado']],
  ['wrap', ['burrito', 'wrap', 'rollito', 'enchilada', 'enrollado']],
  ['sandwich', ['sanduche', 'sandwich', 'banh mi', 'hamburguesa', 'bocadillo']],
  ['toast', ['tostada', 'bruschetta', 'crostini']],
  ['dumplings', ['dumpling', 'gyoza', 'ravioles', 'wonton']],
  ['empanada', ['empanada', 'tequeno', 'spanakopita', 'pastelito', 'samosa']],
  ['pie', ['tarta', 'quiche', 'pastel de papa', 'pastel de choclo', 'crumble', 'pie']],
  ['casserole', ['lasana', 'moussaka', 'gratin', 'gratinado', 'pastel de verduras']],
  ['pizza', ['pizza', 'calzone']],
  ['pasta', ['pasta', 'espagueti', 'noqui', 'gnocchi', 'macarron', 'fettuccine', 'penne']],
  ['stuffed', ['relleno', 'rellena']],
  ['skillet', ['salteado', 'saltado', 'stir fry', 'wok', 'tinga', 'kung pao', 'a la plancha']],
  ['flatbread', ['pita', 'focaccia', 'chapati', 'naan', 'pan plano']],
  ['bread', ['pan de', 'banana bread', 'cornbread', 'pan integral', 'pan casero']],
  ['tortilla', ['tortilla de papa', 'tortilla espanola', 'frittata']],
  ['falafel', ['falafel', 'croqueta', 'albondiga', 'bolita']],
  ['plantain', ['patacon', 'toston', 'platano']],
  ['tofu', ['tofu', 'tempeh']],
  ['tempura', ['tempura', 'milanesa', 'apanado', 'rebozado', 'frito']],
  ['sushi', ['sushi', 'maki', 'onigiri']],
  ['cake', ['torta', 'cheesecake', 'tres leches', 'tiramisu', 'bizcocho', 'pastel']],
  ['cookie', ['galleta', 'alfajor', 'cookie']],
  ['brownie', ['brownie', 'blondie']],
  ['pudding', ['flan', 'natilla', 'panna cotta', 'arroz con leche', 'mousse', 'pudin', 'budin']],
  ['icecream', ['helado', 'nice cream', 'paleta']],
  ['truffles', ['trufa', 'energy ball', 'bolitas energeticas']],
  ['churros', ['churro', 'bunuelo']],
  ['dip', ['hummus', 'guacamole', 'baba ganoush', 'tzatziki', 'dip', 'untable', 'pate']],
  ['sauce', ['salsa', 'pesto', 'chimichurri', 'hogao', 'aderezo', 'vinagreta']],
  ['hotdrink', ['chocolate caliente', 'chai', 'latte', 'te ', 'cafe', 'leche dorada', 'aromatica', 'infusion']],
  ['drink', ['limonada', 'jugo', 'batido', 'smoothie', 'horchata', 'lassi', 'refresco', 'agua de', 'bebida']],
  ['snack', ['chips', 'crujiente', 'palomitas', 'crocante', 'garbanzos tostados', 'snack']],
];

const CATEGORY_DEFAULT: Record<Recipe['category'], Visual> = {
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

export function suggestVisual(title: string, category: Recipe['category'], ingredients: readonly Pick<Ingredient, 'name'>[] = []): Visual {
  const haystack = normalize(title);
  for (const [visual, keywords] of VISUAL_KEYWORDS) {
    if (keywords.some((k) => haystack.includes(k))) return visual;
  }
  const ingredientText = normalize(ingredients.map((i) => i.name).join(' '));
  if (category === 'plato-principal') {
    if (ingredientText.includes('tofu')) return 'tofu';
    if (ingredientText.includes('arroz')) return 'rice';
    if (ingredientText.includes('pasta') || ingredientText.includes('espagueti')) return 'pasta';
    if (ingredientText.includes('lenteja') || ingredientText.includes('frijol')) return 'stew';
  }
  return CATEGORY_DEFAULT[category];
}

export function suggestDifficulty(draft: Pick<UserRecipeData, 'steps' | 'ingredients' | 'prepTimeMinutes' | 'cookTimeMinutes'>): Difficulty {
  const total = draft.prepTimeMinutes + draft.cookTimeMinutes;
  const steps = draft.steps.filter((s) => s.trim()).length;
  const ingredients = draft.ingredients.filter((i) => i.name.trim()).length;
  const score = (total > 90 ? 2 : total > 45 ? 1 : 0) + (steps > 9 ? 2 : steps > 6 ? 1 : 0) + (ingredients > 14 ? 1 : 0);
  return score >= 3 ? 'difícil' : score >= 1 ? 'media' : 'fácil';
}

/* ------------------------------------------------------------------ */
/* Glosario colombiano a partir del catálogo                            */
/* ------------------------------------------------------------------ */

/** Mapa alias normalizado -> nombre canónico, construido con los `aliases` del catálogo. */
export function buildGlossary(recipes: readonly Recipe[]): Map<string, string> {
  const counts = new Map<string, Map<string, number>>();
  for (const r of recipes) {
    for (const ing of r.ingredients) {
      for (const alias of ing.aliases ?? []) {
        const key = normalize(alias);
        if (!key || key === normalize(ing.name)) continue;
        const byName = counts.get(key) ?? new Map<string, number>();
        byName.set(ing.name, (byName.get(ing.name) ?? 0) + 1);
        counts.set(key, byName);
      }
    }
  }
  const glossary = new Map<string, string>();
  for (const [alias, byName] of counts) {
    const [canonical] = [...byName.entries()].sort((a, b) => b[1] - a[1])[0];
    glossary.set(alias, canonical);
  }
  return glossary;
}

/** Devuelve el nombre colombiano sugerido si el texto coincide con un alias conocido; null si ya está bien. */
export function suggestColombianName(name: string, glossary: ReadonlyMap<string, string>): string | null {
  const key = normalize(name);
  if (!key) return null;
  const direct = glossary.get(key);
  if (direct && normalize(direct) !== key) return direct;
  // Coincidencia por palabra completa (p. ej. "calabaza asada" -> alias "calabaza").
  const tokens = key.split(' ');
  for (const [alias, canonical] of glossary) {
    const aliasTokens = alias.split(' ');
    if (aliasTokens.length > 1 && !key.includes(alias)) continue;
    if (aliasTokens.length === 1 && !tokens.includes(alias)) continue;
    if (normalize(canonical) === key) return null;
    return canonical;
  }
  return null;
}

/* ------------------------------------------------------------------ */
/* Análisis integral del borrador                                       */
/* ------------------------------------------------------------------ */

export type SuggestionLevel = 'info' | 'warn' | 'success';

export interface Suggestion {
  id: string;
  level: SuggestionLevel;
  message: string;
  /** Texto del botón para aplicar la sugerencia automáticamente, si aplica. */
  applyLabel?: string;
  apply?: (draft: UserRecipeData) => UserRecipeData;
}

export interface AssistantContext {
  catalogTitles: readonly string[];
  glossary: ReadonlyMap<string, string>;
}

export interface Completeness {
  percent: number;
  missing: string[];
}

export function draftCompleteness(draft: UserRecipeData): Completeness {
  const checks: [string, boolean][] = [
    ['Título', draft.title.trim().length >= RECIPE_LIMITS.title.min],
    ['Descripción', draft.description.trim().length >= RECIPE_LIMITS.description.min],
    [`Al menos ${RECIPE_LIMITS.ingredients.min} ingredientes`, draft.ingredients.filter((i) => i.name.trim()).length >= RECIPE_LIMITS.ingredients.min],
    [`Al menos ${RECIPE_LIMITS.steps.min} pasos`, draft.steps.filter((s) => s.trim().length >= RECIPE_LIMITS.stepText.min).length >= RECIPE_LIMITS.steps.min],
    ['Al menos un consejo', draft.tips.some((t) => t.trim().length >= 5)],
    ['Al menos una etiqueta', draft.tags.length >= 1],
    ['Nutrición por porción', draft.nutrition.calories > 0],
    ['Ilustración', Boolean(draft.visual)],
    ['Versión vegana (si es vegetariana)', draft.diet === 'vegana' || Boolean(draft.veganAlternative && draft.veganAlternative.trim().length >= 10)],
  ];
  const missing = checks.filter(([, ok]) => !ok).map(([label]) => label);
  return { percent: Math.round(((checks.length - missing.length) / checks.length) * 100), missing };
}

export function analyzeDraft(draft: UserRecipeData, context: AssistantContext): Suggestion[] {
  const out: Suggestion[] = [];
  const named = draft.ingredients.filter((i) => i.name.trim());

  // Título duplicado con el catálogo
  const title = normalize(draft.title);
  if (title && context.catalogTitles.some((t) => normalize(t) === title)) {
    out.push({ id: 'titulo-duplicado', level: 'warn', message: 'Ya existe una receta con ese título en el catálogo. Dale un toque propio, por ejemplo "… de la abuela" o "… al estilo paisa".' });
  }

  // Dieta detectada
  if (named.length >= 2) {
    const detected = detectDiet(named);
    if (detected !== draft.diet) {
      const animal = named.filter(isAnimalProduct).map((i) => i.name);
      out.push({
        id: 'dieta',
        level: 'warn',
        message:
          detected === 'vegetariana'
            ? `Hay ingredientes de origen animal (${animal.join(', ')}), así que la receta es vegetariana, no vegana.`
            : 'No detectamos huevo, lácteos ni miel: la receta puede marcarse como vegana.',
        applyLabel: `Marcar como ${detected}`,
        apply: (d) => ({ ...d, diet: detected, veganAlternative: detected === 'vegana' ? undefined : d.veganAlternative }),
      });
    }
  }
  if (draft.diet === 'vegetariana' && !(draft.veganAlternative && draft.veganAlternative.trim().length >= 10)) {
    out.push({ id: 'veganizar', level: 'info', message: 'Cuenta cómo hacerla vegana (por ejemplo, reemplazar el queso por tofu marinado o el huevo por harina de garbanzo).' });
  }

  // Nombres colombianos
  for (const [idx, ing] of draft.ingredients.entries()) {
    if (!ing.name.trim()) continue;
    const suggested = suggestColombianName(ing.name, context.glossary);
    if (suggested) {
      out.push({
        id: `nombre-${idx}`,
        level: 'info',
        message: `En Colombia "${ing.name}" se conoce como "${suggested}".`,
        applyLabel: `Usar "${suggested}"`,
        apply: (d) => ({
          ...d,
          ingredients: d.ingredients.map((i, j) => (j === idx ? { ...i, name: suggested, aliases: [...new Set([...(i.aliases ?? []), ing.name.trim().toLowerCase()])].slice(0, 6) } : i)),
        }),
      });
    }
  }

  // Etiquetas
  const suggestedTags = suggestTags(draft).filter((t) => !draft.tags.includes(t));
  if (suggestedTags.length > 0 && draft.tags.length < RECIPE_LIMITS.tags.max) {
    const toAdd = suggestedTags.slice(0, RECIPE_LIMITS.tags.max - draft.tags.length);
    out.push({
      id: 'etiquetas',
      level: 'info',
      message: `Etiquetas sugeridas: ${toAdd.join(', ')}.`,
      applyLabel: 'Agregar etiquetas',
      apply: (d) => ({ ...d, tags: [...d.tags, ...toAdd.filter((t) => !d.tags.includes(t))].slice(0, RECIPE_LIMITS.tags.max) }),
    });
  }
  const total = draft.prepTimeMinutes + draft.cookTimeMinutes;
  if (draft.tags.includes('rápido') && total > 30) {
    out.push({
      id: 'rapido',
      level: 'warn',
      message: `La etiqueta "rápido" es para recetas de 30 minutos o menos y esta suma ${total}.`,
      applyLabel: 'Quitar "rápido"',
      apply: (d) => ({ ...d, tags: d.tags.filter((t) => t !== 'rápido') }),
    });
  }

  // Ilustración
  if (!draft.visual && draft.title.trim()) {
    const visual = suggestVisual(draft.title, draft.category, named);
    out.push({ id: 'visual', level: 'info', message: 'Elige una ilustración para tu receta.', applyLabel: 'Usar la sugerida', apply: (d) => ({ ...d, visual }) });
  }

  // Dificultad
  const difficulty = suggestDifficulty(draft);
  if (draft.steps.filter((s) => s.trim()).length >= 3 && difficulty !== draft.difficulty) {
    out.push({
      id: 'dificultad',
      level: 'info',
      message: `Por el tiempo y la cantidad de pasos, la dificultad parece "${difficulty}".`,
      applyLabel: `Marcar "${difficulty}"`,
      apply: (d) => ({ ...d, difficulty }),
    });
  }

  // Pasos: tiempos y verbos
  const stepsWithTime = draft.steps.filter((s) => extractMinutes(s).length > 0).length;
  const cookingSteps = draft.steps.filter((s) => /\b(cocina|hornea|sofr[ií]e|hierve|fr[ií]ta|saltea|deja reposar|cocinar)\b/i.test(s)).length;
  if (cookingSteps >= 2 && stepsWithTime === 0) {
    out.push({ id: 'tiempos', level: 'info', message: 'Agrega tiempos en los pasos de cocción ("sofríe 5 minutos"): la app creará temporizadores automáticamente.' });
  }
  const shortSteps = draft.steps.filter((s) => s.trim() && s.trim().length < RECIPE_LIMITS.stepText.min).length;
  if (shortSteps > 0) {
    out.push({ id: 'pasos-cortos', level: 'warn', message: `Hay ${shortSteps} paso${shortSteps === 1 ? '' : 's'} demasiado corto${shortSteps === 1 ? '' : 's'}: describe qué hacer y cómo saber que está listo.` });
  }

  // Nutrición pendiente
  if (draft.nutrition.calories === 0 && named.length >= RECIPE_LIMITS.ingredients.min) {
    out.push({ id: 'nutricion', level: 'info', message: 'Usa "Estimar automáticamente" para calcular las calorías por porción a partir de los ingredientes.' });
  }

  if (out.length === 0) {
    const completeness = draftCompleteness(draft);
    if (completeness.percent === 100) out.push({ id: 'ok', level: 'success', message: 'Todo en orden: la receta cumple el formato del catálogo.' });
    else out.push({ id: 'pendiente', level: 'info', message: 'Ve completando los campos: el asistente te irá sugiriendo nombres, etiquetas y nutrición a medida que escribes.' });
  }
  return out;
}

export const ALL_VISUALS = VISUALS;
