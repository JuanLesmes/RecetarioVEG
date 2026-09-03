import { useEffect, useId, useRef, useState, type FormEvent, type KeyboardEvent } from 'react';
import { Icon } from '@/components/ui/Icon';
import { recipes } from '@/data';
import { suggest } from '@/domain/search';

interface SearchBarProps {
  value: string;
  onChange: (value: string) => void;
  onSubmit?: (value: string) => void;
  placeholder?: string;
  large?: boolean;
  autoFocus?: boolean;
  withSuggestions?: boolean;
  ariaLabel?: string;
}

export function SearchBar({
  value,
  onChange,
  onSubmit,
  placeholder = 'Busca por plato, ingrediente o cocina…',
  large = false,
  autoFocus = false,
  withSuggestions = true,
  ariaLabel = 'Buscar recetas',
}: SearchBarProps) {
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(-1);
  const inputRef = useRef<HTMLInputElement>(null);
  const wrapperRef = useRef<HTMLFormElement>(null);
  const listId = useId();
  const suggestions = withSuggestions && open ? suggest(recipes, value, 6) : [];

  useEffect(() => {
    const onDocClick = (e: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', onDocClick);
    return () => document.removeEventListener('mousedown', onDocClick);
  }, []);

  const choose = (s: string) => {
    onChange(s);
    setOpen(false);
    setActive(-1);
    onSubmit?.(s);
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (active >= 0 && suggestions[active]) {
      choose(suggestions[active]);
      return;
    }
    setOpen(false);
    onSubmit?.(value);
  };

  const handleKey = (e: KeyboardEvent<HTMLInputElement>) => {
    if (!suggestions.length) return;
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActive((a) => (a + 1) % suggestions.length);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActive((a) => (a <= 0 ? suggestions.length - 1 : a - 1));
    } else if (e.key === 'Escape') {
      setOpen(false);
      setActive(-1);
    }
  };

  return (
    <form role="search" onSubmit={handleSubmit} className={['searchbar', large ? 'searchbar--lg' : ''].filter(Boolean).join(' ')} ref={wrapperRef}>
      <Icon name="search" className="searchbar__icon" />
      <input
        ref={inputRef}
        type="search"
        className="searchbar__input"
        value={value}
        placeholder={placeholder}
        aria-label={ariaLabel}
        autoFocus={autoFocus}
        autoComplete="off"
        role="combobox"
        aria-expanded={suggestions.length > 0}
        aria-controls={listId}
        aria-autocomplete="list"
        aria-activedescendant={active >= 0 ? `${listId}-${active}` : undefined}
        onChange={(e) => {
          onChange(e.target.value);
          setOpen(true);
          setActive(-1);
        }}
        onFocus={() => setOpen(true)}
        onKeyDown={handleKey}
        data-testid="search-input"
      />
      {value ? (
        <button
          type="button"
          className="btn btn--ghost btn--icon btn--sm searchbar__clear"
          onClick={() => {
            onChange('');
            inputRef.current?.focus();
          }}
          aria-label="Limpiar búsqueda"
        >
          <Icon name="x" />
        </button>
      ) : null}
      {suggestions.length > 0 ? (
        <ul className="searchbar__suggestions" role="listbox" id={listId}>
          {suggestions.map((s, i) => (
            <li key={s} role="option" aria-selected={i === active} id={`${listId}-${i}`}>
              <button
                type="button"
                className={['searchbar__suggestion', i === active ? 'is-active' : ''].filter(Boolean).join(' ')}
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => choose(s)}
              >
                <Icon name="search" />
                {s}
              </button>
            </li>
          ))}
        </ul>
      ) : null}
    </form>
  );
}
