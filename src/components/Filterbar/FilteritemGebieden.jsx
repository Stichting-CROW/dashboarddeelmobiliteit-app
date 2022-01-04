import { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
// import ModalBox from './ModalBox.jsx';
import FilterbarExtended from './FilterbarExtended.jsx';
import './css/FilteritemGebieden.css';

function FilteritemGebieden() {
  const dispatch = useDispatch()

  const gebieden = useSelector(state => {
    return (state.metadata && state.metadata.gebieden) ? state.metadata.gebieden : [];
  });
  
  const filterGebied = useSelector(state => {
    return state.filter ? state.filter.gebied : "";
  });

  const isFilterBarExtendedVisible = useSelector(state => {
    return state.ui ? state.ui['FILTERBAR_EXTENDED'] : false;
  });

  let [filterSearch, setFilterSearch] = useState("");
  
  const setVisibility = (name, visibility) => {
    dispatch({
      type: `SET_VISIBILITY`,
      payload: {
        name: name,
        visibility: visibility
      }
    })
  }

  const unselectGebied = e => {
    e.preventDefault();
    
    dispatch({
      type: 'SET_FILTER_GEBIED',
      payload: ""
    })
  }
  
  const setFilterGebied = (gebied) => {
    dispatch({
      type: 'SET_FILTER_GEBIED',
      payload: gebied
    })
  }
  
  const changeSearchText = e => { setFilterSearch(e.target.value) }

  const clearSearchText = e => { setFilterSearch("") }
  
  const renderSelectGebieden = (gebieden) => {
    const filteredGebieden = gebieden.filter(gebied=>{
      return filterSearch===''|| gebied.name.toLowerCase().includes(filterSearch.toLowerCase())
    })
    return (
      <FilterbarExtended closeFunction={(val) => setVisibility('FILTERBAR_EXTENDED', val)}>
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
              { filterSearch !== "" ?
                <div className="filter-plaats-img-cancel" onClick={clearSearchText} />
                :
                <div className="filter-plaats-img-search" />
              }
            </div>
            </div>
            <div>&nbsp;</div>
          </div>
          <div className="filter-form-values">
            { filterGebied === ""?
                <div key={'item-alle'} className="form-item-selected form-item" onClick={e=>{setVisibility('FILTERBAR_EXTENDED', false)}}>
                  Alle Gebieden
                </div>
                :
                <div key={'item-alle'} className="form-item" onClick={e=>{setVisibility('FILTERBAR_EXTENDED', false);setFilterGebied("")}}>
                  Alle Gebieden
                </div>
            }
            { filteredGebieden.map(a=>{
                if(filterGebied === a.gm_code) {
                  return (<div key={'item-'+a.gm_code} className="form-item-selected form-item" onClick={e=>{setVisibility('FILTERBAR_EXTENDED', false);setFilterGebied("")}}>{a.name}</div>)
                } else {
                  return (<div key={'item-'+a.gm_code} className="form-item" onClick={e=>{setVisibility('FILTERBAR_EXTENDED', false);setFilterGebied(a.gm_code);}}>{a.name}</div>)
                }
              })
            }
          </div>
        </div>
      </FilterbarExtended>
    )
  }
  
  let value = gebieden.find(item=>item.gm_code===filterGebied) || "";
  if(gebieden.length===1) {
    return (
      <div className="filter-plaats-container filter-plaats-not-active">
        <div className="filter-plaats-title" onClick={e=>{setVisibility('FILTERBAR_EXTENDED', !isFilterBarExtendedVisible)}}>Plaats</div>
        <div className="filter-plaats-box-row flex flex-col justify-center">
          <div className="filter-plaats-value " >{value===""?"Alle Gebieden":value.name}</div>
        </div>
      </div>
    )
  }
  
  return (
    <div className="filter-plaats-container">
      <div className="filter-plaats-title" onClick={e=>{setVisibility('FILTERBAR_EXTENDED', !isFilterBarExtendedVisible)}}>Plaats</div>
      <div className="filter-plaats-box-row flex flex-col justify-center">
        <div className={`filter-plaats-value ${value === "" ? 'text-black' : ''}`} onClick={e=>{setVisibility('FILTERBAR_EXTENDED', !isFilterBarExtendedVisible)}}>
          {value === "" ? "Alle Gebieden" : value.name}
        </div>
        { isFilterBarExtendedVisible ? renderSelectGebieden(gebieden) : null }
        {  filterGebied!=="" ?
              <div className="filter-plaats-img-cancel" onClick={unselectGebied} />
            :
              null
        }
        <div className="flex flex-col justify-center h-full">
          <div className="filter-plaats-img-search" onClick={e=>{setVisibility('FILTERBAR_EXTENDED', !isFilterBarExtendedVisible)}} />
        </div>
      </div>
    </div>
  )
}

export default FilteritemGebieden;
