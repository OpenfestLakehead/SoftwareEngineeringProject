import test from "node:test";
import assert from "node:assert/strict";

import { searchCities } from "../../lib/cities.ts";

test("searchCities matches only the city name column and returns CityRecord entries", () => {
  const torontoResults = searchCities("Toronto");
  assert.ok(torontoResults.length > 0);
  assert.equal(torontoResults[0].name, "Toronto");

  // Case-insensitive and prefix-first
  const thunderResults = searchCities("thunder");
  assert.ok(thunderResults.some((c) => c.name === "Thunder Bay"));

  // Empty / whitespace / nonexistent queries
  assert.deepEqual(searchCities(""), []);
  assert.deepEqual(searchCities("   "), []);
  assert.deepEqual(searchCities("Atlantis"), []);
});
