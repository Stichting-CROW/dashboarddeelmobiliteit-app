import { useEffect, useState, useCallback } from 'react';
import { useSelector } from 'react-redux';
import { StateType } from '../../types/StateType';
import { 
  getPermitLimitOverviewForMunicipality, 
  getPermitLimitOverviewForOperator,
  type PermitLimitRecord 
} from '../../api/permitLimits';
import { fetchOperators, type OperatorData } from '../../api/operators';
import { getPrettyVehicleTypeName, getVehicleIconUrl } from '../../helpers/vehicleTypes';

export type PermitViewType = 'municipality' | 'operator';

export const usePermitData = (viewType: PermitViewType, filterValue: string) => {
  const [permits, setPermits] = useState<PermitLimitRecord[]>([]);
  const [availableOperators, setAvailableOperators] = useState<OperatorData[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const token = useSelector((state: StateType) => 
    (state.authentication && state.authentication.user_data && state.authentication.user_data.token) || null
  );

  // Fetch operators for operator view
  useEffect(() => {
    fetchOperators().then((operators) => {
      if (operators) {
        setAvailableOperators(operators);
      }
    });
  }, []); // Add empty dependency array to run only once

  // Helper to reload permits
  const reloadPermits = useCallback(async () => {
    if (!token || !filterValue) return;

    setLoading(true);
    setError(null);

    console.log('Reloading permits for viewType:', viewType, 'with filterValue:', filterValue);

    try {
      let results: PermitLimitRecord[] | null = null;
      
      if (viewType === 'municipality') {
        results = await getPermitLimitOverviewForMunicipality(token, filterValue);
      } else {
        results = await getPermitLimitOverviewForOperator(token, filterValue);
      }

      // there are some exceptions in the backend, so we need to filter them out
      // drop all records that have no permit_limit 
      // when not given, create municipality field by copying the municipality from the permit_limit
      if(results) {
        results = results.filter((record) => record.permit_limit);
        results.forEach((record) => {
          if(!record.municipality) {
            record.municipality = { name: record.permit_limit.municipality, gmcode: record.permit_limit.municipality };
          } 
          if(!record.vehicle_type) {
            record.vehicle_type = { 
              id: record.permit_limit.modality, 
              name: getPrettyVehicleTypeName(record.permit_limit.modality) || record.permit_limit.modality,
              icon: getVehicleIconUrl(record.permit_limit.modality) || getVehicleIconUrl('other'),
            };
          }
        });
      }

      setPermits(results || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error occurred');
    } finally {
      setLoading(false);
    }
  }, [token, filterValue, viewType]); // These dependencies are correct

  useEffect(() => {
    reloadPermits();
  }, [reloadPermits]);

  return {
    permits,
    availableOperators,
    loading,
    error,
    reloadPermits,
    token
  };
}; 