import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { ServingsControl } from './ServingsControl';

describe('ServingsControl', () => {
  it('incrementa y decrementa dentro de los límites', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<ServingsControl value={1} original={4} onChange={onChange} min={1} max={2} />);
    expect(screen.getByTestId('servings-value')).toHaveTextContent('1 porción');
    expect(screen.getByTestId('servings-value')).toHaveTextContent('original: 4');
    expect(screen.getByRole('button', { name: 'Menos porciones' })).toBeDisabled();
    await user.click(screen.getByRole('button', { name: 'Más porciones' }));
    expect(onChange).toHaveBeenCalledWith(2);
  });

  it('deshabilita "más" en el máximo', () => {
    render(<ServingsControl value={24} original={4} onChange={() => undefined} />);
    expect(screen.getByRole('button', { name: 'Más porciones' })).toBeDisabled();
    expect(screen.getByTestId('servings-value')).toHaveTextContent('24 porciones');
  });
});
