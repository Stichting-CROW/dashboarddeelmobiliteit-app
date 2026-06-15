import { fetchOperators } from './operators';
import { resolveKpiOverviewSystemId } from '../helpers/prestatiesAanbiedersViewMode';

const MDS_BASE_URL = 'https://mds.dashboarddeelmobiliteit.nl';
export interface PermitMunicipality {
    gmcode: string;
    name: string;
}
export interface PermitOperator {
    system_id: string;
    name: string;
    color: string;
    operator_url: string;
}
export interface PermitStats {
    number_of_vehicles_in_public_space: number;
    number_of_vehicles_in_public_space_parked_to_long: number;
}
export interface PermitLimit {
    permit_limit_id: number;
    modality: string;
    effective_date: string;
    municipality: string;
    system_id: string;
    end_date?: string;
    minimum_vehicles: number;
    maximum_vehicles: number;
    minimal_number_of_trips_per_vehicle: number;
    max_parking_duration: string;
    future_permit?: PermitLimit;
}
export interface PermitVehicleType {
    id: string;
    name: string;
    icon: string;
}
export interface PermitLimitData {
    permit_limit_id?: number; // only for update
    effective_date: string;
    municipality: string;
    system_id: string;
    modality: string;
    end_date?: string;
    minimum_vehicles: number;
    maximum_vehicles: number;
    minimal_number_of_trips_per_vehicle: number;
    max_parking_duration?: string;
}
export interface PermitLimitRecord {
    municipality: PermitMunicipality;
    operator: PermitOperator;
    vehicle_type?: PermitVehicleType; /* not yet available via the API now, filled in by the frontend */
    permit_limit?: PermitLimit;
    stats?: PermitStats;
    /**
     * Summary of KPI compliance for this permit, derived from performance indicator data.
     * 'red'   => at least one KPI value is non-compliant (complies === false)
     * 'green' => no red values, but at least one KPI value is compliant (complies === true)
     * 'grey'  => only undefined / missing compliance information
     *
     * This field is primarily used for sorting rows in the permit card collections.
     */
    overallCompliance?: 'red' | 'green' | 'grey';
    /** Propulsion type (e.g. 'electric', 'combustion') when operator has multiple entries per form_factor */
    propulsion_type?: string;
}

/** New geometry_operator_modality_limit API types */
export interface GeometryOperatorModalityLimit {
    geometry_operator_modality_limit_id?: number;
    operator: string;
    geometry_ref: string;
    form_factor: string;
    propulsion_type: string;
    effective_date: string;
    end_date?: string;
    limits: Record<string, number>;
}

/** Build geometry_ref from municipality (add cbs: prefix if missing) */
export const toGeometryRef = (municipality: string): string =>
    municipality.startsWith('cbs:') ? municipality : `cbs:${municipality}`;

/** Strip cbs: prefix so GM codes can be compared regardless of format. */
export const normalizeGeometryRef = (ref: string): string =>
    ref.replace(/^cbs:/i, '');

// Helper: get 'niet actief' value for each field (used by usePermitActions for add flow)
export const PERMIT_LIMITS_NIET_ACTIEF = {
    minimum_vehicles: 0,
    maximum_vehicles: 99999999,
    minimal_number_of_trips_per_vehicle: 0,
    max_parking_duration: 'P0D',
};

export type KpiOverviewQueryScope = 'municipality' | 'operator';

export interface KpiOverviewFetchParams {
    start_date?: string;
    end_date?: string;
    municipality?: string;
    system_id?: string;
    scope?: KpiOverviewQueryScope;
    /** ACL-scoped operators from /menu/acl; used to inject system_id for operator accounts. */
    aclOperators?: Array<{ system_id?: string; value?: string }>;
}

export interface OperatorPerformanceIndicatorsParams {
    scope?: KpiOverviewQueryScope;
    municipality?: string;
    system_id?: string;
    form_factor?: string;
    start_date?: string;
    end_date?: string;
    /** ACL-scoped operators from /menu/acl; used to inject system_id for operator accounts. */
    aclOperators?: Array<{ system_id?: string; value?: string }>;
}

export const buildKpiOverviewSearchParams = (
    startDateStr: string,
    endDateStr: string,
    query: Pick<OperatorPerformanceIndicatorsParams, 'scope' | 'municipality' | 'system_id' | 'form_factor'>
): URLSearchParams | null => {
    const scope: KpiOverviewQueryScope =
        query.scope ??
        (query.system_id && !query.municipality ? 'operator' : 'municipality');

    const params = new URLSearchParams({
        start_date: startDateStr,
        end_date: endDateStr,
    });

    if (scope === 'operator') {
        if (!query.system_id) {
            return null;
        }
        params.set('system_id', query.system_id);
        // Do not pass municipality in operator scope: operator accounts are
        // authorized via system_id only; municipality is filtered client-side.
    } else {
        if (!query.municipality) {
            return null;
        }
        params.set('municipality', query.municipality);
        if (query.system_id) {
            params.set('system_id', query.system_id);
        }
    }

    if (query.form_factor) {
        params.set('form_factor', query.form_factor);
    }

    return params;
};

export interface KpiOverviewFetchResult {
    records: PermitLimitRecord[];
    rawOperators: MunicipalityModalityOperator[];
    performanceIndicatorDescriptions: PerformanceIndicatorDescription[];
}

const defaultKpiDateRange = (): { startDateStr: string; endDateStr: string } => {
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - 90);
    return {
        startDateStr: startDate.toISOString().split('T')[0],
        endDateStr: endDate.toISOString().split('T')[0],
    };
};

const fetchOperatorsMap = async () => {
    const operatorsMap = new Map<string, { system_id: string; name: string; color?: string; operator_url?: string }>();
    try {
        const operators = await fetchOperators();
        if (operators) {
            operators.forEach((op) => operatorsMap.set(op.system_id, op));
        }
    } catch (error) {
        console.warn('Failed to fetch operators, using fallback data', error);
    }
    return operatorsMap;
};

export const transformKpiOverviewToPermitRecords = (
    kpiData: OperatorPerformanceIndicatorsResponse,
    options: {
        startDateStr: string;
        defaultMunicipality?: string;
        municipalityNames?: Map<string, string>;
    }
): PermitLimitRecord[] => {
    const { startDateStr, defaultMunicipality = '', municipalityNames } = options;
    const operators = kpiData.municipality_modality_operators || [];
    if (operators.length === 0) {
        return [];
    }

    const groupKey = (item: MunicipalityModalityOperator) => {
        const geometryRef = item.geometry_ref?.replace('cbs:', '') || defaultMunicipality;
        return `${item.operator}_${item.form_factor}_${geometryRef}`;
    };
    const groupMap = new Map<string, MunicipalityModalityOperator[]>();
    for (const item of operators) {
        const key = groupKey(item);
        const existing = groupMap.get(key) || [];
        existing.push(item);
        groupMap.set(key, existing);
    }

    return Array.from(groupMap.values()).map((items) => {
        const item = items[0];
        const geometryRef = item.geometry_ref?.replace('cbs:', '') || defaultMunicipality;
        const municipalityName = municipalityNames?.get(geometryRef) || geometryRef;

        let hasRed = false;
        let hasGreen = false;
        for (const i of items) {
            const kpis = i.kpis || [];
            if (kpis.some((kpi) => (kpi.values || []).some((v) => v.complies === false))) hasRed = true;
            if (kpis.some((kpi) => (kpi.values || []).some((v) => v.complies === true))) hasGreen = true;
        }
        const overallCompliance: 'red' | 'green' | 'grey' =
            hasRed ? 'red' : hasGreen ? 'green' : 'grey';

        const sorted = [...items].sort((a, b) => {
            const order = { electric: 0, combustion: 1, human: 2 };
            return (order[a.propulsion_type as keyof typeof order] ?? 99) - (order[b.propulsion_type as keyof typeof order] ?? 99);
        });
        const propulsion_type = sorted[0].propulsion_type;

        const uniqueIdString = `${item.operator}_${item.form_factor}_${geometryRef}`;
        const permitLimitId = Math.abs(uniqueIdString.split('').reduce((hash, char) => {
            const hashValue = ((hash << 5) - hash) + char.charCodeAt(0);
            return hashValue | 0;
        }, 0));

        const permitLimit: PermitLimit = {
            permit_limit_id: permitLimitId,
            modality: item.form_factor,
            effective_date: startDateStr,
            municipality: geometryRef,
            system_id: item.operator,
            minimum_vehicles: 0,
            maximum_vehicles: 99999999,
            minimal_number_of_trips_per_vehicle: 0,
            max_parking_duration: 'P0D',
        };

        return {
            municipality: { gmcode: geometryRef, name: municipalityName },
            operator: {
                system_id: item.operator,
                name: item.operator,
                color: '#000000',
                operator_url: '',
            },
            vehicle_type: {
                id: item.form_factor,
                name: item.form_factor,
                icon: '',
            },
            permit_limit: permitLimit,
            overallCompliance,
            propulsion_type,
        };
    });
};

const enrichPermitRecordsWithOperators = async (
    records: PermitLimitRecord[]
): Promise<PermitLimitRecord[]> => {
    const operatorsMap = await fetchOperatorsMap();
    return records.map((record) => {
        const operator = operatorsMap.get(record.operator.system_id);
        if (!operator) {
            return record;
        }
        return {
            ...record,
            operator: {
                system_id: operator.system_id,
                name: operator.name,
                color: operator.color || '#000000',
                operator_url: operator.operator_url || '',
            },
        };
    });
};

/**
 * In-flight request deduplication for kpi_overview_operators.
 *
 * Concurrent callers (e.g. usePermitData + FilterbarPermits, or React StrictMode's
 * double-mount in dev) that ask for the exact same URL share the same HTTP request
 * and parsed response, instead of triggering N independent network calls.
 *
 * Each caller still applies its own post-processing (transform / enrichment) on the
 * shared raw response, so caller-specific arguments such as `municipalityNames` are
 * honoured per-caller.
 */
const inFlightKpiRawFetches = new Map<string, Promise<OperatorPerformanceIndicatorsResponse | null>>();

export const fetchKpiOverviewRaw = (
    token: string,
    searchParams: URLSearchParams,
    scopeLabel: string
): Promise<OperatorPerformanceIndicatorsResponse | null> => {
    const url = `${MDS_BASE_URL}/kpi_overview_operators?${searchParams.toString()}`;
    const cacheKey = `${token}|${url}`;

    const existing = inFlightKpiRawFetches.get(cacheKey);
    if (existing) {
        return existing;
    }

    const promise = (async () => {
        try {
            const response = await fetch(url, {
                method: 'GET',
                headers: {
                    authorization: `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
            });

            if (response.status === 500) {
                console.warn(`No KPI data found (status: ${response.status}) for [${scopeLabel}]`);
                return null;
            }

            if (response.status !== 200) {
                console.error(
                    `Error fetching kpi_overview_operators (status: ${response.status}/${response.statusText}) for [${scopeLabel}]`
                );
                return null;
            }

            return (await response.json()) as OperatorPerformanceIndicatorsResponse;
        } catch (error) {
            console.error('Error fetching kpi_overview_operators', error);
            return null;
        }
    })();

    inFlightKpiRawFetches.set(cacheKey, promise);
    promise.finally(() => {
        inFlightKpiRawFetches.delete(cacheKey);
    });
    return promise;
};

export const fetchKpiOverviewPermitRecords = async (
    token: string,
    params: KpiOverviewFetchParams,
    municipalityNames?: Map<string, string>
): Promise<KpiOverviewFetchResult | null> => {
    try {
        const { startDateStr, endDateStr } = params.start_date && params.end_date
            ? { startDateStr: params.start_date, endDateStr: params.end_date }
            : defaultKpiDateRange();

        const systemId = resolveKpiOverviewSystemId(
            params.aclOperators ?? [],
            params.system_id
        );

        const scope: KpiOverviewQueryScope =
            params.scope ??
            (systemId && !params.municipality ? 'operator' : 'municipality');

        const searchParams = buildKpiOverviewSearchParams(startDateStr, endDateStr, {
            scope,
            municipality: params.municipality,
            system_id: systemId,
        });
        if (!searchParams) {
            console.warn('KPI overview request missing required query params', params);
            return null;
        }

        const scopeLabel = params.municipality || params.system_id || 'unknown';
        const kpiData = await fetchKpiOverviewRaw(token, searchParams, scopeLabel);
        if (!kpiData) {
            return null;
        }

        const rawOperators = kpiData.municipality_modality_operators || [];
        if (rawOperators.length === 0) {
            return null;
        }

        const records = transformKpiOverviewToPermitRecords(kpiData, {
            startDateStr,
            defaultMunicipality: params.municipality,
            municipalityNames,
        });
        const enriched = await enrichPermitRecordsWithOperators(records);

        return enriched.length > 0
            ? {
                records: enriched,
                rawOperators,
                performanceIndicatorDescriptions: kpiData.performance_indicator_description || [],
            }
            : null;
    } catch (error) {
        console.error('Error fetching KPI overview', error);
        return null;
    }
};

export const getPermitLimitOverviewForMunicipality = async (
    token: string,
    municipality: string,
    startDate?: string,
    endDate?: string,
    aclOperators?: Array<{ system_id?: string; value?: string }>
) => {
    const result = await fetchKpiOverviewPermitRecords(token, {
        municipality,
        start_date: startDate,
        end_date: endDate,
        aclOperators,
    });
    return result?.records ?? null;
};

export const getPermitLimitOverviewForOperator = async (
    token: string,
    system_id: string,
    startDate?: string,
    endDate?: string,
    municipalityNames?: Map<string, string>,
    aclOperators?: Array<{ system_id?: string; value?: string }>
) => {
    const result = await fetchKpiOverviewPermitRecords(
        token,
        {
            system_id,
            start_date: startDate,
            end_date: endDate,
            scope: 'operator',
            aclOperators,
        },
        municipalityNames
    );
    return result;
};

// --- geometry_operator_modality_limit API ---

export const getGeometryOperatorModalityLimitHistory = async (
    token: string,
    operator: string,
    geometry_ref: string,
    form_factor: string,
    propulsion_type: string
): Promise<GeometryOperatorModalityLimit[] | null> => {
    try {
        const params = new URLSearchParams({
            operator,
            geometry_ref,
            form_factor,
            propulsion_type,
        }).toString();
        const url = `${MDS_BASE_URL}/public/geometry_operator_modality_limit_history?${params}`;
        const response = await fetch(url, {
            method: 'GET',
            headers: {
                "authorization": `Bearer ${token}`,
                "Content-Type": "application/json",
            },
        });

        if (response.status !== 200) {
            const message = `Error fetching geometry_operator_modality_limit history (status: ${response.status}/${response.statusText})`;
            console.error(message);
            return null;
        }

        const results = await response.json();
        return Array.isArray(results) ? results : null;
    } catch (error) {
        console.error("Error fetching geometry_operator_modality_limit history", error);
        return null;
    }
};

/**
 * Fetch all geometry_operator_modality_limit records for a municipality.
 * Tries GET /public/geometry_operator_modality_limit?geometry_ref=X first.
 * If that endpoint does not exist (404), falls back to fetching limit history
 * for each (operator, form_factor, propulsion_type) from permit overview.
 */
export const getAllGeometryOperatorModalityLimitsForMunicipality = async (
    token: string,
    municipality: string
): Promise<GeometryOperatorModalityLimit[]> => {
    const geometryRef = toGeometryRef(municipality);

    // Try dedicated endpoint first (if backend supports it)
    try {
        const url = `${MDS_BASE_URL}/public/geometry_operator_modality_limit?geometry_ref=${encodeURIComponent(geometryRef)}`;
        const response = await fetch(url, {
            method: 'GET',
            headers: {
                "authorization": `Bearer ${token}`,
                "Content-Type": "application/json",
            },
        });
        if (response.ok) {
            const results = await response.json();
            return Array.isArray(results) ? results : (results ? [results] : []);
        }
    } catch {
        // Fall through to fallback
    }

    // Fallback: get combinations from permit overview, fetch history for each
    const overview = await getPermitLimitOverviewForMunicipality(token, municipality);
    if (!overview || overview.length === 0) return [];

    const seen = new Set<string>();
    const allRecords: GeometryOperatorModalityLimit[] = [];

    for (const record of overview) {
        const operator = record.permit_limit?.system_id || record.operator?.system_id;
        const formFactor = record.vehicle_type?.id || record.permit_limit?.modality;
        const propulsionType = record.propulsion_type ?? '';
        if (!operator || !formFactor) continue;

        const key = `${operator}|${formFactor}|${propulsionType}`;
        if (seen.has(key)) continue;
        seen.add(key);

        const history = await getGeometryOperatorModalityLimitHistory(
            token,
            operator,
            geometryRef,
            formFactor,
            propulsionType
        );
        if (Array.isArray(history)) {
            allRecords.push(...history);
        }
    }

    return allRecords;
};

/** Validate effective_date when allowChange is false - only future dates allowed */
function validateEffectiveDate(data: GeometryOperatorModalityLimit, allowChange: boolean): void {
    if (allowChange) return;
    const today = new Date().toISOString().split('T')[0];
    if (data.effective_date < today) {
        throw new Error('Alleen toekomstige datums kunnen worden gewijzigd.');
    }
}

export const addGeometryOperatorModalityLimit = async (
    token: string,
    data: GeometryOperatorModalityLimit,
    allowChange = true
): Promise<GeometryOperatorModalityLimit | null> => {
    validateEffectiveDate(data, allowChange);
    try {
        const url = `${MDS_BASE_URL}/admin/geometry_operator_modality_limit`;
        const response = await fetch(url, {
            method: 'POST',
            headers: {
                "authorization": `Bearer ${token}`,
                "Content-Type": "application/json",
            },
            body: JSON.stringify(data),
        });

        if (response.status !== 201) {
            const bodyText = await response.text();
            console.error(`[addGeometryOperatorModalityLimit] failed status=${response.status} ${response.statusText}`, {
                url: `${MDS_BASE_URL}/admin/geometry_operator_modality_limit`,
                body: bodyText || '(no body)',
            });
            const errMsg = parseApiErrorMessage(bodyText) || `HTTP ${response.status}: ${response.statusText}`;
            throw new Error(errMsg);
        }

        return await response.json();
    } catch (error) {
        if (error instanceof Error) throw error;
        console.error("[addGeometryOperatorModalityLimit] exception", error);
        throw new Error('Onbekende fout bij toevoegen');
    }
};

export const updateGeometryOperatorModalityLimit = async (
    token: string,
    data: GeometryOperatorModalityLimit,
    allowChange = true
): Promise<GeometryOperatorModalityLimit | null> => {
    if (!data.geometry_operator_modality_limit_id) {
        console.error('Cannot update geometry_operator_modality_limit without geometry_operator_modality_limit_id');
        return null;
    }
    validateEffectiveDate(data, allowChange);

    const url = `${MDS_BASE_URL}/admin/geometry_operator_modality_limit`;

    try {
        const response = await fetch(url, {
            method: 'PUT',
            headers: {
                "authorization": `Bearer ${token}`,
                "Content-Type": "application/json",
            },
            body: JSON.stringify(data),
        });

        const bodyText = await response.text();

        if (response.status !== 200 && response.status !== 204) {
            console.error(`[updateGeometryOperatorModalityLimit] failed status=${response.status} ${response.statusText}`, {
                url,
                body: bodyText || '(no body)',
            });
            const errMsg = parseApiErrorMessage(bodyText) || `HTTP ${response.status}: ${response.statusText}`;
            throw new Error(errMsg);
        }

        // 204 No Content: success with no body
        if (response.status === 204) {
            return data;
        }
        const result = bodyText ? JSON.parse(bodyText) : null;
        return result;
    } catch (error) {
        if (error instanceof Error) throw error;
        console.error('[updateGeometryOperatorModalityLimit] exception', { url, error });
        throw new Error('Onbekende fout bij bijwerken');
    }
};

/** Extract a user-friendly error message from API error response body */
function parseApiErrorMessage(bodyText: string): string | null {
    if (!bodyText?.trim()) return null;
    try {
        const j = JSON.parse(bodyText);
        if (j && typeof j === 'object') {
            const msg = j.message ?? j.error ?? j.detail ?? j.msg;
            if (typeof msg === 'string') return msg;
            if (Array.isArray(j.errors) && j.errors.length > 0) {
                const first = j.errors[0];
                return typeof first === 'string' ? first : (first?.message ?? first?.msg ?? JSON.stringify(first));
            }
        }
    } catch {
        // not JSON, use raw text if short enough
        if (bodyText.length <= 200) return bodyText;
    }
    return null;
}

export const deleteGeometryOperatorModalityLimit = async (
    token: string,
    id: number
): Promise<boolean> => {
    try {
        const url = `${MDS_BASE_URL}/admin/geometry_operator_modality_limit/${id}`;
        const response = await fetch(url, {
            method: 'DELETE',
            headers: {
                "authorization": `Bearer ${token}`,
                "Content-Type": "application/json",
            },
        });

        if (response.status !== 200 && response.status !== 204) {
            console.error(`Error deleting geometry_operator_modality_limit (status: ${response.status}/${response.statusText})`);
            return false;
        }
        return true;
    } catch (error) {
        console.error("Error deleting geometry_operator_modality_limit", error);
        return false;
    }
};

// Performance Indicators Types
export interface PerformanceIndicatorValue {
    date: string;
    measured: number;
    threshold?: number;
    complies?: boolean;
}

export interface PerformanceIndicatorKPI {
    kpi_key: string;
    granularity: string;
    values: PerformanceIndicatorValue[];
}

export interface PerformanceIndicatorDescription {
    kpi_key: string;
    bound: string;
    unit: string;
    title: string;
    description: string;
    bound_description: string;
}

export interface MunicipalityModalityOperator {
    operator: string;
    form_factor: string;
    propulsion_type: string;
    geometry_ref: string;
    kpis: PerformanceIndicatorKPI[];
}

export interface OperatorPerformanceIndicatorsResponse {
    performance_indicator_description: PerformanceIndicatorDescription[];
    municipality_modality_operators: MunicipalityModalityOperator[];
}

/**
 * Find operator data matching operator, form_factor and optionally propulsion_type
 * and municipality (geometry_ref).
 */
export function findOperatorMatch(
    operators: MunicipalityModalityOperator[],
    operator: string,
    formFactor: string,
    propulsionType?: string,
    geometryRef?: string
): MunicipalityModalityOperator | undefined {
    const normalizedGeometryRef = geometryRef
        ? normalizeGeometryRef(geometryRef)
        : undefined;

    const matches = operators.filter((item) => {
        if (item.operator !== operator || item.form_factor !== formFactor) {
            return false;
        }
        if (normalizedGeometryRef !== undefined) {
            const itemRef = item.geometry_ref
                ? normalizeGeometryRef(item.geometry_ref)
                : '';
            if (itemRef !== normalizedGeometryRef) {
                return false;
            }
        }
        return true;
    });

    if (matches.length === 0) return undefined;
    if (propulsionType) {
        const match = matches.find((m) => m.propulsion_type === propulsionType);
        return match ?? matches[0];
    }
    return matches[0];
}

export const getOperatorPerformanceIndicators = async (
    token: string,
    request: OperatorPerformanceIndicatorsParams
): Promise<OperatorPerformanceIndicatorsResponse | null> => {
    try {
        let startDateStr: string;
        let endDateStr: string;

        if (request.start_date && request.end_date) {
            startDateStr = request.start_date;
            endDateStr = request.end_date;
        } else {
            const { startDateStr: defaultStart, endDateStr: defaultEnd } = defaultKpiDateRange();
            startDateStr = defaultStart;
            endDateStr = defaultEnd;
        }

        const systemId = resolveKpiOverviewSystemId(
            request.aclOperators ?? [],
            request.system_id
        );
        const scopedRequest = { ...request, system_id: systemId };

        const searchParams = buildKpiOverviewSearchParams(startDateStr, endDateStr, scopedRequest);
        if (!searchParams) {
            console.warn('KPI indicators request missing required query params', scopedRequest);
            return null;
        }

        const scopeLabel = systemId || request.municipality || 'unknown';
        const apiData = await fetchKpiOverviewRaw(token, searchParams, scopeLabel);
        if (!apiData) {
            return null;
        }

        const { system_id: operator, form_factor, municipality } = scopedRequest;

        if (operator || form_factor || municipality) {
            const filteredOperators = apiData.municipality_modality_operators.filter((item) => {
                const operatorMatch = !operator || item.operator === operator;
                const formFactorMatch = !form_factor || item.form_factor === form_factor;
                const municipalityMatch =
                    !municipality ||
                    item.geometry_ref?.replace('cbs:', '') === municipality ||
                    item.geometry_ref === municipality;
                return operatorMatch && formFactorMatch && municipalityMatch;
            });

            return {
                ...apiData,
                municipality_modality_operators: filteredOperators,
            };
        }

        return apiData;
    } catch (error) {
        console.error('Error fetching operator performance indicators', error);
        return null;
    }
};
