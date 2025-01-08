import { useRef, useEffect, useState, useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useSearchParams } from 'react-router-dom'
import EventsTimeline from '../EventsTimeline/EventsTimeline';

import {
  DISPLAYMODE_PARK,
  DISPLAYMODE_RENTALS,
} from '../../reducers/layers.js';

import {
  renderServiceAreas,
  removeServiceAreasFromMap,
} from '../Map/MapUtils/map.service_areas';

import {
  renderServiceAreaDelta,
  removeServiceAreaDeltaFromMap
} from '../Map/MapUtils/map.service_area_delta';

import {StateType} from '../../types/StateType.js';
import { setBackgroundLayer } from '../Map/MapUtils/map';
import { setMapStyle } from '../../actions/layers';
import { ServiceAreaHistoryEvent } from '@/src/types/ServiceAreaHistoryEvent';
import moment from 'moment';

const DdServiceAreasLayer = ({
  map
}): JSX.Element => {
  const [serviceAreas, setServiceAreas] = useState([]);
  const [serviceAreasHistory, setServiceAreasHistory] = useState([]);
  const [serviceAreaDelta, setServiceAreaDelta] = useState([]);
  const [searchParams, setSearchParams] = useSearchParams();

  const dispatch = useDispatch()

  const displayMode = useSelector((state: StateType) => state.layers ? state.layers.displaymode : DISPLAYMODE_PARK);
  const isrentals=displayMode===DISPLAYMODE_RENTALS;
  const viewRentals = useSelector((state: StateType) => state.layers ? state.layers.view_rentals : null);
  const is_hb_view=(isrentals && viewRentals==='verhuurdata-hb');
  const filter = useSelector((state: StateType) => state.filter || null);
  const stateLayers = useSelector((state: StateType) => state.layers || null);
  const visible_operators = useSelector((state: StateType) => state.service_areas ? state.service_areas.visible_operators : null);

  const token = useSelector((state: StateType) => {
    if(state.authentication && state.authentication.user_data) {
      return state.authentication.user_data.token;
    }
    return null;
  });

  // If municipality or visible_operators change, remove version from search params
  useEffect(() => {
    // Remove 
    searchParams.delete('version');
    setSearchParams(searchParams);

    // Remove old service areas and deltas
    removeServiceAreasFromMap(map);
    removeServiceAreaDeltaFromMap(map);

    // Load new service areas
    loadServiceAreas(visible_operators);
  }, [
    filter.gebied,
    visible_operators
  ]);

  // onComponentUnLoad
  useEffect(() => {
    return () => {
      removeServiceAreasFromMap(map);
      removeServiceAreaDeltaFromMap(map);
    };
  }, [
  ]);

  // On component load: Set background layer to 'base layer'
  useEffect(() => {
    if(! map) return;
    if(! map.U) return;

    setBackgroundLayer(map, 'base', setMapStyle);
  }, [
    map,
    map?.U,
    document.location.pathname
  ]);

  // Load 'delta' if version_id or visible_operators changes
  useEffect(() => {
    if(! searchParams.get('version')) return;

    loadServiceAreaDeltas(visible_operators);
  }, [
    searchParams.get('version'),
  ]);

  // Do things if 'serviceAreas' change
  useEffect(() => {
    // Return if no service areas were found
    if(! serviceAreas || ! serviceAreas[0]) return;
    
    // Get the service area of the selected municipality
    const serviceAreasForMunicipality = serviceAreas.filter(x => x.municipality === filter.gebied).pop();

    // Return if no service areas were found for this municipality
    if(! serviceAreasForMunicipality) {
      console.log('no service areas for municipality');
      return;
    }

    renderServiceAreas(map, visible_operators[0], serviceAreasForMunicipality.geometries);

    // onComponentUnLoad
    return () => {

    };
  }, [
    serviceAreas
  ]);

  // Do things if 'serviceAreaDelta' change
  useEffect(() => {
    // Return if no service areas were found
    if(! serviceAreaDelta || serviceAreaDelta.length === 0) return;

    // Remove old service area delta
    removeServiceAreasFromMap(map);

    // Render service area delta
    renderServiceAreaDelta(map, serviceAreaDelta);

    // onComponentUnLoad
    return () => {
    };
  }, [
    serviceAreaDelta,
    serviceAreaDelta.length
  ]);

  const loadServiceAreas = async (visible_operators: string[]) => {
    // Fetch service areas and store in state
    (async () => {
      const res = await fetchServiceAreas(visible_operators);
      setServiceAreas(res);
    })();

    // Fetch service areas history and store in state
    (async () => {
      const history = await fetchServiceAreasHistory(visible_operators);
      const history_filtered = keepOneEventPerDay(history); 
      setServiceAreasHistory(history_filtered);
    })();
  }

  const loadServiceAreaDeltas = async (visible_operators: string[]) => {
    (async () => {
      const deltaResponse = await fetchServiceAreaDelta(searchParams.get('version'));
      setServiceAreaDelta(deltaResponse);
    })();
  }

  // Function that gets service areas
  const fetchServiceAreas = async (visible_operators: string[]) => {
    const operatorsString = visible_operators.map(x => x.toLowerCase().replace(' ', '')).join(',');

    const url = `https://mds.dashboarddeelmobiliteit.nl/public/service_area?municipalities=${filter.gebied}&operators=${operatorsString}`;
    const response = await fetch(url);
    const json = await response.json();

    return json;
  }

  // Function that gets service areas history
  const fetchServiceAreasHistory = async (visible_operators: string[]) => {
    const startDate = '2024-10-01';
    const endDate = moment().format('YYYY-MM-DD');

    const operatorsString = visible_operators?.map(x => x.toLowerCase().replace(' ', '')).join(',');

    const url = `https://mds.dashboarddeelmobiliteit.nl/public/service_area/history?municipalities=${filter.gebied}&operators=${operatorsString}&start_date=${startDate}&end_date=${endDate}`;
    const response = await fetch(url);
    const json: ServiceAreaHistoryEvent[] = await response.json();

    return json;
  }

  // Function that gets one specific version with its changes
  const fetchServiceAreaDelta = async (service_area_version_id) => {
    const url = `https://mds.dashboarddeelmobiliteit.nl/public/service_area/delta/${service_area_version_id}`;
    const response = await fetch(url);
    const json = await response.json();

    return json;
  }

  const keepOneEventPerDay = (full_history: ServiceAreaHistoryEvent[]) => {
    // Create a map to store one event per day
    const eventsByDay = new Map<string, ServiceAreaHistoryEvent>();
    
    // Sort events by valid_from date to ensure we process oldest first
    const sortedHistory = [...full_history].sort((a, b) => 
      new Date(a.valid_from).getTime() - new Date(b.valid_from).getTime()
    );

    // For each event, store only the newest event per day based on valid_from date
    sortedHistory.forEach(event => {
      const dateKey = new Date(event.valid_from).toISOString().split('T')[0];
      if (!eventsByDay.has(dateKey) || new Date(event.valid_from) > new Date(eventsByDay.get(dateKey).valid_from)) {
        eventsByDay.set(dateKey, event);
      }
    });

    // Convert map values back to array
    return Array.from(eventsByDay.values());
  }

  return <>
    <div style={{
      position: 'fixed',
      bottom: '100px',
      left: '360px'
    }}>
      {serviceAreasHistory.length >= 2 && <EventsTimeline changeHistory={serviceAreasHistory}></EventsTimeline>}
    </div>
  </>
}

export default DdServiceAreasLayer;
