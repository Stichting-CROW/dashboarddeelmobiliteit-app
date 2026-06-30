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
 * Scope selection is driven by the *account type*, not by whether a system_id
 * happens to be present in the URL:
 *
 * - Operator accounts use operator scope (system_id only). The backend
 *   authorizes them via their own system_id and rejects requests that combine
 *   system_id with municipality.
 * - Municipality (and admin) accounts use municipality scope. The backend
 *   forbids municipality accounts from issuing operator-scoped (system_id-only)
 *   requests — doing so returns 403. The selected operator is filtered
 *   client-side via findOperatorMatch, so system_id is intentionally omitted
 *   here (which also lets this fetch share the in-flight cache with the
 *   municipality overview fetch).
 *
 * As a fallback, when no municipality is available we still use operator scope
 * if a system_id is resolvable (e.g. admin operator view without a gebied),
 * preserving the previous behavior for accounts that are allowed to do so.
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
  const isOperatorAccount = isOperatorPrestatiesView(aclOperators);

  // Operator accounts are authorized via system_id only; never send municipality.
  if (isOperatorAccount && resolvedSystemId) {
    return {
      start_date: options.start_date,
      end_date: options.end_date,
      system_id: resolvedSystemId,
      scope: 'operator',
      aclOperators,
    };
  }

  // Municipality (and admin) accounts must query by municipality and filter the
  // operator client-side. Sending system_id without municipality is rejected
  // with 403 for municipality accounts.
  if (municipality) {
    return {
      start_date: options.start_date,
      end_date: options.end_date,
      municipality,
      scope: 'municipality',
      aclOperators,
    };
  }

  // No municipality context: fall back to operator scope when allowed.
  if (resolvedSystemId) {
    return {
      start_date: options.start_date,
      end_date: options.end_date,
      system_id: resolvedSystemId,
      scope: 'operator',
      aclOperators,
    };
  }

  return null;
};
