import React, { useMemo, useState } from 'react';
import { Checkbox } from '../ui/checkbox';

export interface MultiSelectOption {
  id: string;
  label: string;
}

interface MultiSelectListProps {
  idPrefix: string;
  options: MultiSelectOption[];
  selected: string[];
  onChange: (selected: string[]) => void;
  searchable?: boolean;
  searchPlaceholder?: string;
}

const MultiSelectList = ({
  idPrefix,
  options,
  selected,
  onChange,
  searchable = false,
  searchPlaceholder = 'Zoeken...',
}: MultiSelectListProps) => {
  const [search, setSearch] = useState('');

  const visibleOptions = useMemo(() => {
    const query = search.trim().toLowerCase();
    const matching = query
      ? options.filter((option) => option.label.toLowerCase().includes(query))
      : options;
    // Keep selected options at the top so they stay visible in long lists.
    return [...matching].sort((a, b) =>
      Number(selected.includes(b.id)) - Number(selected.includes(a.id))
    );
  }, [options, search, selected]);

  const toggle = (id: string, checked: boolean) => {
    onChange(checked ? [...selected, id] : selected.filter((value) => value !== id));
  };

  return (
    <div className="data-quality-multiselect">
      {searchable && (
        <input
          type="search"
          className="data-quality-input mb-2"
          placeholder={searchPlaceholder}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          aria-label={searchPlaceholder}
        />
      )}
      <div className="data-quality-multiselect-options">
        {visibleOptions.length === 0 && (
          <div className="text-sm text-gray-500">Geen resultaten</div>
        )}
        {visibleOptions.map((option) => {
          const id = `${idPrefix}-${option.id}`;
          return (
            <div key={option.id} className="flex items-center gap-2 py-1">
              <Checkbox
                id={id}
                checked={selected.includes(option.id)}
                onCheckedChange={(checked) => toggle(option.id, checked === true)}
              />
              <label htmlFor={id} className="text-sm cursor-pointer">
                {option.label}
              </label>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default MultiSelectList;
