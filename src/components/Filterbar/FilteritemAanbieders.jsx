import { useDispatch, useSelector } from 'react-redux';
import './css/FilteritemAanbieders.css';

function FilteritemAanbieders() {
  const dispatch = useDispatch()
  
  const aanbieders = useSelector(state => {
    return (state.metadata && state.metadata.aanbieders) ? state.metadata.aanbieders : [];
  });
  
  const filterAanbiedersExclude = useSelector(state => {
    return state.filter ? state.filter.aanbiedersexclude : [];
  });
  
  const addTofilterAanbiedersExclude = (aanbieder) => {
    const nexcluded = filterAanbiedersExclude.split(",").length;
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

  return (
    <div className="filter-aanbieders-container">
      <div className="filter-aanbieders-title-row">
        <div className="filter-aanbieders-title">Aanbieders</div>
        { filterAanbiedersExclude!==''?
            <div className="filter-aanbieders-reset" onClick={clearFilterAanbiedersExclude}>reset</div>
            :
            null
        }
      </div>
      <div className="filter-aanbieders-box-row">
        {
          aanbieders.map((aanbieder, idx) => {
            let excluded = filterAanbiedersExclude ? filterAanbiedersExclude.includes(aanbieder.system_id) : '';
            let handler = excluded ?
                e=>{ e.stopPropagation(); removeFromfilterAanbiedersExclude(aanbieder)}
              :
                e=>{ e.stopPropagation(); addTofilterAanbiedersExclude(aanbieder)};
            
            return (
              <div
                className={`filter-aanbieders-item ${excluded ? ' not-active' : ''}`}
                onClick={handler}
                key={aanbieder.system_id}
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
