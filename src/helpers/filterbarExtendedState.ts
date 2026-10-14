import {
  FILTERBAR_EXTENDED_CLOSED,
  FilterbarExtendedState,
  FilterbarExtendedView,
} from '../types/FilterbarExtendedState';
import { StateType } from '../types/StateType';

const FILTERBAR_EXTENDED_VIEWS: FilterbarExtendedView[] = [
  'places',
  'zones',
  'dashboard-type',
];

function isFilterbarExtendedView(value: unknown): value is FilterbarExtendedView {
  return FILTERBAR_EXTENDED_VIEWS.includes(value as FilterbarExtendedView);
}

/** Normalise legacy boolean/string values and persisted state to the structured shape. */
export function normalizeFilterbarExtended(value: unknown): FilterbarExtendedState {
  if (value && typeof value === 'object' && 'open' in value) {
    const record = value as FilterbarExtendedState;
    const view = isFilterbarExtendedView(record.view) ? record.view : null;
    return {
      open: Boolean(record.open) && view !== null,
      view: Boolean(record.open) ? view : null,
    };
  }

  if (isFilterbarExtendedView(value)) {
    return { open: true, view: value };
  }

  return FILTERBAR_EXTENDED_CLOSED;
}

export function selectFilterbarExtended(state: StateType): FilterbarExtendedState {
  if (!state.ui) {
    return FILTERBAR_EXTENDED_CLOSED;
  }
  return normalizeFilterbarExtended(state.ui.FILTERBAR_EXTENDED);
}
