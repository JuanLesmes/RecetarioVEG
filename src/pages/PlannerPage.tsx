import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { countPlannedMeals, MEAL_SLOT_LABELS, MEAL_SLOTS, plannedRecipeIds, slotKey, WEEK_DAYS, type MealSlot, type WeekDay } from '@/domain/planner';
import { recipeVisual, type Category, type Recipe } from '@/domain/recipe';
import { useApp } from '@/store/AppContext';
import { useRecipes } from '@/store/RecipesContext';
import { useDocumentTitle } from '@/hooks/useDocumentTitle';
import { useMediaQuery } from '@/hooks/useMediaQuery';
import { Button } from '@/components/ui/Button';
import { RecipePicker } from '@/components/planner/RecipePicker';
import { DishIllustration } from '@/components/illustrations/DishIllustration';

const SLOT_CATEGORIES: Record<MealSlot, Category[]> = {
  desayuno: ['desayuno'],
  almuerzo: ['plato-principal', 'sopa', 'ensalada'],
  cena: ['plato-principal', 'sopa', 'ensalada', 'entrada'],
};

const DAY_SHORT: Record<WeekDay, string> = {
  lunes: 'Lun',
  martes: 'Mar',
  miércoles: 'Mié',
  jueves: 'Jue',
  viernes: 'Vie',
  sábado: 'Sáb',
  domingo: 'Dom',
};

function todayWeekDay(): WeekDay {
  const idx = (new Date().getDay() + 6) % 7; // lunes = 0
  return WEEK_DAYS[idx];
}

function pickRandom(list: Recipe[], exclude: Set<string>): Recipe | undefined {
  const pool = list.filter((r) => !exclude.has(r.id));
  const source = pool.length ? pool : list;
  return source[Math.floor(Math.random() * source.length)];
}

export function PlannerPage() {
  useDocumentTitle('Planificador semanal');
  const { plan, setMeal, clearMeal, clearPlan, addRecipeToShopping, notify } = useApp();
  const { all: recipes, byId: getRecipeById } = useRecipes();
  const getRecipesByIds = (ids: readonly string[]) => ids.map((id) => getRecipeById(id)).filter((r): r is Recipe => r !== undefined);
  const [target, setTarget] = useState<{ day: WeekDay; slot: MealSlot } | null>(null);
  const [activeDay, setActiveDay] = useState<WeekDay>(() => todayWeekDay());
  const isMobile = useMediaQuery('(max-width: 900px)');

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const planned = useMemo(() => getRecipesByIds(plannedRecipeIds(plan)), [plan, getRecipeById]);
  const totalMeals = countPlannedMeals(plan);
  const totalCalories = useMemo(
    () => Object.values(plan).reduce((sum, id) => sum + (getRecipeById(id)?.nutrition.calories ?? 0), 0),
    [plan, getRecipeById],
  );

  const generateShopping = () => {
    for (const r of planned) addRecipeToShopping(r);
    notify(`${planned.length} receta${planned.length === 1 ? '' : 's'} agregada${planned.length === 1 ? '' : 's'} a la lista de mercado`);
  };

  const fillRandom = () => {
    const used = new Set(Object.values(plan));
    let added = 0;
    for (const day of WEEK_DAYS) {
      for (const slot of MEAL_SLOTS) {
        if (plan[slotKey(day, slot)]) continue;
        const candidates = recipes.filter((r) => SLOT_CATEGORIES[slot].includes(r.category));
        const pick = pickRandom(candidates, used);
        if (pick) {
          setMeal(day, slot, pick.id);
          used.add(pick.id);
          added++;
        }
      }
    }
    notify(added ? `Se completaron ${added} comidas al azar` : 'La semana ya está completa');
  };

  const confirmClear = () => {
    if (window.confirm('¿Vaciar el plan semanal?')) clearPlan();
  };

  const visibleDays = isMobile ? [activeDay] : WEEK_DAYS;

  return (
    <div>
      <div className="page-head">
        <span className="eyebrow">Organízate</span>
        <h1>Planificador semanal</h1>
        <p>Asigna una receta a cada comida. El plan se guarda en tu dispositivo y puedes convertirlo en lista de mercado.</p>
      </div>

      <div className="planner__summary no-print">
        <span className="muted" data-testid="planner-summary">
          <strong>{totalMeals}</strong> de {WEEK_DAYS.length * MEAL_SLOTS.length} comidas planificadas
          {totalMeals > 0 ? <> · ~{Math.round(totalCalories / 7)} kcal/día</> : null}
        </span>
        <div className="planner__actions">
          <Button variant="secondary" icon="sparkles" onClick={fillRandom} data-testid="planner-fill">
            Completar al azar
          </Button>
          <Button variant="primary" icon="cart" onClick={generateShopping} disabled={planned.length === 0} data-testid="planner-shopping">
            Generar lista
          </Button>
          <Button variant="danger" icon="trash" iconOnly onClick={confirmClear} disabled={totalMeals === 0}>
            Vaciar plan
          </Button>
        </div>
      </div>

      {isMobile ? (
        <div className="day-tabs" role="tablist" aria-label="Día de la semana">
          {WEEK_DAYS.map((day) => {
            const count = MEAL_SLOTS.filter((s) => plan[slotKey(day, s)]).length;
            return (
              <button
                key={day}
                type="button"
                role="tab"
                aria-selected={activeDay === day}
                className={['day-tab', activeDay === day ? 'is-active' : ''].join(' ')}
                onClick={() => setActiveDay(day)}
              >
                <span>{DAY_SHORT[day]}</span>
                <span className="day-tab__dots" aria-label={`${count} de 3 comidas`}>
                  {MEAL_SLOTS.map((s) => (
                    <i key={s} className={plan[slotKey(day, s)] ? 'is-on' : ''} />
                  ))}
                </span>
              </button>
            );
          })}
        </div>
      ) : null}

      <div className="planner" role="table" aria-label="Plan semanal">
        {visibleDays.map((day) => (
          <div key={day} className="planner__day" role="row">
            <div className="planner__day-name" role="rowheader">
              {day}
            </div>
            {MEAL_SLOTS.map((slot) => {
              const id = plan[slotKey(day, slot)];
              const recipe = id ? getRecipeById(id) : undefined;
              return (
                <div key={slot} className={['planner__slot', recipe ? 'is-filled' : ''].join(' ')} role="cell" data-testid={`slot-${day}-${slot}`}>
                  <span className="planner__slot-label">{MEAL_SLOT_LABELS[slot]}</span>
                  {recipe ? (
                    <>
                      <div className="planner__recipe">
                        <span className="thumb thumb--sm" style={{ background: `var(--cat-${recipe.category})` }}>
                          <DishIllustration name={recipeVisual(recipe)} />
                        </span>
                        <Link to={`/receta/${recipe.id}`}>{recipe.title}</Link>
                      </div>
                      <Button variant="ghost" icon="x" iconOnly size="sm" className="planner__remove" onClick={() => clearMeal(day, slot)}>
                        Quitar {recipe.title} de {day} {slot}
                      </Button>
                    </>
                  ) : (
                    <Button variant="ghost" size="sm" icon="plus" className="planner__add" onClick={() => setTarget({ day, slot })}>
                      Agregar
                    </Button>
                  )}
                </div>
              );
            })}
          </div>
        ))}
      </div>

      <RecipePicker
        open={target !== null}
        title={target ? `${MEAL_SLOT_LABELS[target.slot]} del ${target.day}` : ''}
        onClose={() => setTarget(null)}
        suggestedCategories={target ? SLOT_CATEGORIES[target.slot] : []}
        onPick={(recipe) => {
          if (target) setMeal(target.day, target.slot, recipe.id);
          setTarget(null);
        }}
      />
    </div>
  );
}
