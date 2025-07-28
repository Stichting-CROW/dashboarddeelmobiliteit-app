import { getProvider } from '../../helpers/providers.js';
import createSvgPlaceholder from '../../helpers/create-svg-placeholder';
import { RangeBarIndicator } from './RangeBarIndicator';
import { CategoryBarIndicator } from './CategoryBarIndicator';
import type { PermitRecord } from '../../api/permitLimits';
import { useState, useEffect } from 'react';

export default function PermitsCard({ permit, onEditLimits }: { permit: PermitRecord, onEditLimits?: () => void }) {
    const provider = getProvider(permit.permit_limit.system_id);

    // Simulated animated values
    const [animatedVehicleCount, setAnimatedVehicleCount] = useState(permit.stats.current_vehicle_count);
    const [animatedDurationPercentage, setAnimatedDurationPercentage] = useState(100 - permit.stats.duration_correct_percentage);

    // Animate values every 3 seconds
    useEffect(() => {
      const interval = setInterval(() => {
        // Vehicle count variation: ±50
        const vehicleVariation = Math.random() * 100 - 50; // -50 to +50
        const newVehicleCount = Math.max(0, Math.round(permit.stats.current_vehicle_count + vehicleVariation));
        setAnimatedVehicleCount(newVehicleCount);

        // Duration percentage variation: ±50
        const durationVariation = Math.random() * 100 - 50; // -50 to +50
        const newDurationPercentage = Math.max(0, Math.min(100, Math.round((100 - permit.stats.duration_correct_percentage) + durationVariation)));
        setAnimatedDurationPercentage(Math.round(newDurationPercentage));
      }, 15000);

      return () => clearInterval(interval);
    }, [permit.stats.current_vehicle_count, permit.stats.duration_correct_percentage]);

    const providerName = provider ? provider.name : permit.permit_limit.system_id;
    const providerLogo = provider ? provider.logo : createSvgPlaceholder({
        width: 48,
        height: 48,
        text: provider?.name.slice(0, 2),
        bgColor: '#0F1C3F',
        textColor: '#7FDBFF',
    });

    return (
      <div id={'permits-card-' + permit.permit_limit.permit_limit_id} className="bg-white rounded-lg shadow-md p-6 w-64 h-auto relative">
        {/* Sprocket icon for editing limits */}
        <button
          type="button"
          aria-label="Verguningseisen bewerken"
          title="Verguningseisen bewerken"
          className="absolute top-2 right-2 p-1 bg-transparent hover:bg-gray-100 rounded-full"
          onClick={onEditLimits}
        >
          {/* Use settings.svg icon */}
          <img src="/images/components/Menu/settings.svg" alt="Verguningseisen bewerken" width={20} height={20} />
        </button>
        {/* End Sprocket icon */}
        <div className="flex flex-col items-center mb-4">
          { provider ? <img 
            src={providerLogo}
            alt={`${providerName} logo`}
            className="w-12 h-12 object-contain"
            onError={(e) => {
              e.currentTarget.src = createSvgPlaceholder({
                width: 48,
                height: 48,
                text: providerName.slice(0, 2),
                bgColor: '#0F1C3F',
                textColor: '#7FDBFF',
                fontSize: 24,
                fontWeight: 'bold',
                fontFamily: 'Arial, sans-serif',
                dy: 7,
                radius: 4,
              });
            }}
          />: <div className="w-12 h-12 bg-gray-200 rounded-full flex items-center justify-center">
            <span className="text-gray-500">{provider?.name.slice(0, 2)}{permit.permit_limit.system_id}</span>
          </div> } 
          <div title={provider?.name} className="text-sm font-semibold text-center whitespace-nowrap text-ellipsis overflow-hidden">
            {providerName}
          </div>
        </div>

        <RangeBarIndicator title="Aantal Voertuigen" current={permit.stats.current_vehicle_count} min={permit.permit_limit.minimum_vehicles} max={permit.permit_limit.maximum_vehicles} />
        <RangeBarIndicator 
          title="Aantal te lang geparkeerd" 
          current={permit.stats.duration_correct_percentage} 
          max={25} 
        />
        {/* <RangeBarIndicator 
          title="Gem. Aantal Verhuringen" 
          current={permit.stats.number_of_rentals_per_vehicle} 
          min={permit.permit_limit.minimal_number_of_trips_per_vehicle} 
        /> */}
        {/* <RangeBarIndicator 
          title="Verkeerd geparkeerd" 
          current={permit.stats.number_of_vehicles_illegally_parked_last_month} 
          max={permit.permit_limit.maximum_vehicles} /> */}
        </div>);
}