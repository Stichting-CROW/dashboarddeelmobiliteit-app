import moment from 'moment';
import {
    DISPLAYMODE_PARK,
    DISPLAYMODE_RENTALS,
    DISPLAYMODE_OTHER,
  } from '../reducers/layers.js';


export const createFilterparameters = (displayMode, filter, metadata, options) => {
  const isParkingData=displayMode===DISPLAYMODE_PARK;
  const isRentalData=displayMode===DISPLAYMODE_RENTALS;
  const isOntwikkelingData=displayMode===DISPLAYMODE_OTHER;

  options = options || {
    includeOperators: false
  }

  // add zones
  let filterparams = [];
  if(filter.zones!=="") {
    filterparams.push("zone_ids="+filter.zones);
  } else if(filter.gebied!=="") {
    // create zone filter
    let candidates = [];
    let municipality = metadata.gebieden.find(gebied=>gebied.gm_code===filter.gebied);
    if(undefined!==municipality) {
      candidates = metadata.zones.filter(zone => {
        return zone.municipality===municipality.gm_code&&zone.name===municipality.name
      });
    } else {
    }
    if(candidates.length===1) {
      filterparams.push("zone_ids="+candidates[0].zone_id);
    } else {
      console.error("zero or multiple multiple zones found for a single municipality (%s)", filter.gebied, candidates);
    }
  }

  if(isOntwikkelingData || options.includeOperators === true) {
    // Add provider filter
    if(filter.aanbiedersexclude!=="" && filter.aanbiedersexclude!==undefined) {
      let filteritems = filter.aanbiedersexclude.split(",");
      let selectedaanbieders = metadata.aanbieders
        .filter(aanbieder=>(filteritems.includes(aanbieder.system_id)===false))
        .map(aanbieder=>aanbieder.system_id).join(",");
    
      filterparams.push("operators=" + selectedaanbieders);
    } else if (metadata.aanbieders.length===1) {
      filterparams.push("operators=" + metadata.aanbieders[0].system_id);
    }
  } else {
    // filtering is done client side
  }
  
  // only apply here if there is one aanbieder set
  if (metadata.aanbieders.length===1) {
    filterparams.push("operators=" + metadata.aanbieders[0].system_id);
  }
  
  // Add vehicle type filter
  // form_factors=[cargo_bicycle,moped,bicycle,car,other]
  if(filter.voertuigtypesexclude!=='' && filter.voertuigtypesexclude!==undefined) {
    let filteritems = filter.voertuigtypesexclude.split(",");
    let selectedtypes = metadata.vehicle_types
      .filter(vtype=>(filteritems.includes(vtype.id)===false))
      .map(vtype=>vtype.id).join(",");

    filterparams.push("form_factors=" + selectedtypes);
  }
  
  // Add date (start and/or end)
  if(isParkingData) {
    let ts = new Date().toISOString().replace(/.\d+Z$/g, "Z"); // use current time without decimals
    if(filter.datum!=="") {
      ts = new Date(filter.datum).toISOString().replace(/.\d+Z$/g, "Z");
    }
    filterparams.push("timestamp="+ts)
  }
  
  if(isRentalData) {
    let ts1 = new Date().toISOString().replace(/.\d+Z$/g, "Z"); // use current time without decimals
    let ts2 = ts1;
    // filter.intervalstart = moment().subtract(filter.intervalduur / 1000, 'seconds').toISOString();
    // filter.intervalend = moment().toISOString();
    const isInvalid = () => {
      return ! filter
          // || filter.intervalstart === ""
          || filter.intervalend === ""
          // || filter.intervalstart === undefined
          || filter.intervalend === undefined;
    }
    if(! isInvalid()) {
      ts1 = moment(filter.intervalend).subtract(filter.intervalduur / 1000, 'seconds').toISOString().replace(/.\d+Z$/g, "Z");
      ts2 = moment(filter.intervalend).toISOString().replace(/.\d+Z$/g, "Z");
    }
    filterparams.push("start_time=" + ts1 + "&end_time=" + ts2)
  }
  
  if(isOntwikkelingData) {
    let van = undefined;
    let tot = undefined;
    if(filter.ontwikkelingvan && filter.ontwikkelingtot) {
      van = new Date(filter.ontwikkelingvan);
      tot = new Date(filter.ontwikkelingtot);
    }
    
    if(!van||!tot) {
      van = new Date();
      // take now, strip hours, add 24 h
      tot = new Date((new Date()).toDateString()) ;
      van.setDate(tot.getDate()-7); // go back 1 week
    }
    
    let ts1 = van.toISOString().replace(/.\d+Z$/g, "Z"); // use current time without decimals
    let ts2 = tot.toISOString().replace(/.\d+Z$/g, "Z"); // use current time without decimals
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

export const convertDistanceToBin = (distance_in_meters) => {
  if (distance_in_meters <= 1000) {
    return 0;
  }
  if (distance_in_meters <= 2000) {
    return 1;
  }
  if (distance_in_meters <= 5000) {
    return 2;
  }
  return 3;
}

