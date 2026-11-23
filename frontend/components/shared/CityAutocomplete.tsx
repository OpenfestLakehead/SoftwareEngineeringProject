"use client";

import { useEffect, useId, useMemo, useRef, useState } from "react";
import { searchCities, type CitySearchResult } from "@/lib/cities";

interface CityAutocompleteProps {
  value: string;
  onSelect: (city: CitySearchResult | null) => void;
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
  const listboxId = useId();
  const containerRef = useRef<HTMLDivElement>(null);

  const [inputValue, setInputValue] = useState(value);
  const [isOpen, setIsOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const [prevPropValue, setPrevPropValue] = useState(value);

  if (value !== prevPropValue) {
    setPrevPropValue(value);
    setInputValue(value);
  }

  const results = useMemo(() => {
    const trimmed = inputValue.trim();
    if (!trimmed) return [];
    return searchCities(trimmed, 12);
  }, [inputValue]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
        setActiveIndex(-1);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const selectResult = (item: CitySearchResult) => {
    setInputValue(item.label);
    setIsOpen(false);
    setActiveIndex(-1);
    onSelect(item);
  };

  const handleClear = () => {
    setInputValue("");
    setIsOpen(false);
    setActiveIndex(-1);
    onSelect(null);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!isOpen && (e.key === "ArrowDown" || e.key === "ArrowUp")) {
      if (results.length > 0) {
        setIsOpen(true);
        setActiveIndex(0);
      }
      return;
    }

    if (!isOpen || results.length === 0) {
      if (e.key === "Escape") {
        setIsOpen(false);
      }
      return;
    }

    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveIndex((prev) => (prev + 1) % results.length);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIndex((prev) => (prev <= 0 ? results.length - 1 : prev - 1));
    } else if (e.key === "Enter" && activeIndex >= 0) {
      e.preventDefault();
      selectResult(results[activeIndex]);
    } else if (e.key === "Escape") {
      setIsOpen(false);
      setActiveIndex(-1);
    }
  };

  const showDropdown = isOpen && inputValue.trim().length > 0;

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
          role="combobox"
          aria-autocomplete="list"
          aria-expanded={showDropdown}
          aria-controls={listboxId}
          aria-activedescendant={
            activeIndex >= 0 ? `${listboxId}-option-${activeIndex}` : undefined
          }
          value={inputValue}
          onChange={(e) => {
            const next = e.target.value;
            setInputValue(next);
            setIsOpen(true);
            setActiveIndex(-1);
            if (value) {
              setPrevPropValue("");
              onSelect(null);
            }
          }}
          onFocus={() => {
            if (inputValue.trim().length > 0) {
              setIsOpen(true);
            }
          }}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          autoComplete="off"
          className="w-full px-3 py-2 pr-8 text-sm rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        />

        {inputValue && (
          <button
            type="button"
            onClick={handleClear}
            aria-label="Clear city filter"
            className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 text-sm px-1"
          >
            ✕
          </button>
        )}
      </div>

      {showDropdown && (
        <ul
          id={listboxId}
          role="listbox"
          className="absolute z-30 mt-1 max-h-60 w-full overflow-auto rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 shadow-lg py-1 text-sm"
        >
          {results.length === 0 ? (
            <li className="px-3 py-2 text-gray-500 dark:text-gray-400">
              No matching cities
            </li>
          ) : (
            results.map((item, index) => {
              const isActive = index === activeIndex;
              return (
                <li
                  key={item.geonameid}
                  id={`${listboxId}-option-${index}`}
                  role="option"
                  aria-selected={isActive}
                  onMouseDown={(e) => {
                    e.preventDefault();
                    selectResult(item);
                  }}
                  onMouseEnter={() => setActiveIndex(index)}
                  className={`cursor-pointer px-3 py-2 ${
                    isActive
                      ? "bg-blue-600 text-white"
                      : "text-gray-900 dark:text-gray-100 hover:bg-gray-100 dark:hover:bg-gray-800"
                  }`}
                >
                  {item.label}
                </li>
              );
            })
          )}
        </ul>
      )}
    </div>
  );
}
