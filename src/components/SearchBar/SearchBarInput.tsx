import * as React from "react";
import { useState } from "react";

interface FlyToOptions {
  zoom?: number;
  duration?: number;
}

function SearchBarInput({
  value,
  filterChanged,
  afterHtml,
  onFocus,
  onBlur,
  autoFocus
}: {
  value?: string;
  filterChanged: any;
  afterHtml?: any;
  onFocus?: () => void;
  onBlur?: () => void;
  autoFocus?: boolean;
  mapCenter?: { lat: number; lng: number };
}) {

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Escape') {
      // Create a synthetic event to clear the input
      const syntheticEvent = {
        target: { value: '' }
      } as React.ChangeEvent<HTMLInputElement>;
      
      filterChanged(syntheticEvent);
    }
  };

  return (
    <div className="relative">
      <input
        type="search"
        name="search"
        placeholder="Zoek een zone of adres"
        autoFocus={autoFocus}
        autoComplete="off"
        className="
          sticky top-0 z-10
          h-12
          w-full
          rounded-3xl
          px-4
          shadow-md
          transition-all
          duration-300
          ease-in-out
          focus:outline-none
          focus:ring-2
          focus:ring-blue-500
          focus:ring-opacity-50
        "
        onChange={filterChanged}
        onFocus={onFocus}
        onBlur={onBlur}
        onKeyDown={handleKeyDown}
        value={value}
      />
      {afterHtml ? afterHtml : ''}
    </div>
  );
}

export default SearchBarInput;
