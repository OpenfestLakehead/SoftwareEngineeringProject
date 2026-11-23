import citiesData from "../data/cities.json" with { type: "json" };
import { type CityRecord } from "./citiesParser.ts";

export { type CityRecord };

export interface CitySearchResult extends CityRecord {
  label: string;
}

const CITY_CATALOG: readonly CityRecord[] = citiesData as CityRecord[];

function normalize(value: string): string {
  return value.trim().toLowerCase();
}

function makeComboKey(city: string, subcountry: string, country: string): string {
  return `${normalize(city)}|${normalize(subcountry)}|${normalize(country)}`;
}

const VALID_COMBINATIONS = new Set<string>(
  CITY_CATALOG.map((c) => makeComboKey(c.name, c.subcountry, c.country)),
);

/**
 * Format a city record as "City, Province/State, Country".
 */
export function formatCityLabel(
  city: Pick<CityRecord, "name" | "subcountry" | "country">,
): string {
  return `${city.name}, ${city.subcountry}, ${city.country}`;
}

/**
 * Search the city catalog matching ONLY against the city `name` column.
 * Results are formatted with `label` as `name, subcountry, country`.
 */
export function searchCities(query: string, limit = 20): CitySearchResult[] {
  const q = normalize(query);
  if (!q || limit <= 0) {
    return [];
  }

  const prefixMatches: CitySearchResult[] = [];
  const substringMatches: CitySearchResult[] = [];

  for (const record of CITY_CATALOG) {
    const nameLower = record.name.toLowerCase();
    if (!nameLower.includes(q)) {
      continue;
    }

    const result: CitySearchResult = {
      ...record,
      label: formatCityLabel(record),
    };

    if (nameLower.startsWith(q)) {
      prefixMatches.push(result);
    } else {
      substringMatches.push(result);
    }
  }

  return [...prefixMatches, ...substringMatches].slice(0, limit);
}

/**
 * Validate that the full (city, subcountry, country) combination exists in cities.csv.
 */
export function isValidCityCombination(
  city: string,
  subcountry: string,
  country: string,
): boolean {
  if (!city.trim() || !subcountry.trim() || !country.trim()) {
    return false;
  }

  return VALID_COMBINATIONS.has(makeComboKey(city, subcountry, country));
}
