import createSvgPlaceholder from '../../helpers/create-svg-placeholder';
import { RangeBarIndicator } from './RangeBarIndicator';
import type { PermitLimitRecord } from '../../api/permitLimits';

interface PermitsCardProps {
    label: string;
    logo: string;
    permit: PermitLimitRecord;
    onEditLimits?: () => void;
}

export default function PermitsCard({ label, logo, permit, onEditLimits }: PermitsCardProps) {
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

        <RangeBarIndicator 
          title="Aantal Voertuigen" 
          current={permit.stats?.number_of_vehicles_in_public_space} 
          min={permit.permit_limit.minimum_vehicles} 
          max={permit.permit_limit.maximum_vehicles} 
          explanation="Deze balk toont of het aantal voertuigen binnen de vergunningseis ligt"
          onClick={()=>alert('Toon hier een detailgrafiek voor aantal voertuigen')} 
          />
        <RangeBarIndicator 
          title="Aantal te lang geparkeerd" 
          current={permit.stats?.number_of_vehicles_in_public_space_parked_to_long} 
          max={0} 
          explanation="Deze balk toont of het aantal voertuigen buiten de vergunningseis ligt"
          onClick={()=>alert('Toon hier een detailgrafiek voor aantal te lang geparkeerd')} 
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