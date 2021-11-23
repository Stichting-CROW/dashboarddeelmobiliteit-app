import React from 'react';
import { useDispatch, useSelector } from 'react-redux';
import './css/FilteritemMarkers.css';

function FilteritemMarkers() {
  const dispatch = useDispatch()

  const markers = useSelector(state => {
    return [
      { id: 0, color: '#1FA024', fillcolor: '#1FA024', name: '< 24 uur'},
      { id: 1, color: '#48E248', fillcolor: '#FFFFFF', name: '< 48 uur'},
      { id: 2, color: '#FFD837', fillcolor: '#FFFFFF', name: '< 72 uur'},
      { id: 3, color: '#FE862E', fillcolor: '#FE862E', name: '< 5 d'},
      { id: 4, color: '#FD3E48', fillcolor: '#FD3E48', name: '> 7 d'},
    ];
  });
  
  const filterMarkersExclude = useSelector(state => {
    return state.filter ? state.filter.markersexclude : [];
  });
  
  const addToFilterMarkersExclude = (marker) => {
    dispatch({ type: 'ADD_TO_FILTER_MARKERS_EXCLUDE', payload: marker })
  }
  
  const removeFromFilterMarkersExclude = (marker) => {
    dispatch({ type: 'REMOVE_FROM_FILTER_MARKERS_EXCLUDE', payload: marker })
  }
  
  // const clearFilterMarkersExclude = () => {
  //   dispatch({ type: 'CLEAR_FILTER_MARKERS_EXCLUDE', payload: null })
  // }
  
  return (
    <div className="filter-markers-container">
      <div className="filter-markers-box-row">
        {
          markers.map(marker=>{
            let excluded = filterMarkersExclude.split(",").includes(marker.id.toString());
            
            let className = excluded ? "filter-markers-item-excluded": "filter-markers-item";
            
            let handler = excluded ?
                e=>{ e.stopPropagation(); removeFromFilterMarkersExclude(marker.id)}
              :
                e=>{ e.stopPropagation(); addToFilterMarkersExclude(marker.id)};
                
            return (
              <div className={className}>
                <div className="filter-markers-marker" onClick={handler}>
                  <svg viewBox='0 0 30 30' >
                    <circle cx={'50%'} cy={'50%'} r={'40%'} fill={marker.color} />
                    <circle cx={'50%'} cy={'50%'} r={'34%'} fill={marker.fillcolor} />
                  </svg>
                </div>
                <div className="filter-markers-itemlabel">
                  { marker.name }
                </div>
              </div>)
          })
        }
      </div>
    </div>
  )
  
  // return (
  //     <div className="filter-item" onClick={e=>{setShowSelect(!showSelect)}}>
  //       <div className="filter-title">Markers</div>
  //       <div className="filter-value">{zonetxt}</div>
  //       { showSelect ? renderSelectMarkers(zones) : null }
  //     </div>
  //   )
}

export default FilteritemMarkers;