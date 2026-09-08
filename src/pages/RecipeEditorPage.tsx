import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { CATEGORIES, CATEGORY_LABELS, CUISINES, DIFFICULTIES, DIFFICULTY_LABELS, DIET_LABELS, DIETS, RECIPE_LIMITS, type Tag } from '@/domain/recipe';
import { emptyDraft, toRecipe, validateDraft, type UserRecipeData } from '@/domain/userRecipe';
import { analyzeDraft, buildGlossary, draftCompleteness, suggestTags, suggestVisual } from '@/domain/recipeAssistant';
import { pantryVocabulary } from '@/domain/pantry';
import { useApp } from '@/store/AppContext';
import { useAuth } from '@/store/AuthContext';
import { useRecipes } from '@/store/RecipesContext';
import { useDocumentTitle } from '@/hooks/useDocumentTitle';
import { useLocalStorage } from '@/hooks/useLocalStorage';
import { useMediaQuery } from '@/hooks/useMediaQuery';
import { Button } from '@/components/ui/Button';
import { Icon } from '@/components/ui/Icon';
import { RecipeCard } from '@/components/recipe/RecipeCard';
import { IngredientsEditor } from '@/components/editor/IngredientsEditor';
import { StepsEditor } from '@/components/editor/StepsEditor';
import { ListEditor } from '@/components/editor/ListEditor';
import { TagPicker } from '@/components/editor/TagPicker';
import { VisualPicker } from '@/components/editor/VisualPicker';
import { NutritionEstimator } from '@/components/editor/NutritionEstimator';
import { AssistantPanel } from '@/components/editor/AssistantPanel';
import { NotFoundPage } from './NotFoundPage';

const STEPS = ['Lo básico', 'Ingredientes', 'Preparación', 'Detalles', 'Revisar'] as const;

function FieldErrors({ errors }: { errors?: string[] }) {
  if (!errors?.length) return null;
  return (
    <ul className="field-errors" role="alert">
      {errors.map((e) => (
        <li key={e}>{e}</li>
      ))}
    </ul>
  );
}

const isDraftLike = (v: unknown): v is UserRecipeData => !!v && typeof v === 'object' && Array.isArray((v as UserRecipeData).ingredients) && Array.isArray((v as UserRecipeData).steps);

export function RecipeEditorPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { notify } = useApp();
  const { user, cloudEnabled } = useAuth();
  const { catalog, userRecipeById, saveRecipe, all } = useRecipes();
  const isMobile = useMediaQuery('(max-width: 900px)');

  const existing = id ? userRecipeById(id) : undefined;
  const editing = Boolean(id);
  useDocumentTitle(editing ? 'Editar receta' : 'Nueva receta');

  const storageKey = `rveg:draft:${id ?? 'nueva'}`;
  const [draft, setDraft] = useLocalStorage<UserRecipeData>(storageKey, existing?.data ?? emptyDraft(), isDraftLike);
  const [step, setStep] = useState(0);
  const [errors, setErrors] = useState<Record<string, string[]>>({});
  const [saving, setSaving] = useState(false);
  const [assistantOpen, setAssistantOpen] = useState(false);

  // Si se abre "editar" y el borrador guardado corresponde a otra receta, se parte de la receta real.
  useEffect(() => {
    if (existing && draft.id !== existing.id && draft.title === '') setDraft(existing.data);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [existing?.id]);

  const glossary = useMemo(() => buildGlossary(catalog), [catalog]);
  const vocabulary = useMemo(() => pantryVocabulary(catalog).map((v) => v.name), [catalog]);
  const catalogTitles = useMemo(() => all.filter((r) => r.id !== id).map((r) => r.title), [all, id]);
  const suggestions = useMemo(() => analyzeDraft(draft, { catalogTitles, glossary }), [draft, catalogTitles, glossary]);
  const completeness = useMemo(() => draftCompleteness(draft), [draft]);
  const suggestedTags = useMemo(() => suggestTags(draft), [draft]);
  const suggestedVisual = useMemo(() => (draft.title.trim() ? suggestVisual(draft.title, draft.category, draft.ingredients) : undefined), [draft.title, draft.category, draft.ingredients]);

  const patch = useCallback((p: Partial<UserRecipeData>) => setDraft((d) => ({ ...d, ...p })), [setDraft]);
  const applySuggestion = useCallback((apply: (d: UserRecipeData) => UserRecipeData) => setDraft((d) => apply(d)), [setDraft]);

  if (editing && !existing) return <NotFoundPage message="No encontramos esa receta entre las tuyas." />;

  const canPublish = !cloudEnabled || Boolean(user);

  const cleanForValidation = (d: UserRecipeData): UserRecipeData => ({
    ...d,
    id: existing?.id ?? 'borrador',
    title: d.title.trim(),
    description: d.description.trim(),
    ingredients: d.ingredients.filter((i) => i.name.trim()).map((i) => ({ ...i, name: i.name.trim().toLowerCase(), note: i.note?.trim() || undefined, aliases: i.aliases?.length ? i.aliases : undefined })),
    steps: d.steps.map((s) => s.trim()).filter(Boolean),
    tips: d.tips.map((t) => t.trim()).filter(Boolean),
    sources: d.sources.filter((s) => s.name.trim() && s.url.trim()),
    veganAlternative: d.diet === 'vegetariana' ? d.veganAlternative?.trim() || undefined : undefined,
  });

  const save = async (status: 'privada' | 'publicada') => {
    const cleaned = cleanForValidation(draft);
    const result = validateDraft(cleaned);
    if (!result.ok) {
      setErrors(result.errors);
      setStep(firstStepWithErrors(result.errors));
      notify('Revisa los campos marcados antes de guardar.');
      return;
    }
    setErrors({});
    setSaving(true);
    try {
      const saved = await saveRecipe(result.data, { id: existing?.id, status });
      // Se borra el borrador guardado; el componente se desmonta al navegar, así que no vuelve a escribirse.
      window.localStorage.removeItem(storageKey);
      notify(status === 'publicada' ? 'Receta publicada en la comunidad.' : 'Receta guardada en tus recetas.', { label: 'Ver', onAction: () => navigate(`/receta/${saved.id}`) });
      navigate('/mis-recetas');
    } catch (e) {
      notify(`No se pudo guardar: ${(e as Error).message}`);
    } finally {
      setSaving(false);
    }
  };

  const discard = () => {
    if (!window.confirm('¿Descartar los cambios de este borrador?')) return;
    window.localStorage.removeItem(storageKey);
    navigate('/mis-recetas');
  };

  const preview = toRecipe({ id: existing?.id ?? 'vista-previa', status: 'privada', authorId: null, authorName: '', createdAt: '', updatedAt: '', data: { ...draft, id: existing?.id ?? 'vista-previa', title: draft.title || 'Tu receta' } });

  const assistant = <AssistantPanel completeness={completeness} suggestions={suggestions} onApply={applySuggestion} />;

  return (
    <div className="editor">
      <div className="page-head">
        <span className="eyebrow">{editing ? 'Editar' : 'Nueva receta'}</span>
        <h1>{editing ? existing?.data.title : 'Sube tu receta'}</h1>
        <p>Sigue los mismos campos del catálogo para que tu receta quede con el mismo formato: ingredientes con cantidades, pasos claros y nutrición por porción.</p>
      </div>

      <nav className="wizard" aria-label="Pasos del formulario">
        {STEPS.map((label, i) => (
          <button key={label} type="button" className={['wizard__step', i === step ? 'is-active' : '', i < step ? 'is-done' : ''].filter(Boolean).join(' ')} onClick={() => setStep(i)} aria-current={i === step ? 'step' : undefined} data-testid={`wizard-step-${i}`}>
            <span className="wizard__num">{i < step ? <Icon name="check" /> : i + 1}</span>
            <span className="wizard__label">{label}</span>
          </button>
        ))}
      </nav>

      <div className="editor__layout">
        <div className="editor__main">
          {isMobile ? (
            <details className="editor__assistant-mobile" open={assistantOpen} onToggle={(e) => setAssistantOpen((e.target as HTMLDetailsElement).open)}>
              <summary>
                <Icon name="sparkles" /> Asistente · {completeness.percent}% completa
              </summary>
              {assistant}
            </details>
          ) : null}

          {step === 0 ? (
            <section className="panel" aria-labelledby="paso-basico">
              <h2 id="paso-basico" className="panel__title">
                Lo básico
              </h2>
              <label className="field">
                <span className="field__label">Título ({draft.title.trim().length}/{RECIPE_LIMITS.title.max})</span>
                <input className="input" value={draft.title} maxLength={RECIPE_LIMITS.title.max} placeholder="ej. Lentejas guisadas de mi abuela" onChange={(e) => patch({ title: e.target.value })} data-testid="title-input" />
                <FieldErrors errors={errors.title} />
              </label>
              <label className="field">
                <span className="field__label">Descripción ({draft.description.trim().length}/{RECIPE_LIMITS.description.max}, mínimo {RECIPE_LIMITS.description.min})</span>
                <textarea className="input" rows={3} value={draft.description} maxLength={RECIPE_LIMITS.description.max} placeholder="Una o dos frases que antojen: qué es, a qué sabe y cuándo prepararla." onChange={(e) => patch({ description: e.target.value })} data-testid="description-input" />
                <FieldErrors errors={errors.description} />
              </label>
              <div className="field-grid">
                <label className="field">
                  <span className="field__label">Categoría</span>
                  <select className="input" value={draft.category} onChange={(e) => patch({ category: e.target.value as UserRecipeData['category'] })} data-testid="category-select">
                    {CATEGORIES.map((c) => (
                      <option key={c} value={c}>
                        {CATEGORY_LABELS[c]}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="field">
                  <span className="field__label">Cocina</span>
                  <select className="input" value={draft.cuisine} onChange={(e) => patch({ cuisine: e.target.value as UserRecipeData['cuisine'] })}>
                    {CUISINES.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="field">
                  <span className="field__label">Dieta</span>
                  <select className="input" value={draft.diet} onChange={(e) => patch({ diet: e.target.value as UserRecipeData['diet'], veganAlternative: e.target.value === 'vegana' ? undefined : draft.veganAlternative })} data-testid="diet-select">
                    {DIETS.map((d) => (
                      <option key={d} value={d}>
                        {DIET_LABELS[d]}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="field">
                  <span className="field__label">Dificultad</span>
                  <select className="input" value={draft.difficulty} onChange={(e) => patch({ difficulty: e.target.value as UserRecipeData['difficulty'] })}>
                    {DIFFICULTIES.map((d) => (
                      <option key={d} value={d}>
                        {DIFFICULTY_LABELS[d]}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="field">
                  <span className="field__label">Preparación (min)</span>
                  <input className="input" type="number" inputMode="numeric" min={1} max={600} value={draft.prepTimeMinutes} onChange={(e) => patch({ prepTimeMinutes: Math.max(1, Math.round(Number(e.target.value) || 1)) })} />
                  <FieldErrors errors={errors.prepTimeMinutes} />
                </label>
                <label className="field">
                  <span className="field__label">Cocción (min)</span>
                  <input className="input" type="number" inputMode="numeric" min={0} max={600} value={draft.cookTimeMinutes} onChange={(e) => patch({ cookTimeMinutes: Math.max(0, Math.round(Number(e.target.value) || 0)) })} />
                  <FieldErrors errors={errors.cookTimeMinutes} />
                </label>
                <label className="field">
                  <span className="field__label">Porciones ({RECIPE_LIMITS.servings.min} a {RECIPE_LIMITS.servings.max})</span>
                  <input className="input" type="number" inputMode="numeric" min={RECIPE_LIMITS.servings.min} max={RECIPE_LIMITS.servings.max} value={draft.servings} onChange={(e) => patch({ servings: Math.min(RECIPE_LIMITS.servings.max, Math.max(RECIPE_LIMITS.servings.min, Math.round(Number(e.target.value) || 1))) })} data-testid="servings-input" />
                  <FieldErrors errors={errors.servings} />
                </label>
              </div>
              <VisualPicker value={draft.visual} suggested={suggestedVisual} category={draft.category} onChange={(visual) => patch({ visual })} />
            </section>
          ) : null}

          {step === 1 ? (
            <section className="panel">
              <IngredientsEditor ingredients={draft.ingredients} servings={draft.servings} onChange={(ingredients) => patch({ ingredients })} glossary={glossary} vocabulary={vocabulary} errors={errors.ingredients} />
            </section>
          ) : null}

          {step === 2 ? (
            <section className="panel">
              <StepsEditor steps={draft.steps} onChange={(steps) => patch({ steps })} errors={errors.steps} />
            </section>
          ) : null}

          {step === 3 ? (
            <section className="panel">
              <ListEditor label="Consejos" hint={`Trucos, reemplazos o cómo guardarla (${RECIPE_LIMITS.tips.min} a ${RECIPE_LIMITS.tips.max}).`} items={draft.tips} onChange={(tips) => patch({ tips })} min={RECIPE_LIMITS.tips.min} max={RECIPE_LIMITS.tips.max} placeholder="ej. Si queda muy espesa, agrega un poco de caldo." errors={errors.tips} testId="tip" />
              <TagPicker value={draft.tags} suggested={suggestedTags} onChange={(tags: Tag[]) => patch({ tags })} errors={errors.tags} />
              {draft.diet === 'vegetariana' ? (
                <label className="field">
                  <span className="field__label">Versión vegana: cómo hacerla sin huevo, lácteos ni miel</span>
                  <textarea className="input" rows={2} value={draft.veganAlternative ?? ''} placeholder="ej. Reemplaza el queso por tofu firme desmenuzado con una pizca de sal." onChange={(e) => patch({ veganAlternative: e.target.value || undefined })} data-testid="vegan-alternative-input" />
                  <FieldErrors errors={errors.veganAlternative} />
                </label>
              ) : null}
              <NutritionEstimator ingredients={draft.ingredients} servings={draft.servings} value={draft.nutrition} onChange={(nutrition) => patch({ nutrition })} errors={errors.nutrition} />
              <div className="editor-block">
                <div className="editor-block__head">
                  <div>
                    <h3>Referencias (opcional)</h3>
                    <p className="muted">Si te inspiraste en un libro o página, cítalos. Máximo {RECIPE_LIMITS.sources.max}.</p>
                  </div>
                </div>
                <FieldErrors errors={errors.sources} />
                <ul className="list-rows">
                  {draft.sources.map((s, idx) => (
                    <li key={idx} className="list-row list-row--two">
                      <input className="input" value={s.name} placeholder="Nombre" onChange={(e) => patch({ sources: draft.sources.map((x, j) => (j === idx ? { ...x, name: e.target.value } : x)) })} aria-label={`Nombre de la referencia ${idx + 1}`} />
                      <input className="input" value={s.url} placeholder="https://…" inputMode="url" onChange={(e) => patch({ sources: draft.sources.map((x, j) => (j === idx ? { ...x, url: e.target.value } : x)) })} aria-label={`Enlace de la referencia ${idx + 1}`} />
                      <Button variant="ghost" icon="trash" iconOnly size="sm" onClick={() => patch({ sources: draft.sources.filter((_, j) => j !== idx) })}>
                        Quitar referencia {idx + 1}
                      </Button>
                    </li>
                  ))}
                </ul>
                <Button variant="secondary" icon="plus" size="sm" onClick={() => patch({ sources: [...draft.sources, { name: '', url: '' }] })} disabled={draft.sources.length >= RECIPE_LIMITS.sources.max}>
                  Agregar referencia
                </Button>
              </div>
            </section>
          ) : null}

          {step === 4 ? (
            <section className="panel" aria-labelledby="paso-revisar">
              <h2 id="paso-revisar" className="panel__title">
                Revisar y guardar
              </h2>
              <div className="review">
                <div className="review__card">
                  <RecipeCard recipe={preview} />
                </div>
                <div className="review__summary">
                  <dl className="facts">
                    <div className="fact">
                      <dt>Ingredientes</dt>
                      <dd>{draft.ingredients.filter((i) => i.name.trim()).length}</dd>
                    </div>
                    <div className="fact">
                      <dt>Pasos</dt>
                      <dd>{draft.steps.filter((s) => s.trim()).length}</dd>
                    </div>
                    <div className="fact">
                      <dt>Tiempo total</dt>
                      <dd>{draft.prepTimeMinutes + draft.cookTimeMinutes} min</dd>
                    </div>
                    <div className="fact">
                      <dt>Calorías / porción</dt>
                      <dd>{draft.nutrition.calories || '—'}</dd>
                    </div>
                  </dl>
                  {Object.keys(errors).length > 0 ? (
                    <div className="callout callout--accent" role="alert">
                      <h4 className="callout__title">
                        <Icon name="alert" /> Faltan datos
                      </h4>
                      <ul className="review__errors">
                        {Object.entries(errors).map(([field, list]) => (
                          <li key={field}>
                            <strong>{FIELD_LABELS[field] ?? field}:</strong> {list.join(' · ')}
                          </li>
                        ))}
                      </ul>
                    </div>
                  ) : null}
                  <div className="review__actions">
                    <Button variant="primary" icon="save" onClick={() => save('privada')} disabled={saving} data-testid="save-private">
                      Guardar en mis recetas
                    </Button>
                    <Button variant="accent" icon="globe" onClick={() => save('publicada')} disabled={saving || !canPublish} title={canPublish ? undefined : 'Inicia sesión para publicar'} data-testid="save-public">
                      Guardar y publicar
                    </Button>
                  </div>
                  {!canPublish ? (
                    <p className="muted">
                      Para publicar en la comunidad necesitas <Link to="/cuenta">iniciar sesión</Link>. Mientras tanto puedes guardarla en este dispositivo.
                    </p>
                  ) : null}
                  {existing?.status === 'publicada' ? <p className="muted">Esta receta está publicada: al guardar se actualiza para todos.</p> : null}
                </div>
              </div>
            </section>
          ) : null}

          <div className="editor__nav no-print">
            <Button variant="ghost" onClick={discard}>
              Descartar
            </Button>
            <div className="editor__nav-right">
              <Button variant="secondary" icon="chevron-left" onClick={() => setStep((s) => Math.max(0, s - 1))} disabled={step === 0}>
                Anterior
              </Button>
              {step < STEPS.length - 1 ? (
                <Button variant="primary" icon="chevron-right" onClick={() => setStep((s) => Math.min(STEPS.length - 1, s + 1))} data-testid="wizard-next">
                  Siguiente
                </Button>
              ) : (
                <Button variant="primary" icon="save" onClick={() => save('privada')} disabled={saving}>
                  Guardar
                </Button>
              )}
            </div>
          </div>
        </div>

        {!isMobile ? <div className="editor__side">{assistant}</div> : null}
      </div>
    </div>
  );
}

const FIELD_LABELS: Record<string, string> = {
  title: 'Título',
  description: 'Descripción',
  ingredients: 'Ingredientes',
  steps: 'Pasos',
  tips: 'Consejos',
  tags: 'Etiquetas',
  nutrition: 'Nutrición',
  veganAlternative: 'Versión vegana',
  sources: 'Referencias',
  servings: 'Porciones',
  prepTimeMinutes: 'Preparación',
  cookTimeMinutes: 'Cocción',
  visual: 'Ilustración',
  cuisine: 'Cocina',
  category: 'Categoría',
};

function firstStepWithErrors(errors: Record<string, string[]>): number {
  const fields = Object.keys(errors);
  if (fields.some((f) => ['title', 'description', 'category', 'cuisine', 'diet', 'difficulty', 'prepTimeMinutes', 'cookTimeMinutes', 'servings', 'visual'].includes(f))) return 0;
  if (fields.includes('ingredients')) return 1;
  if (fields.includes('steps')) return 2;
  if (fields.some((f) => ['tips', 'tags', 'nutrition', 'veganAlternative', 'sources'].includes(f))) return 3;
  return 4;
}
