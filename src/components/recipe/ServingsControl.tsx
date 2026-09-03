import { Button } from '@/components/ui/Button';

interface ServingsControlProps {
  value: number;
  original: number;
  onChange: (next: number) => void;
  min?: number;
  max?: number;
}

export function ServingsControl({ value, original, onChange, min = 1, max = 24 }: ServingsControlProps) {
  return (
    <div className="servings" role="group" aria-label="Número de porciones">
      <Button variant="ghost" icon="minus" iconOnly size="sm" onClick={() => onChange(Math.max(min, value - 1))} disabled={value <= min}>
        Menos porciones
      </Button>
      <div className="servings__value" aria-live="polite" data-testid="servings-value">
        {value} {value === 1 ? 'porción' : 'porciones'}
        {value !== original ? <small>original: {original}</small> : <small>&nbsp;</small>}
      </div>
      <Button variant="ghost" icon="plus" iconOnly size="sm" onClick={() => onChange(Math.min(max, value + 1))} disabled={value >= max}>
        Más porciones
      </Button>
    </div>
  );
}
