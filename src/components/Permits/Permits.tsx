import { useEffect, useState } from 'react';
import moment from 'moment';

import {
  getProvider,
  getProviderColor,
} from '../../helpers/providers.js';

const Permits = () => {
  const [permits, setPermits] = useState<any[]>([]);

  useEffect(() => {
    // TODO: Replace with actual API call to fetch permits
    const fetchPermits = async () => {
      // This is a placeholder - replace with actual API call
      const mockPermits: any[] = [
        {
          id: 1,
          municipality: "Utrecht",
          operator: "check",
          valid_from: "2024-01-01",
          valid_until: "2025-10-31"
        },
        {
          id: 3,
          municipality: "Utrecht",
          operator: "felyx",
          valid_from: "2024-06-01",
          valid_until: "2025-12-31"
        },
        {
          id: 2,
          municipality: "Utrecht",
          operator: "donkey",
          valid_from: "2024-01-01",
          valid_until: "2025-12-31"
        },
        {
          id: 4,
          municipality: "Utrecht",
          operator: "cykl",
          valid_from: "2024-02-01",
          valid_until: "2025-12-31"
        },
      ];
      setPermits(mockPermits);
    };

    fetchPermits();
  }, []);

  return (
    <div>
      <h1 className="text-4xl font-bold mb-8">
        Vergunningen
      </h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-6">
        {permits.map((permit) => {
          const provider = getProvider(permit.operator);
          return (
            <div key={permit.id} className="bg-white rounded-lg shadow-md p-6">
              <div className="flex items-center mb-4">
                <img 
                  src={provider.logo}
                  alt={`${provider.name} logo`}
                  className="w-12 h-12 object-contain mr-4"
                  onError={(e) => {
                    e.currentTarget.src = 'https://via.placeholder.com/48?text=Logo';
                  }}
                />
                <h2 title={provider.name} className="text-xl font-semibold whitespace-nowrap text-ellipsis overflow-hidden">
                  {provider.name}
                </h2>
              </div>
              
              <div className="space-y-2">
                <div>
                  <span className="text-gray-600">Van:</span>
                  <span className="ml-2">{moment(permit.valid_from).format('DD-MM-YYYY')}</span>
                </div>
                <div>
                  <span className="text-gray-600">Tot:</span>
                  <span className="ml-2">{moment(permit.valid_until).format('DD-MM-YYYY')}</span>
                </div>
                <div>
                  <span className="text-gray-600">Gemeente:</span>
                  <span className="ml-2">{permit.municipality}</span>
                </div>
              </div>
            </div>
        )})}
      </div>
    </div>
  );
};

export default Permits;
