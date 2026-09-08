import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { renderWithProviders } from '@/test/render';
import { createFakeCloud } from '@/test/fakeCloud';
import { AccountPage } from './AccountPage';

describe('AccountPage', () => {
  it('en modo local explica que no hay cuentas y muestra el resumen', () => {
    window.localStorage.setItem('rveg:favorites', JSON.stringify(['a', 'b']));
    renderWithProviders(<AccountPage />, { route: '/cuenta' });
    expect(screen.getByRole('heading', { level: 1, name: 'Mi espacio' })).toBeInTheDocument();
    expect(screen.getByText(/modo local/i)).toBeInTheDocument();
    expect(screen.getByTestId('sync-status')).toHaveTextContent('Guardado en este dispositivo');
    expect(screen.getByRole('link', { name: /Favoritos/ })).toHaveTextContent('2');
  });

  it('permite crear cuenta, muestra el perfil y cierra sesión', async () => {
    const user = userEvent.setup();
    const cloud = createFakeCloud();
    renderWithProviders(<AccountPage />, { route: '/cuenta', adapter: cloud.adapter });
    await screen.findByRole('heading', { level: 1, name: 'Entrar' });

    await user.click(screen.getByTestId('mode-signup'));
    await user.type(screen.getByTestId('auth-name'), 'Juan');
    await user.type(screen.getByTestId('auth-email'), 'juan@test.com');
    await user.type(screen.getByTestId('auth-password'), 'secreta123');
    await user.click(screen.getByTestId('auth-submit'));

    expect(await screen.findByRole('heading', { level: 1, name: 'Hola, Juan' })).toBeInTheDocument();
    await waitFor(() => expect(screen.getByTestId('sync-status')).toHaveTextContent('Sincronizado con tu cuenta'));
    expect(cloud.calls).toContain('saveState');

    await user.click(screen.getByTestId('sign-out'));
    expect(await screen.findByRole('heading', { level: 1, name: 'Entrar' })).toBeInTheDocument();
  });

  it('muestra el error de credenciales incorrectas', async () => {
    const user = userEvent.setup();
    const cloud = createFakeCloud({ users: [{ email: 'ana@test.com', password: 'correcta1', name: 'Ana' }] });
    renderWithProviders(<AccountPage />, { route: '/cuenta', adapter: cloud.adapter });
    await screen.findByRole('heading', { level: 1, name: 'Entrar' });
    await user.type(screen.getByTestId('auth-email'), 'ana@test.com');
    await user.type(screen.getByTestId('auth-password'), 'incorrecta');
    await user.click(screen.getByTestId('auth-submit'));
    expect(await screen.findByTestId('auth-message')).toHaveTextContent('Correo o contraseña incorrectos.');
  });
});
