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
        const params = new URLSearchParams({municipality}).toString();
        const url = `${MDS_BASE_URL}/public/permit_limit_overview?${params}`;
        const response = await fetch(url, {
            method: 'GET',
            headers: {
                "authorization": `Bearer ${token}`,
            }
        });

        if(response.status === 500) {
            const message = `No permit limit found (status: ${response.status}) for [${municipality}]`;
            console.warn(message);
            return null;
        }

        if(response.status !== 200 && response.status !== 500) {
            const message = `Error fetching permit limit overview (status: ${response.status}/${response.statusText}) for [${municipality}]`;
            console.error(message);
            return null;
        }

        const results = await response.json() as PermitLimitRecord[];
        if(results.length > 0) {
            // const message = `**** Found ${results.length} permit limits for [${municipality}]`;
            // console.log(message, results);
            return results;
        } else {
            // const message = `**** Found no ${results.length} permit limits for [${municipality}]`;
            // console.log(message, results);
            return null // no permit limit found
        }
    } catch (error) {
        console.error("Error fetching permit limit overview", error);
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

export interface MunicipalityModalityOperator {
    operator: string;
    form_factor: string;
    geometry_ref: string;
    kpis: PerformanceIndicatorKPI[];
}

export interface OperatorPerformanceIndicatorsResponse {
    performance_indicator_description: any[];
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
            "performance_indicator_description":  [
              {
                "kpi_key": "max_vehicles",
                "bound": "upper",
                "unit": "number"
              },
              {
                "kpi_key": "longer_than_7_days",
                "bound": "upper",
                "unit": "percentage"
              }
            ],
            "municipality_modality_operators": [
                {
                    "operator": "baqme",
                    "form_factor": "cargo_bicycle",
                    "geometry_ref": "cbs:GM0599",
                    "kpis": [
                        {
                            "kpi_key": "1",
                            "granularity": "day",
                            "values": [
                                { "date": "2025-12-16", "measured": 131.0 },
                                { "date": "2025-12-17", "measured": 130.0 },
                                { "date": "2025-12-18", "measured": 132.0 },
                                { "date": "2025-12-19", "measured": 132.0 },
                                { "date": "2025-12-20", "measured": 131.0 }
                            ]
                        },
                        {
                            "kpi_key": "6",
                            "granularity": "day",
                            "values": [
                                { "date": "2025-12-16", "measured": 62.0 },
                                { "date": "2025-12-17", "measured": 70.0 },
                                { "date": "2025-12-18", "measured": 49.0 },
                                { "date": "2025-12-19", "measured": 43.0 },
                                { "date": "2025-12-20", "measured": 44.0 }
                            ]
                        },
                        {
                            "kpi_key": "2",
                            "granularity": "day",
                            "values": [
                                { "date": "2025-12-16", "measured": 54.2 },
                                { "date": "2025-12-17", "measured": 59.2 },
                                { "date": "2025-12-18", "measured": 50.0 },
                                { "date": "2025-12-19", "measured": 52.7 },
                                { "date": "2025-12-20", "measured": 48.9 }
                            ]
                        },
                        {
                            "kpi_key": "3",
                            "granularity": "day",
                            "values": [
                                { "date": "2025-12-16", "measured": 22.1 },
                                { "date": "2025-12-17", "measured": 26.2 },
                                { "date": "2025-12-18", "measured": 24.2 },
                                { "date": "2025-12-19", "measured": 26.0 },
                                { "date": "2025-12-20", "measured": 22.9 }
                            ]
                        },
                        {
                            "kpi_key": "4",
                            "granularity": "day",
                            "values": [
                                { "date": "2025-12-16", "measured": 7.6 },
                                { "date": "2025-12-17", "measured": 6.9 },
                                { "date": "2025-12-18", "measured": 5.3 },
                                { "date": "2025-12-19", "measured": 6.9 },
                                { "date": "2025-12-20", "measured": 9.2 }
                            ]
                        },
                        {
                            "kpi_key": "5",
                            "granularity": "day",
                            "values": [
                                { "date": "2025-12-16", "measured": 3.8 },
                                { "date": "2025-12-17", "measured": 3.1 },
                                { "date": "2025-12-18", "measured": 2.3 },
                                { "date": "2025-12-19", "measured": 2.3 },
                                { "date": "2025-12-20", "measured": 2.3 }
                            ]
                        }
                    ]
                },
                {
                    "operator": "check",
                    "form_factor": "moped",
                    "geometry_ref": "cbs:GM0599",
                    "kpis": [
                        {
                            "kpi_key": "1",
                            "granularity": "day",
                            "values": [
                                { "date": "2025-12-16", "measured": 1135.0 },
                                { "date": "2025-12-17", "measured": 1135.0 },
                                { "date": "2025-12-18", "measured": 1150.0 },
                                { "date": "2025-12-19", "measured": 1109.0 },
                                { "date": "2025-12-20", "measured": 1109.0 }
                            ]
                        },
                        {
                            "kpi_key": "6",
                            "granularity": "day",
                            "values": [
                                { "date": "2025-12-16", "measured": 418.0 },
                                { "date": "2025-12-17", "measured": 450.0 },
                                { "date": "2025-12-18", "measured": 223.0 },
                                { "date": "2025-12-19", "measured": 121.0 },
                                { "date": "2025-12-20", "measured": 121.0 }
                            ]
                        },
                        {
                            "kpi_key": "2",
                            "granularity": "day",
                            "values": [
                                { "date": "2025-12-16", "measured": 43.3 },
                                { "date": "2025-12-17", "measured": 37.3 },
                                { "date": "2025-12-18", "measured": 30.7 },
                                { "date": "2025-12-19", "measured": 56.0 },
                                { "date": "2025-12-20", "measured": 100.0 }
                            ]
                        },
                        {
                            "kpi_key": "3",
                            "granularity": "day",
                            "values": [
                                { "date": "2025-12-16", "measured": 21.9 },
                                { "date": "2025-12-17", "measured": 21.1 },
                                { "date": "2025-12-18", "measured": 17.5 },
                                { "date": "2025-12-19", "measured": 19.6 },
                                { "date": "2025-12-20", "measured": 26.8 }
                            ]
                        },
                        {
                            "kpi_key": "4",
                            "granularity": "day",
                            "values": [
                                { "date": "2025-12-16", "measured": 8.7 },
                                { "date": "2025-12-17", "measured": 9.5 },
                                { "date": "2025-12-18", "measured": 7.6 },
                                { "date": "2025-12-19", "measured": 8.7 },
                                { "date": "2025-12-20", "measured": 11.2 }
                            ]
                        },
                        {
                            "kpi_key": "5",
                            "granularity": "day",
                            "values": [
                                { "date": "2025-12-16", "measured": 2.2 },
                                { "date": "2025-12-17", "measured": 2.7 },
                                { "date": "2025-12-18", "measured": 1.7 },
                                { "date": "2025-12-19", "measured": 2.9 },
                                { "date": "2025-12-20", "measured": 3.3 }
                            ]
                        }
                    ]
                },
                {
                    "operator": "felyx",
                    "form_factor": "bicycle",
                    "geometry_ref": "cbs:GM0599",
                    "kpis": [
                        {
                            "kpi_key": "1",
                            "granularity": "day",
                            "values": [
                                { "date": "2025-12-16", "measured": 837.0 },
                                { "date": "2025-12-17", "measured": 841.0 },
                                { "date": "2025-12-18", "measured": 833.0 },
                                { "date": "2025-12-19", "measured": 842.0 },
                                { "date": "2025-12-20", "measured": 839.0 }
                            ]
                        },
                        {
                            "kpi_key": "6",
                            "granularity": "day",
                            "values": [
                                { "date": "2025-12-16", "measured": 189.0 },
                                { "date": "2025-12-17", "measured": 195.0 },
                                { "date": "2025-12-18", "measured": 188.0 },
                                { "date": "2025-12-19", "measured": 197.0 },
                                { "date": "2025-12-20", "measured": 211.0 }
                            ]
                        },
                        {
                            "kpi_key": "2",
                            "granularity": "day",
                            "values": [
                                { "date": "2025-12-16", "measured": 65.1 },
                                { "date": "2025-12-17", "measured": 64.7 },
                                { "date": "2025-12-18", "measured": 64.7 },
                                { "date": "2025-12-19", "measured": 63.0 },
                                { "date": "2025-12-20", "measured": 64.2 }
                            ]
                        },
                        {
                            "kpi_key": "3",
                            "granularity": "day",
                            "values": [
                                { "date": "2025-12-16", "measured": 34.8 },
                                { "date": "2025-12-17", "measured": 37.2 },
                                { "date": "2025-12-18", "measured": 36.6 },
                                { "date": "2025-12-19", "measured": 35.8 },
                                { "date": "2025-12-20", "measured": 35.9 }
                            ]
                        },
                        {
                            "kpi_key": "4",
                            "granularity": "day",
                            "values": [
                                { "date": "2025-12-16", "measured": 13.2 },
                                { "date": "2025-12-17", "measured": 13.2 },
                                { "date": "2025-12-18", "measured": 12.8 },
                                { "date": "2025-12-19", "measured": 13.4 },
                                { "date": "2025-12-20", "measured": 16.2 }
                            ]
                        },
                        {
                            "kpi_key": "5",
                            "granularity": "day",
                            "values": [
                                { "date": "2025-12-16", "measured": 4.9 },
                                { "date": "2025-12-17", "measured": 5.1 },
                                { "date": "2025-12-18", "measured": 4.5 },
                                { "date": "2025-12-19", "measured": 5.0 },
                                { "date": "2025-12-20", "measured": 5.2 }
                            ]
                        }
                    ]
                },
                {
                    "operator": "felyx",
                    "form_factor": "moped",
                    "geometry_ref": "cbs:GM0599",
                    "kpis": [
                        {
                            "kpi_key": "1",
                            "granularity": "day",
                            "values": [
                                { "date": "2025-12-16", "measured": 1288.0 },
                                { "date": "2025-12-17", "measured": 1304.0 },
                                { "date": "2025-12-18", "measured": 1291.0 },
                                { "date": "2025-12-19", "measured": 1298.0 },
                                { "date": "2025-12-20", "measured": 1307.0 }
                            ]
                        },
                        {
                            "kpi_key": "6",
                            "granularity": "day",
                            "values": [
                                { "date": "2025-12-16", "measured": 1550.0 },
                                { "date": "2025-12-17", "measured": 1756.0 },
                                { "date": "2025-12-18", "measured": 1584.0 },
                                { "date": "2025-12-19", "measured": 1607.0 },
                                { "date": "2025-12-20", "measured": 1500.0 }
                            ]
                        },
                        {
                            "kpi_key": "2",
                            "granularity": "day",
                            "values": [
                                { "date": "2025-12-16", "measured": 58.8 },
                                { "date": "2025-12-17", "measured": 53.3 },
                                { "date": "2025-12-18", "measured": 49.9 },
                                { "date": "2025-12-19", "measured": 51.6 },
                                { "date": "2025-12-20", "measured": 50.2 }
                            ]
                        },
                        {
                            "kpi_key": "3",
                            "granularity": "day",
                            "values": [
                                { "date": "2025-12-16", "measured": 30.5 },
                                { "date": "2025-12-17", "measured": 30.1 },
                                { "date": "2025-12-18", "measured": 29.4 },
                                { "date": "2025-12-19", "measured": 27.1 },
                                { "date": "2025-12-20", "measured": 26.6 }
                            ]
                        },
                        {
                            "kpi_key": "4",
                            "granularity": "day",
                            "values": [
                                { "date": "2025-12-16", "measured": 14.2 },
                                { "date": "2025-12-17", "measured": 13.3 },
                                { "date": "2025-12-18", "measured": 13.6 },
                                { "date": "2025-12-19", "measured": 13.0 },
                                { "date": "2025-12-20", "measured": 13.2 }
                            ]
                        },
                        {
                            "kpi_key": "5",
                            "granularity": "day",
                            "values": [
                                { "date": "2025-12-16", "measured": 5.4 },
                                { "date": "2025-12-17", "measured": 5.6 },
                                { "date": "2025-12-18", "measured": 5.4 },
                                { "date": "2025-12-19", "measured": 5.0 },
                                { "date": "2025-12-20", "measured": 4.6 }
                            ]
                        }
                    ]
                },
                {
                    "operator": "greenwheels",
                    "form_factor": "car",
                    "geometry_ref": "cbs:GM0599",
                    "kpis": [
                        {
                            "kpi_key": "1",
                            "granularity": "day",
                            "values": [
                                { "date": "2025-12-16", "measured": 30.0 },
                                { "date": "2025-12-17", "measured": 31.0 },
                                { "date": "2025-12-18", "measured": 28.0 },
                                { "date": "2025-12-19", "measured": 32.0 },
                                { "date": "2025-12-20", "measured": 34.0 }
                            ]
                        },
                        {
                            "kpi_key": "2",
                            "granularity": "day",
                            "values": [
                                { "date": "2025-12-16", "measured": 46.7 },
                                { "date": "2025-12-17", "measured": 45.2 },
                                { "date": "2025-12-18", "measured": 39.3 },
                                { "date": "2025-12-19", "measured": 40.6 },
                                { "date": "2025-12-20", "measured": 20.6 }
                            ]
                        },
                        {
                            "kpi_key": "3",
                            "granularity": "day",
                            "values": [
                                { "date": "2025-12-16", "measured": 10.0 },
                                { "date": "2025-12-17", "measured": 12.9 },
                                { "date": "2025-12-18", "measured": 21.4 },
                                { "date": "2025-12-19", "measured": 12.5 },
                                { "date": "2025-12-20", "measured": 11.8 }
                            ]
                        },
                        {
                            "kpi_key": "4",
                            "granularity": "day",
                            "values": [
                                { "date": "2025-12-16", "measured": 3.3 },
                                { "date": "2025-12-17", "measured": 3.2 },
                                { "date": "2025-12-18", "measured": 3.6 },
                                { "date": "2025-12-19", "measured": 6.3 },
                                { "date": "2025-12-20", "measured": 2.9 }
                            ]
                        },
                        {
                            "kpi_key": "5",
                            "granularity": "day",
                            "values": [
                                { "date": "2025-12-16", "measured": 3.3 },
                                { "date": "2025-12-17", "measured": 3.2 },
                                { "date": "2025-12-18", "measured": 3.6 },
                                { "date": "2025-12-19", "measured": 3.1 },
                                { "date": "2025-12-20", "measured": 2.9 }
                            ]
                        }
                    ]
                },
                {
                    "operator": "greenwheels",
                    "form_factor": "car",
                    "geometry_ref": "cbs:GM0599",
                    "kpis": [
                        {
                            "kpi_key": "1",
                            "granularity": "day",
                            "values": [
                                { "date": "2025-12-16", "measured": 149.0 },
                                { "date": "2025-12-17", "measured": 146.0 },
                                { "date": "2025-12-18", "measured": 145.0 },
                                { "date": "2025-12-19", "measured": 144.0 },
                                { "date": "2025-12-20", "measured": 143.0 }
                            ]
                        },
                        {
                            "kpi_key": "2",
                            "granularity": "day",
                            "values": [
                                { "date": "2025-12-16", "measured": 37.6 },
                                { "date": "2025-12-17", "measured": 43.8 },
                                { "date": "2025-12-18", "measured": 34.5 },
                                { "date": "2025-12-19", "measured": 34.7 },
                                { "date": "2025-12-20", "measured": 41.0 }
                            ]
                        },
                        {
                            "kpi_key": "3",
                            "granularity": "day",
                            "values": [
                                { "date": "2025-12-16", "measured": 10.1 },
                                { "date": "2025-12-17", "measured": 11.0 },
                                { "date": "2025-12-18", "measured": 11.0 },
                                { "date": "2025-12-19", "measured": 11.1 },
                                { "date": "2025-12-20", "measured": 10.1 }
                            ]
                        },
                        {
                            "kpi_key": "4",
                            "granularity": "day",
                            "values": [
                                { "date": "2025-12-16", "measured": 4.0 },
                                { "date": "2025-12-17", "measured": 4.1 },
                                { "date": "2025-12-18", "measured": 3.4 },
                                { "date": "2025-12-19", "measured": 2.1 },
                                { "date": "2025-12-20", "measured": 2.2 }
                            ]
                        },
                        {
                            "kpi_key": "5",
                            "granularity": "day",
                            "values": [
                                { "date": "2025-12-16", "measured": 2.7 },
                                { "date": "2025-12-17", "measured": 2.7 },
                                { "date": "2025-12-18", "measured": 2.1 },
                                { "date": "2025-12-19", "measured": 1.4 },
                                { "date": "2025-12-20", "measured": 1.4 }
                            ]
                        }
                    ]
                },
                {
                    "operator": "lime",
                    "form_factor": "bicycle",
                    "geometry_ref": "cbs:GM0599",
                    "kpis": [
                        {
                            "kpi_key": "1",
                            "granularity": "day",
                            "values": [
                                { "date": "2025-12-16", "measured": 1058.0 },
                                { "date": "2025-12-17", "measured": 1084.0 },
                                { "date": "2025-12-18", "measured": 1071.0 },
                                { "date": "2025-12-19", "measured": 1092.0 },
                                { "date": "2025-12-20", "measured": 1094.0 }
                            ]
                        },
                        {
                            "kpi_key": "6",
                            "granularity": "day",
                            "values": [
                                { "date": "2025-12-16", "measured": 565.0 },
                                { "date": "2025-12-17", "measured": 508.0 },
                                { "date": "2025-12-18", "measured": 482.0 },
                                { "date": "2025-12-19", "measured": 547.0 },
                                { "date": "2025-12-20", "measured": 490.0 }
                            ]
                        },
                        {
                            "kpi_key": "2",
                            "granularity": "day",
                            "values": [
                                { "date": "2025-12-16", "measured": 29.7 },
                                { "date": "2025-12-17", "measured": 24.7 },
                                { "date": "2025-12-18", "measured": 21.8 },
                                { "date": "2025-12-19", "measured": 22.2 },
                                { "date": "2025-12-20", "measured": 21.6 }
                            ]
                        },
                        {
                            "kpi_key": "3",
                            "granularity": "day",
                            "values": [
                                { "date": "2025-12-16", "measured": 7.5 },
                                { "date": "2025-12-17", "measured": 8.5 },
                                { "date": "2025-12-18", "measured": 7.0 },
                                { "date": "2025-12-19", "measured": 4.9 },
                                { "date": "2025-12-20", "measured": 4.5 }
                            ]
                        },
                        {
                            "kpi_key": "4",
                            "granularity": "day",
                            "values": [
                                { "date": "2025-12-16", "measured": 0.3 },
                                { "date": "2025-12-17", "measured": 0.4 },
                                { "date": "2025-12-18", "measured": 0.4 },
                                { "date": "2025-12-19", "measured": 0.3 },
                                { "date": "2025-12-20", "measured": 0.4 }
                            ]
                        },
                        {
                            "kpi_key": "5",
                            "granularity": "day",
                            "values": [
                                { "date": "2025-12-16", "measured": 0.1 },
                                { "date": "2025-12-17", "measured": 0.1 },
                                { "date": "2025-12-18", "measured": 0.1 },
                                { "date": "2025-12-19", "measured": 0.1 },
                                { "date": "2025-12-20", "measured": 0.1 }
                            ]
                        }
                    ]
                },
                {
                    "operator": "mywheels",
                    "form_factor": "car",
                    "geometry_ref": "cbs:GM0599",
                    "kpis": [
                        {
                            "kpi_key": "1",
                            "granularity": "day",
                            "values": [
                                { "date": "2025-12-16", "measured": 12.0 },
                                { "date": "2025-12-17", "measured": 10.0 },
                                { "date": "2025-12-18", "measured": 10.0 },
                                { "date": "2025-12-19", "measured": 11.0 },
                                { "date": "2025-12-20", "measured": 10.0 }
                            ]
                        },
                        {
                            "kpi_key": "2",
                            "granularity": "day",
                            "values": [
                                { "date": "2025-12-16", "measured": 25.0 },
                                { "date": "2025-12-17", "measured": 10.0 },
                                { "date": "2025-12-18", "measured": 37.5 },
                                { "date": "2025-12-20", "measured": 30.0 }
                            ]
                        }
                    ]
                },
                {
                    "operator": "mywheels",
                    "form_factor": "car",
                    "geometry_ref": "cbs:GM0599",
                    "kpis": [
                        {
                            "kpi_key": "1",
                            "granularity": "day",
                            "values": [
                                { "date": "2025-12-16", "measured": 133.0 },
                                { "date": "2025-12-17", "measured": 136.0 },
                                { "date": "2025-12-18", "measured": 139.0 },
                                { "date": "2025-12-19", "measured": 147.0 },
                                { "date": "2025-12-20", "measured": 136.0 }
                            ]
                        },
                        {
                            "kpi_key": "2",
                            "granularity": "day",
                            "values": [
                                { "date": "2025-12-16", "measured": 43.6 },
                                { "date": "2025-12-17", "measured": 29.4 },
                                { "date": "2025-12-18", "measured": 27.3 },
                                { "date": "2025-12-19", "measured": 30.6 },
                                { "date": "2025-12-20", "measured": 25.9 }
                            ]
                        },
                        {
                            "kpi_key": "3",
                            "granularity": "day",
                            "values": [
                                { "date": "2025-12-16", "measured": 0.8 },
                                { "date": "2025-12-17", "measured": 5.9 },
                                { "date": "2025-12-18", "measured": 5.0 },
                                { "date": "2025-12-19", "measured": 4.1 },
                                { "date": "2025-12-20", "measured": 6.7 }
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
