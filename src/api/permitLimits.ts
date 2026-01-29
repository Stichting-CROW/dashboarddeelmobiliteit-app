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
}

// Helper: get 'niet actief' value for each field
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

        // Transform each operator/modality combination into a PermitLimitRecord
        // Deduplicate by operator + form_factor + municipality (ignoring propulsion_type)
        const seenCombinations = new Map<string, boolean>();
        const results: PermitLimitRecord[] = (kpiData.municipality_modality_operators || [])
            .filter((item: MunicipalityModalityOperator) => {
                const geometryRef = item.geometry_ref?.replace('cbs:', '') || municipality;
                // Create a unique key based on operator + form_factor + municipality (excluding propulsion_type)
                const uniqueKey = `${item.operator}_${item.form_factor}_${geometryRef}`;
                
                // If we've already seen this combination, skip it
                if (seenCombinations.has(uniqueKey)) {
                    return false;
                }
                
                // Mark this combination as seen
                seenCombinations.set(uniqueKey, true);
                return true;
            })
            .map((item: MunicipalityModalityOperator) => {
                const operator = operatorsMap.get(item.operator);
                const geometryRef = item.geometry_ref?.replace('cbs:', '') || municipality;
                
                // Create a minimal permit_limit record
                // Generate a unique ID based on operator + form_factor + municipality combination
                // This allows the component to display the record even if actual permit limit data isn't available
                const uniqueIdString = `${item.operator}_${item.form_factor}_${geometryRef}`;
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
            // console.log(message, results);
            return results;
        } else {
            // const message = `**** Found no ${results.length} permit limits for [${system_id}]`;
            // console.log(message, results);
            return null // no permit limit found
        }
    } catch (error) {
        console.error("Error fetching permit limit overview", error);
        return null;
    }
}

export const addPermitLimit = async (token: string, permitLimitData: PermitLimitData) => {
    try {
        const url = `${MDS_BASE_URL}/admin/permit_limit`;

        const response = await fetch(url, {
            method: 'POST',
            headers: {
                "authorization": `Bearer ${token}`,
                "Content-Type": "application/json",
            },
            body: JSON.stringify(permitLimitData),
        });

        if(response.status !== 201) {
            const message = `Error adding permit limit (status: ${response.status}/${response.statusText})`;
            console.error(message);
            return null;
        }

        const result = await response.json() as PermitLimitData;
        return result;
    } catch (error) {
        console.error("Error adding permit limit", error);
        return false;
    }
}

export const updatePermitLimit = async (token: string, permitLimitData: PermitLimitData) => {
    try {
        const url = `${MDS_BASE_URL}/admin/permit_limit`;

        const response = await fetch(url, {
            method: 'PUT',
            headers: {
                "authorization": `Bearer ${token}`,
                "Content-Type": "application/json",
            },
            body: JSON.stringify(permitLimitData),
        });

        if(response.status !== 200) {
            const message = `Error updating permit limit (status: ${response.status}/${response.statusText})`;
            console.error(message);
            return null;
        }

        const result = await response.json() as PermitLimitData;
        return result;
    } catch (error) {
        console.error("Error updating permit limit", error);
        return false;
    }
}

export const getPermitLimitHistory = async (token: string, municipality: string, provider_system_id: string, modality: string) => {
    try {
        const params = new URLSearchParams({municipality, system_id: provider_system_id, modality}).toString();
        const url = `${MDS_BASE_URL}/public/permit_limit_history?${params}`;
        const response = await fetch(url, {
            method: 'GET',
            headers: {
                "authorization": `Bearer ${token}`,
            }
        });

        if(response.status !== 200) {
            const message = `Error fetching permit limit history (status: ${response.status}/${response.statusText}) for [${municipality}/${provider_system_id}/${modality}]`;
            console.error(message);
            return null;
        }

        const results = await response.json() as PermitLimitData[];
        if(results.length > 0) {
            // const message = `**** Found ${results.length} permit limits for [${municipality}/${provider_system_id}/${modality}]`;
            // console.log(message, results);
            return results;
        } else {
            // const message = `**** Found no ${results.length} permit limits for [${municipality}/${provider_system_id}/${modality}]`;
            // console.log(message, results);
            return null // no permit limit found
        }
    } catch (error) {
        console.error("Error fetching permit limit overview", error);
        return null;
    }
}

export const deletePermitLimit = async (token: string, permit_limit_id: number) => {
    try {
        const url = `${MDS_BASE_URL}/admin/permit_limit/${permit_limit_id}`;
        const response = await fetch(url, {
            method: 'DELETE',
            headers: {
                "authorization": `Bearer ${token}`,
            }
        });
        if (response.status !== 200 && response.status !== 204) {
            const message = `Error deleting permit limit (status: ${response.status}/${response.statusText})`;
            console.error(message);
            return false;
        }
        return true;
    } catch (error) {
        console.error("Error deleting permit limit", error);
        return false;
    }
}

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
