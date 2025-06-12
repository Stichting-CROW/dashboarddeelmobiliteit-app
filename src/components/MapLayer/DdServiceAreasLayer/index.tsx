import { useRef, useEffect, useState, useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useSearchParams } from 'react-router-dom'
import EventsTimeline from '../../EventsTimeline/EventsTimeline';
import { LeftTop } from '../widget-positions/LeftTop';
import { CenterBottom } from '../widget-positions/CenterBottom';
import { InfoCard } from '../widgets/InfoCard';
import { getPrettyProviderName, getProviderColorForProvider } from '../../../helpers/providers';

import {
  renderServiceAreas,
  removeServiceAreasFromMap,
} from '../../Map/MapUtils/map.service_areas';

import {
  renderServiceAreaDelta,
  removeServiceAreaDeltaFromMap
} from '../../Map/MapUtils/map.service_area_delta';

import {StateType} from '../../../types/StateType.js';
import { setBackgroundLayer } from '../../Map/MapUtils/map';
import { setMapStyle } from '../../../actions/layers';
import { ServiceAreaDelta } from '@/src/types/ServiceAreaDelta';
import moment from 'moment';
import { loadServiceAreas, loadServiceAreasHistory, loadServiceAreaDeltas } from '../../../helpers/service-areas';

import { Legend } from './Legend';
import { ArrowLeftIcon, ArrowRightIcon } from '@radix-ui/react-icons';

const DdServiceAreasLayer = ({
  map
}): JSX.Element => {
  const [serviceAreas, setServiceAreas] = useState([]);
  const [serviceAreasHistory, setServiceAreasHistory] = useState([]);
  const [serviceAreaDelta, setServiceAreaDelta] = useState<ServiceAreaDelta | null>(null);
  const [searchParams, setSearchParams] = useSearchParams();

  const dispatch = useDispatch()

  const filter = useSelector((state: StateType) => state.filter || null);
  const visible_operators = useSelector((state: StateType) => state.service_areas ? state.service_areas.visible_operators : null);
  const isFilterbarOpen = useSelector((state: StateType) => state.ui && state.ui.FILTERBAR || false);

  // If municipality or visible_operators change, remove version from search params
  useEffect(() => {
    // Remove 
    searchParams.delete('version');
    setSearchParams(searchParams);

    // Remove old service areas and deltas
    removeServiceAreasFromMap(map);
    removeServiceAreaDeltaFromMap(map);

    // Load new service areas
    (async () => {
      const service_areas = await loadServiceAreas(filter.gebied, visible_operators);
      setServiceAreas(service_areas);
    })();

    (async () => {
      const service_area_history = await loadServiceAreasHistory(filter.gebied, visible_operators);
      setServiceAreasHistory(service_area_history);
    })();

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

    (async () => {
      const response = await loadServiceAreaDeltas(visible_operators, searchParams);
      setServiceAreaDelta(response);
    })();

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
    if (!serviceAreaDelta) return;

    // Remove old service area delta
    removeServiceAreasFromMap(map);

    // Render service area delta
    renderServiceAreaDelta(map, serviceAreaDelta);

    // onComponentUnLoad
    return () => {
    };
  }, [serviceAreaDelta]);

  const clickPreviousVersion = () => {
    if (!serviceAreasHistory || serviceAreasHistory.length === 0) return;
    
    // Find current version index
    const currentVersion = searchParams.get('version');
    const currentIndex = serviceAreasHistory.findIndex(x => x.service_area_version_id.toString() === currentVersion);
    
    // If no version selected or at start, use one to latest version
    if (currentIndex === -1 || currentIndex === 0) {
      setSearchParams({ version: serviceAreasHistory[serviceAreasHistory.length - 2]?.service_area_version_id.toString() });
      return;
    }
    
    // Go to previous version
    setSearchParams({ version: serviceAreasHistory[currentIndex - 1]?.service_area_version_id.toString() });
  }

  const clickNextVersion = () => {
    if (!serviceAreasHistory || serviceAreasHistory.length === 0) return;
    
    // Find current version index
    const currentVersion = searchParams.get('version');
    const currentIndex = serviceAreasHistory.findIndex(x => x?.service_area_version_id.toString() === currentVersion);
    
    // If no historic version found, use latest version
    if (currentIndex === -1 || currentIndex === serviceAreasHistory.length - 1) {
      // Get version of latest service area
      const latestServiceArea = serviceAreas.pop();
      // If no latest service area, return
      if(! latestServiceArea) return;
      setSearchParams({ version: latestServiceArea?.service_area_version_id.toString() });
      return;
    }
    
    // Go to previous version
    setSearchParams({ version: serviceAreasHistory[currentIndex + 1]?.service_area_version_id.toString() });
  }

  const doesHavePreviousVersion = () => !searchParams.get('version') || (serviceAreasHistory && serviceAreasHistory.length > 0 && searchParams.get('version') && serviceAreasHistory.findIndex(x => x.service_area_version_id.toString() === searchParams.get('version')) > 0);
  const doesHaveNextVersion = () => serviceAreasHistory && serviceAreasHistory.length > 0 && searchParams.get('version') && serviceAreasHistory.findIndex(x => x.service_area_version_id.toString() === searchParams.get('version')) < serviceAreasHistory.length - 1;

  return <>
    {/* LeftTop InfoCard */}
    {visible_operators && visible_operators.length > 0 && <div className={`${isFilterbarOpen ? 'filter-open' : ''}`}>
      <LeftTop>
        <InfoCard>
          <h1 className="text-base font-bold">
            Servicegebied van {getPrettyProviderName(visible_operators[0])}
          </h1>
          <p className="flex flex-row gap-2 items-center">
            {/* Arrow left */}
            <div style={{visibility: `${doesHavePreviousVersion() ? 'visible' : 'hidden'}`}}>
              <ArrowLeftIcon 
                className="w-4 h-4 cursor-pointer" 
                onClick={clickPreviousVersion}
              />
            </div>
            {moment(serviceAreaDelta ? serviceAreaDelta.timestamp : moment()).format('DD-MM-YYYY, HH:mm')}
            {/* Arrow right */}
            <div style={{visibility: `${doesHaveNextVersion() ? 'visible' : 'hidden'}`}}>
              <ArrowRightIcon
                className="w-4 h-4 cursor-pointer"
                onClick={clickNextVersion}
              />
            </div>
          </p>
        </InfoCard>
      </LeftTop>
    </div>}

    {/* CenterBottom InfoCard */}
    {searchParams.get('version') && <div className={`${isFilterbarOpen ? 'filter-open' : ''}`}>
      <CenterBottom>
        <InfoCard>
          <Legend />
        </InfoCard>
      </CenterBottom>
    </div>}

    {false && <div style={{
      position: 'fixed',
      bottom: '100px',
      left: '360px'
    }}>
      {/* EventsTimeline */}
      {serviceAreasHistory.length >= 2 && 
        <EventsTimeline changeHistory={serviceAreasHistory}></EventsTimeline>
      }
      </div>}
  </>
}

export default DdServiceAreasLayer;
