var store_zonesgeodata = undefined;

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
    if(undefined===store_zonesgeodata) {
      console.log("no redux state available yet - skipping zones geodata update");
      return false;
    }
    
    const state = store_zonesgeodata.getState();
    if(!isLoggedIn(state)||!state||state.filter.gebied===""||state.filter.zones.length===0) {
      store_zonesgeodata.dispatch({ type: 'SET_ZONES_GEODATA', payload: getEmptyZonesGeodataPayload()});
    } else {
      // https://api.deelfietsdashboard.nl/dashboard-api/zones?gm_code=GM0518
      let url_zonesgeodata="https://api.deelfietsdashboard.nl/dashboard-api/zones?zone_ids="+state.filter.zones+"&&include_geojson=true";
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
            // convert to standard geojson here
            let geojson = {
               "type":"FeatureCollection",
               "features":[]
            }

            metadata.zones.forEach(zonedata => {
              // console.log("got zonedatas", zonedata)
              
              switch(zonedata.geojson.type) {
                case "MultiPolygon":
                case "Polygon":
                  let feature = {
                     "type":"Feature",
                     "geometry": zonedata.geojson
                  }
                  geojson.features.push(feature);
                  break;
                default:
                  console.log("pollMetadataZonesgeodata - don't know how to handle %s", zonedata.type, zonedata);
                  break
              }
            })
            
            let payload = { data: geojson, filter: state.filter.zones};
            store_zonesgeodata.dispatch({ type: 'SET_ZONES_GEODATA', payload});
          }).catch(ex=>{ console.error("unable to decode JSON", ex); });
        }).catch(ex=>{ console.error("unable to fetch zone geodata"); });
      }
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
  store_zonesgeodata = _store;
}
