"use client";

import { useState } from "react";
import Link from "next/link";
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
  const [city, setCity] = useState(initialCity);
  const [freeOnly, setFreeOnly] = useState(initialFreeOnly);

  // const hasActiveFilters =
  //   Boolean(initialQuery) ||
  //   Boolean(initialCity) ||
  //   Boolean(city) ||
  //   initialFreeOnly ||
  //   freeOnly ||
  //   Boolean(initialMaxPrice) ||
  //   Boolean(initialAgeRestriction);

  return (
    <form
      method="GET"
      action="/events"
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
            name="q"
            type="search"
            defaultValue={initialQuery}
            placeholder="Search title or description..."
            className="w-full px-3 py-2 text-sm rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>

        <div>
          <CityAutocomplete
            value={city}
            onSelect={(selected) => setCity(selected ? selected.name : "")}
          />
          {city && <input type="hidden" name="city" value={city} />}
        </div>

        <div>
          <label
            htmlFor="events-max-price"
            className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1"
          >
            Max Price ($)
          </label>
          <input
            id="events-max-price"
            name="maxPrice"
            type="number"
            min="0"
            step="0.01"
            disabled={freeOnly}
            defaultValue={initialMaxPrice}
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
            name="ageRestriction"
            defaultValue={initialAgeRestriction}
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
            name="freeOnly"
            value="true"
            checked={freeOnly}
            onChange={(e) => setFreeOnly(e.target.checked)}
            className="h-4 w-4 rounded border-gray-300 dark:border-gray-700 text-blue-600 focus:ring-blue-500"
          />
          Free Events Only
        </label>

        <div className="flex items-center gap-2">
          {/* {hasActiveFilters && ( */}
            <Link
              href="/events"
              className="px-3 py-1.5 text-xs font-semibold rounded-lg border border-gray-300 dark:border-gray-700 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-200 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
            >
              Clear All Filters
            </Link>
          {/* )} */}
          <button
            type="submit"
            className="px-4 py-1.5 text-xs font-semibold rounded-lg bg-blue-600 hover:bg-blue-700 text-white transition-colors"
          >
            Apply Filters
          </button>
        </div>
      </div>
    </form>
  );
}
