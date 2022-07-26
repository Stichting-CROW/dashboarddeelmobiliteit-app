import { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import FilterbarExtended from './FilterbarExtended.jsx';
import './css/FilteritemZones.css';

function FilteritemZones({
  zonesToShow
}) {
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
  
  const filterBarExtendedView = useSelector(state => {
    return state.ui ? state.ui['FILTERBAR_EXTENDED'] : false;
  });

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

  const setVisibility = (name, visibility) => {
    dispatch({
      type: `SET_VISIBILITY`,
      payload: {
        name: name,
        visibility: visibility
      }
    })
  }

  const toggleZones = (val) => {
    setVisibility('FILTERBAR_EXTENDED', val)
  }
  
  const changeSearchText = e => { setFilterSearch(e.target.value) }

  const clearSearchText = e => { setFilterSearch("") }
  
  const zone_groups = [
    {name: 'Stadsdelen', zone_type: 'residential_area'},
    {name: 'Maatwerkzones', zone_type: 'custom'},
    {name: 'Wijken', zone_type: 'neighborhood'},
    // {name: 'Anders', zone_type: 'municipality'},
  ];

  let zone_groups_filtered = [];
  (zonesToShow || [
      'residential_area',
      'custom',
      'neighborhood'
  ]).forEach(zoneType => {
    const zone = zone_groups.filter(x => x.zone_type === zoneType);
    if(zone) zone_groups_filtered.push(zone[0]);
  })
  
  const renderSelectZonesGroup = (group, zones) => {
    const groupZones = zones.filter(zone=>zone.zone_type===group.zone_type);
    
    if(groupZones.length===0) { return null }
    
    const sortedZones = groupZones.sort((a,b) => a.name.localeCompare(b.name));
    
    return (
      <div key={'zg-'+group.zone_type} className="zone-group-container">
        <span key={'zgn-'+group.zone_type} className="zone-group-title">{group.name}</span>
        <div key={'zgi-'+group.zone_type} className="filter-zones-zonelist">
        { sortedZones.map(a=>{
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
    )
  }

  const renderSelectZones = (zones) => {
    const filteredZones = zones.filter(zone=>{
      return filterSearch===''|| zone.name.toLowerCase().includes(filterSearch.toLowerCase())
    })
    
    return (
      <FilterbarExtended
        title="Selecteer een zone"
        closeFunction={(val) => toggleZones(false)}
      >
        <div className="filter-form-selectie">
            <div className="filter-form-search-container mb-3">
              <div className="filter-form-search-container-2">
              <input type="text"
                className="filter-form-search"
                onChange={changeSearchText}
                value={filterSearch}
                autoFocus={true}
                placeholder={"zoek"}/>
              <div className="ml-3 flex flex-col justify-center h-full">
                { filterSearch!=="" ?
                  <div className="filter-zones-img-cancel cursor-pointer" onClick={clearSearchText} />
                  :
                  <div className="filter-zones-img-search cursor-pointer" />
                }
              </div>
            </div>
            <div>&nbsp;</div>
          </div>
          <div className="filter-form-values">
            { zone_groups_filtered.map(group=>{
                return renderSelectZonesGroup(group, filteredZones);
              })}
          </div>
        </div>
      </FilterbarExtended>)
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
    <div className={`filter-zones-container ${isActive===true ? '':'filter-zones-item-not-active'}`}>
      <div className="filter-zones-title" onClick={e=>{isActive && toggleZones('zones')}}>Zones</div>
      <div className="filter-zones-box-row">
        <div
          className={`
            filter-zones-value flex flex-col justify-center cursor-pointer h-full
            ${zonetxt === "Alle Zones" ? 'text-black' : ''}
          `}
          onClick={e=>{isActive && toggleZones('zones')}}
          >
          {zonetxt}
        </div>
        {  filterZones!=="" ?
              <div className="filter-zones-img-cancel" onClick={clearFilterZones}></div>
            :
              null
        }
        { filterBarExtendedView === 'zones' ? renderSelectZones(zones) : null }
        <div className="ml-3 flex flex-col justify-center h-full">
          <div className="filter-zones-img-search cursor-pointer" onClick={e=>{toggleZones('zones')}} />
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
}

export default FilteritemZones;