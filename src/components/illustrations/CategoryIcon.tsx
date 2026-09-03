import type { ReactElement, SVGProps } from 'react';
import type { Category } from '@/domain/recipe';

const PATHS: Record<Category, ReactElement> = {
  desayuno: (
    <>
      <path d="M4 17h16" />
      <path d="M6 13a6 6 0 0 1 12 0" />
      <path d="M12 3v3" />
      <path d="m5.6 6.6 1.4 1.4" />
      <path d="m18.4 6.6-1.4 1.4" />
      <path d="M8 21h8" />
    </>
  ),
  'plato-principal': (
    <>
      <circle cx="12" cy="12" r="9" />
      <circle cx="12" cy="12" r="4" />
      <path d="M3 12h2M19 12h2" />
    </>
  ),
  entrada: (
    <>
      <path d="M4 15h16" />
      <path d="M6 15a6 6 0 0 1 12 0" />
      <path d="M12 9V5" />
      <path d="M10 5h4" />
      <path d="M7 19h10" />
    </>
  ),
  sopa: (
    <>
      <path d="M4 11h16" />
      <path d="M5 11a7 7 0 0 0 14 0" />
      <path d="M9 4c-1 1-1 2 0 3" />
      <path d="M13 4c-1 1-1 2 0 3" />
      <path d="M8 21h8" />
    </>
  ),
  ensalada: (
    <>
      <path d="M4 13h16" />
      <path d="M5 13a7 7 0 0 0 14 0" />
      <path d="M12 13c-2-4 0-8 4-9-1 3 0 6-1 9" />
      <path d="M12 13c-1-3-4-5-8-5 1 2 3 4 5 5" />
    </>
  ),
  postre: (
    <>
      <path d="M4 20h16" />
      <path d="M5 20v-5a7 7 0 0 1 14 0v5" />
      <path d="M5 15h14" />
      <path d="M12 8V5" />
      <path d="M11 3h2" />
    </>
  ),
  snack: (
    <>
      <path d="M6 9l1.5 12h9L18 9" />
      <path d="M4 9h16" />
      <circle cx="9" cy="6" r="2" />
      <circle cx="14" cy="5" r="2" />
      <circle cx="17" cy="8" r="1.5" />
    </>
  ),
  bebida: (
    <>
      <path d="M7 3h10l-1.5 17a1 1 0 0 1-1 1h-5a1 1 0 0 1-1-1Z" />
      <path d="M7.7 11h8.6" />
      <path d="M12 3l3-1" />
    </>
  ),
  salsa: (
    <>
      <path d="M4 12h16" />
      <path d="M5 12a7 7 0 0 0 14 0" />
      <path d="M14 12 19 5" />
      <path d="M8 21h8" />
    </>
  ),
  pan: (
    <>
      <path d="M5 11a7 4 0 0 1 14 0v8a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1Z" />
      <path d="M9 9c1-1 2-1 3 0" />
      <path d="M13 8c1-1 2-1 3 0" />
    </>
  ),
};

interface CategoryIconProps extends SVGProps<SVGSVGElement> {
  category: Category;
}

export function CategoryIcon({ category, className, ...rest }: CategoryIconProps) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className={['icon', className ?? ''].join(' ').trim()} {...rest}>
      {PATHS[category]}
    </svg>
  );
}
