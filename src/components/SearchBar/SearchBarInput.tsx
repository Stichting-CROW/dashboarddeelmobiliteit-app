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
  onBlur
}: {
  value?: string;
  filterChanged: any;
  afterHtml?: any;
  onFocus?: () => void;
  onBlur?: () => void;
  mapCenter?: { lat: number; lng: number };
}) {

  return (
    <div className="relative">
      <input
        type="search"
        name="search"
        placeholder="Zoek een zone of adres"
        autoComplete="off"
        className="
          sticky top-0 z-10
          h-12
          w-full
          rounded-3xl
          px-4
          shadow-md
        "
        onChange={filterChanged}
        onFocus={onFocus}
        onBlur={onBlur}
        value={value}
      />
      {afterHtml ? afterHtml : ''}
    </div>
  );
}

export default SearchBarInput;
