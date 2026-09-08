import type { Completeness, Suggestion } from '@/domain/recipeAssistant';
import type { UserRecipeData } from '@/domain/userRecipe';
import { Button } from '@/components/ui/Button';
import { Icon, type IconName } from '@/components/ui/Icon';

interface AssistantPanelProps {
  completeness: Completeness;
  suggestions: Suggestion[];
  onApply: (apply: (draft: UserRecipeData) => UserRecipeData) => void;
}

const LEVEL_ICON: Record<Suggestion['level'], IconName> = { info: 'lightbulb', warn: 'alert', success: 'check-circle' };

export function AssistantPanel({ completeness, suggestions, onApply }: AssistantPanelProps) {
  return (
    <aside className="assistant" aria-label="Asistente de la receta" data-testid="assistant">
      <div className="assistant__head">
        <span className="eyebrow">Asistente</span>
        <strong>{completeness.percent}% completa</strong>
      </div>
      <div className="progress" role="progressbar" aria-valuemin={0} aria-valuemax={100} aria-valuenow={completeness.percent} aria-label="Avance de la receta">
        <div className="progress__bar" style={{ width: `${completeness.percent}%` }} />
      </div>
      {completeness.missing.length > 0 ? (
        <p className="muted assistant__missing">Falta: {completeness.missing.join(' · ')}</p>
      ) : (
        <p className="assistant__missing match__ok">Lista para guardar.</p>
      )}
      <ul className="assistant__list">
        {suggestions.map((s) => (
          <li key={s.id} className={`assistant__item assistant__item--${s.level}`} data-testid={`suggestion-${s.id}`}>
            <Icon name={LEVEL_ICON[s.level]} className="assistant__icon" />
            <div className="assistant__body">
              <p>{s.message}</p>
              {s.apply && s.applyLabel ? (
                <Button size="sm" variant="secondary" onClick={() => onApply(s.apply!)}>
                  {s.applyLabel}
                </Button>
              ) : null}
            </div>
          </li>
        ))}
      </ul>
    </aside>
  );
}
