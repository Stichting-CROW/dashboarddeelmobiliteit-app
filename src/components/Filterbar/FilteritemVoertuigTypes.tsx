import React from 'react';
import { useDispatch, useSelector } from 'react-redux';
import './css/FilteritemVoertuigTypes.css';
import VoertuigTypesSelector from '../VoertuigTypesSelector/VoertuigTypesSelector';
import {StateType} from '../../types/StateType';

function FilteritemVoertuigTypes() {
  const dispatch = useDispatch();

  const voertuigtypes = useSelector((state: StateType) => state.metadata.vehicle_types ? state.metadata.vehicle_types || [] : []);

  const filterVoertuigTypesExclude = useSelector((state: StateType) => {
    if(Array.isArray(state.filter.voertuigtypesexclude)) {
      return '';
    }
    return state.filter ? state.filter.voertuigtypesexclude : '';
  }) || '';

  const excludedTypes = filterVoertuigTypesExclude ? filterVoertuigTypesExclude.split(',') : [];
  
  const handleTypeClick = (typeId: string) => {
    if (filterVoertuigTypesExclude === '') {
      // If no filters were set, only show this type and hide all others
      voertuigtypes.forEach(x => {
        if (x.id !== typeId) {
          dispatch({ type: 'ADD_TO_FILTER_VOERTUIGTYPES_EXCLUDE', payload: x.id });
        }
      });
    } else {
      dispatch({ type: 'ADD_TO_FILTER_VOERTUIGTYPES_EXCLUDE', payload: typeId });
    }
  };

  const handleReset = () => {
    dispatch({ type: 'CLEAR_FILTER_VOERTUIGTYPES_EXCLUDE', payload: null });
  };

  return (
    <VoertuigTypesSelector
      voertuigtypes={voertuigtypes}
      excludedTypes={excludedTypes}
      onTypeClick={handleTypeClick}
      onReset={handleReset}
      showReset={filterVoertuigTypesExclude !== ''}
    />
  );
}

export default FilteritemVoertuigTypes;