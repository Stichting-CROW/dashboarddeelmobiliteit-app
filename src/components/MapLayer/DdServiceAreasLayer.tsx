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

  const token = useSelector((state: StateType) => {
    if(state.authentication && state.authentication.user_data) {
      return state.authentication.user_data.token;
    }
    return null;
  });

  // onComponentLoad
  useEffect(() => {
    // Fetch service areas and store in state
    (async () => {
      const res = await fetchServiceAreas();
      setServiceAreas(res);
    })();

    // Fetch service areas history and store in state
    (async () => {
      const history = await fetchServiceAreasHistory();
      const history_filtered = keepOneEventPerDay(history); 
      setServiceAreasHistory(history_filtered);
    })();
  }, [
    filter.gebied
  ]);

  // onComponentUnLoad
  useEffect(() => {
    return () => {
      removeServiceAreasFromMap(map);
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

  // Load 'delta' if if version_id changes
  useEffect(() => {
    (async () => {
      const deltaResponse = await fetchServiceAreaDelta(searchParams.get('version'));
      removeServiceAreasFromMap(map);
      setServiceAreaDelta(deltaResponse);
    })();
  }, [
    searchParams.get('version')
  ]);

  // Do things if 'serviceAreas' change
  useEffect(() => {
    // Return if no service areas were found
    if(! serviceAreas || ! serviceAreas[0]) return;
    
    // Get the service area of the selected municipality
    const serviceAreasForMunicipality = serviceAreas.filter(x => x.municipality === filter.gebied).pop();

    // Return if no service areas were found for this municipality
    if(! serviceAreasForMunicipality) return;

    renderServiceAreas(map, serviceAreasForMunicipality.geometries);

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
    
    // Render service area delta
    renderServiceAreaDelta(map, serviceAreaDelta);

    // onComponentUnLoad
    return () => {
    };
  }, [
    serviceAreaDelta
  ]);

  // Function that gets service areas
  const fetchServiceAreas = async () => {
    const url = `https://mds.dashboarddeelmobiliteit.nl/public/service_area?municipalities=${filter.gebied}&operators=check`;
    const response = await fetch(url);
    const json = await response.json();

    return json;
  }

  // Function that gets service areas history
  const fetchServiceAreasHistory = async () => {
    const startDate = '2024-01-01';
    const endDate = '2024-12-31';

    const url = `https://mds.dashboarddeelmobiliteit.nl/public/service_area/history?municipalities=${filter.gebied}&operators=check&start_date=${startDate}&end_date=${endDate}`;
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
        <EventsTimeline changeHistory={serviceAreasHistory}></EventsTimeline>
      </div>
  </>
}

export default DdServiceAreasLayer;
