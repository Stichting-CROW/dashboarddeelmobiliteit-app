import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import './css/FilteritemVoertuigTypes.css';
import VoertuigTypeSelector from '../VoertuigTypesSelector/VoertuigTypesSelector';

import {StateType} from '../../types/StateType';

function FilteritemVoertuigTypes() {
  const dispatch = useDispatch()

  const [activeTypes, setActiveTypes] = useState([]);

  const voertuigtypes = useSelector((state: StateType) => state.metadata.vehicle_types ? state.metadata.vehicle_types || [] : []);

  const filterVoertuigTypesExclude = useSelector((state: StateType) => {
    if(Array.isArray(state.filter.voertuigtypesexclude)) {
      return '';
    }
    return state.filter ? state.filter.voertuigtypesexclude : '';
  }) || '';
  
  useEffect(() => {
    const active = voertuigtypes.map(x => x.id).filter(x => {
      return ! filterVoertuigTypesExclude.split(',').includes(x)
    })
    setActiveTypes(active);
  }, [
    voertuigtypes,
    filterVoertuigTypesExclude
  ]);

  const addToFilterVoertuigTypesExclude = (voertuigtype) => {
    const nexcluded = (filterVoertuigTypesExclude || '').split(",").length;
    if(nexcluded===voertuigtypes.length-1) {
      // console.log("needs at least one provider")
      return;
    }

    dispatch({ type: 'ADD_TO_FILTER_VOERTUIGTYPES_EXCLUDE', payload: voertuigtype })
  }
  
  const removeFromFilterVoertuigTypesExclude = (voertuigtype) => {
    // console.log('REMOVE_FROM_FILTER_VOERTUIGTYPES_EXCLUDE %s', voertuigtype)
    dispatch({ type: 'REMOVE_FROM_FILTER_VOERTUIGTYPES_EXCLUDE', payload: voertuigtype })
  }
  
  const clearFilterVoertuigTypesExclude = () => {
    dispatch({ type: 'CLEAR_FILTER_VOERTUIGTYPES_EXCLUDE', payload: null })
  }
  
  // Function that gets executed if user clicks a provider filter
  const clickFilter = type => {
    if(filterVoertuigTypesExclude==="") {
      // Disable all but the selected provider
      voertuigtypes.map(x => {
        if(x.id !== type) {
          addToFilterVoertuigTypesExclude(x.id)
        }
        return x;
      })
    }
    else {
      const excluded = (filterVoertuigTypesExclude ? filterVoertuigTypesExclude: '').split(",").includes(type);

      if(excluded) {
        removeFromFilterVoertuigTypesExclude(type)
      }
      else {
        addToFilterVoertuigTypesExclude(type);
      }
    }

    // console.log('clickFilter', type, filterVoertuigTypesExclude)
    // // console.log("clickfilter [%s]<", filterVoertuigTypesExclude);
    // // If no filters were set, only show this provider and hide all others
    // if(filterVoertuigTypesExclude==="") {
    //   // Disable all but the selected provider
    //   voertuigtypes.map(x => {
    //     if(x.id !== type) {
    //       addToFilterVoertuigTypesExclude(x.id)
    //     }
    //     return x;
    //   })
    // }

    // // If type was disabled, re-enable type
    // else {
    //   addToFilterVoertuigTypesExclude(type)
    // }
  }

  return <>
    {filterVoertuigTypesExclude!=='' ? <div className="
      filter-voertuigtypes-title-row
      relative
    " style={{
      marginTop: '-10px'
    }}>
      <div className="
        text-sm text-right filter-voertuigtypes-reset cursor-pointer w-full"
        onClick={clearFilterVoertuigTypesExclude}
        style={{
          marginTop: '-24px'
        }}
      >
        reset
      </div>
    </div> : ''}
    <VoertuigTypeSelector
      voertuigtypes={voertuigtypes}
      activeTypes={activeTypes}
      onTypeClick={clickFilter}
    />
  </>

  return (
    <div className="w-full filter-voertuigtypes-container">
      {filterVoertuigTypesExclude!=='' ? <div className="filter-voertuigtypes-title-row">
        <div className="text-right filter-voertuigtypes-reset cursor-pointer" onClick={clearFilterVoertuigTypesExclude}>
          reset
        </div>
      </div> : ''}
      <div className="filter-voertuigtypes-box-row">
        {
          voertuigtypes.map((voertuigtype,idx) => {
            let excluded = (filterVoertuigTypesExclude ? filterVoertuigTypesExclude: '').split(",").includes(voertuigtype.id);
            let handler = excluded ?
                e=>{ e.stopPropagation(); removeFromFilterVoertuigTypesExclude(voertuigtype.id)}
              :
                e=>{ e.stopPropagation(); clickFilter(voertuigtype.id)};
              
            let baseClassName = `${excluded ? "filter-voertuigtypes-item-excluded": "filter-voertuigtypes-item"}`;
            let extraclass = "";
            switch(voertuigtype.id) {
              case "bicycle": extraclass = "filter-voertuigtypes-icon-bicycle"; break;
              case "cargo_bicycle": extraclass = "filter-voertuigtypes-icon-cargo-bicycle"; break;
              case "moped": extraclass = "filter-voertuigtypes-icon-scooter"; break;
              case "car": extraclass = "filter-voertuigtypes-icon-car"; break;
              case "unknown" : extraclass = "filter-voertuigtypes-icon-other"; break;
              default:
                break;
            }
                
            return (
              <div className={`flex-1 ${baseClassName}${idx===voertuigtypes.length-1?' filter-voertuigtypes-item-last':''}`} key={voertuigtype.id} onClick={handler}>
                <div className={`filter-voertuigtypes-icon ${extraclass}`} onClick={handler} />
                <div className="filter-voertuigtypes-itemlabel">
                  { voertuigtype.name }
                </div>
              </div>)
          })
        }
      </div>
    </div>
  )
}

export default FilteritemVoertuigTypes;