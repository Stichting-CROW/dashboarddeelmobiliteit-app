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
 * Use `aclOperators` (from SET_ACL_OPERATORS), not `aanbieders`: the public
 * /operators list is NL-wide and does not reflect the logged-in account scope.
 */
export const isOperatorPrestatiesView = (
  aclOperators: AanbiederOption[]
): boolean => {
  if (aclOperators.length !== 1) return false;
  return Boolean(getAanbiederSystemId(aclOperators[0]));
};

/**
 * Resolve the active view mode for the "Prestaties aanbieders" page.
 *
 * - Single-operator account (operator user): always 'operator'.
 * - Admin: respects the `?weergave=operator` URL parameter; defaults to 'municipality'.
 * - Anyone else (municipality account): always 'municipality'.
 */
export const resolvePrestatiesViewMode = (
  aclOperators: AanbiederOption[],
  isAdmin: boolean,
  urlView: string | null
): PrestatiesViewMode => {
  if (isOperatorPrestatiesView(aclOperators)) {
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
  aclOperators: AanbiederOption[]
): boolean => {
  if (!isAdmin) return false;
  // Operator-only accounts are pinned to operator view.
  if (isOperatorPrestatiesView(aclOperators)) return false;
  return true;
};

export const resolveOperatorSystemId = (
  aclOperators: AanbiederOption[],
  urlOperator: string | null
): string => {
  if (urlOperator) {
    return urlOperator;
  }
  if (aclOperators.length === 1) {
    return getAanbiederSystemId(aclOperators[0]);
  }
  return '';
};

/**
 * Operator accounts must pass system_id on every kpi_overview_operators request.
 * Returns an explicit system_id when provided, otherwise the ACL operator id.
 */
export const resolveKpiOverviewSystemId = (
  aclOperators: AanbiederOption[],
  systemId?: string
): string | undefined => {
  if (systemId) {
    return systemId;
  }
  if (isOperatorPrestatiesView(aclOperators)) {
    const aclSystemId = getAanbiederSystemId(aclOperators[0]);
    return aclSystemId || undefined;
  }
  return undefined;
};

export interface ScopedKpiOverviewParams {
  start_date: string;
  end_date: string;
  scope: 'municipality' | 'operator';
  municipality?: string;
  system_id?: string;
  aclOperators: AanbiederOption[];
}

/**
 * Build kpi_overview_operators query params for a scoped view.
 *
 * Operator accounts must pass system_id (from URL or ACL). Municipality is
 * filtered client-side via findOperatorMatch — do not send it to the API in
 * operator scope (the backend rejects operator requests that combine both).
 */
export const buildScopedKpiOverviewParams = (
  aclOperators: AanbiederOption[],
  options: {
    operatorSystemId?: string | null;
    municipality?: string | null;
    start_date: string;
    end_date: string;
  }
): ScopedKpiOverviewParams | null => {
  const resolvedSystemId = resolveKpiOverviewSystemId(
    aclOperators,
    options.operatorSystemId ?? undefined
  );
  const municipality = options.municipality ?? undefined;

  if (resolvedSystemId) {
    return {
      start_date: options.start_date,
      end_date: options.end_date,
      system_id: resolvedSystemId,
      scope: 'operator',
      aclOperators,
    };
  }

  if (!municipality) {
    return null;
  }

  return {
    start_date: options.start_date,
    end_date: options.end_date,
    municipality,
    scope: 'municipality',
    aclOperators,
  };
};
