import React, { useEffect, useMemo, useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import moment from 'moment';

import { StateType } from '../../types/StateType';
import {
  doShowDetailledAggregatedData,
  didSelectAtLeastOneCustomZone
} from '../../helpers/stats/index';
import { getZoneById } from '../../components/Map/MapUtils/zones';
import { getBeleidszonesZonesForMetadata } from '../../api/beleidszones';

import VerhuringenChart from '../../components/Chart/VerhuringenChart';
import BeschikbareVoertuigenChart from '../../components/Chart/BeschikbareVoertuigenChart';
import VerhuringenPerVoertuigChart from '../../components/Chart/VerhuringenPerVoertuigChart';
import TimeGrid_VehicleAvailability from '../../components/TimeGrid/TimeGrid_VehicleAvailability';
import InfoTooltip from '../../components/InfoTooltip/InfoTooltip';
import PageTitle from '../../components/common/PageTitle';
import ZonePreviewMap from '../../components/ZonePreviewMap/ZonePreviewMap';

import '../../pages/StatsPage.css';

/** Get zone that was replaced by this one (has this zone's geography_id in prev_geographies). */
const getCurrentVersionOf = (
  zones: { zone_id?: number; geography_id?: string; prev_geographies?: string[] }[],
  zone: { geography_id?: string } | undefined
): { zone_id?: number; name?: string; effective_date?: string } | undefined => {
  if (!zones?.length || !zone?.geography_id) return undefined;
  return zones.find(
    (z) => Array.isArray(z.prev_geographies) && z.prev_geographies.includes(zone.geography_id!)
  );
};

/** Get previous version zone (geography_id in this zone's prev_geographies). */
const getPreviousVersionOf = (
  zones: { zone_id?: number; geography_id?: string; prev_geographies?: string[] }[],
  zone: { prev_geographies?: string[] } | undefined
): { zone_id?: number; name?: string; effective_date?: string } | undefined => {
  if (!zones?.length || !zone?.prev_geographies?.[0]) return undefined;
  const prevGeoId = zone.prev_geographies[0];
  return zones.find((z) => z.geography_id === prevGeoId);
};

/** Zone from MDS with prev_geographies, effective_date, etc. */
interface MdsZone {
  zone_id?: number;
  geography_id?: string;
  prev_geographies?: string[];
  effective_date?: string;
  published_date?: string;
  modified_at?: string;
  name?: string;
}

function DashboardBeleidszones() {
  const dispatch = useDispatch();
  const filter = useSelector((state: StateType) => state.filter);

  const zones = useSelector((state: StateType) =>
    state.metadata && state.metadata.zones ? state.metadata.zones : []
  );

  const [mdsZones, setMdsZones] = useState<MdsZone[]>([]);

  const filterZones = useSelector((state: StateType) =>
    state.filter ? state.filter.zones : null
  );

  const gebieden = useSelector((state: StateType) => state.metadata?.gebieden);

  const hasSelectedBeleidszone = didSelectAtLeastOneCustomZone(filter, zones);

  // Fetch zones from MDS for zone metadata (prev_geographies, effective_date)
  useEffect(() => {
    if (!hasSelectedBeleidszone || !filter?.gebied) {
      setMdsZones([]);
      return;
    }
    const fetchZones = async () => {
      try {
        const zonesList = await getBeleidszonesZonesForMetadata(filter.gebied);
        setMdsZones(zonesList ?? []);
      } catch {
        setMdsZones([]);
      }
    };
    fetchZones();
  }, [hasSelectedBeleidszone, filter?.gebied]);

  const setAggregationLevel = (newlevel: string) => {
    dispatch({
      type: 'SET_FILTER_ONTWIKKELING_AGGREGATIE',
      payload: newlevel
    });
  };

  const decideOnAggregationLevel = (userDidSelectCustomZone: boolean) => {
    let agg: string | null = null;
    const daysInSelectedPeriod = moment(filter.ontwikkelingtot).diff(
      moment(filter.ontwikkelingvan),
      'days'
    );
    if (userDidSelectCustomZone) {
      if (daysInSelectedPeriod <= 1 && false) agg = '5m';
      else if (daysInSelectedPeriod <= 2) agg = '15m';
      else if (daysInSelectedPeriod <= 5) agg = 'hour';
    } else {
      const availableAggLevels = ['day', 'week', 'month'];
      if (availableAggLevels.indexOf(filter.ontwikkelingaggregatie) <= -1) {
        agg = 'day';
      }
    }
    return agg;
  };

  useEffect(() => {
    const userDidSelectCustomZone = didSelectAtLeastOneCustomZone(filter, zones);
    const agg = decideOnAggregationLevel(userDidSelectCustomZone);
    if (agg) setAggregationLevel(agg);
  }, [filterZones, filter.ontwikkelingvan, filter.ontwikkelingtot]);

  const daysInSelectedPeriod = moment(filter.ontwikkelingtot).diff(
    moment(filter.ontwikkelingvan),
    'days'
  );

  const getAggregationButtonsToRender = () => {
    const ret: Array<{ name: string; title: string }> = [];
    if (doShowDetailledAggregatedData(filter, zones)) {
      const doShow5m = daysInSelectedPeriod <= 1;
      const doShow15m = daysInSelectedPeriod <= 2;
      const doShowHour = daysInSelectedPeriod <= 10;

      if (doShow5m) ret.push({ name: '5m', title: '5 min' });
      if (doShow15m) ret.push({ name: '15m', title: 'kwartier' });
      if (doShowHour) ret.push({ name: 'hour', title: 'uur' });
    }
    ret.push({ name: 'day', title: 'dag' });
    if (daysInSelectedPeriod >= 6) ret.push({ name: 'week', title: 'week' });
    if (daysInSelectedPeriod >= 27) ret.push({ name: 'month', title: 'maand' });
    return ret;
  };

  const getPageTitle = useMemo(() => {
    if (filterZones) {
      const zoneIds = filterZones.split(',').map((id) => parseInt(id.trim(), 10)).filter(Boolean);
      const zoneObjects = zones.filter((zone) => zoneIds.includes(zone.zone_id));
      return zoneObjects?.map((zone) => zone.name).join(', ') ?? '';
    }
    if (filter.gebied) {
      const gebied = gebieden?.find((g) => g.gm_code === filter.gebied);
      return gebied?.name ?? '';
    }
    return '';
  }, [filterZones, filter.gebied, zones, gebieden]);

  const selectedZoneIds =
    filterZones && typeof filterZones === 'string'
      ? filterZones
          .split(',')
          .map((id) => parseInt(id.trim(), 10))
          .filter(Boolean)
      : [];
  const hasExactlyOneZone = selectedZoneIds.length === 1;
  // Prefer MDS zones for metadata (prev_geographies, effective_date); fallback to metadata.zones
  const zonesForMetadata = mdsZones.length > 0 ? mdsZones : zones;
  const selectedZone = hasExactlyOneZone
    ? (getZoneById(zonesForMetadata as { zone_id?: number }[], selectedZoneIds[0]) as MdsZone | undefined)
    : undefined;
  const prevZone = getPreviousVersionOf(
    zonesForMetadata as { zone_id?: number; geography_id?: string; prev_geographies?: string[] }[],
    selectedZone
  );
  const currentZone = getCurrentVersionOf(
    zonesForMetadata as { zone_id?: number; geography_id?: string; prev_geographies?: string[] }[],
    selectedZone
  );
  const isViewingPreviousVersion = Boolean(
    hasExactlyOneZone && selectedZone && currentZone
  );
  const displayedZoneDate =
    selectedZone?.effective_date || selectedZone?.published_date || selectedZone?.modified_at;
  const hasValidZoneDate =
    displayedZoneDate && moment(displayedZoneDate).isValid();

  const handleViewPreviousVersion = () => {
    if (prevZone?.zone_id) {
      dispatch({ type: 'SET_FILTER_ZONES', payload: String(prevZone.zone_id) });
    }
  };
  const handleViewCurrentVersion = () => {
    if (currentZone?.zone_id) {
      dispatch({ type: 'SET_FILTER_ZONES', payload: String(currentZone.zone_id) });
    }
  };

  const aggregationButtonsToRender = getAggregationButtonsToRender();

  const renderAggregationButton = (name: string, title: string) => (
    <div
      key={`agg-level-${name}`}
      className={
        'agg-button ' +
        (filter.ontwikkelingaggregatie === name ? ' agg-button-active' : '')
      }
      onClick={() => setAggregationLevel(name)}
    >
      {title}
    </div>
  );

  if (!hasSelectedBeleidszone) {
    return (
      <div className="DashboardBeleidszones StatsPage pt-12 pb-24">
        <PageTitle className="my-2">Beleidszones</PageTitle>
        <div className="max-w-2xl mx-16 my-12 p-6 bg-orange-50 border border-orange-200 rounded-lg text-gray-700">
          <p className="text-lg font-medium mb-2">
            Selecteer minimaal 1 beleidszone
          </p>
          <p>
            Kies minimaal 1 beleidszone in het filter om de statistieken te bekijken.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="DashboardBeleidszones StatsPage pt-4 pb-24">
      <div className="agg-button-container mb-8">
        {aggregationButtonsToRender.map((x) =>
          renderAggregationButton(x.name, x.title)
        )}
        {aggregationButtonsToRender.length > 0 && (
          <InfoTooltip className="mx-2 inline-block">
            Toon de data in intervallen van{' '}
            {aggregationButtonsToRender.map((x) => x.title).join(' / ')}. Je
            bekijkt nu{' '}
            {aggregationButtonsToRender
              .filter((x) => filter.ontwikkelingaggregatie === x.name)
              .pop()?.title}
            -niveau.
          </InfoTooltip>
        )}
      </div>

      <PageTitle className="my-2">{getPageTitle}</PageTitle>

      <div className="my-4 flex flex-wrap items-center gap-x-4 gap-y-1 text-gray-600">
        {hasExactlyOneZone && hasValidZoneDate && (
          <span>
            Zone actief vanaf{' '}
            {moment(displayedZoneDate).format('DD-MM-YYYY HH:mm')}
          </span>
        )}
        {hasExactlyOneZone && !isViewingPreviousVersion && prevZone && (
          <button
            type="button"
            onClick={handleViewPreviousVersion}
            className="text-blue-600 hover:text-blue-800 underline focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            Vorige versie
          </button>
        )}
        {isViewingPreviousVersion && currentZone && (
          <button
            type="button"
            onClick={handleViewCurrentVersion}
            className="text-blue-600 hover:text-blue-800 underline focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            Huidige versie
          </button>
        )}
      </div>

      <div style={{marginLeft: '58px'}}>
        <ZonePreviewMap className="my-4" />
      </div>

      <div className="xl:flex">
        <div className="xl:flex-1 mt-8 xl:mt-0">
          <BeschikbareVoertuigenChart
            filter={filter}
            config={{ showLegend: true }}
            title="Beschikbare voertuigen"
          />
        </div>
        <div className="xl:flex-1 mt-8 xl:mt-0">
          <VerhuringenChart title="Verhuringen" />
        </div>
      </div>

      <div className="xl:flex-1 mt-8">
        <VerhuringenPerVoertuigChart title="Verhuringen per voertuig" />
      </div>

      <div className="xl:flex">
        {doShowDetailledAggregatedData(filter, zones) && (
          <div className="my-16 xl:flex-1">
            <h2 className="text-4xl my-2">Gemiddelde bezetting</h2>
            <div className="my-8 mr-8 ml-16 max-w-3xl">
              <TimeGrid_VehicleAvailability />
            </div>
          </div>
        )}
        <div className="flex-1" />
      </div>
    </div>
  );
}

export default DashboardBeleidszones;
