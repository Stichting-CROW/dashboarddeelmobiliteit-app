import { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import ModalBox from './ModalBox.jsx';
import './Filterbar.css';

function FilteritemAanbieders() {
  const dispatch = useDispatch()
  
  const aanbieders = useSelector(state => {
    return (state.metadata && state.metadata.aanbieders) ? state.metadata.aanbieders : [];
  });
  
  const filterAanbieders = useSelector(state => {
    return state.filter ? state.filter.aanbieders : "";
  });
  
  let [showSelect, setShowSelect] = useState(false);
  
  const addToFilterAanbieders = (aanbieder) => {
    dispatch({ type: 'ADD_TO_FILTER_AANBIEDERS', payload: aanbieder })
  }
  const removeFromFilterAanbieders = (aanbieder) => {
    dispatch({ type: 'REMOVE_FROM_FILTER_AANBIEDERS', payload: aanbieder })
  }
  
  const renderSelectAanbieders = (aanbieders) => {
    return (
      <ModalBox closeFunction={setShowSelect}>
        <div className="filter-form-selectie">
            <div className="filter-form-title">Selecteer Aanbieders</div>
            <div className="filter-form-values">
            { aanbieders.map((a,i) => {
                let isSelected = filterAanbieders.includes(a.system_id);
                if(isSelected) {
                  return (<div key={'item-'+a.system_id} className="form-item-selected form-item" onClick={e=>{ e.stopPropagation(); removeFromFilterAanbieders(a.system_id)}}>{a.name}</div>)
                } else {
                  return (<div key={'item-'+a.system_id} className="form-item" onClick={e=>{ e.stopPropagation(); addToFilterAanbieders(a.system_id)}}>{a.name}</div>)
                }
              })
            }
            </div>
        </div>
      </ModalBox>
    );
  }
  
  let aanbiedertxt = ""
  try {
    let aantal = filterAanbieders.split(',').length
    if(aantal>1 && aantal<aanbieders.length ) {
      aanbiedertxt = filterAanbieders.split(",").length + " aanbieders";
    } else if( aantal === 1) {
      aanbiedertxt = filterAanbieders;
    }
  } catch(ex) {
    aanbiedertxt = "";
  }
  
  if(aanbiedertxt==="") { aanbiedertxt = "Alle Aanbieders" }
  
  return (
      <div className="filter-item" onClick={e=>{setShowSelect(!showSelect)}}>
        <div className="filter-title">Aanbieders</div>
        <div className="filter-value">{aanbiedertxt}</div>
        { showSelect ? renderSelectAanbieders(aanbieders) : null }
      </div>
    )
}

export default FilteritemAanbieders;
