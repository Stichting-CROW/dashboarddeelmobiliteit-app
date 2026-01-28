import React, { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import { Link } from 'react-router-dom';
import './DashboardPrestatiesAanbieders.css';
import PageTitle from '../../components/common/PageTitle';
import { StateType } from '../../types/StateType';
import { fetchOperators, type OperatorData } from '../../api/operators';
import { getPrettyVehicleTypeName } from '../../helpers/vehicleTypes';

interface DashboardPrestatiesAanbiedersDetailsProps {

}

function DashboardPrestatiesAanbiedersDetails(props: DashboardPrestatiesAanbiedersDetailsProps) {
  const gebieden = useSelector((state: StateType) => state.metadata.gebieden);
  const [operators, setOperators] = useState<OperatorData[]>([]);

  // Get query parameters from URL
  const queryParams = new URLSearchParams(window.location.search);
  const geometryRef = queryParams.get('geometry_ref');
  const operatorCode = queryParams.get('operator');
  const formFactorCode = queryParams.get('form_factor');

  // Fetch operators
  useEffect(() => {
    fetchOperators().then((ops) => {
      if (ops) {
        setOperators(ops);
      }
    });
  }, []);

  // Extract municipality code from geometry_ref (format: cbs:${municipality})
  const municipalityCode = geometryRef?.startsWith('cbs:') 
    ? geometryRef.replace('cbs:', '') 
    : null;

  // Find municipality name
  const municipality = municipalityCode 
    ? gebieden.find((g: any) => g.gm_code === municipalityCode)
    : null;
  const municipalityName = municipality?.name || municipalityCode || 'onbekende gemeente';

  // Find operator name
  const operator = operatorCode 
    ? operators.find((op) => op.system_id === operatorCode)
    : null;
  const operatorName = operator?.name || operatorCode || 'onbekende aanbieder';

  // Get readable form factor name
  const formFactorName = formFactorCode 
    ? getPrettyVehicleTypeName(formFactorCode) || formFactorCode
    : 'onbekend voertuigtype';

  // Build the message
  const message = `Hier zie je de data van gemeente ${municipalityName}, specifiek over de ${formFactorName}en van ${operatorName}.`;

  return (
    <div className="DashboardPrestatiesAanbiedersDetails pt-4 pb-24">
      <PageTitle>Prestaties aanbieders details</PageTitle>
      <p className="my-4">
        {message}
      </p>
      <p className="my-4">
        Wil je een andere combinatie van aanbieder en voertuigtype? {'->'} <Link to="/dashboard/prestaties-aanbieders">Prestaties aanbieders</Link>
      </p>
    </div>
  );
}

export default DashboardPrestatiesAanbiedersDetails;
