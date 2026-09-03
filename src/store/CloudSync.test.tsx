import { act, renderHook, waitFor } from '@testing-library/react';
import type { ReactNode } from 'react';
import { describe, expect, it } from 'vitest';
import { AuthProvider, useAuth } from './AuthContext';
import { AppProvider, useApp } from './AppContext';
import { useCloudSync } from './CloudSync';
import { createFakeCloud } from '@/test/fakeCloud';
import { EMPTY_USER_STATE } from '@/domain/sync';

describe('useCloudSync', () => {
  it('fusiona el estado local con el de la cuenta al entrar y sube los cambios posteriores', async () => {
    const cloud = createFakeCloud({
      users: [{ email: 'ana@test.com', password: 'secreta123', name: 'Ana' }],
      states: { 'user-1': { ...EMPTY_USER_STATE, favorites: ['remota'], pantry: ['arroz'] } },
    });
    window.localStorage.setItem('rveg:favorites', JSON.stringify(['local']));
    window.localStorage.setItem('rveg:pantry', JSON.stringify(['papa']));

    const Wrapper = ({ children }: { children: ReactNode }) => (
      <AuthProvider adapter={cloud.adapter}>
        <AppProvider>{children}</AppProvider>
      </AuthProvider>
    );
    const { result } = renderHook(() => ({ status: useCloudSync(), auth: useAuth(), app: useApp() }), { wrapper: Wrapper });
    expect(result.current.status).toBe('local');

    await act(async () => {
      await result.current.auth.signIn('ana@test.com', 'secreta123');
    });
    await waitFor(() => expect(result.current.status).toBe('sincronizado'));
    expect(result.current.app.favorites).toEqual(['remota', 'local']);
    expect(result.current.app.pantry).toEqual(['arroz', 'papa']);
    expect(cloud.states.get('user-1')?.favorites).toEqual(['remota', 'local']);

    act(() => result.current.app.toggleFavorite('nueva'));
    await waitFor(() => expect(cloud.states.get('user-1')?.favorites).toEqual(['nueva', 'remota', 'local']), { timeout: 3000 });
    await waitFor(() => expect(result.current.status).toBe('sincronizado'));

    await act(async () => {
      await result.current.auth.signOut();
    });
    expect(result.current.status).toBe('local');
  });
});
