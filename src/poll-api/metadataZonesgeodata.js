import {isLoggedIn} from '../helpers/authentication.js';

export const getEmptyZonesGeodataPayload = () => {
  return  {
    "data": {
      "type":"FeatureCollection",
      "features":[]
    },
    "filter": ""
  }
}

export const updateZonesgeodata = (store)  => {
  try {
    if(undefined===store) {
      // console.log("no redux state available yet - skipping zones geodata update");
      return false;
    }
    
    const state = store.getState();
    if(state.metadata.zones_loaded===false) {
      // console.log("no zone metadata available yet - skipping zones geodata update");
      return false;
    }

    let zone_ids="";
    // if((!isLoggedIn(state))||!state) {
    if(!state) {
      // no filter data available
      zone_ids = "";
    } else if (state.filter.gebied==="") {
      // get bounds of all municipalities
      // console.log("set empty zones payload (gebied leeg)")
      zone_ids = state.metadata.zones.filter(zone=>(zone.zone_type==="municipality")).map(zone=>zone.zone_id).join(",");
    } else if (state.filter.zones.length===0) {
      // get bounds of single municipality zone
      // console.log('state.filter.zones.length===0', state.filter.zones.length===0)
      let list_g = state.metadata.gebieden.filter(gebied=>gebied.gm_code===state.filter.gebied).map(gebied=>gebied.gm_code);
      let list_z = state.metadata.zones.filter(zone=>(zone.zone_type==="municipality"&&list_g.includes(zone.municipality)));
      // console.log("set empty zones payload (zones length 0)", list_g, list_z)
      zone_ids = list_z.map(zone=>zone.zone_id).join(",");
      // console.log('zone_ids', zone_ids)
    } else {
      // console.log("set empty zones payload (selected zones")
      // get bounds of all selected zones
      zone_ids = state.filter.zones; // use selected zones
    }

    // console.log('TEST. zone_ids:', zone_ids)

    if(zone_ids==="") {
      store.dispatch({ type: 'SET_ZONES_GEODATA', payload: getEmptyZonesGeodataPayload()});
      return;
    }
    
    store.dispatch({type: 'SHOW_LOADING', payload: true});

    // https://api.deelfietsdashboard.nl/dashboard-api/zones?gm_code=GM0518
    let url_zonesgeodata = isLoggedIn(state) 
      ? "https://api.deelfietsdashboard.nl/dashboard-api/zones?zone_ids="+zone_ids+"&include_geojson=true"
      : "https://api.deelfietsdashboard.nl/dashboard-api/public/zones?zone_ids="+zone_ids+"&include_geojson=true";
    let options = isLoggedIn(state) ? { headers : { "authorization": "Bearer " + state.authentication.user_data.token }} : {}

    fetch(url_zonesgeodata, options).then((response) => {
      if(!response.ok) {
        console.error("unable to fetch: %o", response);
        return false
      }

      response.json()
        .then((metadata) => {
          // console.log("got zones geodata for ", state.filter.zones||'all zones')
          const st = require('geojson-bounds');
          
          // convert to standard geojson here
          let geojson = {
             "type":"FeatureCollection",
             "features":[]
          }
          
          let fullextent = undefined;

          metadata.zones.forEach((zonedata, idx) => {
            switch(zonedata.geojson.type) {
              case "MultiPolygon":
              case "Polygon":
                let feature = {
                   "type":"Feature",
                   "geometry": zonedata.geojson
                }
                geojson.features.push(feature);
                
                let extent = st.extent(feature)
                if(undefined===fullextent) {
                  fullextent=extent;
                } else {
                  fullextent[0]=Math.min(extent[0],fullextent[0]);
                  fullextent[1]=Math.min(extent[1],fullextent[1]);
                  fullextent[2]=Math.max(extent[2],fullextent[2]);
                  fullextent[3]=Math.max(extent[3],fullextent[3]);
                }

                break;
              default:
                console.warn("metadataZonesgeodata - don't know how to handle %s", zonedata.type, zonedata);
                break
            }
          })
          
          let payload = { data: geojson, filter: state.filter.zones, bounds: fullextent};
          store.dispatch({ type: 'SET_ZONES_GEODATA', payload});
          store.dispatch({ type: 'LAYER_SET_ZONES_EXTENT', payload: fullextent })
        })
        .catch(ex=>{ console.error("unable to decode JSON", ex); })
        .finally(()=>{ store.dispatch({type: 'SHOW_LOADING', payload: false});
      })
        
      }).catch(ex=>{ console.error("unable to fetch zone geodata"); });
  } catch(ex) {
    console.error("Unable to update zones", ex)
  }
}