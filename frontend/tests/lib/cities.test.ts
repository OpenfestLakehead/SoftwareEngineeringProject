import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import citiesJson from "../../data/cities.json" with { type: "json" };
import {
  formatCityLabel,
  isValidCityCombination,
  searchCities,
} from "../../lib/cities.ts";
import { parseCitiesCsv } from "../../lib/citiesParser.ts";

const testDir = dirname(fileURLToPath(import.meta.url));
const csvPath = resolve(testDir, "../../data/cities.csv");

test("cities.json stays in sync with parseCitiesCsv(cities.csv)", () => {
  const csvText = readFileSync(csvPath, "utf8");
  const parsed = parseCitiesCsv(csvText);

  assert.equal(parsed.length, citiesJson.length);
  assert.deepEqual(parsed, citiesJson);
});

test("searchCities matches only the city name column and formats as city name", () => {
  const torontoResults = searchCities("Toronto");
  assert.ok(torontoResults.length > 0);
  assert.equal(torontoResults[0].name, "Toronto");
  assert.equal(torontoResults[0].label, "Toronto");

  // Case-insensitive and prefix-first
  const thunderResults = searchCities("thunder");
  assert.ok(thunderResults.some((c) => c.label === "Thunder Bay"));

  // Empty / whitespace / nonexistent queries
  assert.deepEqual(searchCities(""), []);
  assert.deepEqual(searchCities("   "), []);
  assert.deepEqual(searchCities("Atlantis"), []);
});

test("isValidCityCombination accepts valid rows and rejects mismatched or nonexistent combinations", () => {
  assert.equal(isValidCityCombination("Toronto", "Ontario", "Canada"), true);
  assert.equal(isValidCityCombination("  thunder bay ", " ontario ", " canada "), true);

  // Mismatched subcountry or country
  assert.equal(isValidCityCombination("Toronto", "Quebec", "Canada"), false);
  assert.equal(isValidCityCombination("Toronto", "Ontario", "United States"), false);

  // Nonexistent city or blank fields
  assert.equal(isValidCityCombination("Fakeville", "Ontario", "Canada"), false);
  assert.equal(isValidCityCombination("", "Ontario", "Canada"), false);
  assert.equal(isValidCityCombination("Toronto", "", "Canada"), false);
  assert.equal(isValidCityCombination("Toronto", "Ontario", ""), false);
});

test("formatCityLabel formats as city name", () => {
  assert.equal(
    formatCityLabel({ name: "Kingston", subcountry: "Ontario", country: "Canada" }),
    "Kingston",
  );
});
