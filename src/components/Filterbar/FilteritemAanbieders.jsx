import { useDispatch, useSelector } from 'react-redux';
import './css/FilteritemAanbieders.css';
import {
  DISPLAYMODE_PARK,
  DISPLAYMODE_RENTALS,
  DISPLAYMODE_OTHER,
} from '../../reducers/layers.js';

function FilteritemAanbieders() {
  const dispatch = useDispatch()
  
  const aanbieders = useSelector(state => {
    return (state.metadata && state.metadata.aanbieders) ? state.metadata.aanbieders : [];
  });
  
  const operatorstats = useSelector(state => {
    let stats = undefined;
    
    if(state.layers) {
      switch(state.layers.displaymode) {
        case DISPLAYMODE_PARK:
          stats = (state.vehicles&& state.vehicles.operatorstats) ? state.vehicles.operatorstats : false;
          break;
        case DISPLAYMODE_RENTALS:
          if(state.filter && state.rentals) {
            const key = (state.filter.herkomstbestemming === 'bestemming' ? 'destinations' : 'origins');
            stats = state.rentals[`${key}_operatorstats`] ? state.rentals[`${key}_operatorstats`] : undefined;
          }
          break;
        case DISPLAYMODE_OTHER:
          if(state.metadata && state.filter && state.statsreducer) {
            // calculate total stats (operator can appear in any of the charts)
            let stats = {};
            state.metadata.aanbieders.forEach(a=>{ stats[a.system_id] = 0 });
            Object.keys(stats).forEach(key=>{
              if(key in state.statsreducer.operatorstats_verhuringenchart === true) {
                stats[key]+=state.statsreducer.operatorstats_verhuringenchart[key];
              }
              if(key in state.statsreducer.operatorstats_beschikbarevoertuigenchart === true) {
                stats[key]+=state.statsreducer.operatorstats_verhuringenchart[key];
              }
            })
            
            return stats;
          }
          break;
        default:
          ;
      }
    }
    
    return stats;
  });

  const filterAanbiedersExclude = useSelector(state => {
    return state.filter ? state.filter.aanbiedersexclude : [];
  });
  
  const addTofilterAanbiedersExclude = (aanbieder) => {
    const nexcluded = (filterAanbiedersExclude || '').split(",").length;
    if(nexcluded===aanbieders.length-1) {
      // console.log("needs at least one provider")
      return;
    }

    dispatch({ type: 'ADD_TO_FILTER_AANBIEDERS_EXCLUDE', payload: aanbieder.system_id })
  }
  
  const removeFromfilterAanbiedersExclude = (aanbieder) => {
    dispatch({ type: 'REMOVE_FROM_FILTER_AANBIEDERS_EXCLUDE', payload: aanbieder.system_id })
  }
  
  const clearFilterAanbiedersExclude = e => {
    dispatch({ type: 'CLEAR_FILTER_AANBIEDERS_EXCLUDE', payload: '' })
  }

  // Function that gets executed if user clicks a provider filter
  const clickFilter = provider => {
    // If no filters were set, only show this provider and hide all others
    if(filterAanbiedersExclude==="") {
      // Disable all but the selected provider
      aanbieders.map(x => {
        if(x.system_id !== provider.system_id) {
          addTofilterAanbiedersExclude(x)
        }
        return x;
      })
    }

    // If provider was disabled, re-enable provider
    else {
      addTofilterAanbiedersExclude(provider)
    }
    
  }

  // console.log("aanbieders map operatorstats: ", operatorstats)

  return (
    <div className="filter-aanbieders-container">
      <div className="filter-aanbieders-title-row">
        <div className="filter-aanbieders-title">Aanbieders</div>
        { filterAanbiedersExclude!==''
            ?
            <div className="filter-aanbieders-reset cursor-pointer" onClick={clearFilterAanbiedersExclude}>
              reset
            </div>
            :
            null
        }
      </div>
      <div className="filter-aanbieders-box-row">
        {
          aanbieders.map((aanbieder, idx) => {
            if(operatorstats!==undefined) {
              const notavailable = (operatorstats.length===0 || operatorstats[aanbieder.system_id]===0);
              if(notavailable) {
                return (
                  <div
                    className={`filter-aanbieders-item filter-aanbieders-item-not-active`}
                    key={aanbieder.name} >
                    <div className="filter-aanbieders-marker">
                      <svg viewBox='0 0 30 30' >
                        <line x1={'20%'} y1={'20%'} x2={'80%'} y2={'80%'} stroke="#000000" />
                        <line x1={'20%'} y1={'80%'} x2={'80%'} y2={'20%'} stroke="#000000" />
                      </svg>
                    </div>
                    <div className="filter-aanbieders-itemlabel">
                      { aanbieder.name }
                    </div>
                  </div>
                )
              }
            }
            
            let excluded = filterAanbiedersExclude ? filterAanbiedersExclude.includes(aanbieder.system_id) : false;
            let handler = excluded ?
                e=>{ e.stopPropagation(); removeFromfilterAanbiedersExclude(aanbieder)}
              :
                e=>{ e.stopPropagation(); clickFilter(aanbieder); };
                
            return (
              <div
                className={`filter-aanbieders-item ${excluded ? 'filter-aanbieders-item-not-active' : ''}`}
                onClick={handler}
                key={aanbieder.name}
                >
                <div className="filter-aanbieders-marker">
                  <svg viewBox='0 0 30 30' >
                    <circle cx={'50%'} cy={'50%'} r={'40%'} fill={"#000000"} />
                    <circle cx={'50%'} cy={'50%'} r={'35%'} fill={"#FFFFFF"} />
                    <circle cx={'70%'} cy={'25%'} r={'25%'} fill={aanbieder.color.toString()} />
                  </svg>
                </div>
                <div className="filter-aanbieders-itemlabel">
                  { aanbieder.name }
                </div>
              </div>
            )
          })
        }
      </div>
    </div>
  )
}

export default FilteritemAanbieders;
