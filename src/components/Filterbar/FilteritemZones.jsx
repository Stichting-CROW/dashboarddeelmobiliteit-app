import { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import ModalBox from './ModalBox.jsx';
import './css/FilteritemZones.css';

function FilteritemZones() {
  const dispatch = useDispatch()
  
  const zones = useSelector(state => {
    return (state.metadata && state.metadata.zones) ? state.metadata.zones : [];
  });
  
  const filterZones = useSelector(state => {
    return state.filter ? state.filter.zones : 0;
  });
  
  const filterGebied = useSelector(state => {
    return state.filter ? state.filter.gebied : 0;
  });
  
  let [showSelect, setShowSelect] = useState(false);
  let [filterSearch, setFilterSearch] = useState("");
  
  const addToFilterZones = (zone) => {
    dispatch({ type: 'ADD_TO_FILTER_ZONES', payload: zone })
  }
  
  const removeFromFilterZones = (zone) => {
    dispatch({ type: 'REMOVE_FROM_FILTER_ZONES', payload: zone })
  }
  
  const clearFilterZones = () => {
    dispatch({ type: 'CLEAR_FILTER_ZONES', payload: null })
  }

  const changeSearchText = e => { setFilterSearch(e.target.value) }

  const clearSearchText = e => { setFilterSearch("") }

  const renderSelectZones = (zones) => {
    const filteredZones = zones.filter(zone=>{
      return filterSearch===''|| zone.name.toLowerCase().includes(filterSearch.toLowerCase())
    })
    
    return (
      <ModalBox closeFunction={setShowSelect}>
        <div className="filter-form-selectie">
            <div className="filter-form-search-container mb-3">
              <div className="filter-form-title">Selecteer Zones</div>
              <div className="filter-form-search-container-2">
              <input type="text"
                className="filter-form-search"
                onChange={changeSearchText}
                value={filterSearch}
                placeholder={"zoek"}/>
              <div className="ml-3 flex flex-col justify-center h-full">
                {  filterSearch!=="" ?
                      <div className="filter-zones-img-cancel cursor-pointer" onClick={clearSearchText} />
                    :
                      <div className="filter-zones-img-search cursor-pointer" />
                }
              </div>
              </div>
              <div>&nbsp;</div>
            </div>
            <div className="filter-form-values">
              { filteredZones.map(a=>{
                  let isSelected = filterZones.includes(a.zone_id);
                  if(isSelected) {
                    return (<div key={'item-'+a.zone_id} className="
                      form-item-selected
                      form-item
                      cursor-pointer
                    " onClick={e=>{ e.stopPropagation(); removeFromFilterZones(a.zone_id)}}>{a.name}</div>)
                  } else {
                    return (<div key={'item-'+a.zone_id} className="
                      form-item
                      cursor-pointer
                    " onClick={e=>{ e.stopPropagation(); addToFilterZones(a.zone_id)}}>{a.name}</div>)
                  }
                })
              }
          </div>
        </div>
      </ModalBox>)
  }
  
  let selectedzones = [];
  let zonetxt = ""
  try {
    selectedzones = filterZones.split(',')
    let aantal = selectedzones.length;
    if(aantal>1) {
      zonetxt = aantal + " zones";
    } else {
      let thezone = zones.find(zone=>(zone.zone_id.toString()===selectedzones[0]));
      zonetxt = (thezone && thezone.name) || '';
    }
  } catch(ex) {
    zonetxt = "";
  }
  
  if(zonetxt==="") { zonetxt = "Alle Zones" }
  
  let isActive = filterGebied !== '';
  
  const filteredZones = zones.filter(zone=>{
    return selectedzones.includes(zone.zone_id.toString())
  })
  
  if(! isActive) {
    return <></>
  }

  return (
    <div className={`filter-zones-container ${isActive===true ? '':'not-active'}`}>
      <div className="filter-zones-title" onClick={e=>{isActive && setShowSelect(!showSelect)}}>Zones</div>
      <div className="filter-zones-box-row">
        <div
          className={`
            filter-zones-value flex flex-col justify-center cursor-pointer h-full
            ${zonetxt === "Alle Zones" ? 'text-black' : ''}
          `}
          onClick={e=>{isActive && setShowSelect(!showSelect)}}
          >
          {zonetxt}
        </div>
        {  filterZones!=="" ?
              <div className="filter-zones-img-cancel" onClick={clearFilterZones}></div>
            :
              null
        }
        { showSelect ? renderSelectZones(zones) : null }
        <div className="ml-3 flex flex-col justify-center h-full">
          <div className="filter-zones-img-search cursor-pointer" onClick={e=>{setShowSelect(!showSelect)}} />
        </div>
      </div>
      <div className="filter-zones-zonelist">
      {
        filteredZones.map(zone => {
          return (
            <div className="filter-zones-zoneitem" key={zone.zone_id}>
              { zone.name}
              <div className="filter-zones-img-zoneitem-cancel" onClick={e=>{ e.stopPropagation(); removeFromFilterZones(zone.zone_id)}}>×</div>
            </div>
          )
        })
      }
      </div>
    </div>
  )
  
  // return (
  //     <div className="filter-item" onClick={e=>{setShowSelect(!showSelect)}}>
  //       <div className="filter-title">Zones</div>
  //       <div className="filter-value">{zonetxt}</div>
  //       { showSelect ? renderSelectZones(zones) : null }
  //     </div>
  //   )
}

export default FilteritemZones;