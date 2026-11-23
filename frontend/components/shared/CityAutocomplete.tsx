"use client";

import { useEffect, useId, useRef, useState } from "react";
import { searchCities, type CityRecord } from "@/lib/cities";

interface CityAutocompleteProps {
  value: string;
  onSelect: (city: CityRecord | null) => void;
  placeholder?: string;
  label?: string;
}

export default function CityAutocomplete({
  value,
  onSelect,
  placeholder = "Search city (e.g. Toronto, Ottawa)...",
  label = "City",
}: CityAutocompleteProps) {
  const inputId = useId();
  const containerRef = useRef<HTMLDivElement>(null);

  const [inputValue, setInputValue] = useState(value);
  const [isOpen, setIsOpen] = useState(false);

  const displayValue = isOpen ? inputValue : value;
  const results = displayValue ? searchCities(displayValue, 12) : [];

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const selectResult = (item: CityRecord) => {
    setInputValue(item.name);
    setIsOpen(false);
    onSelect(item);
  };

  const handleClear = () => {
    setInputValue("");
    setIsOpen(false);
    onSelect(null);
  };

  const showDropdown = isOpen && displayValue.length > 0;

  return (
    <div ref={containerRef} className="relative">
      <label
        htmlFor={inputId}
        className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1"
      >
        {label}
      </label>

      <div className="relative">
        <input
          id={inputId}
          type="text"
          value={displayValue}
          onChange={(e) => {
            const next = e.target.value;
            setInputValue(next);
            setIsOpen(true);
            if (value) {
              onSelect(null);
            }
          }}
          onFocus={() => {
            setInputValue(value);
            if ((value || inputValue).trim().length > 0) {
              setIsOpen(true);
            }
          }}
          placeholder={placeholder}
          autoComplete="off"
          className="w-full px-3 py-2 pr-8 text-sm rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        />

        {displayValue && (
          <button
            type="button"
            onClick={handleClear}
            className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 text-sm px-1"
          >
            ✕
          </button>
        )}
      </div>

      {showDropdown && (
        <ul
          className="absolute z-30 mt-1 max-h-60 w-full overflow-auto rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 shadow-lg py-1 text-sm"
        >
          {results.length === 0 ? (
            <li className="px-3 py-2 text-gray-500 dark:text-gray-400">
              No matching cities
            </li>
          ) : (
            results.map((item) => (
              <li
                key={item.geonameid}
                onMouseDown={(e) => {
                  e.preventDefault();
                  selectResult(item);
                }}
                className="cursor-pointer px-3 py-2 text-gray-900 dark:text-gray-100 hover:bg-gray-100 dark:hover:bg-gray-800"
              >
                {item.name}
              </li>
            ))
          )}
        </ul>
      )}
    </div>
  );
}
