import { getProvider } from '../../helpers/providers.js';
import { APIPermitResultCurrent } from './Permits';
import createSvgPlaceholder from '../../helpers/create-svg-placeholder';
import { RangeBarIndicator } from './RangeBarIndicator';
import { CategoryBarIndicator } from './CategoryBarIndicator';

export default function PermitsCard({ permit, onEditLimits }: { permit: APIPermitResultCurrent, onEditLimits?: () => void }) {
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
      <div id={'permits-card-' + permit.id} className="bg-white rounded-lg shadow-md p-6 w-64 h-auto relative">
        {/* Sprocket icon for editing limits */}
        <button
          type="button"
          aria-label="Voertuigplafonds bewerken"
          title="Voertuigplafonds bewerken"
          className="absolute top-2 right-2 p-1 bg-transparent hover:bg-gray-100 rounded-full"
          onClick={onEditLimits}
        >
          {/* Inline SVG for sprocket/gear icon */}
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M10 13.3333C11.841 13.3333 13.3333 11.841 13.3333 10C13.3333 8.15905 11.841 6.66666 10 6.66666C8.15905 6.66666 6.66666 8.15905 6.66666 10C6.66666 11.841 8.15905 13.3333 10 13.3333Z" stroke="#555" strokeWidth="1.5"/>
            <path d="M17.5 10.8333V9.16666L15.9833 8.84166C15.8583 8.36666 15.675 7.91666 15.4417 7.5L16.3667 6.25833L15.1083 4.99999L13.8667 5.92499C13.45 5.69166 13 5.50833 12.525 5.38333L12.2 3.86666H10.5333L10.2083 5.38333C9.73333 5.50833 9.28333 5.69166 8.86666 5.92499L7.625 4.99999L6.36666 6.25833L7.29166 7.5C7.05833 7.91666 6.875 8.36666 6.75 8.84166L5.23333 9.16666V10.8333L6.75 11.1583C6.875 11.6333 7.05833 12.0833 7.29166 12.5L6.36666 13.7417L7.625 15L8.86666 14.075C9.28333 14.3083 9.73333 14.4917 10.2083 14.6167L10.5333 16.1333H12.2L12.525 14.6167C13 14.4917 13.45 14.3083 13.8667 14.075L15.1083 15L16.3667 13.7417L15.4417 12.5C15.675 12.0833 15.8583 11.6333 15.9833 11.1583L17.5 10.8333Z" stroke="#555" strokeWidth="1.5"/>
          </svg>
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