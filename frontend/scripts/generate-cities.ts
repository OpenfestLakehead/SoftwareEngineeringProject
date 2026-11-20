import { readFileSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { parseCitiesCsv } from "../lib/citiesParser.ts";

const scriptDir = dirname(fileURLToPath(import.meta.url));
const frontendDir = resolve(scriptDir, "..");
const csvPath = resolve(frontendDir, "data/cities.csv");
const jsonPath = resolve(frontendDir, "data/cities.json");

const csvText = readFileSync(csvPath, "utf8");
const records = parseCitiesCsv(csvText);

writeFileSync(jsonPath, `${JSON.stringify(records, null, 2)}\n`, "utf8");
console.log(`Generated ${records.length} city records at ${jsonPath}`);
