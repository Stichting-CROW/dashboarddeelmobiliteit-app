import { Link, useLocation } from 'react-router-dom';
import { useEffect, useState, useMemo, useRef } from 'react';
import { useSelector } from 'react-redux';
import moment from 'moment';
import createSvgPlaceholder from '../../helpers/create-svg-placeholder';
import { RangeBarIndicator } from './RangeBarIndicator';
import type { PermitLimitRecord, PerformanceIndicatorKPI, OperatorPerformanceIndicatorsResponse, PerformanceIndicatorDescription } from '../../api/permitLimits';
import { getOperatorPerformanceIndicators } from '../../api/permitLimits';
import PerformanceIndicator from './PerformanceIndicator';
import { StateType } from '../../types/StateType';
import ProviderLabel from './ProviderLabel';
import { getProviderColorForProvider } from '../../helpers/providers';
import { isDemoMode } from '../../config/demo';
import { getDisplayOperatorName, getDisplayProviderColor } from '../../helpers/demoMode';

interface PrestatiesAanbiederCardProps {
    label: string;
    logo: string;
    permit: PermitLimitRecord;
    onEditLimits?: () => void;
}

const DetailsLink = ({ detailsUrl }: { detailsUrl: string }) => (
  <Link
    to={detailsUrl}
    title="Details"
    className="font-normal text-[14px] leading-[17px] font-[Inter] text-[#B2B2B2] hover:underline"
  >
    detail
  </Link>
);

export default function PrestatiesAanbiederCard({ label, logo, permit, onEditLimits }: PrestatiesAanbiederCardProps) {
    const [kpis, setKpis] = useState<PerformanceIndicatorKPI[]>([]);
    const [performanceIndicatorDescriptions, setPerformanceIndicatorDescriptions] = useState<PerformanceIndicatorDescription[]>([]);
    const [loading, setLoading] = useState(false);
    const hasLoadedOnce = useRef(false);
    const location = useLocation();
    const [urlSearch, setUrlSearch] = useState<string>(window.location.search);

    const providerSystemId = permit.operator?.system_id || permit.permit_limit.system_id;
    const realLabel = label;
    const displayLabel = getDisplayOperatorName(providerSystemId, realLabel, isDemoMode());
    const providerColor = getDisplayProviderColor(
      providerSystemId,
      getProviderColorForProvider(providerSystemId),
      isDemoMode()
    );

    const token = useSelector((state: StateType) => 
      (state.authentication && state.authentication.user_data && state.authentication.user_data.token) || null
    );

    // Watch for URL changes (triggered by Filterbar using window.history.replaceState)
    useEffect(() => {
      // Update from React Router location first
      setUrlSearch(location.search);
      
      const checkUrlChange = () => {
        const currentSearch = window.location.search;
        setUrlSearch(prevSearch => {
          if (currentSearch !== prevSearch) {
            return currentSearch;
          }
          return prevSearch;
        });
      };

      // Check periodically for URL changes (since replaceState doesn't trigger popstate)
      const interval = setInterval(checkUrlChange, 200);
      
      // Also listen to popstate for back/forward navigation
      window.addEventListener('popstate', checkUrlChange);

      return () => {
        clearInterval(interval);
        window.removeEventListener('popstate', checkUrlChange);
      };
    }, [location.search]);

    // Get dates from URL params
    const { startDate, endDate } = useMemo(() => {
      const searchParams = new URLSearchParams(urlSearch);
      const startDateParam = searchParams.get('start_date');
      const endDateParam = searchParams.get('end_date');
      
      return { 
        startDate: startDateParam || undefined, 
        endDate: endDateParam || undefined 
      };
    }, [urlSearch]);

    // Card is "active" when details panel is shown for this permit (URL params match)
    const isActive = useMemo(() => {
      const searchParams = new URLSearchParams(urlSearch);
      const urlGmCode = searchParams.get('gm_code');
      const urlOperator = searchParams.get('operator') || searchParams.get('system_id');
      const urlFormFactor = searchParams.get('form_factor');
      if (!urlGmCode || !urlOperator || !urlFormFactor) return false;

      const cardGmCode = permit.municipality?.gmcode || permit.permit_limit.municipality;
      const cardOperator = permit.operator?.system_id || permit.permit_limit.system_id;
      const cardFormFactor = permit.vehicle_type?.id || permit.permit_limit.modality;

      return urlGmCode === cardGmCode && urlOperator === cardOperator && urlFormFactor === cardFormFactor;
    }, [urlSearch, permit]);

    useEffect(() => {
      const fetchPerformanceIndicators = async () => {
        if (!token || !permit.permit_limit) return;

        const operator = permit.operator?.system_id || permit.permit_limit.system_id;
        const formFactor = permit.vehicle_type?.id || permit.permit_limit.modality;
        const municipality = permit.municipality?.gmcode || permit.permit_limit.municipality;

        if (!operator || !formFactor || !municipality) return;

        setLoading(true);
        try {
          const data = await getOperatorPerformanceIndicators(
            token, 
            municipality, 
            operator, 
            formFactor,
            startDate,
            endDate
          );
          if (data) {
            if (data.performance_indicator_description) {
              setPerformanceIndicatorDescriptions(data.performance_indicator_description);
            }
            if (data.municipality_modality_operators.length > 0) {
              // Find matching operator/form_factor combination
              const match = data.municipality_modality_operators.find(
                item => item.operator === operator && item.form_factor === formFactor
              );
              if (match) {
                setKpis(match.kpis);
              } else {
                // Clear kpis if no match found (e.g., data was removed)
                setKpis([]);
              }
            } else {
              // Clear kpis if no operators found
              setKpis([]);
            }
            // Mark as loaded once after successful fetch, regardless of whether data was found
            hasLoadedOnce.current = true;
          }
        } catch (error) {
          console.error('Error fetching performance indicators:', error);
        } finally {
          setLoading(false);
        }
      };

      fetchPerformanceIndicators();
    }, [token, permit, startDate, endDate]);

    return (
      <div
        id={'permits-card-' + permit.permit_limit.permit_limit_id}
        className={`permits-card${isActive ? ' permits-card--active' : ''}`}
      >
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
          <div className="flex justify-between">
            <ProviderLabel label={displayLabel} color={providerColor} />
            <div className="flex items-center gap-2">
              <DetailsLink detailsUrl={`/dashboard/prestaties-aanbieders?gm_code=${permit.municipality?.gmcode || permit.permit_limit.municipality}&operator=${permit.operator?.system_id || permit.permit_limit.system_id}&form_factor=${permit.vehicle_type?.id || permit.permit_limit.modality}${startDate ? `&start_date=${startDate}` : ''}${endDate ? `&end_date=${endDate}` : ''}`} />
              {/* Sprocket icon for editing limits */}
              { onEditLimits && <button
                type="button"
                aria-label="Verguningseisen bewerken"
                title="Verguningseisen bewerken"
                className="permits-card-edit-button"
                onClick={onEditLimits}
              >
                {/* Use settings.svg icon */}
                <img src="/images/components/Menu/settings.svg" alt="Verguningseisen bewerken" className="w-[18px] h-[18px] invert-[0.8]" />
              </button>}
            </div>
          </div>
        </div>

        <div data-name="indicator-container" className="flex flex-col gap-2 flex-1">
          {loading && kpis.length === 0 ? (
            <div>Laden...</div>
          ) : (
            kpis.map((kpi) => (
              <PerformanceIndicator
                key={kpi.kpi_key}
                kpi={kpi}
                performanceIndicatorDescriptions={performanceIndicatorDescriptions}
              />
            ))
          )}
        </div>
      </div>
    );
}