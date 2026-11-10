import { useCallback, useMemo } from 'react';
import { useSelector } from 'react-redux';
import { StateType } from '../../types/StateType';
import { isDemoMode } from '../../config/demo';
import { getDisplayOperatorName, getDisplayProviderColor } from '../../helpers/demoMode';
import { getPrettyProviderName, getProviderColorForProvider } from '../../helpers/providers';
import { getPrettyVehicleTypeName } from '../../helpers/vehicleTypes';
import type { RejectionLabelResolvers } from './dataQualityUtils';

export interface DataQualityLabels extends RejectionLabelResolvers {
  getOperatorColor: (systemId: string) => string;
}

const EMPTY_LIST: never[] = [];

/** Demo-aware display names and colors for operators, municipalities and vehicle types. */
export const useDataQualityLabels = (): DataQualityLabels => {
  const gebieden = useSelector((state: StateType) => state.metadata?.gebieden || EMPTY_LIST);

  const municipalityNames = useMemo(() => {
    const names = new Map<string, string>();
    gebieden.forEach((g: { gm_code?: string; name?: string }) => {
      if (g.gm_code && g.name) names.set(g.gm_code, g.name);
    });
    return names;
  }, [gebieden]);

  const getOperatorName = useCallback((systemId: string) => {
    return getDisplayOperatorName(systemId, getPrettyProviderName(systemId), isDemoMode());
  }, []);

  const getOperatorColor = useCallback((systemId: string) => {
    return getDisplayProviderColor(systemId, getProviderColorForProvider(systemId), isDemoMode());
  }, []);

  const getMunicipalityName = useCallback(
    (gmCode: string) => municipalityNames.get(gmCode) || gmCode,
    [municipalityNames]
  );

  const getVehicleTypeName = useCallback(
    (vehicleTypeId: string) => getPrettyVehicleTypeName(vehicleTypeId) || vehicleTypeId,
    []
  );

  return useMemo(() => ({
    getOperatorName,
    getOperatorColor,
    getMunicipalityName,
    getVehicleTypeName,
  }), [getOperatorName, getOperatorColor, getMunicipalityName, getVehicleTypeName]);
};
