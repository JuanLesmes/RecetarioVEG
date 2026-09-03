import { render, screen, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { StepList } from './StepList';
import { StepTimer } from './StepTimer';

describe('StepList', () => {
  const steps = ['Pica la cebolla finamente.', 'Sofríe durante 5 minutos a fuego medio.', 'Sirve caliente y disfruta.'];

  it('marca pasos como hechos y actualiza el progreso', async () => {
    const user = userEvent.setup();
    render(<StepList steps={steps} />);
    const bar = screen.getByRole('progressbar');
    expect(bar).toHaveAttribute('aria-valuenow', '0');
    await user.click(screen.getByRole('button', { name: 'Marcar paso 1 como hecho' }));
    expect(bar).toHaveAttribute('aria-valuenow', '33');
    await user.click(screen.getByRole('button', { name: 'Marcar paso 1 como pendiente' }));
    expect(bar).toHaveAttribute('aria-valuenow', '0');
  });

  it('muestra un temporizador solo en pasos con tiempos y celebra al terminar', async () => {
    const user = userEvent.setup();
    render(<StepList steps={steps} />);
    expect(screen.getAllByRole('button', { name: /Temporizador 5 min/ })).toHaveLength(1);
    await user.click(screen.getByRole('button', { name: /Temporizador 5 min/ }));
    expect(screen.getByTestId('step-timer')).toHaveTextContent('05:00');

    for (let i = 1; i <= 3; i++) await user.click(screen.getByRole('button', { name: `Marcar paso ${i} como hecho` }));
    expect(screen.getByText('¡Receta terminada!')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Reiniciar pasos' }));
    expect(screen.getByRole('progressbar')).toHaveAttribute('aria-valuenow', '0');
  });
});

describe('StepTimer', () => {
  it('cuenta hacia atrás, pausa y avisa al finalizar', async () => {
    vi.useFakeTimers();
    const onFinish = vi.fn();
    render(<StepTimer minutes={1} onFinish={onFinish} />);
    const display = screen.getByTestId('timer-display');
    expect(display).toHaveTextContent('01:00');

    const start = screen.getByRole('button', { name: 'Iniciar temporizador' });
    act(() => start.click());
    act(() => vi.advanceTimersByTime(3000));
    expect(display).toHaveTextContent('00:57');

    act(() => screen.getByRole('button', { name: 'Pausar temporizador' }).click());
    act(() => vi.advanceTimersByTime(5000));
    expect(display).toHaveTextContent('00:57');

    act(() => screen.getByRole('button', { name: 'Iniciar temporizador' }).click());
    act(() => vi.advanceTimersByTime(60_000));
    expect(display).toHaveTextContent('¡Listo!');
    expect(onFinish).toHaveBeenCalledTimes(1);

    act(() => screen.getByRole('button', { name: 'Reiniciar temporizador' }).click());
    expect(display).toHaveTextContent('01:00');
    vi.useRealTimers();
  });
});
