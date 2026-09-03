import { CATEGORY_LABELS, DIFFICULTY_LABELS, DIET_LABELS } from '@/domain/recipe';
import type { SearchFilters } from '@/domain/search';
import { Chip } from '@/components/ui/Chip';

interface ActiveFiltersProps {
  filters: SearchFilters;
  onChange: (patch: Partial<SearchFilters>) => void;
}

export function ActiveFilters({ filters, onChange }: ActiveFiltersProps) {
  const chips: { key: string; label: string; remove: () => void }[] = [];
  if (filters.diet !== 'todas') chips.push({ key: 'diet', label: DIET_LABELS[filters.diet], remove: () => onChange({ diet: 'todas' }) });
  for (const c of filters.categories)
    chips.push({ key: `cat-${c}`, label: CATEGORY_LABELS[c], remove: () => onChange({ categories: filters.categories.filter((x) => x !== c) }) });
  for (const c of filters.cuisines)
    chips.push({ key: `cui-${c}`, label: c, remove: () => onChange({ cuisines: filters.cuisines.filter((x) => x !== c) }) });
  for (const d of filters.difficulties)
    chips.push({ key: `dif-${d}`, label: DIFFICULTY_LABELS[d], remove: () => onChange({ difficulties: filters.difficulties.filter((x) => x !== d) }) });
  if (filters.maxTime !== null) chips.push({ key: 'time', label: `≤ ${filters.maxTime} min`, remove: () => onChange({ maxTime: null }) });
  for (const t of filters.tags) chips.push({ key: `tag-${t}`, label: t, remove: () => onChange({ tags: filters.tags.filter((x) => x !== t) }) });
  for (const i of filters.includeIngredients)
    chips.push({ key: `inc-${i}`, label: `con ${i}`, remove: () => onChange({ includeIngredients: filters.includeIngredients.filter((x) => x !== i) }) });
  for (const i of filters.excludeIngredients)
    chips.push({ key: `exc-${i}`, label: `sin ${i}`, remove: () => onChange({ excludeIngredients: filters.excludeIngredients.filter((x) => x !== i) }) });

  if (chips.length === 0) return null;
  return (
    <div className="active-filters" aria-label="Filtros activos">
      {chips.map((c) => (
        <Chip key={c.key} selected onRemove={c.remove}>
          {c.label}
        </Chip>
      ))}
    </div>
  );
}
