import {isLoggedIn, isAdmin} from '../helpers/authentication.js';

export const getEmptyZonesGeodataPayload = () => {
  return {
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
      console.log("updateZonesgeodata: no redux state available yet - skipping zones geodata update");
      return false;
    }
    
    const state = store.getState();
    if(state.metadata.zones_loaded===false) {
      console.log("updateZonesgeodata: no zone metadata available yet - skipping zones geodata update");
      return false;
    }

    console.log("updateZonesgeodata: Starting zones data update", {
      gebied: state.filter?.gebied,
      zones: state.filter?.zones,
      isAdmin: isAdmin(state),
      zonesLoaded: state.metadata.zones_loaded
    });

    let zone_ids="";
    if(!state) {
      // no filter data available
      zone_ids = "";
      console.log("updateZonesgeodata: No state available");
    }
    // If admin and no place is selected:
    // Load a few sample zones instead of all zones to avoid heavy API call
    else if (state.filter.gebied==="" && isAdmin(state)) {
      console.log("updateZonesgeodata: Admin with no area selected - loading sample zones");
      // Load first 5 municipality zones as sample
      const sampleZones = state.metadata.zones
        .filter(zone => zone.zone_type === "municipality")
        .slice(0, 5);
      zone_ids = sampleZones.map(zone => zone.zone_id).join(",");
      console.log("updateZonesgeodata: Sample zone IDs for admin:", zone_ids);
    }
    else if (state.filter.gebied==="") {
      // get bounds of all municipalities
      console.log("updateZonesgeodata: No area selected, loading all municipality zones");
      zone_ids = state.metadata.zones.filter(zone=>(zone.zone_type==="municipality")).map(zone=>zone.zone_id).join(",");
      console.log("updateZonesgeodata: Zone IDs for all municipalities:", zone_ids);
    } else if (state.filter.zones.length===0) {
      // get bounds of single municipality zone
      console.log("updateZonesgeodata: Single municipality selected");
      let list_g = state.metadata.gebieden.filter(gebied=>gebied.gm_code===state.filter.gebied).map(gebied=>gebied.gm_code);
      let list_z = state.metadata.zones.filter(zone=>(zone.zone_type==="municipality"&&list_g.includes(zone.municipality)));
      zone_ids = list_z.map(zone=>zone.zone_id).join(",");
      console.log("updateZonesgeodata: Zone IDs for municipality:", zone_ids);
    } else {
      // get bounds of all selected zones
      console.log("updateZonesgeodata: Specific zones selected");
      zone_ids = state.filter.zones; // use selected zones
      console.log("updateZonesgeodata: Zone IDs for selected zones:", zone_ids);
    }

    if(zone_ids==="") {
      console.log("updateZonesgeodata: No zone IDs, setting empty payload");
      store.dispatch({ type: 'SET_ZONES_GEODATA', payload: getEmptyZonesGeodataPayload()});
      return;
    }

    console.log("updateZonesgeodata: Loading zones data for zone_ids:", zone_ids);
    store.dispatch({type: 'SHOW_LOADING', payload: true});

    // https://api.deelfietsdashboard.nl/dashboard-api/zones?gm_code=GM0518
    let url_zonesgeodata = isLoggedIn(state) 
      ? `${process.env.REACT_APP_MAIN_API_URL}/dashboard-api/zones?zone_ids=`+zone_ids+"&include_geojson=true"
      : `${process.env.REACT_APP_MAIN_API_URL}/dashboard-api/public/zones?zone_ids=`+zone_ids+"&include_geojson=true";

    let options = isLoggedIn(state) ? { headers : { "authorization": "Bearer " + state.authentication.user_data.token }} : {}

    fetch(url_zonesgeodata, options).then((response) => {
      if(!response.ok) {
        console.error("unable to fetch: %o", response);
        return false
      }

      response.json()
        .then((metadata) => {
          console.log("updateZonesgeodata: Received zones data:", metadata);
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
          
          console.log("updateZonesgeodata: Processed GeoJSON:", geojson);
          console.log("updateZonesgeodata: Features count:", geojson.features.length);
          
          let payload = { data: geojson, filter: state.filter.zones, bounds: fullextent};
          console.log("updateZonesgeodata: Dispatching SET_ZONES_GEODATA with payload:", payload);
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
