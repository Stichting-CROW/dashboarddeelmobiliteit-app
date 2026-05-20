interface GebiedOption {
  gm_code?: string;
}

interface AanbiederOption {
  system_id?: string;
  value?: string;
}

export type PrestatiesViewMode = 'municipality' | 'operator';

/**
 * URL parameter that controls the "Prestaties aanbieders" view mode.
 *
 * NOTE: do NOT use `view` here – `view=` is reserved app-wide for the
 * "import serialized state" feature (see App.tsx). Using it would trigger
 * the "Ongeldige link ingegeven" alert.
 */
export const PRESTATIES_VIEW_URL_PARAM = 'weergave';

export const getAanbiederSystemId = (aanbieder: AanbiederOption): string => {
  return aanbieder.system_id || aanbieder.value || '';
};

export const hasMunicipalityScope = (gebieden: GebiedOption[]): boolean => {
  return gebieden.some((g) => Boolean(g.gm_code));
};

/**
 * Operator account: has exactly one operator in their ACL (their own).
 *
 * The backend ACL (/dashboard-api/menu/acl) returns:
 * - Municipality accounts: many operators (every provider serving their gebied)
 * - Operator accounts: exactly one operator (themselves), plus optional municipalities
 *   they may have access to view, but kpi_overview_operators requires their system_id.
 * - Admin / public defaults: many operators (full provider list).
 *
 * This matches the existing heuristic used elsewhere in the codebase
 * (see src/poll-api/pollTools.js: `metadata.aanbieders.length === 1`).
 */
export const isOperatorPrestatiesView = (
  _gebieden: GebiedOption[],
  aanbieders: AanbiederOption[]
): boolean => {
  if (aanbieders.length !== 1) return false;
  return Boolean(getAanbiederSystemId(aanbieders[0]));
};

/**
 * Resolve the active view mode for the "Prestaties aanbieders" page.
 *
 * - Single-operator account (operator user): always 'operator'.
 * - Admin: respects the `?view=` URL parameter; defaults to 'municipality'.
 * - Anyone else (municipality account): always 'municipality'.
 */
export const resolvePrestatiesViewMode = (
  aanbieders: AanbiederOption[],
  isAdmin: boolean,
  urlView: string | null
): PrestatiesViewMode => {
  if (isOperatorPrestatiesView([], aanbieders)) {
    return 'operator';
  }
  if (isAdmin && urlView === 'operator') {
    return 'operator';
  }
  return 'municipality';
};

/**
 * Whether the current account is allowed to toggle between municipality
 * and operator view. Currently only admins have this capability.
 */
export const canToggleViewMode = (
  isAdmin: boolean,
  aanbieders: AanbiederOption[]
): boolean => {
  if (!isAdmin) return false;
  // Operator-only accounts are pinned to operator view.
  if (isOperatorPrestatiesView([], aanbieders)) return false;
  return true;
};

export const resolveOperatorSystemId = (
  aanbieders: AanbiederOption[],
  urlOperator: string | null
): string => {
  if (urlOperator) {
    return urlOperator;
  }
  if (aanbieders.length === 1) {
    return getAanbiederSystemId(aanbieders[0]);
  }
  return '';
};
