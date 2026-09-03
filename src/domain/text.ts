/**
 * Normaliza texto para búsquedas: minúsculas, sin tildes ni diacríticos (la ñ pasa a n
 * para que "noquis" encuentre "Ñoquis"), sin símbolos y con espacios colapsados.
 */
export function normalize(text: string): string {
  return text
    .normalize('NFD')
    .replace(/\p{M}/gu, '')
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/** Divide una consulta en tokens normalizados no vacíos. */
export function tokenize(query: string): string[] {
  return normalize(query)
    .split(' ')
    .filter((t) => t.length > 0);
}

/** Convierte un texto en un slug kebab-case ASCII. */
export function slugify(text: string): string {
  return normalize(text)
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/[\s-]+/g, '-');
}

export function capitalize(text: string): string {
  if (!text) return text;
  return text.charAt(0).toUpperCase() + text.slice(1);
}

/** Extrae duraciones en minutos mencionadas en un paso ("15 minutos", "1 hora", "2-3 min"). */
export function extractMinutes(step: string): number[] {
  const out: number[] = [];
  const re = /(\d+)(?:\s*(?:a|-|–)\s*(\d+))?\s*(minutos?|min\b|horas?|h\b)/gi;
  let m: RegExpExecArray | null;
  while ((m = re.exec(step)) !== null) {
    const value = Number(m[2] ?? m[1]);
    const unit = m[3].toLowerCase();
    const minutes = unit.startsWith('h') ? value * 60 : value;
    if (minutes > 0 && minutes <= 24 * 60 && !out.includes(minutes)) out.push(minutes);
  }
  return out;
}
