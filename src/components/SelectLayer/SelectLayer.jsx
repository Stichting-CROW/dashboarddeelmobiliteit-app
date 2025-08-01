import React, { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import SlideBox from '../SlideBox/SlideBox.jsx';

import SelectLayerModal from './SelectLayerModal';
import Modal from '../Modal/Modal';

import './SelectLayer.css';

import {
  DISPLAYMODE_PARKEERDATA_VOERTUIGEN,
  DISPLAYMODE_VERHUURDATA_VOERTUIGEN,
} from '../../reducers/layers.js';

import {getMapStyles, applyMapStyle} from '../Map/MapUtils/map.js';

function SelectLayer() {
  
  const showZoneOnOff = useSelector((state) => {
    return state.filter ? state.filter.gebied!=='' : false;
  });

  const userData = useSelector((state) => {
    return state.authentication.user_data;
  });

  const [showModal, setShowModal] = useState(false);

  return <>
    <div className="SelectLayer" style={{zIndex: 1}}>
      <div
        className="
          h-12 w-12 rounded-full bg-white shadow-md flex items-center justify-center hover:bg-gray-50 transition-colors
        "
        onClick={() => {
          setShowModal(! showModal);
        }}
      >
        <svg 
          xmlns="http://www.w3.org/2000/svg" 
          width="24" 
          height="24" 
          viewBox="0 0 24 24" 
          fill="none" 
          stroke="currentColor" 
          strokeWidth="2" 
          strokeLinecap="round" 
          strokeLinejoin="round"
          className="w-6 h-6"
        >
          <polygon points="12 2 2 7 12 12 22 7 12 2"></polygon>
          <polyline points="2 17 12 22 22 17"></polyline>
          <polyline points="2 12 12 17 22 12"></polyline>
        </svg>
      </div>
    </div>

    {showModal && <Modal
      isVisible={showModal}
      title="Wijzig lagen"
      button2Title={"Sluiten"}
      button2Handler={async (e) => {
        e.preventDefault();
        // Hide modal
        setShowModal(false);
      }}
      hideModalHandler={() => {
        // Hide modal
        setShowModal(false);
      }}
      config={{
        // fullWidth: true
      }}
    >
      <SelectLayerModal />
    </Modal>}

  </>
}

export {
  SelectLayer
}

// import React from 'react';
// import { useDispatch, useSelector } from 'react-redux';
// import SlideBox from '../SlideBox/SlideBox.jsx';
// import { setBackgroundLayer } from '../Map/MapUtils/map';

// import {StateType} from '../../types/StateType';

// import './SelectLayer.css';

// import {
//   DISPLAYMODE_PARK,
//   DISPLAYMODE_RENTALS,
//   DISPLAYMODE_OTHER,
//   DISPLAYMODE_ZONES_PUBLIC,
//   DISPLAYMODE_ZONES_ADMIN,
//   DISPLAYMODE_PARKEERDATA_HEATMAP,
//   DISPLAYMODE_PARKEERDATA_CLUSTERS,
//   DISPLAYMODE_PARKEERDATA_VOERTUIGEN,
//   DISPLAYMODE_VERHUURDATA_HB,
//   DISPLAYMODE_VERHUURDATA_HEATMAP,
//   DISPLAYMODE_VERHUURDATA_CLUSTERS,
//   DISPLAYMODE_VERHUURDATA_VOERTUIGEN,
//   DISPLAYMODE_POLICY_HUBS
// } from '../../reducers/layers.js';

// import {getMapStyles, applyMapStyle} from '../Map/MapUtils/map.js';
// import { setMapStyle } from '../../actions/layers';

// function SelectLayer() {
//   const dispatch = useDispatch()
  
//   const showZoneOnOff = useSelector((state: StateType) => {
//     return state.filter ? state.filter.gebied!=='' : false;
//   });

//   const zonesVisible = useSelector((state: StateType) => {
//     return state.layers ? state.layers.zones_visible : false;
//   });
  
//   const layers = useSelector((state: StateType) => {
//     return state.layers ? state.layers : null;
//   });

//   const displayMode = useSelector((state: StateType) => {
//     return state.layers ? state.layers.displaymode : DISPLAYMODE_PARK;
//   });

//   const viewPark = useSelector((state: StateType) => {
//     return state.layers ? state.layers.view_park : DISPLAYMODE_PARKEERDATA_VOERTUIGEN;
//   });

//   const viewRentals = useSelector((state: StateType) => {
//     return state.layers ? state.layers.view_rentals : DISPLAYMODE_VERHUURDATA_VOERTUIGEN;
//   });

//   const isLoggedIn = useSelector((state: StateType) => {
//     return state.authentication.user_data ? true : false;
//   });
  
//   const userData = useSelector((state: StateType) => {
//     return state.authentication.user_data;
//   });

//   if(displayMode===DISPLAYMODE_OTHER) {
//     return null; // no layer selection
//   }

//   return (
//     <SlideBox name="SelectLayer" direction="right" options={{
//       title: 'Lagen',
//       backgroundColor: '#fff',
//     }} style={{
//       position: 'absolute',
//       top: '8px',
//       right: 0
//     }}>
//       <div className="SelectLayer pr-1">
//         { displayMode===DISPLAYMODE_PARK ?
//           <div data-type="heat-map" className={`layer${viewPark!==DISPLAYMODE_PARKEERDATA_HEATMAP ? ' layer-inactive':''}`}
//             onClick={() => { dispatch({ type: 'LAYER_SET_VIEW_PARK', payload: DISPLAYMODE_PARKEERDATA_HEATMAP }) }}>
//             <span className="layer-title">
//               Heat map
//             </span>
//           </div>: null }

//         { displayMode===DISPLAYMODE_PARK ?
//           <div data-type="pointers" className={`layer${viewPark!==DISPLAYMODE_PARKEERDATA_CLUSTERS ? ' layer-inactive':''}`}
//             onClick={() => { dispatch({ type: 'LAYER_SET_VIEW_PARK', payload: DISPLAYMODE_PARKEERDATA_CLUSTERS }) }}>
//             <span className="layer-title">
//               Clusters
//             </span>
//           </div> : null }

//         { displayMode===DISPLAYMODE_PARK ?
//           <div data-type="vehicles"  className={`layer${viewPark!==DISPLAYMODE_PARKEERDATA_VOERTUIGEN ? ' layer-inactive':''}`}
//             onClick={() => { dispatch({ type: 'LAYER_SET_VIEW_PARK', payload: DISPLAYMODE_PARKEERDATA_VOERTUIGEN }) }}>
//             <span className="layer-title">
//               Voertuigen
//             </span>
//           </div> : null }

//         { (displayMode===DISPLAYMODE_RENTALS) ?
//           <div data-type="od" className={`layer${viewRentals!==DISPLAYMODE_VERHUURDATA_HB ? ' layer-inactive':''}`}
//             onClick={() => { dispatch({ type: 'LAYER_SET_VIEW_RENTALS', payload: DISPLAYMODE_VERHUURDATA_HB }) }}>
//             <span className="layer-title">
//               HB
//             </span>
//           </div>: null }

//         { displayMode===DISPLAYMODE_RENTALS ?
//           <div data-type="heat-map" className={`layer${viewRentals!==DISPLAYMODE_VERHUURDATA_HEATMAP ? ' layer-inactive':''}`}
//             onClick={() => { dispatch({ type: 'LAYER_SET_VIEW_RENTALS', payload: DISPLAYMODE_VERHUURDATA_HEATMAP }) }}>
//             <span className="layer-title">
//               Heat map
//             </span>
//           </div>: null }

//         { displayMode===DISPLAYMODE_RENTALS ?
//           <div data-type="pointers" className={`layer${viewRentals!==DISPLAYMODE_VERHUURDATA_CLUSTERS ? ' layer-inactive':''}`}
//             onClick={() => { dispatch({ type: 'LAYER_SET_VIEW_RENTALS', payload: DISPLAYMODE_VERHUURDATA_CLUSTERS }) }}>
//             <span className="layer-title">
//               Clusters
//             </span>
//           </div> : null }

//         { displayMode===DISPLAYMODE_RENTALS ?
//         <div data-type="vehicles"  className={`layer${viewRentals!==DISPLAYMODE_VERHUURDATA_VOERTUIGEN ? ' layer-inactive':''}`}
//           onClick={() => { dispatch({ type: 'LAYER_SET_VIEW_RENTALS', payload: DISPLAYMODE_VERHUURDATA_VOERTUIGEN }) }}>
//           <span className="layer-title">
//             Voertuigen
//           </span>
//         </div> : null }

//         {(displayMode===DISPLAYMODE_ZONES_ADMIN || displayMode===DISPLAYMODE_POLICY_HUBS) && <>
//           <div data-type="map-style-default" className={`layer${layers.map_style!=='base' ? ' layer-inactive':''}`} onClick={() => {
//             setBackgroundLayer(window['ddMap'], 'base', (name) => {
//               dispatch(setMapStyle(name))
//             });
//           }}>
//             <span className="layer-title">
//               Terrein
//             </span>
//           </div>
//           <div data-type="map-style-satellite" className={`layer${layers.map_style!=='luchtfoto-pdok' ? ' layer-inactive':''}`} onClick={() => {
//             setBackgroundLayer(window['ddMap'], 'luchtfoto-pdok', (name) => {
//               dispatch(setMapStyle(name))
//             });
//           }}>
//             <span className="layer-title">
//               Luchtfoto
//             </span>
//           </div>
//         </>}

//         {displayMode===DISPLAYMODE_ZONES_PUBLIC && false && <>

//           <div
//             data-type="monitoring"
//             className={`layer`}
//             onClick={() => { dispatch({ type: 'LAYER_SET_VIEW_PARK', payload: DISPLAYMODE_PARKEERDATA_HEATMAP }) }}
//           >
//             <span className="layer-title">
//               Analyse
//             </span>
//           </div>

//           <div
//             data-type="parking"
//             className={`layer`}
//             onClick={() => { dispatch({ type: 'LAYER_SET_VIEW_PARK', payload: DISPLAYMODE_PARKEERDATA_HEATMAP }) }}
//           >
//             <span className="layer-title">
//               Parking
//             </span>
//           </div>

//           <div
//             data-type="no parking"
//             className={`layer`}
//             onClick={() => { dispatch({ type: 'LAYER_SET_VIEW_PARK', payload: DISPLAYMODE_PARKEERDATA_HEATMAP }) }}
//           >
//             <span className="layer-title">
//               No parking
//             </span>
//           </div>

//         </>}

//         { isLoggedIn ?
//           <div data-type="zones" className={`layer${!zonesVisible ? ' layer-inactive':''}`} onClick={() => {
//             dispatch({ type: 'LAYER_TOGGLE_ZONES_VISIBLE', payload: null })
//           }}>
//             <span className="layer-title">
//               Zones
//             </span>
//           </div> : null
//         }

//       </div>
//     </SlideBox>
//   )
// }

// export {
//   SelectLayer
// }