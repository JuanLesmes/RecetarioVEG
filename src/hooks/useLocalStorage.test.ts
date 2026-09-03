import { act, renderHook } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { useLocalStorage } from './useLocalStorage';

describe('useLocalStorage', () => {
  it('lee el valor inicial y persiste cambios', () => {
    const { result } = renderHook(() => useLocalStorage<string[]>('test:key', []));
    expect(result.current[0]).toEqual([]);
    act(() => result.current[1](['a']));
    expect(JSON.parse(window.localStorage.getItem('test:key') ?? 'null')).toEqual(['a']);
  });

  it('recupera el valor guardado y descarta datos corruptos o inválidos', () => {
    window.localStorage.setItem('test:ok', JSON.stringify([1, 2]));
    const ok = renderHook(() => useLocalStorage<number[]>('test:ok', []));
    expect(ok.result.current[0]).toEqual([1, 2]);

    window.localStorage.setItem('test:bad', '{no json');
    const bad = renderHook(() => useLocalStorage<number[]>('test:bad', [9]));
    expect(bad.result.current[0]).toEqual([9]);

    window.localStorage.setItem('test:invalid', JSON.stringify('texto'));
    const isNumArr = (v: unknown): v is number[] => Array.isArray(v) && v.every((x) => typeof x === 'number');
    const invalid = renderHook(() => useLocalStorage<number[]>('test:invalid', [7], isNumArr));
    expect(invalid.result.current[0]).toEqual([7]);
  });

  it('permite reiniciar al valor inicial', () => {
    const { result } = renderHook(() => useLocalStorage<number>('test:reset', 0));
    act(() => result.current[1](5));
    expect(result.current[0]).toBe(5);
    act(() => result.current[2]());
    expect(result.current[0]).toBe(0);
  });
});
