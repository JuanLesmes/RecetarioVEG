import { useEffect, useRef, useState } from 'react';
import { Icon } from '@/components/ui/Icon';
import { formatCountdown } from '@/domain/time';

interface StepTimerProps {
  minutes: number;
  onFinish?: () => void;
}

/** Temporizador de cocina: inicia con el tiempo detectado en el paso, permite pausar y reiniciar. */
export function StepTimer({ minutes, onFinish }: StepTimerProps) {
  const total = minutes * 60;
  const [remaining, setRemaining] = useState(total);
  const [running, setRunning] = useState(false);
  const finishedRef = useRef(false);

  useEffect(() => {
    if (!running) return;
    const id = window.setInterval(() => {
      setRemaining((r) => {
        if (r <= 1) {
          window.clearInterval(id);
          setRunning(false);
          return 0;
        }
        return r - 1;
      });
    }, 1000);
    return () => window.clearInterval(id);
  }, [running]);

  useEffect(() => {
    if (remaining === 0 && !finishedRef.current) {
      finishedRef.current = true;
      onFinish?.();
      try {
        if (typeof navigator !== 'undefined' && typeof navigator.vibrate === 'function') navigator.vibrate([200, 100, 200]);
      } catch {
        /* sin soporte de vibración */
      }
    }
  }, [remaining, onFinish]);

  const reset = () => {
    finishedRef.current = false;
    setRemaining(total);
    setRunning(false);
  };

  const done = remaining === 0;
  return (
    <span className={['timer', done ? 'is-done' : ''].filter(Boolean).join(' ')} data-testid="step-timer">
      <Icon name="timer" />
      <span aria-live="polite" data-testid="timer-display">
        {done ? '¡Listo!' : formatCountdown(remaining)}
      </span>
      {!done ? (
        <button type="button" onClick={() => setRunning((r) => !r)} aria-label={running ? 'Pausar temporizador' : 'Iniciar temporizador'}>
          <Icon name={running ? 'pause' : 'play'} />
        </button>
      ) : null}
      <button type="button" onClick={reset} aria-label="Reiniciar temporizador">
        <Icon name="reset" />
      </button>
    </span>
  );
}
