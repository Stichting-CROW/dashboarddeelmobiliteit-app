interface GebiedOption {
  gm_code?: string;
}

interface AanbiederOption {
  system_id?: string;
  value?: string;
}

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
