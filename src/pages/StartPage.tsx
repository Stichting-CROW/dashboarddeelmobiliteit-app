import React from 'react'; // , {useEffect, useState }
import './StartPage.css'

import Permits from '../components/Permits/Permits';

import {
  useDispatch,
  // useSelector
} from 'react-redux';

// import moment from 'moment';

// import {StateType} from '../types/StateType';

// import {
//   doShowDetailledAggregatedData,
//   didSelectAtLeastOneCustomZone,
//   aggregationFunctionButtonsToRender
// } from '../helpers/stats/index';

// import VerhuringenChart from '../components/Chart/VerhuringenChart';
// import BeschikbareVoertuigenChart from '../components/Chart/BeschikbareVoertuigenChart';
// import FormInput from '../components/FormInput/FormInput';
// import TimeGrid_VehicleAvailability from '../components/TimeGrid/TimeGrid_VehicleAvailability';
// import InfoTooltip from '../components/InfoTooltip/InfoTooltip';

function StartPage(props) {
  // const dispatch = useDispatch()

  // const filter = useSelector((state: StateType) => state.filter);

  // const zones = useSelector((state: StateType) => {
  //   return (state.metadata && state.metadata.zones) ? state.metadata.zones : [];
  // });

  // const filterZones = useSelector((state: StateType) => {
  //   return state.filter ? state.filter.zones : 0;
  // });

  // const gebieden = useSelector((state: StateType) => state.metadata?.gebieden)

  // const setAggregationLevel = (newlevel) => {
  //   dispatch({
  //     type: 'SET_FILTER_ONTWIKKELING_AGGREGATIE',
  //     payload: newlevel
  //   })
  // }

  // // Function that chooses a preferred default aggregation level
  // const decideOnAggregationLevel = (userDidSelectCustomZone) => {
  //   // Default aggragation level
  //   let agg = null;
  //   // Count days
  //   const daysInSelectedPeriod = moment(filter.ontwikkelingtot).diff(moment(filter.ontwikkelingvan), 'days');
  //   // If custom zone:
  //   if(userDidSelectCustomZone) {
  //     if(daysInSelectedPeriod <= 1 && false) agg = '5m';
  //     else if(daysInSelectedPeriod <= 2) agg = '15m';
  //     else if(daysInSelectedPeriod <= 5) agg = 'hour';
  //   }
  //   // If no custom zone:
  //   else {
  //     const availableAggLevels = ['day', 'week', 'month'];
  //     // If agg level is specific to detailled agg data: switch to other agg level
  //     if(availableAggLevels.indexOf(filter.ontwikkelingaggregatie) <= -1) {
  //       // Switch to non-detailled agg level
  //       agg = 'day';
  //     }
  //   }
  //   return agg;
  // }

  // // Monitor if selected zones change
  // useEffect(() => {
  //   const userDidSelectCustomZone = didSelectAtLeastOneCustomZone(filter, zones);
  //   const agg = decideOnAggregationLevel(userDidSelectCustomZone);
  //   if(agg) setAggregationLevel(agg);
  // }, [filterZones, filter.ontwikkelingvan, filter.ontwikkelingtot])

  // const setAggregationTime = (newtime) => {
  //   dispatch({
  //     type: 'SET_FILTER_ONTWIKKELING_AGGREGATIE_TIJD',
  //     payload: newtime
  //   })
  // }

  // const setAggregationFunction = (value) => {
  //   dispatch({
  //     type: 'SET_FILTER_ONTWIKKELING_AGGREGATIE_FUNCTION',
  //     payload: value
  //   })
  // }

  // const renderTimeControl = () => {
  //   return  (
  //     <div className="StartPage-time-selection flex justify-center flex-col">
  //       <FormInput
  //         name="time"
  //         type="time"
  //         value={filter.ontwikkelingaggregatie_tijd}
  //         onChange={(e) => {
  //           setAggregationTime(e.target.value)
  //         }}
  //       />
  //     </div>
  //   )
  // }

  // const renderAggregationButton = (name, title) => {
  //   return (
  //     <div
  //       key={`agg-level-${name}`}
  //       className={"agg-button " + (filter.ontwikkelingaggregatie===name ? " agg-button-active":"")}
  //       onClick={() => { setAggregationLevel(name) }}
  //     >
  //       {title}
  //     </div>
  //   )
  // }

  // const renderAggregationFunctionButton = (name, title) => {
  //   return (
  //     <div
  //       key={`agg-level-${name}`}
  //       className={"agg-button " + (filter.ontwikkelingaggregatie_function===name ? " agg-button-active":"")}
  //       onClick={() => { setAggregationFunction(name) }}
  //     >
  //       {title}
  //     </div>
  //   )
  // }

  // const daysInSelectedPeriod = moment(filter.ontwikkelingtot).diff(moment(filter.ontwikkelingvan), 'days');

  // const getAggregationButtonsToRender = () => {
  //   let ret = [];
  //   if(doShowDetailledAggregatedData(filter, zones)) {
  //     const doShow5m = daysInSelectedPeriod <= 1;
  //     const doShow15m = daysInSelectedPeriod <= 2;
  //     const doShowHour = daysInSelectedPeriod <= 10;

  //     if(doShow5m) {
  //       ret.push(
  //         {name: '5m', title: '5 min'},
  //       );
  //     }
  //     if(doShow15m) {
  //       ret.push(
  //         {name: '15m', title: 'kwartier'},
  //       );
  //     }
  //     if(doShowHour) {
  //       ret.push(
  //         {name: 'hour', title: 'uur'}
  //       );
  //     }
  //   }
  //   ret.push(
  //     {name: 'day', title: 'dag'},
  //   );
  //   if(daysInSelectedPeriod >= 6) {
  //     ret.push(
  //       {name: 'week', title: 'week'},
  //     );
  //   }
  //   if(daysInSelectedPeriod >= 27) {
  //     ret.push(
  //       {name: 'month', title: 'maand'},
  //     );
  //   }
    
  //   return ret;
  // }

  // const getPageTitle = useMemo(() => {
  //   if(filterZones) {
  //     const zoneIds = filterZones.split(',').map(id => parseInt(id));
  //     const zoneObjects = zones.filter(zone => zoneIds.includes(zone.zone_id));
  //     return zoneObjects?.map(zone => zone.name).join(', ');
  //   }
      
  //   if(filter.gebied) {
  //     const gebied = gebieden.find(gebied => gebied.gm_code === filter.gebied);
  //     return gebied?.name;
  //   }
  //   return 'Ontwikkeling';
  // }, [filterZones, filter.gebied, zones, gebieden]);

  // const aggregationButtonsToRender = getAggregationButtonsToRender();

  // {filter.ontwikkelingaggregatie === 'day' ? renderTimeControl() : ''}
  // {filter.ontwikkelingaggregatie === 'day' ? renderTimeControl() : ''}

  console.log('*** render startpage', new Date())

  return (
    <div className="StartPage pt-4 pb-24">
      <Permits />
    </div>
  )
}

export default StartPage;
