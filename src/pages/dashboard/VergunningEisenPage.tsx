import React from 'react'; // , {useEffect, useState }
import './VergunningEisenPage.css'
import PermitsMunicipalityView from '../../components/Permits/PermitsMunicipalityView';
import PermitsOperatorView from '../../components/Permits/PermitsOperatorView';
import { useSelector } from 'react-redux';
import { StateType } from '../../types/StateType';

interface VergunningEisenPageProps {

}

function VergunningEisenPage(props: VergunningEisenPageProps) {
  console.log('***Render VergunningEisenPage');
  
  const activeorganisation = useSelector((state: StateType) => state.filter.gebied);

  // Get query parameters from URL
  const queryParams = new URLSearchParams(window.location.search);

  // Extract specific parameters
  const activeoperator = queryParams.get("operator");
  if(activeoperator !== null) {
    return (
      <div className="VergunningEisenPage pt-4 pb-24">
        <PermitsOperatorView activeoperator={activeoperator} />
      </div>
    )
  } else {
    return (
      <div className="VergunningEisenPage pt-4 pb-24">
        <PermitsMunicipalityView activeorganisation={activeorganisation} />
      </div>
    )
  }
}

export default VergunningEisenPage;
