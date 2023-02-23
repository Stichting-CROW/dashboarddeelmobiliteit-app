import React from 'react';
import { useDispatch, useSelector } from 'react-redux';
import './css/FilteritemMarkers.css';

export function FilteritemMarkersParkeerduur() {
  const markers = useSelector(state => {
    return [
      { id: 0, color: '#1FA024', fillcolor: '#1FA024', name: '< 1 uur'},
      { id: 1, color: '#48E248', fillcolor: '#48E248', name: '< 24 uur'},
      { id: 2, color: '#FFD837', fillcolor: '#FFD837', name: '< 4 d'},
      { id: 3, color: '#FD3E48', fillcolor: '#FD3E48', name: '> 4 d'}
    ];
  });
  
  return FilteritemMarkers({
    label: 'Parkeerduur',
    filtername: 'parkeerduurexclude',
    markers,
    addmarker: 'ADD_TO_FILTER_MARKERS_EXCLUDE',
    removemarker: 'REMOVE_FROM_FILTER_MARKERS_EXCLUDE',
    clearmarkers: 'CLEAR_FILTER_MARKERS_EXCLUDE'
  });
}

export function FilteritemMarkersAfstand() {
  const markers = useSelector(state => {
    return [
      { id: 0, color: '#48E248', fillcolor: '#48E248', name: '1km'},
      { id: 1, color: '#44BD48', fillcolor: '#44BD48', name: '2km'},
      { id: 2, color: '#3B7747', fillcolor: '#3B7747', name: '5km'},
      { id: 3, color: '#343E47', fillcolor: '#343E47', name: '> 5km'}
    ];
  });
  
  return FilteritemMarkers({
    label: 'Afstand',
    filtername: 'afstandexclude',
    markers,
    addmarker: 'ADD_TO_FILTER_AFSTAND_EXCLUDE',
    removemarker: 'REMOVE_FROM_FILTER_AFSTAND_EXCLUDE',
    clearmarkers: 'CLEAR_FILTER_AFSTAND_EXCLUDE'
  });
}

function FilteritemMarkers({label, filtername, markers, addmarker, removemarker, clearmarkers}) {
  const dispatch = useDispatch()

  const filterMarkersExclude = useSelector(state => {
    return state.filter ? state.filter[filtername] : '';
  }) || '';
  
  const addToFilterMarkersExclude = (marker) => {
    console.log("addtofilter %s -> %s", filtername, marker)
    dispatch({ type: addmarker, payload: marker })
  }
  
  const removeFromFilterMarkersExclude = (marker) => {
    console.log("removefromfilter %s -> %s", filtername, marker)
    dispatch({ type: removemarker, payload: marker })
  }
  
  const clearFilterMarkersExclude = () => {
    console.log("clearfilter %s", filtername)
    dispatch({ type: clearmarkers, payload: null })
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
      {filterMarkersExclude!=='' ? <div className="filter-markers-title-row">
        <div className="filter-markers-reset cursor-pointer" onClick={clearFilterMarkersExclude}>
          reset
        </div>
      </div> : ''}
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
}

