import { DIET_LABELS, type Diet } from '@/domain/recipe';
import { Icon } from '@/components/ui/Icon';

export function DietBadge({ diet, compact = false }: { diet: Diet; compact?: boolean }) {
  return (
    <span className={`badge badge--${diet}`} data-testid="diet-badge" title={DIET_LABELS[diet]}>
      <Icon name={diet === 'vegana' ? 'leaf' : 'egg'} />
      {compact ? <span className="sr-only">{DIET_LABELS[diet]}</span> : DIET_LABELS[diet]}
    </span>
  );
}
