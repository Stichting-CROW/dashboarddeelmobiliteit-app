// Unified schema for smart-filters views

export type FilterFieldType =
  | 'string'
  | 'number'
  | 'date'
  | 'datetime'
  | 'enum'
  | 'boolean'
  | 'multiselect';

export interface FilterFieldOption {
  value: string | number | boolean;
  label: string;
}

export interface FilterFieldSchema {
  key: string;
  label: string;
  type: FilterFieldType;
  required: boolean;
  options?: FilterFieldOption[]; // for enum/multiselect
  min?: number | string; // for number/date
  max?: number | string; // for number/date
  default?: any;
  dependsOn?: string[]; // for conditional fields
}

export interface ViewSchema {
  view: string; // e.g., "aanbod"
  label: string;
  description?: string;
  filters: FilterFieldSchema[];
  layers: string[]; // e.g., ["heatmap", "clusters", "zones"]
} 