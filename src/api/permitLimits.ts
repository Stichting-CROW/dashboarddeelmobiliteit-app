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

// Helper: get 'niet actief' value for each field (used by usePermitActions for add flow)
export const PERMIT_LIMITS_NIET_ACTIEF = {
    minimum_vehicles: 0,
    maximum_vehicles: 99999999,
    minimal_number_of_trips_per_vehicle: 0,
    max_parking_duration: 'P0D',
};

export const getPermitLimitOverviewForMunicipality = async (
    token: string, 
    municipality: string) => {
    try {
        // Use the new kpi_overview_operators endpoint
        // Default to last 90 days if no dates provided
        const endDate = new Date();
        const startDate = new Date();
        startDate.setDate(startDate.getDate() - 90);
        
        const startDateStr = startDate.toISOString().split('T')[0];
        const endDateStr = endDate.toISOString().split('T')[0];
        
        const params = new URLSearchParams({
            start_date: startDateStr,
            end_date: endDateStr,
            municipality: municipality
        }).toString();
        
        const url = `${MDS_BASE_URL}/kpi_overview_operators?${params}`;
        const response = await fetch(url, {
            method: 'GET',
            headers: {
                "authorization": `Bearer ${token}`,
                "Content-Type": "application/json"
            }
        });

        if(response.status === 500) {
            const message = `No KPI data found (status: ${response.status}) for [${municipality}]`;
            console.warn(message);
            return null;
        }

        if(response.status !== 200 && response.status !== 500) {
            const message = `Error fetching KPI overview (status: ${response.status}/${response.statusText}) for [${municipality}]`;
            console.error(message);
            return null;
        }

        const kpiData = await response.json();
        
        // Transform KPI response to PermitLimitRecord[] format
        if (!kpiData.municipality_modality_operators || kpiData.municipality_modality_operators.length === 0) {
            return null;
        }

        // Fetch operators to get operator details
        let operatorsMap = new Map<string, { system_id: string; name: string; color?: string; operator_url?: string }>();
        try {
            const operatorsResponse = await fetch('https://mds.dashboarddeelmobiliteit.nl/operators');
            if (operatorsResponse.ok) {
                const operatorsData = await operatorsResponse.json();
                operatorsMap = new Map(
                    (operatorsData.operators || []).map((op: { system_id: string; name: string; color?: string; operator_url?: string }) => [op.system_id, op])
                );
            }
        } catch (error) {
            console.warn('Failed to fetch operators, using fallback data', error);
        }

        // Transform each operator/modality/propulsion combination into a PermitLimitRecord
        // Show separate cards for each propulsion type (e.g. greenwheels combustion + greenwheels electric)
        const operators = kpiData.municipality_modality_operators || [];
        const results: PermitLimitRecord[] = operators.map((item: MunicipalityModalityOperator) => {
                const operator = operatorsMap.get(item.operator);
                const geometryRef = item.geometry_ref?.replace('cbs:', '') || municipality;

                // Derive an overall compliance summary from all KPI values for this operator+form_factor+propulsion
                const kpis = item.kpis || [];
                const hasRed = kpis.some(kpi =>
                    (kpi.values || []).some(value => value.complies === false)
                );
                const hasGreen = !hasRed && kpis.some(kpi =>
                    (kpi.values || []).some(value => value.complies === true)
                );
                const overallCompliance: 'red' | 'green' | 'grey' =
                    hasRed ? 'red' : hasGreen ? 'green' : 'grey';
                
                // Create a minimal permit_limit record
                // Generate a unique ID including propulsion_type so each combination has its own card
                const uniqueIdString = `${item.operator}_${item.form_factor}_${geometryRef}_${item.propulsion_type || ''}`;
                const permitLimitId = Math.abs(uniqueIdString.split('').reduce((hash, char) => {
                    const hashValue = ((hash << 5) - hash) + char.charCodeAt(0);
                    return hashValue | 0; // Convert to 32-bit integer
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

                const record: PermitLimitRecord = {
                    municipality: {
                        gmcode: geometryRef,
                        name: geometryRef, // Municipality name would need to be fetched separately
                    },
                    operator: operator ? {
                        system_id: operator.system_id,
                        name: operator.name,
                        color: operator.color || '#000000',
                        operator_url: operator.operator_url || '',
                    } : {
                        system_id: item.operator,
                        name: item.operator,
                        color: '#000000',
                        operator_url: '',
                    },
                    vehicle_type: {
                        id: item.form_factor,
                        name: item.form_factor, // Will be enhanced by usePermitData hook
                        icon: '', // Will be set by usePermitData hook
                    },
                    permit_limit: permitLimit,
                    overallCompliance,
                    propulsion_type: item.propulsion_type,
                };

                return record;
            });

        if(results.length > 0) {
            return results;
        } else {
            return null;
        }
    } catch (error) {
        console.error("Error fetching KPI overview", error);
        return null;
    }
}

export const getPermitLimitOverviewForOperator = async (
    token: string, 
    system_id: string) => {
    try {
        const params = new URLSearchParams({system_id}).toString();
        const url = `${MDS_BASE_URL}/public/permit_limit_overview?${params}`;
        const response = await fetch(url, {
            method: 'GET',
            headers: {
                "authorization": `Bearer ${token}`,
            }
        });

        if(response.status === 500) {
            const message = `No permit limit found (status: ${response.status}) for [${system_id}]`;
            console.warn(message);
            return null;
        }

        if(response.status !== 200 && response.status !== 500) {
            const message = `Error fetching permit limit overview (status: ${response.status}/${response.statusText}) for [${system_id}]`;
            console.error(message);
            return null;
        }

        const results = await response.json() as PermitLimitRecord[];
        
        if(results.length > 0) {
            // const message = `**** Found ${results.length} permit limits for [${system_id}]`;
            return results;
        } else {
            // const message = `**** Found no ${results.length} permit limits for [${system_id}]`;
            return null // no permit limit found
        }
    } catch (error) {
        console.error("Error fetching permit limit overview", error);
        return null;
    }
}

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
 * Find operator data matching operator, form_factor and optionally propulsion_type.
 */
export function findOperatorMatch(
    operators: MunicipalityModalityOperator[],
    operator: string,
    formFactor: string,
    propulsionType?: string
): MunicipalityModalityOperator | undefined {
    const matches = operators.filter(
        item => item.operator === operator && item.form_factor === formFactor
    );
    if (matches.length === 0) return undefined;
    if (propulsionType) {
        const match = matches.find(m => m.propulsion_type === propulsionType);
        return match ?? matches[0];
    }
    return matches[0];
}

export const getOperatorPerformanceIndicators = async (
    token: string,
    municipality: string,
    operator?: string,
    form_factor?: string,
    startDate?: string,
    endDate?: string
): Promise<OperatorPerformanceIndicatorsResponse | null> => {
    try {
        // Use provided dates or default to last 90 days if no dates provided
        let startDateStr: string;
        let endDateStr: string;
        
        if (startDate && endDate) {
            startDateStr = startDate;
            endDateStr = endDate;
        } else {
            const endDateDefault = new Date();
            const startDateDefault = new Date();
            startDateDefault.setDate(startDateDefault.getDate() - 90);
            
            startDateStr = startDateDefault.toISOString().split('T')[0];
            endDateStr = endDateDefault.toISOString().split('T')[0];
        }
        
        const params = new URLSearchParams({
            start_date: startDateStr,
            end_date: endDateStr,
            municipality: municipality
        });
        
        if (operator) {
            params.append('system_id', operator);
        }
        
        if (form_factor) {
            params.append('form_factor', form_factor);
        }
        
        const url = `${MDS_BASE_URL}/kpi_overview_operators?${params.toString()}`;
        const response = await fetch(url, {
            method: 'GET',
            headers: {
                "authorization": `Bearer ${token}`,
                "Content-Type": "application/json"
            }
        });

        if (response.status === 500) {
            const message = `No KPI data found (status: ${response.status}) for [${municipality}]`;
            console.warn(message);
            return null;
        }

        if (response.status !== 200 && response.status !== 500) {
            const message = `Error fetching operator performance indicators (status: ${response.status}/${response.statusText}) for [${municipality}]`;
            console.error(message);
            return null;
        }

        const apiData: OperatorPerformanceIndicatorsResponse = await response.json();
        
        // Filter by operator and form_factor if provided (in case API doesn't filter)
        if (operator || form_factor) {
            const filteredOperators = apiData.municipality_modality_operators.filter(item => {
                const operatorMatch = !operator || item.operator === operator;
                const formFactorMatch = !form_factor || item.form_factor === form_factor;
                return operatorMatch && formFactorMatch;
            });
            
            return {
                ...apiData,
                municipality_modality_operators: filteredOperators
            };
        }
        
        return apiData;
    } catch (error) {
        console.error("Error fetching operator performance indicators", error);
        return null;
    }
};
