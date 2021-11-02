import { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import ModalBox from './ModalBox.jsx';
import './Filterbar.css';

function FilteritemGebieden() {
  const dispatch = useDispatch()

  const gebieden = useSelector(state => {
    return (state.metadata && state.metadata.gebieden) ? state.metadata.gebieden : [];
  });
  
  const filterGebied = useSelector(state => {
    return state.filter ? state.filter.gebied : "";
  });
  
  let [showSelect, setShowSelect] = useState(false);
  
  const setFilterGebied = (gebied) => {
    dispatch({
      type: 'SET_FILTER_GEBIED',
      payload: gebied
    })
  }
  
  const renderSelectGebieden = (gebieden) => {
    return (
      <ModalBox closeFunction={setShowSelect}>
        <div className="filter-form-selectie">
          <div className="filter-form-title">Selecteer Gebied</div>
            <div className="filter-form-values">
              { filterGebied === ""?
                  <div key={'item-alle'} className="form-item-selected form-item" onClick={e=>{setShowSelect(false)}}>Alle Gebieden</div>
                  :
                  <div key={'item-alle'} className="form-item" onClick={e=>{setShowSelect(false);setFilterGebied("")}}>Alle Gebieden</div>
              }
              { gebieden.map(a=>{
                  if(filterGebied === a.gm_code) {
                    return (<div key={'item-'+a.gm_code} className="form-item-selected form-item" onClick={e=>{setShowSelect(false);setFilterGebied("")}}>{a.name}</div>)
                  } else {
                    return (<div key={'item-'+a.gm_code} className="form-item" onClick={e=>{setShowSelect(false);setFilterGebied(a.gm_code);}}>{a.name}</div>)
                  }
                })
              }
          </div>
        </div>
      </ModalBox>)
  }
  
  let value = gebieden.find(item=>item.gm_code===filterGebied) || "";

  return (
      <div className="filter-item" onClick={e=>{setShowSelect(!showSelect)}}>
        <div className="filter-title">Gebieden</div>
        <div className="filter-value">{value===""?"Alle Gebieden":value.name}</div>
        { showSelect ? renderSelectGebieden(gebieden) : null }
      </div>
    )
}

export default FilteritemGebieden;
