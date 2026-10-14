import { toCsv, slugifyForFilename, type CsvColumn } from './csv';

interface Row {
  date: string;
  value: number | null;
  label?: string;
}

const columns: CsvColumn<Row>[] = [
  { header: 'datum', value: (row) => row.date },
  { header: 'waarde', value: (row) => row.value },
];

describe('toCsv', () => {
  it('separates columns with a semicolon and quotes every cell', () => {
    const csv = toCsv([{ date: '2026-08-18', value: 12 }], columns);

    expect(csv).toBe('"datum";"waarde"\r\n"2026-08-18";"12"');
  });

  it('formats numbers with a decimal comma and the requested precision', () => {
    const csv = toCsv(
      [{ date: '2026-08-18', value: 3.456 }],
      [columns[0], { header: 'waarde', value: (row) => row.value, precision: 2 }]
    );

    expect(csv).toContain('"3,46"');
  });

  it('keeps a measured zero distinguishable from a missing value', () => {
    const csv = toCsv(
      [
        { date: '2026-08-18', value: 0 },
        { date: '2026-08-19', value: null },
      ],
      columns
    );

    expect(csv.split('\r\n')).toEqual([
      '"datum";"waarde"',
      '"2026-08-18";"0"',
      '"2026-08-19";',
    ]);
  });

  it('escapes embedded quotes by doubling them', () => {
    const csv = toCsv(
      [{ date: '2026-08-18', value: 1, label: 'Parkeerduur "lang"' }],
      [...columns, { header: 'label', value: (row) => row.label }]
    );

    expect(csv).toContain('"Parkeerduur ""lang"""');
  });

  it('returns just the header row when there is no data', () => {
    expect(toCsv([], columns)).toBe('"datum";"waarde"');
  });
});

describe('slugifyForFilename', () => {
  it('lowercases and replaces non-alphanumeric runs with a single dash', () => {
    expect(slugifyForFilename('Parkeerduur > 7 dagen')).toBe('parkeerduur-7-dagen');
  });

  it('strips diacritics and surrounding dashes', () => {
    expect(slugifyForFilename('  Aantal onverhuurde voertuigén! ')).toBe(
      'aantal-onverhuurde-voertuigen'
    );
  });
});
