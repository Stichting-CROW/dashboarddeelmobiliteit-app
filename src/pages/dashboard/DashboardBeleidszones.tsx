import React, { useEffect, useMemo } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import moment from 'moment';

import { StateType } from '../../types/StateType';
import {
  doShowDetailledAggregatedData,
  didSelectAtLeastOneCustomZone
} from '../../helpers/stats/index';

import VerhuringenChart from '../../components/Chart/VerhuringenChart';
import BeschikbareVoertuigenChart from '../../components/Chart/BeschikbareVoertuigenChart';
import VerhuringenPerVoertuigChart from '../../components/Chart/VerhuringenPerVoertuigChart';
import TimeGrid_VehicleAvailability from '../../components/TimeGrid/TimeGrid_VehicleAvailability';
import InfoTooltip from '../../components/InfoTooltip/InfoTooltip';
import PageTitle from '../../components/common/PageTitle';

import '../../pages/StatsPage.css';

function DashboardBeleidszones() {
  const dispatch = useDispatch();
  const filter = useSelector((state: StateType) => state.filter);

  const zones = useSelector((state: StateType) =>
    state.metadata && state.metadata.zones ? state.metadata.zones : []
  );

  const filterZones = useSelector((state: StateType) =>
    state.filter ? state.filter.zones : null
  );

  const gebieden = useSelector((state: StateType) => state.metadata?.gebieden);

  const hasSelectedBeleidszone = didSelectAtLeastOneCustomZone(filter, zones);

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
      const zoneIds = filterZones.split(',').map((id) => parseInt(id, 10));
      const zoneObjects = zones.filter((zone) => zoneIds.includes(zone.zone_id));
      return zoneObjects?.map((zone) => zone.name).join(', ') ?? '';
    }
    if (filter.gebied) {
      const gebied = gebieden?.find((g) => g.gm_code === filter.gebied);
      return gebied?.name ?? '';
    }
    return '';
  }, [filterZones, filter.gebied, zones, gebieden]);

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
