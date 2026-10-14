export type FilterbarExtendedView = 'places' | 'zones' | 'dashboard-type';

export interface FilterbarExtendedState {
  open: boolean;
  view: FilterbarExtendedView | null;
}

export const FILTERBAR_EXTENDED_CLOSED: FilterbarExtendedState = {
  open: false,
  view: null,
};
