import type { Ingredient, Unit } from './recipe';

const PLURALS: Partial<Record<Unit, string>> = {
  cucharada: 'cucharadas',
  cucharadita: 'cucharaditas',
  taza: 'tazas',
  unidad: 'unidades',
  pizca: 'pizcas',
  diente: 'dientes',
  rama: 'ramas',
  hoja: 'hojas',
  rebanada: 'rebanadas',
  lata: 'latas',
  puñado: 'puñados',
  sobre: 'sobres',
  manojo: 'manojos',
  chorrito: 'chorritos',
};

const FRACTIONS: [number, string][] = [
  [0.125, '⅛'],
  [0.25, '¼'],
  [0.333, '⅓'],
  [0.5, '½'],
  [0.666, '⅔'],
  [0.75, '¾'],
];

/** Unidades "discretas" que se muestran con fracciones legibles en vez de decimales. */
const FRACTIONAL_UNITS = new Set<Unit>([
  'cucharada',
  'cucharadita',
  'taza',
  'unidad',
  'lata',
  'diente',
  'rebanada',
  'hoja',
  'rama',
  'puñado',
  'sobre',
  'manojo',
  'pizca',
  'chorrito',
]);

export function scaleQuantity(quantity: number, fromServings: number, toServings: number): number {
  if (fromServings <= 0 || toServings <= 0) throw new RangeError('Las porciones deben ser positivas');
  return (quantity * toServings) / fromServings;
}

function formatDecimal(value: number, decimals = 1): string {
  const rounded = Number(value.toFixed(decimals));
  return String(rounded).replace('.', ',');
}

/** Formatea una cantidad numérica de forma amigable (fracciones para unidades discretas, redondeo sensato para el resto). */
export function formatQuantity(value: number, unit: Unit | null): string {
  if (!Number.isFinite(value) || value <= 0) return '';
  if (unit === null || FRACTIONAL_UNITS.has(unit)) {
    const whole = Math.floor(value);
    const rest = value - whole;
    // Cerca de un entero: se redondea (1,9 tazas -> 2 tazas). Cerca de una fracción "bonita": se usa la fracción.
    if (rest <= 0.1) return whole === 0 ? formatDecimal(value) : String(whole);
    if (rest >= 0.89) return String(whole + 1);
    const frac = FRACTIONS.reduce((best, cur) => (Math.abs(cur[0] - rest) < Math.abs(best[0] - rest) ? cur : best));
    if (Math.abs(frac[0] - rest) > 0.05) return formatDecimal(value);
    return whole === 0 ? frac[1] : `${whole}${frac[1]}`;
  }
  if (unit === 'g' || unit === 'ml') {
    if (value >= 100) return String(Math.round(value / 5) * 5);
    return String(Math.round(value));
  }
  return formatDecimal(value, 2);
}

export function unitLabel(unit: Unit | null, quantity: number | null): string {
  if (unit === null) return '';
  if (quantity !== null && quantity > 1 && PLURALS[unit]) return PLURALS[unit] as string;
  return unit;
}

export interface ScaledIngredient extends Ingredient {
  scaledQuantity: number | null;
  /** Texto de cantidad + unidad, p. ej. "1½ tazas" o "" si es al gusto. */
  amount: string;
  /** Texto completo legible, p. ej. "1½ tazas de arroz (lavado)". */
  display: string;
}

/** Une cantidad, unidad y nombre con una preposición natural. */
export function describeIngredient(name: string, amount: string, unit: Unit | null, note?: string): string {
  const suffix = note ? ` (${note})` : '';
  if (!amount) return `${name}${suffix}`;
  if (unit === null || unit === 'unidad') return `${amount.replace(/ unidad(es)?$/, '')} ${name}${suffix}`;
  return `${amount} de ${name}${suffix}`;
}

export function scaleIngredient(ingredient: Ingredient, fromServings: number, toServings: number): ScaledIngredient {
  const scaledQuantity =
    ingredient.quantity === null ? null : scaleQuantity(ingredient.quantity, fromServings, toServings);
  const qty = scaledQuantity === null ? '' : formatQuantity(scaledQuantity, ingredient.unit);
  const unit = unitLabel(ingredient.unit, scaledQuantity);
  const amount = [qty, unit].filter(Boolean).join(' ');
  return {
    ...ingredient,
    scaledQuantity,
    amount,
    display: describeIngredient(ingredient.name, amount, ingredient.unit, ingredient.note),
  };
}

export function scaleIngredients(ingredients: Ingredient[], fromServings: number, toServings: number): ScaledIngredient[] {
  return ingredients.map((i) => scaleIngredient(i, fromServings, toServings));
}
