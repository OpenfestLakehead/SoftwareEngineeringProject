import citiesData from "../data/cities.json" with { type: "json" };

export interface CityRecord {
  name: string;
  country: string;
  subcountry: string;
  geonameid: number;
}

const CITY_CATALOG: readonly CityRecord[] = citiesData as CityRecord[];

/**
 * Search the city catalog matching ONLY against the city `name` column.
 */
export function searchCities(query: string, limit = 20): CityRecord[] {
  const q = query.trim().toLowerCase();
  if (!q || limit <= 0) {
    return [];
  }

  const prefixMatches: CityRecord[] = [];
  const substringMatches: CityRecord[] = [];

  for (const record of CITY_CATALOG) {
    const nameLower = record.name.toLowerCase();
    if (!nameLower.includes(q)) {
      continue;
    }

    if (nameLower.startsWith(q)) {
      prefixMatches.push(record);
    } else {
      substringMatches.push(record);
    }
  }

  return [...prefixMatches, ...substringMatches].slice(0, limit);
}
