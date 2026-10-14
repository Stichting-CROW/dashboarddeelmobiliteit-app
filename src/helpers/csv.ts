export type CsvCellValue = string | number | null | undefined;

export interface CsvColumn<TRow> {
  header: string;
  value: (row: TRow) => CsvCellValue;
  /** Number of decimals for numeric values. Defaults to 0. */
  precision?: number;
}

export interface CsvOptions {
  delimiter?: string;
}

/**
 * Dutch Excel expects a semicolon delimiter and a decimal comma. Both are
 * required for the export to land in separate columns without an import wizard.
 */
const DEFAULT_DELIMITER = ';';
const LINE_ENDING = '\r\n';
const UTF8_BOM = '\uFEFF';

const formatNumber = (value: number, precision: number): string => {
  if (!isFinite(value)) return '';
  return value.toFixed(precision).replace('.', ',');
};

const escapeCell = (value: string): string => {
  return `"${value.replace(/"/g, '""')}"`;
};

const formatCell = (value: CsvCellValue, precision: number): string => {
  if (value === null || value === undefined || value === '') return '';
  if (typeof value === 'number') {
    const formatted = formatNumber(value, precision);
    return formatted === '' ? '' : escapeCell(formatted);
  }
  return escapeCell(String(value));
};

/**
 * Build CSV text from rows and an explicit column definition.
 *
 * Missing values become empty cells rather than zeroes, so a measured value of
 * 0 stays distinguishable from a day without data.
 */
export const toCsv = <TRow>(
  rows: TRow[],
  columns: CsvColumn<TRow>[],
  options: CsvOptions = {}
): string => {
  const delimiter = options.delimiter ?? DEFAULT_DELIMITER;

  const headerLine = columns
    .map((column) => escapeCell(column.header))
    .join(delimiter);

  const dataLines = rows.map((row) =>
    columns
      .map((column) => formatCell(column.value(row), column.precision ?? 0))
      .join(delimiter)
  );

  return [headerLine, ...dataLines].join(LINE_ENDING);
};

const withCsvExtension = (filename: string): string => {
  return filename.toLowerCase().endsWith('.csv') ? filename : `${filename}.csv`;
};

/** Trigger a browser download of CSV text, prefixed with a UTF-8 BOM for Excel. */
export const downloadCsvFile = (csv: string, filename: string): void => {
  const blob = new Blob([UTF8_BOM + csv], { type: 'text/csv;charset=utf-8' });
  const url = window.URL.createObjectURL(blob);

  const link = document.createElement('a');
  link.setAttribute('hidden', '');
  link.setAttribute('href', url);
  link.setAttribute('download', withCsvExtension(filename));
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);

  window.URL.revokeObjectURL(url);
};

/** Turn a chart title into a filename-safe slug. */
export const slugifyForFilename = (value: string): string => {
  return value
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
};
