import React, {useEffect, useMemo} from 'react'; // , {useEffect, useState }
import './StatsPage.css'

import {
  useDispatch,
  useSelector
} from 'react-redux';

import moment from 'moment';

import {StateType} from '../types/StateType';

import {
  doShowDetailledAggregatedData,
  didSelectAtLeastOneCustomZone,
  getAllowedAggregationLevels,
  getValidAggregationLevel
} from '../helpers/stats/index';

import VerhuringenChart from '../components/Chart/VerhuringenChart';
import BeschikbareVoertuigenChart from '../components/Chart/BeschikbareVoertuigenChart';
import VerhuringenPerVoertuigChart from '../components/Chart/VerhuringenPerVoertuigChart';
import FormInput from '../components/FormInput/FormInput';
import TimeGridVehicleAvailability from '../components/TimeGrid/TimeGrid_VehicleAvailability';
import StatsPageHeader from '../components/Stats/StatsPageHeader';
import StatsKpiRow from '../components/Stats/StatsKpiRow';

function StatsPage(props) {
  const dispatch = useDispatch()

  const filter = useSelector((state: StateType) => state.filter);

  const zones = useSelector((state: StateType) => {
    return (state.metadata && state.metadata.zones) ? state.metadata.zones : [];
  });

  const filterZones = useSelector((state: StateType) => {
    return state.filter ? state.filter.zones : 0;
  });

  const gebieden = useSelector((state: StateType) => state.metadata?.gebieden)

  const setAggregationLevel = (newlevel) => {
    dispatch({
      type: 'SET_FILTER_ONTWIKKELING_AGGREGATIE',
      payload: newlevel
    })
  }

  // Function that chooses a preferred default aggregation level
  const decideOnAggregationLevel = (userDidSelectCustomZone) => {
    // Default aggragation level
    let agg = null;
    // Count days
    const daysInSelectedPeriod = moment(filter.ontwikkelingtot).diff(moment(filter.ontwikkelingvan), 'days');
    // If custom zone: prefer a fine-grained level for short periods
    if(userDidSelectCustomZone) {
      if(daysInSelectedPeriod <= 2) agg = '15m';
      else if(daysInSelectedPeriod <= 5) agg = 'hour';
    }
    return agg;
  }

  // The aggregation level that is valid for the current filter. If the
  // (persisted) level in the store is not valid for this selection, e.g.
  // `15m` while looking at a whole municipality, the charts would request
  // data the API rejects (HTTP 400) and then refetch once corrected. We
  // therefore compute the valid level synchronously and only render the
  // charts once the store matches it.
  const validAggregationLevel = getValidAggregationLevel(filter, zones);
  const isAggregationLevelValid = validAggregationLevel === filter.ontwikkelingaggregatie;

  // Monitor if selected zones or period change: pick a preferred level
  useEffect(() => {
    const showDetailed = doShowDetailledAggregatedData(filter, zones);
    const preferred = decideOnAggregationLevel(showDetailed);
    if(preferred && preferred !== filter.ontwikkelingaggregatie) {
      setAggregationLevel(preferred);
    }
  }, [filterZones, filter.ontwikkelingvan, filter.ontwikkelingtot])

  // Correct an invalid aggregation level (e.g. persisted from another selection)
  useEffect(() => {
    if(! isAggregationLevelValid) {
      setAggregationLevel(validAggregationLevel);
    }
  }, [isAggregationLevelValid, validAggregationLevel])

  const setAggregationTime = (newtime) => {
    dispatch({
      type: 'SET_FILTER_ONTWIKKELING_AGGREGATIE_TIJD',
      payload: newtime
    })
  }

  const setAggregationFunction = (value) => {
    dispatch({
      type: 'SET_FILTER_ONTWIKKELING_AGGREGATIE_FUNCTION',
      payload: value
    })
  }

  const renderTimeControl = () => {
    return  (
      <div className="StatsPage-time-selection flex justify-center flex-col">
        <FormInput
          name="time"
          type="time"
          value={filter.ontwikkelingaggregatie_tijd}
          onChange={(e) => {
            setAggregationTime(e.target.value)
          }}
        />
      </div>
    )
  }

  const getPageTitle = useMemo(() => {
    if(filterZones) {
      const zoneIds = filterZones.split(',').map(id => parseInt(id));
      const zoneObjects = zones.filter(zone => zoneIds.includes(zone.zone_id));
      return zoneObjects?.map(zone => zone.name).join(', ');
    }
      
    if(filter.gebied) {
      const gebied = gebieden.find(gebied => gebied.gm_code === filter.gebied);
      return gebied?.name;
    }
    return 'Ontwikkeling';
  }, [filterZones, filter.gebied, zones, gebieden]);

  const aggregationButtonsToRender = getAllowedAggregationLevels(filter, zones);
  const selectedZoneCount = filterZones ? filterZones.split(',').filter(Boolean).length : 0;

  // {filter.ontwikkelingaggregatie === 'day' ? renderTimeControl() : ''}
  // {filter.ontwikkelingaggregatie === 'day' ? renderTimeControl() : ''}
  return (
    <div className="StatsPage pt-4 pb-24">

      {/* Title is the area currently selected (gebied or zones), with the
          period as subtitle and the aggregation level control on the right */}
      <StatsPageHeader
        title={getPageTitle}
        startDate={filter.ontwikkelingvan}
        endDate={filter.ontwikkelingtot}
        zoneCount={selectedZoneCount}
        aggregationLevels={aggregationButtonsToRender}
        activeAggregationLevel={filter.ontwikkelingaggregatie}
        onChangeAggregationLevel={setAggregationLevel}
      />

      {/* Only mount the charts once the aggregation level is valid for this
          selection, so they never fetch with a level the API rejects */}
      {isAggregationLevelValid && (<>
        {/* Headline numbers for the period, compared with the previous period */}
        <StatsKpiRow />

        <div className="StatsPage-chart-grid">
          <BeschikbareVoertuigenChart
            filter={filter}
            config={{
              showLegend: true
            }}
            title="Beschikbare voertuigen"
          />
          <VerhuringenChart
            title="Verhuringen"
          />
          <VerhuringenPerVoertuigChart title="Verhuringen per voertuig" />
        </div>

        <div className="xl:flex">
          {doShowDetailledAggregatedData(filter, zones) && (<div className="my-16 xl:flex-1">
            <h2 className="text-4xl my-2">
              Gemiddelde bezetting
            </h2>
            <div className="my-8 mr-8 ml-16 max-w-3xl">
              <TimeGridVehicleAvailability />
            </div>
          </div>)}
          <div className="flex-1" />
        </div>
      </>)}

    </div>
  )
}

export default StatsPage;
