import { useMemo, useState } from 'react';
import { extractMinutes } from '@/domain/text';
import { Button } from '@/components/ui/Button';
import { Icon } from '@/components/ui/Icon';
import { StepTimer } from './StepTimer';

interface StepListProps {
  steps: string[];
  onProgress?: (done: number, total: number) => void;
}

export function StepList({ steps, onProgress }: StepListProps) {
  const [done, setDone] = useState<Set<number>>(() => new Set());
  const [timers, setTimers] = useState<Record<number, number | undefined>>({});
  const detected = useMemo(() => steps.map(extractMinutes), [steps]);

  const toggle = (idx: number) => {
    setDone((prev) => {
      const next = new Set(prev);
      if (next.has(idx)) next.delete(idx);
      else next.add(idx);
      onProgress?.(next.size, steps.length);
      return next;
    });
  };

  const progress = Math.round((done.size / steps.length) * 100);

  return (
    <div className="stack" style={{ '--stack-gap': '1rem' } as React.CSSProperties}>
      <div className="progress" role="progressbar" aria-valuemin={0} aria-valuemax={100} aria-valuenow={progress} aria-label="Progreso de la receta">
        <div className="progress__bar" style={{ width: `${progress}%` }} />
      </div>
      <ol className="steps" data-testid="step-list">
        {steps.map((step, idx) => {
          const isDone = done.has(idx);
          const minutesOptions = detected[idx];
          const activeTimer = timers[idx];
          return (
            <li key={idx} className={['step', isDone ? 'is-done' : ''].filter(Boolean).join(' ')}>
              <button
                type="button"
                className="step__num"
                onClick={() => toggle(idx)}
                aria-pressed={isDone}
                aria-label={`Marcar paso ${idx + 1} como ${isDone ? 'pendiente' : 'hecho'}`}
              >
                {isDone ? '✓' : idx + 1}
              </button>
              <div>
                <p className="step__text" onClick={() => toggle(idx)}>
                  {step}
                </p>
                {minutesOptions.length > 0 ? (
                  <div className="step__timers">
                    {activeTimer ? (
                      <StepTimer key={`${idx}-${activeTimer}`} minutes={activeTimer} />
                    ) : (
                      minutesOptions.map((m) => (
                        <Button
                          key={m}
                          size="sm"
                          variant="ghost"
                          icon="timer"
                          onClick={(e) => {
                            e.stopPropagation();
                            setTimers((t) => ({ ...t, [idx]: m }));
                          }}
                        >
                          Temporizador {m} min
                        </Button>
                      ))
                    )}
                  </div>
                ) : null}
              </div>
            </li>
          );
        })}
      </ol>
      {done.size === steps.length ? (
        <div className="callout" role="status">
          <h4 className="callout__title">
            <Icon name="party" /> ¡Receta terminada!
          </h4>
          <p>Buen provecho. Puedes reiniciar los pasos para volver a cocinarla.</p>
          <div style={{ marginTop: '0.6rem' }}>
            <Button size="sm" variant="secondary" icon="reset" onClick={() => setDone(new Set())}>
              Reiniciar pasos
            </Button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
