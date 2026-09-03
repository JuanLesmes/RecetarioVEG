import { describe, expect, it } from 'vitest';
import { capitalize, extractMinutes, normalize, slugify, tokenize } from './text';

describe('normalize', () => {
  it('quita tildes, mayúsculas y símbolos', () => {
    expect(normalize('  Sopa de Cebolla  Gratinada!! ')).toBe('sopa de cebolla gratinada');
    expect(normalize('Ñoquis')).toBe('noquis');
    expect(normalize('Curry verde tailandés')).toBe('curry verde tailandes');
  });
  it('colapsa espacios múltiples', () => {
    expect(normalize('a    b\t c')).toBe('a b c');
  });
});

describe('tokenize', () => {
  it('separa en tokens no vacíos', () => {
    expect(tokenize(' Tofu   al   pastor ')).toEqual(['tofu', 'al', 'pastor']);
    expect(tokenize('')).toEqual([]);
  });
});

describe('slugify', () => {
  it('produce kebab-case ASCII', () => {
    expect(slugify('Ñoquis de calabaza con mantequilla')).toBe('noquis-de-calabaza-con-mantequilla');
    expect(slugify('Pad Thai (de tofu)')).toBe('pad-thai-de-tofu');
  });
});

describe('capitalize', () => {
  it('capitaliza la primera letra', () => {
    expect(capitalize('hola')).toBe('Hola');
    expect(capitalize('')).toBe('');
  });
});

describe('extractMinutes', () => {
  it('detecta minutos y horas en un paso', () => {
    expect(extractMinutes('Hornea a 180 °C durante 25 minutos.')).toEqual([25]);
    expect(extractMinutes('Deja reposar 1 hora y luego cocina 5 min más.')).toEqual([60, 5]);
  });
  it('usa el límite superior de un rango', () => {
    expect(extractMinutes('Sofríe 2-3 minutos.')).toEqual([3]);
    expect(extractMinutes('Cocina 8 a 10 min.')).toEqual([10]);
  });
  it('ignora números sin unidad de tiempo y duplicados', () => {
    expect(extractMinutes('Añade 200 g de arroz y 3 tazas de agua.')).toEqual([]);
    expect(extractMinutes('10 minutos por un lado y 10 minutos por el otro.')).toEqual([10]);
  });
});
