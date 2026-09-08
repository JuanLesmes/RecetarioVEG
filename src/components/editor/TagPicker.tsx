import { RECIPE_LIMITS, TAGS, type Tag } from '@/domain/recipe';
import { Chip } from '@/components/ui/Chip';

interface TagPickerProps {
  value: Tag[];
  suggested?: Tag[];
  onChange: (tags: Tag[]) => void;
  errors?: string[];
}

export function TagPicker({ value, suggested = [], onChange, errors = [] }: TagPickerProps) {
  const toggle = (tag: Tag) => {
    if (value.includes(tag)) onChange(value.filter((t) => t !== tag));
    else if (value.length < RECIPE_LIMITS.tags.max) onChange([...value, tag]);
  };
  return (
    <div className="editor-block">
      <div className="editor-block__head">
        <div>
          <h3>Etiquetas</h3>
          <p className="muted">
            Elige entre {RECIPE_LIMITS.tags.min} y {RECIPE_LIMITS.tags.max}. Las sugeridas por el asistente aparecen marcadas con un punto.
          </p>
        </div>
        <span className="muted">
          {value.length}/{RECIPE_LIMITS.tags.max}
        </span>
      </div>
      {errors.length > 0 ? (
        <ul className="field-errors" role="alert">
          {errors.map((e) => (
            <li key={e}>{e}</li>
          ))}
        </ul>
      ) : null}
      <div className="filters__chips" role="group" aria-label="Etiquetas">
        {TAGS.map((t) => (
          <Chip key={t} selected={value.includes(t)} onClick={() => toggle(t)} title={suggested.includes(t) ? 'Sugerida por el asistente' : undefined}>
            {suggested.includes(t) && !value.includes(t) ? <span className="chip__dot" aria-hidden="true" /> : null}
            {t}
          </Chip>
        ))}
      </div>
    </div>
  );
}
