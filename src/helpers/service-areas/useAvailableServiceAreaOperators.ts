import { useEffect, useState } from 'react';

import { getAvailableOperators } from '../../api/service-areas';

interface AvailableServiceAreaOperators {
  operators: string[];
  isLoading: boolean;
}

/**
 * Returns the operators that have a service area in the given municipality.
 * Returns an empty list if no municipality is selected.
 */
export const useAvailableServiceAreaOperators = (
  municipality: string | null | undefined
): AvailableServiceAreaOperators => {
  const [operators, setOperators] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(!!municipality);

  useEffect(() => {
    if (!municipality) {
      setOperators([]);
      setIsLoading(false);
      return;
    }

    let isStale = false;
    setIsLoading(true);

    getAvailableOperators(municipality).then((response) => {
      if (isStale) return;
      setOperators(response?.operators_with_service_area || []);
      setIsLoading(false);
    });

    return () => {
      isStale = true;
    };
  }, [municipality]);

  return { operators, isLoading };
};
