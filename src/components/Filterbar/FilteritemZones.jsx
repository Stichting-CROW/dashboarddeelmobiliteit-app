import { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import FilterbarExtended from './FilterbarExtended.jsx';
import './css/FilteritemZones.css';

import {StateType} from '../../types/StateType';

function FilteritemZones({
  zonesToShow,
  beleidszonesRedirect = false
}) {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  
  const zones = useSelector((state: StateType) => {
    return (state.metadata && state.metadata.zones) ? state.metadata.zones : [];
  });
  
  const filterZones = useSelector((state: StateType) => {
    return state.filter ? state.filter.zones : 0;
  });
  
  const filterGebied = useSelector((state: StateType) => {
    return state.filter ? state.filter.gebied : 0;
  });

  const filterOntwikkelingVan = useSelector((state: StateType) =>
    state.filter && state.filter.ontwikkelingvan
      ? new Date(state.filter.ontwikkelingvan)
      : null
  );

  const filterOntwikkelingTot = useSelector((state: StateType) =>
    state.filter && state.filter.ontwikkelingtot
      ? new Date(state.filter.ontwikkelingtot)
      : null
  );
  
  const filterBarExtendedView = useSelector((state: StateType) => {
    return state.ui ? state.ui['FILTERBAR_EXTENDED'] : false;
  });

  let [filterSearch, setFilterSearch] = useState("");

  const getBeleidszonesPath = () => {
    const searchParams = new URLSearchParams();
    if (filterGebied) {
      searchParams.set('gm_code', filterGebied);
    }
    if (filterOntwikkelingVan) {
      searchParams.set('start_date', format(filterOntwikkelingVan, 'yyyy-MM-dd'));
    }
    if (filterOntwikkelingTot) {
      searchParams.set('end_date', format(filterOntwikkelingTot, 'yyyy-MM-dd'));
    }
    const queryString = searchParams.toString();
    return queryString ? `/stats/beleidszones?${queryString}` : '/stats/beleidszones';
  };

  useEffect(() => {
    if (!beleidszonesRedirect || !filterZones) return;
    const customZoneIds = new Set(
      zones
        .filter((z) => z.zone_type === 'custom')
        .map((z) => z.zone_id.toString())
    );
    const selectedIds = filterZones.split(',').map((id) => id.trim()).filter(Boolean);
    const nonCustomIds = selectedIds.filter((id) => !customZoneIds.has(id));
    if (nonCustomIds.length < selectedIds.length) {
      dispatch({
        type: 'SET_FILTER_ZONES',
        payload: nonCustomIds.length > 0 ? nonCustomIds.join(',') : ''
      });
    }
  }, [beleidszonesRedirect, zones, filterZones, dispatch]);

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
    {name: 'Beleidszones', zone_type: 'custom'},
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
  
  const renderBeleidszonesRedirect = () => {
    const beleidszonesPath = getBeleidszonesPath();
    return (
      <div key="zg-custom" className="zone-group-container">
        <span key="zgn-custom" className="zone-group-title">
          Beleidszones
        </span>
        <p className="zone-group-beleidszones-redirect mt-2 text-sm text-gray-600">
          Beleidszone-statistieken vind je nu{' '}
          <a
            href={beleidszonesPath}
            className="text-[#15AEEF] underline"
            onClick={(e) => {
              e.stopPropagation();
              if (
                !e.defaultPrevented &&
                !e.metaKey &&
                !e.ctrlKey &&
                !e.shiftKey &&
                e.button === 0
              ) {
                e.preventDefault();
                navigate(beleidszonesPath);
              }
            }}
          >
            Statistiek: Hubs en verbodsgebieden
          </a>
        </p>
      </div>
    );
  };

  const renderSelectZonesGroup = (group, zonesList) => {
    if (beleidszonesRedirect && group.zone_type === 'custom') {
      return renderBeleidszonesRedirect();
    }

    const groupZones = zonesList.filter(zone=>zone.zone_type===group.zone_type);
    if(groupZones.length===0) { return null }
    
    const sortedZones = groupZones.sort((a,b) => a.name.localeCompare(b.name));

    return (
      <div key={'zg-'+group.zone_type} className="zone-group-container">
        <span key={'zgn-'+group.zone_type} className="zone-group-title">
          {group.name}
        </span>
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

  const selectableZones = beleidszonesRedirect
    ? zones.filter((zone) => zone.zone_type !== 'custom')
    : zones;
  
  let selectedzones = [];
  let zonetxt = ""
  try {
    selectedzones = filterZones.split(',').map((id) => id.trim()).filter(Boolean);
    const visibleSelected = selectedzones.filter((id) =>
      selectableZones.some((zone) => zone.zone_id.toString() === id)
    );
    const aantal = visibleSelected.length;
    if(aantal>1) {
      zonetxt = aantal + " zones";
    } else if (aantal === 1) {
      let thezone = selectableZones.find(zone=>(zone.zone_id.toString()===visibleSelected[0]));
      zonetxt = (thezone && thezone.name) || '';
    }
  } catch(ex) {
    zonetxt = "";
  }
  
  if(zonetxt==="") { zonetxt = "Alle Zones" }
  
  let isActive = filterGebied !== '';

  const filteredZones = selectableZones.filter(zone=>{
    return selectedzones.includes(zone.zone_id.toString())
  })

  if(! isActive) {
    return <></>
  }

  return (
    <div className={`filter-zones-container ${isActive===true ? '':'filter-zones-item-not-active'}`}>
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
        { filterBarExtendedView === 'zones' ? renderSelectZones(selectableZones) : null }
        <div className="ml-3 flex flex-col justify-center h-full">
          <div className="filter-zones-img-search cursor-pointer" onClick={e=>{toggleZones('zones')}} />
        </div>
      </div>
      {(filteredZones && filteredZones.length >= 1) && (
        <div className="filter-zones-zonelist">
        {filteredZones.map(zone => {
          return (
            <div className="filter-zones-zoneitem" key={zone.zone_id}>
              { zone.name}
              <div className="filter-zones-img-zoneitem-cancel" onClick={e=>{ e.stopPropagation(); removeFromFilterZones(zone.zone_id)}}>×</div>
            </div>
          )
        })}
        </div>
      )}
    </div>
  )
}

export default FilteritemZones;