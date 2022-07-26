import { getEmptyZonesGeodataPayload } from './metadataZonesgeodata';
import {isLoggedIn} from '../helpers/authentication.js';

// const getFilters = async (token, gm_code) => {
//   let options = { headers : { "authorization": "Bearer " + token }}
//   let url="https://api.deelfietsdashboard.nl/dashboard-api/zones?gm_code="+gm_code;
//   return await fetch(url, options).json();
// }

export const updateZones = async (store_zones) => {
  try {
    if(undefined===store_zones) {
      console.log("no redux state available yet - skipping zones update");
      return false;
    }
    
    const state = store_zones.getState();
    if(state.metadata.metadata_loaded===false) {
      console.log("no metadata available yet - skipping zones update");
      return false;
    }


    let url_zones="";
    if(!state) { // ||state.filter.gebied===""
      store_zones.dispatch({ type: 'SET_ZONES', payload: []});
      store_zones.dispatch({ type: 'SET_ZONES_GEODATA', payload: getEmptyZonesGeodataPayload()});
      store_zones.dispatch({ type: 'SET_ZONES_LOADED', payload: true});
      
      return;
    }

    // Not logged in:
    else if(! isLoggedIn(state)) {

      const gm_code = state.filter.gebied;
      let url = `https://api.deelfietsdashboard.nl/dashboard-api/public/filters?gm_code=${gm_code}`;
      const zonesGeoDataResult = await fetch(url);
      const zonesGeoDataJson = await zonesGeoDataResult.json();

      if(state.filter.gebied==="") {
        store_zones.dispatch({ type: 'SET_ZONES', payload: []});
        store_zones.dispatch({ type: 'SET_ZONES_GEODATA', payload: getEmptyZonesGeodataPayload()});
        store_zones.dispatch({ type: 'SET_ZONES_LOADED', payload: true});

        return;
      }

      if(zonesGeoDataJson && zonesGeoDataJson.filter_values && zonesGeoDataJson.filter_values.zones) {
        store_zones.dispatch({ type: 'SET_ZONES', payload: zonesGeoDataJson.filter_values.zones});
        store_zones.dispatch({ type: 'SET_ZONES_LOADED', payload: true});
      }
      else {
        store_zones.dispatch({ type: 'SET_ZONES', payload: []});
        store_zones.dispatch({ type: 'SET_ZONES_GEODATA', payload: getEmptyZonesGeodataPayload()});
        store_zones.dispatch({ type: 'SET_ZONES_LOADED', payload: true});
      }
      
      return;
    }

    if(state.filter.gebied==="") {
      store_zones.dispatch({ type: 'SET_ZONES', payload: []});
      store_zones.dispatch({ type: 'SET_ZONES_GEODATA', payload: getEmptyZonesGeodataPayload()});
      store_zones.dispatch({ type: 'SET_ZONES_LOADED', payload: true});

      return;
      
      // later: show outlines for all municipalities
      // url_zones="https://api.deelfietsdashboard.nl/dashboard-api/zones?zone_type=municipality";
    } else {
      // https://api.deelfietsdashboard.nl/dashboard-api/zones?gm_code=GM0518
      url_zones="https://api.deelfietsdashboard.nl/dashboard-api/zones?gm_code="+state.filter.gebied;

      store_zones.dispatch({ type: 'SET_ZONES', payload: []});
      store_zones.dispatch({ type: 'SET_ZONES_LOADED', payload: false});
    }

    // let url_geodata="https://api.deelfietsdashboard.nl/dashboard-api/menu/acl"
    // https://api.deelfietsdashboard.nl/dashboard-api/zones?zone_ids=34217&include_geojson=true
    let options = { headers : { "authorization": "Bearer " + state.authentication.user_data.token }}
    
    store_zones.dispatch({type: 'SHOW_LOADING', payload: true});

    fetch(url_zones, options).then((response) => {
      if(!response.ok) {
        console.error("unable to fetch: %o", response);
        return false
      }

      response.json()
        .then((metadata) => {
          store_zones.dispatch({ type: 'SET_ZONES', payload: metadata.zones});
          store_zones.dispatch({ type: 'SET_ZONES_LOADED', payload: true});
        })
      }).catch(ex=>{
        console.error("unable to decode JSON");
      }).finally(()=>{
        store_zones.dispatch({type: 'SHOW_LOADING', payload: false});
      })
  } catch(ex) {
    console.error("Unable to update zones", ex)
    store_zones.dispatch({type: 'SHOW_LOADING', payload: false});
  }
}
