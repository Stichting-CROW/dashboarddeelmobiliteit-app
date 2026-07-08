// Parser for 'Ruwe data import' CSV files in the Verhuringen view.
//
// Expected structure (as produced by the dashboard export function):
//
//   system_id,lat,lon,start_time,end_time,form_factor,propulsion_type
//   voi,53.233,6.564201,2026-07-03 22:21:03+02,2026-07-04 12:05:17+02,bicycle,electric_assist
//
// Column order is free-form (columns are matched by header name) and both
// ',' and ';' are accepted as delimiter.

const REQUIRED_COLUMNS = ['system_id', 'lat', 'lon', 'start_time', 'end_time'];

// Parse a single CSV line into fields, honoring double quotes
const parseCsvLine = (line, delimiter) => {
  const fields = [];
  let current = '';
  let insideQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    if (char === '"') {
      if (insideQuotes && line[i + 1] === '"') {
        current += '"';
        i++;
      } else {
        insideQuotes = !insideQuotes;
      }
    } else if (char === delimiter && !insideQuotes) {
      fields.push(current);
      current = '';
    } else {
      current += char;
    }
  }
  fields.push(current);

  return fields.map(x => x.trim());
};

const detectDelimiter = (headerLine) => {
  for (const delimiter of [',', ';']) {
    const columns = parseCsvLine(headerLine, delimiter).map(x => x.toLowerCase());
    if (REQUIRED_COLUMNS.every(x => columns.includes(x))) {
      return delimiter;
    }
  }
  return null;
};

// Parses raw CSV text into rental/park_event rows
// Returns { rows, skipped } or throws an Error with a user-facing (Dutch) message
export const parseRentalsCsv = (csvText) => {
  // Strip byte order mark, split into non-empty lines
  const lines = csvText
    .replace(/^﻿/, '')
    .split(/\r\n|\r|\n/)
    .filter(line => line.trim().length > 0);

  if (lines.length < 2) {
    throw new Error('Het CSV-bestand bevat geen datarijen');
  }

  const delimiter = detectDelimiter(lines[0]);
  if (!delimiter) {
    throw new Error(
      `Kolommen niet gevonden. Verwachte kolommen: ${REQUIRED_COLUMNS.join(', ')}`
    );
  }

  const header = parseCsvLine(lines[0], delimiter).map(x => x.toLowerCase());
  const columnIndex = {};
  header.forEach((name, index) => {
    columnIndex[name] = index;
  });

  const rows = [];
  let skipped = 0;

  for (let i = 1; i < lines.length; i++) {
    const fields = parseCsvLine(lines[i], delimiter);

    const lat = parseFloat(fields[columnIndex['lat']]);
    const lon = parseFloat(fields[columnIndex['lon']]);
    const system_id = fields[columnIndex['system_id']];

    const isValid = system_id
      && !isNaN(lat) && lat >= -90 && lat <= 90
      && !isNaN(lon) && lon >= -180 && lon <= 180;

    if (!isValid) {
      skipped++;
      continue;
    }

    rows.push({
      system_id: system_id,
      lat: lat,
      lon: lon,
      start_time: fields[columnIndex['start_time']] || null,
      end_time: fields[columnIndex['end_time']] || null,
      form_factor: columnIndex['form_factor'] !== undefined
        ? (fields[columnIndex['form_factor']] || null)
        : null,
      propulsion_type: columnIndex['propulsion_type'] !== undefined
        ? (fields[columnIndex['propulsion_type']] || null)
        : null
    });
  }

  if (rows.length === 0) {
    throw new Error('Geen geldige datarijen gevonden in het CSV-bestand');
  }

  return { rows, skipped };
};
