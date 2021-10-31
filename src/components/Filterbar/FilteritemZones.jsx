import { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import ModalBox from './ModalBox.jsx';

function FilteritemZones() {
  const dispatch = useDispatch()
  
  const zones = useSelector(state => {
    return (state.metadata && state.metadata.zones) ? state.metadata.zones : [];
  });
  

  const filterZones = useSelector(state => {
    return state.filter ? state.filter.zones : 0;
  });
  
  let [showSelect, setShowSelect] = useState(false);
  
  const addToFilterZones = (zone) => {
    dispatch({ type: 'ADD_TO_FILTER_ZONES', payload: zone })
  }
  const removeFromFilterZones = (zone) => {
    dispatch({ type: 'REMOVE_FROM_FILTER_ZONES', payload: zone })
  }
  
  
  const renderZoneZones = (zones) => {
    return (
      <ModalBox closeFunction={setShowSelect}>
        <div className="filter-form-selectie">
          <div className="filter-form-title">Selecteer Zone</div>
            <div className="filter-form-values">
              { zones.map(a=>{
                  let isSelected = filterZones.includes(a.zone_id);
                  if(isSelected) {
                    return (<div key={'item-'+a.zone_id} className="form-item-selected form-item" onClick={e=>{ e.stopPropagation(); removeFromFilterZones(a.zone_id)}}>{a.name}</div>)
                  } else {
                    return (<div key={'item-'+a.zone_id} className="form-item" onClick={e=>{ e.stopPropagation(); addToFilterZones(a.zone_id)}}>{a.name}</div>)
                  }
                })
              }
          </div>
        </div>
      </ModalBox>)
  }
  
  let zonetxt = ""
  try {
    let aantal = filterZones.split(',').length
    if(aantal>1 && aantal<zones.length ) {
      zonetxt = filterZones.split(",").length + " zones";
    } else if( aantal === 1) {
      zonetxt = filterZones;
    }
  } catch(ex) {
    zonetxt = "";
  }
  
  if(zonetxt==="") { zonetxt = "Alle Zones" }
  
  return (
      <div className="filter-item" onClick={e=>{setShowSelect(!showSelect)}}>
        <div className="filter-title">Zones</div>
        <div className="filter-value">{zonetxt}</div>
        { showSelect ? renderZoneZones(zones) : null }
      </div>
    )
}

export default FilteritemZones;