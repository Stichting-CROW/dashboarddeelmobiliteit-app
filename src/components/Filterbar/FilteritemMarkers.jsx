import React from 'react';
import { useSelector } from 'react-redux';
import './css/FilteritemMarkers.css';

function FilteritemMarkers() {
  const filterMarkers = useSelector(state => {
    return [
      { id: 0, color: '#1FA024', fillcolor: '#1FA024', name: '< 24 uur'},
      { id: 1, color: '#48E248', fillcolor: '#FFFFFF', name: '< 48 uur'},
      { id: 2, color: '#FFD837', fillcolor: '#FFFFFF', name: '< 72 uur'},
      { id: 3, color: '#FE862E', fillcolor: '#FE862E', name: '< 5 d'},
      { id: 4, color: '#FD3E48', fillcolor: '#FD3E48', name: '> 7 d'},
    ];
  });
  
  return (
    <div className="filter-markers-container">
      <div className="filter-markers-box-row">
        {
          filterMarkers.map(marker=>{
            return (
              <div className="filter-markers-item">
                <div className="filter-markers-marker">
                  <svg viewBox='0 0 30 30' >
                    <circle cx={'50%'} cy={'50%'} r={'40%'} fill={marker.color} />
                    <circle cx={'50%'} cy={'50%'} r={'34%'} fill={marker.fillcolor} />
                  </svg>
                </div>
                <div className="filter-markers-itemlabel">
                  { marker.name }
                </div>
              </div>
            )
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