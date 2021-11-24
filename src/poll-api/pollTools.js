export const createFilterparameters = (isParkingData=true, filter, metadata) => {
  // add zones
  let filterparams = [];
  if(filter.zones!=="") {
    filterparams.push("zone_ids="+filter.zones);
  } else if(filter.gebied!=="") {
    // create zone filter
    let candidates = [];
    let municipality = metadata.gebieden.find(gebied=>gebied.gm_code===filter.gebied);
    if(undefined!==municipality) {
      candidates = metadata.zones.filter(zone=>(zone.municipality===municipality.gm_code&&zone.name===municipality.name));
    } else {
    }
    if(candidates.length===1) {
      filterparams.push("zone_ids="+candidates[0].zone_id);
    } else {
      console.error("zero or multiple multiple zones found for a single municipality (%s)", filter.gebied, candidates);
    }
    
  }

  if(filter.aanbiedersexclude!=="" && filter.aanbiedersexclude!==undefined) {
    let filteritems = filter.aanbiedersexclude.split(",");
    let selectedaanbieders = metadata.aanbieders
      .filter(aanbieder=>(filteritems.includes(aanbieder.system_id)===false))
      .map(aanbieder=>aanbieder.system_id).join(",");

    filterparams.push("operators=" + selectedaanbieders);
  }
  
  if(filter.voertuigtypesexclude!=='') {
    // form_factors=cargo_bicycle,moped,bicycle,car,other
    let filteritems = filter.voertuigtypesexclude.split(",");
    let selectedtypes = metadata.vehicle_types
      .filter(vtype=>(filteritems.includes(vtype.id)===false))
      .map(vtype=>vtype.id).join(",");

    filterparams.push("form_factors=" + selectedtypes);
  }
  
  

  if(isParkingData) {
    let ts = new Date().toISOString().replace(/.\d+Z$/g, "Z"); // use current time without decimals
    if(filter.datum!=="") {
      ts = new Date(filter.datum).toISOString().replace(/.\d+Z$/g, "Z");
    }
    filterparams.push("timestamp="+ts)
  }
  else {
    let ts1 = new Date().toISOString().replace(/.\d+Z$/g, "Z"); // use current time without decimals
    let ts2 = ts1;
    const isInvalid = () => {
      return ! filter
          || filter.intervalstart === ""
          || filter.intervalend === ""
          || filter.intervalstart === undefined
          || filter.intervalend === undefined;
    }
    if(! isInvalid()) {
      ts1 = new Date(filter.intervalstart).toISOString().replace(/.\d+Z$/g, "Z");
      ts2 = new Date(filter.intervalend).toISOString().replace(/.\d+Z$/g, "Z");
    }
    filterparams.push("start_time=" + ts1 + "&end_time=" + ts2)
  }
  
  return filterparams;
}

export const isLoggedIn = (state) => {
  return state.authentication.user_data ? true : false;
};

export const convertDurationToBin = (duration) => {
  if (duration <= 60) {
    return 0;
  }
  if (duration <= 24 * 60) {
    return 1;
  }
  if (duration <= 24 * 60 * 4) {
    return 2;
  }
  return 3;
}

