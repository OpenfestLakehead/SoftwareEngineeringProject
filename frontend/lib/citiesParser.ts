export interface CityRecord {
  name: string;
  country: string;
  subcountry: string;
  geonameid: number;
}

/**
 * Split a single CSV line, respecting double-quoted fields.
 */
function splitCsvLine(line: string): string[] {
  const fields: string[] = [];
  let current = "";
  let inQuotes = false;

  for (let i = 0; i < line.length; i += 1) {
    const ch = line[i];
    if (ch === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"';
        i += 1;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (ch === "," && !inQuotes) {
      fields.push(current.trim());
      current = "";
    } else {
      current += ch;
    }
  }

  fields.push(current.trim());
  return fields;
}

/**
 * Parse a CSV string with columns `name,country,subcountry,geonameid`
 * into typed CityRecord objects.
 */
export function parseCitiesCsv(csvText: string): CityRecord[] {
  const cleaned = csvText.replace(/^\uFEFF/, "");
  const lines = cleaned.split(/\r?\n/);
  const records: CityRecord[] = [];

  for (let i = 0; i < lines.length; i += 1) {
    const rawLine = lines[i].trim();
    if (!rawLine) {
      continue;
    }

    const [name = "", country = "", subcountry = "", geonameidRaw = ""] =
      splitCsvLine(rawLine);

    if (
      i === 0 &&
      name.toLowerCase() === "name" &&
      country.toLowerCase() === "country" &&
      subcountry.toLowerCase() === "subcountry"
    ) {
      continue;
    }

    const geonameid = Number.parseInt(geonameidRaw, 10);
    if (!name || !country || !subcountry || Number.isNaN(geonameid)) {
      continue;
    }

    records.push({
      name,
      country,
      subcountry,
      geonameid,
    });
  }

  return records;
}
