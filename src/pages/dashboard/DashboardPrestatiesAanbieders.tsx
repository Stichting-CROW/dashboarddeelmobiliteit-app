import React from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import './DashboardPrestatiesAanbieders.css';
import PermitsMunicipalityView from '../../components/PrestatiesAanbieders/PrestatiesAanbiedersMunicipalityView';
import PermitsOperatorView from '../../components/PrestatiesAanbieders/PrestatiesAanbiedersOperatorView';
import PrestatiesAanbiedersDetailsPanel from '../../components/PrestatiesAanbieders/PrestatiesAanbiedersDetailsPanel';
import { useSelector } from 'react-redux';
import { StateType } from '../../types/StateType';

interface DashboardPrestatiesAanbiedersProps {}

function DashboardPrestatiesAanbieders(props: DashboardPrestatiesAanbiedersProps) {
  const activeorganisation = useSelector((state: StateType) => state.filter.gebied);

  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const activeoperator = searchParams.get('operator');
  const detailGmCode = searchParams.get('gm_code');
  const detailOperator = searchParams.get('operator') || searchParams.get('system_id');
  const detailFormFactor = searchParams.get('form_factor');

  const showDetailsPanel = Boolean(detailGmCode && detailOperator && detailFormFactor);

  const handleCloseDetailsPanel = () => {
    const newParams = new URLSearchParams(searchParams);
    newParams.delete('operator');
    newParams.delete('system_id');
    newParams.delete('form_factor');
    const queryString = newParams.toString();
    navigate(`/dashboard/prestaties-aanbieders${queryString ? `?${queryString}` : ''}`);
  };

  const overviewContent =
    activeoperator !== null ? (
      <PermitsMunicipalityView activeorganisation={activeorganisation} />
    ) : (
      <PermitsMunicipalityView activeorganisation={activeorganisation} />
    );

  if (showDetailsPanel) {
    return (
      <div className="DashboardPrestatiesAanbieders DashboardPrestatiesAanbieders--split h-screen overflow-hidden">
        <div className="DashboardPrestatiesAanbieders__overview pr-4 sm:pr-12">
          {overviewContent}
        </div>
        <div className="DashboardPrestatiesAanbieders__details flex-1 h-full overflow-y-auto pb-20">
          <PrestatiesAanbiedersDetailsPanel onClose={handleCloseDetailsPanel} />
        </div>
      </div>
    );
  }

  return (
    <div className="DashboardPrestatiesAanbieders pt-12 pb-24">
      {overviewContent}
    </div>
  );
}

export default DashboardPrestatiesAanbieders;
