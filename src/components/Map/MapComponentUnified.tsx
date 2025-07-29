import { useRef, useEffect, useState, useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import maplibregl from 'maplibre-gl';
import moment from 'moment';
import 'moment/min/locales';
import {useLocation} from "react-router-dom";
import SearchBar from '../SearchBar/SearchBar';
import { RightTop } from '../MapLayer/widget-positions/RightTop';

import {StateType} from '../../types/StateType';
import { useUnifiedLayerManager } from '../../hooks/useUnifiedLayerManager';

// MapBox utils
import U from 'mapbox-gl-utils';
import {getMapStyles, applyMapStyle, setAdvancedBaseLayer} from './MapUtils/map.js';
import {initPopupLogic} from './MapUtils/popups.js';
import {initClusters} from './MapUtils/clusters.js';
import {addSources} from './MapUtils/sources.js';
import {
  navigateToGeography,
  triggerGeographyClick,
  fetchPublicZones,
  fetchAdminZones
} from './MapUtils/zones.js';
import {
  DISPLAYMODE_PARK,
  DISPLAYMODE_RENTALS,
  DISPLAYMODE_START,
  DISPLAYMODE_OTHER,
} from '../../reducers/layers.js';

import './MapComponent.css';

import {layers} from './layers';
import {sources} from './sources.js';
import {getVehicleMarkers, getVehicleMarkers_rentals} from './vehicle_marker.js';

import IsochroneTools from '../IsochroneTools/IsochroneTools';
import DdH3HexagonLayer from '../MapLayer/DdH3HexagonLayer';
import DdServiceAreasLayer from '../MapLayer/DdServiceAreasLayer';
import DdPolicyHubsLayer from '../MapLayer/DdPolicyHubsLayer';
import DdParkEventsLayer from '../MapLayer/DdParkEventsLayer';
import DdRentalsLayer from '../MapLayer/DdRentalsLayer';
import { SelectLayer } from '../SelectLayer/SelectLayer';

// Set language for momentJS
moment.updateLocale('nl', moment.locale);

interface MapComponentProps {
  mapContainer?: React.RefObject<HTMLDivElement>;
}

const MapComponentUnified = (props: MapComponentProps): JSX.Element => {
  const [pathName, setPathName] = useState(document.location.pathname);
  const [uriParams, setUriParams] = useState(document.location.search);

  // Use the unified layer manager
  const layerManager = useUnifiedLayerManager();

  // Expose unified layer manager globally for other components to use
  useEffect(() => {
    (window as any).__UNIFIED_LAYER_MANAGER__ = layerManager;
    
    return () => {
      delete (window as any).__UNIFIED_LAYER_MANAGER__;
    };
  }, [layerManager]);

  const displayMode = layerManager.getCurrentDisplayMode();

  const mapStyle = useSelector((state: StateType) => {
    return state.layers ? state.layers.map_style : 'base';
  });

  // Connect to redux store
  const dispatch = useDispatch()

  // Get data from store
  const vehicles = useSelector((state: StateType) => state.vehicles || null);
  const filter = useSelector((state: StateType) => state.filter || null);
  const rentals = useSelector((state: StateType) => state.rentals || null);
  const stateLayers = useSelector((state: StateType) => state.layers || null);
  const isLoggedIn = useSelector((state: StateType) => state.authentication.user_data ? true : false);
  const providers = useSelector((state: StateType) => (state.metadata && state.metadata.aanbieders) ? state.metadata.aanbieders : []);
  const extent/* map boundaries */ = useSelector((state: StateType) => state.layers ? state.layers.extent : null);
  const zones_geodata = useSelector((state: StateType) => {
    if(!state||!state.zones_geodata) {
      return null;
    }
    return state.zones_geodata;
  });
  const viewRentals = useSelector((state: StateType) => state.layers ? state.layers.view_rentals : null);
  const isrentals=displayMode===DISPLAYMODE_RENTALS;
  const lastReactivation = useSelector((state: StateType) => state.layers ? state.layers.last_reactivation : null);

  const internalMapContainer = useRef(null);
  const mapContainer = props.mapContainer || internalMapContainer;

  const [publicZones, setPublicZones] = useState(null);
  const [didMapLoad, setDidMapLoad] = useState(false);
  const [didMapDrawLoad, setDidMapDrawLoad] = useState(false);
  const [lng] = useState((stateLayers.mapextent && stateLayers.mapextent[0]) ? (stateLayers.mapextent[0] + stateLayers.mapextent[2]) / 2 : 4.4671854);
  const [lat] = useState((stateLayers.mapextent && stateLayers.mapextent[1]) ? (stateLayers.mapextent[1] + stateLayers.mapextent[3]) / 2 : 51.9250836);
  const [zoom] = useState(stateLayers.zoom || 15);
  const [didInitSourcesAndLayers, setDidInitSourcesAndLayers] = useState(false);
  const [didAddPublicZones, setDidAddPublicZones] = useState(false);
  const [didAddAdminZones, setDidAddAdminZones] = useState(false);
  const [activeLayers, setActiveLayers] = useState([]);
  const [hasAppliedMapStyle, setHasAppliedMapStyle] = useState(false);
  const [lastMapStyle, setLastMapStyle] = useState(mapStyle);
  let map = useRef(null);

  const userData = useSelector((state: StateType) => {
    return state.authentication.user_data;
  });

  // Store window location in a local variable
  let location = useLocation();
  useEffect(() => {
    setUriParams(location ? location.search : null);
  }, [location]);

  const applyMapSettings = (theMap) => {
    // Hide compass control
    theMap.addControl(new maplibregl.NavigationControl({
      showCompass: false
      // showZoom: false
    }), 'bottom-right');

    // Add 'current location' button
    theMap.addControl(
      new maplibregl.GeolocateControl({
        positionOptions: {
          enableHighAccuracy: true
        },
        trackUserLocation: true
      }), 'bottom-right'
    );

    // Disable rotating
    theMap.dragRotate.disable();
    theMap.touchZoomRotate.disableRotation();
  }

  // registerMapView :: Adds map center & zoom level to URL
  const registerMapView = useCallback(theMap => {
    const mapCenter = theMap.getCenter();
    const url = new URL(window.location.href);
    url.searchParams.set('lng', mapCenter.lng);
    url.searchParams.set('lat', mapCenter.lat);
    url.searchParams.set('zoom', theMap.getZoom());
    window.history.replaceState({}, '', url.toString());

    // Store bounds in redux store
    const bounds = theMap.getBounds();
    const payload = [
      bounds._sw.lng,
      bounds._sw.lat,
      bounds._ne.lng,
      bounds._ne.lat
    ];
    dispatch({ type: 'LAYER_SET_MAP_EXTENT', payload: payload })
    dispatch({ type: 'LAYER_SET_MAP_ZOOM', payload: theMap.getZoom() })
  }, []);

  // Init MapLibre map
  useEffect(() => {
    const initMap = () => {
      // Stop if map exists already
      if (map.current) return;

      const mapStyles = getMapStyles();

      map.current = new maplibregl.Map({
        container: mapContainer.current,
        // @ts-ignore
        style: mapStyles.base,
        accessToken: process ? process.env.REACT_APP_MAPBOX_TOKEN : '',
        center: [lng, lat],
        zoom: zoom,
        maxZoom: 21,
        attributionControl: false// Hide info icon
      });

      // Set map in unified layer manager
      layerManager.setMap(map.current);

      // Apply settings like disabling rotating the map
      applyMapSettings(map.current)

      // Init MapBox utils
      U.init(map.current, maplibregl);
      
      // Map event handlers
      map.current.on('error', function(e) {
        if(process && process.env.DEBUG) console.log('An error event occurred.', e);
        dispatch({type: 'SHOW_LOADING', payload: false});
      });
      map.current.on('idle', function(e) {
        if(process && process.env.DEBUG) console.log('An idle event occurred.', e);
        dispatch({type: 'SHOW_LOADING', payload: false});
      });

      map.current.on('moveend', function() {
        registerMapView(map.current);
      })
      map.current.on('zoomend', function() {
        registerMapView(map.current);
      })

      // Do a state update if map is loaded
      map.current.on('load', function() {

        // Store map in a global variable
        window['ddMap'] = map.current;

        // Set map in context if available (for backward compatibility)
        if ((window as any).__MAP_CONTEXT__ && (window as any).__MAP_CONTEXT__.setMap) {
          (window as any).__MAP_CONTEXT__.setMap(map.current);
        }

        setDidMapLoad(true)

        addSources(map.current);

        setDidInitSourcesAndLayers(true);

        // Add cross image to use for retirement hubs
        map.current.loadImage('https://cdn0.iconfinder.com/data/icons/blueberry/32/delete.png', (err, image) => {
          if(err) throw err;
          map.current.addImage('pattern', image);
        });

        // Add 'Mijksenaar' hub logo for Beleidshubs, if zoomed out
        map.current.loadImage('https://dashboarddeelmobiliteit.nl/components/MapComponent/hub-icon-mijksenaar.png', (err, image) => {
          if(err) throw err;
          map.current.addImage('hub-icon-mijksenaar', image);
        });
      });

      // Disable rotating
      map.current.dragRotate.disable();
      map.current.touchZoomRotate.disableRotation();
    }
    initMap();
  }, [
    lng,
    lat,
    zoom,
    mapContainer,
    registerMapView,
    layerManager
  ])

  // Cleanup map on unmount
  useEffect(() => {
    return () => {
      if (map.current) {
        // Don't destroy the map, just clean up event listeners
        map.current.off('error');
        map.current.off('idle');
        map.current.off('moveend');
        map.current.off('zoomend');
        map.current.off('load');
        
        // Remove style load handler if it exists
        if (map.current._styleLoadHandler) {
          map.current.off('styledata', map.current._styleLoadHandler);
          map.current.off('load', map.current._styleLoadHandler);
        }
      }
    };
  }, []);

  // On map load: Zoom to relevant position
  useEffect(() => {
    if(! didMapLoad) return;

    // Get query params
    const queryParams = new URLSearchParams(window.location.search);

    // Get gm_code from URL
    const gm_code = queryParams.get("gm_code");

    // Get zoom, lat and lng from URL
    const zoom = queryParams.get("zoom");
    const lat = queryParams.get("lat");
    const lng = queryParams.get("lng");

    // If zoom and lat/lng are in URL -> navigate to that location
    if(zoom && lat && lng) {
      setTimeout(() => {
        map.current.setZoom(zoom);
        map.current.setCenter([lng, lat]);
      }, 1000);
    }

    // If on Map page and gm_zone is in URL -> navigate to municipality
    else if(gm_code) {
      dispatch({
        type: 'SET_FILTER_GEBIED',
        payload: gm_code
      })
    }
  }, [
    didMapLoad
  ])

  /**
   * UNIFIED LAYER MANAGEMENT
   */

  // Set active sources using unified layer manager
  useEffect(() => {
    if(! didInitSourcesAndLayers) return;
    if(! didMapLoad) return;
    if(! map.current.isStyleLoaded()) return;

    const activateSourcesWithDelay = async () => {
      // If we're waiting for map style to be applied, add a small delay
      if (mapStyle !== 'base' && !hasAppliedMapStyle) {
        await new Promise(resolve => setTimeout(resolve, 200));
      }

      // Get active sources from layer manager
      const activeSources = layerManager.getActiveSources();
      
      activeSources.forEach(sourceName => {
        try {
          // Use native MapLibre method instead of mapbox-gl-utils
          const source = map.current.getSource(sourceName);
          if (source) {
            // For GeoJSON sources, we can't really "show" them, but we can ensure they're properly initialized
            // console.log('MapComponentUnified: Source exists, ensuring it\'s properly initialized:', sourceName);
          } else {
            // console.log('MapComponentUnified: Source does not exist:', sourceName);
          }
          // console.log('MapComponentUnified: Successfully showed source:', sourceName);
        } catch (error) {
          console.error('MapComponentUnified: Error showing source:', sourceName, error);
          // Fallback to mapbox-gl-utils
          try {
            map.current.U.showSource(sourceName);
          } catch (fallbackError) {
            console.error('MapComponentUnified: Error showing source with fallback:', sourceName, fallbackError);
          }
        }
      });
      
      Object.keys(sources).forEach((key, idx) => {
        if(activeSources.indexOf(key) <= -1) {
          // Don't remove if source does not exist :)
          if(! map.current.isSourceLoaded(key)) return;
          // console.log('MapComponentUnified: Hiding source:', key);
          try {
            map.current.U.hideSource(key);
          } catch (error) {
            console.error('MapComponentUnified: Error hiding source:', key, error);
          }
        }
      });
    }

    activateSourcesWithDelay();
  }, [
    didInitSourcesAndLayers,
    didMapLoad,
    mapStyle,
    hasAppliedMapStyle,
    layerManager.currentState.visibleLayers
  ])

  // Set active layers using unified layer manager
  useEffect(() => {
    if(! didInitSourcesAndLayers) return;
    if(! didMapLoad) return;
    if(! map.current.isStyleLoaded()) return;

    const activateLayersWithDelay = async () => {
      // console.log('MAP activateLayersWithDelay called');

      // console.log('MapComponentUnified: Layer activation effect triggered', {
      //   mapStyle,
      //   hasAppliedMapStyle,
      //   zones_geodata: !!zones_geodata,
      //   zonesFeaturesLength: zones_geodata?.data?.features?.length,
      //   lastReactivation,
      //   triggerReason: lastReactivation ? 'ultra-fast layer switch reactivation' : 'normal state change'
      // });

      // If we're waiting for map style to be applied, add a small delay
      if (mapStyle !== 'base' && !hasAppliedMapStyle) {
        await new Promise(resolve => setTimeout(resolve, 200));
      }

      // Get active layers from layer manager
      const activeLayers = layerManager.getActiveLayers();
      // console.log('MAP activeLayers:', activeLayers);
      // console.log('MapComponentUnified: Activating layers:', activeLayers);
      // console.log('MapComponentUnified: Zones geodata available:', zones_geodata);
      
      // If zones layers are active but zones data is not available, wait longer
      const hasZonesLayers = activeLayers.includes('zones-geodata') || activeLayers.includes('zones-geodata-border');
      // const hasZonesData = zones_geodata?.data?.features?.length > 0;
      
      // if (hasZonesLayers && !hasZonesData) {
      //   console.log('MapComponentUnified: Zones layers active but no data, waiting for data to load...');
      //   // Wait longer for zones data to load
      //   await new Promise(resolve => setTimeout(resolve, 1000));
        
      //   // Check again after waiting
      //   const updatedZonesData = zones_geodata?.data?.features?.length > 0;
      //   if (!updatedZonesData) {
      //     console.log('MapComponentUnified: Zones data still not available after waiting, proceeding anyway');
      //   } else {
      //     console.log('MapComponentUnified: Zones data now available after waiting');
      //   }
      // }
      
      // Sources are already added during map initialization via addSources()
      // The unified layer manager will handle any missing layers automatically
      
      // console.log('MapComponentUnified: About to call unified layer manager activateLayers with:', {
      //   mapExists: !!map.current,
      //   layersCount: Object.keys(layers).length,
      //   activeLayersCount: activeLayers.length
      // });
      
      // Use unified layer manager to activate layers
      layerManager.activateLayers(activeLayers, {
        useUltraFast: false, // Use traditional switching for this effect
        skipAnimation: false,
        preserveExisting: false
      });
      
      // After layer activation, verify that vehicle layers are visible
      // setTimeout(() => {
      //   const vehicleLayers = ['vehicles-point', 'vehicles-clusters', 'vehicles-clusters-count', 'vehicles-clusters-point', 'vehicles-heatmap'];
      //   vehicleLayers.forEach(layerId => {
      //     try {
      //       const layer = map.current.getLayer(layerId);
      //       if (layer) {
      //         const visibility = map.current.getLayoutProperty(layerId, 'visibility');
      //         console.log(`MapComponentUnified: Vehicle layer ${layerId} visibility after activation:`, visibility);
      //       }
      //     } catch (error) {
      //       console.log(`MapComponentUnified: Could not check visibility for vehicle layer ${layerId}:`, error);
      //     }
      //   });
      // }, 100);

    };

    activateLayersWithDelay();
  }, [
    didInitSourcesAndLayers,
    didMapLoad,
    mapStyle,
    hasAppliedMapStyle,
    zones_geodata,
    lastReactivation,
    layerManager.currentState.visibleLayers
  ])

  // Set vehicles sources
  useEffect(() => {
    if(! didInitSourcesAndLayers) return;
    if(! vehicles.data || vehicles.data.length <= 0) return;

    const updateVehicleSources = async () => {
      // Try to use unified layer manager if available
      const unifiedLayerManager = (window as any).__UNIFIED_LAYER_MANAGER__;
      
      if (unifiedLayerManager && unifiedLayerManager.updateSourceData) {
        // console.log('Using unified layer manager for vehicle source updates');
        
        // Update vehicles source
        if (unifiedLayerManager.sourceExists('vehicles')) {
          unifiedLayerManager.updateSourceData('vehicles', vehicles.data);
        }
        
        // Update vehicles-clusters source
        if (unifiedLayerManager.sourceExists('vehicles-clusters')) {
          unifiedLayerManager.updateSourceData('vehicles-clusters', vehicles.data);
        }
        
        return;
      }
      
      // Fallback to original implementation
      console.log('Using fallback vehicle source update method');
      
      if(map.current.getSource('vehicles')) {
        map.current.U.setData('vehicles', vehicles.data);
      }
      if(map.current.getSource('vehicles-clusters')) {
        map.current.U.setData('vehicles-clusters', vehicles.data);
      }
    };

    updateVehicleSources();
  }, [
    didInitSourcesAndLayers,
    vehicles.data
  ]);

  // Set zones source
  useEffect(() => {
    console.log('MapComponentUnified: Zones source effect triggered', {
      didInitSourcesAndLayers,
      zones_geodata: !!zones_geodata,
      zonesData: zones_geodata?.data,
      zonesFeaturesLength: zones_geodata?.data?.features?.length,
      mapExists: !!map.current,
      mapUExists: !!map.current?.U,
      zonesSourceExists: map.current?.getSource('zones-geodata'),
      mapStyleLoaded: map.current?.isStyleLoaded()
    });
    
    if(! didInitSourcesAndLayers) return;
    if(! zones_geodata || !zones_geodata.data || !zones_geodata.data.features || zones_geodata.data.features.length <= 0) return;
    if(! map.current) return;
    if(! map.current.U) return;
    if(! map.current.isStyleLoaded()) return;

    const setZonesData = async () => {
      // Try to use unified layer manager if available
      const unifiedLayerManager = (window as any).__UNIFIED_LAYER_MANAGER__;
      
      if (unifiedLayerManager && unifiedLayerManager.updateSourceData) {
        console.log('Using unified layer manager for zones source update');
        
        // Wait for the zones source to be available
        let retries = 0;
        const maxRetries = 10;
        
        while (!unifiedLayerManager.sourceExists('zones-geodata') && retries < maxRetries) {
          await new Promise(resolve => setTimeout(resolve, 100));
          retries++;
        }
        
        if (!unifiedLayerManager.sourceExists('zones-geodata')) {
          console.log('Zones source not found, creating it manually');
          try {
            // Manually create the zones source using unified layer manager
            unifiedLayerManager.addSource('zones-geodata', {
              type: 'geojson',
              data: {
                type: 'FeatureCollection',
                features: []
              }
            });
          } catch (error) {
            console.error('Error creating zones source manually:', error);
            return;
          }
        }

        // Update zones data using unified layer manager
        unifiedLayerManager.updateSourceData('zones-geodata', zones_geodata.data);
        return;
      }
      
      // Fallback to original implementation
      console.log('Using fallback zones source update method');
      
      // Wait for the zones source to be available
      let retries = 0;
      const maxRetries = 10;
      
      while (!map.current.getSource('zones-geodata') && retries < maxRetries) {
        await new Promise(resolve => setTimeout(resolve, 100));
        retries++;
      }
      
      if (!map.current.getSource('zones-geodata')) {
        try {
          // Manually create the zones source
          map.current.addSource('zones-geodata', {
            type: 'geojson',
            data: {
              type: 'FeatureCollection',
              features: []
            }
          });
        } catch (error) {
          console.error('Error creating zones source manually:', error);
          return;
        }
      }

      try {
        // Use native MapLibre method instead of mapbox-gl-utils
        const source = map.current.getSource('zones-geodata');
        if (source && source.setData) {
          source.setData(zones_geodata.data);
        } else {
          // Fallback to mapbox-gl-utils
          map.current.U.setData('zones-geodata', zones_geodata.data);
        }
      } catch (error) {
        console.error('Error setting zones data:', error);
        // Fallback to mapbox-gl-utils
        try {
          map.current.U.setData('zones-geodata', zones_geodata.data);
        } catch (fallbackError) {
          console.error('Error setting zones data with fallback:', fallbackError);
        }
      }
    };

    setZonesData();
  }, [
    didInitSourcesAndLayers,
    zones_geodata,
    zones_geodata.data,
  ]);

  // Set rentals origins source
  useEffect(() => {
    if(! didInitSourcesAndLayers) return;
    if(! rentals || ! rentals.origins || Object.keys(rentals.origins).length <= 0) return;

    const updateRentalsOrigins = async () => {
      // Try to use unified layer manager if available
      const unifiedLayerManager = (window as any).__UNIFIED_LAYER_MANAGER__;
      
      if (unifiedLayerManager && unifiedLayerManager.updateSourceData) {
        console.log('Using unified layer manager for rentals origins update');
        
        if (unifiedLayerManager.sourceExists('rentals-origins')) {
          unifiedLayerManager.updateSourceData('rentals-origins', rentals.origins);
        }
        
        if (unifiedLayerManager.sourceExists('rentals-origins-clusters')) {
          unifiedLayerManager.updateSourceData('rentals-origins-clusters', rentals.origins);
        }
        
        return;
      }
      
      // Fallback to original implementation
      console.log('Using fallback rentals origins update method');
      
      map.current.U.setData('rentals-origins', rentals.origins);
      map.current.U.setData('rentals-origins-clusters', rentals.origins);
    };

    updateRentalsOrigins();
  }, [
    didInitSourcesAndLayers,
    rentals,
    rentals.origins
  ]);

  // Set rentals destinations source
  useEffect(() => {
    if(! didInitSourcesAndLayers) return;
    if(! rentals || ! rentals.destinations || Object.keys(rentals.destinations).length <= 0) return;

    const updateRentalsDestinations = async () => {
      // Try to use unified layer manager if available
      const unifiedLayerManager = (window as any).__UNIFIED_LAYER_MANAGER__;
      
      if (unifiedLayerManager && unifiedLayerManager.updateSourceData) {
        console.log('Using unified layer manager for rentals destinations update');
        
        if (unifiedLayerManager.sourceExists('rentals-destinations')) {
          unifiedLayerManager.updateSourceData('rentals-destinations', rentals.destinations);
        }
        
        if (unifiedLayerManager.sourceExists('rentals-destinations-clusters')) {
          unifiedLayerManager.updateSourceData('rentals-destinations-clusters', rentals.destinations);
        }
        
        return;
      }
      
      // Fallback to original implementation
      console.log('Using fallback rentals destinations update method');
      
      map.current.U.setData('rentals-destinations', rentals.destinations);
      map.current.U.setData('rentals-destinations-clusters', rentals.destinations);
    };

    updateRentalsDestinations();
  }, [
    didInitSourcesAndLayers,
    rentals,
    rentals.destinations
  ]);

  // Map style effect using unified layer manager
  useEffect(() => {
    // Skip if we've already applied this style
    if (hasAppliedMapStyle && lastMapStyle === mapStyle) {
      return;
    }
    
    if (!didMapLoad || !didInitSourcesAndLayers || !map.current) {
      return;
    }

    const applyMapStyleChange = async () => {
      // Wait for the map style to load
      while (!map.current.isStyleLoaded()) {
        await new Promise(resolve => setTimeout(resolve, 100));
      }
      
      // Add a delay to ensure this runs after layer components
      await new Promise(resolve => setTimeout(resolve, 500));
      
      try {
        // Use unified layer manager to set base layer
        layerManager.setBaseLayer(mapStyle, {
          useUltraFast: true, // Use ultra-fast switching for style changes
          skipAnimation: true,
          batch: true
        });
        
        setHasAppliedMapStyle(true);
        setLastMapStyle(mapStyle);
        
        // Force re-activate layers after style change
        setTimeout(() => {
          if (map.current && map.current.isStyleLoaded()) {
            const activeLayers = layerManager.getActiveLayers();
            
            // Use unified layer manager to re-activate layers
            layerManager.activateLayers(activeLayers, {
              useUltraFast: false, // Use traditional switching for re-activation
              skipAnimation: false,
              preserveExisting: false
            });
          }
        }, 300);
      } catch (error) {
        console.error('Error restoring map style:', error);
      }
    };

    applyMapStyleChange();
  }, [
    didMapLoad,
    didInitSourcesAndLayers,
    mapStyle,
    lastMapStyle
  ]);

  /**
   * /UNIFIED LAYER MANAGEMENT
  */

  // If area selection (place/zone) changes, navigate to area
  useEffect(() => {
    if(! map.current) return;
    if(! extent || extent.length === 0) {
      return;
    }

    // Do not zoom to place if zone geography is in URL
    const hasZoneInUrl = () => {
      // Check if we are on the zones page
      if(window.location.pathname.indexOf('/map/zones/') <= -1 && window.location.pathname.indexOf('/admin/zones/') <= -1) return false;
      // Get geographyId from URL
      const geographyId = pathName.split('/zones/')[1];
      return geographyId ? true : false;
    }
    if(hasZoneInUrl()) return;

    // console.log('ACTION: fitBounds (MapComponent - if extent changes)');
    map.current.fitBounds(extent);
    
    // Reset extent action
    dispatch({ type: 'LAYER_SET_ZONES_EXTENT', payload: [] });
  }, [
    extent,
    // dispatch
  ])

  // Init popup logic
  useEffect(() => {
    if(! didInitSourcesAndLayers) return;
    if(! providers) return;

    // Only S&B and providers can see vehicle ID
    const canSeeVehicleId = () => {
      // If user isn't logged in, it's no analyst
      if(! userData || ! userData.user) {
        return false;
      }
      // Return true if user is logged in
      return true;
    }

    initPopupLogic(map.current, providers, canSeeVehicleId(), filter.datum)
  }, [
    didInitSourcesAndLayers,
    providers,
    filter.datum
  ])

  // Init clusters click handler
  useEffect(() => {
    if(! didInitSourcesAndLayers) return;

    initClusters(map.current)
  }, [
    didInitSourcesAndLayers
  ])

  // Add provider images/icons
  useEffect(() => {
    const addProviderImage = async(aanbieder) => {
      let baselabel = aanbieder.system_id + (stateLayers.displaymode === 'displaymode-rentals' ? '-r' : '-p')
      if (map.current.hasImage(baselabel + ':0')) {
        // console.log("provider image for %s already exists", baselabel);
        return;
      }
      var value;
      if(stateLayers.displaymode === 'displaymode-rentals') {
        value = await getVehicleMarkers_rentals(aanbieder.color);
      } else {
        value = await getVehicleMarkers(aanbieder.color);
      }
      value.forEach((img, idx) => {
        map.current.addImage(baselabel + `:` + idx, { width: 50, height: 50, data: img});
      });
    };
    providers.forEach(aanbieder => {
      addProviderImage(aanbieder);
    });
  }, [
    providers,
    stateLayers.displaymode
  ]);

  const showSearchBar = () => {
    const viewsToShowSearchBar = [
      'displaymode-policy-hubs',
      'displaymode-rentals',
      'displaymode-service-areas',
      'displaymode-park'
    ];
    return viewsToShowSearchBar.indexOf(stateLayers.displaymode) > -1;
  }

  return <>
    {/* The map container (HTML element) */}
    <div ref={mapContainer} className="map flex-1" />
    {/* H3 layer */}
    <DdH3HexagonLayer map={map.current} />
    {/* Isochrone layer */}
    {isLoggedIn ? <IsochroneTools /> : null}
    {/* Service areas layer */}
    {stateLayers.displaymode === 'displaymode-park' && <DdParkEventsLayer map={map.current} />}
    {stateLayers.displaymode === 'displaymode-rentals' && <DdRentalsLayer map={map.current} />}
    {stateLayers.displaymode === 'displaymode-service-areas' && <DdServiceAreasLayer map={map.current} />}
    {stateLayers.displaymode === 'displaymode-policy-hubs' && <>
      <DdPolicyHubsLayer map={map.current} />
    </>}
    {isLoggedIn && showSearchBar && 
      <>
        <RightTop>
          <div className="flex gap-2">
            <SearchBar map={map.current} />
            {(
              displayMode !== DISPLAYMODE_START
              && displayMode !== DISPLAYMODE_OTHER
            ) && <SelectLayer />}
          </div>
        </RightTop>
      </>
    }
  </>
}

export {
  MapComponentUnified
} 