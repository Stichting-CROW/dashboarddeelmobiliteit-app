import React from 'react'; // , {useEffect, useState }
import './DashboardPrestatiesAanbieders.css'
import PermitsMunicipalityView from '../../components/PrestatiesAanbieders/PrestatiesAanbiedersMunicipalityView';
import PermitsOperatorView from '../../components/PrestatiesAanbieders/PrestatiesAanbiedersOperatorView';
import { useSelector } from 'react-redux';
import { StateType } from '../../types/StateType';

interface DashboardPrestatiesAanbiedersProps {

}

function DashboardPrestatiesAanbieders(props: DashboardPrestatiesAanbiedersProps) {
  const activeorganisation = useSelector((state: StateType) => state.filter.gebied);

  // Get query parameters from URL
  const queryParams = new URLSearchParams(window.location.search);

  // Extract specific parameters
  const activeoperator = queryParams.get("operator");
  if(activeoperator !== null) {
    return (
      <div className="DashboardPrestatiesAanbieders pt-4 pb-24">
        <PermitsOperatorView activeoperator={activeoperator} />
      </div>
    )
  } else {
    return (
      <div className="DashboardPrestatiesAanbieders pt-4 pb-24">
        <PermitsMunicipalityView activeorganisation={activeorganisation} />
      </div>
    )
  }
}

export default DashboardPrestatiesAanbieders;
