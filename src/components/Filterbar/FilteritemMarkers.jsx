import React from 'react';
import { useDispatch, useSelector } from 'react-redux';
import './css/FilteritemMarkers.css';

function FilteritemMarkers() {
  const dispatch = useDispatch()

  const markers = useSelector(state => {
    return [
      { id: 0, color: '#1FA024', fillcolor: '#1FA024', name: '< 1 uur'},
      { id: 1, color: '#48E248', fillcolor: '#48E248', name: '< 24 uur'},
      { id: 2, color: '#FFD837', fillcolor: '#FFD837', name: '< 4 d'},
      { id: 3, color: '#FD3E48', fillcolor: '#FD3E48', name: '> 4 d'}
    ];
  });
  
  const filterMarkersExclude = useSelector(state => {
    return state.filter ? state.filter.markersexclude : '';
  }) || '';
  
  const addToFilterMarkersExclude = (marker) => {
    dispatch({ type: 'ADD_TO_FILTER_MARKERS_EXCLUDE', payload: marker })
  }
  
  const removeFromFilterMarkersExclude = (marker) => {
    dispatch({ type: 'REMOVE_FROM_FILTER_MARKERS_EXCLUDE', payload: marker })
  }
  
  const clearFilterMarkersExclude = () => {
    dispatch({ type: 'CLEAR_FILTER_MARKERS_EXCLUDE', payload: null })
  }
  
  // Function that gets executed if user clicks a provider filter
  const clickFilter = id => {
    console.log("clickfilter [%s]<", filterMarkersExclude);
    // If no filters were set, only show this provider and hide all others
    if(filterMarkersExclude==="") {
      // Disable all but the selected provider
      markers.map(x => {
        if(x.id !== id) {
          addToFilterMarkersExclude(x.id)
        }
        return x;
      })
    }

    // If provider was disabled, re-enable provider
    else {
      addToFilterMarkersExclude(id)
    }
  }
  
  
  return (
    <div className="filter-markers-container">
    <div className="filter-markers-title-row">
      <div className="filter-markers-title">Parkeerduur</div>
      { filterMarkersExclude!==''?
          <div className="filter-markers-reset cursor-pointer" onClick={clearFilterMarkersExclude}>
            reset
          </div>
          :
          null
      }
    </div>
      <div className="filter-markers-box-row">
        {
          markers.map(marker => {
            let excluded = filterMarkersExclude.split(",").includes(marker.id.toString());
            
            let className = excluded ? "filter-markers-item-excluded": "filter-markers-item";
            
            let handler = excluded ?
                e=>{ e.stopPropagation(); removeFromFilterMarkersExclude(marker.id)}
              :
                e=>{ e.stopPropagation(); clickFilter(marker.id)};
                
            return (
              <div className={className} key={marker.id}>
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