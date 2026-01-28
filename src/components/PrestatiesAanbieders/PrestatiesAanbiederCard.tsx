import { useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import createSvgPlaceholder from '../../helpers/create-svg-placeholder';
import { RangeBarIndicator } from './RangeBarIndicator';
import type { PermitLimitRecord, PerformanceIndicatorKPI, OperatorPerformanceIndicatorsResponse } from '../../api/permitLimits';
import { getOperatorPerformanceIndicators } from '../../api/permitLimits';
import PerformanceIndicator from './PerformanceIndicator';
import Button from '../Button/Button';
import { StateType } from '../../types/StateType';

interface PrestatiesAanbiederCardProps {
    label: string;
    logo: string;
    permit: PermitLimitRecord;
    onEditLimits?: () => void;
}

const DetailsButton = ({ detailsUrl }: { detailsUrl: string }) => {
  const navigate = useNavigate();
  
  return (
    <Button theme='gray' title="Details" onClick={() => navigate(detailsUrl)} classes="permits-card-details-button">
      Details
    </Button>
  );
};

export default function PrestatiesAanbiederCard({ label, logo, permit, onEditLimits }: PrestatiesAanbiederCardProps) {
    const [kpis, setKpis] = useState<PerformanceIndicatorKPI[]>([]);
    const [loading, setLoading] = useState(false);

    const token = useSelector((state: StateType) => 
      (state.authentication && state.authentication.user_data && state.authentication.user_data.token) || null
    );

    useEffect(() => {
      const fetchPerformanceIndicators = async () => {
        if (!token || !permit.permit_limit) return;

        const operator = permit.operator?.system_id || permit.permit_limit.system_id;
        const formFactor = permit.vehicle_type?.id || permit.permit_limit.modality;
        const municipality = permit.municipality?.gmcode || permit.permit_limit.municipality;

        if (!operator || !formFactor || !municipality) return;

        setLoading(true);
        try {
          const data = await getOperatorPerformanceIndicators(token, municipality, operator, formFactor);
          if (data && data.municipality_modality_operators.length > 0) {
            // Find matching operator/form_factor combination
            const match = data.municipality_modality_operators.find(
              item => item.operator === operator && item.form_factor === formFactor
            );
            if (match) {
              setKpis(match.kpis);
            }
          }
        } catch (error) {
          console.error('Error fetching performance indicators:', error);
        } finally {
          setLoading(false);
        }
      };

      fetchPerformanceIndicators();
    }, [token, permit]);

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
          <div className="hidden">
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
          </div>
          <div title={label} className="permits-card-label">
            {label}
          </div>
        </div>

        <div data-name="indicator-container" className="flex flex-col gap-2">
          {loading ? (
            <div>Laden...</div>
          ) : (
            kpis.map((kpi) => (
              <PerformanceIndicator
                key={kpi.kpi_key}
                kpi={kpi}
              />
            ))
          )}
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
      </div>
    );
}