"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import CityAutocomplete from "@/components/shared/CityAutocomplete";
import type { AgeRestriction } from "@/lib/api/events";
import { AGE_RESTRICTION_OPTIONS } from "@/lib/helpers/events";

interface EventFilterBarProps {
  initialQuery: string;
  initialCity: string;
  initialFreeOnly: boolean;
  initialMaxPrice: string;
  initialAgeRestriction: AgeRestriction | "";
}

export default function EventFilterBar({
  initialQuery,
  initialCity,
  initialFreeOnly,
  initialMaxPrice,
  initialAgeRestriction,
}: EventFilterBarProps) {
  const router = useRouter();
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [query, setQuery] = useState(initialQuery);
  const [city, setCity] = useState(initialCity);
  const [freeOnly, setFreeOnly] = useState(initialFreeOnly);
  const [maxPrice, setMaxPrice] = useState(initialMaxPrice);
  const [ageRestriction, setAgeRestriction] = useState<AgeRestriction | "">(
    initialAgeRestriction,
  );

  const [prevPropsKey, setPrevPropsKey] = useState(
    `${initialQuery}|${initialCity}|${initialFreeOnly}|${initialMaxPrice}|${initialAgeRestriction}`,
  );
  const currentPropsKey = `${initialQuery}|${initialCity}|${initialFreeOnly}|${initialMaxPrice}|${initialAgeRestriction}`;

  if (currentPropsKey !== prevPropsKey) {
    setPrevPropsKey(currentPropsKey);
    setQuery(initialQuery);
    setCity(initialCity);
    setFreeOnly(initialFreeOnly);
    setMaxPrice(initialMaxPrice);
    setAgeRestriction(initialAgeRestriction);
  }

  useEffect(() => {
    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
  }, []);

  const pushFilters = (next: {
    q: string;
    city: string;
    freeOnly: boolean;
    maxPrice: string;
    ageRestriction: AgeRestriction | "";
  }) => {
    const params = new URLSearchParams();
    if (next.q.trim()) params.set("q", next.q.trim());
    if (next.city.trim()) params.set("city", next.city.trim());
    if (next.freeOnly) params.set("freeOnly", "true");
    if (!next.freeOnly && next.maxPrice.trim()) {
      const parsed = Number.parseFloat(next.maxPrice);
      if (!Number.isNaN(parsed) && parsed >= 0) {
        params.set("maxPrice", String(parsed));
      }
    }
    if (next.ageRestriction) {
      params.set("ageRestriction", next.ageRestriction);
    }

    const qs = params.toString();
    router.replace(qs ? `/events?${qs}` : "/events", { scroll: false });
  };

  const schedulePush = (next: {
    q: string;
    city: string;
    freeOnly: boolean;
    maxPrice: string;
    ageRestriction: AgeRestriction | "";
  }) => {
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }
    debounceRef.current = setTimeout(() => {
      pushFilters(next);
    }, 250);
  };

  const hasActiveFilters =
    Boolean(query.trim()) ||
    Boolean(city.trim()) ||
    freeOnly ||
    Boolean(maxPrice.trim()) ||
    Boolean(ageRestriction);

  const handleClearAll = () => {
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }
    setQuery("");
    setCity("");
    setFreeOnly(false);
    setMaxPrice("");
    setAgeRestriction("");
    router.replace("/events", { scroll: false });
  };

  return (
    <section
      aria-label="Filter events"
      className="mt-6 rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-4 sm:p-5 shadow-sm"
    >
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div>
          <label
            htmlFor="events-keyword-search"
            className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1"
          >
            Keyword Search
          </label>
          <input
            id="events-keyword-search"
            type="search"
            value={query}
            onChange={(e) => {
              const nextQuery = e.target.value;
              setQuery(nextQuery);
              schedulePush({
                q: nextQuery,
                city,
                freeOnly,
                maxPrice,
                ageRestriction,
              });
            }}
            placeholder="Search title or description..."
            className="w-full px-3 py-2 text-sm rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>

        <CityAutocomplete
          value={city}
          onSelect={(selected) => {
            const nextCity = selected ? selected.label : "";
            setCity(nextCity);
            pushFilters({
              q: query,
              city: nextCity,
              freeOnly,
              maxPrice,
              ageRestriction,
            });
          }}
        />

        <div>
          <label
            htmlFor="events-max-price"
            className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1"
          >
            Max Price ($)
          </label>
          <input
            id="events-max-price"
            type="number"
            min="0"
            step="0.01"
            disabled={freeOnly}
            value={freeOnly ? "0" : maxPrice}
            onChange={(e) => {
              const nextMaxPrice = e.target.value;
              setMaxPrice(nextMaxPrice);
              schedulePush({
                q: query,
                city,
                freeOnly,
                maxPrice: nextMaxPrice,
                ageRestriction,
              });
            }}
            placeholder="Any price"
            className="w-full px-3 py-2 text-sm rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
          />
        </div>

        <div>
          <label
            htmlFor="events-age-restriction"
            className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1"
          >
            Age Restriction
          </label>
          <select
            id="events-age-restriction"
            value={ageRestriction}
            onChange={(e) => {
              const nextAge = e.target.value as AgeRestriction | "";
              setAgeRestriction(nextAge);
              pushFilters({
                q: query,
                city,
                freeOnly,
                maxPrice,
                ageRestriction: nextAge,
              });
            }}
            className="w-full px-3 py-2 text-sm rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="">Any Age</option>
            {AGE_RESTRICTION_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="mt-4 pt-3 border-t border-gray-200 dark:border-gray-800 flex flex-wrap items-center justify-between gap-3">
        <label className="inline-flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-200 cursor-pointer select-none">
          <input
            type="checkbox"
            checked={freeOnly}
            onChange={(e) => {
              const nextFreeOnly = e.target.checked;
              setFreeOnly(nextFreeOnly);
              pushFilters({
                q: query,
                city,
                freeOnly: nextFreeOnly,
                maxPrice,
                ageRestriction,
              });
            }}
            className="h-4 w-4 rounded border-gray-300 dark:border-gray-700 text-blue-600 focus:ring-blue-500"
          />
          Free Events Only
        </label>

        {hasActiveFilters && (
          <button
            type="button"
            onClick={handleClearAll}
            className="px-3 py-1.5 text-xs font-semibold rounded-lg border border-gray-300 dark:border-gray-700 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-200 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
          >
            Clear All Filters
          </button>
        )}
      </div>
    </section>
  );
}
