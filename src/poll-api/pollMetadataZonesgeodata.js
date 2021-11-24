var store = undefined;

const isLoggedIn = (state) => {
  return state.authentication.user_data ? true : false;
};

var timerid_zonesgeodata = undefined;

// const cTestFeatureNL = {
//    "type":"Feature",
//    "geometry": {
//      "type": "Polygon",
//      "coordinates":
//       [
//         [[4,53],[6, 53],[6, 52],[4,52],[4,53]]
//       ]
//   }
// }

export const getEmptyZonesGeodataPayload = () => {
  return  {
    "data": {
      "type":"FeatureCollection",
      "features":[]
    },
    "filter": ""
  }
}

const updateZonesGeodata = ()  => {
  let delay = 5 * 1000;
  try {
    if(undefined===store) {
      console.log("no redux state available yet - skipping zones geodata update");
      return false;
    }
    
    const state = store.getState();
    let zone_ids="";
    if(!isLoggedIn(state)||!state) {
      // no filter data available
      zone_ids = "";
    } else if (state.filter.gebied==="") {
      // get bounds of all municipalities
      zone_ids = state.metadata.zones.filter(zone=>(zone.zone_type==="municipality")).map(zone=>zone.zone_id).join(",");
    } else if (state.filter.zones.length===0) {
      // get bounds of single municipality zone
      let list_g = state.metadata.gebieden.filter(gebied=>gebied.gm_code===state.filter.gebied).map(gebied=>gebied.gm_code);
      let list_z = state.metadata.zones.filter(zone=>(zone.zone_type==="municipality"&&list_g.includes(zone.municipality)));
      zone_ids = list_z.map(zone=>zone.zone_id).join(",");
    } else {
      // get bounds of all selected zones
      zone_ids = state.filter.zones; // use selected zones
    }

    if(zone_ids==="") {
      store.dispatch({ type: 'SET_ZONES_GEODATA', payload: getEmptyZonesGeodataPayload()});
      return;
    }
    
    // https://api.deelfietsdashboard.nl/dashboard-api/zones?gm_code=GM0518
    let url_zonesgeodata="https://api.deelfietsdashboard.nl/dashboard-api/zones?zone_ids="+zone_ids+"&&include_geojson=true";
    // let url_geodata="https://api.deelfietsdashboard.nl/dashboard-api/menu/acl"
    // https://api.deelfietsdashboard.nl/dashboard-api/zones?zone_ids=34217&include_geojson=true
    let options = { headers : { "authorization": "Bearer " + state.authentication.user_data.token }}
    fetch(url_zonesgeodata, options).then((response) => {
      if(!response.ok) {
        console.error("unable to fetch: %o", response);
        return false
      }
    
      response.json()
        .then((metadata) => {
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
                console.warn("pollMetadataZonesgeodata - don't know how to handle %s", zonedata.type, zonedata);
                break
            }
          })
          
          let payload = { data: geojson, filter: state.filter.zones, bounds: fullextent};
          store.dispatch({ type: 'SET_ZONES_GEODATA', payload});
          store.dispatch({ type: 'LAYER_SET_ZONES_EXTENT', payload: fullextent })
          
        }).catch(ex=>{ console.error("unable to decode JSON", ex); });
      }).catch(ex=>{ console.error("unable to fetch zone geodata"); });
  } catch(ex) {
    console.error("Unable to update zones", ex)
    delay = 5 * 1000;
  } finally {
    timerid_zonesgeodata = setTimeout(updateZonesGeodata, delay);
  }
}

export const forceUpdateZonesgeodata = () => {
  if(undefined!==timerid_zonesgeodata) { clearTimeout(timerid_zonesgeodata); }
  updateZonesGeodata();
}

export const initUpdateZonesgeodata = (_store) => {
  store = _store;
}
