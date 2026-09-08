import { z } from 'zod';
import { recipeBaseSchema, refineRecipeRules, sourceSchema, RECIPE_LIMITS, type Recipe } from './recipe';
import { slugify } from './text';

export const USER_RECIPE_STATUSES = ['privada', 'publicada'] as const;
export type UserRecipeStatus = (typeof USER_RECIPE_STATUSES)[number];

/**
 * Datos de una receta subida por una persona. Es el MISMO formato del catálogo
 * (mismos límites, vocabularios y reglas); la única diferencia es que las
 * referencias son opcionales, porque una receta casera puede no tener fuentes.
 */
export const userRecipeDataSchema = recipeBaseSchema
  .extend({ sources: z.array(sourceSchema).max(RECIPE_LIMITS.sources.max).default([]) })
  .superRefine(refineRecipeRules);

export type UserRecipeData = z.infer<typeof userRecipeDataSchema>;

export const userRecipeSchema = z.object({
  id: z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),
  status: z.enum(USER_RECIPE_STATUSES),
  authorId: z.string().nullable(),
  authorName: z.string().trim().max(60),
  createdAt: z.string(),
  updatedAt: z.string(),
  data: userRecipeDataSchema,
});

export type UserRecipe = z.infer<typeof userRecipeSchema>;

export const userRecipeCollectionSchema = z.array(userRecipeSchema);

/** Genera un id único a partir del título, con un sufijo corto para evitar choques. */
export function newUserRecipeId(title: string, taken: ReadonlySet<string> = new Set()): string {
  const base = slugify(title).slice(0, 60).replace(/-+$/, '') || 'receta';
  let candidate = `${base}-${Math.random().toString(36).slice(2, 6)}`;
  while (taken.has(candidate)) candidate = `${base}-${Math.random().toString(36).slice(2, 6)}`;
  return candidate;
}

/** Vista de una receta de usuario como `Recipe` del catálogo (misma forma), para reutilizar toda la interfaz. */
export function toRecipe(userRecipe: UserRecipe): Recipe {
  return { ...userRecipe.data, id: userRecipe.id };
}

/** Borrador vacío con valores por defecto sensatos para el asistente de creación. */
export function emptyDraft(): UserRecipeData {
  return {
    id: 'borrador',
    title: '',
    description: '',
    visual: undefined,
    diet: 'vegana',
    category: 'plato-principal',
    cuisine: 'Colombiana',
    difficulty: 'fácil',
    prepTimeMinutes: 15,
    cookTimeMinutes: 20,
    servings: 4,
    ingredients: [
      { name: '', quantity: null, unit: null },
      { name: '', quantity: null, unit: null },
      { name: '', quantity: null, unit: null },
    ],
    steps: ['', '', ''],
    tags: [],
    tips: [''],
    nutrition: { calories: 0, protein: 0, carbs: 0, fat: 0, fiber: 0 },
    veganAlternative: undefined,
    sources: [],
  };
}

/** Mensajes de validación en español, agrupados por campo, listos para mostrar en el formulario. */
export function validateDraft(draft: unknown): { ok: true; data: UserRecipeData } | { ok: false; errors: Record<string, string[]> } {
  const parsed = userRecipeDataSchema.safeParse(draft);
  if (parsed.success) return { ok: true, data: parsed.data };
  const errors: Record<string, string[]> = {};
  for (const issue of parsed.error.issues) {
    const field = String(issue.path[0] ?? 'general');
    const detail = issue.path.length > 1 ? `#${Number(issue.path[1]) + 1}${issue.path[2] ? ` (${String(issue.path[2])})` : ''}: ` : '';
    (errors[field] ??= []).push(`${detail}${translateIssue(issue)}`);
  }
  return { ok: false, errors };
}

function translateIssue(issue: z.ZodIssue): string {
  switch (issue.code) {
    case 'too_small':
      if (issue.type === 'string') return issue.minimum === 1 ? 'No puede estar vacío' : `Escribe al menos ${issue.minimum} caracteres`;
      if (issue.type === 'array') return `Agrega al menos ${issue.minimum}`;
      if (issue.type === 'number') return `Debe ser al menos ${issue.minimum}`;
      return 'Valor demasiado pequeño';
    case 'too_big':
      if (issue.type === 'string') return `Máximo ${issue.maximum} caracteres`;
      if (issue.type === 'array') return `Máximo ${issue.maximum}`;
      if (issue.type === 'number') return `Máximo ${issue.maximum}`;
      return 'Valor demasiado grande';
    case 'invalid_enum_value':
      return 'Elige una opción de la lista';
    case 'invalid_type':
      return issue.received === 'undefined' || issue.received === 'null' ? 'Este campo es obligatorio' : 'Valor no válido';
    case 'invalid_string':
      return 'Formato no válido';
    case 'custom':
      return issue.message;
    default:
      return issue.message;
  }
}
