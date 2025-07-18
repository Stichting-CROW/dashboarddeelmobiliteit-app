import { getProvider } from '../../helpers/providers.js';
import { APIPermitResultCurrent } from './Permits';
import createSvgPlaceholder from '../../helpers/create-svg-placeholder';
import { RangeBarIndicator } from './RangeBarIndicator';
import { CategoryBarIndicator } from './CategoryBarIndicator';

export default function PermitsCard({ permit }: { permit: APIPermitResultCurrent }) {
    const provider = getProvider(permit.operator_system_id);

    const providerName = provider ? provider.name : permit.operator_system_id;
    const providerLogo = provider ? provider.logo : createSvgPlaceholder({
        width: 48,
        height: 48,
        text: provider?.name.slice(0, 2),
        bgColor: '#0F1C3F',
        textColor: '#7FDBFF',
    });

    return (
      <div id={'permits-card-' + permit.id} className="bg-white rounded-lg shadow-md p-6 w-64 h-auto">
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
            <span className="text-gray-500">{provider?.name.slice(0, 2)}{permit.operator_system_id}</span>
          </div> } 
          <div title={provider?.name} className="text-sm font-semibold text-center whitespace-nowrap text-ellipsis overflow-hidden">
            {providerName}
          </div>
        </div>

        <RangeBarIndicator title="Aanbod" current={permit.current_capacity} min={permit.min_capacity} max={permit.max_capacity} />
        <CategoryBarIndicator 
          title="Stilstandtijd (% correct)" 
          categories={[
            { value: permit.pct_duration_correct, color: '#4caf50' },
            { value: 100 - permit.pct_duration_correct, color: '#f44336' },
          ]} 
          max={100} 
          displayValues={true} 
        />
        <CategoryBarIndicator 
          title="Min. aantal ritten (% correct)" 
          categories={[
            { value: permit.pct_rides_per_vehicle_correct, color: '#4caf50' },
            { value: 100 - permit.pct_rides_per_vehicle_correct, color: '#f44336' },
          ]} 
          max={100} 
          displayValues={true} 
        />
        <RangeBarIndicator 
          title="Verkeerd geparkeerd" 
          current={permit.vehicles_illegally_parked_count} 
          max={permit.max_vehicles_illegally_parked_count} />
        </div>);
}