export interface Modality {
  key: string;
  label: string;
  color: string;
}

/** Legend item for stacked or grouped bars. */
export interface Category {
  key: string;
  label: string;
  color: string;
}

/** Known modalities, in display order. */
export const MODALITIES: readonly Modality[] = [
  { key: 'bicycle', label: 'Fiets', color: '#15AEEF' },
  { key: 'cargo_bicycle', label: 'Bakfiets', color: '#1F8E3D' },
  { key: 'moped', label: 'Scooter', color: '#FD862E' },
  { key: 'car', label: 'Auto', color: '#7B61FF' },
] as const;

const FALLBACK_COLORS = ['#6B7280', '#DB2777', '#0891B2', '#CA8A04'] as const;

/**
 * Sort modality keys in display order and resolve label and colour.
 * Unknown keys keep the raw key as label and get a fallback colour.
 */
export const resolveModalities = (keys: readonly string[]): Modality[] => {
  const unique = Array.from(new Set(keys));
  const known = MODALITIES.filter((m) => unique.includes(m.key));
  const unknown = unique
    .filter((key) => !MODALITIES.some((m) => m.key === key))
    .sort()
    .map((key, i) => ({ key, label: key, color: FALLBACK_COLORS[i % FALLBACK_COLORS.length] }));
  return [...known, ...unknown];
};
