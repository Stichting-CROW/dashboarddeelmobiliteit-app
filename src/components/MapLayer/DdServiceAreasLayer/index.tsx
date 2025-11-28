import { useRef, useEffect, useState, useCallback, useMemo } from 'react';
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
  removeServiceAreaDeltaFromMap,
  updateLayerFilters
} from '../../Map/MapUtils/map.service_area_delta';

import {StateType} from '../../../types/StateType.js';
import { setBackgroundLayer } from '../../Map/MapUtils/map';
import { setMapStyle } from '../../../actions/layers';
import { ServiceAreaDelta } from '../../../types/ServiceAreaDelta';
import moment from 'moment';
import { loadServiceAreas, loadServiceAreasHistory, loadServiceAreaDeltas } from '../../../helpers/service-areas';
import { useBackgroundLayer } from '../../Map/MapUtils/useBackgroundLayer';

import { Legend, LegendItemType } from './Legend';
import { ArrowLeftIcon, ArrowRightIcon } from '@radix-ui/react-icons';

const DdServiceAreasLayer = ({
  map
}): JSX.Element => {
  const { setLayer } = useBackgroundLayer(map);
  const hasInitialized = useRef(false);

  const [serviceAreas, setServiceAreas] = useState([]);
  const [serviceAreasHistory, setServiceAreasHistory] = useState([]);
  const [serviceAreaDelta, setServiceAreaDelta] = useState<ServiceAreaDelta | null>(null);
  const [activeTypes, setActiveTypes] = useState<Set<LegendItemType>>(
    new Set(['added', 'unchanged', 'removed'] as LegendItemType[])
  );
  const [isLoading, setIsLoading] = useState(false);
  const [searchParams, setSearchParams] = useSearchParams();

  const dispatch = useDispatch()

  const filter = useSelector((state: StateType) => state.filter || null);
  const visible_operators = useSelector((state: StateType) => state.service_areas ? state.service_areas.visible_operators : null);
  const isFilterbarOpen = useSelector((state: StateType) => state.ui && state.ui.FILTERBAR || false);
  const stateLayers = useSelector((state: StateType) => state.layers || null);

  // On component load: Set background layer to 'base layer' only on initial load
  useEffect(() => {
    if(! map) return;
    if(! map.U) return;
    if(hasInitialized.current) return; // Only run once

    // Set to 'base' on initial load
    setLayer('base');
    hasInitialized.current = true;
  }, [
    map,
    map?.U,
    setLayer
  ]);


  // If municipality or visible_operators change, remove version from search params
  useEffect(() => {
    if (!map || !filter?.gebied || !visible_operators || visible_operators.length === 0) return;

    // Remove version from search params
    if (searchParams.get('version')) {
      const newParams = new URLSearchParams(searchParams);
      newParams.delete('version');
      setSearchParams(newParams);
    }

    // Remove old service areas and deltas
    removeServiceAreasFromMap(map);
    removeServiceAreaDeltaFromMap(map);

    // Load service areas and history in parallel for better performance
    setIsLoading(true);
    Promise.all([
      loadServiceAreas(filter.gebied, visible_operators),
      loadServiceAreasHistory(filter.gebied, visible_operators)
    ])
      .then(([service_areas, service_area_history]) => {
        setServiceAreas(service_areas);
        setServiceAreasHistory(service_area_history);
      })
      .catch((error) => {
        console.error('Error loading service areas:', error);
      })
      .finally(() => {
        setIsLoading(false);
      });

  }, [
    map,
    filter?.gebied,
    visible_operators
  ]);

  // Cleanup on component unmount
  useEffect(() => {
    return () => {
      if (map) {
        removeServiceAreasFromMap(map);
        removeServiceAreaDeltaFromMap(map);
      }
    };
  }, [map]);

  // On component load: Set background layer to 'base layer' only if not already set
  useEffect(() => {
    if(! map) return;
    if(! map.U) return;

    // Only set to 'base' if the current map style is not already 'base'
    // and only on initial load, not when map style changes
    if (stateLayers.map_style !== 'base') {
      const defaultLayerName = 'base';
      setBackgroundLayer(map, defaultLayerName, () => {
        dispatch(setMapStyle(defaultLayerName))
      });
    }
  }, [
    map,
    map?.U,
    document.location.pathname
    // Removed stateLayers.map_style from dependencies to prevent reverting when user changes background layer
  ]);

  // Memoize version string to avoid unnecessary re-renders
  const versionParam = useMemo(() => searchParams.get('version'), [searchParams]);

  // Load 'delta' if version_id changes
  useEffect(() => {
    if (!versionParam || !map || !visible_operators || visible_operators.length === 0) {
      setServiceAreaDelta(null);
      return;
    }

    setIsLoading(true);
    loadServiceAreaDeltas(visible_operators, searchParams)
      .then((response) => {
        setServiceAreaDelta(response);
      })
      .catch((error) => {
        console.error('Error loading service area delta:', error);
        setServiceAreaDelta(null);
      })
      .finally(() => {
        setIsLoading(false);
      });

  }, [
    versionParam,
    map,
    visible_operators,
    searchParams
  ]);

  // Memoize the service area for the current municipality to avoid unnecessary filtering
  const serviceAreaForMunicipality = useMemo(() => {
    if (!serviceAreas || serviceAreas.length === 0 || !filter?.gebied) return null;
    return serviceAreas.find(x => x.municipality === filter.gebied) || null;
  }, [serviceAreas, filter?.gebied]);

  // Do things if 'serviceAreas' change
  useEffect(() => {
    // Return if no service areas were found or map is not ready
    if (!map || !serviceAreaForMunicipality || !visible_operators || visible_operators.length === 0) {
      return;
    }

    // Only render if we're not showing a delta (delta takes precedence)
    if (!versionParam) {
      renderServiceAreas(map, visible_operators[0], serviceAreaForMunicipality.geometries);
    }

    // Cleanup function - only remove if component unmounts
    return () => {
      // Only cleanup if map still exists and we're not transitioning to delta view
      if (map && !versionParam) {
        removeServiceAreasFromMap(map);
      }
    };
  }, [
    map,
    serviceAreaForMunicipality,
    visible_operators,
    versionParam
  ]);

  // Do things if 'serviceAreaDelta' changes
  useEffect(() => {
    // Return if no service area delta or map is not ready
    if (!map || !serviceAreaDelta) {
      return;
    }

    // Remove old service areas when showing delta
    removeServiceAreasFromMap(map);

    // Render service area delta with active types filter
    renderServiceAreaDelta(map, serviceAreaDelta, activeTypes);

    // Cleanup on unmount
    return () => {
      removeServiceAreaDeltaFromMap(map);
    };
  }, [map, serviceAreaDelta, activeTypes]);

  // Update filters when activeTypes change (without recreating layers)
  useEffect(() => {
    if (!serviceAreaDelta || !map) return;
    
    // Check if layers exist
    const fillLayer = map.getLayer('service_area_delta-layer-fill');
    const borderLayer = map.getLayer('service_area_delta-layer-border');
    
    if (fillLayer && borderLayer) {
      // Layers exist, just update filters
      updateLayerFilters(map, activeTypes);
    }
  }, [activeTypes, serviceAreaDelta, map]);

  // Memoize version navigation helpers to avoid recalculating on every render
  const versionNavigation = useMemo(() => {
    const currentVersion = versionParam;
    const currentIndex = currentVersion 
      ? serviceAreasHistory.findIndex(x => x.service_area_version_id.toString() === currentVersion)
      : -1;

    return {
      currentIndex,
      hasPrevious: currentIndex > 0,
      hasNext: currentIndex >= 0 && currentIndex < serviceAreasHistory.length - 1,
      isAtLatest: currentIndex === -1 || currentIndex === serviceAreasHistory.length - 1
    };
  }, [versionParam, serviceAreasHistory]);

  const clickPreviousVersion = useCallback(() => {
    if (!serviceAreasHistory || serviceAreasHistory.length === 0) return;
    
    const { currentIndex } = versionNavigation;
    
    // If no version selected or at start, use second to latest version
    if (currentIndex === -1 || currentIndex === 0) {
      const secondToLast = serviceAreasHistory[serviceAreasHistory.length - 2];
      if (secondToLast) {
        setSearchParams({ version: secondToLast.service_area_version_id.toString() });
      }
      return;
    }
    
    // Go to previous version
    const previous = serviceAreasHistory[currentIndex - 1];
    if (previous) {
      setSearchParams({ version: previous.service_area_version_id.toString() });
    }
  }, [serviceAreasHistory, versionNavigation, setSearchParams]);

  const clickNextVersion = useCallback(() => {
    if (!serviceAreasHistory || serviceAreasHistory.length === 0) return;
    
    const { currentIndex, isAtLatest } = versionNavigation;
    
    // If at latest or no version selected, go to latest
    if (isAtLatest) {
      // Find latest service area version
      const latestServiceArea = serviceAreas.length > 0 ? serviceAreas[serviceAreas.length - 1] : null;
      if (latestServiceArea?.service_area_version_id) {
        setSearchParams({ version: latestServiceArea.service_area_version_id.toString() });
      }
      return;
    }
    
    // Go to next version
    const next = serviceAreasHistory[currentIndex + 1];
    if (next) {
      setSearchParams({ version: next.service_area_version_id.toString() });
    }
  }, [serviceAreas, serviceAreasHistory, versionNavigation, setSearchParams]);

  const doesHavePreviousVersion = useCallback(() => {
    return versionNavigation.hasPrevious;
  }, [versionNavigation]);

  const doesHaveNextVersion = useCallback(() => {
    return versionNavigation.hasNext || versionNavigation.isAtLatest;
  }, [versionNavigation]);

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
    {versionParam && <div className={`${isFilterbarOpen ? 'filter-open' : ''}`}>
      <CenterBottom>
        <InfoCard>
          <Legend onActiveTypesChange={setActiveTypes} />
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
