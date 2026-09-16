import { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import FilterbarExtended from './FilterbarExtended.jsx';
import useFilterbarExtended from '../../customHooks/useFilterbarExtended';
import { readable_geotype } from '../../helpers/policy-hubs/common';
import { themes } from '../../themes';
import './css/FilteritemZones.css';

import {StateType} from '../../types/StateType';

const ALL_GEOGRAPHY_TYPES = ['monitoring', 'stop', 'no_parking'];

const GEOGRAPHY_TYPE_FILTERS = [
  {
    name: 'monitoring',
    title: 'Analyse',
    color: themes.zone.monitoring.primaryColor,
  },
  {
    name: 'stop',
    title: 'Hubs',
    color: themes.zone.stop.primaryColor,
  },
  {
    name: 'no_parking',
    title: 'Verbodsgebieden',
    color: themes.zone.no_parking.primaryColor,
  },
];

function renderZoneTypeMarker(geography_type) {
  if (!geography_type) return null;
  const label = readable_geotype(geography_type);
  if (!label) return null;
  const color = themes.zone[geography_type]?.primaryColor;
  return (
    <span className="filter-zones-type">
      <span
        className="filter-zones-type-dot"
        style={{ backgroundColor: color }}
      />
      {label}
    </span>
  );
}

function FilteritemZones({
  zonesToShow,
  beleidszonesRedirect = false,
  showGeographyTypeFilter = false
}) {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { openView, close, isViewActive } = useFilterbarExtended();
  
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

  let [filterSearch, setFilterSearch] = useState("");
  const [activeGeographyTypes, setActiveGeographyTypes] = useState(
    [...ALL_GEOGRAPHY_TYPES]
  );

  // Reset the search field whenever the panel is closed so that reopening it
  // always starts from a clean state.
  const isPanelOpen = isViewActive('zones');
  useEffect(() => {
    if (!isPanelOpen) {
      setFilterSearch("");
      setActiveGeographyTypes([...ALL_GEOGRAPHY_TYPES]);
    }
  }, [isPanelOpen]);

  // Clicking a type while all types are active narrows down to just that
  // type. Further clicks add/remove types; deselecting the last active type
  // resets to all available types.
  const toggleGeographyType = (type, availableTypes) => {
    setActiveGeographyTypes((prev) => {
      const allActive = availableTypes.every((t) => prev.includes(t));
      if (allActive) {
        return [type];
      }
      if (prev.includes(type)) {
        const next = prev.filter((t) => t !== type);
        return next.length === 0 ? [...availableTypes] : next;
      }
      return [...prev, type];
    });
  };

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

  const toggleZones = (val) => {
    if (val === false) {
      close();
      return;
    }
    openView(val);
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
              " onClick={e=>{ e.stopPropagation(); removeFromFilterZones(a.zone_id)}}>
                {a.name}
                {renderZoneTypeMarker(a.geography_type)}
              </div>)
            } else {
              return (<div key={'item-'+a.zone_id} className="
                form-item
                cursor-pointer
              " onClick={e=>{ e.stopPropagation(); addToFilterZones(a.zone_id)}}>
                {a.name}
                {renderZoneTypeMarker(a.geography_type)}
              </div>)
            }
          })
        }
        </div>
      </div>
    )
  }

  const renderSelectZones = (zones) => {
    // Only offer type filters for types that actually occur in the list
    const availableGeographyTypes = ALL_GEOGRAPHY_TYPES.filter((type) =>
      zones.some((zone) => zone.geography_type === type)
    );
    const geographyTypeFilters = GEOGRAPHY_TYPE_FILTERS.filter((x) =>
      availableGeographyTypes.includes(x.name)
    );
    const doShowGeographyTypeFilter =
      showGeographyTypeFilter && geographyTypeFilters.length > 1;

    const filteredZones = zones.filter(zone=>{
      const matchesSearch = filterSearch===''||
        zone.name.toLowerCase().includes(filterSearch.toLowerCase());
      if (!matchesSearch) return false;
      if (!doShowGeographyTypeFilter) return true;
      if (!zone.geography_type) return true;
      return activeGeographyTypes.includes(zone.geography_type);
    })
    
    return (
      <FilterbarExtended
        title="Selecteer een zone"
        closeFunction={close}
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
            {doShowGeographyTypeFilter && (
              <div className="filter-zones-geotype-filter">
                {geographyTypeFilters.map((x) => {
                  const isActive = activeGeographyTypes.includes(x.name);
                  return (
                    <div
                      key={x.name}
                      className={`filter-zones-geotype-option${
                        isActive ? ' is-active' : ''
                      }`}
                      style={{
                        backgroundColor: isActive ? x.color : '',
                        flex: x.name === 'no_parking' ? 2 : 1,
                      }}
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleGeographyType(x.name, availableGeographyTypes);
                      }}
                    >
                      {x.title}
                    </div>
                  );
                })}
              </div>
            )}
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
        { isViewActive('zones') ? renderSelectZones(selectableZones) : null }
        <div className="ml-3 flex flex-col justify-center h-full">
          <div className="filter-zones-img-search cursor-pointer" onClick={e=>{toggleZones('zones')}} />
        </div>
      </div>
      {(filteredZones && filteredZones.length >= 1) && (
        <div className="filter-zones-zonelist">
        {filteredZones.map(zone => {
          return (
            <div className="filter-zones-zoneitem" key={zone.zone_id}>
              {zone.name}
              {renderZoneTypeMarker(zone.geography_type)}
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