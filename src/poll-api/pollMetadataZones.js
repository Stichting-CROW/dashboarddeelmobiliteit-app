import { getEmptyZonesGeodataPayload } from './pollMetadataZonesgeodata';
import { cPollDelayMetadataZones, cPollDelayErrorMultiplyer } from '../constants.js';

var store_zones = undefined;

const isLoggedIn = (state) => {
  return state.authentication.user_data ? true : false;
};

var timerid_zones = undefined;

const updateZones = ()  => {
  let delay = cPollDelayMetadataZones;
  try {
    if(undefined===store_zones) {
      // console.log("no redux state available yet - skipping zones update");
      return false;
    }
    
    const state = store_zones.getState();
    let url_zones="";
    if(!isLoggedIn(state)||!state) { // ||state.filter.gebied===""
      store_zones.dispatch({ type: 'SET_ZONES', payload: []});
      store_zones.dispatch({ type: 'SET_ZONES_GEODATA', payload: getEmptyZonesGeodataPayload()});
      return;
    } if(state.filter.gebied==="") {
      store_zones.dispatch({ type: 'SET_ZONES', payload: []});
      store_zones.dispatch({ type: 'SET_ZONES_GEODATA', payload: getEmptyZonesGeodataPayload()});
      return;
      
      // later: show outlines for all municipalities
      // url_zones="https://api.deelfietsdashboard.nl/dashboard-api/zones?zone_type=municipality";
    } else {
      // https://api.deelfietsdashboard.nl/dashboard-api/zones?gm_code=GM0518
      url_zones="https://api.deelfietsdashboard.nl/dashboard-api/zones?gm_code="+state.filter.gebied;
    }

    // let url_geodata="https://api.deelfietsdashboard.nl/dashboard-api/menu/acl"
    // https://api.deelfietsdashboard.nl/dashboard-api/zones?zone_ids=34217&include_geojson=true
    let options = { headers : { "authorization": "Bearer " + state.authentication.user_data.token }}
    
    fetch(url_zones, options).then((response) => {
      if(!response.ok) {
        console.error("unable to fetch: %o", response);
        return false
      }

      response.json()
        .then((metadata) => {
          // items: { "municipality": "GM0785", "name": "Goirle", "owner": null, "zone_id": 34278, "zone_type": "municipality"}
          store_zones.dispatch({ type: 'SET_ZONES', payload: metadata.zones});
        })
      }).catch(ex=>{
        console.error("unable to decode JSON");
      });
  } catch(ex) {
    console.error("Unable to update zones", ex)
    delay = cPollDelayMetadataZones * cPollDelayErrorMultiplyer;
  } finally {
    timerid_zones = setTimeout(updateZones, delay);
  }
}

export const forceUpdateZones = () => {
  if(undefined!==timerid_zones) { clearTimeout(timerid_zones); }
  updateZones();
}

export const initUpdateZones = (_store) => {
  // console.log("initUpdateZones")
  store_zones = _store;
  forceUpdateZones();
}

