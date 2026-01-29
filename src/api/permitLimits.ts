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
        const results: PermitLimitRecord[] = (kpiData.municipality_modality_operators || []).map((item: MunicipalityModalityOperator) => {
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
    form_factor?: string
): Promise<OperatorPerformanceIndicatorsResponse | null> => {
    try {
        // TODO: Replace with actual API endpoint when available
        // For now, return stub data matching the provided JSON structure
        const stubData: OperatorPerformanceIndicatorsResponse = {
  "performance_indicator_description": [
        {
            "kpi_key": "vehicle_cap",
            "bound": "upper",
            "unit": "number",
            "title": "Aantal onverhuurde voertuigen",
            "description": "Het maximale aantal geparkeerde voertuigen op een dag. Dit is de maximale waarde van het aantal voertuigen op 6 tijdstippen.",
            "bound_description": "Het maximale aantal voertuigen dat geparkeerd mag zijn in de gemeente."
        },
        {
            "kpi_key": "number_of_wrongly_parked_vehicles",
            "bound": "lower",
            "unit": "number",
            "title": "Voertuigen in verbodsgebieden",
            "description": "Het aantal voertuigen dat op een dag verkeerd geparkeerd staat.",
            "bound_description": "Het maximale aantal verkeerd geparkeerde voertuigen dat is toegestaan per dag."
        },
        {
            "kpi_key": "percentage_parked_longer_then_24_hours",
            "bound": "lower",
            "unit": "number",
            "title": "Parkeerduur > 1 dag",
            "description": "Het percentage van voertuigen dat langer dan 24 uur geparkeerd is.",
            "bound_description": "Het maximale percentage voertuigen dat langer dan 24 uur geparkeerd mag zijn."
        },
        {
            "kpi_key": "percentage_parked_longer_then_3_days",
            "bound": "upper",
            "unit": "percentage",
            "title": "Parkeerduur > 3 dagen",
            "description": "Het percentage van voertuigen dat langer dan 3 dagen geparkeerd is.",
            "bound_description": "Het maximale percentage voertuigen dat langer dan 3 dagen geparkeerd mag zijn."
        },
        {
            "kpi_key": "percentage_parked_longer_then_7_days",
            "bound": "upper",
            "unit": "percentage",
            "title": "Parkeerduur > 7 dagen",
            "description": "Het percentage van voertuigen dat langer dan 7 dagen geparkeerd is.",
            "bound_description": "Het maximale percentage voertuigen dat langer dan 7 dagen geparkeerd mag zijn."
        },
        {
            "kpi_key": "percentage_parked_longer_then_14_days",
            "bound": "upper",
            "unit": "percentage",
            "title": "Parkeerduur > 14 dagen",
            "description": "Het percentage van voertuigen dat langer dan 14 dagen geparkeerd is.",
            "bound_description": "Het maximale percentage voertuigen dat langer dan 14 dagen geparkeerd mag zijn."
        }
    ],  
    "municipality_modality_operators": [
        {
            "operator": "baqme",
            "form_factor": "cargo_bicycle",
            "propulsion_type": "electric_assist",
            "geometry_ref": "cbs:GM0599",
            "kpis": [
                {
                    "kpi_key": "number_of_wrongly_parked_vehicles",
                    "granularity": "day",
                    "values": [
                        {
                            "date": "2025-09-16",
                            "measured": 43.0
                        },
                        {
                            "date": "2025-09-17",
                            "measured": 38.0
                        },
                        {
                            "date": "2025-09-18",
                            "measured": 38.0
                        },
                        {
                            "date": "2025-09-19",
                            "measured": 86.0
                        },
                        {
                            "date": "2025-09-20",
                            "measured": 101.0
                        },
                        {
                            "date": "2025-09-21",
                            "measured": 65.0
                        },
                        {
                            "date": "2025-09-22",
                            "measured": 55.0
                        },
                        {
                            "date": "2025-09-23",
                            "measured": 66.0
                        },
                        {
                            "date": "2025-09-24",
                            "measured": 61.0
                        },
                        {
                            "date": "2025-09-25",
                            "measured": 35.0
                        },
                        {
                            "date": "2025-09-26",
                            "measured": 45.0
                        },
                        {
                            "date": "2025-09-27",
                            "measured": 72.0
                        },
                        {
                            "date": "2025-09-28",
                            "measured": 52.0
                        },
                        {
                            "date": "2025-09-29",
                            "measured": 45.0
                        },
                        {
                            "date": "2025-09-30",
                            "measured": 27.0
                        },
                        {
                            "date": "2025-10-01",
                            "measured": 62.0
                        },
                        {
                            "date": "2025-10-02",
                            "measured": 66.0
                        },
                        {
                            "date": "2025-10-03",
                            "measured": 80.0
                        },
                        {
                            "date": "2025-10-04",
                            "measured": 59.0
                        },
                        {
                            "date": "2025-10-05",
                            "measured": 33.0
                        },
                        {
                            "date": "2025-10-06",
                            "measured": 22.0
                        },
                        {
                            "date": "2025-10-08",
                            "measured": 54.0
                        },
                        {
                            "date": "2025-10-09",
                            "measured": 65.0
                        },
                        {
                            "date": "2025-10-10",
                            "measured": 68.0
                        },
                        {
                            "date": "2025-10-11",
                            "measured": 89.0
                        },
                        {
                            "date": "2025-10-12",
                            "measured": 83.0
                        },
                        {
                            "date": "2025-10-13",
                            "measured": 51.0
                        },
                        {
                            "date": "2025-10-14",
                            "measured": 32.0
                        },
                        {
                            "date": "2025-10-15",
                            "measured": 26.0
                        },
                        {
                            "date": "2025-10-16",
                            "measured": 39.0
                        },
                        {
                            "date": "2025-10-17",
                            "measured": 46.0
                        },
                        {
                            "date": "2025-10-18",
                            "measured": 53.0
                        },
                        {
                            "date": "2025-10-19",
                            "measured": 47.0
                        },
                        {
                            "date": "2025-10-20",
                            "measured": 41.0
                        },
                        {
                            "date": "2025-10-21",
                            "measured": 29.0
                        },
                        {
                            "date": "2025-10-22",
                            "measured": 73.0
                        },
                        {
                            "date": "2025-10-23",
                            "measured": 50.0
                        },
                        {
                            "date": "2025-10-24",
                            "measured": 58.0
                        },
                        {
                            "date": "2025-10-25",
                            "measured": 34.0
                        },
                        {
                            "date": "2025-10-26",
                            "measured": 34.0
                        },
                        {
                            "date": "2025-10-27",
                            "measured": 59.0
                        },
                        {
                            "date": "2025-10-28",
                            "measured": 30.0
                        },
                        {
                            "date": "2025-10-29",
                            "measured": 45.0
                        },
                        {
                            "date": "2025-10-30",
                            "measured": 50.0
                        },
                        {
                            "date": "2025-10-31",
                            "measured": 55.0
                        },
                        {
                            "date": "2025-11-01",
                            "measured": 68.0
                        },
                        {
                            "date": "2025-11-02",
                            "measured": 56.0
                        },
                        {
                            "date": "2025-11-03",
                            "measured": 40.0
                        },
                        {
                            "date": "2025-11-04",
                            "measured": 28.0
                        },
                        {
                            "date": "2025-11-05",
                            "measured": 55.0
                        },
                        {
                            "date": "2025-11-06",
                            "measured": 42.0
                        },
                        {
                            "date": "2025-11-08",
                            "measured": 95.0
                        },
                        {
                            "date": "2025-11-09",
                            "measured": 67.0
                        },
                        {
                            "date": "2025-11-10",
                            "measured": 56.0
                        },
                        {
                            "date": "2025-11-11",
                            "measured": 68.0
                        },
                        {
                            "date": "2025-11-12",
                            "measured": 85.0
                        },
                        {
                            "date": "2025-11-13",
                            "measured": 51.0
                        },
                        {
                            "date": "2025-11-14",
                            "measured": 39.0
                        },
                        {
                            "date": "2025-11-15",
                            "measured": 50.0
                        },
                        {
                            "date": "2025-11-16",
                            "measured": 49.0
                        },
                        {
                            "date": "2025-11-17",
                            "measured": 36.0
                        },
                        {
                            "date": "2025-11-18",
                            "measured": 41.0
                        },
                        {
                            "date": "2025-11-19",
                            "measured": 42.0
                        },
                        {
                            "date": "2025-11-20",
                            "measured": 37.0
                        },
                        {
                            "date": "2025-11-21",
                            "measured": 41.0
                        },
                        {
                            "date": "2025-11-22",
                            "measured": 43.0
                        },
                        {
                            "date": "2025-11-23",
                            "measured": 15.0
                        },
                        {
                            "date": "2025-11-24",
                            "measured": 38.0
                        },
                        {
                            "date": "2025-11-25",
                            "measured": 55.0
                        },
                        {
                            "date": "2025-11-26",
                            "measured": 51.0
                        },
                        {
                            "date": "2025-11-27",
                            "measured": 42.0
                        },
                        {
                            "date": "2025-11-28",
                            "measured": 55.0
                        },
                        {
                            "date": "2025-11-29",
                            "measured": 58.0
                        },
                        {
                            "date": "2025-11-30",
                            "measured": 61.0
                        },
                        {
                            "date": "2025-12-01",
                            "measured": 37.0
                        },
                        {
                            "date": "2025-12-02",
                            "measured": 52.0
                        },
                        {
                            "date": "2025-12-03",
                            "measured": 67.0
                        },
                        {
                            "date": "2025-12-04",
                            "measured": 40.0
                        },
                        {
                            "date": "2025-12-05",
                            "measured": 52.0
                        },
                        {
                            "date": "2025-12-06",
                            "measured": 33.0
                        },
                        {
                            "date": "2025-12-07",
                            "measured": 38.0
                        },
                        {
                            "date": "2025-12-09",
                            "measured": 37.0
                        },
                        {
                            "date": "2025-12-10",
                            "measured": 42.0
                        },
                        {
                            "date": "2025-12-11",
                            "measured": 56.0
                        },
                        {
                            "date": "2025-12-12",
                            "measured": 80.0
                        },
                        {
                            "date": "2025-12-13",
                            "measured": 83.0
                        },
                        {
                            "date": "2025-12-14",
                            "measured": 61.0
                        },
                        {
                            "date": "2025-12-15",
                            "measured": 61.0
                        },
                        {
                            "date": "2025-12-16",
                            "measured": 62.0
                        },
                        {
                            "date": "2025-12-17",
                            "measured": 70.0
                        },
                        {
                            "date": "2025-12-18",
                            "measured": 49.0
                        },
                        {
                            "date": "2025-12-19",
                            "measured": 43.0
                        },
                        {
                            "date": "2025-12-20",
                            "measured": 44.0
                        }
                    ]
                },
                {
                    "kpi_key": "vehicle_cap",
                    "granularity": "day",
                    "values": [
                        {
                            "date": "2025-09-16",
                            "measured": 123.0
                        },
                        {
                            "date": "2025-09-17",
                            "measured": 124.0
                        },
                        {
                            "date": "2025-09-18",
                            "measured": 122.0
                        },
                        {
                            "date": "2025-09-19",
                            "measured": 121.0
                        },
                        {
                            "date": "2025-09-20",
                            "measured": 120.0
                        },
                        {
                            "date": "2025-09-21",
                            "measured": 119.0
                        },
                        {
                            "date": "2025-09-22",
                            "measured": 121.0
                        },
                        {
                            "date": "2025-09-23",
                            "measured": 119.0
                        },
                        {
                            "date": "2025-09-24",
                            "measured": 119.0
                        },
                        {
                            "date": "2025-09-25",
                            "measured": 120.0
                        },
                        {
                            "date": "2025-09-26",
                            "measured": 122.0
                        },
                        {
                            "date": "2025-09-27",
                            "measured": 121.0
                        },
                        {
                            "date": "2025-09-28",
                            "measured": 120.0
                        },
                        {
                            "date": "2025-09-29",
                            "measured": 120.0
                        },
                        {
                            "date": "2025-09-30",
                            "measured": 120.0
                        },
                        {
                            "date": "2025-10-01",
                            "measured": 119.0
                        },
                        {
                            "date": "2025-10-02",
                            "measured": 120.0
                        },
                        {
                            "date": "2025-10-03",
                            "measured": 120.0
                        },
                        {
                            "date": "2025-10-04",
                            "measured": 121.0
                        },
                        {
                            "date": "2025-10-05",
                            "measured": 121.0
                        },
                        {
                            "date": "2025-10-06",
                            "measured": 122.0
                        },
                        {
                            "date": "2025-10-07",
                            "measured": 119.0
                        },
                        {
                            "date": "2025-10-08",
                            "measured": 119.0
                        },
                        {
                            "date": "2025-10-09",
                            "measured": 121.0
                        },
                        {
                            "date": "2025-10-10",
                            "measured": 119.0
                        },
                        {
                            "date": "2025-10-11",
                            "measured": 119.0
                        },
                        {
                            "date": "2025-10-12",
                            "measured": 119.0
                        },
                        {
                            "date": "2025-10-13",
                            "measured": 118.0
                        },
                        {
                            "date": "2025-10-14",
                            "measured": 120.0
                        },
                        {
                            "date": "2025-10-15",
                            "measured": 121.0
                        },
                        {
                            "date": "2025-10-16",
                            "measured": 121.0
                        },
                        {
                            "date": "2025-10-17",
                            "measured": 123.0
                        },
                        {
                            "date": "2025-10-18",
                            "measured": 122.0
                        },
                        {
                            "date": "2025-10-19",
                            "measured": 120.0
                        },
                        {
                            "date": "2025-10-20",
                            "measured": 121.0
                        },
                        {
                            "date": "2025-10-21",
                            "measured": 121.0
                        },
                        {
                            "date": "2025-10-22",
                            "measured": 121.0
                        },
                        {
                            "date": "2025-10-23",
                            "measured": 124.0
                        },
                        {
                            "date": "2025-10-24",
                            "measured": 125.0
                        },
                        {
                            "date": "2025-10-25",
                            "measured": 123.0
                        },
                        {
                            "date": "2025-10-26",
                            "measured": 126.0
                        },
                        {
                            "date": "2025-10-27",
                            "measured": 129.0
                        },
                        {
                            "date": "2025-10-28",
                            "measured": 129.0
                        },
                        {
                            "date": "2025-10-29",
                            "measured": 128.0
                        },
                        {
                            "date": "2025-10-30",
                            "measured": 129.0
                        },
                        {
                            "date": "2025-10-31",
                            "measured": 128.0
                        },
                        {
                            "date": "2025-11-01",
                            "measured": 130.0
                        },
                        {
                            "date": "2025-11-02",
                            "measured": 129.0
                        },
                        {
                            "date": "2025-11-03",
                            "measured": 130.0
                        },
                        {
                            "date": "2025-11-04",
                            "measured": 129.0
                        },
                        {
                            "date": "2025-11-05",
                            "measured": 129.0
                        },
                        {
                            "date": "2025-11-06",
                            "measured": 126.0
                        },
                        {
                            "date": "2025-11-07",
                            "measured": 130.0
                        },
                        {
                            "date": "2025-11-08",
                            "measured": 127.0
                        },
                        {
                            "date": "2025-11-09",
                            "measured": 122.0
                        },
                        {
                            "date": "2025-11-10",
                            "measured": 127.0
                        },
                        {
                            "date": "2025-11-11",
                            "measured": 128.0
                        },
                        {
                            "date": "2025-11-12",
                            "measured": 129.0
                        },
                        {
                            "date": "2025-11-13",
                            "measured": 130.0
                        },
                        {
                            "date": "2025-11-14",
                            "measured": 129.0
                        },
                        {
                            "date": "2025-11-15",
                            "measured": 129.0
                        },
                        {
                            "date": "2025-11-16",
                            "measured": 128.0
                        },
                        {
                            "date": "2025-11-17",
                            "measured": 129.0
                        },
                        {
                            "date": "2025-11-18",
                            "measured": 128.0
                        },
                        {
                            "date": "2025-11-19",
                            "measured": 128.0
                        },
                        {
                            "date": "2025-11-20",
                            "measured": 128.0
                        },
                        {
                            "date": "2025-11-21",
                            "measured": 129.0
                        },
                        {
                            "date": "2025-11-22",
                            "measured": 128.0
                        },
                        {
                            "date": "2025-11-23",
                            "measured": 129.0
                        },
                        {
                            "date": "2025-11-24",
                            "measured": 129.0
                        },
                        {
                            "date": "2025-11-25",
                            "measured": 129.0
                        },
                        {
                            "date": "2025-11-26",
                            "measured": 130.0
                        },
                        {
                            "date": "2025-11-27",
                            "measured": 128.0
                        },
                        {
                            "date": "2025-11-28",
                            "measured": 129.0
                        },
                        {
                            "date": "2025-11-29",
                            "measured": 128.0
                        },
                        {
                            "date": "2025-11-30",
                            "measured": 130.0
                        },
                        {
                            "date": "2025-12-01",
                            "measured": 130.0
                        },
                        {
                            "date": "2025-12-02",
                            "measured": 130.0
                        },
                        {
                            "date": "2025-12-03",
                            "measured": 130.0
                        },
                        {
                            "date": "2025-12-04",
                            "measured": 132.0
                        },
                        {
                            "date": "2025-12-05",
                            "measured": 127.0
                        },
                        {
                            "date": "2025-12-06",
                            "measured": 127.0
                        },
                        {
                            "date": "2025-12-07",
                            "measured": 128.0
                        },
                        {
                            "date": "2025-12-08",
                            "measured": 130.0
                        },
                        {
                            "date": "2025-12-09",
                            "measured": 130.0
                        },
                        {
                            "date": "2025-12-10",
                            "measured": 132.0
                        },
                        {
                            "date": "2025-12-11",
                            "measured": 130.0
                        },
                        {
                            "date": "2025-12-12",
                            "measured": 127.0
                        },
                        {
                            "date": "2025-12-13",
                            "measured": 131.0
                        },
                        {
                            "date": "2025-12-14",
                            "measured": 130.0
                        },
                        {
                            "date": "2025-12-15",
                            "measured": 131.0
                        },
                        {
                            "date": "2025-12-16",
                            "measured": 131.0
                        },
                        {
                            "date": "2025-12-17",
                            "measured": 130.0
                        },
                        {
                            "date": "2025-12-18",
                            "measured": 132.0
                        },
                        {
                            "date": "2025-12-19",
                            "measured": 132.0
                        },
                        {
                            "date": "2025-12-20",
                            "measured": 131.0
                        }
                    ]
                },
                {
                    "kpi_key": "percentage_parked_longer_then_24_hours",
                    "granularity": "day",
                    "values": [
                        {
                            "date": "2025-09-16",
                            "measured": 58.5
                        },
                        {
                            "date": "2025-09-17",
                            "measured": 55.6
                        },
                        {
                            "date": "2025-09-18",
                            "measured": 52.5
                        },
                        {
                            "date": "2025-09-19",
                            "measured": 43.8
                        },
                        {
                            "date": "2025-09-20",
                            "measured": 34.2
                        },
                        {
                            "date": "2025-09-21",
                            "measured": 39.3
                        },
                        {
                            "date": "2025-09-22",
                            "measured": 38.0
                        },
                        {
                            "date": "2025-09-23",
                            "measured": 55.5
                        },
                        {
                            "date": "2025-09-24",
                            "measured": 51.3
                        },
                        {
                            "date": "2025-09-25",
                            "measured": 40.0
                        },
                        {
                            "date": "2025-09-26",
                            "measured": 51.6
                        },
                        {
                            "date": "2025-09-27",
                            "measured": 35.5
                        },
                        {
                            "date": "2025-09-28",
                            "measured": 35.6
                        },
                        {
                            "date": "2025-09-29",
                            "measured": 34.2
                        },
                        {
                            "date": "2025-09-30",
                            "measured": 55.0
                        },
                        {
                            "date": "2025-10-01",
                            "measured": 45.4
                        },
                        {
                            "date": "2025-10-02",
                            "measured": 39.2
                        },
                        {
                            "date": "2025-10-03",
                            "measured": 37.8
                        },
                        {
                            "date": "2025-10-04",
                            "measured": 45.8
                        },
                        {
                            "date": "2025-10-05",
                            "measured": 51.2
                        },
                        {
                            "date": "2025-10-06",
                            "measured": 63.9
                        },
                        {
                            "date": "2025-10-07",
                            "measured": 58.5
                        },
                        {
                            "date": "2025-10-08",
                            "measured": 50.0
                        },
                        {
                            "date": "2025-10-09",
                            "measured": 40.0
                        },
                        {
                            "date": "2025-10-10",
                            "measured": 49.2
                        },
                        {
                            "date": "2025-10-11",
                            "measured": 31.4
                        },
                        {
                            "date": "2025-10-12",
                            "measured": 41.4
                        },
                        {
                            "date": "2025-10-13",
                            "measured": 35.6
                        },
                        {
                            "date": "2025-10-14",
                            "measured": 46.2
                        },
                        {
                            "date": "2025-10-15",
                            "measured": 50.0
                        },
                        {
                            "date": "2025-10-16",
                            "measured": 41.7
                        },
                        {
                            "date": "2025-10-17",
                            "measured": 52.0
                        },
                        {
                            "date": "2025-10-18",
                            "measured": 41.3
                        },
                        {
                            "date": "2025-10-19",
                            "measured": 35.8
                        },
                        {
                            "date": "2025-10-20",
                            "measured": 50.0
                        },
                        {
                            "date": "2025-10-21",
                            "measured": 52.9
                        },
                        {
                            "date": "2025-10-22",
                            "measured": 53.7
                        },
                        {
                            "date": "2025-10-23",
                            "measured": 46.3
                        },
                        {
                            "date": "2025-10-24",
                            "measured": 59.2
                        },
                        {
                            "date": "2025-10-25",
                            "measured": 36.9
                        },
                        {
                            "date": "2025-10-26",
                            "measured": 58.7
                        },
                        {
                            "date": "2025-10-27",
                            "measured": 55.1
                        },
                        {
                            "date": "2025-10-28",
                            "measured": 68.8
                        },
                        {
                            "date": "2025-10-29",
                            "measured": 57.8
                        },
                        {
                            "date": "2025-10-30",
                            "measured": 48.1
                        },
                        {
                            "date": "2025-10-31",
                            "measured": 48.4
                        },
                        {
                            "date": "2025-11-01",
                            "measured": 41.4
                        },
                        {
                            "date": "2025-11-02",
                            "measured": 46.5
                        },
                        {
                            "date": "2025-11-03",
                            "measured": 54.6
                        },
                        {
                            "date": "2025-11-04",
                            "measured": 53.5
                        },
                        {
                            "date": "2025-11-05",
                            "measured": 56.6
                        },
                        {
                            "date": "2025-11-06",
                            "measured": 47.6
                        },
                        {
                            "date": "2025-11-07",
                            "measured": 47.3
                        },
                        {
                            "date": "2025-11-08",
                            "measured": 46.0
                        },
                        {
                            "date": "2025-11-09",
                            "measured": 32.2
                        },
                        {
                            "date": "2025-11-10",
                            "measured": 40.9
                        },
                        {
                            "date": "2025-11-11",
                            "measured": 54.7
                        },
                        {
                            "date": "2025-11-12",
                            "measured": 48.8
                        },
                        {
                            "date": "2025-11-13",
                            "measured": 46.9
                        },
                        {
                            "date": "2025-11-14",
                            "measured": 61.2
                        },
                        {
                            "date": "2025-11-15",
                            "measured": 56.6
                        },
                        {
                            "date": "2025-11-16",
                            "measured": 39.8
                        },
                        {
                            "date": "2025-11-17",
                            "measured": 48.4
                        },
                        {
                            "date": "2025-11-18",
                            "measured": 68.5
                        },
                        {
                            "date": "2025-11-19",
                            "measured": 59.4
                        },
                        {
                            "date": "2025-11-20",
                            "measured": 63.3
                        },
                        {
                            "date": "2025-11-21",
                            "measured": 64.0
                        },
                        {
                            "date": "2025-11-22",
                            "measured": 55.5
                        },
                        {
                            "date": "2025-11-23",
                            "measured": 47.3
                        },
                        {
                            "date": "2025-11-24",
                            "measured": 74.4
                        },
                        {
                            "date": "2025-11-25",
                            "measured": 64.3
                        },
                        {
                            "date": "2025-11-26",
                            "measured": 51.2
                        },
                        {
                            "date": "2025-11-27",
                            "measured": 46.9
                        },
                        {
                            "date": "2025-11-28",
                            "measured": 61.2
                        },
                        {
                            "date": "2025-11-29",
                            "measured": 50.4
                        },
                        {
                            "date": "2025-11-30",
                            "measured": 44.6
                        },
                        {
                            "date": "2025-12-01",
                            "measured": 56.7
                        },
                        {
                            "date": "2025-12-02",
                            "measured": 60.8
                        },
                        {
                            "date": "2025-12-03",
                            "measured": 53.1
                        },
                        {
                            "date": "2025-12-04",
                            "measured": 45.5
                        },
                        {
                            "date": "2025-12-05",
                            "measured": 49.2
                        },
                        {
                            "date": "2025-12-06",
                            "measured": 58.3
                        },
                        {
                            "date": "2025-12-07",
                            "measured": 50.8
                        },
                        {
                            "date": "2025-12-08",
                            "measured": 52.3
                        },
                        {
                            "date": "2025-12-09",
                            "measured": 51.9
                        },
                        {
                            "date": "2025-12-10",
                            "measured": 53.0
                        },
                        {
                            "date": "2025-12-11",
                            "measured": 48.5
                        },
                        {
                            "date": "2025-12-12",
                            "measured": 58.3
                        },
                        {
                            "date": "2025-12-13",
                            "measured": 43.8
                        },
                        {
                            "date": "2025-12-14",
                            "measured": 38.0
                        },
                        {
                            "date": "2025-12-15",
                            "measured": 46.9
                        },
                        {
                            "date": "2025-12-16",
                            "measured": 54.2
                        },
                        {
                            "date": "2025-12-17",
                            "measured": 59.2
                        },
                        {
                            "date": "2025-12-18",
                            "measured": 50.0
                        },
                        {
                            "date": "2025-12-19",
                            "measured": 52.7
                        },
                        {
                            "date": "2025-12-20",
                            "measured": 48.9
                        }
                    ]
                },
                {
                    "kpi_key": "percentage_parked_longer_then_3_days",
                    "granularity": "day",
                    "values": [
                        {
                            "date": "2025-09-16",
                            "measured": 16.3
                        },
                        {
                            "date": "2025-09-17",
                            "measured": 24.2
                        },
                        {
                            "date": "2025-09-18",
                            "measured": 27.0
                        },
                        {
                            "date": "2025-09-19",
                            "measured": 22.3
                        },
                        {
                            "date": "2025-09-20",
                            "measured": 16.7
                        },
                        {
                            "date": "2025-09-21",
                            "measured": 12.0
                        },
                        {
                            "date": "2025-09-22",
                            "measured": 9.1
                        },
                        {
                            "date": "2025-09-23",
                            "measured": 12.6
                        },
                        {
                            "date": "2025-09-24",
                            "measured": 22.7
                        },
                        {
                            "date": "2025-09-25",
                            "measured": 21.7
                        },
                        {
                            "date": "2025-09-26",
                            "measured": 19.7
                        },
                        {
                            "date": "2025-09-27",
                            "measured": 19.8
                        },
                        {
                            "date": "2025-09-28",
                            "measured": 16.1
                        },
                        {
                            "date": "2025-09-29",
                            "measured": 10.8
                        },
                        {
                            "date": "2025-09-30",
                            "measured": 16.7
                        },
                        {
                            "date": "2025-10-01",
                            "measured": 16.0
                        },
                        {
                            "date": "2025-10-02",
                            "measured": 20.8
                        },
                        {
                            "date": "2025-10-03",
                            "measured": 11.8
                        },
                        {
                            "date": "2025-10-04",
                            "measured": 13.3
                        },
                        {
                            "date": "2025-10-05",
                            "measured": 15.7
                        },
                        {
                            "date": "2025-10-06",
                            "measured": 26.2
                        },
                        {
                            "date": "2025-10-07",
                            "measured": 33.9
                        },
                        {
                            "date": "2025-10-08",
                            "measured": 29.7
                        },
                        {
                            "date": "2025-10-09",
                            "measured": 14.2
                        },
                        {
                            "date": "2025-10-10",
                            "measured": 9.3
                        },
                        {
                            "date": "2025-10-11",
                            "measured": 11.9
                        },
                        {
                            "date": "2025-10-12",
                            "measured": 12.1
                        },
                        {
                            "date": "2025-10-13",
                            "measured": 9.3
                        },
                        {
                            "date": "2025-10-14",
                            "measured": 10.9
                        },
                        {
                            "date": "2025-10-15",
                            "measured": 17.5
                        },
                        {
                            "date": "2025-10-16",
                            "measured": 22.5
                        },
                        {
                            "date": "2025-10-17",
                            "measured": 22.0
                        },
                        {
                            "date": "2025-10-18",
                            "measured": 17.4
                        },
                        {
                            "date": "2025-10-19",
                            "measured": 18.3
                        },
                        {
                            "date": "2025-10-20",
                            "measured": 15.8
                        },
                        {
                            "date": "2025-10-21",
                            "measured": 16.8
                        },
                        {
                            "date": "2025-10-22",
                            "measured": 23.1
                        },
                        {
                            "date": "2025-10-23",
                            "measured": 24.0
                        },
                        {
                            "date": "2025-10-24",
                            "measured": 20.0
                        },
                        {
                            "date": "2025-10-25",
                            "measured": 17.2
                        },
                        {
                            "date": "2025-10-26",
                            "measured": 18.3
                        },
                        {
                            "date": "2025-10-27",
                            "measured": 16.5
                        },
                        {
                            "date": "2025-10-28",
                            "measured": 24.2
                        },
                        {
                            "date": "2025-10-29",
                            "measured": 27.3
                        },
                        {
                            "date": "2025-10-30",
                            "measured": 30.2
                        },
                        {
                            "date": "2025-10-31",
                            "measured": 20.3
                        },
                        {
                            "date": "2025-11-01",
                            "measured": 16.4
                        },
                        {
                            "date": "2025-11-02",
                            "measured": 15.5
                        },
                        {
                            "date": "2025-11-03",
                            "measured": 11.5
                        },
                        {
                            "date": "2025-11-04",
                            "measured": 14.0
                        },
                        {
                            "date": "2025-11-05",
                            "measured": 20.9
                        },
                        {
                            "date": "2025-11-06",
                            "measured": 23.4
                        },
                        {
                            "date": "2025-11-07",
                            "measured": 20.2
                        },
                        {
                            "date": "2025-11-08",
                            "measured": 18.3
                        },
                        {
                            "date": "2025-11-09",
                            "measured": 17.4
                        },
                        {
                            "date": "2025-11-10",
                            "measured": 15.7
                        },
                        {
                            "date": "2025-11-11",
                            "measured": 10.9
                        },
                        {
                            "date": "2025-11-12",
                            "measured": 17.8
                        },
                        {
                            "date": "2025-11-13",
                            "measured": 18.5
                        },
                        {
                            "date": "2025-11-14",
                            "measured": 18.6
                        },
                        {
                            "date": "2025-11-15",
                            "measured": 25.6
                        },
                        {
                            "date": "2025-11-16",
                            "measured": 22.7
                        },
                        {
                            "date": "2025-11-17",
                            "measured": 19.5
                        },
                        {
                            "date": "2025-11-18",
                            "measured": 18.9
                        },
                        {
                            "date": "2025-11-19",
                            "measured": 26.6
                        },
                        {
                            "date": "2025-11-20",
                            "measured": 32.8
                        },
                        {
                            "date": "2025-11-21",
                            "measured": 32.8
                        },
                        {
                            "date": "2025-11-22",
                            "measured": 29.7
                        },
                        {
                            "date": "2025-11-23",
                            "measured": 25.6
                        },
                        {
                            "date": "2025-11-24",
                            "measured": 27.1
                        },
                        {
                            "date": "2025-11-25",
                            "measured": 31.0
                        },
                        {
                            "date": "2025-11-26",
                            "measured": 31.0
                        },
                        {
                            "date": "2025-11-27",
                            "measured": 22.7
                        },
                        {
                            "date": "2025-11-28",
                            "measured": 26.4
                        },
                        {
                            "date": "2025-11-29",
                            "measured": 24.0
                        },
                        {
                            "date": "2025-11-30",
                            "measured": 24.6
                        },
                        {
                            "date": "2025-12-01",
                            "measured": 24.4
                        },
                        {
                            "date": "2025-12-02",
                            "measured": 23.8
                        },
                        {
                            "date": "2025-12-03",
                            "measured": 30.5
                        },
                        {
                            "date": "2025-12-04",
                            "measured": 28.8
                        },
                        {
                            "date": "2025-12-05",
                            "measured": 19.8
                        },
                        {
                            "date": "2025-12-06",
                            "measured": 16.5
                        },
                        {
                            "date": "2025-12-07",
                            "measured": 22.2
                        },
                        {
                            "date": "2025-12-08",
                            "measured": 20.8
                        },
                        {
                            "date": "2025-12-09",
                            "measured": 20.2
                        },
                        {
                            "date": "2025-12-10",
                            "measured": 20.5
                        },
                        {
                            "date": "2025-12-11",
                            "measured": 27.7
                        },
                        {
                            "date": "2025-12-12",
                            "measured": 23.6
                        },
                        {
                            "date": "2025-12-13",
                            "measured": 20.0
                        },
                        {
                            "date": "2025-12-14",
                            "measured": 16.3
                        },
                        {
                            "date": "2025-12-15",
                            "measured": 17.7
                        },
                        {
                            "date": "2025-12-16",
                            "measured": 22.1
                        },
                        {
                            "date": "2025-12-17",
                            "measured": 26.2
                        },
                        {
                            "date": "2025-12-18",
                            "measured": 24.2
                        },
                        {
                            "date": "2025-12-19",
                            "measured": 26.0
                        },
                        {
                            "date": "2025-12-20",
                            "measured": 22.9
                        }
                    ]
                },
                {
                    "kpi_key": "percentage_parked_longer_then_7_days",
                    "granularity": "day",
                    "values": [
                        {
                            "date": "2025-09-16",
                            "measured": 3.3
                        },
                        {
                            "date": "2025-09-17",
                            "measured": 3.2
                        },
                        {
                            "date": "2025-09-18",
                            "measured": 6.6
                        },
                        {
                            "date": "2025-09-19",
                            "measured": 4.1
                        },
                        {
                            "date": "2025-09-20",
                            "measured": 5.0
                        },
                        {
                            "date": "2025-09-21",
                            "measured": 6.8
                        },
                        {
                            "date": "2025-09-22",
                            "measured": 4.1
                        },
                        {
                            "date": "2025-09-23",
                            "measured": 2.5
                        },
                        {
                            "date": "2025-09-24",
                            "measured": 3.4
                        },
                        {
                            "date": "2025-09-25",
                            "measured": 2.5
                        },
                        {
                            "date": "2025-09-26",
                            "measured": 2.5
                        },
                        {
                            "date": "2025-09-27",
                            "measured": 5.8
                        },
                        {
                            "date": "2025-09-28",
                            "measured": 5.9
                        },
                        {
                            "date": "2025-09-29",
                            "measured": 4.2
                        },
                        {
                            "date": "2025-09-30",
                            "measured": 4.2
                        },
                        {
                            "date": "2025-10-01",
                            "measured": 4.2
                        },
                        {
                            "date": "2025-10-02",
                            "measured": 5.0
                        },
                        {
                            "date": "2025-10-03",
                            "measured": 3.4
                        },
                        {
                            "date": "2025-10-04",
                            "measured": 4.2
                        },
                        {
                            "date": "2025-10-05",
                            "measured": 5.0
                        },
                        {
                            "date": "2025-10-06",
                            "measured": 6.6
                        },
                        {
                            "date": "2025-10-07",
                            "measured": 6.8
                        },
                        {
                            "date": "2025-10-08",
                            "measured": 8.5
                        },
                        {
                            "date": "2025-10-09",
                            "measured": 1.7
                        },
                        {
                            "date": "2025-10-10",
                            "measured": 0.8
                        },
                        {
                            "date": "2025-10-11",
                            "measured": 1.7
                        },
                        {
                            "date": "2025-10-12",
                            "measured": 1.7
                        },
                        {
                            "date": "2025-10-13",
                            "measured": 1.7
                        },
                        {
                            "date": "2025-10-14",
                            "measured": 2.5
                        },
                        {
                            "date": "2025-10-15",
                            "measured": 3.3
                        },
                        {
                            "date": "2025-10-16",
                            "measured": 3.3
                        },
                        {
                            "date": "2025-10-17",
                            "measured": 3.3
                        },
                        {
                            "date": "2025-10-18",
                            "measured": 3.3
                        },
                        {
                            "date": "2025-10-19",
                            "measured": 6.7
                        },
                        {
                            "date": "2025-10-20",
                            "measured": 8.3
                        },
                        {
                            "date": "2025-10-21",
                            "measured": 6.7
                        },
                        {
                            "date": "2025-10-22",
                            "measured": 5.8
                        },
                        {
                            "date": "2025-10-23",
                            "measured": 6.6
                        },
                        {
                            "date": "2025-10-24",
                            "measured": 1.6
                        },
                        {
                            "date": "2025-10-25",
                            "measured": 1.6
                        },
                        {
                            "date": "2025-10-26",
                            "measured": 4.8
                        },
                        {
                            "date": "2025-10-27",
                            "measured": 0.8
                        },
                        {
                            "date": "2025-10-28",
                            "measured": 3.9
                        },
                        {
                            "date": "2025-10-29",
                            "measured": 5.5
                        },
                        {
                            "date": "2025-10-30",
                            "measured": 3.1
                        },
                        {
                            "date": "2025-10-31",
                            "measured": 1.6
                        },
                        {
                            "date": "2025-11-01",
                            "measured": 4.7
                        },
                        {
                            "date": "2025-11-02",
                            "measured": 3.1
                        },
                        {
                            "date": "2025-11-03",
                            "measured": 3.8
                        },
                        {
                            "date": "2025-11-04",
                            "measured": 3.9
                        },
                        {
                            "date": "2025-11-05",
                            "measured": 3.1
                        },
                        {
                            "date": "2025-11-06",
                            "measured": 5.6
                        },
                        {
                            "date": "2025-11-07",
                            "measured": 4.7
                        },
                        {
                            "date": "2025-11-08",
                            "measured": 6.3
                        },
                        {
                            "date": "2025-11-09",
                            "measured": 9.9
                        },
                        {
                            "date": "2025-11-10",
                            "measured": 9.4
                        },
                        {
                            "date": "2025-11-11",
                            "measured": 6.3
                        },
                        {
                            "date": "2025-11-12",
                            "measured": 5.4
                        },
                        {
                            "date": "2025-11-13",
                            "measured": 5.4
                        },
                        {
                            "date": "2025-11-14",
                            "measured": 3.9
                        },
                        {
                            "date": "2025-11-15",
                            "measured": 4.7
                        },
                        {
                            "date": "2025-11-16",
                            "measured": 4.7
                        },
                        {
                            "date": "2025-11-17",
                            "measured": 5.5
                        },
                        {
                            "date": "2025-11-18",
                            "measured": 6.3
                        },
                        {
                            "date": "2025-11-19",
                            "measured": 7.0
                        },
                        {
                            "date": "2025-11-20",
                            "measured": 10.2
                        },
                        {
                            "date": "2025-11-21",
                            "measured": 9.6
                        },
                        {
                            "date": "2025-11-22",
                            "measured": 10.2
                        },
                        {
                            "date": "2025-11-23",
                            "measured": 11.6
                        },
                        {
                            "date": "2025-11-24",
                            "measured": 11.6
                        },
                        {
                            "date": "2025-11-25",
                            "measured": 12.4
                        },
                        {
                            "date": "2025-11-26",
                            "measured": 10.1
                        },
                        {
                            "date": "2025-11-27",
                            "measured": 10.2
                        },
                        {
                            "date": "2025-11-28",
                            "measured": 12.4
                        },
                        {
                            "date": "2025-11-29",
                            "measured": 12.8
                        },
                        {
                            "date": "2025-11-30",
                            "measured": 10.8
                        },
                        {
                            "date": "2025-12-01",
                            "measured": 10.2
                        },
                        {
                            "date": "2025-12-02",
                            "measured": 10.0
                        },
                        {
                            "date": "2025-12-03",
                            "measured": 9.4
                        },
                        {
                            "date": "2025-12-04",
                            "measured": 9.8
                        },
                        {
                            "date": "2025-12-05",
                            "measured": 7.1
                        },
                        {
                            "date": "2025-12-06",
                            "measured": 7.1
                        },
                        {
                            "date": "2025-12-07",
                            "measured": 9.5
                        },
                        {
                            "date": "2025-12-08",
                            "measured": 7.7
                        },
                        {
                            "date": "2025-12-09",
                            "measured": 7.0
                        },
                        {
                            "date": "2025-12-10",
                            "measured": 7.6
                        },
                        {
                            "date": "2025-12-11",
                            "measured": 7.7
                        },
                        {
                            "date": "2025-12-12",
                            "measured": 8.7
                        },
                        {
                            "date": "2025-12-13",
                            "measured": 7.7
                        },
                        {
                            "date": "2025-12-14",
                            "measured": 6.2
                        },
                        {
                            "date": "2025-12-15",
                            "measured": 6.9
                        },
                        {
                            "date": "2025-12-16",
                            "measured": 7.6
                        },
                        {
                            "date": "2025-12-17",
                            "measured": 6.9
                        },
                        {
                            "date": "2025-12-18",
                            "measured": 5.3
                        },
                        {
                            "date": "2025-12-19",
                            "measured": 6.9
                        },
                        {
                            "date": "2025-12-20",
                            "measured": 9.2
                        }
                    ]
                },
                {
                    "kpi_key": "percentage_parked_longer_then_14_days",
                    "granularity": "day",
                    "values": [
                        {
                            "date": "2025-09-16",
                            "measured": 0.8
                        },
                        {
                            "date": "2025-09-17",
                            "measured": 0.8
                        },
                        {
                            "date": "2025-09-18",
                            "measured": 0.8
                        },
                        {
                            "date": "2025-09-19",
                            "measured": 0.8
                        },
                        {
                            "date": "2025-09-20",
                            "measured": 0.8
                        },
                        {
                            "date": "2025-09-21",
                            "measured": 1.7
                        },
                        {
                            "date": "2025-09-22",
                            "measured": 0.8
                        },
                        {
                            "date": "2025-09-23",
                            "measured": 0.8
                        },
                        {
                            "date": "2025-09-24",
                            "measured": 0.8
                        },
                        {
                            "date": "2025-09-25",
                            "measured": 1.7
                        },
                        {
                            "date": "2025-09-26",
                            "measured": 1.6
                        },
                        {
                            "date": "2025-09-27",
                            "measured": 1.7
                        },
                        {
                            "date": "2025-09-28",
                            "measured": 0.8
                        },
                        {
                            "date": "2025-09-29",
                            "measured": 0.8
                        },
                        {
                            "date": "2025-09-30",
                            "measured": 0.8
                        },
                        {
                            "date": "2025-10-01",
                            "measured": 0.8
                        },
                        {
                            "date": "2025-10-02",
                            "measured": 0.8
                        },
                        {
                            "date": "2025-10-03",
                            "measured": 0.8
                        },
                        {
                            "date": "2025-10-04",
                            "measured": 0.8
                        },
                        {
                            "date": "2025-10-05",
                            "measured": 0.8
                        },
                        {
                            "date": "2025-10-06",
                            "measured": 0.8
                        },
                        {
                            "date": "2025-10-07",
                            "measured": 1.7
                        },
                        {
                            "date": "2025-10-08",
                            "measured": 1.7
                        },
                        {
                            "date": "2025-10-09",
                            "measured": 0.8
                        },
                        {
                            "date": "2025-10-10",
                            "measured": 0.8
                        },
                        {
                            "date": "2025-10-11",
                            "measured": 0.8
                        },
                        {
                            "date": "2025-10-12",
                            "measured": 0.9
                        },
                        {
                            "date": "2025-10-13",
                            "measured": 0.8
                        },
                        {
                            "date": "2025-10-14",
                            "measured": 0.8
                        },
                        {
                            "date": "2025-10-15",
                            "measured": 0.8
                        },
                        {
                            "date": "2025-10-16",
                            "measured": 0.8
                        },
                        {
                            "date": "2025-10-17",
                            "measured": 0.8
                        },
                        {
                            "date": "2025-10-18",
                            "measured": 0.8
                        },
                        {
                            "date": "2025-10-19",
                            "measured": 0.8
                        },
                        {
                            "date": "2025-10-20",
                            "measured": 0.8
                        },
                        {
                            "date": "2025-10-21",
                            "measured": 0.8
                        },
                        {
                            "date": "2025-10-22",
                            "measured": 0.8
                        },
                        {
                            "date": "2025-10-23",
                            "measured": 1.7
                        },
                        {
                            "date": "2025-10-24",
                            "measured": 0.8
                        },
                        {
                            "date": "2025-10-25",
                            "measured": 0.8
                        },
                        {
                            "date": "2025-10-26",
                            "measured": 0.8
                        },
                        {
                            "date": "2025-10-27",
                            "measured": 0.8
                        },
                        {
                            "date": "2025-10-28",
                            "measured": 0.8
                        },
                        {
                            "date": "2025-10-29",
                            "measured": 0.8
                        },
                        {
                            "date": "2025-10-30",
                            "measured": 0.8
                        },
                        {
                            "date": "2025-10-31",
                            "measured": 0.8
                        },
                        {
                            "date": "2025-11-01",
                            "measured": 0.8
                        },
                        {
                            "date": "2025-11-02",
                            "measured": 0.8
                        },
                        {
                            "date": "2025-11-03",
                            "measured": 0.8
                        },
                        {
                            "date": "2025-11-04",
                            "measured": 0.8
                        },
                        {
                            "date": "2025-11-05",
                            "measured": 0.8
                        },
                        {
                            "date": "2025-11-06",
                            "measured": 0.8
                        },
                        {
                            "date": "2025-11-07",
                            "measured": 0.8
                        },
                        {
                            "date": "2025-11-08",
                            "measured": 1.6
                        },
                        {
                            "date": "2025-11-09",
                            "measured": 1.7
                        },
                        {
                            "date": "2025-11-10",
                            "measured": 2.4
                        },
                        {
                            "date": "2025-11-11",
                            "measured": 2.3
                        },
                        {
                            "date": "2025-11-12",
                            "measured": 1.6
                        },
                        {
                            "date": "2025-11-13",
                            "measured": 1.5
                        },
                        {
                            "date": "2025-11-14",
                            "measured": 0.8
                        },
                        {
                            "date": "2025-11-15",
                            "measured": 0.8
                        },
                        {
                            "date": "2025-11-16",
                            "measured": 1.6
                        },
                        {
                            "date": "2025-11-17",
                            "measured": 0.8
                        },
                        {
                            "date": "2025-11-18",
                            "measured": 0.8
                        },
                        {
                            "date": "2025-11-19",
                            "measured": 0.8
                        },
                        {
                            "date": "2025-11-20",
                            "measured": 1.6
                        },
                        {
                            "date": "2025-11-21",
                            "measured": 1.6
                        },
                        {
                            "date": "2025-11-22",
                            "measured": 2.3
                        },
                        {
                            "date": "2025-11-23",
                            "measured": 3.1
                        },
                        {
                            "date": "2025-11-24",
                            "measured": 2.3
                        },
                        {
                            "date": "2025-11-25",
                            "measured": 3.1
                        },
                        {
                            "date": "2025-11-26",
                            "measured": 3.1
                        },
                        {
                            "date": "2025-11-27",
                            "measured": 3.1
                        },
                        {
                            "date": "2025-11-28",
                            "measured": 3.1
                        },
                        {
                            "date": "2025-11-29",
                            "measured": 2.4
                        },
                        {
                            "date": "2025-11-30",
                            "measured": 3.1
                        },
                        {
                            "date": "2025-12-01",
                            "measured": 3.9
                        },
                        {
                            "date": "2025-12-02",
                            "measured": 5.4
                        },
                        {
                            "date": "2025-12-03",
                            "measured": 4.7
                        },
                        {
                            "date": "2025-12-04",
                            "measured": 4.5
                        },
                        {
                            "date": "2025-12-05",
                            "measured": 4.0
                        },
                        {
                            "date": "2025-12-06",
                            "measured": 3.1
                        },
                        {
                            "date": "2025-12-07",
                            "measured": 3.2
                        },
                        {
                            "date": "2025-12-08",
                            "measured": 2.3
                        },
                        {
                            "date": "2025-12-09",
                            "measured": 2.3
                        },
                        {
                            "date": "2025-12-10",
                            "measured": 2.3
                        },
                        {
                            "date": "2025-12-11",
                            "measured": 2.3
                        },
                        {
                            "date": "2025-12-12",
                            "measured": 2.4
                        },
                        {
                            "date": "2025-12-13",
                            "measured": 3.1
                        },
                        {
                            "date": "2025-12-14",
                            "measured": 3.1
                        },
                        {
                            "date": "2025-12-15",
                            "measured": 3.8
                        },
                        {
                            "date": "2025-12-16",
                            "measured": 3.8
                        },
                        {
                            "date": "2025-12-17",
                            "measured": 3.1
                        },
                        {
                            "date": "2025-12-18",
                            "measured": 2.3
                        },
                        {
                            "date": "2025-12-19",
                            "measured": 2.3
                        },
                        {
                            "date": "2025-12-20",
                            "measured": 2.3
                        }
                    ]
                }
            ]
        },
        {
            "operator": "check",
            "form_factor": "moped",
            "propulsion_type": "electric",
            "geometry_ref": "cbs:GM0599",
            "kpis": [
                {
                    "kpi_key": "number_of_wrongly_parked_vehicles",
                    "granularity": "day",
                    "values": [
                        {
                            "date": "2025-09-16",
                            "measured": 469.0
                        },
                        {
                            "date": "2025-09-17",
                            "measured": 461.0
                        },
                        {
                            "date": "2025-09-18",
                            "measured": 468.0
                        },
                        {
                            "date": "2025-09-19",
                            "measured": 551.0
                        },
                        {
                            "date": "2025-09-20",
                            "measured": 524.0
                        },
                        {
                            "date": "2025-09-21",
                            "measured": 393.0
                        },
                        {
                            "date": "2025-09-22",
                            "measured": 418.0
                        },
                        {
                            "date": "2025-09-23",
                            "measured": 541.0
                        },
                        {
                            "date": "2025-09-24",
                            "measured": 529.0
                        },
                        {
                            "date": "2025-09-25",
                            "measured": 436.0
                        },
                        {
                            "date": "2025-09-26",
                            "measured": 550.0
                        },
                        {
                            "date": "2025-09-27",
                            "measured": 666.0
                        },
                        {
                            "date": "2025-09-28",
                            "measured": 534.0
                        },
                        {
                            "date": "2025-09-29",
                            "measured": 439.0
                        },
                        {
                            "date": "2025-09-30",
                            "measured": 499.0
                        },
                        {
                            "date": "2025-10-01",
                            "measured": 461.0
                        },
                        {
                            "date": "2025-10-02",
                            "measured": 476.0
                        },
                        {
                            "date": "2025-10-03",
                            "measured": 524.0
                        },
                        {
                            "date": "2025-10-04",
                            "measured": 410.0
                        },
                        {
                            "date": "2025-10-05",
                            "measured": 307.0
                        },
                        {
                            "date": "2025-10-06",
                            "measured": 353.0
                        },
                        {
                            "date": "2025-10-08",
                            "measured": 408.0
                        },
                        {
                            "date": "2025-10-09",
                            "measured": 447.0
                        },
                        {
                            "date": "2025-10-10",
                            "measured": 499.0
                        },
                        {
                            "date": "2025-10-11",
                            "measured": 478.0
                        },
                        {
                            "date": "2025-10-12",
                            "measured": 361.0
                        },
                        {
                            "date": "2025-10-13",
                            "measured": 397.0
                        },
                        {
                            "date": "2025-10-14",
                            "measured": 365.0
                        },
                        {
                            "date": "2025-10-15",
                            "measured": 435.0
                        },
                        {
                            "date": "2025-10-16",
                            "measured": 393.0
                        },
                        {
                            "date": "2025-10-17",
                            "measured": 417.0
                        },
                        {
                            "date": "2025-10-18",
                            "measured": 479.0
                        },
                        {
                            "date": "2025-10-19",
                            "measured": 420.0
                        },
                        {
                            "date": "2025-10-20",
                            "measured": 355.0
                        },
                        {
                            "date": "2025-10-21",
                            "measured": 411.0
                        },
                        {
                            "date": "2025-10-22",
                            "measured": 433.0
                        },
                        {
                            "date": "2025-10-23",
                            "measured": 324.0
                        },
                        {
                            "date": "2025-10-24",
                            "measured": 408.0
                        },
                        {
                            "date": "2025-10-25",
                            "measured": 357.0
                        },
                        {
                            "date": "2025-10-26",
                            "measured": 411.0
                        },
                        {
                            "date": "2025-10-27",
                            "measured": 382.0
                        },
                        {
                            "date": "2025-10-28",
                            "measured": 368.0
                        },
                        {
                            "date": "2025-10-29",
                            "measured": 447.0
                        },
                        {
                            "date": "2025-10-30",
                            "measured": 396.0
                        },
                        {
                            "date": "2025-10-31",
                            "measured": 483.0
                        },
                        {
                            "date": "2025-11-01",
                            "measured": 495.0
                        },
                        {
                            "date": "2025-11-02",
                            "measured": 456.0
                        },
                        {
                            "date": "2025-11-03",
                            "measured": 420.0
                        },
                        {
                            "date": "2025-11-04",
                            "measured": 461.0
                        },
                        {
                            "date": "2025-11-05",
                            "measured": 489.0
                        },
                        {
                            "date": "2025-11-06",
                            "measured": 463.0
                        },
                        {
                            "date": "2025-11-08",
                            "measured": 624.0
                        },
                        {
                            "date": "2025-11-09",
                            "measured": 516.0
                        },
                        {
                            "date": "2025-11-10",
                            "measured": 479.0
                        },
                        {
                            "date": "2025-11-11",
                            "measured": 523.0
                        },
                        {
                            "date": "2025-11-12",
                            "measured": 631.0
                        },
                        {
                            "date": "2025-11-13",
                            "measured": 473.0
                        },
                        {
                            "date": "2025-11-14",
                            "measured": 534.0
                        },
                        {
                            "date": "2025-11-15",
                            "measured": 480.0
                        },
                        {
                            "date": "2025-11-16",
                            "measured": 468.0
                        },
                        {
                            "date": "2025-11-17",
                            "measured": 496.0
                        },
                        {
                            "date": "2025-11-18",
                            "measured": 398.0
                        },
                        {
                            "date": "2025-11-19",
                            "measured": 402.0
                        },
                        {
                            "date": "2025-11-20",
                            "measured": 463.0
                        },
                        {
                            "date": "2025-11-21",
                            "measured": 496.0
                        },
                        {
                            "date": "2025-11-22",
                            "measured": 537.0
                        },
                        {
                            "date": "2025-11-23",
                            "measured": 363.0
                        },
                        {
                            "date": "2025-11-24",
                            "measured": 364.0
                        },
                        {
                            "date": "2025-11-25",
                            "measured": 444.0
                        },
                        {
                            "date": "2025-11-26",
                            "measured": 369.0
                        },
                        {
                            "date": "2025-11-27",
                            "measured": 396.0
                        },
                        {
                            "date": "2025-11-28",
                            "measured": 447.0
                        },
                        {
                            "date": "2025-11-29",
                            "measured": 464.0
                        },
                        {
                            "date": "2025-11-30",
                            "measured": 414.0
                        },
                        {
                            "date": "2025-12-01",
                            "measured": 341.0
                        },
                        {
                            "date": "2025-12-02",
                            "measured": 396.0
                        },
                        {
                            "date": "2025-12-03",
                            "measured": 412.0
                        },
                        {
                            "date": "2025-12-04",
                            "measured": 417.0
                        },
                        {
                            "date": "2025-12-05",
                            "measured": 449.0
                        },
                        {
                            "date": "2025-12-06",
                            "measured": 444.0
                        },
                        {
                            "date": "2025-12-07",
                            "measured": 323.0
                        },
                        {
                            "date": "2025-12-09",
                            "measured": 486.0
                        },
                        {
                            "date": "2025-12-10",
                            "measured": 382.0
                        },
                        {
                            "date": "2025-12-11",
                            "measured": 446.0
                        },
                        {
                            "date": "2025-12-12",
                            "measured": 479.0
                        },
                        {
                            "date": "2025-12-13",
                            "measured": 551.0
                        },
                        {
                            "date": "2025-12-14",
                            "measured": 501.0
                        },
                        {
                            "date": "2025-12-15",
                            "measured": 401.0
                        },
                        {
                            "date": "2025-12-16",
                            "measured": 418.0
                        },
                        {
                            "date": "2025-12-17",
                            "measured": 450.0
                        },
                        {
                            "date": "2025-12-18",
                            "measured": 223.0
                        },
                        {
                            "date": "2025-12-19",
                            "measured": 121.0
                        },
                        {
                            "date": "2025-12-20",
                            "measured": 121.0
                        }
                    ]
                },
                {
                    "kpi_key": "vehicle_cap",
                    "granularity": "day",
                    "values": [
                        {
                            "date": "2025-09-16",
                            "measured": 1153.0
                        },
                        {
                            "date": "2025-09-17",
                            "measured": 1158.0
                        },
                        {
                            "date": "2025-09-18",
                            "measured": 1147.0
                        },
                        {
                            "date": "2025-09-19",
                            "measured": 1150.0
                        },
                        {
                            "date": "2025-09-20",
                            "measured": 1129.0
                        },
                        {
                            "date": "2025-09-21",
                            "measured": 1102.0
                        },
                        {
                            "date": "2025-09-22",
                            "measured": 1139.0
                        },
                        {
                            "date": "2025-09-23",
                            "measured": 1156.0
                        },
                        {
                            "date": "2025-09-24",
                            "measured": 1165.0
                        },
                        {
                            "date": "2025-09-25",
                            "measured": 1160.0
                        },
                        {
                            "date": "2025-09-26",
                            "measured": 1148.0
                        },
                        {
                            "date": "2025-09-27",
                            "measured": 1110.0
                        },
                        {
                            "date": "2025-09-28",
                            "measured": 1127.0
                        },
                        {
                            "date": "2025-09-29",
                            "measured": 1142.0
                        },
                        {
                            "date": "2025-09-30",
                            "measured": 1126.0
                        },
                        {
                            "date": "2025-10-01",
                            "measured": 1147.0
                        },
                        {
                            "date": "2025-10-02",
                            "measured": 1158.0
                        },
                        {
                            "date": "2025-10-03",
                            "measured": 1138.0
                        },
                        {
                            "date": "2025-10-04",
                            "measured": 1153.0
                        },
                        {
                            "date": "2025-10-05",
                            "measured": 1145.0
                        },
                        {
                            "date": "2025-10-06",
                            "measured": 1165.0
                        },
                        {
                            "date": "2025-10-07",
                            "measured": 1144.0
                        },
                        {
                            "date": "2025-10-08",
                            "measured": 1136.0
                        },
                        {
                            "date": "2025-10-09",
                            "measured": 1155.0
                        },
                        {
                            "date": "2025-10-10",
                            "measured": 1176.0
                        },
                        {
                            "date": "2025-10-11",
                            "measured": 1183.0
                        },
                        {
                            "date": "2025-10-12",
                            "measured": 1175.0
                        },
                        {
                            "date": "2025-10-13",
                            "measured": 1166.0
                        },
                        {
                            "date": "2025-10-14",
                            "measured": 1165.0
                        },
                        {
                            "date": "2025-10-15",
                            "measured": 1152.0
                        },
                        {
                            "date": "2025-10-16",
                            "measured": 1159.0
                        },
                        {
                            "date": "2025-10-17",
                            "measured": 1154.0
                        },
                        {
                            "date": "2025-10-18",
                            "measured": 1149.0
                        },
                        {
                            "date": "2025-10-19",
                            "measured": 1161.0
                        },
                        {
                            "date": "2025-10-20",
                            "measured": 1166.0
                        },
                        {
                            "date": "2025-10-21",
                            "measured": 1171.0
                        },
                        {
                            "date": "2025-10-22",
                            "measured": 1168.0
                        },
                        {
                            "date": "2025-10-23",
                            "measured": 1187.0
                        },
                        {
                            "date": "2025-10-24",
                            "measured": 1183.0
                        },
                        {
                            "date": "2025-10-25",
                            "measured": 1165.0
                        },
                        {
                            "date": "2025-10-26",
                            "measured": 1164.0
                        },
                        {
                            "date": "2025-10-27",
                            "measured": 1158.0
                        },
                        {
                            "date": "2025-10-28",
                            "measured": 1170.0
                        },
                        {
                            "date": "2025-10-29",
                            "measured": 1173.0
                        },
                        {
                            "date": "2025-10-30",
                            "measured": 1164.0
                        },
                        {
                            "date": "2025-10-31",
                            "measured": 1168.0
                        },
                        {
                            "date": "2025-11-01",
                            "measured": 1147.0
                        },
                        {
                            "date": "2025-11-02",
                            "measured": 1124.0
                        },
                        {
                            "date": "2025-11-03",
                            "measured": 1143.0
                        },
                        {
                            "date": "2025-11-04",
                            "measured": 1151.0
                        },
                        {
                            "date": "2025-11-05",
                            "measured": 1148.0
                        },
                        {
                            "date": "2025-11-06",
                            "measured": 1155.0
                        },
                        {
                            "date": "2025-11-07",
                            "measured": 1149.0
                        },
                        {
                            "date": "2025-11-08",
                            "measured": 1142.0
                        },
                        {
                            "date": "2025-11-09",
                            "measured": 1121.0
                        },
                        {
                            "date": "2025-11-10",
                            "measured": 1120.0
                        },
                        {
                            "date": "2025-11-11",
                            "measured": 1141.0
                        },
                        {
                            "date": "2025-11-12",
                            "measured": 1149.0
                        },
                        {
                            "date": "2025-11-13",
                            "measured": 1150.0
                        },
                        {
                            "date": "2025-11-14",
                            "measured": 1150.0
                        },
                        {
                            "date": "2025-11-15",
                            "measured": 1161.0
                        },
                        {
                            "date": "2025-11-16",
                            "measured": 1135.0
                        },
                        {
                            "date": "2025-11-17",
                            "measured": 1132.0
                        },
                        {
                            "date": "2025-11-18",
                            "measured": 1133.0
                        },
                        {
                            "date": "2025-11-19",
                            "measured": 1140.0
                        },
                        {
                            "date": "2025-11-20",
                            "measured": 1148.0
                        },
                        {
                            "date": "2025-11-21",
                            "measured": 1151.0
                        },
                        {
                            "date": "2025-11-22",
                            "measured": 1160.0
                        },
                        {
                            "date": "2025-11-23",
                            "measured": 1136.0
                        },
                        {
                            "date": "2025-11-24",
                            "measured": 1144.0
                        },
                        {
                            "date": "2025-11-25",
                            "measured": 1144.0
                        },
                        {
                            "date": "2025-11-26",
                            "measured": 1139.0
                        },
                        {
                            "date": "2025-11-27",
                            "measured": 1136.0
                        },
                        {
                            "date": "2025-11-28",
                            "measured": 1144.0
                        },
                        {
                            "date": "2025-11-29",
                            "measured": 1145.0
                        },
                        {
                            "date": "2025-11-30",
                            "measured": 1153.0
                        },
                        {
                            "date": "2025-12-01",
                            "measured": 1152.0
                        },
                        {
                            "date": "2025-12-02",
                            "measured": 1152.0
                        },
                        {
                            "date": "2025-12-03",
                            "measured": 1156.0
                        },
                        {
                            "date": "2025-12-04",
                            "measured": 1175.0
                        },
                        {
                            "date": "2025-12-05",
                            "measured": 1189.0
                        },
                        {
                            "date": "2025-12-06",
                            "measured": 1186.0
                        },
                        {
                            "date": "2025-12-07",
                            "measured": 1164.0
                        },
                        {
                            "date": "2025-12-08",
                            "measured": 1170.0
                        },
                        {
                            "date": "2025-12-09",
                            "measured": 1181.0
                        },
                        {
                            "date": "2025-12-10",
                            "measured": 1158.0
                        },
                        {
                            "date": "2025-12-11",
                            "measured": 1178.0
                        },
                        {
                            "date": "2025-12-12",
                            "measured": 1175.0
                        },
                        {
                            "date": "2025-12-13",
                            "measured": 1188.0
                        },
                        {
                            "date": "2025-12-14",
                            "measured": 1171.0
                        },
                        {
                            "date": "2025-12-15",
                            "measured": 1174.0
                        },
                        {
                            "date": "2025-12-16",
                            "measured": 1135.0
                        },
                        {
                            "date": "2025-12-17",
                            "measured": 1135.0
                        },
                        {
                            "date": "2025-12-18",
                            "measured": 1150.0
                        },
                        {
                            "date": "2025-12-19",
                            "measured": 1109.0
                        },
                        {
                            "date": "2025-12-20",
                            "measured": 1109.0
                        }
                    ]
                },
                {
                    "kpi_key": "percentage_parked_longer_then_24_hours",
                    "granularity": "day",
                    "values": [
                        {
                            "date": "2025-09-16",
                            "measured": 31.4
                        },
                        {
                            "date": "2025-09-17",
                            "measured": 26.5
                        },
                        {
                            "date": "2025-09-18",
                            "measured": 26.9
                        },
                        {
                            "date": "2025-09-19",
                            "measured": 31.0
                        },
                        {
                            "date": "2025-09-20",
                            "measured": 27.8
                        },
                        {
                            "date": "2025-09-21",
                            "measured": 34.7
                        },
                        {
                            "date": "2025-09-22",
                            "measured": 38.6
                        },
                        {
                            "date": "2025-09-23",
                            "measured": 35.7
                        },
                        {
                            "date": "2025-09-24",
                            "measured": 32.5
                        },
                        {
                            "date": "2025-09-25",
                            "measured": 31.3
                        },
                        {
                            "date": "2025-09-26",
                            "measured": 28.3
                        },
                        {
                            "date": "2025-09-27",
                            "measured": 23.4
                        },
                        {
                            "date": "2025-09-28",
                            "measured": 28.0
                        },
                        {
                            "date": "2025-09-29",
                            "measured": 33.6
                        },
                        {
                            "date": "2025-09-30",
                            "measured": 32.2
                        },
                        {
                            "date": "2025-10-01",
                            "measured": 30.4
                        },
                        {
                            "date": "2025-10-02",
                            "measured": 30.7
                        },
                        {
                            "date": "2025-10-03",
                            "measured": 29.0
                        },
                        {
                            "date": "2025-10-04",
                            "measured": 34.0
                        },
                        {
                            "date": "2025-10-05",
                            "measured": 33.5
                        },
                        {
                            "date": "2025-10-06",
                            "measured": 35.6
                        },
                        {
                            "date": "2025-10-07",
                            "measured": 39.3
                        },
                        {
                            "date": "2025-10-08",
                            "measured": 38.5
                        },
                        {
                            "date": "2025-10-09",
                            "measured": 40.8
                        },
                        {
                            "date": "2025-10-10",
                            "measured": 36.2
                        },
                        {
                            "date": "2025-10-11",
                            "measured": 30.8
                        },
                        {
                            "date": "2025-10-12",
                            "measured": 32.1
                        },
                        {
                            "date": "2025-10-13",
                            "measured": 39.5
                        },
                        {
                            "date": "2025-10-14",
                            "measured": 39.1
                        },
                        {
                            "date": "2025-10-15",
                            "measured": 36.6
                        },
                        {
                            "date": "2025-10-16",
                            "measured": 32.5
                        },
                        {
                            "date": "2025-10-17",
                            "measured": 31.5
                        },
                        {
                            "date": "2025-10-18",
                            "measured": 32.2
                        },
                        {
                            "date": "2025-10-19",
                            "measured": 32.8
                        },
                        {
                            "date": "2025-10-20",
                            "measured": 40.1
                        },
                        {
                            "date": "2025-10-21",
                            "measured": 39.2
                        },
                        {
                            "date": "2025-10-22",
                            "measured": 36.4
                        },
                        {
                            "date": "2025-10-23",
                            "measured": 32.7
                        },
                        {
                            "date": "2025-10-24",
                            "measured": 31.9
                        },
                        {
                            "date": "2025-10-25",
                            "measured": 30.5
                        },
                        {
                            "date": "2025-10-26",
                            "measured": 35.7
                        },
                        {
                            "date": "2025-10-27",
                            "measured": 30.9
                        },
                        {
                            "date": "2025-10-28",
                            "measured": 36.0
                        },
                        {
                            "date": "2025-10-29",
                            "measured": 32.3
                        },
                        {
                            "date": "2025-10-30",
                            "measured": 33.2
                        },
                        {
                            "date": "2025-10-31",
                            "measured": 34.2
                        },
                        {
                            "date": "2025-11-01",
                            "measured": 32.3
                        },
                        {
                            "date": "2025-11-02",
                            "measured": 36.0
                        },
                        {
                            "date": "2025-11-03",
                            "measured": 43.7
                        },
                        {
                            "date": "2025-11-04",
                            "measured": 40.9
                        },
                        {
                            "date": "2025-11-05",
                            "measured": 40.8
                        },
                        {
                            "date": "2025-11-06",
                            "measured": 33.4
                        },
                        {
                            "date": "2025-11-07",
                            "measured": 35.1
                        },
                        {
                            "date": "2025-11-08",
                            "measured": 32.7
                        },
                        {
                            "date": "2025-11-09",
                            "measured": 34.9
                        },
                        {
                            "date": "2025-11-10",
                            "measured": 43.0
                        },
                        {
                            "date": "2025-11-11",
                            "measured": 41.0
                        },
                        {
                            "date": "2025-11-12",
                            "measured": 37.2
                        },
                        {
                            "date": "2025-11-13",
                            "measured": 35.2
                        },
                        {
                            "date": "2025-11-14",
                            "measured": 35.4
                        },
                        {
                            "date": "2025-11-15",
                            "measured": 35.3
                        },
                        {
                            "date": "2025-11-16",
                            "measured": 40.1
                        },
                        {
                            "date": "2025-11-17",
                            "measured": 43.9
                        },
                        {
                            "date": "2025-11-18",
                            "measured": 42.2
                        },
                        {
                            "date": "2025-11-19",
                            "measured": 38.9
                        },
                        {
                            "date": "2025-11-20",
                            "measured": 43.5
                        },
                        {
                            "date": "2025-11-21",
                            "measured": 37.5
                        },
                        {
                            "date": "2025-11-22",
                            "measured": 37.2
                        },
                        {
                            "date": "2025-11-23",
                            "measured": 39.0
                        },
                        {
                            "date": "2025-11-24",
                            "measured": 48.3
                        },
                        {
                            "date": "2025-11-25",
                            "measured": 38.8
                        },
                        {
                            "date": "2025-11-26",
                            "measured": 39.9
                        },
                        {
                            "date": "2025-11-27",
                            "measured": 36.6
                        },
                        {
                            "date": "2025-11-28",
                            "measured": 34.0
                        },
                        {
                            "date": "2025-11-29",
                            "measured": 40.5
                        },
                        {
                            "date": "2025-11-30",
                            "measured": 44.3
                        },
                        {
                            "date": "2025-12-01",
                            "measured": 47.6
                        },
                        {
                            "date": "2025-12-02",
                            "measured": 43.8
                        },
                        {
                            "date": "2025-12-03",
                            "measured": 43.4
                        },
                        {
                            "date": "2025-12-04",
                            "measured": 39.2
                        },
                        {
                            "date": "2025-12-05",
                            "measured": 37.3
                        },
                        {
                            "date": "2025-12-06",
                            "measured": 37.4
                        },
                        {
                            "date": "2025-12-07",
                            "measured": 40.2
                        },
                        {
                            "date": "2025-12-08",
                            "measured": 47.6
                        },
                        {
                            "date": "2025-12-09",
                            "measured": 40.6
                        },
                        {
                            "date": "2025-12-10",
                            "measured": 41.8
                        },
                        {
                            "date": "2025-12-11",
                            "measured": 40.7
                        },
                        {
                            "date": "2025-12-12",
                            "measured": 37.5
                        },
                        {
                            "date": "2025-12-13",
                            "measured": 38.7
                        },
                        {
                            "date": "2025-12-14",
                            "measured": 44.1
                        },
                        {
                            "date": "2025-12-15",
                            "measured": 47.8
                        },
                        {
                            "date": "2025-12-16",
                            "measured": 43.3
                        },
                        {
                            "date": "2025-12-17",
                            "measured": 37.3
                        },
                        {
                            "date": "2025-12-18",
                            "measured": 30.7
                        },
                        {
                            "date": "2025-12-19",
                            "measured": 56.0
                        },
                        {
                            "date": "2025-12-20",
                            "measured": 100.0
                        }
                    ]
                },
                {
                    "kpi_key": "percentage_parked_longer_then_3_days",
                    "granularity": "day",
                    "values": [
                        {
                            "date": "2025-09-16",
                            "measured": 9.5
                        },
                        {
                            "date": "2025-09-17",
                            "measured": 9.5
                        },
                        {
                            "date": "2025-09-18",
                            "measured": 9.4
                        },
                        {
                            "date": "2025-09-19",
                            "measured": 8.6
                        },
                        {
                            "date": "2025-09-20",
                            "measured": 10.6
                        },
                        {
                            "date": "2025-09-21",
                            "measured": 14.0
                        },
                        {
                            "date": "2025-09-22",
                            "measured": 13.2
                        },
                        {
                            "date": "2025-09-23",
                            "measured": 15.1
                        },
                        {
                            "date": "2025-09-24",
                            "measured": 15.0
                        },
                        {
                            "date": "2025-09-25",
                            "measured": 14.7
                        },
                        {
                            "date": "2025-09-26",
                            "measured": 13.2
                        },
                        {
                            "date": "2025-09-27",
                            "measured": 10.7
                        },
                        {
                            "date": "2025-09-28",
                            "measured": 11.0
                        },
                        {
                            "date": "2025-09-29",
                            "measured": 10.9
                        },
                        {
                            "date": "2025-09-30",
                            "measured": 12.5
                        },
                        {
                            "date": "2025-10-01",
                            "measured": 12.6
                        },
                        {
                            "date": "2025-10-02",
                            "measured": 13.3
                        },
                        {
                            "date": "2025-10-03",
                            "measured": 10.1
                        },
                        {
                            "date": "2025-10-04",
                            "measured": 11.5
                        },
                        {
                            "date": "2025-10-05",
                            "measured": 10.0
                        },
                        {
                            "date": "2025-10-06",
                            "measured": 14.4
                        },
                        {
                            "date": "2025-10-07",
                            "measured": 17.2
                        },
                        {
                            "date": "2025-10-08",
                            "measured": 18.1
                        },
                        {
                            "date": "2025-10-09",
                            "measured": 17.2
                        },
                        {
                            "date": "2025-10-10",
                            "measured": 16.7
                        },
                        {
                            "date": "2025-10-11",
                            "measured": 15.3
                        },
                        {
                            "date": "2025-10-12",
                            "measured": 14.8
                        },
                        {
                            "date": "2025-10-13",
                            "measured": 15.4
                        },
                        {
                            "date": "2025-10-14",
                            "measured": 17.8
                        },
                        {
                            "date": "2025-10-15",
                            "measured": 18.1
                        },
                        {
                            "date": "2025-10-16",
                            "measured": 16.7
                        },
                        {
                            "date": "2025-10-17",
                            "measured": 15.0
                        },
                        {
                            "date": "2025-10-18",
                            "measured": 15.0
                        },
                        {
                            "date": "2025-10-19",
                            "measured": 14.3
                        },
                        {
                            "date": "2025-10-20",
                            "measured": 16.5
                        },
                        {
                            "date": "2025-10-21",
                            "measured": 18.9
                        },
                        {
                            "date": "2025-10-22",
                            "measured": 20.3
                        },
                        {
                            "date": "2025-10-23",
                            "measured": 17.2
                        },
                        {
                            "date": "2025-10-24",
                            "measured": 14.8
                        },
                        {
                            "date": "2025-10-25",
                            "measured": 14.2
                        },
                        {
                            "date": "2025-10-26",
                            "measured": 14.1
                        },
                        {
                            "date": "2025-10-27",
                            "measured": 14.8
                        },
                        {
                            "date": "2025-10-28",
                            "measured": 15.0
                        },
                        {
                            "date": "2025-10-29",
                            "measured": 15.3
                        },
                        {
                            "date": "2025-10-30",
                            "measured": 16.8
                        },
                        {
                            "date": "2025-10-31",
                            "measured": 15.6
                        },
                        {
                            "date": "2025-11-01",
                            "measured": 16.5
                        },
                        {
                            "date": "2025-11-02",
                            "measured": 15.3
                        },
                        {
                            "date": "2025-11-03",
                            "measured": 16.8
                        },
                        {
                            "date": "2025-11-04",
                            "measured": 17.7
                        },
                        {
                            "date": "2025-11-05",
                            "measured": 19.9
                        },
                        {
                            "date": "2025-11-06",
                            "measured": 16.9
                        },
                        {
                            "date": "2025-11-07",
                            "measured": 15.8
                        },
                        {
                            "date": "2025-11-08",
                            "measured": 14.1
                        },
                        {
                            "date": "2025-11-09",
                            "measured": 14.9
                        },
                        {
                            "date": "2025-11-10",
                            "measured": 16.9
                        },
                        {
                            "date": "2025-11-11",
                            "measured": 19.0
                        },
                        {
                            "date": "2025-11-12",
                            "measured": 20.7
                        },
                        {
                            "date": "2025-11-13",
                            "measured": 18.8
                        },
                        {
                            "date": "2025-11-14",
                            "measured": 17.5
                        },
                        {
                            "date": "2025-11-15",
                            "measured": 17.4
                        },
                        {
                            "date": "2025-11-16",
                            "measured": 19.5
                        },
                        {
                            "date": "2025-11-17",
                            "measured": 21.4
                        },
                        {
                            "date": "2025-11-18",
                            "measured": 22.2
                        },
                        {
                            "date": "2025-11-19",
                            "measured": 20.3
                        },
                        {
                            "date": "2025-11-20",
                            "measured": 20.2
                        },
                        {
                            "date": "2025-11-21",
                            "measured": 19.3
                        },
                        {
                            "date": "2025-11-22",
                            "measured": 20.0
                        },
                        {
                            "date": "2025-11-23",
                            "measured": 19.2
                        },
                        {
                            "date": "2025-11-24",
                            "measured": 21.6
                        },
                        {
                            "date": "2025-11-25",
                            "measured": 20.8
                        },
                        {
                            "date": "2025-11-26",
                            "measured": 20.6
                        },
                        {
                            "date": "2025-11-27",
                            "measured": 18.1
                        },
                        {
                            "date": "2025-11-28",
                            "measured": 16.8
                        },
                        {
                            "date": "2025-11-29",
                            "measured": 16.3
                        },
                        {
                            "date": "2025-11-30",
                            "measured": 18.8
                        },
                        {
                            "date": "2025-12-01",
                            "measured": 25.3
                        },
                        {
                            "date": "2025-12-02",
                            "measured": 27.3
                        },
                        {
                            "date": "2025-12-03",
                            "measured": 26.6
                        },
                        {
                            "date": "2025-12-04",
                            "measured": 23.2
                        },
                        {
                            "date": "2025-12-05",
                            "measured": 21.3
                        },
                        {
                            "date": "2025-12-06",
                            "measured": 21.2
                        },
                        {
                            "date": "2025-12-07",
                            "measured": 19.6
                        },
                        {
                            "date": "2025-12-08",
                            "measured": 23.8
                        },
                        {
                            "date": "2025-12-09",
                            "measured": 23.6
                        },
                        {
                            "date": "2025-12-10",
                            "measured": 23.6
                        },
                        {
                            "date": "2025-12-11",
                            "measured": 21.2
                        },
                        {
                            "date": "2025-12-12",
                            "measured": 20.4
                        },
                        {
                            "date": "2025-12-13",
                            "measured": 19.4
                        },
                        {
                            "date": "2025-12-14",
                            "measured": 20.9
                        },
                        {
                            "date": "2025-12-15",
                            "measured": 22.9
                        },
                        {
                            "date": "2025-12-16",
                            "measured": 21.9
                        },
                        {
                            "date": "2025-12-17",
                            "measured": 21.1
                        },
                        {
                            "date": "2025-12-18",
                            "measured": 17.5
                        },
                        {
                            "date": "2025-12-19",
                            "measured": 19.6
                        },
                        {
                            "date": "2025-12-20",
                            "measured": 26.8
                        }
                    ]
                },
                {
                    "kpi_key": "percentage_parked_longer_then_7_days",
                    "granularity": "day",
                    "values": [
                        {
                            "date": "2025-09-16",
                            "measured": 2.6
                        },
                        {
                            "date": "2025-09-17",
                            "measured": 2.3
                        },
                        {
                            "date": "2025-09-18",
                            "measured": 2.2
                        },
                        {
                            "date": "2025-09-19",
                            "measured": 2.0
                        },
                        {
                            "date": "2025-09-20",
                            "measured": 2.2
                        },
                        {
                            "date": "2025-09-21",
                            "measured": 2.5
                        },
                        {
                            "date": "2025-09-22",
                            "measured": 2.4
                        },
                        {
                            "date": "2025-09-23",
                            "measured": 2.6
                        },
                        {
                            "date": "2025-09-24",
                            "measured": 4.3
                        },
                        {
                            "date": "2025-09-25",
                            "measured": 5.0
                        },
                        {
                            "date": "2025-09-26",
                            "measured": 4.6
                        },
                        {
                            "date": "2025-09-27",
                            "measured": 4.4
                        },
                        {
                            "date": "2025-09-28",
                            "measured": 4.1
                        },
                        {
                            "date": "2025-09-29",
                            "measured": 4.4
                        },
                        {
                            "date": "2025-09-30",
                            "measured": 4.1
                        },
                        {
                            "date": "2025-10-01",
                            "measured": 3.2
                        },
                        {
                            "date": "2025-10-02",
                            "measured": 2.6
                        },
                        {
                            "date": "2025-10-03",
                            "measured": 2.3
                        },
                        {
                            "date": "2025-10-04",
                            "measured": 2.7
                        },
                        {
                            "date": "2025-10-05",
                            "measured": 3.3
                        },
                        {
                            "date": "2025-10-06",
                            "measured": 3.3
                        },
                        {
                            "date": "2025-10-07",
                            "measured": 3.9
                        },
                        {
                            "date": "2025-10-08",
                            "measured": 4.0
                        },
                        {
                            "date": "2025-10-09",
                            "measured": 3.9
                        },
                        {
                            "date": "2025-10-10",
                            "measured": 5.6
                        },
                        {
                            "date": "2025-10-11",
                            "measured": 5.0
                        },
                        {
                            "date": "2025-10-12",
                            "measured": 5.5
                        },
                        {
                            "date": "2025-10-13",
                            "measured": 6.2
                        },
                        {
                            "date": "2025-10-14",
                            "measured": 5.9
                        },
                        {
                            "date": "2025-10-15",
                            "measured": 6.8
                        },
                        {
                            "date": "2025-10-16",
                            "measured": 6.0
                        },
                        {
                            "date": "2025-10-17",
                            "measured": 5.5
                        },
                        {
                            "date": "2025-10-18",
                            "measured": 6.2
                        },
                        {
                            "date": "2025-10-19",
                            "measured": 6.3
                        },
                        {
                            "date": "2025-10-20",
                            "measured": 6.1
                        },
                        {
                            "date": "2025-10-21",
                            "measured": 6.5
                        },
                        {
                            "date": "2025-10-22",
                            "measured": 7.1
                        },
                        {
                            "date": "2025-10-23",
                            "measured": 6.3
                        },
                        {
                            "date": "2025-10-24",
                            "measured": 6.3
                        },
                        {
                            "date": "2025-10-25",
                            "measured": 6.0
                        },
                        {
                            "date": "2025-10-26",
                            "measured": 6.4
                        },
                        {
                            "date": "2025-10-27",
                            "measured": 6.9
                        },
                        {
                            "date": "2025-10-28",
                            "measured": 6.8
                        },
                        {
                            "date": "2025-10-29",
                            "measured": 6.8
                        },
                        {
                            "date": "2025-10-30",
                            "measured": 6.4
                        },
                        {
                            "date": "2025-10-31",
                            "measured": 6.5
                        },
                        {
                            "date": "2025-11-01",
                            "measured": 6.7
                        },
                        {
                            "date": "2025-11-02",
                            "measured": 5.7
                        },
                        {
                            "date": "2025-11-03",
                            "measured": 5.6
                        },
                        {
                            "date": "2025-11-04",
                            "measured": 5.5
                        },
                        {
                            "date": "2025-11-05",
                            "measured": 6.1
                        },
                        {
                            "date": "2025-11-06",
                            "measured": 5.1
                        },
                        {
                            "date": "2025-11-07",
                            "measured": 5.3
                        },
                        {
                            "date": "2025-11-08",
                            "measured": 5.1
                        },
                        {
                            "date": "2025-11-09",
                            "measured": 5.3
                        },
                        {
                            "date": "2025-11-10",
                            "measured": 5.5
                        },
                        {
                            "date": "2025-11-11",
                            "measured": 5.0
                        },
                        {
                            "date": "2025-11-12",
                            "measured": 4.8
                        },
                        {
                            "date": "2025-11-13",
                            "measured": 5.7
                        },
                        {
                            "date": "2025-11-14",
                            "measured": 6.0
                        },
                        {
                            "date": "2025-11-15",
                            "measured": 7.0
                        },
                        {
                            "date": "2025-11-16",
                            "measured": 8.3
                        },
                        {
                            "date": "2025-11-17",
                            "measured": 9.0
                        },
                        {
                            "date": "2025-11-18",
                            "measured": 8.6
                        },
                        {
                            "date": "2025-11-19",
                            "measured": 8.6
                        },
                        {
                            "date": "2025-11-20",
                            "measured": 8.7
                        },
                        {
                            "date": "2025-11-21",
                            "measured": 8.2
                        },
                        {
                            "date": "2025-11-22",
                            "measured": 8.2
                        },
                        {
                            "date": "2025-11-23",
                            "measured": 8.4
                        },
                        {
                            "date": "2025-11-24",
                            "measured": 8.7
                        },
                        {
                            "date": "2025-11-25",
                            "measured": 8.5
                        },
                        {
                            "date": "2025-11-26",
                            "measured": 8.6
                        },
                        {
                            "date": "2025-11-27",
                            "measured": 6.8
                        },
                        {
                            "date": "2025-11-28",
                            "measured": 6.9
                        },
                        {
                            "date": "2025-11-29",
                            "measured": 6.5
                        },
                        {
                            "date": "2025-11-30",
                            "measured": 6.9
                        },
                        {
                            "date": "2025-12-01",
                            "measured": 6.9
                        },
                        {
                            "date": "2025-12-02",
                            "measured": 7.2
                        },
                        {
                            "date": "2025-12-03",
                            "measured": 8.0
                        },
                        {
                            "date": "2025-12-04",
                            "measured": 8.4
                        },
                        {
                            "date": "2025-12-05",
                            "measured": 9.6
                        },
                        {
                            "date": "2025-12-06",
                            "measured": 11.3
                        },
                        {
                            "date": "2025-12-07",
                            "measured": 10.7
                        },
                        {
                            "date": "2025-12-08",
                            "measured": 11.1
                        },
                        {
                            "date": "2025-12-09",
                            "measured": 10.1
                        },
                        {
                            "date": "2025-12-10",
                            "measured": 10.1
                        },
                        {
                            "date": "2025-12-11",
                            "measured": 9.1
                        },
                        {
                            "date": "2025-12-12",
                            "measured": 10.2
                        },
                        {
                            "date": "2025-12-13",
                            "measured": 10.0
                        },
                        {
                            "date": "2025-12-14",
                            "measured": 10.5
                        },
                        {
                            "date": "2025-12-15",
                            "measured": 10.2
                        },
                        {
                            "date": "2025-12-16",
                            "measured": 8.7
                        },
                        {
                            "date": "2025-12-17",
                            "measured": 9.5
                        },
                        {
                            "date": "2025-12-18",
                            "measured": 7.6
                        },
                        {
                            "date": "2025-12-19",
                            "measured": 8.7
                        },
                        {
                            "date": "2025-12-20",
                            "measured": 11.2
                        }
                    ]
                },
                {
                    "kpi_key": "percentage_parked_longer_then_14_days",
                    "granularity": "day",
                    "values": [
                        {
                            "date": "2025-09-16",
                            "measured": 0.3
                        },
                        {
                            "date": "2025-09-17",
                            "measured": 0.4
                        },
                        {
                            "date": "2025-09-18",
                            "measured": 0.4
                        },
                        {
                            "date": "2025-09-19",
                            "measured": 0.5
                        },
                        {
                            "date": "2025-09-20",
                            "measured": 0.7
                        },
                        {
                            "date": "2025-09-21",
                            "measured": 1.0
                        },
                        {
                            "date": "2025-09-22",
                            "measured": 0.5
                        },
                        {
                            "date": "2025-09-23",
                            "measured": 0.5
                        },
                        {
                            "date": "2025-09-24",
                            "measured": 0.5
                        },
                        {
                            "date": "2025-09-25",
                            "measured": 0.5
                        },
                        {
                            "date": "2025-09-26",
                            "measured": 0.5
                        },
                        {
                            "date": "2025-09-27",
                            "measured": 0.5
                        },
                        {
                            "date": "2025-09-28",
                            "measured": 0.3
                        },
                        {
                            "date": "2025-09-29",
                            "measured": 0.4
                        },
                        {
                            "date": "2025-09-30",
                            "measured": 0.6
                        },
                        {
                            "date": "2025-10-01",
                            "measured": 0.9
                        },
                        {
                            "date": "2025-10-02",
                            "measured": 0.6
                        },
                        {
                            "date": "2025-10-03",
                            "measured": 0.4
                        },
                        {
                            "date": "2025-10-04",
                            "measured": 0.8
                        },
                        {
                            "date": "2025-10-05",
                            "measured": 0.5
                        },
                        {
                            "date": "2025-10-06",
                            "measured": 0.4
                        },
                        {
                            "date": "2025-10-07",
                            "measured": 0.4
                        },
                        {
                            "date": "2025-10-08",
                            "measured": 0.4
                        },
                        {
                            "date": "2025-10-09",
                            "measured": 0.5
                        },
                        {
                            "date": "2025-10-10",
                            "measured": 0.6
                        },
                        {
                            "date": "2025-10-11",
                            "measured": 0.8
                        },
                        {
                            "date": "2025-10-12",
                            "measured": 1.0
                        },
                        {
                            "date": "2025-10-13",
                            "measured": 1.0
                        },
                        {
                            "date": "2025-10-14",
                            "measured": 0.9
                        },
                        {
                            "date": "2025-10-15",
                            "measured": 1.2
                        },
                        {
                            "date": "2025-10-16",
                            "measured": 1.0
                        },
                        {
                            "date": "2025-10-17",
                            "measured": 1.4
                        },
                        {
                            "date": "2025-10-18",
                            "measured": 1.5
                        },
                        {
                            "date": "2025-10-19",
                            "measured": 1.6
                        },
                        {
                            "date": "2025-10-20",
                            "measured": 1.8
                        },
                        {
                            "date": "2025-10-21",
                            "measured": 2.1
                        },
                        {
                            "date": "2025-10-22",
                            "measured": 2.6
                        },
                        {
                            "date": "2025-10-23",
                            "measured": 1.8
                        },
                        {
                            "date": "2025-10-24",
                            "measured": 1.7
                        },
                        {
                            "date": "2025-10-25",
                            "measured": 2.2
                        },
                        {
                            "date": "2025-10-26",
                            "measured": 2.3
                        },
                        {
                            "date": "2025-10-27",
                            "measured": 2.5
                        },
                        {
                            "date": "2025-10-28",
                            "measured": 2.4
                        },
                        {
                            "date": "2025-10-29",
                            "measured": 2.6
                        },
                        {
                            "date": "2025-10-30",
                            "measured": 2.1
                        },
                        {
                            "date": "2025-10-31",
                            "measured": 2.0
                        },
                        {
                            "date": "2025-11-01",
                            "measured": 2.3
                        },
                        {
                            "date": "2025-11-02",
                            "measured": 1.7
                        },
                        {
                            "date": "2025-11-03",
                            "measured": 1.8
                        },
                        {
                            "date": "2025-11-04",
                            "measured": 1.9
                        },
                        {
                            "date": "2025-11-05",
                            "measured": 1.8
                        },
                        {
                            "date": "2025-11-06",
                            "measured": 1.4
                        },
                        {
                            "date": "2025-11-07",
                            "measured": 1.1
                        },
                        {
                            "date": "2025-11-08",
                            "measured": 1.1
                        },
                        {
                            "date": "2025-11-09",
                            "measured": 1.2
                        },
                        {
                            "date": "2025-11-10",
                            "measured": 1.3
                        },
                        {
                            "date": "2025-11-11",
                            "measured": 0.9
                        },
                        {
                            "date": "2025-11-12",
                            "measured": 1.0
                        },
                        {
                            "date": "2025-11-13",
                            "measured": 0.9
                        },
                        {
                            "date": "2025-11-14",
                            "measured": 0.6
                        },
                        {
                            "date": "2025-11-15",
                            "measured": 0.9
                        },
                        {
                            "date": "2025-11-16",
                            "measured": 1.1
                        },
                        {
                            "date": "2025-11-17",
                            "measured": 1.3
                        },
                        {
                            "date": "2025-11-18",
                            "measured": 1.6
                        },
                        {
                            "date": "2025-11-19",
                            "measured": 1.3
                        },
                        {
                            "date": "2025-11-20",
                            "measured": 1.7
                        },
                        {
                            "date": "2025-11-21",
                            "measured": 1.6
                        },
                        {
                            "date": "2025-11-22",
                            "measured": 1.8
                        },
                        {
                            "date": "2025-11-23",
                            "measured": 2.1
                        },
                        {
                            "date": "2025-11-24",
                            "measured": 2.8
                        },
                        {
                            "date": "2025-11-25",
                            "measured": 2.4
                        },
                        {
                            "date": "2025-11-26",
                            "measured": 2.5
                        },
                        {
                            "date": "2025-11-27",
                            "measured": 1.3
                        },
                        {
                            "date": "2025-11-28",
                            "measured": 1.4
                        },
                        {
                            "date": "2025-11-29",
                            "measured": 1.2
                        },
                        {
                            "date": "2025-11-30",
                            "measured": 1.4
                        },
                        {
                            "date": "2025-12-01",
                            "measured": 1.4
                        },
                        {
                            "date": "2025-12-02",
                            "measured": 1.6
                        },
                        {
                            "date": "2025-12-03",
                            "measured": 1.8
                        },
                        {
                            "date": "2025-12-04",
                            "measured": 1.4
                        },
                        {
                            "date": "2025-12-05",
                            "measured": 1.3
                        },
                        {
                            "date": "2025-12-06",
                            "measured": 1.4
                        },
                        {
                            "date": "2025-12-07",
                            "measured": 1.0
                        },
                        {
                            "date": "2025-12-08",
                            "measured": 1.5
                        },
                        {
                            "date": "2025-12-09",
                            "measured": 1.5
                        },
                        {
                            "date": "2025-12-10",
                            "measured": 1.9
                        },
                        {
                            "date": "2025-12-11",
                            "measured": 2.2
                        },
                        {
                            "date": "2025-12-12",
                            "measured": 2.5
                        },
                        {
                            "date": "2025-12-13",
                            "measured": 3.4
                        },
                        {
                            "date": "2025-12-14",
                            "measured": 3.6
                        },
                        {
                            "date": "2025-12-15",
                            "measured": 3.6
                        },
                        {
                            "date": "2025-12-16",
                            "measured": 2.2
                        },
                        {
                            "date": "2025-12-17",
                            "measured": 2.7
                        },
                        {
                            "date": "2025-12-18",
                            "measured": 1.7
                        },
                        {
                            "date": "2025-12-19",
                            "measured": 2.9
                        },
                        {
                            "date": "2025-12-20",
                            "measured": 3.3
                        }
                    ]
                }
            ]
        },
        {
            "operator": "dott",
            "form_factor": "bicycle",
            "propulsion_type": "unknown",
            "geometry_ref": "cbs:GM0599",
            "kpis": [
                {
                    "kpi_key": "number_of_wrongly_parked_vehicles",
                    "granularity": "day",
                    "values": [
                        {
                            "date": "2025-10-30",
                            "measured": 4.0
                        }
                    ]
                },
                {
                    "kpi_key": "vehicle_cap",
                    "granularity": "day",
                    "values": [
                        {
                            "date": "2025-10-30",
                            "measured": 1.0
                        }
                    ]
                }
            ]
        },
        {
            "operator": "felyx",
            "form_factor": "bicycle",
            "propulsion_type": "electric_assist",
            "geometry_ref": "cbs:GM0599",
            "kpis": [
                {
                    "kpi_key": "number_of_wrongly_parked_vehicles",
                    "granularity": "day",
                    "values": [
                        {
                            "date": "2025-09-16",
                            "measured": 220.0
                        },
                        {
                            "date": "2025-09-17",
                            "measured": 195.0
                        },
                        {
                            "date": "2025-09-18",
                            "measured": 244.0
                        },
                        {
                            "date": "2025-09-19",
                            "measured": 273.0
                        },
                        {
                            "date": "2025-09-20",
                            "measured": 371.0
                        },
                        {
                            "date": "2025-09-21",
                            "measured": 205.0
                        },
                        {
                            "date": "2025-09-22",
                            "measured": 169.0
                        },
                        {
                            "date": "2025-09-23",
                            "measured": 199.0
                        },
                        {
                            "date": "2025-09-24",
                            "measured": 199.0
                        },
                        {
                            "date": "2025-09-25",
                            "measured": 201.0
                        },
                        {
                            "date": "2025-09-26",
                            "measured": 255.0
                        },
                        {
                            "date": "2025-09-27",
                            "measured": 280.0
                        },
                        {
                            "date": "2025-09-28",
                            "measured": 260.0
                        },
                        {
                            "date": "2025-09-29",
                            "measured": 217.0
                        },
                        {
                            "date": "2025-09-30",
                            "measured": 269.0
                        },
                        {
                            "date": "2025-10-01",
                            "measured": 234.0
                        },
                        {
                            "date": "2025-10-02",
                            "measured": 245.0
                        },
                        {
                            "date": "2025-10-03",
                            "measured": 260.0
                        },
                        {
                            "date": "2025-10-04",
                            "measured": 191.0
                        },
                        {
                            "date": "2025-10-05",
                            "measured": 241.0
                        },
                        {
                            "date": "2025-10-06",
                            "measured": 225.0
                        },
                        {
                            "date": "2025-10-08",
                            "measured": 196.0
                        },
                        {
                            "date": "2025-10-09",
                            "measured": 252.0
                        },
                        {
                            "date": "2025-10-10",
                            "measured": 284.0
                        },
                        {
                            "date": "2025-10-11",
                            "measured": 292.0
                        },
                        {
                            "date": "2025-10-12",
                            "measured": 296.0
                        },
                        {
                            "date": "2025-10-13",
                            "measured": 378.0
                        },
                        {
                            "date": "2025-10-14",
                            "measured": 519.0
                        },
                        {
                            "date": "2025-10-15",
                            "measured": 303.0
                        },
                        {
                            "date": "2025-10-16",
                            "measured": 284.0
                        },
                        {
                            "date": "2025-10-17",
                            "measured": 333.0
                        },
                        {
                            "date": "2025-10-18",
                            "measured": 317.0
                        },
                        {
                            "date": "2025-10-19",
                            "measured": 336.0
                        },
                        {
                            "date": "2025-10-20",
                            "measured": 283.0
                        },
                        {
                            "date": "2025-10-21",
                            "measured": 291.0
                        },
                        {
                            "date": "2025-10-22",
                            "measured": 298.0
                        },
                        {
                            "date": "2025-10-23",
                            "measured": 251.0
                        },
                        {
                            "date": "2025-10-24",
                            "measured": 292.0
                        },
                        {
                            "date": "2025-10-25",
                            "measured": 258.0
                        },
                        {
                            "date": "2025-10-26",
                            "measured": 313.0
                        },
                        {
                            "date": "2025-10-27",
                            "measured": 267.0
                        },
                        {
                            "date": "2025-10-28",
                            "measured": 270.0
                        },
                        {
                            "date": "2025-10-29",
                            "measured": 235.0
                        },
                        {
                            "date": "2025-10-30",
                            "measured": 191.0
                        },
                        {
                            "date": "2025-10-31",
                            "measured": 222.0
                        },
                        {
                            "date": "2025-11-01",
                            "measured": 223.0
                        },
                        {
                            "date": "2025-11-02",
                            "measured": 211.0
                        },
                        {
                            "date": "2025-11-03",
                            "measured": 159.0
                        },
                        {
                            "date": "2025-11-04",
                            "measured": 190.0
                        },
                        {
                            "date": "2025-11-05",
                            "measured": 168.0
                        },
                        {
                            "date": "2025-11-06",
                            "measured": 265.0
                        },
                        {
                            "date": "2025-11-08",
                            "measured": 224.0
                        },
                        {
                            "date": "2025-11-09",
                            "measured": 235.0
                        },
                        {
                            "date": "2025-11-10",
                            "measured": 204.0
                        },
                        {
                            "date": "2025-11-11",
                            "measured": 215.0
                        },
                        {
                            "date": "2025-11-12",
                            "measured": 171.0
                        },
                        {
                            "date": "2025-11-13",
                            "measured": 169.0
                        },
                        {
                            "date": "2025-11-14",
                            "measured": 178.0
                        },
                        {
                            "date": "2025-11-15",
                            "measured": 203.0
                        },
                        {
                            "date": "2025-11-16",
                            "measured": 188.0
                        },
                        {
                            "date": "2025-11-17",
                            "measured": 194.0
                        },
                        {
                            "date": "2025-11-18",
                            "measured": 197.0
                        },
                        {
                            "date": "2025-11-19",
                            "measured": 162.0
                        },
                        {
                            "date": "2025-11-20",
                            "measured": 183.0
                        },
                        {
                            "date": "2025-11-21",
                            "measured": 220.0
                        },
                        {
                            "date": "2025-11-22",
                            "measured": 223.0
                        },
                        {
                            "date": "2025-11-23",
                            "measured": 231.0
                        },
                        {
                            "date": "2025-11-24",
                            "measured": 229.0
                        },
                        {
                            "date": "2025-11-25",
                            "measured": 225.0
                        },
                        {
                            "date": "2025-11-26",
                            "measured": 209.0
                        },
                        {
                            "date": "2025-11-27",
                            "measured": 221.0
                        },
                        {
                            "date": "2025-11-28",
                            "measured": 242.0
                        },
                        {
                            "date": "2025-11-29",
                            "measured": 251.0
                        },
                        {
                            "date": "2025-11-30",
                            "measured": 236.0
                        },
                        {
                            "date": "2025-12-01",
                            "measured": 181.0
                        },
                        {
                            "date": "2025-12-02",
                            "measured": 185.0
                        },
                        {
                            "date": "2025-12-03",
                            "measured": 200.0
                        },
                        {
                            "date": "2025-12-04",
                            "measured": 204.0
                        },
                        {
                            "date": "2025-12-05",
                            "measured": 178.0
                        },
                        {
                            "date": "2025-12-06",
                            "measured": 214.0
                        },
                        {
                            "date": "2025-12-07",
                            "measured": 207.0
                        },
                        {
                            "date": "2025-12-09",
                            "measured": 220.0
                        },
                        {
                            "date": "2025-12-10",
                            "measured": 187.0
                        },
                        {
                            "date": "2025-12-11",
                            "measured": 227.0
                        },
                        {
                            "date": "2025-12-12",
                            "measured": 278.0
                        },
                        {
                            "date": "2025-12-13",
                            "measured": 236.0
                        },
                        {
                            "date": "2025-12-14",
                            "measured": 213.0
                        },
                        {
                            "date": "2025-12-15",
                            "measured": 183.0
                        },
                        {
                            "date": "2025-12-16",
                            "measured": 189.0
                        },
                        {
                            "date": "2025-12-17",
                            "measured": 195.0
                        },
                        {
                            "date": "2025-12-18",
                            "measured": 188.0
                        },
                        {
                            "date": "2025-12-19",
                            "measured": 197.0
                        },
                        {
                            "date": "2025-12-20",
                            "measured": 211.0
                        }
                    ]
                },
                {
                    "kpi_key": "vehicle_cap",
                    "granularity": "day",
                    "values": [
                        {
                            "date": "2025-09-16",
                            "measured": 848.0
                        },
                        {
                            "date": "2025-09-17",
                            "measured": 839.0
                        },
                        {
                            "date": "2025-09-18",
                            "measured": 836.0
                        },
                        {
                            "date": "2025-09-19",
                            "measured": 838.0
                        },
                        {
                            "date": "2025-09-20",
                            "measured": 834.0
                        },
                        {
                            "date": "2025-09-21",
                            "measured": 832.0
                        },
                        {
                            "date": "2025-09-22",
                            "measured": 837.0
                        },
                        {
                            "date": "2025-09-23",
                            "measured": 836.0
                        },
                        {
                            "date": "2025-09-24",
                            "measured": 842.0
                        },
                        {
                            "date": "2025-09-25",
                            "measured": 835.0
                        },
                        {
                            "date": "2025-09-26",
                            "measured": 837.0
                        },
                        {
                            "date": "2025-09-27",
                            "measured": 838.0
                        },
                        {
                            "date": "2025-09-28",
                            "measured": 826.0
                        },
                        {
                            "date": "2025-09-29",
                            "measured": 833.0
                        },
                        {
                            "date": "2025-09-30",
                            "measured": 837.0
                        },
                        {
                            "date": "2025-10-01",
                            "measured": 839.0
                        },
                        {
                            "date": "2025-10-02",
                            "measured": 849.0
                        },
                        {
                            "date": "2025-10-03",
                            "measured": 847.0
                        },
                        {
                            "date": "2025-10-04",
                            "measured": 845.0
                        },
                        {
                            "date": "2025-10-05",
                            "measured": 843.0
                        },
                        {
                            "date": "2025-10-06",
                            "measured": 841.0
                        },
                        {
                            "date": "2025-10-07",
                            "measured": 843.0
                        },
                        {
                            "date": "2025-10-08",
                            "measured": 842.0
                        },
                        {
                            "date": "2025-10-09",
                            "measured": 843.0
                        },
                        {
                            "date": "2025-10-10",
                            "measured": 838.0
                        },
                        {
                            "date": "2025-10-11",
                            "measured": 833.0
                        },
                        {
                            "date": "2025-10-12",
                            "measured": 834.0
                        },
                        {
                            "date": "2025-10-13",
                            "measured": 835.0
                        },
                        {
                            "date": "2025-10-14",
                            "measured": 835.0
                        },
                        {
                            "date": "2025-10-15",
                            "measured": 828.0
                        },
                        {
                            "date": "2025-10-16",
                            "measured": 834.0
                        },
                        {
                            "date": "2025-10-17",
                            "measured": 833.0
                        },
                        {
                            "date": "2025-10-18",
                            "measured": 834.0
                        },
                        {
                            "date": "2025-10-19",
                            "measured": 833.0
                        },
                        {
                            "date": "2025-10-20",
                            "measured": 830.0
                        },
                        {
                            "date": "2025-10-21",
                            "measured": 823.0
                        },
                        {
                            "date": "2025-10-22",
                            "measured": 824.0
                        },
                        {
                            "date": "2025-10-23",
                            "measured": 824.0
                        },
                        {
                            "date": "2025-10-24",
                            "measured": 808.0
                        },
                        {
                            "date": "2025-10-25",
                            "measured": 803.0
                        },
                        {
                            "date": "2025-10-26",
                            "measured": 801.0
                        },
                        {
                            "date": "2025-10-27",
                            "measured": 796.0
                        },
                        {
                            "date": "2025-10-28",
                            "measured": 797.0
                        },
                        {
                            "date": "2025-10-29",
                            "measured": 794.0
                        },
                        {
                            "date": "2025-10-30",
                            "measured": 794.0
                        },
                        {
                            "date": "2025-10-31",
                            "measured": 796.0
                        },
                        {
                            "date": "2025-11-01",
                            "measured": 789.0
                        },
                        {
                            "date": "2025-11-02",
                            "measured": 799.0
                        },
                        {
                            "date": "2025-11-03",
                            "measured": 818.0
                        },
                        {
                            "date": "2025-11-04",
                            "measured": 821.0
                        },
                        {
                            "date": "2025-11-05",
                            "measured": 809.0
                        },
                        {
                            "date": "2025-11-06",
                            "measured": 806.0
                        },
                        {
                            "date": "2025-11-07",
                            "measured": 806.0
                        },
                        {
                            "date": "2025-11-08",
                            "measured": 796.0
                        },
                        {
                            "date": "2025-11-09",
                            "measured": 786.0
                        },
                        {
                            "date": "2025-11-10",
                            "measured": 787.0
                        },
                        {
                            "date": "2025-11-11",
                            "measured": 782.0
                        },
                        {
                            "date": "2025-11-12",
                            "measured": 786.0
                        },
                        {
                            "date": "2025-11-13",
                            "measured": 782.0
                        },
                        {
                            "date": "2025-11-14",
                            "measured": 785.0
                        },
                        {
                            "date": "2025-11-15",
                            "measured": 786.0
                        },
                        {
                            "date": "2025-11-16",
                            "measured": 780.0
                        },
                        {
                            "date": "2025-11-17",
                            "measured": 782.0
                        },
                        {
                            "date": "2025-11-18",
                            "measured": 814.0
                        },
                        {
                            "date": "2025-11-19",
                            "measured": 830.0
                        },
                        {
                            "date": "2025-11-20",
                            "measured": 835.0
                        },
                        {
                            "date": "2025-11-21",
                            "measured": 854.0
                        },
                        {
                            "date": "2025-11-22",
                            "measured": 849.0
                        },
                        {
                            "date": "2025-11-23",
                            "measured": 852.0
                        },
                        {
                            "date": "2025-11-24",
                            "measured": 848.0
                        },
                        {
                            "date": "2025-11-25",
                            "measured": 851.0
                        },
                        {
                            "date": "2025-11-26",
                            "measured": 855.0
                        },
                        {
                            "date": "2025-11-27",
                            "measured": 853.0
                        },
                        {
                            "date": "2025-11-28",
                            "measured": 853.0
                        },
                        {
                            "date": "2025-11-29",
                            "measured": 859.0
                        },
                        {
                            "date": "2025-11-30",
                            "measured": 863.0
                        },
                        {
                            "date": "2025-12-01",
                            "measured": 864.0
                        },
                        {
                            "date": "2025-12-02",
                            "measured": 865.0
                        },
                        {
                            "date": "2025-12-03",
                            "measured": 859.0
                        },
                        {
                            "date": "2025-12-04",
                            "measured": 858.0
                        },
                        {
                            "date": "2025-12-05",
                            "measured": 869.0
                        },
                        {
                            "date": "2025-12-06",
                            "measured": 865.0
                        },
                        {
                            "date": "2025-12-07",
                            "measured": 857.0
                        },
                        {
                            "date": "2025-12-08",
                            "measured": 845.0
                        },
                        {
                            "date": "2025-12-09",
                            "measured": 839.0
                        },
                        {
                            "date": "2025-12-10",
                            "measured": 845.0
                        },
                        {
                            "date": "2025-12-11",
                            "measured": 845.0
                        },
                        {
                            "date": "2025-12-12",
                            "measured": 837.0
                        },
                        {
                            "date": "2025-12-13",
                            "measured": 842.0
                        },
                        {
                            "date": "2025-12-14",
                            "measured": 838.0
                        },
                        {
                            "date": "2025-12-15",
                            "measured": 840.0
                        },
                        {
                            "date": "2025-12-16",
                            "measured": 837.0
                        },
                        {
                            "date": "2025-12-17",
                            "measured": 841.0
                        },
                        {
                            "date": "2025-12-18",
                            "measured": 833.0
                        },
                        {
                            "date": "2025-12-19",
                            "measured": 842.0
                        },
                        {
                            "date": "2025-12-20",
                            "measured": 839.0
                        }
                    ]
                },
                {
                    "kpi_key": "percentage_parked_longer_then_24_hours",
                    "granularity": "day",
                    "values": [
                        {
                            "date": "2025-09-16",
                            "measured": 73.1
                        },
                        {
                            "date": "2025-09-17",
                            "measured": 69.6
                        },
                        {
                            "date": "2025-09-18",
                            "measured": 71.2
                        },
                        {
                            "date": "2025-09-19",
                            "measured": 66.3
                        },
                        {
                            "date": "2025-09-20",
                            "measured": 61.8
                        },
                        {
                            "date": "2025-09-21",
                            "measured": 60.5
                        },
                        {
                            "date": "2025-09-22",
                            "measured": 70.8
                        },
                        {
                            "date": "2025-09-23",
                            "measured": 73.8
                        },
                        {
                            "date": "2025-09-24",
                            "measured": 70.7
                        },
                        {
                            "date": "2025-09-25",
                            "measured": 70.5
                        },
                        {
                            "date": "2025-09-26",
                            "measured": 67.0
                        },
                        {
                            "date": "2025-09-27",
                            "measured": 64.6
                        },
                        {
                            "date": "2025-09-28",
                            "measured": 63.5
                        },
                        {
                            "date": "2025-09-29",
                            "measured": 69.2
                        },
                        {
                            "date": "2025-09-30",
                            "measured": 72.0
                        },
                        {
                            "date": "2025-10-01",
                            "measured": 68.8
                        },
                        {
                            "date": "2025-10-02",
                            "measured": 69.4
                        },
                        {
                            "date": "2025-10-03",
                            "measured": 61.6
                        },
                        {
                            "date": "2025-10-04",
                            "measured": 65.8
                        },
                        {
                            "date": "2025-10-05",
                            "measured": 72.1
                        },
                        {
                            "date": "2025-10-06",
                            "measured": 68.3
                        },
                        {
                            "date": "2025-10-07",
                            "measured": 70.1
                        },
                        {
                            "date": "2025-10-08",
                            "measured": 69.4
                        },
                        {
                            "date": "2025-10-09",
                            "measured": 67.8
                        },
                        {
                            "date": "2025-10-10",
                            "measured": 62.5
                        },
                        {
                            "date": "2025-10-11",
                            "measured": 56.5
                        },
                        {
                            "date": "2025-10-12",
                            "measured": 65.1
                        },
                        {
                            "date": "2025-10-13",
                            "measured": 67.8
                        },
                        {
                            "date": "2025-10-14",
                            "measured": 61.2
                        },
                        {
                            "date": "2025-10-15",
                            "measured": 55.7
                        },
                        {
                            "date": "2025-10-16",
                            "measured": 63.3
                        },
                        {
                            "date": "2025-10-17",
                            "measured": 62.1
                        },
                        {
                            "date": "2025-10-18",
                            "measured": 58.0
                        },
                        {
                            "date": "2025-10-19",
                            "measured": 62.0
                        },
                        {
                            "date": "2025-10-20",
                            "measured": 68.7
                        },
                        {
                            "date": "2025-10-21",
                            "measured": 70.5
                        },
                        {
                            "date": "2025-10-22",
                            "measured": 68.0
                        },
                        {
                            "date": "2025-10-23",
                            "measured": 65.7
                        },
                        {
                            "date": "2025-10-24",
                            "measured": 73.9
                        },
                        {
                            "date": "2025-10-25",
                            "measured": 62.5
                        },
                        {
                            "date": "2025-10-26",
                            "measured": 70.4
                        },
                        {
                            "date": "2025-10-27",
                            "measured": 68.7
                        },
                        {
                            "date": "2025-10-28",
                            "measured": 74.9
                        },
                        {
                            "date": "2025-10-29",
                            "measured": 67.8
                        },
                        {
                            "date": "2025-10-30",
                            "measured": 64.3
                        },
                        {
                            "date": "2025-10-31",
                            "measured": 61.7
                        },
                        {
                            "date": "2025-11-01",
                            "measured": 55.9
                        },
                        {
                            "date": "2025-11-02",
                            "measured": 61.2
                        },
                        {
                            "date": "2025-11-03",
                            "measured": 71.0
                        },
                        {
                            "date": "2025-11-04",
                            "measured": 69.1
                        },
                        {
                            "date": "2025-11-05",
                            "measured": 70.0
                        },
                        {
                            "date": "2025-11-06",
                            "measured": 66.8
                        },
                        {
                            "date": "2025-11-07",
                            "measured": 61.8
                        },
                        {
                            "date": "2025-11-08",
                            "measured": 59.2
                        },
                        {
                            "date": "2025-11-09",
                            "measured": 61.4
                        },
                        {
                            "date": "2025-11-10",
                            "measured": 67.3
                        },
                        {
                            "date": "2025-11-11",
                            "measured": 67.3
                        },
                        {
                            "date": "2025-11-12",
                            "measured": 67.8
                        },
                        {
                            "date": "2025-11-13",
                            "measured": 69.7
                        },
                        {
                            "date": "2025-11-14",
                            "measured": 63.7
                        },
                        {
                            "date": "2025-11-15",
                            "measured": 62.6
                        },
                        {
                            "date": "2025-11-16",
                            "measured": 60.6
                        },
                        {
                            "date": "2025-11-17",
                            "measured": 69.3
                        },
                        {
                            "date": "2025-11-18",
                            "measured": 67.9
                        },
                        {
                            "date": "2025-11-19",
                            "measured": 60.6
                        },
                        {
                            "date": "2025-11-20",
                            "measured": 72.9
                        },
                        {
                            "date": "2025-11-21",
                            "measured": 66.2
                        },
                        {
                            "date": "2025-11-22",
                            "measured": 61.2
                        },
                        {
                            "date": "2025-11-23",
                            "measured": 65.4
                        },
                        {
                            "date": "2025-11-24",
                            "measured": 72.6
                        },
                        {
                            "date": "2025-11-25",
                            "measured": 68.7
                        },
                        {
                            "date": "2025-11-26",
                            "measured": 65.5
                        },
                        {
                            "date": "2025-11-27",
                            "measured": 64.5
                        },
                        {
                            "date": "2025-11-28",
                            "measured": 62.9
                        },
                        {
                            "date": "2025-11-29",
                            "measured": 56.5
                        },
                        {
                            "date": "2025-11-30",
                            "measured": 62.6
                        },
                        {
                            "date": "2025-12-01",
                            "measured": 70.1
                        },
                        {
                            "date": "2025-12-02",
                            "measured": 71.2
                        },
                        {
                            "date": "2025-12-03",
                            "measured": 66.2
                        },
                        {
                            "date": "2025-12-04",
                            "measured": 68.7
                        },
                        {
                            "date": "2025-12-05",
                            "measured": 65.2
                        },
                        {
                            "date": "2025-12-06",
                            "measured": 65.7
                        },
                        {
                            "date": "2025-12-07",
                            "measured": 70.5
                        },
                        {
                            "date": "2025-12-08",
                            "measured": 75.9
                        },
                        {
                            "date": "2025-12-09",
                            "measured": 68.6
                        },
                        {
                            "date": "2025-12-10",
                            "measured": 65.6
                        },
                        {
                            "date": "2025-12-11",
                            "measured": 65.7
                        },
                        {
                            "date": "2025-12-12",
                            "measured": 59.9
                        },
                        {
                            "date": "2025-12-13",
                            "measured": 52.3
                        },
                        {
                            "date": "2025-12-14",
                            "measured": 59.0
                        },
                        {
                            "date": "2025-12-15",
                            "measured": 68.1
                        },
                        {
                            "date": "2025-12-16",
                            "measured": 65.1
                        },
                        {
                            "date": "2025-12-17",
                            "measured": 64.7
                        },
                        {
                            "date": "2025-12-18",
                            "measured": 64.7
                        },
                        {
                            "date": "2025-12-19",
                            "measured": 63.0
                        },
                        {
                            "date": "2025-12-20",
                            "measured": 64.2
                        }
                    ]
                },
                {
                    "kpi_key": "percentage_parked_longer_then_3_days",
                    "granularity": "day",
                    "values": [
                        {
                            "date": "2025-09-16",
                            "measured": 43.4
                        },
                        {
                            "date": "2025-09-17",
                            "measured": 47.3
                        },
                        {
                            "date": "2025-09-18",
                            "measured": 47.3
                        },
                        {
                            "date": "2025-09-19",
                            "measured": 44.9
                        },
                        {
                            "date": "2025-09-20",
                            "measured": 41.3
                        },
                        {
                            "date": "2025-09-21",
                            "measured": 39.7
                        },
                        {
                            "date": "2025-09-22",
                            "measured": 41.5
                        },
                        {
                            "date": "2025-09-23",
                            "measured": 44.7
                        },
                        {
                            "date": "2025-09-24",
                            "measured": 49.4
                        },
                        {
                            "date": "2025-09-25",
                            "measured": 50.2
                        },
                        {
                            "date": "2025-09-26",
                            "measured": 47.8
                        },
                        {
                            "date": "2025-09-27",
                            "measured": 44.5
                        },
                        {
                            "date": "2025-09-28",
                            "measured": 43.1
                        },
                        {
                            "date": "2025-09-29",
                            "measured": 43.3
                        },
                        {
                            "date": "2025-09-30",
                            "measured": 47.1
                        },
                        {
                            "date": "2025-10-01",
                            "measured": 49.2
                        },
                        {
                            "date": "2025-10-02",
                            "measured": 48.5
                        },
                        {
                            "date": "2025-10-03",
                            "measured": 42.3
                        },
                        {
                            "date": "2025-10-04",
                            "measured": 41.2
                        },
                        {
                            "date": "2025-10-05",
                            "measured": 42.1
                        },
                        {
                            "date": "2025-10-06",
                            "measured": 43.3
                        },
                        {
                            "date": "2025-10-07",
                            "measured": 44.4
                        },
                        {
                            "date": "2025-10-08",
                            "measured": 44.9
                        },
                        {
                            "date": "2025-10-09",
                            "measured": 45.8
                        },
                        {
                            "date": "2025-10-10",
                            "measured": 42.9
                        },
                        {
                            "date": "2025-10-11",
                            "measured": 35.9
                        },
                        {
                            "date": "2025-10-12",
                            "measured": 36.6
                        },
                        {
                            "date": "2025-10-13",
                            "measured": 34.3
                        },
                        {
                            "date": "2025-10-14",
                            "measured": 37.8
                        },
                        {
                            "date": "2025-10-15",
                            "measured": 33.3
                        },
                        {
                            "date": "2025-10-16",
                            "measured": 29.5
                        },
                        {
                            "date": "2025-10-17",
                            "measured": 30.4
                        },
                        {
                            "date": "2025-10-18",
                            "measured": 32.6
                        },
                        {
                            "date": "2025-10-19",
                            "measured": 32.7
                        },
                        {
                            "date": "2025-10-20",
                            "measured": 31.9
                        },
                        {
                            "date": "2025-10-21",
                            "measured": 37.8
                        },
                        {
                            "date": "2025-10-22",
                            "measured": 39.4
                        },
                        {
                            "date": "2025-10-23",
                            "measured": 39.8
                        },
                        {
                            "date": "2025-10-24",
                            "measured": 41.1
                        },
                        {
                            "date": "2025-10-25",
                            "measured": 41.1
                        },
                        {
                            "date": "2025-10-26",
                            "measured": 41.6
                        },
                        {
                            "date": "2025-10-27",
                            "measured": 39.7
                        },
                        {
                            "date": "2025-10-28",
                            "measured": 44.7
                        },
                        {
                            "date": "2025-10-29",
                            "measured": 43.0
                        },
                        {
                            "date": "2025-10-30",
                            "measured": 38.5
                        },
                        {
                            "date": "2025-10-31",
                            "measured": 35.5
                        },
                        {
                            "date": "2025-11-01",
                            "measured": 34.0
                        },
                        {
                            "date": "2025-11-02",
                            "measured": 32.1
                        },
                        {
                            "date": "2025-11-03",
                            "measured": 33.7
                        },
                        {
                            "date": "2025-11-04",
                            "measured": 37.5
                        },
                        {
                            "date": "2025-11-05",
                            "measured": 43.4
                        },
                        {
                            "date": "2025-11-06",
                            "measured": 42.5
                        },
                        {
                            "date": "2025-11-07",
                            "measured": 38.7
                        },
                        {
                            "date": "2025-11-08",
                            "measured": 34.5
                        },
                        {
                            "date": "2025-11-09",
                            "measured": 33.5
                        },
                        {
                            "date": "2025-11-10",
                            "measured": 32.7
                        },
                        {
                            "date": "2025-11-11",
                            "measured": 34.4
                        },
                        {
                            "date": "2025-11-12",
                            "measured": 39.1
                        },
                        {
                            "date": "2025-11-13",
                            "measured": 40.7
                        },
                        {
                            "date": "2025-11-14",
                            "measured": 40.1
                        },
                        {
                            "date": "2025-11-15",
                            "measured": 39.2
                        },
                        {
                            "date": "2025-11-16",
                            "measured": 35.8
                        },
                        {
                            "date": "2025-11-17",
                            "measured": 33.8
                        },
                        {
                            "date": "2025-11-18",
                            "measured": 35.8
                        },
                        {
                            "date": "2025-11-19",
                            "measured": 36.5
                        },
                        {
                            "date": "2025-11-20",
                            "measured": 38.9
                        },
                        {
                            "date": "2025-11-21",
                            "measured": 39.2
                        },
                        {
                            "date": "2025-11-22",
                            "measured": 39.4
                        },
                        {
                            "date": "2025-11-23",
                            "measured": 37.0
                        },
                        {
                            "date": "2025-11-24",
                            "measured": 34.7
                        },
                        {
                            "date": "2025-11-25",
                            "measured": 37.2
                        },
                        {
                            "date": "2025-11-26",
                            "measured": 39.8
                        },
                        {
                            "date": "2025-11-27",
                            "measured": 36.1
                        },
                        {
                            "date": "2025-11-28",
                            "measured": 36.1
                        },
                        {
                            "date": "2025-11-29",
                            "measured": 32.4
                        },
                        {
                            "date": "2025-11-30",
                            "measured": 30.2
                        },
                        {
                            "date": "2025-12-01",
                            "measured": 33.0
                        },
                        {
                            "date": "2025-12-02",
                            "measured": 40.0
                        },
                        {
                            "date": "2025-12-03",
                            "measured": 44.2
                        },
                        {
                            "date": "2025-12-04",
                            "measured": 42.9
                        },
                        {
                            "date": "2025-12-05",
                            "measured": 39.6
                        },
                        {
                            "date": "2025-12-06",
                            "measured": 39.2
                        },
                        {
                            "date": "2025-12-07",
                            "measured": 40.4
                        },
                        {
                            "date": "2025-12-08",
                            "measured": 42.4
                        },
                        {
                            "date": "2025-12-09",
                            "measured": 41.6
                        },
                        {
                            "date": "2025-12-10",
                            "measured": 41.5
                        },
                        {
                            "date": "2025-12-11",
                            "measured": 39.2
                        },
                        {
                            "date": "2025-12-12",
                            "measured": 35.7
                        },
                        {
                            "date": "2025-12-13",
                            "measured": 30.0
                        },
                        {
                            "date": "2025-12-14",
                            "measured": 27.2
                        },
                        {
                            "date": "2025-12-15",
                            "measured": 29.0
                        },
                        {
                            "date": "2025-12-16",
                            "measured": 34.8
                        },
                        {
                            "date": "2025-12-17",
                            "measured": 37.2
                        },
                        {
                            "date": "2025-12-18",
                            "measured": 36.6
                        },
                        {
                            "date": "2025-12-19",
                            "measured": 35.8
                        },
                        {
                            "date": "2025-12-20",
                            "measured": 35.9
                        }
                    ]
                },
                {
                    "kpi_key": "percentage_parked_longer_then_7_days",
                    "granularity": "day",
                    "values": [
                        {
                            "date": "2025-09-16",
                            "measured": 23.3
                        },
                        {
                            "date": "2025-09-17",
                            "measured": 23.2
                        },
                        {
                            "date": "2025-09-18",
                            "measured": 23.0
                        },
                        {
                            "date": "2025-09-19",
                            "measured": 23.9
                        },
                        {
                            "date": "2025-09-20",
                            "measured": 23.4
                        },
                        {
                            "date": "2025-09-21",
                            "measured": 26.3
                        },
                        {
                            "date": "2025-09-22",
                            "measured": 26.1
                        },
                        {
                            "date": "2025-09-23",
                            "measured": 25.7
                        },
                        {
                            "date": "2025-09-24",
                            "measured": 24.7
                        },
                        {
                            "date": "2025-09-25",
                            "measured": 25.7
                        },
                        {
                            "date": "2025-09-26",
                            "measured": 26.0
                        },
                        {
                            "date": "2025-09-27",
                            "measured": 25.6
                        },
                        {
                            "date": "2025-09-28",
                            "measured": 28.7
                        },
                        {
                            "date": "2025-09-29",
                            "measured": 28.8
                        },
                        {
                            "date": "2025-09-30",
                            "measured": 29.6
                        },
                        {
                            "date": "2025-10-01",
                            "measured": 29.2
                        },
                        {
                            "date": "2025-10-02",
                            "measured": 28.3
                        },
                        {
                            "date": "2025-10-03",
                            "measured": 25.9
                        },
                        {
                            "date": "2025-10-04",
                            "measured": 23.5
                        },
                        {
                            "date": "2025-10-05",
                            "measured": 25.3
                        },
                        {
                            "date": "2025-10-06",
                            "measured": 23.0
                        },
                        {
                            "date": "2025-10-07",
                            "measured": 21.0
                        },
                        {
                            "date": "2025-10-08",
                            "measured": 22.0
                        },
                        {
                            "date": "2025-10-09",
                            "measured": 22.1
                        },
                        {
                            "date": "2025-10-10",
                            "measured": 23.9
                        },
                        {
                            "date": "2025-10-11",
                            "measured": 21.5
                        },
                        {
                            "date": "2025-10-12",
                            "measured": 22.3
                        },
                        {
                            "date": "2025-10-13",
                            "measured": 19.9
                        },
                        {
                            "date": "2025-10-14",
                            "measured": 18.6
                        },
                        {
                            "date": "2025-10-15",
                            "measured": 15.4
                        },
                        {
                            "date": "2025-10-16",
                            "measured": 13.3
                        },
                        {
                            "date": "2025-10-17",
                            "measured": 12.0
                        },
                        {
                            "date": "2025-10-18",
                            "measured": 12.6
                        },
                        {
                            "date": "2025-10-19",
                            "measured": 12.8
                        },
                        {
                            "date": "2025-10-20",
                            "measured": 11.8
                        },
                        {
                            "date": "2025-10-21",
                            "measured": 12.7
                        },
                        {
                            "date": "2025-10-22",
                            "measured": 14.8
                        },
                        {
                            "date": "2025-10-23",
                            "measured": 14.4
                        },
                        {
                            "date": "2025-10-24",
                            "measured": 16.2
                        },
                        {
                            "date": "2025-10-25",
                            "measured": 18.8
                        },
                        {
                            "date": "2025-10-26",
                            "measured": 21.0
                        },
                        {
                            "date": "2025-10-27",
                            "measured": 20.7
                        },
                        {
                            "date": "2025-10-28",
                            "measured": 20.7
                        },
                        {
                            "date": "2025-10-29",
                            "measured": 20.7
                        },
                        {
                            "date": "2025-10-30",
                            "measured": 17.2
                        },
                        {
                            "date": "2025-10-31",
                            "measured": 17.3
                        },
                        {
                            "date": "2025-11-01",
                            "measured": 17.6
                        },
                        {
                            "date": "2025-11-02",
                            "measured": 17.1
                        },
                        {
                            "date": "2025-11-03",
                            "measured": 17.5
                        },
                        {
                            "date": "2025-11-04",
                            "measured": 16.1
                        },
                        {
                            "date": "2025-11-05",
                            "measured": 16.1
                        },
                        {
                            "date": "2025-11-06",
                            "measured": 16.2
                        },
                        {
                            "date": "2025-11-07",
                            "measured": 14.5
                        },
                        {
                            "date": "2025-11-08",
                            "measured": 17.0
                        },
                        {
                            "date": "2025-11-09",
                            "measured": 17.7
                        },
                        {
                            "date": "2025-11-10",
                            "measured": 16.2
                        },
                        {
                            "date": "2025-11-11",
                            "measured": 15.7
                        },
                        {
                            "date": "2025-11-12",
                            "measured": 15.3
                        },
                        {
                            "date": "2025-11-13",
                            "measured": 16.2
                        },
                        {
                            "date": "2025-11-14",
                            "measured": 15.4
                        },
                        {
                            "date": "2025-11-15",
                            "measured": 16.4
                        },
                        {
                            "date": "2025-11-16",
                            "measured": 17.6
                        },
                        {
                            "date": "2025-11-17",
                            "measured": 16.5
                        },
                        {
                            "date": "2025-11-18",
                            "measured": 16.2
                        },
                        {
                            "date": "2025-11-19",
                            "measured": 13.9
                        },
                        {
                            "date": "2025-11-20",
                            "measured": 14.0
                        },
                        {
                            "date": "2025-11-21",
                            "measured": 15.0
                        },
                        {
                            "date": "2025-11-22",
                            "measured": 15.4
                        },
                        {
                            "date": "2025-11-23",
                            "measured": 18.4
                        },
                        {
                            "date": "2025-11-24",
                            "measured": 15.7
                        },
                        {
                            "date": "2025-11-25",
                            "measured": 15.1
                        },
                        {
                            "date": "2025-11-26",
                            "measured": 16.2
                        },
                        {
                            "date": "2025-11-27",
                            "measured": 14.9
                        },
                        {
                            "date": "2025-11-28",
                            "measured": 15.6
                        },
                        {
                            "date": "2025-11-29",
                            "measured": 15.1
                        },
                        {
                            "date": "2025-11-30",
                            "measured": 15.0
                        },
                        {
                            "date": "2025-12-01",
                            "measured": 13.3
                        },
                        {
                            "date": "2025-12-02",
                            "measured": 14.6
                        },
                        {
                            "date": "2025-12-03",
                            "measured": 16.1
                        },
                        {
                            "date": "2025-12-04",
                            "measured": 18.0
                        },
                        {
                            "date": "2025-12-05",
                            "measured": 20.5
                        },
                        {
                            "date": "2025-12-06",
                            "measured": 21.3
                        },
                        {
                            "date": "2025-12-07",
                            "measured": 21.7
                        },
                        {
                            "date": "2025-12-08",
                            "measured": 18.4
                        },
                        {
                            "date": "2025-12-09",
                            "measured": 15.3
                        },
                        {
                            "date": "2025-12-10",
                            "measured": 16.3
                        },
                        {
                            "date": "2025-12-11",
                            "measured": 17.0
                        },
                        {
                            "date": "2025-12-12",
                            "measured": 17.0
                        },
                        {
                            "date": "2025-12-13",
                            "measured": 14.8
                        },
                        {
                            "date": "2025-12-14",
                            "measured": 14.5
                        },
                        {
                            "date": "2025-12-15",
                            "measured": 13.5
                        },
                        {
                            "date": "2025-12-16",
                            "measured": 13.2
                        },
                        {
                            "date": "2025-12-17",
                            "measured": 13.2
                        },
                        {
                            "date": "2025-12-18",
                            "measured": 12.8
                        },
                        {
                            "date": "2025-12-19",
                            "measured": 13.4
                        },
                        {
                            "date": "2025-12-20",
                            "measured": 16.2
                        }
                    ]
                },
                {
                    "kpi_key": "percentage_parked_longer_then_14_days",
                    "granularity": "day",
                    "values": [
                        {
                            "date": "2025-09-16",
                            "measured": 10.7
                        },
                        {
                            "date": "2025-09-17",
                            "measured": 10.4
                        },
                        {
                            "date": "2025-09-18",
                            "measured": 10.1
                        },
                        {
                            "date": "2025-09-19",
                            "measured": 10.8
                        },
                        {
                            "date": "2025-09-20",
                            "measured": 11.3
                        },
                        {
                            "date": "2025-09-21",
                            "measured": 12.1
                        },
                        {
                            "date": "2025-09-22",
                            "measured": 12.0
                        },
                        {
                            "date": "2025-09-23",
                            "measured": 12.2
                        },
                        {
                            "date": "2025-09-24",
                            "measured": 12.2
                        },
                        {
                            "date": "2025-09-25",
                            "measured": 12.6
                        },
                        {
                            "date": "2025-09-26",
                            "measured": 12.2
                        },
                        {
                            "date": "2025-09-27",
                            "measured": 11.6
                        },
                        {
                            "date": "2025-09-28",
                            "measured": 12.7
                        },
                        {
                            "date": "2025-09-29",
                            "measured": 13.4
                        },
                        {
                            "date": "2025-09-30",
                            "measured": 13.5
                        },
                        {
                            "date": "2025-10-01",
                            "measured": 13.8
                        },
                        {
                            "date": "2025-10-02",
                            "measured": 13.7
                        },
                        {
                            "date": "2025-10-03",
                            "measured": 12.3
                        },
                        {
                            "date": "2025-10-04",
                            "measured": 11.0
                        },
                        {
                            "date": "2025-10-05",
                            "measured": 12.2
                        },
                        {
                            "date": "2025-10-06",
                            "measured": 11.2
                        },
                        {
                            "date": "2025-10-07",
                            "measured": 9.4
                        },
                        {
                            "date": "2025-10-08",
                            "measured": 9.5
                        },
                        {
                            "date": "2025-10-09",
                            "measured": 10.0
                        },
                        {
                            "date": "2025-10-10",
                            "measured": 8.8
                        },
                        {
                            "date": "2025-10-11",
                            "measured": 7.1
                        },
                        {
                            "date": "2025-10-12",
                            "measured": 7.8
                        },
                        {
                            "date": "2025-10-13",
                            "measured": 7.6
                        },
                        {
                            "date": "2025-10-14",
                            "measured": 7.8
                        },
                        {
                            "date": "2025-10-15",
                            "measured": 7.0
                        },
                        {
                            "date": "2025-10-16",
                            "measured": 6.6
                        },
                        {
                            "date": "2025-10-17",
                            "measured": 6.5
                        },
                        {
                            "date": "2025-10-18",
                            "measured": 6.6
                        },
                        {
                            "date": "2025-10-19",
                            "measured": 6.3
                        },
                        {
                            "date": "2025-10-20",
                            "measured": 5.3
                        },
                        {
                            "date": "2025-10-21",
                            "measured": 4.8
                        },
                        {
                            "date": "2025-10-22",
                            "measured": 5.0
                        },
                        {
                            "date": "2025-10-23",
                            "measured": 4.7
                        },
                        {
                            "date": "2025-10-24",
                            "measured": 5.2
                        },
                        {
                            "date": "2025-10-25",
                            "measured": 6.1
                        },
                        {
                            "date": "2025-10-26",
                            "measured": 6.8
                        },
                        {
                            "date": "2025-10-27",
                            "measured": 6.3
                        },
                        {
                            "date": "2025-10-28",
                            "measured": 6.5
                        },
                        {
                            "date": "2025-10-29",
                            "measured": 7.0
                        },
                        {
                            "date": "2025-10-30",
                            "measured": 5.6
                        },
                        {
                            "date": "2025-10-31",
                            "measured": 5.6
                        },
                        {
                            "date": "2025-11-01",
                            "measured": 5.9
                        },
                        {
                            "date": "2025-11-02",
                            "measured": 6.3
                        },
                        {
                            "date": "2025-11-03",
                            "measured": 6.7
                        },
                        {
                            "date": "2025-11-04",
                            "measured": 6.7
                        },
                        {
                            "date": "2025-11-05",
                            "measured": 6.9
                        },
                        {
                            "date": "2025-11-06",
                            "measured": 7.0
                        },
                        {
                            "date": "2025-11-07",
                            "measured": 6.1
                        },
                        {
                            "date": "2025-11-08",
                            "measured": 4.8
                        },
                        {
                            "date": "2025-11-09",
                            "measured": 4.9
                        },
                        {
                            "date": "2025-11-10",
                            "measured": 5.0
                        },
                        {
                            "date": "2025-11-11",
                            "measured": 3.8
                        },
                        {
                            "date": "2025-11-12",
                            "measured": 4.2
                        },
                        {
                            "date": "2025-11-13",
                            "measured": 3.5
                        },
                        {
                            "date": "2025-11-14",
                            "measured": 3.7
                        },
                        {
                            "date": "2025-11-15",
                            "measured": 5.5
                        },
                        {
                            "date": "2025-11-16",
                            "measured": 6.2
                        },
                        {
                            "date": "2025-11-17",
                            "measured": 6.4
                        },
                        {
                            "date": "2025-11-18",
                            "measured": 6.3
                        },
                        {
                            "date": "2025-11-19",
                            "measured": 5.3
                        },
                        {
                            "date": "2025-11-20",
                            "measured": 5.6
                        },
                        {
                            "date": "2025-11-21",
                            "measured": 5.1
                        },
                        {
                            "date": "2025-11-22",
                            "measured": 4.8
                        },
                        {
                            "date": "2025-11-23",
                            "measured": 4.7
                        },
                        {
                            "date": "2025-11-24",
                            "measured": 5.0
                        },
                        {
                            "date": "2025-11-25",
                            "measured": 4.7
                        },
                        {
                            "date": "2025-11-26",
                            "measured": 4.6
                        },
                        {
                            "date": "2025-11-27",
                            "measured": 4.6
                        },
                        {
                            "date": "2025-11-28",
                            "measured": 5.1
                        },
                        {
                            "date": "2025-11-29",
                            "measured": 5.5
                        },
                        {
                            "date": "2025-11-30",
                            "measured": 6.4
                        },
                        {
                            "date": "2025-12-01",
                            "measured": 5.9
                        },
                        {
                            "date": "2025-12-02",
                            "measured": 6.2
                        },
                        {
                            "date": "2025-12-03",
                            "measured": 6.1
                        },
                        {
                            "date": "2025-12-04",
                            "measured": 6.3
                        },
                        {
                            "date": "2025-12-05",
                            "measured": 6.6
                        },
                        {
                            "date": "2025-12-06",
                            "measured": 7.2
                        },
                        {
                            "date": "2025-12-07",
                            "measured": 7.5
                        },
                        {
                            "date": "2025-12-08",
                            "measured": 6.7
                        },
                        {
                            "date": "2025-12-09",
                            "measured": 6.0
                        },
                        {
                            "date": "2025-12-10",
                            "measured": 6.0
                        },
                        {
                            "date": "2025-12-11",
                            "measured": 6.2
                        },
                        {
                            "date": "2025-12-12",
                            "measured": 6.5
                        },
                        {
                            "date": "2025-12-13",
                            "measured": 4.5
                        },
                        {
                            "date": "2025-12-14",
                            "measured": 4.9
                        },
                        {
                            "date": "2025-12-15",
                            "measured": 5.0
                        },
                        {
                            "date": "2025-12-16",
                            "measured": 4.9
                        },
                        {
                            "date": "2025-12-17",
                            "measured": 5.1
                        },
                        {
                            "date": "2025-12-18",
                            "measured": 4.5
                        },
                        {
                            "date": "2025-12-19",
                            "measured": 5.0
                        },
                        {
                            "date": "2025-12-20",
                            "measured": 5.2
                        }
                    ]
                }
            ]
        },
        {
            "operator": "felyx",
            "form_factor": "moped",
            "propulsion_type": "electric",
            "geometry_ref": "cbs:GM0599",
            "kpis": [
                {
                    "kpi_key": "number_of_wrongly_parked_vehicles",
                    "granularity": "day",
                    "values": [
                        {
                            "date": "2025-09-16",
                            "measured": 1546.0
                        },
                        {
                            "date": "2025-09-17",
                            "measured": 1874.0
                        },
                        {
                            "date": "2025-09-18",
                            "measured": 1673.0
                        },
                        {
                            "date": "2025-09-19",
                            "measured": 1986.0
                        },
                        {
                            "date": "2025-09-20",
                            "measured": 2696.0
                        },
                        {
                            "date": "2025-09-21",
                            "measured": 2344.0
                        },
                        {
                            "date": "2025-09-22",
                            "measured": 1770.0
                        },
                        {
                            "date": "2025-09-23",
                            "measured": 1860.0
                        },
                        {
                            "date": "2025-09-24",
                            "measured": 1816.0
                        },
                        {
                            "date": "2025-09-25",
                            "measured": 1820.0
                        },
                        {
                            "date": "2025-09-26",
                            "measured": 2249.0
                        },
                        {
                            "date": "2025-09-27",
                            "measured": 2431.0
                        },
                        {
                            "date": "2025-09-28",
                            "measured": 1995.0
                        },
                        {
                            "date": "2025-09-29",
                            "measured": 1454.0
                        },
                        {
                            "date": "2025-09-30",
                            "measured": 1681.0
                        },
                        {
                            "date": "2025-10-01",
                            "measured": 1627.0
                        },
                        {
                            "date": "2025-10-02",
                            "measured": 2339.0
                        },
                        {
                            "date": "2025-10-03",
                            "measured": 2091.0
                        },
                        {
                            "date": "2025-10-04",
                            "measured": 1807.0
                        },
                        {
                            "date": "2025-10-05",
                            "measured": 1962.0
                        },
                        {
                            "date": "2025-10-06",
                            "measured": 1724.0
                        },
                        {
                            "date": "2025-10-08",
                            "measured": 1745.0
                        },
                        {
                            "date": "2025-10-09",
                            "measured": 1878.0
                        },
                        {
                            "date": "2025-10-10",
                            "measured": 2083.0
                        },
                        {
                            "date": "2025-10-11",
                            "measured": 1911.0
                        },
                        {
                            "date": "2025-10-12",
                            "measured": 1788.0
                        },
                        {
                            "date": "2025-10-13",
                            "measured": 1623.0
                        },
                        {
                            "date": "2025-10-14",
                            "measured": 1619.0
                        },
                        {
                            "date": "2025-10-15",
                            "measured": 1785.0
                        },
                        {
                            "date": "2025-10-16",
                            "measured": 1914.0
                        },
                        {
                            "date": "2025-10-17",
                            "measured": 1963.0
                        },
                        {
                            "date": "2025-10-18",
                            "measured": 2169.0
                        },
                        {
                            "date": "2025-10-19",
                            "measured": 1726.0
                        },
                        {
                            "date": "2025-10-20",
                            "measured": 1465.0
                        },
                        {
                            "date": "2025-10-21",
                            "measured": 1587.0
                        },
                        {
                            "date": "2025-10-22",
                            "measured": 1548.0
                        },
                        {
                            "date": "2025-10-23",
                            "measured": 1587.0
                        },
                        {
                            "date": "2025-10-24",
                            "measured": 1906.0
                        },
                        {
                            "date": "2025-10-25",
                            "measured": 1689.0
                        },
                        {
                            "date": "2025-10-26",
                            "measured": 2086.0
                        },
                        {
                            "date": "2025-10-27",
                            "measured": 1474.0
                        },
                        {
                            "date": "2025-10-28",
                            "measured": 1645.0
                        },
                        {
                            "date": "2025-10-29",
                            "measured": 1534.0
                        },
                        {
                            "date": "2025-10-30",
                            "measured": 1689.0
                        },
                        {
                            "date": "2025-10-31",
                            "measured": 1983.0
                        },
                        {
                            "date": "2025-11-01",
                            "measured": 2087.0
                        },
                        {
                            "date": "2025-11-02",
                            "measured": 1702.0
                        },
                        {
                            "date": "2025-11-03",
                            "measured": 1533.0
                        },
                        {
                            "date": "2025-11-04",
                            "measured": 1810.0
                        },
                        {
                            "date": "2025-11-05",
                            "measured": 1827.0
                        },
                        {
                            "date": "2025-11-06",
                            "measured": 1800.0
                        },
                        {
                            "date": "2025-11-08",
                            "measured": 2156.0
                        },
                        {
                            "date": "2025-11-09",
                            "measured": 1695.0
                        },
                        {
                            "date": "2025-11-10",
                            "measured": 1581.0
                        },
                        {
                            "date": "2025-11-11",
                            "measured": 1682.0
                        },
                        {
                            "date": "2025-11-12",
                            "measured": 1708.0
                        },
                        {
                            "date": "2025-11-13",
                            "measured": 1968.0
                        },
                        {
                            "date": "2025-11-14",
                            "measured": 1876.0
                        },
                        {
                            "date": "2025-11-15",
                            "measured": 1842.0
                        },
                        {
                            "date": "2025-11-16",
                            "measured": 1776.0
                        },
                        {
                            "date": "2025-11-17",
                            "measured": 1480.0
                        },
                        {
                            "date": "2025-11-18",
                            "measured": 1537.0
                        },
                        {
                            "date": "2025-11-19",
                            "measured": 1459.0
                        },
                        {
                            "date": "2025-11-20",
                            "measured": 1632.0
                        },
                        {
                            "date": "2025-11-21",
                            "measured": 1770.0
                        },
                        {
                            "date": "2025-11-22",
                            "measured": 1700.0
                        },
                        {
                            "date": "2025-11-23",
                            "measured": 1506.0
                        },
                        {
                            "date": "2025-11-24",
                            "measured": 1451.0
                        },
                        {
                            "date": "2025-11-25",
                            "measured": 1666.0
                        },
                        {
                            "date": "2025-11-26",
                            "measured": 1593.0
                        },
                        {
                            "date": "2025-11-27",
                            "measured": 1921.0
                        },
                        {
                            "date": "2025-11-28",
                            "measured": 2008.0
                        },
                        {
                            "date": "2025-11-29",
                            "measured": 1940.0
                        },
                        {
                            "date": "2025-11-30",
                            "measured": 1735.0
                        },
                        {
                            "date": "2025-12-01",
                            "measured": 1516.0
                        },
                        {
                            "date": "2025-12-02",
                            "measured": 1609.0
                        },
                        {
                            "date": "2025-12-03",
                            "measured": 1638.0
                        },
                        {
                            "date": "2025-12-04",
                            "measured": 1733.0
                        },
                        {
                            "date": "2025-12-05",
                            "measured": 1584.0
                        },
                        {
                            "date": "2025-12-06",
                            "measured": 1583.0
                        },
                        {
                            "date": "2025-12-07",
                            "measured": 1490.0
                        },
                        {
                            "date": "2025-12-09",
                            "measured": 1506.0
                        },
                        {
                            "date": "2025-12-10",
                            "measured": 1562.0
                        },
                        {
                            "date": "2025-12-11",
                            "measured": 1728.0
                        },
                        {
                            "date": "2025-12-12",
                            "measured": 1803.0
                        },
                        {
                            "date": "2025-12-13",
                            "measured": 1771.0
                        },
                        {
                            "date": "2025-12-14",
                            "measured": 1931.0
                        },
                        {
                            "date": "2025-12-15",
                            "measured": 1452.0
                        },
                        {
                            "date": "2025-12-16",
                            "measured": 1550.0
                        },
                        {
                            "date": "2025-12-17",
                            "measured": 1756.0
                        },
                        {
                            "date": "2025-12-18",
                            "measured": 1584.0
                        },
                        {
                            "date": "2025-12-19",
                            "measured": 1607.0
                        },
                        {
                            "date": "2025-12-20",
                            "measured": 1500.0
                        }
                    ]
                },
                {
                    "kpi_key": "vehicle_cap",
                    "granularity": "day",
                    "values": [
                        {
                            "date": "2025-09-16",
                            "measured": 1224.0
                        },
                        {
                            "date": "2025-09-17",
                            "measured": 1222.0
                        },
                        {
                            "date": "2025-09-18",
                            "measured": 1217.0
                        },
                        {
                            "date": "2025-09-19",
                            "measured": 1220.0
                        },
                        {
                            "date": "2025-09-20",
                            "measured": 1223.0
                        },
                        {
                            "date": "2025-09-21",
                            "measured": 1231.0
                        },
                        {
                            "date": "2025-09-22",
                            "measured": 1246.0
                        },
                        {
                            "date": "2025-09-23",
                            "measured": 1224.0
                        },
                        {
                            "date": "2025-09-24",
                            "measured": 1234.0
                        },
                        {
                            "date": "2025-09-25",
                            "measured": 1229.0
                        },
                        {
                            "date": "2025-09-26",
                            "measured": 1228.0
                        },
                        {
                            "date": "2025-09-27",
                            "measured": 1215.0
                        },
                        {
                            "date": "2025-09-28",
                            "measured": 1209.0
                        },
                        {
                            "date": "2025-09-29",
                            "measured": 1216.0
                        },
                        {
                            "date": "2025-09-30",
                            "measured": 1234.0
                        },
                        {
                            "date": "2025-10-01",
                            "measured": 1236.0
                        },
                        {
                            "date": "2025-10-02",
                            "measured": 1253.0
                        },
                        {
                            "date": "2025-10-03",
                            "measured": 1268.0
                        },
                        {
                            "date": "2025-10-04",
                            "measured": 1276.0
                        },
                        {
                            "date": "2025-10-05",
                            "measured": 1279.0
                        },
                        {
                            "date": "2025-10-06",
                            "measured": 1264.0
                        },
                        {
                            "date": "2025-10-07",
                            "measured": 1260.0
                        },
                        {
                            "date": "2025-10-08",
                            "measured": 1267.0
                        },
                        {
                            "date": "2025-10-09",
                            "measured": 1264.0
                        },
                        {
                            "date": "2025-10-10",
                            "measured": 1241.0
                        },
                        {
                            "date": "2025-10-11",
                            "measured": 1264.0
                        },
                        {
                            "date": "2025-10-12",
                            "measured": 1260.0
                        },
                        {
                            "date": "2025-10-13",
                            "measured": 1261.0
                        },
                        {
                            "date": "2025-10-14",
                            "measured": 1241.0
                        },
                        {
                            "date": "2025-10-15",
                            "measured": 1246.0
                        },
                        {
                            "date": "2025-10-16",
                            "measured": 1254.0
                        },
                        {
                            "date": "2025-10-17",
                            "measured": 1262.0
                        },
                        {
                            "date": "2025-10-18",
                            "measured": 1249.0
                        },
                        {
                            "date": "2025-10-19",
                            "measured": 1266.0
                        },
                        {
                            "date": "2025-10-20",
                            "measured": 1279.0
                        },
                        {
                            "date": "2025-10-21",
                            "measured": 1264.0
                        },
                        {
                            "date": "2025-10-22",
                            "measured": 1270.0
                        },
                        {
                            "date": "2025-10-23",
                            "measured": 1300.0
                        },
                        {
                            "date": "2025-10-24",
                            "measured": 1317.0
                        },
                        {
                            "date": "2025-10-25",
                            "measured": 1329.0
                        },
                        {
                            "date": "2025-10-26",
                            "measured": 1324.0
                        },
                        {
                            "date": "2025-10-27",
                            "measured": 1314.0
                        },
                        {
                            "date": "2025-10-28",
                            "measured": 1298.0
                        },
                        {
                            "date": "2025-10-29",
                            "measured": 1310.0
                        },
                        {
                            "date": "2025-10-30",
                            "measured": 1310.0
                        },
                        {
                            "date": "2025-10-31",
                            "measured": 1302.0
                        },
                        {
                            "date": "2025-11-01",
                            "measured": 1319.0
                        },
                        {
                            "date": "2025-11-02",
                            "measured": 1312.0
                        },
                        {
                            "date": "2025-11-03",
                            "measured": 1317.0
                        },
                        {
                            "date": "2025-11-04",
                            "measured": 1337.0
                        },
                        {
                            "date": "2025-11-05",
                            "measured": 1351.0
                        },
                        {
                            "date": "2025-11-06",
                            "measured": 1325.0
                        },
                        {
                            "date": "2025-11-07",
                            "measured": 1322.0
                        },
                        {
                            "date": "2025-11-08",
                            "measured": 1321.0
                        },
                        {
                            "date": "2025-11-09",
                            "measured": 1310.0
                        },
                        {
                            "date": "2025-11-10",
                            "measured": 1314.0
                        },
                        {
                            "date": "2025-11-11",
                            "measured": 1332.0
                        },
                        {
                            "date": "2025-11-12",
                            "measured": 1357.0
                        },
                        {
                            "date": "2025-11-13",
                            "measured": 1355.0
                        },
                        {
                            "date": "2025-11-14",
                            "measured": 1356.0
                        },
                        {
                            "date": "2025-11-15",
                            "measured": 1355.0
                        },
                        {
                            "date": "2025-11-16",
                            "measured": 1339.0
                        },
                        {
                            "date": "2025-11-17",
                            "measured": 1349.0
                        },
                        {
                            "date": "2025-11-18",
                            "measured": 1355.0
                        },
                        {
                            "date": "2025-11-19",
                            "measured": 1361.0
                        },
                        {
                            "date": "2025-11-20",
                            "measured": 1370.0
                        },
                        {
                            "date": "2025-11-21",
                            "measured": 1395.0
                        },
                        {
                            "date": "2025-11-22",
                            "measured": 1385.0
                        },
                        {
                            "date": "2025-11-23",
                            "measured": 1368.0
                        },
                        {
                            "date": "2025-11-24",
                            "measured": 1364.0
                        },
                        {
                            "date": "2025-11-25",
                            "measured": 1357.0
                        },
                        {
                            "date": "2025-11-26",
                            "measured": 1374.0
                        },
                        {
                            "date": "2025-11-27",
                            "measured": 1388.0
                        },
                        {
                            "date": "2025-11-28",
                            "measured": 1376.0
                        },
                        {
                            "date": "2025-11-29",
                            "measured": 1381.0
                        },
                        {
                            "date": "2025-11-30",
                            "measured": 1356.0
                        },
                        {
                            "date": "2025-12-01",
                            "measured": 1354.0
                        },
                        {
                            "date": "2025-12-02",
                            "measured": 1346.0
                        },
                        {
                            "date": "2025-12-03",
                            "measured": 1364.0
                        },
                        {
                            "date": "2025-12-04",
                            "measured": 1354.0
                        },
                        {
                            "date": "2025-12-05",
                            "measured": 1333.0
                        },
                        {
                            "date": "2025-12-06",
                            "measured": 1330.0
                        },
                        {
                            "date": "2025-12-07",
                            "measured": 1321.0
                        },
                        {
                            "date": "2025-12-08",
                            "measured": 1330.0
                        },
                        {
                            "date": "2025-12-09",
                            "measured": 1340.0
                        },
                        {
                            "date": "2025-12-10",
                            "measured": 1310.0
                        },
                        {
                            "date": "2025-12-11",
                            "measured": 1304.0
                        },
                        {
                            "date": "2025-12-12",
                            "measured": 1297.0
                        },
                        {
                            "date": "2025-12-13",
                            "measured": 1273.0
                        },
                        {
                            "date": "2025-12-14",
                            "measured": 1296.0
                        },
                        {
                            "date": "2025-12-15",
                            "measured": 1301.0
                        },
                        {
                            "date": "2025-12-16",
                            "measured": 1288.0
                        },
                        {
                            "date": "2025-12-17",
                            "measured": 1304.0
                        },
                        {
                            "date": "2025-12-18",
                            "measured": 1291.0
                        },
                        {
                            "date": "2025-12-19",
                            "measured": 1298.0
                        },
                        {
                            "date": "2025-12-20",
                            "measured": 1307.0
                        }
                    ]
                },
                {
                    "kpi_key": "percentage_parked_longer_then_24_hours",
                    "granularity": "day",
                    "values": [
                        {
                            "date": "2025-09-16",
                            "measured": 56.2
                        },
                        {
                            "date": "2025-09-17",
                            "measured": 54.0
                        },
                        {
                            "date": "2025-09-18",
                            "measured": 48.8
                        },
                        {
                            "date": "2025-09-19",
                            "measured": 58.8
                        },
                        {
                            "date": "2025-09-20",
                            "measured": 53.5
                        },
                        {
                            "date": "2025-09-21",
                            "measured": 55.9
                        },
                        {
                            "date": "2025-09-22",
                            "measured": 57.5
                        },
                        {
                            "date": "2025-09-23",
                            "measured": 55.1
                        },
                        {
                            "date": "2025-09-24",
                            "measured": 51.7
                        },
                        {
                            "date": "2025-09-25",
                            "measured": 54.4
                        },
                        {
                            "date": "2025-09-26",
                            "measured": 54.6
                        },
                        {
                            "date": "2025-09-27",
                            "measured": 49.8
                        },
                        {
                            "date": "2025-09-28",
                            "measured": 52.4
                        },
                        {
                            "date": "2025-09-29",
                            "measured": 58.0
                        },
                        {
                            "date": "2025-09-30",
                            "measured": 59.5
                        },
                        {
                            "date": "2025-10-01",
                            "measured": 54.2
                        },
                        {
                            "date": "2025-10-02",
                            "measured": 53.6
                        },
                        {
                            "date": "2025-10-03",
                            "measured": 48.0
                        },
                        {
                            "date": "2025-10-04",
                            "measured": 56.3
                        },
                        {
                            "date": "2025-10-05",
                            "measured": 60.9
                        },
                        {
                            "date": "2025-10-06",
                            "measured": 55.5
                        },
                        {
                            "date": "2025-10-07",
                            "measured": 55.6
                        },
                        {
                            "date": "2025-10-08",
                            "measured": 50.3
                        },
                        {
                            "date": "2025-10-09",
                            "measured": 50.8
                        },
                        {
                            "date": "2025-10-10",
                            "measured": 49.4
                        },
                        {
                            "date": "2025-10-11",
                            "measured": 47.1
                        },
                        {
                            "date": "2025-10-12",
                            "measured": 54.5
                        },
                        {
                            "date": "2025-10-13",
                            "measured": 57.1
                        },
                        {
                            "date": "2025-10-14",
                            "measured": 55.9
                        },
                        {
                            "date": "2025-10-15",
                            "measured": 52.5
                        },
                        {
                            "date": "2025-10-16",
                            "measured": 52.0
                        },
                        {
                            "date": "2025-10-17",
                            "measured": 52.3
                        },
                        {
                            "date": "2025-10-18",
                            "measured": 47.7
                        },
                        {
                            "date": "2025-10-19",
                            "measured": 49.2
                        },
                        {
                            "date": "2025-10-20",
                            "measured": 56.0
                        },
                        {
                            "date": "2025-10-21",
                            "measured": 54.9
                        },
                        {
                            "date": "2025-10-22",
                            "measured": 51.1
                        },
                        {
                            "date": "2025-10-23",
                            "measured": 51.8
                        },
                        {
                            "date": "2025-10-24",
                            "measured": 49.2
                        },
                        {
                            "date": "2025-10-25",
                            "measured": 43.8
                        },
                        {
                            "date": "2025-10-26",
                            "measured": 53.0
                        },
                        {
                            "date": "2025-10-27",
                            "measured": 48.9
                        },
                        {
                            "date": "2025-10-28",
                            "measured": 54.0
                        },
                        {
                            "date": "2025-10-29",
                            "measured": 51.4
                        },
                        {
                            "date": "2025-10-30",
                            "measured": 50.5
                        },
                        {
                            "date": "2025-10-31",
                            "measured": 51.5
                        },
                        {
                            "date": "2025-11-01",
                            "measured": 44.9
                        },
                        {
                            "date": "2025-11-02",
                            "measured": 51.0
                        },
                        {
                            "date": "2025-11-03",
                            "measured": 59.5
                        },
                        {
                            "date": "2025-11-04",
                            "measured": 57.3
                        },
                        {
                            "date": "2025-11-05",
                            "measured": 51.7
                        },
                        {
                            "date": "2025-11-06",
                            "measured": 53.5
                        },
                        {
                            "date": "2025-11-07",
                            "measured": 50.9
                        },
                        {
                            "date": "2025-11-08",
                            "measured": 48.6
                        },
                        {
                            "date": "2025-11-09",
                            "measured": 47.9
                        },
                        {
                            "date": "2025-11-10",
                            "measured": 60.6
                        },
                        {
                            "date": "2025-11-11",
                            "measured": 56.0
                        },
                        {
                            "date": "2025-11-12",
                            "measured": 52.1
                        },
                        {
                            "date": "2025-11-13",
                            "measured": 53.3
                        },
                        {
                            "date": "2025-11-14",
                            "measured": 55.1
                        },
                        {
                            "date": "2025-11-15",
                            "measured": 53.7
                        },
                        {
                            "date": "2025-11-16",
                            "measured": 56.7
                        },
                        {
                            "date": "2025-11-17",
                            "measured": 62.5
                        },
                        {
                            "date": "2025-11-18",
                            "measured": 61.1
                        },
                        {
                            "date": "2025-11-19",
                            "measured": 58.1
                        },
                        {
                            "date": "2025-11-20",
                            "measured": 60.2
                        },
                        {
                            "date": "2025-11-21",
                            "measured": 54.6
                        },
                        {
                            "date": "2025-11-22",
                            "measured": 52.5
                        },
                        {
                            "date": "2025-11-23",
                            "measured": 55.5
                        },
                        {
                            "date": "2025-11-24",
                            "measured": 62.5
                        },
                        {
                            "date": "2025-11-25",
                            "measured": 55.5
                        },
                        {
                            "date": "2025-11-26",
                            "measured": 52.9
                        },
                        {
                            "date": "2025-11-27",
                            "measured": 53.0
                        },
                        {
                            "date": "2025-11-28",
                            "measured": 49.0
                        },
                        {
                            "date": "2025-11-29",
                            "measured": 50.7
                        },
                        {
                            "date": "2025-11-30",
                            "measured": 55.5
                        },
                        {
                            "date": "2025-12-01",
                            "measured": 60.6
                        },
                        {
                            "date": "2025-12-02",
                            "measured": 59.1
                        },
                        {
                            "date": "2025-12-03",
                            "measured": 56.2
                        },
                        {
                            "date": "2025-12-04",
                            "measured": 56.9
                        },
                        {
                            "date": "2025-12-05",
                            "measured": 53.0
                        },
                        {
                            "date": "2025-12-06",
                            "measured": 55.9
                        },
                        {
                            "date": "2025-12-07",
                            "measured": 60.5
                        },
                        {
                            "date": "2025-12-08",
                            "measured": 66.1
                        },
                        {
                            "date": "2025-12-09",
                            "measured": 60.3
                        },
                        {
                            "date": "2025-12-10",
                            "measured": 57.8
                        },
                        {
                            "date": "2025-12-11",
                            "measured": 55.8
                        },
                        {
                            "date": "2025-12-12",
                            "measured": 52.7
                        },
                        {
                            "date": "2025-12-13",
                            "measured": 48.8
                        },
                        {
                            "date": "2025-12-14",
                            "measured": 52.7
                        },
                        {
                            "date": "2025-12-15",
                            "measured": 52.3
                        },
                        {
                            "date": "2025-12-16",
                            "measured": 58.8
                        },
                        {
                            "date": "2025-12-17",
                            "measured": 53.3
                        },
                        {
                            "date": "2025-12-18",
                            "measured": 49.9
                        },
                        {
                            "date": "2025-12-19",
                            "measured": 51.6
                        },
                        {
                            "date": "2025-12-20",
                            "measured": 50.2
                        }
                    ]
                },
                {
                    "kpi_key": "percentage_parked_longer_then_3_days",
                    "granularity": "day",
                    "values": [
                        {
                            "date": "2025-09-16",
                            "measured": 32.8
                        },
                        {
                            "date": "2025-09-17",
                            "measured": 35.5
                        },
                        {
                            "date": "2025-09-18",
                            "measured": 32.4
                        },
                        {
                            "date": "2025-09-19",
                            "measured": 32.3
                        },
                        {
                            "date": "2025-09-20",
                            "measured": 30.8
                        },
                        {
                            "date": "2025-09-21",
                            "measured": 35.4
                        },
                        {
                            "date": "2025-09-22",
                            "measured": 34.9
                        },
                        {
                            "date": "2025-09-23",
                            "measured": 34.9
                        },
                        {
                            "date": "2025-09-24",
                            "measured": 34.1
                        },
                        {
                            "date": "2025-09-25",
                            "measured": 35.6
                        },
                        {
                            "date": "2025-09-26",
                            "measured": 34.6
                        },
                        {
                            "date": "2025-09-27",
                            "measured": 32.6
                        },
                        {
                            "date": "2025-09-28",
                            "measured": 32.1
                        },
                        {
                            "date": "2025-09-29",
                            "measured": 32.8
                        },
                        {
                            "date": "2025-09-30",
                            "measured": 33.8
                        },
                        {
                            "date": "2025-10-01",
                            "measured": 34.4
                        },
                        {
                            "date": "2025-10-02",
                            "measured": 32.6
                        },
                        {
                            "date": "2025-10-03",
                            "measured": 28.8
                        },
                        {
                            "date": "2025-10-04",
                            "measured": 28.1
                        },
                        {
                            "date": "2025-10-05",
                            "measured": 31.4
                        },
                        {
                            "date": "2025-10-06",
                            "measured": 33.7
                        },
                        {
                            "date": "2025-10-07",
                            "measured": 33.2
                        },
                        {
                            "date": "2025-10-08",
                            "measured": 32.5
                        },
                        {
                            "date": "2025-10-09",
                            "measured": 32.0
                        },
                        {
                            "date": "2025-10-10",
                            "measured": 29.3
                        },
                        {
                            "date": "2025-10-11",
                            "measured": 27.9
                        },
                        {
                            "date": "2025-10-12",
                            "measured": 29.2
                        },
                        {
                            "date": "2025-10-13",
                            "measured": 30.1
                        },
                        {
                            "date": "2025-10-14",
                            "measured": 33.0
                        },
                        {
                            "date": "2025-10-15",
                            "measured": 31.5
                        },
                        {
                            "date": "2025-10-16",
                            "measured": 30.6
                        },
                        {
                            "date": "2025-10-17",
                            "measured": 31.1
                        },
                        {
                            "date": "2025-10-18",
                            "measured": 26.8
                        },
                        {
                            "date": "2025-10-19",
                            "measured": 27.3
                        },
                        {
                            "date": "2025-10-20",
                            "measured": 28.8
                        },
                        {
                            "date": "2025-10-21",
                            "measured": 28.6
                        },
                        {
                            "date": "2025-10-22",
                            "measured": 30.2
                        },
                        {
                            "date": "2025-10-23",
                            "measured": 29.0
                        },
                        {
                            "date": "2025-10-24",
                            "measured": 27.0
                        },
                        {
                            "date": "2025-10-25",
                            "measured": 24.9
                        },
                        {
                            "date": "2025-10-26",
                            "measured": 26.2
                        },
                        {
                            "date": "2025-10-27",
                            "measured": 25.8
                        },
                        {
                            "date": "2025-10-28",
                            "measured": 26.9
                        },
                        {
                            "date": "2025-10-29",
                            "measured": 26.0
                        },
                        {
                            "date": "2025-10-30",
                            "measured": 27.5
                        },
                        {
                            "date": "2025-10-31",
                            "measured": 28.4
                        },
                        {
                            "date": "2025-11-01",
                            "measured": 26.1
                        },
                        {
                            "date": "2025-11-02",
                            "measured": 26.7
                        },
                        {
                            "date": "2025-11-03",
                            "measured": 30.0
                        },
                        {
                            "date": "2025-11-04",
                            "measured": 33.3
                        },
                        {
                            "date": "2025-11-05",
                            "measured": 32.6
                        },
                        {
                            "date": "2025-11-06",
                            "measured": 32.5
                        },
                        {
                            "date": "2025-11-07",
                            "measured": 30.7
                        },
                        {
                            "date": "2025-11-08",
                            "measured": 28.6
                        },
                        {
                            "date": "2025-11-09",
                            "measured": 27.2
                        },
                        {
                            "date": "2025-11-10",
                            "measured": 29.1
                        },
                        {
                            "date": "2025-11-11",
                            "measured": 30.0
                        },
                        {
                            "date": "2025-11-12",
                            "measured": 32.2
                        },
                        {
                            "date": "2025-11-13",
                            "measured": 30.7
                        },
                        {
                            "date": "2025-11-14",
                            "measured": 31.6
                        },
                        {
                            "date": "2025-11-15",
                            "measured": 31.4
                        },
                        {
                            "date": "2025-11-16",
                            "measured": 31.3
                        },
                        {
                            "date": "2025-11-17",
                            "measured": 32.0
                        },
                        {
                            "date": "2025-11-18",
                            "measured": 35.7
                        },
                        {
                            "date": "2025-11-19",
                            "measured": 37.0
                        },
                        {
                            "date": "2025-11-20",
                            "measured": 37.7
                        },
                        {
                            "date": "2025-11-21",
                            "measured": 34.2
                        },
                        {
                            "date": "2025-11-22",
                            "measured": 33.1
                        },
                        {
                            "date": "2025-11-23",
                            "measured": 31.9
                        },
                        {
                            "date": "2025-11-24",
                            "measured": 34.0
                        },
                        {
                            "date": "2025-11-25",
                            "measured": 34.6
                        },
                        {
                            "date": "2025-11-26",
                            "measured": 34.7
                        },
                        {
                            "date": "2025-11-27",
                            "measured": 33.4
                        },
                        {
                            "date": "2025-11-28",
                            "measured": 31.0
                        },
                        {
                            "date": "2025-11-29",
                            "measured": 29.3
                        },
                        {
                            "date": "2025-11-30",
                            "measured": 29.8
                        },
                        {
                            "date": "2025-12-01",
                            "measured": 33.8
                        },
                        {
                            "date": "2025-12-02",
                            "measured": 34.9
                        },
                        {
                            "date": "2025-12-03",
                            "measured": 34.9
                        },
                        {
                            "date": "2025-12-04",
                            "measured": 35.4
                        },
                        {
                            "date": "2025-12-05",
                            "measured": 32.3
                        },
                        {
                            "date": "2025-12-06",
                            "measured": 32.3
                        },
                        {
                            "date": "2025-12-07",
                            "measured": 33.2
                        },
                        {
                            "date": "2025-12-08",
                            "measured": 37.2
                        },
                        {
                            "date": "2025-12-09",
                            "measured": 39.5
                        },
                        {
                            "date": "2025-12-10",
                            "measured": 37.6
                        },
                        {
                            "date": "2025-12-11",
                            "measured": 34.7
                        },
                        {
                            "date": "2025-12-12",
                            "measured": 32.9
                        },
                        {
                            "date": "2025-12-13",
                            "measured": 29.2
                        },
                        {
                            "date": "2025-12-14",
                            "measured": 28.2
                        },
                        {
                            "date": "2025-12-15",
                            "measured": 28.1
                        },
                        {
                            "date": "2025-12-16",
                            "measured": 30.5
                        },
                        {
                            "date": "2025-12-17",
                            "measured": 30.1
                        },
                        {
                            "date": "2025-12-18",
                            "measured": 29.4
                        },
                        {
                            "date": "2025-12-19",
                            "measured": 27.1
                        },
                        {
                            "date": "2025-12-20",
                            "measured": 26.6
                        }
                    ]
                },
                {
                    "kpi_key": "percentage_parked_longer_then_7_days",
                    "granularity": "day",
                    "values": [
                        {
                            "date": "2025-09-16",
                            "measured": 20.9
                        },
                        {
                            "date": "2025-09-17",
                            "measured": 19.8
                        },
                        {
                            "date": "2025-09-18",
                            "measured": 19.5
                        },
                        {
                            "date": "2025-09-19",
                            "measured": 19.5
                        },
                        {
                            "date": "2025-09-20",
                            "measured": 18.8
                        },
                        {
                            "date": "2025-09-21",
                            "measured": 19.4
                        },
                        {
                            "date": "2025-09-22",
                            "measured": 19.3
                        },
                        {
                            "date": "2025-09-23",
                            "measured": 18.4
                        },
                        {
                            "date": "2025-09-24",
                            "measured": 17.3
                        },
                        {
                            "date": "2025-09-25",
                            "measured": 20.7
                        },
                        {
                            "date": "2025-09-26",
                            "measured": 20.2
                        },
                        {
                            "date": "2025-09-27",
                            "measured": 19.2
                        },
                        {
                            "date": "2025-09-28",
                            "measured": 18.5
                        },
                        {
                            "date": "2025-09-29",
                            "measured": 19.1
                        },
                        {
                            "date": "2025-09-30",
                            "measured": 18.8
                        },
                        {
                            "date": "2025-10-01",
                            "measured": 17.3
                        },
                        {
                            "date": "2025-10-02",
                            "measured": 15.8
                        },
                        {
                            "date": "2025-10-03",
                            "measured": 15.2
                        },
                        {
                            "date": "2025-10-04",
                            "measured": 14.3
                        },
                        {
                            "date": "2025-10-05",
                            "measured": 15.6
                        },
                        {
                            "date": "2025-10-06",
                            "measured": 15.9
                        },
                        {
                            "date": "2025-10-07",
                            "measured": 15.1
                        },
                        {
                            "date": "2025-10-08",
                            "measured": 14.0
                        },
                        {
                            "date": "2025-10-09",
                            "measured": 14.0
                        },
                        {
                            "date": "2025-10-10",
                            "measured": 15.3
                        },
                        {
                            "date": "2025-10-11",
                            "measured": 14.5
                        },
                        {
                            "date": "2025-10-12",
                            "measured": 16.4
                        },
                        {
                            "date": "2025-10-13",
                            "measured": 16.4
                        },
                        {
                            "date": "2025-10-14",
                            "measured": 15.3
                        },
                        {
                            "date": "2025-10-15",
                            "measured": 14.7
                        },
                        {
                            "date": "2025-10-16",
                            "measured": 15.0
                        },
                        {
                            "date": "2025-10-17",
                            "measured": 16.0
                        },
                        {
                            "date": "2025-10-18",
                            "measured": 14.5
                        },
                        {
                            "date": "2025-10-19",
                            "measured": 15.2
                        },
                        {
                            "date": "2025-10-20",
                            "measured": 15.8
                        },
                        {
                            "date": "2025-10-21",
                            "measured": 15.0
                        },
                        {
                            "date": "2025-10-22",
                            "measured": 14.5
                        },
                        {
                            "date": "2025-10-23",
                            "measured": 14.3
                        },
                        {
                            "date": "2025-10-24",
                            "measured": 14.0
                        },
                        {
                            "date": "2025-10-25",
                            "measured": 13.3
                        },
                        {
                            "date": "2025-10-26",
                            "measured": 14.8
                        },
                        {
                            "date": "2025-10-27",
                            "measured": 14.6
                        },
                        {
                            "date": "2025-10-28",
                            "measured": 13.6
                        },
                        {
                            "date": "2025-10-29",
                            "measured": 13.0
                        },
                        {
                            "date": "2025-10-30",
                            "measured": 12.9
                        },
                        {
                            "date": "2025-10-31",
                            "measured": 13.0
                        },
                        {
                            "date": "2025-11-01",
                            "measured": 13.2
                        },
                        {
                            "date": "2025-11-02",
                            "measured": 13.0
                        },
                        {
                            "date": "2025-11-03",
                            "measured": 14.4
                        },
                        {
                            "date": "2025-11-04",
                            "measured": 16.2
                        },
                        {
                            "date": "2025-11-05",
                            "measured": 15.1
                        },
                        {
                            "date": "2025-11-06",
                            "measured": 14.2
                        },
                        {
                            "date": "2025-11-07",
                            "measured": 13.3
                        },
                        {
                            "date": "2025-11-08",
                            "measured": 13.5
                        },
                        {
                            "date": "2025-11-09",
                            "measured": 13.4
                        },
                        {
                            "date": "2025-11-10",
                            "measured": 13.9
                        },
                        {
                            "date": "2025-11-11",
                            "measured": 13.1
                        },
                        {
                            "date": "2025-11-12",
                            "measured": 13.6
                        },
                        {
                            "date": "2025-11-13",
                            "measured": 13.9
                        },
                        {
                            "date": "2025-11-14",
                            "measured": 13.9
                        },
                        {
                            "date": "2025-11-15",
                            "measured": 13.9
                        },
                        {
                            "date": "2025-11-16",
                            "measured": 15.3
                        },
                        {
                            "date": "2025-11-17",
                            "measured": 14.8
                        },
                        {
                            "date": "2025-11-18",
                            "measured": 15.5
                        },
                        {
                            "date": "2025-11-19",
                            "measured": 15.9
                        },
                        {
                            "date": "2025-11-20",
                            "measured": 16.9
                        },
                        {
                            "date": "2025-11-21",
                            "measured": 17.3
                        },
                        {
                            "date": "2025-11-22",
                            "measured": 18.9
                        },
                        {
                            "date": "2025-11-23",
                            "measured": 18.7
                        },
                        {
                            "date": "2025-11-24",
                            "measured": 19.9
                        },
                        {
                            "date": "2025-11-25",
                            "measured": 18.4
                        },
                        {
                            "date": "2025-11-26",
                            "measured": 18.2
                        },
                        {
                            "date": "2025-11-27",
                            "measured": 17.9
                        },
                        {
                            "date": "2025-11-28",
                            "measured": 18.5
                        },
                        {
                            "date": "2025-11-29",
                            "measured": 18.3
                        },
                        {
                            "date": "2025-11-30",
                            "measured": 18.2
                        },
                        {
                            "date": "2025-12-01",
                            "measured": 18.7
                        },
                        {
                            "date": "2025-12-02",
                            "measured": 17.2
                        },
                        {
                            "date": "2025-12-03",
                            "measured": 16.8
                        },
                        {
                            "date": "2025-12-04",
                            "measured": 16.7
                        },
                        {
                            "date": "2025-12-05",
                            "measured": 16.4
                        },
                        {
                            "date": "2025-12-06",
                            "measured": 16.3
                        },
                        {
                            "date": "2025-12-07",
                            "measured": 16.9
                        },
                        {
                            "date": "2025-12-08",
                            "measured": 17.4
                        },
                        {
                            "date": "2025-12-09",
                            "measured": 17.8
                        },
                        {
                            "date": "2025-12-10",
                            "measured": 17.2
                        },
                        {
                            "date": "2025-12-11",
                            "measured": 17.3
                        },
                        {
                            "date": "2025-12-12",
                            "measured": 16.0
                        },
                        {
                            "date": "2025-12-13",
                            "measured": 15.8
                        },
                        {
                            "date": "2025-12-14",
                            "measured": 14.8
                        },
                        {
                            "date": "2025-12-15",
                            "measured": 14.1
                        },
                        {
                            "date": "2025-12-16",
                            "measured": 14.2
                        },
                        {
                            "date": "2025-12-17",
                            "measured": 13.3
                        },
                        {
                            "date": "2025-12-18",
                            "measured": 13.6
                        },
                        {
                            "date": "2025-12-19",
                            "measured": 13.0
                        },
                        {
                            "date": "2025-12-20",
                            "measured": 13.2
                        }
                    ]
                },
                {
                    "kpi_key": "percentage_parked_longer_then_14_days",
                    "granularity": "day",
                    "values": [
                        {
                            "date": "2025-09-16",
                            "measured": 12.7
                        },
                        {
                            "date": "2025-09-17",
                            "measured": 12.1
                        },
                        {
                            "date": "2025-09-18",
                            "measured": 11.7
                        },
                        {
                            "date": "2025-09-19",
                            "measured": 11.6
                        },
                        {
                            "date": "2025-09-20",
                            "measured": 10.7
                        },
                        {
                            "date": "2025-09-21",
                            "measured": 10.5
                        },
                        {
                            "date": "2025-09-22",
                            "measured": 10.6
                        },
                        {
                            "date": "2025-09-23",
                            "measured": 10.4
                        },
                        {
                            "date": "2025-09-24",
                            "measured": 9.6
                        },
                        {
                            "date": "2025-09-25",
                            "measured": 9.4
                        },
                        {
                            "date": "2025-09-26",
                            "measured": 9.4
                        },
                        {
                            "date": "2025-09-27",
                            "measured": 9.1
                        },
                        {
                            "date": "2025-09-28",
                            "measured": 9.3
                        },
                        {
                            "date": "2025-09-29",
                            "measured": 9.5
                        },
                        {
                            "date": "2025-09-30",
                            "measured": 9.6
                        },
                        {
                            "date": "2025-10-01",
                            "measured": 8.7
                        },
                        {
                            "date": "2025-10-02",
                            "measured": 8.6
                        },
                        {
                            "date": "2025-10-03",
                            "measured": 7.7
                        },
                        {
                            "date": "2025-10-04",
                            "measured": 7.4
                        },
                        {
                            "date": "2025-10-05",
                            "measured": 7.6
                        },
                        {
                            "date": "2025-10-06",
                            "measured": 7.6
                        },
                        {
                            "date": "2025-10-07",
                            "measured": 7.4
                        },
                        {
                            "date": "2025-10-08",
                            "measured": 7.2
                        },
                        {
                            "date": "2025-10-09",
                            "measured": 6.4
                        },
                        {
                            "date": "2025-10-10",
                            "measured": 5.7
                        },
                        {
                            "date": "2025-10-11",
                            "measured": 5.4
                        },
                        {
                            "date": "2025-10-12",
                            "measured": 6.2
                        },
                        {
                            "date": "2025-10-13",
                            "measured": 6.8
                        },
                        {
                            "date": "2025-10-14",
                            "measured": 6.4
                        },
                        {
                            "date": "2025-10-15",
                            "measured": 5.7
                        },
                        {
                            "date": "2025-10-16",
                            "measured": 5.8
                        },
                        {
                            "date": "2025-10-17",
                            "measured": 6.3
                        },
                        {
                            "date": "2025-10-18",
                            "measured": 5.3
                        },
                        {
                            "date": "2025-10-19",
                            "measured": 6.2
                        },
                        {
                            "date": "2025-10-20",
                            "measured": 6.9
                        },
                        {
                            "date": "2025-10-21",
                            "measured": 6.6
                        },
                        {
                            "date": "2025-10-22",
                            "measured": 6.4
                        },
                        {
                            "date": "2025-10-23",
                            "measured": 6.5
                        },
                        {
                            "date": "2025-10-24",
                            "measured": 6.8
                        },
                        {
                            "date": "2025-10-25",
                            "measured": 6.8
                        },
                        {
                            "date": "2025-10-26",
                            "measured": 7.0
                        },
                        {
                            "date": "2025-10-27",
                            "measured": 7.4
                        },
                        {
                            "date": "2025-10-28",
                            "measured": 6.2
                        },
                        {
                            "date": "2025-10-29",
                            "measured": 6.0
                        },
                        {
                            "date": "2025-10-30",
                            "measured": 5.6
                        },
                        {
                            "date": "2025-10-31",
                            "measured": 5.6
                        },
                        {
                            "date": "2025-11-01",
                            "measured": 5.0
                        },
                        {
                            "date": "2025-11-02",
                            "measured": 5.8
                        },
                        {
                            "date": "2025-11-03",
                            "measured": 6.2
                        },
                        {
                            "date": "2025-11-04",
                            "measured": 6.8
                        },
                        {
                            "date": "2025-11-05",
                            "measured": 7.0
                        },
                        {
                            "date": "2025-11-06",
                            "measured": 5.9
                        },
                        {
                            "date": "2025-11-07",
                            "measured": 4.9
                        },
                        {
                            "date": "2025-11-08",
                            "measured": 4.4
                        },
                        {
                            "date": "2025-11-09",
                            "measured": 4.1
                        },
                        {
                            "date": "2025-11-10",
                            "measured": 4.1
                        },
                        {
                            "date": "2025-11-11",
                            "measured": 3.9
                        },
                        {
                            "date": "2025-11-12",
                            "measured": 4.0
                        },
                        {
                            "date": "2025-11-13",
                            "measured": 4.4
                        },
                        {
                            "date": "2025-11-14",
                            "measured": 4.2
                        },
                        {
                            "date": "2025-11-15",
                            "measured": 4.4
                        },
                        {
                            "date": "2025-11-16",
                            "measured": 4.6
                        },
                        {
                            "date": "2025-11-17",
                            "measured": 4.4
                        },
                        {
                            "date": "2025-11-18",
                            "measured": 4.4
                        },
                        {
                            "date": "2025-11-19",
                            "measured": 5.1
                        },
                        {
                            "date": "2025-11-20",
                            "measured": 6.1
                        },
                        {
                            "date": "2025-11-21",
                            "measured": 6.4
                        },
                        {
                            "date": "2025-11-22",
                            "measured": 6.3
                        },
                        {
                            "date": "2025-11-23",
                            "measured": 6.8
                        },
                        {
                            "date": "2025-11-24",
                            "measured": 7.3
                        },
                        {
                            "date": "2025-11-25",
                            "measured": 7.4
                        },
                        {
                            "date": "2025-11-26",
                            "measured": 7.7
                        },
                        {
                            "date": "2025-11-27",
                            "measured": 7.4
                        },
                        {
                            "date": "2025-11-28",
                            "measured": 8.0
                        },
                        {
                            "date": "2025-11-29",
                            "measured": 8.0
                        },
                        {
                            "date": "2025-11-30",
                            "measured": 8.5
                        },
                        {
                            "date": "2025-12-01",
                            "measured": 9.2
                        },
                        {
                            "date": "2025-12-02",
                            "measured": 8.5
                        },
                        {
                            "date": "2025-12-03",
                            "measured": 8.9
                        },
                        {
                            "date": "2025-12-04",
                            "measured": 8.6
                        },
                        {
                            "date": "2025-12-05",
                            "measured": 8.2
                        },
                        {
                            "date": "2025-12-06",
                            "measured": 7.5
                        },
                        {
                            "date": "2025-12-07",
                            "measured": 7.5
                        },
                        {
                            "date": "2025-12-08",
                            "measured": 8.0
                        },
                        {
                            "date": "2025-12-09",
                            "measured": 7.8
                        },
                        {
                            "date": "2025-12-10",
                            "measured": 6.9
                        },
                        {
                            "date": "2025-12-11",
                            "measured": 6.7
                        },
                        {
                            "date": "2025-12-12",
                            "measured": 6.2
                        },
                        {
                            "date": "2025-12-13",
                            "measured": 6.2
                        },
                        {
                            "date": "2025-12-14",
                            "measured": 6.3
                        },
                        {
                            "date": "2025-12-15",
                            "measured": 5.7
                        },
                        {
                            "date": "2025-12-16",
                            "measured": 5.4
                        },
                        {
                            "date": "2025-12-17",
                            "measured": 5.6
                        },
                        {
                            "date": "2025-12-18",
                            "measured": 5.4
                        },
                        {
                            "date": "2025-12-19",
                            "measured": 5.0
                        },
                        {
                            "date": "2025-12-20",
                            "measured": 4.6
                        }
                    ]
                }
            ]
        },
        {
            "operator": "greenwheels",
            "form_factor": "car",
            "propulsion_type": "combustion",
            "geometry_ref": "cbs:GM0599",
            "kpis": [
                {
                    "kpi_key": "vehicle_cap",
                    "granularity": "day",
                    "values": [
                        {
                            "date": "2025-09-16",
                            "measured": 52.0
                        },
                        {
                            "date": "2025-09-17",
                            "measured": 53.0
                        },
                        {
                            "date": "2025-09-18",
                            "measured": 47.0
                        },
                        {
                            "date": "2025-09-19",
                            "measured": 49.0
                        },
                        {
                            "date": "2025-09-20",
                            "measured": 47.0
                        },
                        {
                            "date": "2025-09-21",
                            "measured": 45.0
                        },
                        {
                            "date": "2025-09-22",
                            "measured": 45.0
                        },
                        {
                            "date": "2025-09-23",
                            "measured": 46.0
                        },
                        {
                            "date": "2025-09-24",
                            "measured": 42.0
                        },
                        {
                            "date": "2025-09-25",
                            "measured": 43.0
                        },
                        {
                            "date": "2025-09-26",
                            "measured": 44.0
                        },
                        {
                            "date": "2025-09-27",
                            "measured": 43.0
                        },
                        {
                            "date": "2025-09-28",
                            "measured": 42.0
                        },
                        {
                            "date": "2025-09-29",
                            "measured": 43.0
                        },
                        {
                            "date": "2025-09-30",
                            "measured": 42.0
                        },
                        {
                            "date": "2025-10-01",
                            "measured": 41.0
                        },
                        {
                            "date": "2025-10-02",
                            "measured": 36.0
                        },
                        {
                            "date": "2025-10-03",
                            "measured": 37.0
                        },
                        {
                            "date": "2025-10-04",
                            "measured": 40.0
                        },
                        {
                            "date": "2025-10-05",
                            "measured": 39.0
                        },
                        {
                            "date": "2025-10-06",
                            "measured": 41.0
                        },
                        {
                            "date": "2025-10-07",
                            "measured": 42.0
                        },
                        {
                            "date": "2025-10-08",
                            "measured": 42.0
                        },
                        {
                            "date": "2025-10-09",
                            "measured": 42.0
                        },
                        {
                            "date": "2025-10-10",
                            "measured": 41.0
                        },
                        {
                            "date": "2025-10-11",
                            "measured": 37.0
                        },
                        {
                            "date": "2025-10-12",
                            "measured": 38.0
                        },
                        {
                            "date": "2025-10-13",
                            "measured": 40.0
                        },
                        {
                            "date": "2025-10-14",
                            "measured": 41.0
                        },
                        {
                            "date": "2025-10-15",
                            "measured": 39.0
                        },
                        {
                            "date": "2025-10-16",
                            "measured": 39.0
                        },
                        {
                            "date": "2025-10-17",
                            "measured": 35.0
                        },
                        {
                            "date": "2025-10-18",
                            "measured": 40.0
                        },
                        {
                            "date": "2025-10-19",
                            "measured": 40.0
                        },
                        {
                            "date": "2025-10-20",
                            "measured": 40.0
                        },
                        {
                            "date": "2025-10-21",
                            "measured": 41.0
                        },
                        {
                            "date": "2025-10-22",
                            "measured": 40.0
                        },
                        {
                            "date": "2025-10-23",
                            "measured": 40.0
                        },
                        {
                            "date": "2025-10-24",
                            "measured": 40.0
                        },
                        {
                            "date": "2025-10-25",
                            "measured": 20.0
                        },
                        {
                            "date": "2025-10-26",
                            "measured": 20.0
                        },
                        {
                            "date": "2025-10-27",
                            "measured": 20.0
                        },
                        {
                            "date": "2025-10-28",
                            "measured": 20.0
                        },
                        {
                            "date": "2025-10-29",
                            "measured": 20.0
                        },
                        {
                            "date": "2025-10-30",
                            "measured": 20.0
                        },
                        {
                            "date": "2025-10-31",
                            "measured": 20.0
                        },
                        {
                            "date": "2025-11-01",
                            "measured": 20.0
                        },
                        {
                            "date": "2025-11-02",
                            "measured": 20.0
                        },
                        {
                            "date": "2025-11-03",
                            "measured": 20.0
                        },
                        {
                            "date": "2025-11-04",
                            "measured": 20.0
                        },
                        {
                            "date": "2025-11-05",
                            "measured": 20.0
                        },
                        {
                            "date": "2025-11-06",
                            "measured": 20.0
                        },
                        {
                            "date": "2025-11-07",
                            "measured": 20.0
                        },
                        {
                            "date": "2025-11-08",
                            "measured": 20.0
                        },
                        {
                            "date": "2025-11-09",
                            "measured": 20.0
                        },
                        {
                            "date": "2025-11-10",
                            "measured": 20.0
                        },
                        {
                            "date": "2025-11-11",
                            "measured": 20.0
                        },
                        {
                            "date": "2025-11-12",
                            "measured": 20.0
                        },
                        {
                            "date": "2025-11-13",
                            "measured": 20.0
                        },
                        {
                            "date": "2025-11-14",
                            "measured": 20.0
                        },
                        {
                            "date": "2025-11-15",
                            "measured": 20.0
                        },
                        {
                            "date": "2025-11-16",
                            "measured": 20.0
                        },
                        {
                            "date": "2025-11-17",
                            "measured": 20.0
                        },
                        {
                            "date": "2025-11-18",
                            "measured": 29.0
                        },
                        {
                            "date": "2025-11-19",
                            "measured": 34.0
                        },
                        {
                            "date": "2025-11-20",
                            "measured": 37.0
                        },
                        {
                            "date": "2025-11-21",
                            "measured": 38.0
                        },
                        {
                            "date": "2025-11-22",
                            "measured": 36.0
                        },
                        {
                            "date": "2025-11-23",
                            "measured": 37.0
                        },
                        {
                            "date": "2025-11-24",
                            "measured": 38.0
                        },
                        {
                            "date": "2025-11-25",
                            "measured": 36.0
                        },
                        {
                            "date": "2025-11-26",
                            "measured": 36.0
                        },
                        {
                            "date": "2025-11-27",
                            "measured": 37.0
                        },
                        {
                            "date": "2025-11-28",
                            "measured": 40.0
                        },
                        {
                            "date": "2025-11-29",
                            "measured": 39.0
                        },
                        {
                            "date": "2025-11-30",
                            "measured": 37.0
                        },
                        {
                            "date": "2025-12-01",
                            "measured": 42.0
                        },
                        {
                            "date": "2025-12-02",
                            "measured": 41.0
                        },
                        {
                            "date": "2025-12-03",
                            "measured": 40.0
                        },
                        {
                            "date": "2025-12-04",
                            "measured": 38.0
                        },
                        {
                            "date": "2025-12-05",
                            "measured": 38.0
                        },
                        {
                            "date": "2025-12-06",
                            "measured": 37.0
                        },
                        {
                            "date": "2025-12-07",
                            "measured": 35.0
                        },
                        {
                            "date": "2025-12-08",
                            "measured": 36.0
                        },
                        {
                            "date": "2025-12-09",
                            "measured": 33.0
                        },
                        {
                            "date": "2025-12-10",
                            "measured": 34.0
                        },
                        {
                            "date": "2025-12-11",
                            "measured": 32.0
                        },
                        {
                            "date": "2025-12-12",
                            "measured": 34.0
                        },
                        {
                            "date": "2025-12-13",
                            "measured": 31.0
                        },
                        {
                            "date": "2025-12-14",
                            "measured": 31.0
                        },
                        {
                            "date": "2025-12-15",
                            "measured": 33.0
                        },
                        {
                            "date": "2025-12-16",
                            "measured": 30.0
                        },
                        {
                            "date": "2025-12-17",
                            "measured": 31.0
                        },
                        {
                            "date": "2025-12-18",
                            "measured": 28.0
                        },
                        {
                            "date": "2025-12-19",
                            "measured": 32.0
                        },
                        {
                            "date": "2025-12-20",
                            "measured": 34.0
                        }
                    ]
                },
                {
                    "kpi_key": "percentage_parked_longer_then_24_hours",
                    "granularity": "day",
                    "values": [
                        {
                            "date": "2025-09-16",
                            "measured": 76.5
                        },
                        {
                            "date": "2025-09-17",
                            "measured": 81.1
                        },
                        {
                            "date": "2025-09-18",
                            "measured": 57.4
                        },
                        {
                            "date": "2025-09-19",
                            "measured": 32.7
                        },
                        {
                            "date": "2025-09-20",
                            "measured": 36.2
                        },
                        {
                            "date": "2025-09-21",
                            "measured": 20.0
                        },
                        {
                            "date": "2025-09-22",
                            "measured": 40.9
                        },
                        {
                            "date": "2025-09-23",
                            "measured": 43.5
                        },
                        {
                            "date": "2025-09-24",
                            "measured": 43.9
                        },
                        {
                            "date": "2025-09-25",
                            "measured": 34.9
                        },
                        {
                            "date": "2025-09-26",
                            "measured": 36.4
                        },
                        {
                            "date": "2025-09-27",
                            "measured": 28.6
                        },
                        {
                            "date": "2025-09-28",
                            "measured": 14.6
                        },
                        {
                            "date": "2025-09-29",
                            "measured": 39.5
                        },
                        {
                            "date": "2025-09-30",
                            "measured": 33.3
                        },
                        {
                            "date": "2025-10-01",
                            "measured": 43.9
                        },
                        {
                            "date": "2025-10-02",
                            "measured": 44.4
                        },
                        {
                            "date": "2025-10-03",
                            "measured": 35.1
                        },
                        {
                            "date": "2025-10-04",
                            "measured": 30.8
                        },
                        {
                            "date": "2025-10-05",
                            "measured": 28.9
                        },
                        {
                            "date": "2025-10-06",
                            "measured": 34.1
                        },
                        {
                            "date": "2025-10-07",
                            "measured": 41.0
                        },
                        {
                            "date": "2025-10-08",
                            "measured": 46.3
                        },
                        {
                            "date": "2025-10-09",
                            "measured": 45.2
                        },
                        {
                            "date": "2025-10-10",
                            "measured": 26.8
                        },
                        {
                            "date": "2025-10-11",
                            "measured": 48.6
                        },
                        {
                            "date": "2025-10-12",
                            "measured": 29.7
                        },
                        {
                            "date": "2025-10-13",
                            "measured": 30.0
                        },
                        {
                            "date": "2025-10-14",
                            "measured": 56.1
                        },
                        {
                            "date": "2025-10-15",
                            "measured": 51.3
                        },
                        {
                            "date": "2025-10-16",
                            "measured": 46.2
                        },
                        {
                            "date": "2025-10-17",
                            "measured": 35.3
                        },
                        {
                            "date": "2025-10-18",
                            "measured": 37.5
                        },
                        {
                            "date": "2025-10-19",
                            "measured": 15.0
                        },
                        {
                            "date": "2025-10-20",
                            "measured": 37.5
                        },
                        {
                            "date": "2025-10-21",
                            "measured": 39.0
                        },
                        {
                            "date": "2025-10-22",
                            "measured": 52.5
                        },
                        {
                            "date": "2025-10-23",
                            "measured": 51.3
                        },
                        {
                            "date": "2025-10-24",
                            "measured": 37.5
                        },
                        {
                            "date": "2025-10-25",
                            "measured": 90.0
                        },
                        {
                            "date": "2025-10-26",
                            "measured": 100.0
                        },
                        {
                            "date": "2025-10-27",
                            "measured": 100.0
                        },
                        {
                            "date": "2025-10-28",
                            "measured": 100.0
                        },
                        {
                            "date": "2025-10-29",
                            "measured": 100.0
                        },
                        {
                            "date": "2025-10-30",
                            "measured": 100.0
                        },
                        {
                            "date": "2025-10-31",
                            "measured": 100.0
                        },
                        {
                            "date": "2025-11-01",
                            "measured": 100.0
                        },
                        {
                            "date": "2025-11-02",
                            "measured": 100.0
                        },
                        {
                            "date": "2025-11-03",
                            "measured": 100.0
                        },
                        {
                            "date": "2025-11-04",
                            "measured": 100.0
                        },
                        {
                            "date": "2025-11-05",
                            "measured": 100.0
                        },
                        {
                            "date": "2025-11-06",
                            "measured": 100.0
                        },
                        {
                            "date": "2025-11-07",
                            "measured": 100.0
                        },
                        {
                            "date": "2025-11-08",
                            "measured": 100.0
                        },
                        {
                            "date": "2025-11-09",
                            "measured": 100.0
                        },
                        {
                            "date": "2025-11-10",
                            "measured": 100.0
                        },
                        {
                            "date": "2025-11-11",
                            "measured": 100.0
                        },
                        {
                            "date": "2025-11-12",
                            "measured": 100.0
                        },
                        {
                            "date": "2025-11-13",
                            "measured": 100.0
                        },
                        {
                            "date": "2025-11-14",
                            "measured": 100.0
                        },
                        {
                            "date": "2025-11-15",
                            "measured": 100.0
                        },
                        {
                            "date": "2025-11-16",
                            "measured": 100.0
                        },
                        {
                            "date": "2025-11-17",
                            "measured": 100.0
                        },
                        {
                            "date": "2025-11-18",
                            "measured": 100.0
                        },
                        {
                            "date": "2025-11-19",
                            "measured": 26.5
                        },
                        {
                            "date": "2025-11-20",
                            "measured": 27.0
                        },
                        {
                            "date": "2025-11-21",
                            "measured": 35.1
                        },
                        {
                            "date": "2025-11-22",
                            "measured": 34.3
                        },
                        {
                            "date": "2025-11-23",
                            "measured": 35.1
                        },
                        {
                            "date": "2025-11-24",
                            "measured": 42.1
                        },
                        {
                            "date": "2025-11-25",
                            "measured": 52.8
                        },
                        {
                            "date": "2025-11-26",
                            "measured": 36.1
                        },
                        {
                            "date": "2025-11-27",
                            "measured": 32.4
                        },
                        {
                            "date": "2025-11-28",
                            "measured": 60.0
                        },
                        {
                            "date": "2025-11-29",
                            "measured": 25.6
                        },
                        {
                            "date": "2025-11-30",
                            "measured": 33.3
                        },
                        {
                            "date": "2025-12-01",
                            "measured": 23.8
                        },
                        {
                            "date": "2025-12-02",
                            "measured": 39.0
                        },
                        {
                            "date": "2025-12-03",
                            "measured": 42.5
                        },
                        {
                            "date": "2025-12-04",
                            "measured": 36.8
                        },
                        {
                            "date": "2025-12-05",
                            "measured": 28.9
                        },
                        {
                            "date": "2025-12-06",
                            "measured": 37.8
                        },
                        {
                            "date": "2025-12-07",
                            "measured": 22.9
                        },
                        {
                            "date": "2025-12-08",
                            "measured": 33.3
                        },
                        {
                            "date": "2025-12-09",
                            "measured": 39.4
                        },
                        {
                            "date": "2025-12-10",
                            "measured": 23.5
                        },
                        {
                            "date": "2025-12-11",
                            "measured": 25.0
                        },
                        {
                            "date": "2025-12-12",
                            "measured": 35.3
                        },
                        {
                            "date": "2025-12-13",
                            "measured": 38.7
                        },
                        {
                            "date": "2025-12-14",
                            "measured": 29.0
                        },
                        {
                            "date": "2025-12-15",
                            "measured": 27.3
                        },
                        {
                            "date": "2025-12-16",
                            "measured": 46.7
                        },
                        {
                            "date": "2025-12-17",
                            "measured": 45.2
                        },
                        {
                            "date": "2025-12-18",
                            "measured": 39.3
                        },
                        {
                            "date": "2025-12-19",
                            "measured": 40.6
                        },
                        {
                            "date": "2025-12-20",
                            "measured": 20.6
                        }
                    ]
                },
                {
                    "kpi_key": "percentage_parked_longer_then_3_days",
                    "granularity": "day",
                    "values": [
                        {
                            "date": "2025-09-16",
                            "measured": 68.6
                        },
                        {
                            "date": "2025-09-17",
                            "measured": 67.9
                        },
                        {
                            "date": "2025-09-18",
                            "measured": 38.3
                        },
                        {
                            "date": "2025-09-19",
                            "measured": 22.4
                        },
                        {
                            "date": "2025-09-20",
                            "measured": 12.8
                        },
                        {
                            "date": "2025-09-21",
                            "measured": 6.7
                        },
                        {
                            "date": "2025-09-22",
                            "measured": 4.5
                        },
                        {
                            "date": "2025-09-23",
                            "measured": 6.5
                        },
                        {
                            "date": "2025-09-24",
                            "measured": 12.2
                        },
                        {
                            "date": "2025-09-25",
                            "measured": 7.0
                        },
                        {
                            "date": "2025-09-26",
                            "measured": 9.1
                        },
                        {
                            "date": "2025-09-27",
                            "measured": 4.8
                        },
                        {
                            "date": "2025-09-28",
                            "measured": 4.9
                        },
                        {
                            "date": "2025-09-29",
                            "measured": 2.3
                        },
                        {
                            "date": "2025-09-30",
                            "measured": 4.8
                        },
                        {
                            "date": "2025-10-01",
                            "measured": 19.5
                        },
                        {
                            "date": "2025-10-02",
                            "measured": 13.9
                        },
                        {
                            "date": "2025-10-03",
                            "measured": 5.4
                        },
                        {
                            "date": "2025-10-04",
                            "measured": 10.3
                        },
                        {
                            "date": "2025-10-05",
                            "measured": 10.5
                        },
                        {
                            "date": "2025-10-07",
                            "measured": 7.7
                        },
                        {
                            "date": "2025-10-08",
                            "measured": 7.3
                        },
                        {
                            "date": "2025-10-09",
                            "measured": 9.5
                        },
                        {
                            "date": "2025-10-10",
                            "measured": 12.2
                        },
                        {
                            "date": "2025-10-11",
                            "measured": 8.1
                        },
                        {
                            "date": "2025-10-12",
                            "measured": 2.7
                        },
                        {
                            "date": "2025-10-13",
                            "measured": 7.5
                        },
                        {
                            "date": "2025-10-14",
                            "measured": 9.8
                        },
                        {
                            "date": "2025-10-15",
                            "measured": 15.4
                        },
                        {
                            "date": "2025-10-16",
                            "measured": 20.5
                        },
                        {
                            "date": "2025-10-17",
                            "measured": 20.6
                        },
                        {
                            "date": "2025-10-18",
                            "measured": 15.0
                        },
                        {
                            "date": "2025-10-20",
                            "measured": 10.0
                        },
                        {
                            "date": "2025-10-21",
                            "measured": 7.3
                        },
                        {
                            "date": "2025-10-22",
                            "measured": 2.5
                        },
                        {
                            "date": "2025-10-23",
                            "measured": 15.4
                        },
                        {
                            "date": "2025-10-24",
                            "measured": 12.5
                        },
                        {
                            "date": "2025-10-25",
                            "measured": 35.0
                        },
                        {
                            "date": "2025-10-26",
                            "measured": 50.0
                        },
                        {
                            "date": "2025-10-27",
                            "measured": 90.0
                        },
                        {
                            "date": "2025-10-28",
                            "measured": 100.0
                        },
                        {
                            "date": "2025-10-29",
                            "measured": 100.0
                        },
                        {
                            "date": "2025-10-30",
                            "measured": 100.0
                        },
                        {
                            "date": "2025-10-31",
                            "measured": 100.0
                        },
                        {
                            "date": "2025-11-01",
                            "measured": 100.0
                        },
                        {
                            "date": "2025-11-02",
                            "measured": 100.0
                        },
                        {
                            "date": "2025-11-03",
                            "measured": 100.0
                        },
                        {
                            "date": "2025-11-04",
                            "measured": 100.0
                        },
                        {
                            "date": "2025-11-05",
                            "measured": 100.0
                        },
                        {
                            "date": "2025-11-06",
                            "measured": 100.0
                        },
                        {
                            "date": "2025-11-07",
                            "measured": 100.0
                        },
                        {
                            "date": "2025-11-08",
                            "measured": 100.0
                        },
                        {
                            "date": "2025-11-09",
                            "measured": 100.0
                        },
                        {
                            "date": "2025-11-10",
                            "measured": 100.0
                        },
                        {
                            "date": "2025-11-11",
                            "measured": 100.0
                        },
                        {
                            "date": "2025-11-12",
                            "measured": 100.0
                        },
                        {
                            "date": "2025-11-13",
                            "measured": 100.0
                        },
                        {
                            "date": "2025-11-14",
                            "measured": 100.0
                        },
                        {
                            "date": "2025-11-15",
                            "measured": 100.0
                        },
                        {
                            "date": "2025-11-16",
                            "measured": 100.0
                        },
                        {
                            "date": "2025-11-17",
                            "measured": 100.0
                        },
                        {
                            "date": "2025-11-18",
                            "measured": 100.0
                        },
                        {
                            "date": "2025-11-19",
                            "measured": 26.5
                        },
                        {
                            "date": "2025-11-20",
                            "measured": 13.5
                        },
                        {
                            "date": "2025-11-21",
                            "measured": 5.4
                        },
                        {
                            "date": "2025-11-22",
                            "measured": 8.6
                        },
                        {
                            "date": "2025-11-23",
                            "measured": 5.4
                        },
                        {
                            "date": "2025-11-24",
                            "measured": 13.2
                        },
                        {
                            "date": "2025-11-25",
                            "measured": 13.9
                        },
                        {
                            "date": "2025-11-26",
                            "measured": 13.9
                        },
                        {
                            "date": "2025-11-27",
                            "measured": 13.5
                        },
                        {
                            "date": "2025-11-28",
                            "measured": 17.5
                        },
                        {
                            "date": "2025-11-29",
                            "measured": 12.8
                        },
                        {
                            "date": "2025-11-30",
                            "measured": 13.9
                        },
                        {
                            "date": "2025-12-01",
                            "measured": 7.1
                        },
                        {
                            "date": "2025-12-02",
                            "measured": 12.2
                        },
                        {
                            "date": "2025-12-03",
                            "measured": 7.5
                        },
                        {
                            "date": "2025-12-04",
                            "measured": 15.8
                        },
                        {
                            "date": "2025-12-05",
                            "measured": 7.9
                        },
                        {
                            "date": "2025-12-06",
                            "measured": 10.8
                        },
                        {
                            "date": "2025-12-07",
                            "measured": 5.7
                        },
                        {
                            "date": "2025-12-08",
                            "measured": 5.6
                        },
                        {
                            "date": "2025-12-09",
                            "measured": 3.0
                        },
                        {
                            "date": "2025-12-10",
                            "measured": 2.9
                        },
                        {
                            "date": "2025-12-11",
                            "measured": 6.3
                        },
                        {
                            "date": "2025-12-12",
                            "measured": 2.9
                        },
                        {
                            "date": "2025-12-13",
                            "measured": 3.2
                        },
                        {
                            "date": "2025-12-14",
                            "measured": 6.5
                        },
                        {
                            "date": "2025-12-15",
                            "measured": 6.1
                        },
                        {
                            "date": "2025-12-16",
                            "measured": 10.0
                        },
                        {
                            "date": "2025-12-17",
                            "measured": 12.9
                        },
                        {
                            "date": "2025-12-18",
                            "measured": 21.4
                        },
                        {
                            "date": "2025-12-19",
                            "measured": 12.5
                        },
                        {
                            "date": "2025-12-20",
                            "measured": 11.8
                        }
                    ]
                },
                {
                    "kpi_key": "percentage_parked_longer_then_7_days",
                    "granularity": "day",
                    "values": [
                        {
                            "date": "2025-09-16",
                            "measured": 68.6
                        },
                        {
                            "date": "2025-09-17",
                            "measured": 66.0
                        },
                        {
                            "date": "2025-09-18",
                            "measured": 36.2
                        },
                        {
                            "date": "2025-09-19",
                            "measured": 16.3
                        },
                        {
                            "date": "2025-09-20",
                            "measured": 10.6
                        },
                        {
                            "date": "2025-09-21",
                            "measured": 4.4
                        },
                        {
                            "date": "2025-09-22",
                            "measured": 2.3
                        },
                        {
                            "date": "2025-10-05",
                            "measured": 2.6
                        },
                        {
                            "date": "2025-10-17",
                            "measured": 2.9
                        },
                        {
                            "date": "2025-10-18",
                            "measured": 2.5
                        },
                        {
                            "date": "2025-10-27",
                            "measured": 15.0
                        },
                        {
                            "date": "2025-10-28",
                            "measured": 20.0
                        },
                        {
                            "date": "2025-10-29",
                            "measured": 35.0
                        },
                        {
                            "date": "2025-10-30",
                            "measured": 50.0
                        },
                        {
                            "date": "2025-10-31",
                            "measured": 90.0
                        },
                        {
                            "date": "2025-11-01",
                            "measured": 100.0
                        },
                        {
                            "date": "2025-11-02",
                            "measured": 100.0
                        },
                        {
                            "date": "2025-11-03",
                            "measured": 100.0
                        },
                        {
                            "date": "2025-11-04",
                            "measured": 100.0
                        },
                        {
                            "date": "2025-11-05",
                            "measured": 100.0
                        },
                        {
                            "date": "2025-11-06",
                            "measured": 100.0
                        },
                        {
                            "date": "2025-11-07",
                            "measured": 100.0
                        },
                        {
                            "date": "2025-11-08",
                            "measured": 100.0
                        },
                        {
                            "date": "2025-11-09",
                            "measured": 100.0
                        },
                        {
                            "date": "2025-11-10",
                            "measured": 100.0
                        },
                        {
                            "date": "2025-11-11",
                            "measured": 100.0
                        },
                        {
                            "date": "2025-11-12",
                            "measured": 100.0
                        },
                        {
                            "date": "2025-11-13",
                            "measured": 100.0
                        },
                        {
                            "date": "2025-11-14",
                            "measured": 100.0
                        },
                        {
                            "date": "2025-11-15",
                            "measured": 100.0
                        },
                        {
                            "date": "2025-11-16",
                            "measured": 100.0
                        },
                        {
                            "date": "2025-11-17",
                            "measured": 100.0
                        },
                        {
                            "date": "2025-11-18",
                            "measured": 100.0
                        },
                        {
                            "date": "2025-11-19",
                            "measured": 26.5
                        },
                        {
                            "date": "2025-11-20",
                            "measured": 13.5
                        },
                        {
                            "date": "2025-11-21",
                            "measured": 5.4
                        },
                        {
                            "date": "2025-11-22",
                            "measured": 2.9
                        },
                        {
                            "date": "2025-11-30",
                            "measured": 5.6
                        },
                        {
                            "date": "2025-12-01",
                            "measured": 2.4
                        },
                        {
                            "date": "2025-12-02",
                            "measured": 2.4
                        },
                        {
                            "date": "2025-12-03",
                            "measured": 2.5
                        },
                        {
                            "date": "2025-12-04",
                            "measured": 5.3
                        },
                        {
                            "date": "2025-12-05",
                            "measured": 5.3
                        },
                        {
                            "date": "2025-12-06",
                            "measured": 2.7
                        },
                        {
                            "date": "2025-12-07",
                            "measured": 2.9
                        },
                        {
                            "date": "2025-12-08",
                            "measured": 2.8
                        },
                        {
                            "date": "2025-12-09",
                            "measured": 3.0
                        },
                        {
                            "date": "2025-12-10",
                            "measured": 2.9
                        },
                        {
                            "date": "2025-12-11",
                            "measured": 3.1
                        },
                        {
                            "date": "2025-12-12",
                            "measured": 2.9
                        },
                        {
                            "date": "2025-12-13",
                            "measured": 3.2
                        },
                        {
                            "date": "2025-12-14",
                            "measured": 3.2
                        },
                        {
                            "date": "2025-12-15",
                            "measured": 3.0
                        },
                        {
                            "date": "2025-12-16",
                            "measured": 3.3
                        },
                        {
                            "date": "2025-12-17",
                            "measured": 3.2
                        },
                        {
                            "date": "2025-12-18",
                            "measured": 3.6
                        },
                        {
                            "date": "2025-12-19",
                            "measured": 6.3
                        },
                        {
                            "date": "2025-12-20",
                            "measured": 2.9
                        }
                    ]
                },
                {
                    "kpi_key": "percentage_parked_longer_then_14_days",
                    "granularity": "day",
                    "values": [
                        {
                            "date": "2025-09-16",
                            "measured": 66.7
                        },
                        {
                            "date": "2025-09-17",
                            "measured": 64.2
                        },
                        {
                            "date": "2025-09-18",
                            "measured": 34.0
                        },
                        {
                            "date": "2025-09-19",
                            "measured": 14.3
                        },
                        {
                            "date": "2025-09-20",
                            "measured": 8.5
                        },
                        {
                            "date": "2025-09-21",
                            "measured": 4.4
                        },
                        {
                            "date": "2025-09-22",
                            "measured": 2.3
                        },
                        {
                            "date": "2025-11-03",
                            "measured": 15.0
                        },
                        {
                            "date": "2025-11-04",
                            "measured": 20.0
                        },
                        {
                            "date": "2025-11-05",
                            "measured": 35.0
                        },
                        {
                            "date": "2025-11-06",
                            "measured": 50.0
                        },
                        {
                            "date": "2025-11-07",
                            "measured": 90.0
                        },
                        {
                            "date": "2025-11-08",
                            "measured": 100.0
                        },
                        {
                            "date": "2025-11-09",
                            "measured": 100.0
                        },
                        {
                            "date": "2025-11-10",
                            "measured": 100.0
                        },
                        {
                            "date": "2025-11-11",
                            "measured": 100.0
                        },
                        {
                            "date": "2025-11-12",
                            "measured": 100.0
                        },
                        {
                            "date": "2025-11-13",
                            "measured": 100.0
                        },
                        {
                            "date": "2025-11-14",
                            "measured": 100.0
                        },
                        {
                            "date": "2025-11-15",
                            "measured": 100.0
                        },
                        {
                            "date": "2025-11-16",
                            "measured": 100.0
                        },
                        {
                            "date": "2025-11-17",
                            "measured": 100.0
                        },
                        {
                            "date": "2025-11-18",
                            "measured": 100.0
                        },
                        {
                            "date": "2025-11-19",
                            "measured": 26.5
                        },
                        {
                            "date": "2025-11-20",
                            "measured": 13.5
                        },
                        {
                            "date": "2025-11-21",
                            "measured": 5.4
                        },
                        {
                            "date": "2025-11-22",
                            "measured": 2.9
                        },
                        {
                            "date": "2025-12-10",
                            "measured": 2.9
                        },
                        {
                            "date": "2025-12-11",
                            "measured": 3.1
                        },
                        {
                            "date": "2025-12-12",
                            "measured": 2.9
                        },
                        {
                            "date": "2025-12-13",
                            "measured": 3.2
                        },
                        {
                            "date": "2025-12-14",
                            "measured": 3.2
                        },
                        {
                            "date": "2025-12-15",
                            "measured": 3.0
                        },
                        {
                            "date": "2025-12-16",
                            "measured": 3.3
                        },
                        {
                            "date": "2025-12-17",
                            "measured": 3.2
                        },
                        {
                            "date": "2025-12-18",
                            "measured": 3.6
                        },
                        {
                            "date": "2025-12-19",
                            "measured": 3.1
                        },
                        {
                            "date": "2025-12-20",
                            "measured": 2.9
                        }
                    ]
                }
            ]
        },
        {
            "operator": "greenwheels",
            "form_factor": "car",
            "propulsion_type": "electric",
            "geometry_ref": "cbs:GM0599",
            "kpis": [
                {
                    "kpi_key": "vehicle_cap",
                    "granularity": "day",
                    "values": [
                        {
                            "date": "2025-09-16",
                            "measured": 156.0
                        },
                        {
                            "date": "2025-09-17",
                            "measured": 154.0
                        },
                        {
                            "date": "2025-09-18",
                            "measured": 144.0
                        },
                        {
                            "date": "2025-09-19",
                            "measured": 145.0
                        },
                        {
                            "date": "2025-09-20",
                            "measured": 152.0
                        },
                        {
                            "date": "2025-09-21",
                            "measured": 146.0
                        },
                        {
                            "date": "2025-09-22",
                            "measured": 149.0
                        },
                        {
                            "date": "2025-09-23",
                            "measured": 152.0
                        },
                        {
                            "date": "2025-09-24",
                            "measured": 154.0
                        },
                        {
                            "date": "2025-09-25",
                            "measured": 149.0
                        },
                        {
                            "date": "2025-09-26",
                            "measured": 155.0
                        },
                        {
                            "date": "2025-09-27",
                            "measured": 153.0
                        },
                        {
                            "date": "2025-09-28",
                            "measured": 148.0
                        },
                        {
                            "date": "2025-09-29",
                            "measured": 153.0
                        },
                        {
                            "date": "2025-09-30",
                            "measured": 156.0
                        },
                        {
                            "date": "2025-10-01",
                            "measured": 157.0
                        },
                        {
                            "date": "2025-10-02",
                            "measured": 155.0
                        },
                        {
                            "date": "2025-10-03",
                            "measured": 154.0
                        },
                        {
                            "date": "2025-10-04",
                            "measured": 157.0
                        },
                        {
                            "date": "2025-10-05",
                            "measured": 157.0
                        },
                        {
                            "date": "2025-10-06",
                            "measured": 158.0
                        },
                        {
                            "date": "2025-10-07",
                            "measured": 152.0
                        },
                        {
                            "date": "2025-10-08",
                            "measured": 156.0
                        },
                        {
                            "date": "2025-10-09",
                            "measured": 149.0
                        },
                        {
                            "date": "2025-10-10",
                            "measured": 152.0
                        },
                        {
                            "date": "2025-10-11",
                            "measured": 156.0
                        },
                        {
                            "date": "2025-10-12",
                            "measured": 144.0
                        },
                        {
                            "date": "2025-10-13",
                            "measured": 157.0
                        },
                        {
                            "date": "2025-10-14",
                            "measured": 159.0
                        },
                        {
                            "date": "2025-10-15",
                            "measured": 159.0
                        },
                        {
                            "date": "2025-10-16",
                            "measured": 160.0
                        },
                        {
                            "date": "2025-10-17",
                            "measured": 155.0
                        },
                        {
                            "date": "2025-10-18",
                            "measured": 150.0
                        },
                        {
                            "date": "2025-10-19",
                            "measured": 149.0
                        },
                        {
                            "date": "2025-10-20",
                            "measured": 148.0
                        },
                        {
                            "date": "2025-10-21",
                            "measured": 146.0
                        },
                        {
                            "date": "2025-10-22",
                            "measured": 151.0
                        },
                        {
                            "date": "2025-10-23",
                            "measured": 150.0
                        },
                        {
                            "date": "2025-10-24",
                            "measured": 153.0
                        },
                        {
                            "date": "2025-10-25",
                            "measured": 106.0
                        },
                        {
                            "date": "2025-10-26",
                            "measured": 106.0
                        },
                        {
                            "date": "2025-10-27",
                            "measured": 106.0
                        },
                        {
                            "date": "2025-10-28",
                            "measured": 106.0
                        },
                        {
                            "date": "2025-10-29",
                            "measured": 106.0
                        },
                        {
                            "date": "2025-10-30",
                            "measured": 106.0
                        },
                        {
                            "date": "2025-10-31",
                            "measured": 106.0
                        },
                        {
                            "date": "2025-11-01",
                            "measured": 106.0
                        },
                        {
                            "date": "2025-11-02",
                            "measured": 106.0
                        },
                        {
                            "date": "2025-11-03",
                            "measured": 106.0
                        },
                        {
                            "date": "2025-11-04",
                            "measured": 106.0
                        },
                        {
                            "date": "2025-11-05",
                            "measured": 106.0
                        },
                        {
                            "date": "2025-11-06",
                            "measured": 106.0
                        },
                        {
                            "date": "2025-11-07",
                            "measured": 106.0
                        },
                        {
                            "date": "2025-11-08",
                            "measured": 106.0
                        },
                        {
                            "date": "2025-11-09",
                            "measured": 106.0
                        },
                        {
                            "date": "2025-11-10",
                            "measured": 106.0
                        },
                        {
                            "date": "2025-11-11",
                            "measured": 106.0
                        },
                        {
                            "date": "2025-11-12",
                            "measured": 106.0
                        },
                        {
                            "date": "2025-11-13",
                            "measured": 106.0
                        },
                        {
                            "date": "2025-11-14",
                            "measured": 106.0
                        },
                        {
                            "date": "2025-11-15",
                            "measured": 106.0
                        },
                        {
                            "date": "2025-11-16",
                            "measured": 106.0
                        },
                        {
                            "date": "2025-11-17",
                            "measured": 106.0
                        },
                        {
                            "date": "2025-11-18",
                            "measured": 107.0
                        },
                        {
                            "date": "2025-11-19",
                            "measured": 124.0
                        },
                        {
                            "date": "2025-11-20",
                            "measured": 142.0
                        },
                        {
                            "date": "2025-11-21",
                            "measured": 141.0
                        },
                        {
                            "date": "2025-11-22",
                            "measured": 141.0
                        },
                        {
                            "date": "2025-11-23",
                            "measured": 146.0
                        },
                        {
                            "date": "2025-11-24",
                            "measured": 148.0
                        },
                        {
                            "date": "2025-11-25",
                            "measured": 148.0
                        },
                        {
                            "date": "2025-11-26",
                            "measured": 138.0
                        },
                        {
                            "date": "2025-11-27",
                            "measured": 143.0
                        },
                        {
                            "date": "2025-11-28",
                            "measured": 150.0
                        },
                        {
                            "date": "2025-11-29",
                            "measured": 147.0
                        },
                        {
                            "date": "2025-11-30",
                            "measured": 148.0
                        },
                        {
                            "date": "2025-12-01",
                            "measured": 153.0
                        },
                        {
                            "date": "2025-12-02",
                            "measured": 148.0
                        },
                        {
                            "date": "2025-12-03",
                            "measured": 142.0
                        },
                        {
                            "date": "2025-12-04",
                            "measured": 148.0
                        },
                        {
                            "date": "2025-12-05",
                            "measured": 151.0
                        },
                        {
                            "date": "2025-12-06",
                            "measured": 146.0
                        },
                        {
                            "date": "2025-12-07",
                            "measured": 144.0
                        },
                        {
                            "date": "2025-12-08",
                            "measured": 146.0
                        },
                        {
                            "date": "2025-12-09",
                            "measured": 142.0
                        },
                        {
                            "date": "2025-12-10",
                            "measured": 138.0
                        },
                        {
                            "date": "2025-12-11",
                            "measured": 144.0
                        },
                        {
                            "date": "2025-12-12",
                            "measured": 146.0
                        },
                        {
                            "date": "2025-12-13",
                            "measured": 150.0
                        },
                        {
                            "date": "2025-12-14",
                            "measured": 146.0
                        },
                        {
                            "date": "2025-12-15",
                            "measured": 149.0
                        },
                        {
                            "date": "2025-12-16",
                            "measured": 149.0
                        },
                        {
                            "date": "2025-12-17",
                            "measured": 146.0
                        },
                        {
                            "date": "2025-12-18",
                            "measured": 145.0
                        },
                        {
                            "date": "2025-12-19",
                            "measured": 144.0
                        },
                        {
                            "date": "2025-12-20",
                            "measured": 143.0
                        }
                    ]
                },
                {
                    "kpi_key": "percentage_parked_longer_then_24_hours",
                    "granularity": "day",
                    "values": [
                        {
                            "date": "2025-09-16",
                            "measured": 74.2
                        },
                        {
                            "date": "2025-09-17",
                            "measured": 78.6
                        },
                        {
                            "date": "2025-09-18",
                            "measured": 38.9
                        },
                        {
                            "date": "2025-09-19",
                            "measured": 37.9
                        },
                        {
                            "date": "2025-09-20",
                            "measured": 30.4
                        },
                        {
                            "date": "2025-09-21",
                            "measured": 37.8
                        },
                        {
                            "date": "2025-09-22",
                            "measured": 45.0
                        },
                        {
                            "date": "2025-09-23",
                            "measured": 46.7
                        },
                        {
                            "date": "2025-09-24",
                            "measured": 48.4
                        },
                        {
                            "date": "2025-09-25",
                            "measured": 33.8
                        },
                        {
                            "date": "2025-09-26",
                            "measured": 38.2
                        },
                        {
                            "date": "2025-09-27",
                            "measured": 43.0
                        },
                        {
                            "date": "2025-09-28",
                            "measured": 29.1
                        },
                        {
                            "date": "2025-09-29",
                            "measured": 36.6
                        },
                        {
                            "date": "2025-09-30",
                            "measured": 44.2
                        },
                        {
                            "date": "2025-10-01",
                            "measured": 38.9
                        },
                        {
                            "date": "2025-10-02",
                            "measured": 46.1
                        },
                        {
                            "date": "2025-10-03",
                            "measured": 37.5
                        },
                        {
                            "date": "2025-10-04",
                            "measured": 36.9
                        },
                        {
                            "date": "2025-10-05",
                            "measured": 23.6
                        },
                        {
                            "date": "2025-10-06",
                            "measured": 43.7
                        },
                        {
                            "date": "2025-10-07",
                            "measured": 50.0
                        },
                        {
                            "date": "2025-10-08",
                            "measured": 48.1
                        },
                        {
                            "date": "2025-10-09",
                            "measured": 48.3
                        },
                        {
                            "date": "2025-10-10",
                            "measured": 42.1
                        },
                        {
                            "date": "2025-10-11",
                            "measured": 42.0
                        },
                        {
                            "date": "2025-10-12",
                            "measured": 37.8
                        },
                        {
                            "date": "2025-10-13",
                            "measured": 37.8
                        },
                        {
                            "date": "2025-10-14",
                            "measured": 41.8
                        },
                        {
                            "date": "2025-10-15",
                            "measured": 47.8
                        },
                        {
                            "date": "2025-10-16",
                            "measured": 36.1
                        },
                        {
                            "date": "2025-10-17",
                            "measured": 39.6
                        },
                        {
                            "date": "2025-10-18",
                            "measured": 48.3
                        },
                        {
                            "date": "2025-10-19",
                            "measured": 40.4
                        },
                        {
                            "date": "2025-10-20",
                            "measured": 49.0
                        },
                        {
                            "date": "2025-10-21",
                            "measured": 42.8
                        },
                        {
                            "date": "2025-10-22",
                            "measured": 47.7
                        },
                        {
                            "date": "2025-10-23",
                            "measured": 40.7
                        },
                        {
                            "date": "2025-10-24",
                            "measured": 37.3
                        },
                        {
                            "date": "2025-10-25",
                            "measured": 92.5
                        },
                        {
                            "date": "2025-10-26",
                            "measured": 100.0
                        },
                        {
                            "date": "2025-10-27",
                            "measured": 100.0
                        },
                        {
                            "date": "2025-10-28",
                            "measured": 100.0
                        },
                        {
                            "date": "2025-10-29",
                            "measured": 100.0
                        },
                        {
                            "date": "2025-10-30",
                            "measured": 100.0
                        },
                        {
                            "date": "2025-10-31",
                            "measured": 100.0
                        },
                        {
                            "date": "2025-11-01",
                            "measured": 100.0
                        },
                        {
                            "date": "2025-11-02",
                            "measured": 100.0
                        },
                        {
                            "date": "2025-11-03",
                            "measured": 100.0
                        },
                        {
                            "date": "2025-11-04",
                            "measured": 100.0
                        },
                        {
                            "date": "2025-11-05",
                            "measured": 100.0
                        },
                        {
                            "date": "2025-11-06",
                            "measured": 100.0
                        },
                        {
                            "date": "2025-11-07",
                            "measured": 100.0
                        },
                        {
                            "date": "2025-11-08",
                            "measured": 100.0
                        },
                        {
                            "date": "2025-11-09",
                            "measured": 100.0
                        },
                        {
                            "date": "2025-11-10",
                            "measured": 100.0
                        },
                        {
                            "date": "2025-11-11",
                            "measured": 100.0
                        },
                        {
                            "date": "2025-11-12",
                            "measured": 100.0
                        },
                        {
                            "date": "2025-11-13",
                            "measured": 100.0
                        },
                        {
                            "date": "2025-11-14",
                            "measured": 100.0
                        },
                        {
                            "date": "2025-11-15",
                            "measured": 100.0
                        },
                        {
                            "date": "2025-11-16",
                            "measured": 100.0
                        },
                        {
                            "date": "2025-11-17",
                            "measured": 100.0
                        },
                        {
                            "date": "2025-11-18",
                            "measured": 100.0
                        },
                        {
                            "date": "2025-11-19",
                            "measured": 24.4
                        },
                        {
                            "date": "2025-11-20",
                            "measured": 34.5
                        },
                        {
                            "date": "2025-11-21",
                            "measured": 35.5
                        },
                        {
                            "date": "2025-11-22",
                            "measured": 41.0
                        },
                        {
                            "date": "2025-11-23",
                            "measured": 37.3
                        },
                        {
                            "date": "2025-11-24",
                            "measured": 31.8
                        },
                        {
                            "date": "2025-11-25",
                            "measured": 43.2
                        },
                        {
                            "date": "2025-11-26",
                            "measured": 38.4
                        },
                        {
                            "date": "2025-11-27",
                            "measured": 34.3
                        },
                        {
                            "date": "2025-11-28",
                            "measured": 41.3
                        },
                        {
                            "date": "2025-11-29",
                            "measured": 38.2
                        },
                        {
                            "date": "2025-11-30",
                            "measured": 39.9
                        },
                        {
                            "date": "2025-12-01",
                            "measured": 35.9
                        },
                        {
                            "date": "2025-12-02",
                            "measured": 41.9
                        },
                        {
                            "date": "2025-12-03",
                            "measured": 40.8
                        },
                        {
                            "date": "2025-12-04",
                            "measured": 38.5
                        },
                        {
                            "date": "2025-12-05",
                            "measured": 37.1
                        },
                        {
                            "date": "2025-12-06",
                            "measured": 35.9
                        },
                        {
                            "date": "2025-12-07",
                            "measured": 28.7
                        },
                        {
                            "date": "2025-12-08",
                            "measured": 39.7
                        },
                        {
                            "date": "2025-12-09",
                            "measured": 40.8
                        },
                        {
                            "date": "2025-12-10",
                            "measured": 36.2
                        },
                        {
                            "date": "2025-12-11",
                            "measured": 31.3
                        },
                        {
                            "date": "2025-12-12",
                            "measured": 44.5
                        },
                        {
                            "date": "2025-12-13",
                            "measured": 39.2
                        },
                        {
                            "date": "2025-12-14",
                            "measured": 34.0
                        },
                        {
                            "date": "2025-12-15",
                            "measured": 38.9
                        },
                        {
                            "date": "2025-12-16",
                            "measured": 37.6
                        },
                        {
                            "date": "2025-12-17",
                            "measured": 43.8
                        },
                        {
                            "date": "2025-12-18",
                            "measured": 34.5
                        },
                        {
                            "date": "2025-12-19",
                            "measured": 34.7
                        },
                        {
                            "date": "2025-12-20",
                            "measured": 41.0
                        }
                    ]
                },
                {
                    "kpi_key": "percentage_parked_longer_then_3_days",
                    "granularity": "day",
                    "values": [
                        {
                            "date": "2025-09-16",
                            "measured": 66.5
                        },
                        {
                            "date": "2025-09-17",
                            "measured": 66.9
                        },
                        {
                            "date": "2025-09-18",
                            "measured": 31.3
                        },
                        {
                            "date": "2025-09-19",
                            "measured": 18.6
                        },
                        {
                            "date": "2025-09-20",
                            "measured": 6.8
                        },
                        {
                            "date": "2025-09-21",
                            "measured": 7.7
                        },
                        {
                            "date": "2025-09-22",
                            "measured": 8.7
                        },
                        {
                            "date": "2025-09-23",
                            "measured": 12.5
                        },
                        {
                            "date": "2025-09-24",
                            "measured": 17.0
                        },
                        {
                            "date": "2025-09-25",
                            "measured": 14.2
                        },
                        {
                            "date": "2025-09-26",
                            "measured": 14.5
                        },
                        {
                            "date": "2025-09-27",
                            "measured": 12.1
                        },
                        {
                            "date": "2025-09-28",
                            "measured": 9.2
                        },
                        {
                            "date": "2025-09-29",
                            "measured": 8.5
                        },
                        {
                            "date": "2025-09-30",
                            "measured": 9.0
                        },
                        {
                            "date": "2025-10-01",
                            "measured": 10.8
                        },
                        {
                            "date": "2025-10-02",
                            "measured": 12.3
                        },
                        {
                            "date": "2025-10-03",
                            "measured": 12.5
                        },
                        {
                            "date": "2025-10-04",
                            "measured": 10.8
                        },
                        {
                            "date": "2025-10-05",
                            "measured": 6.8
                        },
                        {
                            "date": "2025-10-06",
                            "measured": 7.6
                        },
                        {
                            "date": "2025-10-07",
                            "measured": 12.5
                        },
                        {
                            "date": "2025-10-08",
                            "measured": 22.7
                        },
                        {
                            "date": "2025-10-09",
                            "measured": 21.5
                        },
                        {
                            "date": "2025-10-10",
                            "measured": 16.4
                        },
                        {
                            "date": "2025-10-11",
                            "measured": 17.3
                        },
                        {
                            "date": "2025-10-12",
                            "measured": 14.7
                        },
                        {
                            "date": "2025-10-13",
                            "measured": 9.0
                        },
                        {
                            "date": "2025-10-14",
                            "measured": 7.6
                        },
                        {
                            "date": "2025-10-15",
                            "measured": 11.3
                        },
                        {
                            "date": "2025-10-16",
                            "measured": 14.6
                        },
                        {
                            "date": "2025-10-17",
                            "measured": 9.1
                        },
                        {
                            "date": "2025-10-18",
                            "measured": 11.6
                        },
                        {
                            "date": "2025-10-19",
                            "measured": 11.6
                        },
                        {
                            "date": "2025-10-20",
                            "measured": 14.3
                        },
                        {
                            "date": "2025-10-21",
                            "measured": 12.4
                        },
                        {
                            "date": "2025-10-22",
                            "measured": 16.6
                        },
                        {
                            "date": "2025-10-23",
                            "measured": 14.7
                        },
                        {
                            "date": "2025-10-24",
                            "measured": 10.7
                        },
                        {
                            "date": "2025-10-25",
                            "measured": 20.8
                        },
                        {
                            "date": "2025-10-26",
                            "measured": 37.7
                        },
                        {
                            "date": "2025-10-27",
                            "measured": 92.5
                        },
                        {
                            "date": "2025-10-28",
                            "measured": 100.0
                        },
                        {
                            "date": "2025-10-29",
                            "measured": 100.0
                        },
                        {
                            "date": "2025-10-30",
                            "measured": 100.0
                        },
                        {
                            "date": "2025-10-31",
                            "measured": 100.0
                        },
                        {
                            "date": "2025-11-01",
                            "measured": 100.0
                        },
                        {
                            "date": "2025-11-02",
                            "measured": 100.0
                        },
                        {
                            "date": "2025-11-03",
                            "measured": 100.0
                        },
                        {
                            "date": "2025-11-04",
                            "measured": 100.0
                        },
                        {
                            "date": "2025-11-05",
                            "measured": 100.0
                        },
                        {
                            "date": "2025-11-06",
                            "measured": 100.0
                        },
                        {
                            "date": "2025-11-07",
                            "measured": 100.0
                        },
                        {
                            "date": "2025-11-08",
                            "measured": 100.0
                        },
                        {
                            "date": "2025-11-09",
                            "measured": 100.0
                        },
                        {
                            "date": "2025-11-10",
                            "measured": 100.0
                        },
                        {
                            "date": "2025-11-11",
                            "measured": 100.0
                        },
                        {
                            "date": "2025-11-12",
                            "measured": 100.0
                        },
                        {
                            "date": "2025-11-13",
                            "measured": 100.0
                        },
                        {
                            "date": "2025-11-14",
                            "measured": 100.0
                        },
                        {
                            "date": "2025-11-15",
                            "measured": 100.0
                        },
                        {
                            "date": "2025-11-16",
                            "measured": 100.0
                        },
                        {
                            "date": "2025-11-17",
                            "measured": 100.0
                        },
                        {
                            "date": "2025-11-18",
                            "measured": 100.0
                        },
                        {
                            "date": "2025-11-19",
                            "measured": 24.4
                        },
                        {
                            "date": "2025-11-20",
                            "measured": 11.3
                        },
                        {
                            "date": "2025-11-21",
                            "measured": 6.4
                        },
                        {
                            "date": "2025-11-22",
                            "measured": 12.2
                        },
                        {
                            "date": "2025-11-23",
                            "measured": 12.7
                        },
                        {
                            "date": "2025-11-24",
                            "measured": 10.1
                        },
                        {
                            "date": "2025-11-25",
                            "measured": 10.8
                        },
                        {
                            "date": "2025-11-26",
                            "measured": 7.2
                        },
                        {
                            "date": "2025-11-27",
                            "measured": 9.8
                        },
                        {
                            "date": "2025-11-28",
                            "measured": 8.7
                        },
                        {
                            "date": "2025-11-29",
                            "measured": 11.1
                        },
                        {
                            "date": "2025-11-30",
                            "measured": 11.5
                        },
                        {
                            "date": "2025-12-01",
                            "measured": 11.8
                        },
                        {
                            "date": "2025-12-02",
                            "measured": 12.8
                        },
                        {
                            "date": "2025-12-03",
                            "measured": 13.4
                        },
                        {
                            "date": "2025-12-04",
                            "measured": 12.8
                        },
                        {
                            "date": "2025-12-05",
                            "measured": 11.3
                        },
                        {
                            "date": "2025-12-06",
                            "measured": 10.6
                        },
                        {
                            "date": "2025-12-07",
                            "measured": 10.5
                        },
                        {
                            "date": "2025-12-08",
                            "measured": 9.6
                        },
                        {
                            "date": "2025-12-09",
                            "measured": 7.7
                        },
                        {
                            "date": "2025-12-10",
                            "measured": 6.5
                        },
                        {
                            "date": "2025-12-11",
                            "measured": 9.0
                        },
                        {
                            "date": "2025-12-12",
                            "measured": 12.3
                        },
                        {
                            "date": "2025-12-13",
                            "measured": 12.2
                        },
                        {
                            "date": "2025-12-14",
                            "measured": 10.4
                        },
                        {
                            "date": "2025-12-15",
                            "measured": 10.7
                        },
                        {
                            "date": "2025-12-16",
                            "measured": 10.1
                        },
                        {
                            "date": "2025-12-17",
                            "measured": 11.0
                        },
                        {
                            "date": "2025-12-18",
                            "measured": 11.0
                        },
                        {
                            "date": "2025-12-19",
                            "measured": 11.1
                        },
                        {
                            "date": "2025-12-20",
                            "measured": 10.1
                        }
                    ]
                },
                {
                    "kpi_key": "percentage_parked_longer_then_7_days",
                    "granularity": "day",
                    "values": [
                        {
                            "date": "2025-09-16",
                            "measured": 63.9
                        },
                        {
                            "date": "2025-09-17",
                            "measured": 64.3
                        },
                        {
                            "date": "2025-09-18",
                            "measured": 29.2
                        },
                        {
                            "date": "2025-09-19",
                            "measured": 15.9
                        },
                        {
                            "date": "2025-09-20",
                            "measured": 5.4
                        },
                        {
                            "date": "2025-09-21",
                            "measured": 3.5
                        },
                        {
                            "date": "2025-09-22",
                            "measured": 2.7
                        },
                        {
                            "date": "2025-09-23",
                            "measured": 2.6
                        },
                        {
                            "date": "2025-09-24",
                            "measured": 2.0
                        },
                        {
                            "date": "2025-09-25",
                            "measured": 2.7
                        },
                        {
                            "date": "2025-09-26",
                            "measured": 2.0
                        },
                        {
                            "date": "2025-09-27",
                            "measured": 2.7
                        },
                        {
                            "date": "2025-09-28",
                            "measured": 2.1
                        },
                        {
                            "date": "2025-09-29",
                            "measured": 2.0
                        },
                        {
                            "date": "2025-09-30",
                            "measured": 1.9
                        },
                        {
                            "date": "2025-10-01",
                            "measured": 2.5
                        },
                        {
                            "date": "2025-10-02",
                            "measured": 2.6
                        },
                        {
                            "date": "2025-10-03",
                            "measured": 2.0
                        },
                        {
                            "date": "2025-10-04",
                            "measured": 2.5
                        },
                        {
                            "date": "2025-10-05",
                            "measured": 2.7
                        },
                        {
                            "date": "2025-10-06",
                            "measured": 2.5
                        },
                        {
                            "date": "2025-10-07",
                            "measured": 3.3
                        },
                        {
                            "date": "2025-10-08",
                            "measured": 3.2
                        },
                        {
                            "date": "2025-10-09",
                            "measured": 2.7
                        },
                        {
                            "date": "2025-10-10",
                            "measured": 3.9
                        },
                        {
                            "date": "2025-10-11",
                            "measured": 4.7
                        },
                        {
                            "date": "2025-10-12",
                            "measured": 7.7
                        },
                        {
                            "date": "2025-10-13",
                            "measured": 4.5
                        },
                        {
                            "date": "2025-10-14",
                            "measured": 2.5
                        },
                        {
                            "date": "2025-10-15",
                            "measured": 2.5
                        },
                        {
                            "date": "2025-10-16",
                            "measured": 1.3
                        },
                        {
                            "date": "2025-10-17",
                            "measured": 1.9
                        },
                        {
                            "date": "2025-10-18",
                            "measured": 1.4
                        },
                        {
                            "date": "2025-10-19",
                            "measured": 2.1
                        },
                        {
                            "date": "2025-10-20",
                            "measured": 1.4
                        },
                        {
                            "date": "2025-10-21",
                            "measured": 0.7
                        },
                        {
                            "date": "2025-10-22",
                            "measured": 0.7
                        },
                        {
                            "date": "2025-10-23",
                            "measured": 0.7
                        },
                        {
                            "date": "2025-10-24",
                            "measured": 2.7
                        },
                        {
                            "date": "2025-10-25",
                            "measured": 3.8
                        },
                        {
                            "date": "2025-10-26",
                            "measured": 5.7
                        },
                        {
                            "date": "2025-10-27",
                            "measured": 7.5
                        },
                        {
                            "date": "2025-10-28",
                            "measured": 12.3
                        },
                        {
                            "date": "2025-10-29",
                            "measured": 20.8
                        },
                        {
                            "date": "2025-10-30",
                            "measured": 37.7
                        },
                        {
                            "date": "2025-10-31",
                            "measured": 92.5
                        },
                        {
                            "date": "2025-11-01",
                            "measured": 100.0
                        },
                        {
                            "date": "2025-11-02",
                            "measured": 100.0
                        },
                        {
                            "date": "2025-11-03",
                            "measured": 100.0
                        },
                        {
                            "date": "2025-11-04",
                            "measured": 100.0
                        },
                        {
                            "date": "2025-11-05",
                            "measured": 100.0
                        },
                        {
                            "date": "2025-11-06",
                            "measured": 100.0
                        },
                        {
                            "date": "2025-11-07",
                            "measured": 100.0
                        },
                        {
                            "date": "2025-11-08",
                            "measured": 100.0
                        },
                        {
                            "date": "2025-11-09",
                            "measured": 100.0
                        },
                        {
                            "date": "2025-11-10",
                            "measured": 100.0
                        },
                        {
                            "date": "2025-11-11",
                            "measured": 100.0
                        },
                        {
                            "date": "2025-11-12",
                            "measured": 100.0
                        },
                        {
                            "date": "2025-11-13",
                            "measured": 100.0
                        },
                        {
                            "date": "2025-11-14",
                            "measured": 100.0
                        },
                        {
                            "date": "2025-11-15",
                            "measured": 100.0
                        },
                        {
                            "date": "2025-11-16",
                            "measured": 100.0
                        },
                        {
                            "date": "2025-11-17",
                            "measured": 100.0
                        },
                        {
                            "date": "2025-11-18",
                            "measured": 100.0
                        },
                        {
                            "date": "2025-11-19",
                            "measured": 24.4
                        },
                        {
                            "date": "2025-11-20",
                            "measured": 11.3
                        },
                        {
                            "date": "2025-11-21",
                            "measured": 6.4
                        },
                        {
                            "date": "2025-11-22",
                            "measured": 4.3
                        },
                        {
                            "date": "2025-11-23",
                            "measured": 2.8
                        },
                        {
                            "date": "2025-11-24",
                            "measured": 1.4
                        },
                        {
                            "date": "2025-11-25",
                            "measured": 0.7
                        },
                        {
                            "date": "2025-11-26",
                            "measured": 2.9
                        },
                        {
                            "date": "2025-11-27",
                            "measured": 2.8
                        },
                        {
                            "date": "2025-11-28",
                            "measured": 2.7
                        },
                        {
                            "date": "2025-11-29",
                            "measured": 2.1
                        },
                        {
                            "date": "2025-11-30",
                            "measured": 2.7
                        },
                        {
                            "date": "2025-12-01",
                            "measured": 2.0
                        },
                        {
                            "date": "2025-12-02",
                            "measured": 2.0
                        },
                        {
                            "date": "2025-12-03",
                            "measured": 1.4
                        },
                        {
                            "date": "2025-12-04",
                            "measured": 2.7
                        },
                        {
                            "date": "2025-12-05",
                            "measured": 3.3
                        },
                        {
                            "date": "2025-12-06",
                            "measured": 4.2
                        },
                        {
                            "date": "2025-12-07",
                            "measured": 3.5
                        },
                        {
                            "date": "2025-12-08",
                            "measured": 3.4
                        },
                        {
                            "date": "2025-12-09",
                            "measured": 3.5
                        },
                        {
                            "date": "2025-12-10",
                            "measured": 2.9
                        },
                        {
                            "date": "2025-12-11",
                            "measured": 3.5
                        },
                        {
                            "date": "2025-12-12",
                            "measured": 2.7
                        },
                        {
                            "date": "2025-12-13",
                            "measured": 3.4
                        },
                        {
                            "date": "2025-12-14",
                            "measured": 4.2
                        },
                        {
                            "date": "2025-12-15",
                            "measured": 4.0
                        },
                        {
                            "date": "2025-12-16",
                            "measured": 4.0
                        },
                        {
                            "date": "2025-12-17",
                            "measured": 4.1
                        },
                        {
                            "date": "2025-12-18",
                            "measured": 3.4
                        },
                        {
                            "date": "2025-12-19",
                            "measured": 2.1
                        },
                        {
                            "date": "2025-12-20",
                            "measured": 2.2
                        }
                    ]
                },
                {
                    "kpi_key": "percentage_parked_longer_then_14_days",
                    "granularity": "day",
                    "values": [
                        {
                            "date": "2025-09-16",
                            "measured": 63.2
                        },
                        {
                            "date": "2025-09-17",
                            "measured": 63.6
                        },
                        {
                            "date": "2025-09-18",
                            "measured": 28.5
                        },
                        {
                            "date": "2025-09-19",
                            "measured": 15.2
                        },
                        {
                            "date": "2025-09-20",
                            "measured": 4.7
                        },
                        {
                            "date": "2025-09-21",
                            "measured": 2.8
                        },
                        {
                            "date": "2025-09-22",
                            "measured": 2.0
                        },
                        {
                            "date": "2025-09-23",
                            "measured": 2.6
                        },
                        {
                            "date": "2025-09-24",
                            "measured": 2.0
                        },
                        {
                            "date": "2025-09-25",
                            "measured": 2.0
                        },
                        {
                            "date": "2025-09-26",
                            "measured": 1.3
                        },
                        {
                            "date": "2025-09-27",
                            "measured": 0.7
                        },
                        {
                            "date": "2025-09-28",
                            "measured": 0.7
                        },
                        {
                            "date": "2025-10-02",
                            "measured": 0.6
                        },
                        {
                            "date": "2025-10-06",
                            "measured": 0.6
                        },
                        {
                            "date": "2025-10-07",
                            "measured": 1.3
                        },
                        {
                            "date": "2025-10-08",
                            "measured": 1.9
                        },
                        {
                            "date": "2025-10-09",
                            "measured": 1.3
                        },
                        {
                            "date": "2025-10-10",
                            "measured": 1.3
                        },
                        {
                            "date": "2025-10-11",
                            "measured": 1.3
                        },
                        {
                            "date": "2025-10-12",
                            "measured": 1.4
                        },
                        {
                            "date": "2025-10-13",
                            "measured": 0.6
                        },
                        {
                            "date": "2025-10-14",
                            "measured": 1.3
                        },
                        {
                            "date": "2025-10-15",
                            "measured": 0.6
                        },
                        {
                            "date": "2025-10-18",
                            "measured": 0.7
                        },
                        {
                            "date": "2025-10-19",
                            "measured": 0.7
                        },
                        {
                            "date": "2025-10-31",
                            "measured": 3.8
                        },
                        {
                            "date": "2025-11-01",
                            "measured": 3.8
                        },
                        {
                            "date": "2025-11-02",
                            "measured": 5.7
                        },
                        {
                            "date": "2025-11-03",
                            "measured": 7.5
                        },
                        {
                            "date": "2025-11-04",
                            "measured": 12.3
                        },
                        {
                            "date": "2025-11-05",
                            "measured": 20.8
                        },
                        {
                            "date": "2025-11-06",
                            "measured": 37.7
                        },
                        {
                            "date": "2025-11-07",
                            "measured": 92.5
                        },
                        {
                            "date": "2025-11-08",
                            "measured": 100.0
                        },
                        {
                            "date": "2025-11-09",
                            "measured": 100.0
                        },
                        {
                            "date": "2025-11-10",
                            "measured": 100.0
                        },
                        {
                            "date": "2025-11-11",
                            "measured": 100.0
                        },
                        {
                            "date": "2025-11-12",
                            "measured": 100.0
                        },
                        {
                            "date": "2025-11-13",
                            "measured": 100.0
                        },
                        {
                            "date": "2025-11-14",
                            "measured": 100.0
                        },
                        {
                            "date": "2025-11-15",
                            "measured": 100.0
                        },
                        {
                            "date": "2025-11-16",
                            "measured": 100.0
                        },
                        {
                            "date": "2025-11-17",
                            "measured": 100.0
                        },
                        {
                            "date": "2025-11-18",
                            "measured": 100.0
                        },
                        {
                            "date": "2025-11-19",
                            "measured": 24.4
                        },
                        {
                            "date": "2025-11-20",
                            "measured": 11.3
                        },
                        {
                            "date": "2025-11-21",
                            "measured": 6.4
                        },
                        {
                            "date": "2025-11-22",
                            "measured": 4.3
                        },
                        {
                            "date": "2025-11-23",
                            "measured": 2.8
                        },
                        {
                            "date": "2025-11-24",
                            "measured": 1.4
                        },
                        {
                            "date": "2025-11-25",
                            "measured": 0.7
                        },
                        {
                            "date": "2025-11-26",
                            "measured": 0.7
                        },
                        {
                            "date": "2025-11-27",
                            "measured": 0.7
                        },
                        {
                            "date": "2025-11-28",
                            "measured": 0.7
                        },
                        {
                            "date": "2025-11-29",
                            "measured": 0.7
                        },
                        {
                            "date": "2025-11-30",
                            "measured": 0.7
                        },
                        {
                            "date": "2025-12-01",
                            "measured": 0.7
                        },
                        {
                            "date": "2025-12-02",
                            "measured": 0.7
                        },
                        {
                            "date": "2025-12-03",
                            "measured": 0.7
                        },
                        {
                            "date": "2025-12-04",
                            "measured": 0.7
                        },
                        {
                            "date": "2025-12-05",
                            "measured": 0.7
                        },
                        {
                            "date": "2025-12-06",
                            "measured": 0.7
                        },
                        {
                            "date": "2025-12-07",
                            "measured": 0.7
                        },
                        {
                            "date": "2025-12-08",
                            "measured": 0.7
                        },
                        {
                            "date": "2025-12-09",
                            "measured": 0.7
                        },
                        {
                            "date": "2025-12-10",
                            "measured": 0.7
                        },
                        {
                            "date": "2025-12-11",
                            "measured": 2.1
                        },
                        {
                            "date": "2025-12-12",
                            "measured": 2.7
                        },
                        {
                            "date": "2025-12-13",
                            "measured": 2.7
                        },
                        {
                            "date": "2025-12-14",
                            "measured": 2.8
                        },
                        {
                            "date": "2025-12-15",
                            "measured": 2.7
                        },
                        {
                            "date": "2025-12-16",
                            "measured": 2.7
                        },
                        {
                            "date": "2025-12-17",
                            "measured": 2.7
                        },
                        {
                            "date": "2025-12-18",
                            "measured": 2.1
                        },
                        {
                            "date": "2025-12-19",
                            "measured": 1.4
                        },
                        {
                            "date": "2025-12-20",
                            "measured": 1.4
                        }
                    ]
                }
            ]
        },
        {
            "operator": "lime",
            "form_factor": "bicycle",
            "propulsion_type": "human",
            "geometry_ref": "cbs:GM0599",
            "kpis": [
                {
                    "kpi_key": "number_of_wrongly_parked_vehicles",
                    "granularity": "day",
                    "values": [
                        {
                            "date": "2025-09-16",
                            "measured": 463.0
                        },
                        {
                            "date": "2025-09-17",
                            "measured": 457.0
                        },
                        {
                            "date": "2025-09-18",
                            "measured": 491.0
                        },
                        {
                            "date": "2025-09-19",
                            "measured": 654.0
                        },
                        {
                            "date": "2025-09-20",
                            "measured": 760.0
                        },
                        {
                            "date": "2025-09-21",
                            "measured": 572.0
                        },
                        {
                            "date": "2025-09-22",
                            "measured": 426.0
                        },
                        {
                            "date": "2025-09-23",
                            "measured": 440.0
                        },
                        {
                            "date": "2025-09-24",
                            "measured": 580.0
                        },
                        {
                            "date": "2025-09-25",
                            "measured": 597.0
                        },
                        {
                            "date": "2025-09-26",
                            "measured": 620.0
                        },
                        {
                            "date": "2025-09-27",
                            "measured": 760.0
                        },
                        {
                            "date": "2025-09-28",
                            "measured": 624.0
                        },
                        {
                            "date": "2025-09-29",
                            "measured": 532.0
                        },
                        {
                            "date": "2025-09-30",
                            "measured": 477.0
                        },
                        {
                            "date": "2025-10-01",
                            "measured": 481.0
                        },
                        {
                            "date": "2025-10-02",
                            "measured": 602.0
                        },
                        {
                            "date": "2025-10-03",
                            "measured": 442.0
                        },
                        {
                            "date": "2025-10-04",
                            "measured": 578.0
                        },
                        {
                            "date": "2025-10-05",
                            "measured": 556.0
                        },
                        {
                            "date": "2025-10-06",
                            "measured": 396.0
                        },
                        {
                            "date": "2025-10-08",
                            "measured": 516.0
                        },
                        {
                            "date": "2025-10-09",
                            "measured": 459.0
                        },
                        {
                            "date": "2025-10-10",
                            "measured": 644.0
                        },
                        {
                            "date": "2025-10-11",
                            "measured": 699.0
                        },
                        {
                            "date": "2025-10-12",
                            "measured": 702.0
                        },
                        {
                            "date": "2025-10-13",
                            "measured": 413.0
                        },
                        {
                            "date": "2025-10-14",
                            "measured": 647.0
                        },
                        {
                            "date": "2025-10-15",
                            "measured": 560.0
                        },
                        {
                            "date": "2025-10-16",
                            "measured": 754.0
                        },
                        {
                            "date": "2025-10-17",
                            "measured": 837.0
                        },
                        {
                            "date": "2025-10-18",
                            "measured": 864.0
                        },
                        {
                            "date": "2025-10-19",
                            "measured": 600.0
                        },
                        {
                            "date": "2025-10-20",
                            "measured": 368.0
                        },
                        {
                            "date": "2025-10-21",
                            "measured": 393.0
                        },
                        {
                            "date": "2025-10-22",
                            "measured": 699.0
                        },
                        {
                            "date": "2025-10-23",
                            "measured": 485.0
                        },
                        {
                            "date": "2025-10-24",
                            "measured": 678.0
                        },
                        {
                            "date": "2025-10-25",
                            "measured": 627.0
                        },
                        {
                            "date": "2025-10-26",
                            "measured": 618.0
                        },
                        {
                            "date": "2025-10-27",
                            "measured": 397.0
                        },
                        {
                            "date": "2025-10-28",
                            "measured": 608.0
                        },
                        {
                            "date": "2025-10-29",
                            "measured": 664.0
                        },
                        {
                            "date": "2025-10-30",
                            "measured": 764.0
                        },
                        {
                            "date": "2025-10-31",
                            "measured": 796.0
                        },
                        {
                            "date": "2025-11-01",
                            "measured": 628.0
                        },
                        {
                            "date": "2025-11-02",
                            "measured": 565.0
                        },
                        {
                            "date": "2025-11-03",
                            "measured": 478.0
                        },
                        {
                            "date": "2025-11-04",
                            "measured": 483.0
                        },
                        {
                            "date": "2025-11-05",
                            "measured": 445.0
                        },
                        {
                            "date": "2025-11-06",
                            "measured": 595.0
                        },
                        {
                            "date": "2025-11-08",
                            "measured": 840.0
                        },
                        {
                            "date": "2025-11-09",
                            "measured": 570.0
                        },
                        {
                            "date": "2025-11-10",
                            "measured": 419.0
                        },
                        {
                            "date": "2025-11-11",
                            "measured": 536.0
                        },
                        {
                            "date": "2025-11-12",
                            "measured": 647.0
                        },
                        {
                            "date": "2025-11-13",
                            "measured": 692.0
                        },
                        {
                            "date": "2025-11-14",
                            "measured": 550.0
                        },
                        {
                            "date": "2025-11-15",
                            "measured": 710.0
                        },
                        {
                            "date": "2025-11-16",
                            "measured": 642.0
                        },
                        {
                            "date": "2025-11-17",
                            "measured": 464.0
                        },
                        {
                            "date": "2025-11-18",
                            "measured": 424.0
                        },
                        {
                            "date": "2025-11-19",
                            "measured": 444.0
                        },
                        {
                            "date": "2025-11-20",
                            "measured": 476.0
                        },
                        {
                            "date": "2025-11-21",
                            "measured": 514.0
                        },
                        {
                            "date": "2025-11-22",
                            "measured": 431.0
                        },
                        {
                            "date": "2025-11-23",
                            "measured": 282.0
                        },
                        {
                            "date": "2025-11-24",
                            "measured": 404.0
                        },
                        {
                            "date": "2025-11-25",
                            "measured": 449.0
                        },
                        {
                            "date": "2025-11-26",
                            "measured": 455.0
                        },
                        {
                            "date": "2025-11-27",
                            "measured": 455.0
                        },
                        {
                            "date": "2025-11-28",
                            "measured": 516.0
                        },
                        {
                            "date": "2025-11-29",
                            "measured": 517.0
                        },
                        {
                            "date": "2025-11-30",
                            "measured": 465.0
                        },
                        {
                            "date": "2025-12-01",
                            "measured": 340.0
                        },
                        {
                            "date": "2025-12-02",
                            "measured": 447.0
                        },
                        {
                            "date": "2025-12-03",
                            "measured": 411.0
                        },
                        {
                            "date": "2025-12-04",
                            "measured": 507.0
                        },
                        {
                            "date": "2025-12-05",
                            "measured": 630.0
                        },
                        {
                            "date": "2025-12-06",
                            "measured": 561.0
                        },
                        {
                            "date": "2025-12-07",
                            "measured": 479.0
                        },
                        {
                            "date": "2025-12-09",
                            "measured": 536.0
                        },
                        {
                            "date": "2025-12-10",
                            "measured": 581.0
                        },
                        {
                            "date": "2025-12-11",
                            "measured": 482.0
                        },
                        {
                            "date": "2025-12-12",
                            "measured": 569.0
                        },
                        {
                            "date": "2025-12-13",
                            "measured": 604.0
                        },
                        {
                            "date": "2025-12-14",
                            "measured": 548.0
                        },
                        {
                            "date": "2025-12-15",
                            "measured": 485.0
                        },
                        {
                            "date": "2025-12-16",
                            "measured": 565.0
                        },
                        {
                            "date": "2025-12-17",
                            "measured": 508.0
                        },
                        {
                            "date": "2025-12-18",
                            "measured": 482.0
                        },
                        {
                            "date": "2025-12-19",
                            "measured": 547.0
                        },
                        {
                            "date": "2025-12-20",
                            "measured": 490.0
                        }
                    ]
                },
                {
                    "kpi_key": "vehicle_cap",
                    "granularity": "day",
                    "values": [
                        {
                            "date": "2025-09-16",
                            "measured": 1106.0
                        },
                        {
                            "date": "2025-09-17",
                            "measured": 1099.0
                        },
                        {
                            "date": "2025-09-18",
                            "measured": 1099.0
                        },
                        {
                            "date": "2025-09-19",
                            "measured": 1102.0
                        },
                        {
                            "date": "2025-09-20",
                            "measured": 1087.0
                        },
                        {
                            "date": "2025-09-21",
                            "measured": 1068.0
                        },
                        {
                            "date": "2025-09-22",
                            "measured": 1048.0
                        },
                        {
                            "date": "2025-09-23",
                            "measured": 1065.0
                        },
                        {
                            "date": "2025-09-24",
                            "measured": 1083.0
                        },
                        {
                            "date": "2025-09-25",
                            "measured": 1075.0
                        },
                        {
                            "date": "2025-09-26",
                            "measured": 1090.0
                        },
                        {
                            "date": "2025-09-27",
                            "measured": 1097.0
                        },
                        {
                            "date": "2025-09-28",
                            "measured": 1047.0
                        },
                        {
                            "date": "2025-09-29",
                            "measured": 1033.0
                        },
                        {
                            "date": "2025-09-30",
                            "measured": 1019.0
                        },
                        {
                            "date": "2025-10-01",
                            "measured": 1059.0
                        },
                        {
                            "date": "2025-10-02",
                            "measured": 1063.0
                        },
                        {
                            "date": "2025-10-03",
                            "measured": 1066.0
                        },
                        {
                            "date": "2025-10-04",
                            "measured": 1092.0
                        },
                        {
                            "date": "2025-10-05",
                            "measured": 1058.0
                        },
                        {
                            "date": "2025-10-06",
                            "measured": 1030.0
                        },
                        {
                            "date": "2025-10-07",
                            "measured": 1040.0
                        },
                        {
                            "date": "2025-10-08",
                            "measured": 1047.0
                        },
                        {
                            "date": "2025-10-09",
                            "measured": 1057.0
                        },
                        {
                            "date": "2025-10-10",
                            "measured": 1077.0
                        },
                        {
                            "date": "2025-10-11",
                            "measured": 1096.0
                        },
                        {
                            "date": "2025-10-12",
                            "measured": 1112.0
                        },
                        {
                            "date": "2025-10-13",
                            "measured": 1095.0
                        },
                        {
                            "date": "2025-10-14",
                            "measured": 1123.0
                        },
                        {
                            "date": "2025-10-15",
                            "measured": 1139.0
                        },
                        {
                            "date": "2025-10-16",
                            "measured": 1132.0
                        },
                        {
                            "date": "2025-10-17",
                            "measured": 1133.0
                        },
                        {
                            "date": "2025-10-18",
                            "measured": 1131.0
                        },
                        {
                            "date": "2025-10-19",
                            "measured": 1118.0
                        },
                        {
                            "date": "2025-10-20",
                            "measured": 1103.0
                        },
                        {
                            "date": "2025-10-21",
                            "measured": 1120.0
                        },
                        {
                            "date": "2025-10-22",
                            "measured": 1144.0
                        },
                        {
                            "date": "2025-10-23",
                            "measured": 1135.0
                        },
                        {
                            "date": "2025-10-24",
                            "measured": 1134.0
                        },
                        {
                            "date": "2025-10-25",
                            "measured": 1103.0
                        },
                        {
                            "date": "2025-10-26",
                            "measured": 1082.0
                        },
                        {
                            "date": "2025-10-27",
                            "measured": 1077.0
                        },
                        {
                            "date": "2025-10-28",
                            "measured": 1100.0
                        },
                        {
                            "date": "2025-10-29",
                            "measured": 1113.0
                        },
                        {
                            "date": "2025-10-30",
                            "measured": 1108.0
                        },
                        {
                            "date": "2025-10-31",
                            "measured": 1107.0
                        },
                        {
                            "date": "2025-11-01",
                            "measured": 1131.0
                        },
                        {
                            "date": "2025-11-02",
                            "measured": 1083.0
                        },
                        {
                            "date": "2025-11-03",
                            "measured": 1106.0
                        },
                        {
                            "date": "2025-11-04",
                            "measured": 1121.0
                        },
                        {
                            "date": "2025-11-05",
                            "measured": 1117.0
                        },
                        {
                            "date": "2025-11-06",
                            "measured": 1136.0
                        },
                        {
                            "date": "2025-11-07",
                            "measured": 1117.0
                        },
                        {
                            "date": "2025-11-08",
                            "measured": 1102.0
                        },
                        {
                            "date": "2025-11-09",
                            "measured": 1094.0
                        },
                        {
                            "date": "2025-11-10",
                            "measured": 1086.0
                        },
                        {
                            "date": "2025-11-11",
                            "measured": 1102.0
                        },
                        {
                            "date": "2025-11-12",
                            "measured": 1116.0
                        },
                        {
                            "date": "2025-11-13",
                            "measured": 1129.0
                        },
                        {
                            "date": "2025-11-14",
                            "measured": 1120.0
                        },
                        {
                            "date": "2025-11-15",
                            "measured": 1091.0
                        },
                        {
                            "date": "2025-11-16",
                            "measured": 1048.0
                        },
                        {
                            "date": "2025-11-17",
                            "measured": 1040.0
                        },
                        {
                            "date": "2025-11-18",
                            "measured": 1120.0
                        },
                        {
                            "date": "2025-11-19",
                            "measured": 1143.0
                        },
                        {
                            "date": "2025-11-20",
                            "measured": 1135.0
                        },
                        {
                            "date": "2025-11-21",
                            "measured": 1153.0
                        },
                        {
                            "date": "2025-11-22",
                            "measured": 1146.0
                        },
                        {
                            "date": "2025-11-23",
                            "measured": 1108.0
                        },
                        {
                            "date": "2025-11-24",
                            "measured": 1089.0
                        },
                        {
                            "date": "2025-11-25",
                            "measured": 1108.0
                        },
                        {
                            "date": "2025-11-26",
                            "measured": 1100.0
                        },
                        {
                            "date": "2025-11-27",
                            "measured": 1100.0
                        },
                        {
                            "date": "2025-11-28",
                            "measured": 1073.0
                        },
                        {
                            "date": "2025-11-29",
                            "measured": 1086.0
                        },
                        {
                            "date": "2025-11-30",
                            "measured": 1049.0
                        },
                        {
                            "date": "2025-12-01",
                            "measured": 1033.0
                        },
                        {
                            "date": "2025-12-02",
                            "measured": 1036.0
                        },
                        {
                            "date": "2025-12-03",
                            "measured": 1075.0
                        },
                        {
                            "date": "2025-12-04",
                            "measured": 1082.0
                        },
                        {
                            "date": "2025-12-05",
                            "measured": 1100.0
                        },
                        {
                            "date": "2025-12-06",
                            "measured": 1099.0
                        },
                        {
                            "date": "2025-12-07",
                            "measured": 1094.0
                        },
                        {
                            "date": "2025-12-08",
                            "measured": 1091.0
                        },
                        {
                            "date": "2025-12-09",
                            "measured": 1090.0
                        },
                        {
                            "date": "2025-12-10",
                            "measured": 1102.0
                        },
                        {
                            "date": "2025-12-11",
                            "measured": 1094.0
                        },
                        {
                            "date": "2025-12-12",
                            "measured": 1092.0
                        },
                        {
                            "date": "2025-12-13",
                            "measured": 1053.0
                        },
                        {
                            "date": "2025-12-14",
                            "measured": 1043.0
                        },
                        {
                            "date": "2025-12-15",
                            "measured": 1037.0
                        },
                        {
                            "date": "2025-12-16",
                            "measured": 1058.0
                        },
                        {
                            "date": "2025-12-17",
                            "measured": 1084.0
                        },
                        {
                            "date": "2025-12-18",
                            "measured": 1071.0
                        },
                        {
                            "date": "2025-12-19",
                            "measured": 1092.0
                        },
                        {
                            "date": "2025-12-20",
                            "measured": 1094.0
                        }
                    ]
                },
                {
                    "kpi_key": "percentage_parked_longer_then_24_hours",
                    "granularity": "day",
                    "values": [
                        {
                            "date": "2025-09-16",
                            "measured": 26.4
                        },
                        {
                            "date": "2025-09-17",
                            "measured": 24.5
                        },
                        {
                            "date": "2025-09-18",
                            "measured": 26.6
                        },
                        {
                            "date": "2025-09-19",
                            "measured": 16.6
                        },
                        {
                            "date": "2025-09-20",
                            "measured": 14.0
                        },
                        {
                            "date": "2025-09-21",
                            "measured": 24.2
                        },
                        {
                            "date": "2025-09-22",
                            "measured": 34.6
                        },
                        {
                            "date": "2025-09-23",
                            "measured": 27.9
                        },
                        {
                            "date": "2025-09-24",
                            "measured": 23.8
                        },
                        {
                            "date": "2025-09-25",
                            "measured": 21.0
                        },
                        {
                            "date": "2025-09-26",
                            "measured": 19.2
                        },
                        {
                            "date": "2025-09-27",
                            "measured": 21.2
                        },
                        {
                            "date": "2025-09-28",
                            "measured": 24.3
                        },
                        {
                            "date": "2025-09-29",
                            "measured": 34.5
                        },
                        {
                            "date": "2025-09-30",
                            "measured": 32.2
                        },
                        {
                            "date": "2025-10-01",
                            "measured": 29.0
                        },
                        {
                            "date": "2025-10-02",
                            "measured": 31.2
                        },
                        {
                            "date": "2025-10-03",
                            "measured": 26.6
                        },
                        {
                            "date": "2025-10-04",
                            "measured": 30.3
                        },
                        {
                            "date": "2025-10-05",
                            "measured": 35.7
                        },
                        {
                            "date": "2025-10-06",
                            "measured": 41.8
                        },
                        {
                            "date": "2025-10-07",
                            "measured": 37.9
                        },
                        {
                            "date": "2025-10-08",
                            "measured": 31.6
                        },
                        {
                            "date": "2025-10-09",
                            "measured": 29.8
                        },
                        {
                            "date": "2025-10-10",
                            "measured": 24.1
                        },
                        {
                            "date": "2025-10-11",
                            "measured": 20.5
                        },
                        {
                            "date": "2025-10-12",
                            "measured": 23.4
                        },
                        {
                            "date": "2025-10-13",
                            "measured": 31.2
                        },
                        {
                            "date": "2025-10-14",
                            "measured": 24.1
                        },
                        {
                            "date": "2025-10-15",
                            "measured": 22.3
                        },
                        {
                            "date": "2025-10-16",
                            "measured": 23.6
                        },
                        {
                            "date": "2025-10-17",
                            "measured": 19.0
                        },
                        {
                            "date": "2025-10-18",
                            "measured": 18.0
                        },
                        {
                            "date": "2025-10-19",
                            "measured": 20.8
                        },
                        {
                            "date": "2025-10-20",
                            "measured": 27.7
                        },
                        {
                            "date": "2025-10-21",
                            "measured": 27.5
                        },
                        {
                            "date": "2025-10-22",
                            "measured": 22.3
                        },
                        {
                            "date": "2025-10-23",
                            "measured": 19.5
                        },
                        {
                            "date": "2025-10-24",
                            "measured": 27.1
                        },
                        {
                            "date": "2025-10-25",
                            "measured": 18.8
                        },
                        {
                            "date": "2025-10-26",
                            "measured": 29.9
                        },
                        {
                            "date": "2025-10-27",
                            "measured": 30.2
                        },
                        {
                            "date": "2025-10-28",
                            "measured": 29.2
                        },
                        {
                            "date": "2025-10-29",
                            "measured": 21.1
                        },
                        {
                            "date": "2025-10-30",
                            "measured": 18.8
                        },
                        {
                            "date": "2025-10-31",
                            "measured": 17.9
                        },
                        {
                            "date": "2025-11-01",
                            "measured": 13.7
                        },
                        {
                            "date": "2025-11-02",
                            "measured": 23.6
                        },
                        {
                            "date": "2025-11-03",
                            "measured": 29.0
                        },
                        {
                            "date": "2025-11-04",
                            "measured": 22.8
                        },
                        {
                            "date": "2025-11-05",
                            "measured": 21.5
                        },
                        {
                            "date": "2025-11-06",
                            "measured": 16.3
                        },
                        {
                            "date": "2025-11-07",
                            "measured": 14.1
                        },
                        {
                            "date": "2025-11-08",
                            "measured": 11.5
                        },
                        {
                            "date": "2025-11-09",
                            "measured": 15.6
                        },
                        {
                            "date": "2025-11-10",
                            "measured": 23.6
                        },
                        {
                            "date": "2025-11-11",
                            "measured": 23.5
                        },
                        {
                            "date": "2025-11-12",
                            "measured": 21.6
                        },
                        {
                            "date": "2025-11-13",
                            "measured": 18.0
                        },
                        {
                            "date": "2025-11-14",
                            "measured": 19.1
                        },
                        {
                            "date": "2025-11-15",
                            "measured": 21.9
                        },
                        {
                            "date": "2025-11-16",
                            "measured": 19.2
                        },
                        {
                            "date": "2025-11-17",
                            "measured": 28.6
                        },
                        {
                            "date": "2025-11-18",
                            "measured": 28.8
                        },
                        {
                            "date": "2025-11-19",
                            "measured": 24.2
                        },
                        {
                            "date": "2025-11-20",
                            "measured": 29.0
                        },
                        {
                            "date": "2025-11-21",
                            "measured": 25.1
                        },
                        {
                            "date": "2025-11-22",
                            "measured": 19.0
                        },
                        {
                            "date": "2025-11-23",
                            "measured": 22.6
                        },
                        {
                            "date": "2025-11-24",
                            "measured": 37.4
                        },
                        {
                            "date": "2025-11-25",
                            "measured": 22.5
                        },
                        {
                            "date": "2025-11-26",
                            "measured": 21.8
                        },
                        {
                            "date": "2025-11-27",
                            "measured": 21.0
                        },
                        {
                            "date": "2025-11-28",
                            "measured": 18.1
                        },
                        {
                            "date": "2025-11-29",
                            "measured": 15.6
                        },
                        {
                            "date": "2025-11-30",
                            "measured": 15.9
                        },
                        {
                            "date": "2025-12-01",
                            "measured": 27.5
                        },
                        {
                            "date": "2025-12-02",
                            "measured": 26.5
                        },
                        {
                            "date": "2025-12-03",
                            "measured": 22.6
                        },
                        {
                            "date": "2025-12-04",
                            "measured": 19.9
                        },
                        {
                            "date": "2025-12-05",
                            "measured": 16.3
                        },
                        {
                            "date": "2025-12-06",
                            "measured": 21.4
                        },
                        {
                            "date": "2025-12-07",
                            "measured": 20.8
                        },
                        {
                            "date": "2025-12-08",
                            "measured": 25.3
                        },
                        {
                            "date": "2025-12-09",
                            "measured": 24.1
                        },
                        {
                            "date": "2025-12-10",
                            "measured": 22.8
                        },
                        {
                            "date": "2025-12-11",
                            "measured": 20.9
                        },
                        {
                            "date": "2025-12-12",
                            "measured": 21.5
                        },
                        {
                            "date": "2025-12-13",
                            "measured": 19.5
                        },
                        {
                            "date": "2025-12-14",
                            "measured": 20.4
                        },
                        {
                            "date": "2025-12-15",
                            "measured": 27.6
                        },
                        {
                            "date": "2025-12-16",
                            "measured": 29.7
                        },
                        {
                            "date": "2025-12-17",
                            "measured": 24.7
                        },
                        {
                            "date": "2025-12-18",
                            "measured": 21.8
                        },
                        {
                            "date": "2025-12-19",
                            "measured": 22.2
                        },
                        {
                            "date": "2025-12-20",
                            "measured": 21.6
                        }
                    ]
                },
                {
                    "kpi_key": "percentage_parked_longer_then_3_days",
                    "granularity": "day",
                    "values": [
                        {
                            "date": "2025-09-16",
                            "measured": 4.0
                        },
                        {
                            "date": "2025-09-17",
                            "measured": 5.7
                        },
                        {
                            "date": "2025-09-18",
                            "measured": 7.2
                        },
                        {
                            "date": "2025-09-19",
                            "measured": 5.3
                        },
                        {
                            "date": "2025-09-20",
                            "measured": 3.3
                        },
                        {
                            "date": "2025-09-21",
                            "measured": 4.0
                        },
                        {
                            "date": "2025-09-22",
                            "measured": 4.6
                        },
                        {
                            "date": "2025-09-23",
                            "measured": 6.6
                        },
                        {
                            "date": "2025-09-24",
                            "measured": 8.8
                        },
                        {
                            "date": "2025-09-25",
                            "measured": 6.7
                        },
                        {
                            "date": "2025-09-26",
                            "measured": 5.0
                        },
                        {
                            "date": "2025-09-27",
                            "measured": 5.1
                        },
                        {
                            "date": "2025-09-28",
                            "measured": 4.8
                        },
                        {
                            "date": "2025-09-29",
                            "measured": 8.4
                        },
                        {
                            "date": "2025-09-30",
                            "measured": 7.7
                        },
                        {
                            "date": "2025-10-01",
                            "measured": 10.7
                        },
                        {
                            "date": "2025-10-02",
                            "measured": 11.8
                        },
                        {
                            "date": "2025-10-03",
                            "measured": 8.6
                        },
                        {
                            "date": "2025-10-04",
                            "measured": 8.9
                        },
                        {
                            "date": "2025-10-05",
                            "measured": 10.6
                        },
                        {
                            "date": "2025-10-06",
                            "measured": 13.0
                        },
                        {
                            "date": "2025-10-07",
                            "measured": 13.9
                        },
                        {
                            "date": "2025-10-08",
                            "measured": 12.3
                        },
                        {
                            "date": "2025-10-09",
                            "measured": 11.5
                        },
                        {
                            "date": "2025-10-10",
                            "measured": 8.4
                        },
                        {
                            "date": "2025-10-11",
                            "measured": 5.6
                        },
                        {
                            "date": "2025-10-12",
                            "measured": 4.1
                        },
                        {
                            "date": "2025-10-13",
                            "measured": 5.4
                        },
                        {
                            "date": "2025-10-14",
                            "measured": 5.6
                        },
                        {
                            "date": "2025-10-15",
                            "measured": 6.9
                        },
                        {
                            "date": "2025-10-16",
                            "measured": 6.3
                        },
                        {
                            "date": "2025-10-17",
                            "measured": 5.8
                        },
                        {
                            "date": "2025-10-18",
                            "measured": 4.5
                        },
                        {
                            "date": "2025-10-19",
                            "measured": 3.7
                        },
                        {
                            "date": "2025-10-20",
                            "measured": 4.8
                        },
                        {
                            "date": "2025-10-21",
                            "measured": 6.3
                        },
                        {
                            "date": "2025-10-22",
                            "measured": 7.2
                        },
                        {
                            "date": "2025-10-23",
                            "measured": 5.5
                        },
                        {
                            "date": "2025-10-24",
                            "measured": 5.1
                        },
                        {
                            "date": "2025-10-25",
                            "measured": 5.0
                        },
                        {
                            "date": "2025-10-26",
                            "measured": 5.9
                        },
                        {
                            "date": "2025-10-27",
                            "measured": 5.2
                        },
                        {
                            "date": "2025-10-28",
                            "measured": 6.8
                        },
                        {
                            "date": "2025-10-29",
                            "measured": 5.6
                        },
                        {
                            "date": "2025-10-30",
                            "measured": 5.0
                        },
                        {
                            "date": "2025-10-31",
                            "measured": 3.7
                        },
                        {
                            "date": "2025-11-01",
                            "measured": 3.2
                        },
                        {
                            "date": "2025-11-02",
                            "measured": 3.2
                        },
                        {
                            "date": "2025-11-03",
                            "measured": 4.1
                        },
                        {
                            "date": "2025-11-04",
                            "measured": 5.5
                        },
                        {
                            "date": "2025-11-05",
                            "measured": 6.9
                        },
                        {
                            "date": "2025-11-06",
                            "measured": 4.5
                        },
                        {
                            "date": "2025-11-07",
                            "measured": 3.2
                        },
                        {
                            "date": "2025-11-08",
                            "measured": 2.5
                        },
                        {
                            "date": "2025-11-09",
                            "measured": 2.4
                        },
                        {
                            "date": "2025-11-10",
                            "measured": 2.8
                        },
                        {
                            "date": "2025-11-11",
                            "measured": 3.4
                        },
                        {
                            "date": "2025-11-12",
                            "measured": 4.5
                        },
                        {
                            "date": "2025-11-13",
                            "measured": 4.5
                        },
                        {
                            "date": "2025-11-14",
                            "measured": 4.2
                        },
                        {
                            "date": "2025-11-15",
                            "measured": 4.7
                        },
                        {
                            "date": "2025-11-16",
                            "measured": 3.7
                        },
                        {
                            "date": "2025-11-17",
                            "measured": 4.0
                        },
                        {
                            "date": "2025-11-18",
                            "measured": 5.5
                        },
                        {
                            "date": "2025-11-19",
                            "measured": 5.9
                        },
                        {
                            "date": "2025-11-20",
                            "measured": 7.8
                        },
                        {
                            "date": "2025-11-21",
                            "measured": 7.2
                        },
                        {
                            "date": "2025-11-22",
                            "measured": 7.5
                        },
                        {
                            "date": "2025-11-23",
                            "measured": 6.7
                        },
                        {
                            "date": "2025-11-24",
                            "measured": 7.3
                        },
                        {
                            "date": "2025-11-25",
                            "measured": 6.6
                        },
                        {
                            "date": "2025-11-26",
                            "measured": 7.5
                        },
                        {
                            "date": "2025-11-27",
                            "measured": 5.4
                        },
                        {
                            "date": "2025-11-28",
                            "measured": 3.7
                        },
                        {
                            "date": "2025-11-29",
                            "measured": 2.7
                        },
                        {
                            "date": "2025-11-30",
                            "measured": 2.5
                        },
                        {
                            "date": "2025-12-01",
                            "measured": 2.9
                        },
                        {
                            "date": "2025-12-02",
                            "measured": 4.3
                        },
                        {
                            "date": "2025-12-03",
                            "measured": 6.1
                        },
                        {
                            "date": "2025-12-04",
                            "measured": 4.7
                        },
                        {
                            "date": "2025-12-05",
                            "measured": 4.4
                        },
                        {
                            "date": "2025-12-06",
                            "measured": 5.0
                        },
                        {
                            "date": "2025-12-07",
                            "measured": 4.3
                        },
                        {
                            "date": "2025-12-08",
                            "measured": 4.8
                        },
                        {
                            "date": "2025-12-09",
                            "measured": 5.6
                        },
                        {
                            "date": "2025-12-10",
                            "measured": 6.4
                        },
                        {
                            "date": "2025-12-11",
                            "measured": 5.8
                        },
                        {
                            "date": "2025-12-12",
                            "measured": 5.6
                        },
                        {
                            "date": "2025-12-13",
                            "measured": 5.2
                        },
                        {
                            "date": "2025-12-14",
                            "measured": 5.0
                        },
                        {
                            "date": "2025-12-15",
                            "measured": 5.6
                        },
                        {
                            "date": "2025-12-16",
                            "measured": 7.5
                        },
                        {
                            "date": "2025-12-17",
                            "measured": 8.5
                        },
                        {
                            "date": "2025-12-18",
                            "measured": 7.0
                        },
                        {
                            "date": "2025-12-19",
                            "measured": 4.9
                        },
                        {
                            "date": "2025-12-20",
                            "measured": 4.5
                        }
                    ]
                },
                {
                    "kpi_key": "percentage_parked_longer_then_7_days",
                    "granularity": "day",
                    "values": [
                        {
                            "date": "2025-09-16",
                            "measured": 0.4
                        },
                        {
                            "date": "2025-09-17",
                            "measured": 0.3
                        },
                        {
                            "date": "2025-09-18",
                            "measured": 0.2
                        },
                        {
                            "date": "2025-09-19",
                            "measured": 0.2
                        },
                        {
                            "date": "2025-09-20",
                            "measured": 0.4
                        },
                        {
                            "date": "2025-09-21",
                            "measured": 0.3
                        },
                        {
                            "date": "2025-09-22",
                            "measured": 0.3
                        },
                        {
                            "date": "2025-09-23",
                            "measured": 0.6
                        },
                        {
                            "date": "2025-09-24",
                            "measured": 0.5
                        },
                        {
                            "date": "2025-09-25",
                            "measured": 0.3
                        },
                        {
                            "date": "2025-09-26",
                            "measured": 0.4
                        },
                        {
                            "date": "2025-09-27",
                            "measured": 0.6
                        },
                        {
                            "date": "2025-09-28",
                            "measured": 0.6
                        },
                        {
                            "date": "2025-09-29",
                            "measured": 0.4
                        },
                        {
                            "date": "2025-09-30",
                            "measured": 0.5
                        },
                        {
                            "date": "2025-10-01",
                            "measured": 0.6
                        },
                        {
                            "date": "2025-10-02",
                            "measured": 0.5
                        },
                        {
                            "date": "2025-10-03",
                            "measured": 0.6
                        },
                        {
                            "date": "2025-10-04",
                            "measured": 0.7
                        },
                        {
                            "date": "2025-10-05",
                            "measured": 0.9
                        },
                        {
                            "date": "2025-10-06",
                            "measured": 1.5
                        },
                        {
                            "date": "2025-10-07",
                            "measured": 1.1
                        },
                        {
                            "date": "2025-10-08",
                            "measured": 1.3
                        },
                        {
                            "date": "2025-10-09",
                            "measured": 1.2
                        },
                        {
                            "date": "2025-10-10",
                            "measured": 1.1
                        },
                        {
                            "date": "2025-10-11",
                            "measured": 0.9
                        },
                        {
                            "date": "2025-10-12",
                            "measured": 0.7
                        },
                        {
                            "date": "2025-10-13",
                            "measured": 0.6
                        },
                        {
                            "date": "2025-10-14",
                            "measured": 0.4
                        },
                        {
                            "date": "2025-10-15",
                            "measured": 0.5
                        },
                        {
                            "date": "2025-10-16",
                            "measured": 0.6
                        },
                        {
                            "date": "2025-10-17",
                            "measured": 0.8
                        },
                        {
                            "date": "2025-10-18",
                            "measured": 0.5
                        },
                        {
                            "date": "2025-10-19",
                            "measured": 0.8
                        },
                        {
                            "date": "2025-10-20",
                            "measured": 0.5
                        },
                        {
                            "date": "2025-10-21",
                            "measured": 0.5
                        },
                        {
                            "date": "2025-10-22",
                            "measured": 0.7
                        },
                        {
                            "date": "2025-10-23",
                            "measured": 0.4
                        },
                        {
                            "date": "2025-10-24",
                            "measured": 0.5
                        },
                        {
                            "date": "2025-10-25",
                            "measured": 0.6
                        },
                        {
                            "date": "2025-10-26",
                            "measured": 0.6
                        },
                        {
                            "date": "2025-10-27",
                            "measured": 0.5
                        },
                        {
                            "date": "2025-10-28",
                            "measured": 0.4
                        },
                        {
                            "date": "2025-10-29",
                            "measured": 0.2
                        },
                        {
                            "date": "2025-10-30",
                            "measured": 0.4
                        },
                        {
                            "date": "2025-10-31",
                            "measured": 0.2
                        },
                        {
                            "date": "2025-11-01",
                            "measured": 0.2
                        },
                        {
                            "date": "2025-11-02",
                            "measured": 0.2
                        },
                        {
                            "date": "2025-11-03",
                            "measured": 0.2
                        },
                        {
                            "date": "2025-11-04",
                            "measured": 0.3
                        },
                        {
                            "date": "2025-11-05",
                            "measured": 0.4
                        },
                        {
                            "date": "2025-11-06",
                            "measured": 0.4
                        },
                        {
                            "date": "2025-11-07",
                            "measured": 0.2
                        },
                        {
                            "date": "2025-11-08",
                            "measured": 0.2
                        },
                        {
                            "date": "2025-11-09",
                            "measured": 0.1
                        },
                        {
                            "date": "2025-11-10",
                            "measured": 0.2
                        },
                        {
                            "date": "2025-11-11",
                            "measured": 0.4
                        },
                        {
                            "date": "2025-11-12",
                            "measured": 0.4
                        },
                        {
                            "date": "2025-11-13",
                            "measured": 0.4
                        },
                        {
                            "date": "2025-11-14",
                            "measured": 0.3
                        },
                        {
                            "date": "2025-11-15",
                            "measured": 0.5
                        },
                        {
                            "date": "2025-11-16",
                            "measured": 0.3
                        },
                        {
                            "date": "2025-11-17",
                            "measured": 0.4
                        },
                        {
                            "date": "2025-11-18",
                            "measured": 0.4
                        },
                        {
                            "date": "2025-11-19",
                            "measured": 0.5
                        },
                        {
                            "date": "2025-11-20",
                            "measured": 0.6
                        },
                        {
                            "date": "2025-11-21",
                            "measured": 0.7
                        },
                        {
                            "date": "2025-11-22",
                            "measured": 1.3
                        },
                        {
                            "date": "2025-11-23",
                            "measured": 1.7
                        },
                        {
                            "date": "2025-11-24",
                            "measured": 1.8
                        },
                        {
                            "date": "2025-11-25",
                            "measured": 0.7
                        },
                        {
                            "date": "2025-11-26",
                            "measured": 0.5
                        },
                        {
                            "date": "2025-11-27",
                            "measured": 0.6
                        },
                        {
                            "date": "2025-11-28",
                            "measured": 0.6
                        },
                        {
                            "date": "2025-11-29",
                            "measured": 0.6
                        },
                        {
                            "date": "2025-11-30",
                            "measured": 0.4
                        },
                        {
                            "date": "2025-12-01",
                            "measured": 0.2
                        },
                        {
                            "date": "2025-12-02",
                            "measured": 0.1
                        },
                        {
                            "date": "2025-12-03",
                            "measured": 0.1
                        },
                        {
                            "date": "2025-12-04",
                            "measured": 0.3
                        },
                        {
                            "date": "2025-12-05",
                            "measured": 0.4
                        },
                        {
                            "date": "2025-12-06",
                            "measured": 0.6
                        },
                        {
                            "date": "2025-12-07",
                            "measured": 0.7
                        },
                        {
                            "date": "2025-12-08",
                            "measured": 0.8
                        },
                        {
                            "date": "2025-12-09",
                            "measured": 0.6
                        },
                        {
                            "date": "2025-12-10",
                            "measured": 0.5
                        },
                        {
                            "date": "2025-12-11",
                            "measured": 0.3
                        },
                        {
                            "date": "2025-12-12",
                            "measured": 0.4
                        },
                        {
                            "date": "2025-12-13",
                            "measured": 0.6
                        },
                        {
                            "date": "2025-12-14",
                            "measured": 0.5
                        },
                        {
                            "date": "2025-12-15",
                            "measured": 0.3
                        },
                        {
                            "date": "2025-12-16",
                            "measured": 0.3
                        },
                        {
                            "date": "2025-12-17",
                            "measured": 0.4
                        },
                        {
                            "date": "2025-12-18",
                            "measured": 0.4
                        },
                        {
                            "date": "2025-12-19",
                            "measured": 0.3
                        },
                        {
                            "date": "2025-12-20",
                            "measured": 0.4
                        }
                    ]
                },
                {
                    "kpi_key": "percentage_parked_longer_then_14_days",
                    "granularity": "day",
                    "values": [
                        {
                            "date": "2025-09-16",
                            "measured": 0.1
                        },
                        {
                            "date": "2025-09-17",
                            "measured": 0.1
                        },
                        {
                            "date": "2025-09-18",
                            "measured": 0.1
                        },
                        {
                            "date": "2025-09-19",
                            "measured": 0.1
                        },
                        {
                            "date": "2025-09-20",
                            "measured": 0.1
                        },
                        {
                            "date": "2025-09-21",
                            "measured": 0.1
                        },
                        {
                            "date": "2025-09-22",
                            "measured": 0.1
                        },
                        {
                            "date": "2025-09-23",
                            "measured": 0.1
                        },
                        {
                            "date": "2025-09-24",
                            "measured": 0.1
                        },
                        {
                            "date": "2025-09-25",
                            "measured": 0.1
                        },
                        {
                            "date": "2025-09-26",
                            "measured": 0.1
                        },
                        {
                            "date": "2025-09-27",
                            "measured": 0.1
                        },
                        {
                            "date": "2025-09-28",
                            "measured": 0.1
                        },
                        {
                            "date": "2025-09-29",
                            "measured": 0.1
                        },
                        {
                            "date": "2025-09-30",
                            "measured": 0.1
                        },
                        {
                            "date": "2025-10-01",
                            "measured": 0.1
                        },
                        {
                            "date": "2025-10-02",
                            "measured": 0.1
                        },
                        {
                            "date": "2025-10-03",
                            "measured": 0.1
                        },
                        {
                            "date": "2025-10-04",
                            "measured": 0.1
                        },
                        {
                            "date": "2025-10-05",
                            "measured": 0.2
                        },
                        {
                            "date": "2025-10-06",
                            "measured": 0.2
                        },
                        {
                            "date": "2025-10-07",
                            "measured": 0.1
                        },
                        {
                            "date": "2025-10-08",
                            "measured": 0.1
                        },
                        {
                            "date": "2025-10-09",
                            "measured": 0.1
                        },
                        {
                            "date": "2025-10-10",
                            "measured": 0.1
                        },
                        {
                            "date": "2025-10-11",
                            "measured": 0.1
                        },
                        {
                            "date": "2025-10-12",
                            "measured": 0.1
                        },
                        {
                            "date": "2025-10-13",
                            "measured": 0.1
                        },
                        {
                            "date": "2025-10-14",
                            "measured": 0.3
                        },
                        {
                            "date": "2025-10-15",
                            "measured": 0.3
                        },
                        {
                            "date": "2025-10-16",
                            "measured": 0.3
                        },
                        {
                            "date": "2025-10-17",
                            "measured": 0.3
                        },
                        {
                            "date": "2025-10-18",
                            "measured": 0.2
                        },
                        {
                            "date": "2025-10-19",
                            "measured": 0.2
                        },
                        {
                            "date": "2025-10-20",
                            "measured": 0.2
                        },
                        {
                            "date": "2025-10-21",
                            "measured": 0.1
                        },
                        {
                            "date": "2025-10-22",
                            "measured": 0.1
                        },
                        {
                            "date": "2025-10-23",
                            "measured": 0.1
                        },
                        {
                            "date": "2025-10-24",
                            "measured": 0.1
                        },
                        {
                            "date": "2025-10-25",
                            "measured": 0.1
                        },
                        {
                            "date": "2025-10-26",
                            "measured": 0.1
                        },
                        {
                            "date": "2025-10-27",
                            "measured": 0.1
                        },
                        {
                            "date": "2025-10-28",
                            "measured": 0.1
                        },
                        {
                            "date": "2025-10-29",
                            "measured": 0.1
                        },
                        {
                            "date": "2025-10-30",
                            "measured": 0.1
                        },
                        {
                            "date": "2025-10-31",
                            "measured": 0.1
                        },
                        {
                            "date": "2025-11-01",
                            "measured": 0.1
                        },
                        {
                            "date": "2025-11-02",
                            "measured": 0.1
                        },
                        {
                            "date": "2025-11-03",
                            "measured": 0.1
                        },
                        {
                            "date": "2025-11-04",
                            "measured": 0.1
                        },
                        {
                            "date": "2025-11-05",
                            "measured": 0.1
                        },
                        {
                            "date": "2025-11-06",
                            "measured": 0.1
                        },
                        {
                            "date": "2025-11-07",
                            "measured": 0.1
                        },
                        {
                            "date": "2025-11-08",
                            "measured": 0.1
                        },
                        {
                            "date": "2025-11-09",
                            "measured": 0.1
                        },
                        {
                            "date": "2025-11-10",
                            "measured": 0.1
                        },
                        {
                            "date": "2025-11-11",
                            "measured": 0.1
                        },
                        {
                            "date": "2025-11-12",
                            "measured": 0.1
                        },
                        {
                            "date": "2025-11-13",
                            "measured": 0.1
                        },
                        {
                            "date": "2025-11-14",
                            "measured": 0.1
                        },
                        {
                            "date": "2025-11-15",
                            "measured": 0.1
                        },
                        {
                            "date": "2025-11-16",
                            "measured": 0.1
                        },
                        {
                            "date": "2025-11-17",
                            "measured": 0.1
                        },
                        {
                            "date": "2025-11-18",
                            "measured": 0.1
                        },
                        {
                            "date": "2025-11-19",
                            "measured": 0.1
                        },
                        {
                            "date": "2025-11-20",
                            "measured": 0.1
                        },
                        {
                            "date": "2025-11-21",
                            "measured": 0.2
                        },
                        {
                            "date": "2025-11-22",
                            "measured": 0.2
                        },
                        {
                            "date": "2025-11-23",
                            "measured": 0.2
                        },
                        {
                            "date": "2025-11-24",
                            "measured": 0.2
                        },
                        {
                            "date": "2025-11-25",
                            "measured": 0.1
                        },
                        {
                            "date": "2025-11-26",
                            "measured": 0.2
                        },
                        {
                            "date": "2025-11-27",
                            "measured": 0.2
                        },
                        {
                            "date": "2025-11-28",
                            "measured": 0.2
                        },
                        {
                            "date": "2025-11-29",
                            "measured": 0.1
                        },
                        {
                            "date": "2025-11-30",
                            "measured": 0.1
                        },
                        {
                            "date": "2025-12-01",
                            "measured": 0.1
                        },
                        {
                            "date": "2025-12-02",
                            "measured": 0.1
                        },
                        {
                            "date": "2025-12-03",
                            "measured": 0.1
                        },
                        {
                            "date": "2025-12-04",
                            "measured": 0.1
                        },
                        {
                            "date": "2025-12-05",
                            "measured": 0.1
                        },
                        {
                            "date": "2025-12-06",
                            "measured": 0.1
                        },
                        {
                            "date": "2025-12-07",
                            "measured": 0.1
                        },
                        {
                            "date": "2025-12-08",
                            "measured": 0.1
                        },
                        {
                            "date": "2025-12-09",
                            "measured": 0.1
                        },
                        {
                            "date": "2025-12-10",
                            "measured": 0.1
                        },
                        {
                            "date": "2025-12-11",
                            "measured": 0.1
                        },
                        {
                            "date": "2025-12-12",
                            "measured": 0.1
                        },
                        {
                            "date": "2025-12-13",
                            "measured": 0.1
                        },
                        {
                            "date": "2025-12-14",
                            "measured": 0.1
                        },
                        {
                            "date": "2025-12-15",
                            "measured": 0.1
                        },
                        {
                            "date": "2025-12-16",
                            "measured": 0.1
                        },
                        {
                            "date": "2025-12-17",
                            "measured": 0.1
                        },
                        {
                            "date": "2025-12-18",
                            "measured": 0.1
                        },
                        {
                            "date": "2025-12-19",
                            "measured": 0.1
                        },
                        {
                            "date": "2025-12-20",
                            "measured": 0.1
                        }
                    ]
                }
            ]
        },
        {
            "operator": "mywheels",
            "form_factor": "car",
            "propulsion_type": "combustion",
            "geometry_ref": "cbs:GM0599",
            "kpis": [
                {
                    "kpi_key": "vehicle_cap",
                    "granularity": "day",
                    "values": [
                        {
                            "date": "2025-09-16",
                            "measured": 22.0
                        },
                        {
                            "date": "2025-09-17",
                            "measured": 23.0
                        },
                        {
                            "date": "2025-09-18",
                            "measured": 25.0
                        },
                        {
                            "date": "2025-09-19",
                            "measured": 27.0
                        },
                        {
                            "date": "2025-09-20",
                            "measured": 23.0
                        },
                        {
                            "date": "2025-09-21",
                            "measured": 23.0
                        },
                        {
                            "date": "2025-09-22",
                            "measured": 27.0
                        },
                        {
                            "date": "2025-09-23",
                            "measured": 24.0
                        },
                        {
                            "date": "2025-09-24",
                            "measured": 27.0
                        },
                        {
                            "date": "2025-09-25",
                            "measured": 25.0
                        },
                        {
                            "date": "2025-09-26",
                            "measured": 25.0
                        },
                        {
                            "date": "2025-09-27",
                            "measured": 25.0
                        },
                        {
                            "date": "2025-09-28",
                            "measured": 21.0
                        },
                        {
                            "date": "2025-09-29",
                            "measured": 24.0
                        },
                        {
                            "date": "2025-09-30",
                            "measured": 22.0
                        },
                        {
                            "date": "2025-10-01",
                            "measured": 22.0
                        },
                        {
                            "date": "2025-10-02",
                            "measured": 23.0
                        },
                        {
                            "date": "2025-10-03",
                            "measured": 24.0
                        },
                        {
                            "date": "2025-10-04",
                            "measured": 24.0
                        },
                        {
                            "date": "2025-10-05",
                            "measured": 20.0
                        },
                        {
                            "date": "2025-10-06",
                            "measured": 23.0
                        },
                        {
                            "date": "2025-10-07",
                            "measured": 24.0
                        },
                        {
                            "date": "2025-10-08",
                            "measured": 22.0
                        },
                        {
                            "date": "2025-10-09",
                            "measured": 24.0
                        },
                        {
                            "date": "2025-10-10",
                            "measured": 22.0
                        },
                        {
                            "date": "2025-10-11",
                            "measured": 19.0
                        },
                        {
                            "date": "2025-10-12",
                            "measured": 22.0
                        },
                        {
                            "date": "2025-10-13",
                            "measured": 27.0
                        },
                        {
                            "date": "2025-10-14",
                            "measured": 26.0
                        },
                        {
                            "date": "2025-10-15",
                            "measured": 24.0
                        },
                        {
                            "date": "2025-10-16",
                            "measured": 23.0
                        },
                        {
                            "date": "2025-10-17",
                            "measured": 26.0
                        },
                        {
                            "date": "2025-10-18",
                            "measured": 19.0
                        },
                        {
                            "date": "2025-10-19",
                            "measured": 21.0
                        },
                        {
                            "date": "2025-10-20",
                            "measured": 28.0
                        },
                        {
                            "date": "2025-10-21",
                            "measured": 25.0
                        },
                        {
                            "date": "2025-10-22",
                            "measured": 23.0
                        },
                        {
                            "date": "2025-10-23",
                            "measured": 22.0
                        },
                        {
                            "date": "2025-10-24",
                            "measured": 20.0
                        },
                        {
                            "date": "2025-10-25",
                            "measured": 17.0
                        },
                        {
                            "date": "2025-10-26",
                            "measured": 19.0
                        },
                        {
                            "date": "2025-10-27",
                            "measured": 25.0
                        },
                        {
                            "date": "2025-10-28",
                            "measured": 24.0
                        },
                        {
                            "date": "2025-10-29",
                            "measured": 28.0
                        },
                        {
                            "date": "2025-10-30",
                            "measured": 26.0
                        },
                        {
                            "date": "2025-10-31",
                            "measured": 22.0
                        },
                        {
                            "date": "2025-11-01",
                            "measured": 24.0
                        },
                        {
                            "date": "2025-11-02",
                            "measured": 22.0
                        },
                        {
                            "date": "2025-11-03",
                            "measured": 22.0
                        },
                        {
                            "date": "2025-11-04",
                            "measured": 22.0
                        },
                        {
                            "date": "2025-11-05",
                            "measured": 24.0
                        },
                        {
                            "date": "2025-11-06",
                            "measured": 24.0
                        },
                        {
                            "date": "2025-11-07",
                            "measured": 27.0
                        },
                        {
                            "date": "2025-11-08",
                            "measured": 20.0
                        },
                        {
                            "date": "2025-11-09",
                            "measured": 18.0
                        },
                        {
                            "date": "2025-11-10",
                            "measured": 20.0
                        },
                        {
                            "date": "2025-11-11",
                            "measured": 21.0
                        },
                        {
                            "date": "2025-11-12",
                            "measured": 22.0
                        },
                        {
                            "date": "2025-11-13",
                            "measured": 21.0
                        },
                        {
                            "date": "2025-11-14",
                            "measured": 21.0
                        },
                        {
                            "date": "2025-11-15",
                            "measured": 23.0
                        },
                        {
                            "date": "2025-11-16",
                            "measured": 21.0
                        },
                        {
                            "date": "2025-11-17",
                            "measured": 22.0
                        },
                        {
                            "date": "2025-11-18",
                            "measured": 23.0
                        },
                        {
                            "date": "2025-11-19",
                            "measured": 21.0
                        },
                        {
                            "date": "2025-11-20",
                            "measured": 24.0
                        },
                        {
                            "date": "2025-11-21",
                            "measured": 22.0
                        },
                        {
                            "date": "2025-11-22",
                            "measured": 17.0
                        },
                        {
                            "date": "2025-11-23",
                            "measured": 17.0
                        },
                        {
                            "date": "2025-11-24",
                            "measured": 21.0
                        },
                        {
                            "date": "2025-11-25",
                            "measured": 16.0
                        },
                        {
                            "date": "2025-11-26",
                            "measured": 14.0
                        },
                        {
                            "date": "2025-11-27",
                            "measured": 16.0
                        },
                        {
                            "date": "2025-11-28",
                            "measured": 15.0
                        },
                        {
                            "date": "2025-11-29",
                            "measured": 15.0
                        },
                        {
                            "date": "2025-11-30",
                            "measured": 16.0
                        },
                        {
                            "date": "2025-12-01",
                            "measured": 18.0
                        },
                        {
                            "date": "2025-12-02",
                            "measured": 16.0
                        },
                        {
                            "date": "2025-12-03",
                            "measured": 14.0
                        },
                        {
                            "date": "2025-12-04",
                            "measured": 16.0
                        },
                        {
                            "date": "2025-12-05",
                            "measured": 13.0
                        },
                        {
                            "date": "2025-12-06",
                            "measured": 14.0
                        },
                        {
                            "date": "2025-12-07",
                            "measured": 13.0
                        },
                        {
                            "date": "2025-12-08",
                            "measured": 15.0
                        },
                        {
                            "date": "2025-12-09",
                            "measured": 15.0
                        },
                        {
                            "date": "2025-12-10",
                            "measured": 18.0
                        },
                        {
                            "date": "2025-12-11",
                            "measured": 15.0
                        },
                        {
                            "date": "2025-12-12",
                            "measured": 11.0
                        },
                        {
                            "date": "2025-12-13",
                            "measured": 12.0
                        },
                        {
                            "date": "2025-12-14",
                            "measured": 11.0
                        },
                        {
                            "date": "2025-12-15",
                            "measured": 12.0
                        },
                        {
                            "date": "2025-12-16",
                            "measured": 12.0
                        },
                        {
                            "date": "2025-12-17",
                            "measured": 10.0
                        },
                        {
                            "date": "2025-12-18",
                            "measured": 10.0
                        },
                        {
                            "date": "2025-12-19",
                            "measured": 11.0
                        },
                        {
                            "date": "2025-12-20",
                            "measured": 10.0
                        }
                    ]
                },
                {
                    "kpi_key": "percentage_parked_longer_then_24_hours",
                    "granularity": "day",
                    "values": [
                        {
                            "date": "2025-09-16",
                            "measured": 27.3
                        },
                        {
                            "date": "2025-09-17",
                            "measured": 31.8
                        },
                        {
                            "date": "2025-09-18",
                            "measured": 45.8
                        },
                        {
                            "date": "2025-09-19",
                            "measured": 32.0
                        },
                        {
                            "date": "2025-09-20",
                            "measured": 38.1
                        },
                        {
                            "date": "2025-09-21",
                            "measured": 5.0
                        },
                        {
                            "date": "2025-09-22",
                            "measured": 23.1
                        },
                        {
                            "date": "2025-09-23",
                            "measured": 17.4
                        },
                        {
                            "date": "2025-09-24",
                            "measured": 29.6
                        },
                        {
                            "date": "2025-09-25",
                            "measured": 32.0
                        },
                        {
                            "date": "2025-09-26",
                            "measured": 24.0
                        },
                        {
                            "date": "2025-09-27",
                            "measured": 27.3
                        },
                        {
                            "date": "2025-09-28",
                            "measured": 11.1
                        },
                        {
                            "date": "2025-09-29",
                            "measured": 16.7
                        },
                        {
                            "date": "2025-09-30",
                            "measured": 36.4
                        },
                        {
                            "date": "2025-10-01",
                            "measured": 45.5
                        },
                        {
                            "date": "2025-10-02",
                            "measured": 39.1
                        },
                        {
                            "date": "2025-10-03",
                            "measured": 33.3
                        },
                        {
                            "date": "2025-10-04",
                            "measured": 37.5
                        },
                        {
                            "date": "2025-10-05",
                            "measured": 10.5
                        },
                        {
                            "date": "2025-10-06",
                            "measured": 26.1
                        },
                        {
                            "date": "2025-10-07",
                            "measured": 39.1
                        },
                        {
                            "date": "2025-10-08",
                            "measured": 45.5
                        },
                        {
                            "date": "2025-10-09",
                            "measured": 25.0
                        },
                        {
                            "date": "2025-10-10",
                            "measured": 36.4
                        },
                        {
                            "date": "2025-10-11",
                            "measured": 11.1
                        },
                        {
                            "date": "2025-10-12",
                            "measured": 9.1
                        },
                        {
                            "date": "2025-10-13",
                            "measured": 11.5
                        },
                        {
                            "date": "2025-10-14",
                            "measured": 15.4
                        },
                        {
                            "date": "2025-10-15",
                            "measured": 37.5
                        },
                        {
                            "date": "2025-10-16",
                            "measured": 34.8
                        },
                        {
                            "date": "2025-10-17",
                            "measured": 34.6
                        },
                        {
                            "date": "2025-10-18",
                            "measured": 21.1
                        },
                        {
                            "date": "2025-10-19",
                            "measured": 9.5
                        },
                        {
                            "date": "2025-10-20",
                            "measured": 22.2
                        },
                        {
                            "date": "2025-10-21",
                            "measured": 28.0
                        },
                        {
                            "date": "2025-10-22",
                            "measured": 39.1
                        },
                        {
                            "date": "2025-10-23",
                            "measured": 22.7
                        },
                        {
                            "date": "2025-10-24",
                            "measured": 35.0
                        },
                        {
                            "date": "2025-10-25",
                            "measured": 29.4
                        },
                        {
                            "date": "2025-10-26",
                            "measured": 16.7
                        },
                        {
                            "date": "2025-10-28",
                            "measured": 50.0
                        },
                        {
                            "date": "2025-10-29",
                            "measured": 28.6
                        },
                        {
                            "date": "2025-10-30",
                            "measured": 53.8
                        },
                        {
                            "date": "2025-10-31",
                            "measured": 27.3
                        },
                        {
                            "date": "2025-11-01",
                            "measured": 20.8
                        },
                        {
                            "date": "2025-11-02",
                            "measured": 20.0
                        },
                        {
                            "date": "2025-11-03",
                            "measured": 18.2
                        },
                        {
                            "date": "2025-11-04",
                            "measured": 27.3
                        },
                        {
                            "date": "2025-11-05",
                            "measured": 25.0
                        },
                        {
                            "date": "2025-11-06",
                            "measured": 41.7
                        },
                        {
                            "date": "2025-11-07",
                            "measured": 29.6
                        },
                        {
                            "date": "2025-11-08",
                            "measured": 40.0
                        },
                        {
                            "date": "2025-11-09",
                            "measured": 5.9
                        },
                        {
                            "date": "2025-11-10",
                            "measured": 20.0
                        },
                        {
                            "date": "2025-11-11",
                            "measured": 38.1
                        },
                        {
                            "date": "2025-11-12",
                            "measured": 36.4
                        },
                        {
                            "date": "2025-11-13",
                            "measured": 47.6
                        },
                        {
                            "date": "2025-11-14",
                            "measured": 42.9
                        },
                        {
                            "date": "2025-11-15",
                            "measured": 43.5
                        },
                        {
                            "date": "2025-11-16",
                            "measured": 4.8
                        },
                        {
                            "date": "2025-11-17",
                            "measured": 36.4
                        },
                        {
                            "date": "2025-11-18",
                            "measured": 43.5
                        },
                        {
                            "date": "2025-11-19",
                            "measured": 42.9
                        },
                        {
                            "date": "2025-11-20",
                            "measured": 29.2
                        },
                        {
                            "date": "2025-11-21",
                            "measured": 22.7
                        },
                        {
                            "date": "2025-11-22",
                            "measured": 23.5
                        },
                        {
                            "date": "2025-11-24",
                            "measured": 28.6
                        },
                        {
                            "date": "2025-11-25",
                            "measured": 37.5
                        },
                        {
                            "date": "2025-11-26",
                            "measured": 21.4
                        },
                        {
                            "date": "2025-11-27",
                            "measured": 40.0
                        },
                        {
                            "date": "2025-11-28",
                            "measured": 33.3
                        },
                        {
                            "date": "2025-11-29",
                            "measured": 14.3
                        },
                        {
                            "date": "2025-11-30",
                            "measured": 6.7
                        },
                        {
                            "date": "2025-12-01",
                            "measured": 5.6
                        },
                        {
                            "date": "2025-12-02",
                            "measured": 56.3
                        },
                        {
                            "date": "2025-12-03",
                            "measured": 64.3
                        },
                        {
                            "date": "2025-12-04",
                            "measured": 33.3
                        },
                        {
                            "date": "2025-12-05",
                            "measured": 15.4
                        },
                        {
                            "date": "2025-12-06",
                            "measured": 7.1
                        },
                        {
                            "date": "2025-12-08",
                            "measured": 13.3
                        },
                        {
                            "date": "2025-12-09",
                            "measured": 50.0
                        },
                        {
                            "date": "2025-12-10",
                            "measured": 35.3
                        },
                        {
                            "date": "2025-12-11",
                            "measured": 33.3
                        },
                        {
                            "date": "2025-12-12",
                            "measured": 27.3
                        },
                        {
                            "date": "2025-12-13",
                            "measured": 33.3
                        },
                        {
                            "date": "2025-12-15",
                            "measured": 18.2
                        },
                        {
                            "date": "2025-12-16",
                            "measured": 25.0
                        },
                        {
                            "date": "2025-12-17",
                            "measured": 10.0
                        },
                        {
                            "date": "2025-12-18",
                            "measured": 37.5
                        },
                        {
                            "date": "2025-12-20",
                            "measured": 30.0
                        }
                    ]
                },
                {
                    "kpi_key": "percentage_parked_longer_then_3_days",
                    "granularity": "day",
                    "values": [
                        {
                            "date": "2025-09-18",
                            "measured": 4.2
                        },
                        {
                            "date": "2025-09-19",
                            "measured": 4.0
                        },
                        {
                            "date": "2025-09-20",
                            "measured": 4.8
                        },
                        {
                            "date": "2025-09-24",
                            "measured": 7.4
                        },
                        {
                            "date": "2025-09-25",
                            "measured": 8.0
                        },
                        {
                            "date": "2025-09-27",
                            "measured": 4.5
                        },
                        {
                            "date": "2025-09-29",
                            "measured": 4.2
                        },
                        {
                            "date": "2025-09-30",
                            "measured": 4.5
                        },
                        {
                            "date": "2025-10-02",
                            "measured": 13.0
                        },
                        {
                            "date": "2025-10-03",
                            "measured": 12.5
                        },
                        {
                            "date": "2025-10-04",
                            "measured": 4.2
                        },
                        {
                            "date": "2025-10-06",
                            "measured": 8.7
                        },
                        {
                            "date": "2025-10-07",
                            "measured": 4.3
                        },
                        {
                            "date": "2025-10-08",
                            "measured": 9.1
                        },
                        {
                            "date": "2025-10-09",
                            "measured": 4.2
                        },
                        {
                            "date": "2025-10-10",
                            "measured": 4.5
                        },
                        {
                            "date": "2025-10-16",
                            "measured": 4.3
                        },
                        {
                            "date": "2025-10-17",
                            "measured": 3.8
                        },
                        {
                            "date": "2025-10-18",
                            "measured": 5.3
                        },
                        {
                            "date": "2025-10-22",
                            "measured": 4.3
                        },
                        {
                            "date": "2025-10-23",
                            "measured": 4.5
                        },
                        {
                            "date": "2025-10-25",
                            "measured": 11.8
                        },
                        {
                            "date": "2025-10-26",
                            "measured": 5.6
                        },
                        {
                            "date": "2025-10-30",
                            "measured": 11.5
                        },
                        {
                            "date": "2025-10-31",
                            "measured": 13.6
                        },
                        {
                            "date": "2025-11-01",
                            "measured": 8.3
                        },
                        {
                            "date": "2025-11-02",
                            "measured": 5.0
                        },
                        {
                            "date": "2025-11-06",
                            "measured": 4.2
                        },
                        {
                            "date": "2025-11-07",
                            "measured": 7.4
                        },
                        {
                            "date": "2025-11-08",
                            "measured": 5.0
                        },
                        {
                            "date": "2025-11-10",
                            "measured": 5.0
                        },
                        {
                            "date": "2025-11-11",
                            "measured": 4.8
                        },
                        {
                            "date": "2025-11-12",
                            "measured": 4.5
                        },
                        {
                            "date": "2025-11-13",
                            "measured": 9.5
                        },
                        {
                            "date": "2025-11-14",
                            "measured": 9.5
                        },
                        {
                            "date": "2025-11-15",
                            "measured": 17.4
                        },
                        {
                            "date": "2025-11-19",
                            "measured": 14.3
                        },
                        {
                            "date": "2025-11-20",
                            "measured": 4.2
                        },
                        {
                            "date": "2025-11-21",
                            "measured": 4.5
                        },
                        {
                            "date": "2025-11-22",
                            "measured": 5.9
                        },
                        {
                            "date": "2025-11-26",
                            "measured": 7.1
                        },
                        {
                            "date": "2025-11-27",
                            "measured": 13.3
                        },
                        {
                            "date": "2025-11-28",
                            "measured": 6.7
                        },
                        {
                            "date": "2025-12-04",
                            "measured": 6.7
                        },
                        {
                            "date": "2025-12-06",
                            "measured": 7.1
                        },
                        {
                            "date": "2025-12-11",
                            "measured": 13.3
                        },
                        {
                            "date": "2025-12-12",
                            "measured": 9.1
                        },
                        {
                            "date": "2025-12-13",
                            "measured": 8.3
                        }
                    ]
                }
            ]
        },
        {
            "operator": "mywheels",
            "form_factor": "car",
            "propulsion_type": "electric",
            "geometry_ref": "cbs:GM0599",
            "kpis": [
                {
                    "kpi_key": "vehicle_cap",
                    "granularity": "day",
                    "values": [
                        {
                            "date": "2025-09-16",
                            "measured": 121.0
                        },
                        {
                            "date": "2025-09-17",
                            "measured": 122.0
                        },
                        {
                            "date": "2025-09-18",
                            "measured": 113.0
                        },
                        {
                            "date": "2025-09-19",
                            "measured": 121.0
                        },
                        {
                            "date": "2025-09-20",
                            "measured": 112.0
                        },
                        {
                            "date": "2025-09-21",
                            "measured": 108.0
                        },
                        {
                            "date": "2025-09-22",
                            "measured": 114.0
                        },
                        {
                            "date": "2025-09-23",
                            "measured": 121.0
                        },
                        {
                            "date": "2025-09-24",
                            "measured": 118.0
                        },
                        {
                            "date": "2025-09-25",
                            "measured": 115.0
                        },
                        {
                            "date": "2025-09-26",
                            "measured": 118.0
                        },
                        {
                            "date": "2025-09-27",
                            "measured": 109.0
                        },
                        {
                            "date": "2025-09-28",
                            "measured": 111.0
                        },
                        {
                            "date": "2025-09-29",
                            "measured": 121.0
                        },
                        {
                            "date": "2025-09-30",
                            "measured": 120.0
                        },
                        {
                            "date": "2025-10-01",
                            "measured": 118.0
                        },
                        {
                            "date": "2025-10-02",
                            "measured": 120.0
                        },
                        {
                            "date": "2025-10-03",
                            "measured": 122.0
                        },
                        {
                            "date": "2025-10-04",
                            "measured": 122.0
                        },
                        {
                            "date": "2025-10-05",
                            "measured": 120.0
                        },
                        {
                            "date": "2025-10-06",
                            "measured": 123.0
                        },
                        {
                            "date": "2025-10-07",
                            "measured": 129.0
                        },
                        {
                            "date": "2025-10-08",
                            "measured": 127.0
                        },
                        {
                            "date": "2025-10-09",
                            "measured": 125.0
                        },
                        {
                            "date": "2025-10-10",
                            "measured": 132.0
                        },
                        {
                            "date": "2025-10-11",
                            "measured": 122.0
                        },
                        {
                            "date": "2025-10-12",
                            "measured": 121.0
                        },
                        {
                            "date": "2025-10-13",
                            "measured": 125.0
                        },
                        {
                            "date": "2025-10-14",
                            "measured": 124.0
                        },
                        {
                            "date": "2025-10-15",
                            "measured": 126.0
                        },
                        {
                            "date": "2025-10-16",
                            "measured": 126.0
                        },
                        {
                            "date": "2025-10-17",
                            "measured": 128.0
                        },
                        {
                            "date": "2025-10-18",
                            "measured": 123.0
                        },
                        {
                            "date": "2025-10-19",
                            "measured": 117.0
                        },
                        {
                            "date": "2025-10-20",
                            "measured": 127.0
                        },
                        {
                            "date": "2025-10-21",
                            "measured": 127.0
                        },
                        {
                            "date": "2025-10-22",
                            "measured": 129.0
                        },
                        {
                            "date": "2025-10-23",
                            "measured": 123.0
                        },
                        {
                            "date": "2025-10-24",
                            "measured": 120.0
                        },
                        {
                            "date": "2025-10-25",
                            "measured": 119.0
                        },
                        {
                            "date": "2025-10-26",
                            "measured": 105.0
                        },
                        {
                            "date": "2025-10-27",
                            "measured": 125.0
                        },
                        {
                            "date": "2025-10-28",
                            "measured": 127.0
                        },
                        {
                            "date": "2025-10-29",
                            "measured": 123.0
                        },
                        {
                            "date": "2025-10-30",
                            "measured": 129.0
                        },
                        {
                            "date": "2025-10-31",
                            "measured": 128.0
                        },
                        {
                            "date": "2025-11-01",
                            "measured": 122.0
                        },
                        {
                            "date": "2025-11-02",
                            "measured": 111.0
                        },
                        {
                            "date": "2025-11-03",
                            "measured": 131.0
                        },
                        {
                            "date": "2025-11-04",
                            "measured": 130.0
                        },
                        {
                            "date": "2025-11-05",
                            "measured": 124.0
                        },
                        {
                            "date": "2025-11-06",
                            "measured": 128.0
                        },
                        {
                            "date": "2025-11-07",
                            "measured": 128.0
                        },
                        {
                            "date": "2025-11-08",
                            "measured": 127.0
                        },
                        {
                            "date": "2025-11-09",
                            "measured": 110.0
                        },
                        {
                            "date": "2025-11-10",
                            "measured": 136.0
                        },
                        {
                            "date": "2025-11-11",
                            "measured": 137.0
                        },
                        {
                            "date": "2025-11-12",
                            "measured": 140.0
                        },
                        {
                            "date": "2025-11-13",
                            "measured": 142.0
                        },
                        {
                            "date": "2025-11-14",
                            "measured": 139.0
                        },
                        {
                            "date": "2025-11-15",
                            "measured": 128.0
                        },
                        {
                            "date": "2025-11-16",
                            "measured": 128.0
                        },
                        {
                            "date": "2025-11-17",
                            "measured": 135.0
                        },
                        {
                            "date": "2025-11-18",
                            "measured": 124.0
                        },
                        {
                            "date": "2025-11-19",
                            "measured": 132.0
                        },
                        {
                            "date": "2025-11-20",
                            "measured": 130.0
                        },
                        {
                            "date": "2025-11-21",
                            "measured": 137.0
                        },
                        {
                            "date": "2025-11-22",
                            "measured": 129.0
                        },
                        {
                            "date": "2025-11-23",
                            "measured": 120.0
                        },
                        {
                            "date": "2025-11-24",
                            "measured": 127.0
                        },
                        {
                            "date": "2025-11-25",
                            "measured": 130.0
                        },
                        {
                            "date": "2025-11-26",
                            "measured": 130.0
                        },
                        {
                            "date": "2025-11-27",
                            "measured": 132.0
                        },
                        {
                            "date": "2025-11-28",
                            "measured": 131.0
                        },
                        {
                            "date": "2025-11-29",
                            "measured": 129.0
                        },
                        {
                            "date": "2025-11-30",
                            "measured": 120.0
                        },
                        {
                            "date": "2025-12-01",
                            "measured": 133.0
                        },
                        {
                            "date": "2025-12-02",
                            "measured": 138.0
                        },
                        {
                            "date": "2025-12-03",
                            "measured": 134.0
                        },
                        {
                            "date": "2025-12-04",
                            "measured": 138.0
                        },
                        {
                            "date": "2025-12-05",
                            "measured": 140.0
                        },
                        {
                            "date": "2025-12-06",
                            "measured": 137.0
                        },
                        {
                            "date": "2025-12-07",
                            "measured": 124.0
                        },
                        {
                            "date": "2025-12-08",
                            "measured": 130.0
                        },
                        {
                            "date": "2025-12-09",
                            "measured": 136.0
                        },
                        {
                            "date": "2025-12-10",
                            "measured": 136.0
                        },
                        {
                            "date": "2025-12-11",
                            "measured": 143.0
                        },
                        {
                            "date": "2025-12-12",
                            "measured": 137.0
                        },
                        {
                            "date": "2025-12-13",
                            "measured": 139.0
                        },
                        {
                            "date": "2025-12-14",
                            "measured": 133.0
                        },
                        {
                            "date": "2025-12-15",
                            "measured": 140.0
                        },
                        {
                            "date": "2025-12-16",
                            "measured": 133.0
                        },
                        {
                            "date": "2025-12-17",
                            "measured": 136.0
                        },
                        {
                            "date": "2025-12-18",
                            "measured": 139.0
                        },
                        {
                            "date": "2025-12-19",
                            "measured": 147.0
                        },
                        {
                            "date": "2025-12-20",
                            "measured": 136.0
                        }
                    ]
                },
                {
                    "kpi_key": "percentage_parked_longer_then_24_hours",
                    "granularity": "day",
                    "values": [
                        {
                            "date": "2025-09-16",
                            "measured": 24.8
                        },
                        {
                            "date": "2025-09-17",
                            "measured": 32.8
                        },
                        {
                            "date": "2025-09-18",
                            "measured": 23.0
                        },
                        {
                            "date": "2025-09-19",
                            "measured": 37.2
                        },
                        {
                            "date": "2025-09-20",
                            "measured": 27.5
                        },
                        {
                            "date": "2025-09-21",
                            "measured": 10.1
                        },
                        {
                            "date": "2025-09-22",
                            "measured": 15.8
                        },
                        {
                            "date": "2025-09-23",
                            "measured": 32.2
                        },
                        {
                            "date": "2025-09-24",
                            "measured": 27.1
                        },
                        {
                            "date": "2025-09-25",
                            "measured": 19.1
                        },
                        {
                            "date": "2025-09-26",
                            "measured": 17.1
                        },
                        {
                            "date": "2025-09-27",
                            "measured": 19.4
                        },
                        {
                            "date": "2025-09-28",
                            "measured": 5.9
                        },
                        {
                            "date": "2025-09-29",
                            "measured": 9.9
                        },
                        {
                            "date": "2025-09-30",
                            "measured": 31.7
                        },
                        {
                            "date": "2025-10-01",
                            "measured": 23.7
                        },
                        {
                            "date": "2025-10-02",
                            "measured": 28.3
                        },
                        {
                            "date": "2025-10-03",
                            "measured": 28.7
                        },
                        {
                            "date": "2025-10-04",
                            "measured": 24.4
                        },
                        {
                            "date": "2025-10-05",
                            "measured": 6.4
                        },
                        {
                            "date": "2025-10-06",
                            "measured": 23.1
                        },
                        {
                            "date": "2025-10-07",
                            "measured": 34.9
                        },
                        {
                            "date": "2025-10-08",
                            "measured": 36.5
                        },
                        {
                            "date": "2025-10-09",
                            "measured": 24.0
                        },
                        {
                            "date": "2025-10-10",
                            "measured": 29.5
                        },
                        {
                            "date": "2025-10-11",
                            "measured": 25.0
                        },
                        {
                            "date": "2025-10-12",
                            "measured": 12.5
                        },
                        {
                            "date": "2025-10-13",
                            "measured": 21.6
                        },
                        {
                            "date": "2025-10-14",
                            "measured": 33.1
                        },
                        {
                            "date": "2025-10-15",
                            "measured": 34.9
                        },
                        {
                            "date": "2025-10-16",
                            "measured": 26.2
                        },
                        {
                            "date": "2025-10-17",
                            "measured": 26.6
                        },
                        {
                            "date": "2025-10-18",
                            "measured": 30.8
                        },
                        {
                            "date": "2025-10-19",
                            "measured": 20.0
                        },
                        {
                            "date": "2025-10-20",
                            "measured": 24.4
                        },
                        {
                            "date": "2025-10-21",
                            "measured": 33.1
                        },
                        {
                            "date": "2025-10-22",
                            "measured": 37.2
                        },
                        {
                            "date": "2025-10-23",
                            "measured": 26.4
                        },
                        {
                            "date": "2025-10-24",
                            "measured": 23.0
                        },
                        {
                            "date": "2025-10-25",
                            "measured": 25.7
                        },
                        {
                            "date": "2025-10-26",
                            "measured": 2.0
                        },
                        {
                            "date": "2025-10-27",
                            "measured": 13.6
                        },
                        {
                            "date": "2025-10-28",
                            "measured": 24.4
                        },
                        {
                            "date": "2025-10-29",
                            "measured": 29.3
                        },
                        {
                            "date": "2025-10-30",
                            "measured": 27.9
                        },
                        {
                            "date": "2025-10-31",
                            "measured": 25.0
                        },
                        {
                            "date": "2025-11-01",
                            "measured": 23.0
                        },
                        {
                            "date": "2025-11-02",
                            "measured": 10.6
                        },
                        {
                            "date": "2025-11-03",
                            "measured": 14.5
                        },
                        {
                            "date": "2025-11-04",
                            "measured": 33.8
                        },
                        {
                            "date": "2025-11-05",
                            "measured": 32.3
                        },
                        {
                            "date": "2025-11-06",
                            "measured": 25.8
                        },
                        {
                            "date": "2025-11-07",
                            "measured": 30.5
                        },
                        {
                            "date": "2025-11-08",
                            "measured": 22.8
                        },
                        {
                            "date": "2025-11-09",
                            "measured": 5.6
                        },
                        {
                            "date": "2025-11-10",
                            "measured": 2.9
                        },
                        {
                            "date": "2025-11-11",
                            "measured": 30.7
                        },
                        {
                            "date": "2025-11-12",
                            "measured": 35.7
                        },
                        {
                            "date": "2025-11-13",
                            "measured": 29.6
                        },
                        {
                            "date": "2025-11-14",
                            "measured": 36.7
                        },
                        {
                            "date": "2025-11-15",
                            "measured": 35.2
                        },
                        {
                            "date": "2025-11-16",
                            "measured": 11.3
                        },
                        {
                            "date": "2025-11-17",
                            "measured": 26.7
                        },
                        {
                            "date": "2025-11-18",
                            "measured": 42.7
                        },
                        {
                            "date": "2025-11-19",
                            "measured": 37.1
                        },
                        {
                            "date": "2025-11-20",
                            "measured": 33.1
                        },
                        {
                            "date": "2025-11-21",
                            "measured": 27.7
                        },
                        {
                            "date": "2025-11-22",
                            "measured": 18.6
                        },
                        {
                            "date": "2025-11-23",
                            "measured": 11.7
                        },
                        {
                            "date": "2025-11-24",
                            "measured": 12.6
                        },
                        {
                            "date": "2025-11-25",
                            "measured": 23.1
                        },
                        {
                            "date": "2025-11-26",
                            "measured": 33.8
                        },
                        {
                            "date": "2025-11-27",
                            "measured": 22.0
                        },
                        {
                            "date": "2025-11-28",
                            "measured": 26.7
                        },
                        {
                            "date": "2025-11-29",
                            "measured": 19.4
                        },
                        {
                            "date": "2025-11-30",
                            "measured": 10.8
                        },
                        {
                            "date": "2025-12-01",
                            "measured": 12.8
                        },
                        {
                            "date": "2025-12-02",
                            "measured": 34.1
                        },
                        {
                            "date": "2025-12-03",
                            "measured": 26.9
                        },
                        {
                            "date": "2025-12-04",
                            "measured": 31.2
                        },
                        {
                            "date": "2025-12-05",
                            "measured": 32.9
                        },
                        {
                            "date": "2025-12-06",
                            "measured": 27.7
                        },
                        {
                            "date": "2025-12-07",
                            "measured": 14.6
                        },
                        {
                            "date": "2025-12-08",
                            "measured": 20.0
                        },
                        {
                            "date": "2025-12-09",
                            "measured": 27.9
                        },
                        {
                            "date": "2025-12-10",
                            "measured": 34.6
                        },
                        {
                            "date": "2025-12-11",
                            "measured": 37.8
                        },
                        {
                            "date": "2025-12-12",
                            "measured": 29.9
                        },
                        {
                            "date": "2025-12-13",
                            "measured": 28.1
                        },
                        {
                            "date": "2025-12-14",
                            "measured": 7.6
                        },
                        {
                            "date": "2025-12-15",
                            "measured": 22.9
                        },
                        {
                            "date": "2025-12-16",
                            "measured": 43.6
                        },
                        {
                            "date": "2025-12-17",
                            "measured": 29.4
                        },
                        {
                            "date": "2025-12-18",
                            "measured": 27.3
                        },
                        {
                            "date": "2025-12-19",
                            "measured": 30.6
                        },
                        {
                            "date": "2025-12-20",
                            "measured": 25.9
                        }
                    ]
                },
                {
                    "kpi_key": "percentage_parked_longer_then_3_days",
                    "granularity": "day",
                    "values": [
                        {
                            "date": "2025-09-16",
                            "measured": 1.7
                        },
                        {
                            "date": "2025-09-17",
                            "measured": 3.3
                        },
                        {
                            "date": "2025-09-18",
                            "measured": 4.4
                        },
                        {
                            "date": "2025-09-19",
                            "measured": 5.8
                        },
                        {
                            "date": "2025-09-20",
                            "measured": 2.8
                        },
                        {
                            "date": "2025-09-21",
                            "measured": 2.0
                        },
                        {
                            "date": "2025-09-22",
                            "measured": 0.9
                        },
                        {
                            "date": "2025-09-23",
                            "measured": 0.8
                        },
                        {
                            "date": "2025-09-24",
                            "measured": 1.7
                        },
                        {
                            "date": "2025-09-25",
                            "measured": 3.5
                        },
                        {
                            "date": "2025-09-26",
                            "measured": 4.3
                        },
                        {
                            "date": "2025-09-27",
                            "measured": 2.8
                        },
                        {
                            "date": "2025-09-28",
                            "measured": 2.0
                        },
                        {
                            "date": "2025-09-29",
                            "measured": 1.7
                        },
                        {
                            "date": "2025-09-30",
                            "measured": 1.7
                        },
                        {
                            "date": "2025-10-01",
                            "measured": 0.8
                        },
                        {
                            "date": "2025-10-02",
                            "measured": 4.2
                        },
                        {
                            "date": "2025-10-03",
                            "measured": 4.1
                        },
                        {
                            "date": "2025-10-04",
                            "measured": 5.9
                        },
                        {
                            "date": "2025-10-05",
                            "measured": 1.8
                        },
                        {
                            "date": "2025-10-06",
                            "measured": 1.7
                        },
                        {
                            "date": "2025-10-07",
                            "measured": 1.6
                        },
                        {
                            "date": "2025-10-08",
                            "measured": 7.9
                        },
                        {
                            "date": "2025-10-09",
                            "measured": 4.8
                        },
                        {
                            "date": "2025-10-10",
                            "measured": 8.3
                        },
                        {
                            "date": "2025-10-11",
                            "measured": 6.3
                        },
                        {
                            "date": "2025-10-12",
                            "measured": 2.7
                        },
                        {
                            "date": "2025-10-13",
                            "measured": 2.4
                        },
                        {
                            "date": "2025-10-14",
                            "measured": 3.2
                        },
                        {
                            "date": "2025-10-15",
                            "measured": 4.8
                        },
                        {
                            "date": "2025-10-16",
                            "measured": 6.3
                        },
                        {
                            "date": "2025-10-17",
                            "measured": 5.5
                        },
                        {
                            "date": "2025-10-18",
                            "measured": 2.6
                        },
                        {
                            "date": "2025-10-19",
                            "measured": 3.5
                        },
                        {
                            "date": "2025-10-20",
                            "measured": 5.5
                        },
                        {
                            "date": "2025-10-21",
                            "measured": 4.7
                        },
                        {
                            "date": "2025-10-22",
                            "measured": 3.9
                        },
                        {
                            "date": "2025-10-23",
                            "measured": 5.0
                        },
                        {
                            "date": "2025-10-24",
                            "measured": 4.4
                        },
                        {
                            "date": "2025-10-25",
                            "measured": 5.3
                        },
                        {
                            "date": "2025-10-26",
                            "measured": 1.0
                        },
                        {
                            "date": "2025-10-27",
                            "measured": 0.8
                        },
                        {
                            "date": "2025-10-29",
                            "measured": 3.3
                        },
                        {
                            "date": "2025-10-30",
                            "measured": 3.1
                        },
                        {
                            "date": "2025-10-31",
                            "measured": 2.3
                        },
                        {
                            "date": "2025-11-01",
                            "measured": 4.1
                        },
                        {
                            "date": "2025-11-02",
                            "measured": 1.0
                        },
                        {
                            "date": "2025-11-03",
                            "measured": 0.8
                        },
                        {
                            "date": "2025-11-04",
                            "measured": 0.8
                        },
                        {
                            "date": "2025-11-05",
                            "measured": 3.2
                        },
                        {
                            "date": "2025-11-06",
                            "measured": 5.5
                        },
                        {
                            "date": "2025-11-07",
                            "measured": 7.8
                        },
                        {
                            "date": "2025-11-08",
                            "measured": 4.7
                        },
                        {
                            "date": "2025-11-09",
                            "measured": 3.7
                        },
                        {
                            "date": "2025-11-10",
                            "measured": 0.7
                        },
                        {
                            "date": "2025-11-11",
                            "measured": 0.7
                        },
                        {
                            "date": "2025-11-12",
                            "measured": 0.7
                        },
                        {
                            "date": "2025-11-13",
                            "measured": 6.3
                        },
                        {
                            "date": "2025-11-14",
                            "measured": 7.2
                        },
                        {
                            "date": "2025-11-15",
                            "measured": 7.8
                        },
                        {
                            "date": "2025-11-16",
                            "measured": 5.6
                        },
                        {
                            "date": "2025-11-17",
                            "measured": 4.4
                        },
                        {
                            "date": "2025-11-18",
                            "measured": 2.4
                        },
                        {
                            "date": "2025-11-19",
                            "measured": 5.3
                        },
                        {
                            "date": "2025-11-20",
                            "measured": 9.2
                        },
                        {
                            "date": "2025-11-21",
                            "measured": 5.8
                        },
                        {
                            "date": "2025-11-22",
                            "measured": 3.9
                        },
                        {
                            "date": "2025-11-23",
                            "measured": 1.7
                        },
                        {
                            "date": "2025-11-24",
                            "measured": 1.6
                        },
                        {
                            "date": "2025-11-25",
                            "measured": 1.5
                        },
                        {
                            "date": "2025-11-26",
                            "measured": 1.5
                        },
                        {
                            "date": "2025-11-27",
                            "measured": 4.5
                        },
                        {
                            "date": "2025-11-28",
                            "measured": 5.3
                        },
                        {
                            "date": "2025-11-29",
                            "measured": 2.3
                        },
                        {
                            "date": "2025-11-30",
                            "measured": 1.7
                        },
                        {
                            "date": "2025-12-01",
                            "measured": 0.8
                        },
                        {
                            "date": "2025-12-02",
                            "measured": 2.2
                        },
                        {
                            "date": "2025-12-03",
                            "measured": 3.0
                        },
                        {
                            "date": "2025-12-04",
                            "measured": 5.1
                        },
                        {
                            "date": "2025-12-05",
                            "measured": 6.4
                        },
                        {
                            "date": "2025-12-06",
                            "measured": 8.8
                        },
                        {
                            "date": "2025-12-07",
                            "measured": 3.3
                        },
                        {
                            "date": "2025-12-08",
                            "measured": 1.5
                        },
                        {
                            "date": "2025-12-09",
                            "measured": 2.2
                        },
                        {
                            "date": "2025-12-10",
                            "measured": 5.1
                        },
                        {
                            "date": "2025-12-11",
                            "measured": 4.2
                        },
                        {
                            "date": "2025-12-12",
                            "measured": 5.1
                        },
                        {
                            "date": "2025-12-13",
                            "measured": 7.9
                        },
                        {
                            "date": "2025-12-14",
                            "measured": 1.5
                        },
                        {
                            "date": "2025-12-15",
                            "measured": 2.1
                        },
                        {
                            "date": "2025-12-16",
                            "measured": 0.8
                        },
                        {
                            "date": "2025-12-17",
                            "measured": 5.9
                        },
                        {
                            "date": "2025-12-18",
                            "measured": 5.0
                        },
                        {
                            "date": "2025-12-19",
                            "measured": 4.1
                        },
                        {
                            "date": "2025-12-20",
                            "measured": 6.7
                        }
                    ]
                },
                {
                    "kpi_key": "percentage_parked_longer_then_7_days",
                    "granularity": "day",
                    "values": [
                        {
                            "date": "2025-09-16",
                            "measured": 0.8
                        },
                        {
                            "date": "2025-09-17",
                            "measured": 0.8
                        },
                        {
                            "date": "2025-09-18",
                            "measured": 1.8
                        },
                        {
                            "date": "2025-09-19",
                            "measured": 1.7
                        },
                        {
                            "date": "2025-09-22",
                            "measured": 0.9
                        },
                        {
                            "date": "2025-09-23",
                            "measured": 0.8
                        },
                        {
                            "date": "2025-09-24",
                            "measured": 0.8
                        },
                        {
                            "date": "2025-09-25",
                            "measured": 0.9
                        },
                        {
                            "date": "2025-09-26",
                            "measured": 0.9
                        },
                        {
                            "date": "2025-09-27",
                            "measured": 0.9
                        },
                        {
                            "date": "2025-09-28",
                            "measured": 1.0
                        },
                        {
                            "date": "2025-09-29",
                            "measured": 0.8
                        },
                        {
                            "date": "2025-09-30",
                            "measured": 1.7
                        },
                        {
                            "date": "2025-10-08",
                            "measured": 0.8
                        },
                        {
                            "date": "2025-10-09",
                            "measured": 0.8
                        },
                        {
                            "date": "2025-10-10",
                            "measured": 0.8
                        },
                        {
                            "date": "2025-10-14",
                            "measured": 0.8
                        },
                        {
                            "date": "2025-10-15",
                            "measured": 0.8
                        },
                        {
                            "date": "2025-10-20",
                            "measured": 0.8
                        },
                        {
                            "date": "2025-10-21",
                            "measured": 0.8
                        },
                        {
                            "date": "2025-10-23",
                            "measured": 0.8
                        },
                        {
                            "date": "2025-10-24",
                            "measured": 0.9
                        },
                        {
                            "date": "2025-10-25",
                            "measured": 0.9
                        },
                        {
                            "date": "2025-10-26",
                            "measured": 1.0
                        },
                        {
                            "date": "2025-10-27",
                            "measured": 0.8
                        },
                        {
                            "date": "2025-11-04",
                            "measured": 0.8
                        },
                        {
                            "date": "2025-11-05",
                            "measured": 0.8
                        },
                        {
                            "date": "2025-11-06",
                            "measured": 0.8
                        },
                        {
                            "date": "2025-11-09",
                            "measured": 0.9
                        },
                        {
                            "date": "2025-11-11",
                            "measured": 0.7
                        },
                        {
                            "date": "2025-11-12",
                            "measured": 0.7
                        },
                        {
                            "date": "2025-11-23",
                            "measured": 1.7
                        },
                        {
                            "date": "2025-11-24",
                            "measured": 1.6
                        },
                        {
                            "date": "2025-11-25",
                            "measured": 1.5
                        },
                        {
                            "date": "2025-11-26",
                            "measured": 1.5
                        },
                        {
                            "date": "2025-11-27",
                            "measured": 0.8
                        },
                        {
                            "date": "2025-11-28",
                            "measured": 0.8
                        },
                        {
                            "date": "2025-11-29",
                            "measured": 0.8
                        },
                        {
                            "date": "2025-11-30",
                            "measured": 0.8
                        },
                        {
                            "date": "2025-12-01",
                            "measured": 0.8
                        },
                        {
                            "date": "2025-12-06",
                            "measured": 1.5
                        },
                        {
                            "date": "2025-12-07",
                            "measured": 1.6
                        },
                        {
                            "date": "2025-12-08",
                            "measured": 0.8
                        },
                        {
                            "date": "2025-12-09",
                            "measured": 0.7
                        },
                        {
                            "date": "2025-12-10",
                            "measured": 0.7
                        },
                        {
                            "date": "2025-12-11",
                            "measured": 0.7
                        },
                        {
                            "date": "2025-12-12",
                            "measured": 0.7
                        },
                        {
                            "date": "2025-12-13",
                            "measured": 0.7
                        }
                    ]
                },
                {
                    "kpi_key": "percentage_parked_longer_then_14_days",
                    "granularity": "day",
                    "values": [
                        {
                            "date": "2025-09-29",
                            "measured": 0.8
                        },
                        {
                            "date": "2025-09-30",
                            "measured": 0.8
                        },
                        {
                            "date": "2025-11-30",
                            "measured": 0.8
                        },
                        {
                            "date": "2025-12-01",
                            "measured": 0.8
                        },
                        {
                            "date": "2025-12-13",
                            "measured": 0.7
                        }
                    ]
                }
            ]
        }
    ]
};
        
        // Filter by operator and form_factor if provided
        let filteredData = stubData.municipality_modality_operators;
        if (operator) {
            filteredData = filteredData.filter(item => item.operator === operator);
        }
        if (form_factor) {
            filteredData = filteredData.filter(item => item.form_factor === form_factor);
        }
        
        return {
            ...stubData,
            municipality_modality_operators: filteredData
        };
    } catch (error) {
        console.error("Error fetching operator performance indicators", error);
        return null;
    }
};
