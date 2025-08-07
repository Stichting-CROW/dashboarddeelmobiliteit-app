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
