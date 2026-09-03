/**
 * Valida los archivos de recetas contra el esquema Zod y reglas de calidad del catálogo.
 *
 *   npm run validate:recipes                 -> valida todo el catálogo
 *   npx tsx scripts/validate-recipes.ts --file sopas.json   -> valida solo un archivo (sin reglas globales)
 */
import { readdirSync, readFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { CATEGORIES, recipeCollectionSchema, type Recipe } from '../src/domain/recipe';

const dir = resolve(process.cwd(), 'src/data/recipes');
const fileArgIndex = process.argv.indexOf('--file');
const onlyFile = fileArgIndex >= 0 ? process.argv[fileArgIndex + 1] : undefined;
const files = readdirSync(dir)
  .filter((f) => f.endsWith('.json'))
  .filter((f) => !onlyFile || f === onlyFile)
  .sort();

if (onlyFile && files.length === 0) {
  console.error(`No existe el archivo ${onlyFile} en ${dir}`);
  process.exit(1);
}

let errors = 0;
const all: Recipe[] = [];
const ids = new Map<string, string>();
const titles = new Map<string, string>();

const fail = (msg: string) => {
  errors += 1;
  console.error(`  ✗ ${msg}`);
};

for (const file of files) {
  const raw = readFileSync(join(dir, file), 'utf8');
  let json: unknown;
  try {
    json = JSON.parse(raw);
  } catch (e) {
    fail(`${file}: JSON inválido (${(e as Error).message})`);
    continue;
  }
  const parsed = recipeCollectionSchema.safeParse(json);
  if (!parsed.success) {
    for (const issue of parsed.error.issues) {
      const idx = typeof issue.path[0] === 'number' ? issue.path[0] : -1;
      const label = idx >= 0 && Array.isArray(json) ? ((json[idx] as { id?: string })?.id ?? `#${idx}`) : '?';
      fail(`${file} → ${label}: ${issue.path.slice(1).join('.') || '(raíz)'}: ${issue.message}`);
    }
    continue;
  }
  for (const r of parsed.data) {
    if (ids.has(r.id)) fail(`Id duplicado "${r.id}" en ${file} y ${ids.get(r.id)}`);
    ids.set(r.id, file);
    const t = r.title.toLowerCase();
    if (titles.has(t)) fail(`Título duplicado "${r.title}" en ${file} y ${titles.get(t)}`);
    titles.set(t, file);
    if (!r.visual) fail(`${file} → ${r.id}: falta "visual"`);
    all.push(r);
  }
  console.log(`  ✓ ${file}: ${parsed.data.length} recetas`);
}

console.log('');
const vegan = all.filter((r) => r.diet === 'vegana').length;
const vegetarian = all.length - vegan;
console.log(`Total: ${all.length} recetas (${vegan} veganas, ${vegetarian} vegetarianas)`);

if (!onlyFile) {
  for (const c of CATEGORIES) {
    const n = all.filter((r) => r.category === c).length;
    console.log(`  · ${c}: ${n}`);
    if (n === 0) fail(`Categoría sin recetas: ${c}`);
  }
  if (all.length < 100) fail(`Se requieren al menos 100 recetas, hay ${all.length}`);
  if (vegan < 40) fail(`Se requieren al menos 40 recetas veganas, hay ${vegan}`);
  if (vegetarian < 30) fail(`Se requieren al menos 30 recetas vegetarianas, hay ${vegetarian}`);
}

if (errors > 0) {
  console.error(`\n${errors} error(es) de validación.`);
  process.exit(1);
}
console.log('\nCatálogo válido ✔');
