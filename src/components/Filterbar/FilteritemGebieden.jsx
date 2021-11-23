import { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import ModalBox from './ModalBox.jsx';
import './css/FilteritemGebieden.css';

function FilteritemGebieden() {
  const dispatch = useDispatch()

  const gebieden = useSelector(state => {
    return (state.metadata && state.metadata.gebieden) ? state.metadata.gebieden : [];
  });
  
  const filterGebied = useSelector(state => {
    return state.filter ? state.filter.gebied : "";
  });
  
  let [showSelect, setShowSelect] = useState(false);
  let [filterSearch, setFilterSearch] = useState("");
  
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
      <ModalBox closeFunction={setShowSelect}>
        <div className="filter-form-selectie">
          <div className="filter-form-search-container">
            <div className="filter-form-title">Selecteer Plaats</div>
            <div className="filter-form-search-container-2">
            <input type="text"
              className="filter-form-search"
              onChange={changeSearchText}
              value={filterSearch}
              placeholder={"zoek"}/>
            {  filterSearch!=="" ?
                  <div className="filter-plaats-img-cancel" onClick={clearSearchText} />
                :
                  <div className="filter-plaats-img-search" />
            }
            </div>
            <div>&nbsp;</div>
          </div>
          <div className="filter-form-values">
            { filterGebied === ""?
                <div key={'item-alle'} className="form-item-selected form-item" onClick={e=>{setShowSelect(false)}}>Alle Gebieden</div>
                :
                <div key={'item-alle'} className="form-item" onClick={e=>{setShowSelect(false);setFilterGebied("")}}>Alle Gebieden</div>
            }
            { filteredGebieden.map(a=>{
                if(filterGebied === a.gm_code) {
                  return (<div key={'item-'+a.gm_code} className="form-item-selected form-item" onClick={e=>{setShowSelect(false);setFilterGebied("")}}>{a.name}</div>)
                } else {
                  return (<div key={'item-'+a.gm_code} className="form-item" onClick={e=>{setShowSelect(false);setFilterGebied(a.gm_code);}}>{a.name}</div>)
                }
              })
            }
          </div>
        </div>
      </ModalBox>
    )
  }
  
  let value = gebieden.find(item=>item.gm_code===filterGebied) || "";
  
  return (
    <div className="filter-plaats-container">
      <div className="filter-plaats-title" onClick={e=>{setShowSelect(!showSelect)}}>Plaats</div>
      <div className="filter-plaats-box-row cursor-pointer flex flex-col justify-center">
        <div className="filter-plaats-value" onClick={e=>{setShowSelect(!showSelect)}}>{value===""?"Alle Gebieden":value.name}</div>
        { showSelect ? renderSelectGebieden(gebieden) : null }
        {  filterGebied!=="" ?
              <div className="filter-plaats-img-cancel" onClick={unselectGebied} />
            :
              null
        }
        <div className="filter-plaats-img-search" onClick={e=>{setShowSelect(!showSelect)}} />
      </div>
    </div>
  )
}

export default FilteritemGebieden;
