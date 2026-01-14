import React from 'react'; // , {useEffect, useState }
import './DashboardPrestatiesAanbieders.css'
import PermitsMunicipalityView from '../../components/PrestatiesAanbieders/PermitsMunicipalityView';
import PermitsOperatorView from '../../components/PrestatiesAanbieders/PermitsOperatorView';
import { useSelector } from 'react-redux';
import { StateType } from '../../types/StateType';

interface DashboardPrestatiesAanbiedersProps {

}

function DashboardPresetatiesAanbieders(props: DashboardPrestatiesAanbiedersProps) {
  const activeorganisation = useSelector((state: StateType) => state.filter.gebied);

  // Get query parameters from URL
  const queryParams = new URLSearchParams(window.location.search);

  // Extract specific parameters
  const activeoperator = queryParams.get("operator");
  if(activeoperator !== null) {
    return (
      <div className="DashboardPresetatiesAanbieders pt-4 pb-24">
        <PermitsOperatorView activeoperator={activeoperator} />
      </div>
    )
  } else {
    return (
      <div className="DashboardPresetatiesAanbieders pt-4 pb-24">
        <PermitsMunicipalityView activeorganisation={activeorganisation} />
      </div>
    )
  }
}

export default DashboardPresetatiesAanbieders;
