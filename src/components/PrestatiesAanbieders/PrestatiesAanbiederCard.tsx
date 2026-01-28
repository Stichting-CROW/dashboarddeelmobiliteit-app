import { useNavigate } from 'react-router-dom';import createSvgPlaceholder from '../../helpers/create-svg-placeholder';
import { RangeBarIndicator } from './RangeBarIndicator';
import type { PermitLimitRecord } from '../../api/permitLimits';
import PerformanceIndicator from './PerformanceIndicator';

interface PrestatiesAanbiederCardProps {
    label: string;
    logo: string;
    permit: PermitLimitRecord;
    onEditLimits?: () => void;
}

const DetailsButton = ({ detailsUrl }: { detailsUrl: string }) => {
  const navigate = useNavigate();
  
  return (
    <button type="button" aria-label="Details" title="Details" className="bg-gray-500 text-white permits-card-details-button" onClick={() => navigate(detailsUrl)}>
      Details
    </button>
  );
};

export default function PrestatiesAanbiederCard({ label, logo, permit, onEditLimits }: PrestatiesAanbiederCardProps) {
    return (
      <div id={'permits-card-' + permit.permit_limit.permit_limit_id} className="permits-card">
        {/* Sprocket icon for editing limits */}
        { onEditLimits && <button
          type="button"
          aria-label="Verguningseisen bewerken"
          title="Verguningseisen bewerken"
          className="permits-card-edit-button"
          onClick={onEditLimits}
        >
          {/* Use settings.svg icon */}
          <img src="/images/components/Menu/settings.svg" alt="Verguningseisen bewerken" width={16} height={16} />
        </button>}
        {/* End Sprocket icon */}
        <div className="permits-card-content">
          { logo ? 
            <img 
              src={logo}
              alt={`${label} logo`}
              className="permits-card-logo"
              onError={(e) => {
                e.currentTarget.src = createSvgPlaceholder({
                  width: 36,
                  height: 36,
                  text: label.slice(0, 2),
                  bgColor: '#0F1C3F',
                  textColor: '#7FDBFF',
                  fontSize: 18,
                  fontWeight: 'bold',
                  fontFamily: 'Arial, sans-serif',
                  dy: 5,
                  radius: 3,
                });
              }}
            />
            : 
            <div className="permits-card-fallback">
              <span className="permits-card-fallback-text">{label.slice(0, 2)}{label}</span> 
            </div> 
          }
          <div title={label} className="permits-card-label">
            {label}
          </div>
        </div>

        <div data-name="indicator-container" className="flex flex-col gap-2">
          <PerformanceIndicator
            title="Aantal onverhuurde voertuigen"
          />
          <PerformanceIndicator
            title="Aantal voertuigen beschikbaar"
          />
          <DetailsButton detailsUrl={`/dashboard/prestaties-aanbieders-details/${permit.permit_limit.permit_limit_id}`} />
        </div>
{/* 
        <RangeBarIndicator 
          title="Aantal onverhuurde voertuigen"
          current={permit.stats?.number_of_vehicles_in_public_space} 
          min={permit.permit_limit.minimum_vehicles} 
          max={permit.permit_limit.maximum_vehicles} 
          explanation="Deze balk toont of het aantal voertuigen binnen de vergunningseis ligt"
          onClick={()=>alert('Toon hier een detailgrafiek voor aantal voertuigen')} 
          />
        <RangeBarIndicator 
          title="Aantal voertuigen beschikbaar" 
          current={permit.stats?.number_of_vehicles_in_public_space_parked_to_long} 
          max={0} 
          explanation="Deze balk toont of het aantal voertuigen buiten de vergunningseis ligt"
          onClick={()=>alert('Toon hier een detailgrafiek voor aantal te lang geparkeerd')} 
        /> */}
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