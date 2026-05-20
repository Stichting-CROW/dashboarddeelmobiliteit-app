import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useEffect, useState, useMemo, useRef } from 'react';
import { useSelector } from 'react-redux';
import createSvgPlaceholder from '../../helpers/create-svg-placeholder';
import type {
  PermitLimitRecord,
  PerformanceIndicatorKPI,
  PerformanceIndicatorDescription,
  MunicipalityModalityOperator,
} from '../../api/permitLimits';
import { getOperatorPerformanceIndicators, findOperatorMatch } from '../../api/permitLimits';
import type { KpiOverviewQueryScope } from '../../api/permitLimits';
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
    /** When set, shows a vehicle-type icon beside the provider label (operator overview). */
    vehicleTypeIcon?: string;
    vehicleTypeIconAlt?: string;
    /** Operator overview: use this system_id for KPI API calls (required by backend). */
    scopedSystemId?: string;
    kpiFetchScope?: KpiOverviewQueryScope;
    /** Preloaded KPI rows from operator overview fetch (avoids per-card API calls). */
    overviewKpiOperators?: MunicipalityModalityOperator[];
    overviewKpiDescriptions?: PerformanceIndicatorDescription[];
}

const KPI_TITLE_ORDER = [
  'Aantal onverhuurde voertuigen',
  'Voertuigen in verbodsgebieden',
  'Parkeerduur > 1 dag',
  'Parkeerduur > 3 dagen',
  'Parkeerduur > 7 dagen',
  'Parkeerduur > 14 dagen',
] as const;

interface DetailsLinkProps {
  detailsUrl: string;
  isCardHovered: boolean;
  isHidden?: boolean;
}

const DetailsLink = ({ detailsUrl, isCardHovered, isHidden = false }: DetailsLinkProps) => (
  <Link
    to={detailsUrl}
    title="Details"
    aria-hidden={isHidden || !isCardHovered}
    tabIndex={isHidden || !isCardHovered ? -1 : undefined}
    className={`font-normal text-[14px] leading-[17px] font-[Inter] text-[#B2B2B2] transition-opacity duration-200${isCardHovered ? ' underline' : ''}${isHidden || !isCardHovered ? ' opacity-0 invisible pointer-events-none' : ' opacity-100 visible'}`}
  >
    details
  </Link>
);

const applyKpiDataToCard = (
  descriptions: PerformanceIndicatorDescription[],
  operators: MunicipalityModalityOperator[],
  operator: string,
  formFactor: string,
  propulsionType: string | undefined,
  setPerformanceIndicatorDescriptions: (d: PerformanceIndicatorDescription[]) => void,
  setKpis: (k: PerformanceIndicatorKPI[]) => void
) => {
  if (descriptions.length > 0) {
    setPerformanceIndicatorDescriptions(descriptions);
  }
  const match =
    operators.length > 0
      ? findOperatorMatch(operators, operator, formFactor, propulsionType)
      : undefined;
  const backendKpis = match?.kpis ?? [];
  const allKpis: PerformanceIndicatorKPI[] =
    descriptions.length > 0
      ? descriptions.map((desc) => {
          const found = backendKpis.find((k) => k.kpi_key === desc.kpi_key);
          return found ?? { kpi_key: desc.kpi_key, granularity: '', values: [] };
        })
      : backendKpis;
  setKpis(allKpis);
};

export default function PrestatiesAanbiederCard({
  label,
  logo,
  permit,
  onEditLimits,
  vehicleTypeIcon,
  vehicleTypeIconAlt,
  scopedSystemId,
  kpiFetchScope = 'municipality',
  overviewKpiOperators,
  overviewKpiDescriptions,
}: PrestatiesAanbiederCardProps) {
    const [kpis, setKpis] = useState<PerformanceIndicatorKPI[]>([]);
    const [performanceIndicatorDescriptions, setPerformanceIndicatorDescriptions] = useState<PerformanceIndicatorDescription[]>([]);
    const [loading, setLoading] = useState(false);
    const [isCardHovered, setIsCardHovered] = useState(false);
    const [isEditButtonHovered, setIsEditButtonHovered] = useState(false);
    const [isIndicatorContainerHovered, setIsIndicatorContainerHovered] = useState(false);
    const hasLoadedOnce = useRef(false);
    const location = useLocation();
    const navigate = useNavigate();
    const [urlSearch, setUrlSearch] = useState<string>(window.location.search);

    const providerSystemId = permit.operator?.system_id || permit.permit_limit.system_id;
    const realLabel = label;
    const propulsionType = permit.propulsion_type;
    const displayLabel = getDisplayOperatorName(providerSystemId, realLabel, isDemoMode());
    const providerColor = getDisplayProviderColor(
      providerSystemId,
      getProviderColorForProvider(providerSystemId),
      isDemoMode()
    );

    const token = useSelector((state: StateType) =>
      (state.authentication && state.authentication.user_data && state.authentication.user_data.token) || null
    );

    const sortedKpis = useMemo(() => {
      if (!kpis || kpis.length === 0) return [];

      const titleByKey = new Map<string, string>(
        performanceIndicatorDescriptions.map((desc) => [desc.kpi_key, desc.title])
      );

      const getOrderIndex = (kpi: PerformanceIndicatorKPI): number => {
        const title = titleByKey.get(kpi.kpi_key) || '';
        const index = KPI_TITLE_ORDER.indexOf(title as (typeof KPI_TITLE_ORDER)[number]);
        return index === -1 ? KPI_TITLE_ORDER.length : index;
      };

      return [...kpis].sort((a, b) => {
        const orderA = getOrderIndex(a);
        const orderB = getOrderIndex(b);
        if (orderA !== orderB) {
          return orderA - orderB;
        }

        const titleA = titleByKey.get(a.kpi_key) || a.kpi_key;
        const titleB = titleByKey.get(b.kpi_key) || b.kpi_key;

        return titleA.localeCompare(titleB, 'nl');
      });
    }, [kpis, performanceIndicatorDescriptions]);

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
      const urlPropulsion = searchParams.get('propulsion_type');
      if (!urlGmCode || !urlOperator || !urlFormFactor) return false;

      const cardGmCode = permit.municipality?.gmcode || permit.permit_limit.municipality;
      const cardOperator = permit.operator?.system_id || permit.permit_limit.system_id;
      const cardFormFactor = permit.vehicle_type?.id || permit.permit_limit.modality;

      const baseMatch = urlGmCode === cardGmCode && urlOperator === cardOperator && urlFormFactor === cardFormFactor;
      if (propulsionType) {
        return baseMatch && urlPropulsion === propulsionType;
      }
      return baseMatch && !urlPropulsion;
    }, [urlSearch, permit]);

    const detailsUrl = `/stats/prestaties-aanbieders?gm_code=${permit.municipality?.gmcode || permit.permit_limit.municipality}&operator=${permit.operator?.system_id || permit.permit_limit.system_id}&form_factor=${permit.vehicle_type?.id || permit.permit_limit.modality}${propulsionType ? `&propulsion_type=${propulsionType}` : ''}${startDate ? `&start_date=${startDate}` : ''}${endDate ? `&end_date=${endDate}` : ''}`;

    useEffect(() => {
      const operator = scopedSystemId || permit.operator?.system_id || permit.permit_limit.system_id;
      const formFactor = permit.vehicle_type?.id || permit.permit_limit.modality;
      const municipality = permit.municipality?.gmcode || permit.permit_limit.municipality;

      if (!operator || !formFactor) return;
      if (kpiFetchScope === 'municipality' && !municipality) return;

      if (overviewKpiOperators) {
        const descriptions = overviewKpiDescriptions ?? [];
        applyKpiDataToCard(
          descriptions,
          overviewKpiOperators,
          operator,
          formFactor,
          propulsionType,
          setPerformanceIndicatorDescriptions,
          setKpis
        );
        hasLoadedOnce.current = true;
        return;
      }

      const fetchPerformanceIndicators = async () => {
        if (!token || !permit.permit_limit) return;

        setLoading(true);
        try {
          const data = await getOperatorPerformanceIndicators(token, {
            scope: kpiFetchScope,
            system_id: operator,
            municipality,
            form_factor: formFactor,
            start_date: startDate,
            end_date: endDate,
          });
          if (data) {
            applyKpiDataToCard(
              data.performance_indicator_description || [],
              data.municipality_modality_operators || [],
              operator,
              formFactor,
              propulsionType,
              setPerformanceIndicatorDescriptions,
              setKpis
            );
            hasLoadedOnce.current = true;
          }
        } catch (error) {
          console.error('Error fetching performance indicators:', error);
        } finally {
          setLoading(false);
        }
      };

      fetchPerformanceIndicators();
    }, [
      token,
      permit,
      startDate,
      endDate,
      propulsionType,
      scopedSystemId,
      kpiFetchScope,
      overviewKpiOperators,
      overviewKpiDescriptions,
    ]);

    return (
        <div
          id={'permits-card-' + permit.permit_limit.permit_limit_id}
          className={`permits-card${isActive ? ' permits-card--active' : ''}`}
          onMouseEnter={() => setIsCardHovered(true)}
          onMouseLeave={() => setIsCardHovered(false)}
          onClick={(event) => {
            const target = event.target as HTMLElement;
            if (target.closest('[data-name="indicator-container"]')) {
              return;
            }

            if (target.closest('a, button')) {
              return;
            }

            navigate(detailsUrl);
          }}
        >
          <div
            className="permits-card-content"
          >
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
              <div className="flex items-center gap-2">
                <ProviderLabel label={displayLabel} color={providerColor} />
                {vehicleTypeIcon && (
                  <img
                    src={vehicleTypeIcon}
                    alt={vehicleTypeIconAlt || ''}
                    className="permits-vehicle-type-header-img w-6 h-6"
                  />
                )}
              </div>
              <div className="flex items-center gap-2">
                <DetailsLink
                  detailsUrl={detailsUrl}
                  isCardHovered={isCardHovered}
                  isHidden={isActive || isEditButtonHovered || isIndicatorContainerHovered}
                />
                {/* Gear icon: normal click = edit limits, Shift+click = KPI overview raw */}
                { onEditLimits && <button
                  type="button"
                  aria-label="Verguningseisen bewerken"
                  title="Bewerk vergunningseisen"
                  className="permits-card-edit-button"
                  onMouseEnter={() => setIsEditButtonHovered(true)}
                  onMouseLeave={() => setIsEditButtonHovered(false)}
                  onClick={(e) => {
                    if (permit.propulsion_type) {
                      onEditLimits();
                    } else {
                      alert('Geen propulsion_type – bewerken niet mogelijk.');
                    }
                  }}
                >
                  {/* Use settings.svg icon */}
                  <img
                    src="/images/components/Menu/settings.svg"
                    alt="Verguningseisen bewerken"
                    className={`w-[18px] h-[18px] transition-all duration-200 ${isEditButtonHovered ? 'invert-[0.55]' : 'invert-[0.8]'}`}
                  />
                </button>}
              </div>
            </div>
          </div>

          <div
            data-name="indicator-container"
            className="flex flex-col gap-2 flex-1"
            onMouseEnter={() => setIsIndicatorContainerHovered(true)}
            onMouseLeave={() => setIsIndicatorContainerHovered(false)}
          >
            {loading && kpis.length === 0 ? (
              <div>Laden...</div>
            ) : (
              sortedKpis.map((kpi) => (
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