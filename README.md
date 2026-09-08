# Recetario VEG

Aplicación web de recetas **veganas y vegetarianas** pensada para usarse desde el celular: 121 recetas con ingredientes nombrados como se piden en Colombia, paso a paso, consejos, información nutricional, buscador con filtros avanzados, **buscador por lo que tienes en la nevera**, escalado de porciones, modo cocina con temporizadores, favoritos, lista de mercado y planificador semanal.

Funciona sin servidor ni cuenta de usuario: es una SPA estática que guarda tus datos en el navegador.

## Puesta en marcha

Requisitos: Node.js 20 o superior.

```bash
npm install
npm run dev
```

Abre <http://localhost:5173>.

| Comando                    | Qué hace                                                            |
| -------------------------- | ------------------------------------------------------------------- |
| `npm run dev`              | Servidor de desarrollo con recarga en caliente                      |
| `npm run build`            | Compila TypeScript y genera `dist/` listo para producción           |
| `npm run preview`          | Sirve `dist/` en <http://localhost:4173>                            |
| `npm test`                 | Pruebas unitarias y de componentes (Vitest + Testing Library)       |
| `npm run test:coverage`    | Igual, con reporte de cobertura                                     |
| `npm run test:e2e`         | Pruebas de extremo a extremo (Playwright, escritorio y móvil)       |
| `npm run validate:recipes` | Valida todo el catálogo de recetas contra el esquema y las reglas   |
| `npm run lint`             | ESLint                                                              |
| `npm run typecheck`        | `tsc -b`                                                            |
| `npm run check`            | typecheck + lint + validación de recetas + pruebas unitarias        |

Antes de la primera ejecución de e2e instala el navegador: `npx playwright install chromium`.

## Funcionalidades

- **Catálogo**: 121 recetas (76 veganas, 45 vegetarianas) en 10 categorías y 28 cocinas. Cada vegetariana incluye cómo veganizarla.
- **Vocabulario colombiano**: ingredientes y pasos usan los nombres con que se compran en Colombia (ahuyama, habichuela, arveja, mazorca, pimentón, cebolla larga, fríjol, maní, marañón, ajonjolí, arequipe, panela, papa criolla...). Cada ingrediente guarda además `aliases` con sus otros nombres hispanos, así la búsqueda y la despensa entienden "calabaza", "cacahuate" o "quinoa". El criterio está documentado en [`src/data/GLOSARIO_COLOMBIA.md`](src/data/GLOSARIO_COLOMBIA.md).
- **Ilustraciones vectoriales**: 46 platos dibujados en SVG (`src/components/illustrations`), iconografía Lucide-style para la interfaz y cero emojis. Cada receta declara su `visual` y, si no, hereda el de su categoría.
- **Despensa ("Cocina con lo que tienes")**: escribes los ingredientes que tienes (con autocompletado del catálogo) y la app ordena las recetas por cobertura, mostrando cuáles puedes hacer ya y qué te falta. Opciones: ignorar básicos (sal, aceite, agua...), solo recetas completas, dieta y máximo de faltantes. La despensa se guarda en el dispositivo.
- **Búsqueda y filtros**: por plato, ingrediente (o alias), cocina o etiqueta, insensible a tildes, con autocompletado; dieta, categoría, tiempo máximo, dificultad, cocina, etiquetas, ingredientes a incluir o excluir; ordenación por relevancia, rapidez, título, calorías o proteína. Todo se refleja en la URL.
- **Receta**: escalado de cantidades al cambiar porciones (con fracciones legibles), checklist de ingredientes, pasos marcables con progreso, temporizadores detectados en el texto de cada paso, nutrición, consejos, referencias consultadas y recetas relacionadas.
- **Modo cocina**: pantalla completa paso a paso, teclado, temporizador y bloqueo de pantalla (Wake Lock) cuando el navegador lo permite.
- **Favoritos**, **lista de mercado** (combina ingredientes repetidos y suma cantidades; vista por receta; copia como texto; impresión) y **planificador semanal** (7 días × 3 comidas, completar al azar, generar lista de mercado).
- **Móvil primero**: navegación inferior de 5 destinos, hoja de filtros inferior, barra de acciones fija en la receta, planificador por día, objetivos táctiles de 44 px, áreas seguras (safe-area) y sin scroll horizontal. Tema claro/oscuro, accesibilidad (roles, etiquetas, foco visible, skip link) e impresión limpia.

## Cuentas, sincronización y recetas de la comunidad

La app funciona en dos modos, sin cambiar el código:

- **Modo local** (por defecto): no hay cuentas; favoritos, despensa, lista de mercado, plan y las recetas que subes se guardan en el navegador. Ideal para probar o para una instalación personal.
- **Modo nube**: con un proyecto de [Supabase](https://supabase.com) (gratis) las personas se registran con correo y contraseña, sus datos se sincronizan entre dispositivos y pueden publicar recetas en la comunidad.

Para activar el modo nube:

1. Crea un proyecto en Supabase y abre el *SQL Editor*. Pega y ejecuta [`supabase/migrations/0001_cuentas_y_recetas.sql`](supabase/migrations/0001_cuentas_y_recetas.sql): crea las tablas `profiles`, `user_state` y `user_recipes` con políticas de seguridad por fila (cada persona solo ve y edita lo suyo; las recetas publicadas son públicas).
2. En *Authentication → Providers* deja activo *Email*. Si quieres registro sin confirmación por correo, desactiva *Confirm email* (recomendado solo para pruebas).
3. Copia `.env.example` como `.env.local` y pega la *Project URL* y la clave pública del proyecto (botón *Connect → App Frameworks → React + Vite* te muestra ambas). La clave puede ir en `VITE_SUPABASE_ANON_KEY` (clave *anon* clásica, `eyJ...`) o en `VITE_SUPABASE_PUBLISHABLE_KEY` (clave *publishable* nueva, `sb_publishable_...`); la app acepta cualquiera. En Vercel o Netlify define las mismas variables en la configuración del proyecto; en GitHub Pages créalas como *Variables* del repositorio (*Settings → Secrets and variables → Actions → Variables*), que el flujo de despliegue ya lee.
4. Reinicia `npm run dev` (o vuelve a desplegar). El icono de cuenta en la cabecera pasa a ofrecer "Entrar / Crear cuenta".

Cómo funciona por dentro:

- Toda la app habla con la nube a través de la interfaz `CloudAdapter` (`src/services/cloud.ts`); `supabaseAdapter.ts` es la implementación y `src/test/fakeCloud.ts` la versión en memoria para pruebas. Cambiar de proveedor no toca componentes.
- Al iniciar sesión, el estado local se **fusiona** con el de la cuenta (nada se pierde: favoritos y despensa se unen, la lista de mercado se une por ítem, el plan conserva lo que solo existía en el dispositivo). Después, cada cambio se sube con un pequeño retraso.
- Las recetas de usuario usan **exactamente el mismo esquema** del catálogo (`userRecipeDataSchema` extiende `recipeBaseSchema`); solo las referencias son opcionales. Se guardan como `privada` o `publicada`.

### Subir recetas con asistente

`/mis-recetas/nueva` es un formulario en 5 pasos con vocabularios cerrados (categoría, cocina, dieta, dificultad, unidades, etiquetas e ilustración) y límites idénticos al catálogo. El asistente (`src/domain/recipeAssistant.ts`) revisa el borrador en vivo:

- detecta si la receta es vegetariana por huevo, lácteos o miel y pide la versión vegana;
- sugiere el nombre colombiano de los ingredientes a partir de los alias del catálogo ("calabaza" → "ahuyama");
- propone etiquetas (rápido, sin gluten, alto en proteína, picante, sin soya, sin frutos secos, al horno), ilustración y dificultad;
- **estima la nutrición por porción** a partir de los ingredientes con una tabla de composición de más de 150 alimentos (`src/domain/nutritionTable.ts`) y conversiones de unidades caseras a gramos;
- muestra las cantidades por porción, detecta tiempos en los pasos para los temporizadores y avisa de títulos repetidos o pasos demasiado cortos.

El borrador se autoguarda en el dispositivo hasta que se guarda o se descarta.

## Arquitectura

```
src/
├── domain/        Lógica pura sin React: búsqueda, escalado, compras, planificador, despensa, nutrición, asistente, esquemas Zod
├── data/          Recetas JSON (una por categoría), índice validado al arrancar, estadísticas, glosario
├── services/      Contrato CloudAdapter y su implementación con Supabase
├── store/         AuthProvider, AppProvider (estado personal), RecipesProvider (catálogo + mías + comunidad), CloudSync
├── hooks/         useLocalStorage, useDebouncedValue, useMediaQuery, useDocumentTitle
├── components/    UI reutilizable: ui/, recipe/, search/, layout/, planner/, illustrations/, editor/
├── pages/         Una página por ruta (Home, Explorar, Receta, Modo cocina, Despensa, Favoritos, Mercado, Planificador, Cuenta, Mis recetas, Editor, Comunidad, Acerca, 404)
supabase/migrations/          Esquema SQL con políticas RLS para el modo nube
├── styles/        Design tokens (CSS custom properties), base, componentes y layout (mobile-first)
└── test/          Configuración de Vitest y utilidades de render
scripts/validate-recipes.ts   Validación del catálogo (esquema + reglas de producto; --file para un solo archivo)
e2e/                          Pruebas Playwright (chromium escritorio + Pixel 7)
```

Principios:

- **Dominio puro y testeable**: toda la lógica de negocio vive en `src/domain` sin dependencias de React, cubierta por pruebas unitarias.
- **Datos validados**: los JSON se cargan con `import.meta.glob` y se validan con Zod al arrancar; un dato inválido rompe el build y las pruebas, nunca llega a la interfaz.
- **URL como estado**: los filtros de exploración viven en los query params, por lo que cualquier búsqueda es compartible y navegable con atrás/adelante.
- **Sin backend**: favoritos, lista, plan y despensa se guardan en `localStorage` con validación al leer y sincronización entre pestañas.

## Esquema de receta

Documentado en [`src/data/RECIPE_SCHEMA.md`](src/data/RECIPE_SCHEMA.md) e implementado en [`src/domain/recipe.ts`](src/domain/recipe.ts). Para añadir recetas, edita o crea un JSON en `src/data/recipes/`, elige un `visual` de la lista `VISUALS` y ejecuta `npm run validate:recipes`.

## Metodología de contenido

Las recetas se redactaron a partir de investigación en sitios de referencia en español e inglés (Danza de Fogones, Minimalist Baker, Directo al Paladar, Cookie and Kate, Rainbow Plant Life, The Mediterranean Dish, My Colombian Recipes, etc.). La descripción, los pasos y los consejos son redacción original; cada receta enlaza las páginas consultadas en su sección de referencias. Después, un pase editorial adaptó todo el vocabulario al español de Colombia siguiendo el glosario. La información nutricional es una estimación orientativa.

## Despliegue

`npm run build` genera un sitio estático en `dist/`. Como usa rutas de navegador (History API), el hosting debe servir `index.html` en cualquier ruta. El repositorio ya trae la configuración para tres opciones:

- **Vercel** (recomendado): importa el repositorio en <https://vercel.com/new>; `vercel.json` define el build y la reescritura de rutas. Cada push a `main` despliega solo.
- **Netlify**: importa el repositorio en <https://app.netlify.com/start>; `netlify.toml` y `public/_redirects` hacen lo mismo.
- **GitHub Pages**: en el repositorio ve a *Settings → Pages* y elige *Source: GitHub Actions*. El flujo `.github/workflows/deploy-pages.yml` compila con la base `/<repositorio>/` y publica en `https://<usuario>.github.io/<repositorio>/` en cada push a `main`.

El flujo `.github/workflows/ci.yml` ejecuta typecheck, lint, validación del catálogo, pruebas unitarias, build y pruebas e2e en cada push y pull request.
