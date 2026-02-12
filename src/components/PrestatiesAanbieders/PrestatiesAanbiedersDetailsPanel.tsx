import React, { useEffect, useState, useMemo } from 'react';
import { useSelector } from 'react-redux';
import { useLocation } from 'react-router-dom';
import moment from 'moment';
import { StateType } from '../../types/StateType';
import { fetchOperators, type OperatorData } from '../../api/operators';
import { getPrettyVehicleTypeName, getPluralFormFactorName } from '../../helpers/vehicleTypes';
import LineChart, { LineChartData } from '../Chart/LineChart';
import { getKpiOverviewOperators } from '../../api/kpiOverview';
import Modal from '../Modal/Modal.jsx';
import SelectProviderDialog from './SelectProviderDialog';
import SelectVehicleTypeDialog from './SelectVehicleTypeDialog';
import { getProviderColorForProvider } from '../../helpers/providers';
import { isDemoMode } from '../../config/demo';
import { getDisplayOperatorName, getDisplayProviderColor, applyDemoValueFactor } from '../../helpers/demoMode';
import { getVehicleIconUrl } from '../../helpers/vehicleTypes';
import ProviderLabel from './ProviderLabel';
import './PrestatiesAanbiedersDetailsPanel.css';

interface PrestatiesAanbiedersDetailsPanelProps {
  onClose: () => void;
  onToggleFullscreen?: () => void;
  isFullscreen?: boolean;
}

function PrestatiesAanbiedersDetailsPanel({ onClose, onToggleFullscreen, isFullscreen = false }: PrestatiesAanbiedersDetailsPanelProps) {
  const gebieden = useSelector((state: StateType) => state.metadata.gebieden);
  const voertuigtypes = useSelector((state: StateType) => state.metadata.vehicle_types);
  const token = useSelector((state: StateType) =>
    (state.authentication.user_data && state.authentication.user_data.token) || null
  );
  const [operators, setOperators] = useState<OperatorData[]>([]);
  const [kpiData, setKpiData] = useState<any>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [urlSearch, setUrlSearch] = useState<string>(window.location.search);
  const [showProviderModal, setShowProviderModal] = useState<boolean>(false);
  const [showVehicleTypeModal, setShowVehicleTypeModal] = useState<boolean>(false);

  const location = useLocation();

  useEffect(() => {
    setUrlSearch(location.search);

    const checkUrlChange = () => {
      const currentSearch = window.location.search;
      setUrlSearch((prevSearch) => {
        if (currentSearch !== prevSearch) return currentSearch;
        return prevSearch;
      });
    };

    const interval = setInterval(checkUrlChange, 200);
    window.addEventListener('popstate', checkUrlChange);

    return () => {
      clearInterval(interval);
      window.removeEventListener('popstate', checkUrlChange);
    };
  }, [location.search]);

  const queryParams = useMemo(() => new URLSearchParams(urlSearch), [urlSearch]);
  const municipalityCode = queryParams.get('gm_code');
  const operatorCode = queryParams.get('system_id') || queryParams.get('operator');
  const formFactorCode = queryParams.get('form_factor');
  const startDateParam = queryParams.get('start_date');
  const endDateParam = queryParams.get('end_date');

  const startDate = useMemo(() => {
    if (startDateParam) {
      const parsed = moment(startDateParam);
      if (parsed.isValid()) return parsed.toDate();
    }
    return moment().subtract(60, 'days').toDate();
  }, [startDateParam]);

  const endDate = useMemo(() => {
    if (endDateParam) {
      const parsed = moment(endDateParam);
      if (parsed.isValid()) return parsed.toDate();
    }
    return moment().toDate();
  }, [endDateParam]);

  useEffect(() => {
    fetchOperators().then((ops) => {
      if (ops) setOperators(ops);
    });
  }, []);

  useEffect(() => {
    if (!token || !municipalityCode || !formFactorCode || !operatorCode) return;

    const fetchKpiData = async () => {
      setLoading(true);
      setError(null);
      try {
        const params = {
          start_date: moment(startDate).format('YYYY-MM-DD'),
          end_date: moment(endDate).format('YYYY-MM-DD'),
          municipality: municipalityCode,
          form_factor: formFactorCode,
          system_id: operatorCode,
        };
        const data = await getKpiOverviewOperators(token, params);
        setKpiData(data);
      } catch (err: any) {
        console.error('Error fetching KPI data:', err);
        setError(err.message || 'Failed to fetch KPI data');
      } finally {
        setLoading(false);
      }
    };

    fetchKpiData();
  }, [token, municipalityCode, formFactorCode, operatorCode, startDate, endDate]);

  const municipality = municipalityCode
    ? gebieden.find((g: any) => g.gm_code === municipalityCode)
    : null;
  const municipalityName = municipality?.name || municipalityCode || 'onbekende gemeente';

  const operator = operatorCode ? operators.find((op) => op.system_id === operatorCode) : null;
  const realOperatorName = operator?.name || operatorCode || 'onbekende aanbieder';
  const operatorName = getDisplayOperatorName(operatorCode || '', realOperatorName, isDemoMode());

  const formFactorName = formFactorCode
    ? getPrettyVehicleTypeName(formFactorCode) || formFactorCode
    : 'onbekend voertuigtype';

  const providerColor = getDisplayProviderColor(
    operatorCode || '',
    getProviderColorForProvider(operatorCode || ''),
    isDemoMode()
  );
  const vehicleIconUrl = formFactorCode ? getVehicleIconUrl(formFactorCode) : null;

  const dateRange = useMemo(() => {
    try {
      if (!startDate || !endDate || isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
        return [];
      }
      if (startDate > endDate) return [];

      const dates: number[] = [];
      const current = moment(startDate);
      const end = moment(endDate);
      const maxDays = 365;
      let dayCount = 0;

      while (current.isSameOrBefore(end, 'day') && dayCount < maxDays) {
        const timestamp = current.valueOf();
        if (isFinite(timestamp) && timestamp > 0) dates.push(timestamp);
        current.add(1, 'day');
        dayCount++;
      }
      return dates;
    } catch (error) {
      console.error('Error generating date range:', error);
      return [];
    }
  }, [startDate, endDate]);

  const [chartsData, setChartsData] = useState<Array<{ title: string; series: LineChartData[]; unit?: string }>>([]);

  useEffect(() => {
    if (!kpiData || !dateRange || dateRange.length === 0) {
      setChartsData([]);
      return;
    }

    const validDateRange = dateRange.filter(
      (date) => typeof date === 'number' && isFinite(date) && date > 0
    );
    if (validDateRange.length === 0) {
      setChartsData([]);
      return;
    }

    const performanceIndicators = kpiData?.performance_indicator_description || [];
    const operatorData = kpiData?.municipality_modality_operators?.[0];
    const kpiValues = operatorData?.kpis || [];

    if (performanceIndicators.length === 0) {
      setChartsData([]);
      return;
    }

    const kpiValuesMap = new Map<
      string,
      Array<{ date: string; measured: number; threshold?: number }>
    >();
    kpiValues.forEach((kpi: any) => {
      if (kpi.kpi_key && kpi.values) kpiValuesMap.set(kpi.kpi_key, kpi.values);
    });

    const newChartsData = performanceIndicators.map((indicator: any) => {
      const { kpi_key, title, unit } = indicator;
      const values = kpiValuesMap.get(kpi_key) || [];

      const valuesByDate = new Map<string, number>();
      const thresholdsByDate = new Map<string, number>();
      values.forEach((item: { date: string; measured: number; threshold?: number }) => {
        if (item.date) {
          if (item.measured !== undefined && item.measured !== null) {
            const measuredValue = applyDemoValueFactor(item.measured, kpi_key);
            valuesByDate.set(item.date, measuredValue);
          }
          if (item.threshold !== undefined && item.threshold !== null) {
            thresholdsByDate.set(item.date, item.threshold);
          }
        }
      });

      const measuredData = validDateRange.map((timestamp) => {
        const dateStr = moment(timestamp).format('YYYY-MM-DD');
        return valuesByDate.get(dateStr) ?? null;
      });

      const thresholdData = validDateRange.map((timestamp) => {
        const dateStr = moment(timestamp).format('YYYY-MM-DD');
        return thresholdsByDate.get(dateStr) ?? null;
      });

      const seriesData: [number, number][] = [];
      validDateRange.forEach((timestamp, index) => {
        const value = measuredData[index];
        if (value !== null && typeof value === 'number' && isFinite(value)) {
          seriesData.push([timestamp, value]);
        }
      });

      const thresholdSeriesData: [number, number][] = [];
      validDateRange.forEach((timestamp, index) => {
        const threshold = thresholdData[index];
        if (
          threshold !== null &&
          typeof threshold === 'number' &&
          isFinite(threshold)
        ) {
          thresholdSeriesData.push([timestamp, threshold]);
        }
      });

      const series: LineChartData[] = [
        {
          name: operatorName || 'Prestatie aanbieder',
          data: seriesData.length > 0 ? seriesData : [],
          dashArray: 0,
        },
      ];

      if (thresholdSeriesData.length > 0) {
        series.push({
          name: 'Drempelwaarde',
          data: thresholdSeriesData,
          dashArray: 5,
        });
      }

      return { title: title || kpi_key, series, unit };
    });

    setChartsData(newChartsData);
  }, [kpiData, dateRange, operatorName]);

  const updateQueryParam = (key: string, value: string | null) => {
    const searchParams = new URLSearchParams(window.location.search);
    if (!value) searchParams.delete(key);
    else searchParams.set(key, value);
    const url =
      window.location.protocol +
      '//' +
      window.location.host +
      window.location.pathname +
      (searchParams.toString() ? '?' : '') +
      searchParams.toString();
    if (window.history.replaceState) {
      window.history.replaceState({ path: url }, '', url);
      setUrlSearch(searchParams.toString() ? `?${searchParams.toString()}` : '');
    }
  };

  const handleSelectProvider = (provider: OperatorData) => {
    const searchParams = new URLSearchParams(window.location.search);
    searchParams.set('system_id', provider.system_id);
    searchParams.set('operator', provider.system_id);
    const url =
      window.location.protocol +
      '//' +
      window.location.host +
      window.location.pathname +
      (searchParams.toString() ? '?' : '') +
      searchParams.toString();
    if (window.history.replaceState) {
      window.history.replaceState({ path: url }, '', url);
      setUrlSearch(searchParams.toString() ? `?${searchParams.toString()}` : '');
    }
    setShowProviderModal(false);
  };

  const handleSelectVehicleType = (vehicleTypeId: string) => {
    updateQueryParam('form_factor', vehicleTypeId);
    setShowVehicleTypeModal(false);
  };

  const handleCancelModal = () => {
    setShowProviderModal(false);
    setShowVehicleTypeModal(false);
  };

  return (
    <div className="prestaties-aanbieders-details-panel">
      <div className="prestaties-aanbieders-details-panel__header">
        <div className="prestaties-aanbieders-details-panel__title">
          <ProviderLabel label={operatorName} color={providerColor} />
          {vehicleIconUrl && (
            <img
              src={vehicleIconUrl}
              alt=""
              className="prestaties-aanbieders-details-panel__vehicle-icon"
            />
          )}
        </div>
        <div className="prestaties-aanbieders-details-panel__actions">
          {onToggleFullscreen && (
            <button
              type="button"
              aria-label={isFullscreen ? 'Normaal weergave' : 'Volledig scherm'}
              title={isFullscreen ? 'Normaal weergave' : 'Volledig scherm'}
              className="prestaties-aanbieders-details-panel__fullscreen-btn"
              onClick={onToggleFullscreen}
            >
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M3 6V3h3M17 6V3h-3M3 14v3h3M17 14v3h-3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>
          )}
          {!isFullscreen && (
            <button
              type="button"
              aria-label="Sluiten"
              title="Sluiten"
              className="prestaties-aanbieders-details-panel__close-btn"
              onClick={onClose}
            >
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M15 5L5 15M5 5l10 10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>
          )}
        </div>
      </div>

      <p className="prestaties-aanbieders-details-panel__description">
        Hier zie je de data van gemeente {municipalityName}, specifiek over de{' '}
        <b>{getPluralFormFactorName(formFactorName)}</b> van <b>{operatorName}</b>.
      </p>

      {(!operatorCode || !formFactorCode) && (
        <div className="prestaties-aanbieders-details-panel__select-buttons">
          {!operatorCode && (
            <button className="prestaties-aanbieders-details-panel__select-btn" onClick={() => setShowProviderModal(true)}>
              Selecteer aanbieder
            </button>
          )}
          {!formFactorCode && (
            <button className="prestaties-aanbieders-details-panel__select-btn" onClick={() => setShowVehicleTypeModal(true)}>
              Selecteer voertuigtype
            </button>
          )}
        </div>
      )}

      {loading && <div className="prestaties-aanbieders-details-panel__loading">Laden...</div>}
      {error && <div className="prestaties-aanbieders-details-panel__error">Fout: {error}</div>}

      {operatorCode &&
        formFactorCode &&
        !loading &&
        !error &&
        chartsData.length > 0 &&
        dateRange.length > 0 && (
          <div className="prestaties-aanbieders-details-panel__charts">
            {chartsData.map((chart, index) => (
              <LineChart
                key={index}
                title={chart.title}
                series={chart.series}
                xAxisCategories={dateRange}
                height={250}
                colors={chart.series.length > 1 ? ['#15AEEF', '#6b7280'] : ['#15AEEF']}
                unit={chart.unit}
              />
            ))}
          </div>
        )}

      {showProviderModal && (
        <Modal
          isVisible={true}
          title="Selecteer aanbieder"
          button1Title=""
          button1Handler={() => {}}
          button2Title="Annuleren"
          button2Handler={handleCancelModal}
          hideModalHandler={handleCancelModal}
          config={{ maxWidth: '600px' }}
        >
          <SelectProviderDialog
            modality={null}
            availableProviders={operators}
            onSelect={handleSelectProvider}
            onCancel={handleCancelModal}
          />
        </Modal>
      )}

      {showVehicleTypeModal && (
        <Modal
          isVisible={true}
          title="Selecteer voertuigtype"
          button1Title=""
          button1Handler={() => {}}
          button2Title="Annuleren"
          button2Handler={handleCancelModal}
          hideModalHandler={handleCancelModal}
          config={{ maxWidth: '600px' }}
        >
          <SelectVehicleTypeDialog
            vehicleTypes={voertuigtypes}
            onSelect={handleSelectVehicleType}
            onCancel={handleCancelModal}
          />
        </Modal>
      )}
    </div>
  );
}

export default PrestatiesAanbiedersDetailsPanel;
