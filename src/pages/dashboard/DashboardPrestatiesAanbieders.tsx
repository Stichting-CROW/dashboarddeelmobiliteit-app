import React, { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import './DashboardPrestatiesAanbieders.css';
import PermitsMunicipalityView from '../../components/PrestatiesAanbieders/PrestatiesAanbiedersMunicipalityView';
import PermitsOperatorView from '../../components/PrestatiesAanbieders/PrestatiesAanbiedersOperatorView';
import PrestatiesAanbiedersDetailsPanel from '../../components/PrestatiesAanbieders/PrestatiesAanbiedersDetailsPanel';
import { useSelector } from 'react-redux';
import { StateType } from '../../types/StateType';
import {
  isOperatorPrestatiesView,
  resolveOperatorSystemId,
} from '../../helpers/prestatiesAanbiedersViewMode';

interface DashboardPrestatiesAanbiedersProps {}

function DashboardPrestatiesAanbieders(props: DashboardPrestatiesAanbiedersProps) {
  const activeorganisation = useSelector((state: StateType) => state.filter.gebied);
  const gebieden = useSelector((state: StateType) =>
    state.metadata?.gebieden ? state.metadata.gebieden : []
  );
  const aanbieders = useSelector((state: StateType) =>
    state.metadata?.aanbieders ? state.metadata.aanbieders : []
  );
  const metadataLoaded = useSelector(
    (state: StateType) => Boolean(state.metadata?.metadata_loaded)
  );

  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const isMunicipalityView = !isOperatorPrestatiesView(gebieden, aanbieders);
  const activeoperator = resolveOperatorSystemId(
    aanbieders,
    searchParams.get('system_id') || searchParams.get('operator')
  );

  const urlSystemId = searchParams.get('system_id');
  const urlOperator = searchParams.get('operator');

  useEffect(() => {
    if (!metadataLoaded) return;
    if (!isMunicipalityView && activeoperator) {
      if (urlSystemId === activeoperator && urlOperator === activeoperator) {
        return;
      }
      const next = new URLSearchParams(searchParams);
      next.set('system_id', activeoperator);
      next.set('operator', activeoperator);
      navigate(`/stats/prestaties-aanbieders?${next.toString()}`, { replace: true });
    }
  }, [
    metadataLoaded,
    isMunicipalityView,
    activeoperator,
    urlSystemId,
    urlOperator,
    searchParams,
    navigate,
  ]);

  const detailGmCode = searchParams.get('gm_code');
  const detailOperator = searchParams.get('operator') || searchParams.get('system_id');
  const detailFormFactor = searchParams.get('form_factor');
  const isFullscreen = searchParams.get('fullscreen') === '1';

  const showDetailsPanel = Boolean(detailGmCode && detailOperator && detailFormFactor);

  const handleCloseDetailsPanel = () => {
    const newParams = new URLSearchParams(searchParams);
    newParams.delete('operator');
    newParams.delete('system_id');
    newParams.delete('form_factor');
    newParams.delete('propulsion_type');
    newParams.delete('fullscreen');
    const queryString = newParams.toString();
    navigate(`/stats/prestaties-aanbieders${queryString ? `?${queryString}` : ''}`);
  };

  const handleToggleFullscreen = () => {
    const newParams = new URLSearchParams(searchParams);
    if (isFullscreen) {
      newParams.delete('fullscreen');
    } else {
      newParams.set('fullscreen', '1');
    }
    const queryString = newParams.toString();
    navigate(`/stats/prestaties-aanbieders${queryString ? `?${queryString}` : ''}`, { replace: true });
  };

  let overviewContent: React.ReactNode;
  if (!metadataLoaded) {
    overviewContent = (
      <div className="permits-loading-state">Prestaties aanbieders laden...</div>
    );
  } else if (isMunicipalityView) {
    overviewContent = <PermitsMunicipalityView activeorganisation={activeorganisation} />;
  } else {
    overviewContent = <PermitsOperatorView activeoperator={activeoperator} />;
  }

  const containerClassNames = [
    'DashboardPrestatiesAanbieders',
    showDetailsPanel && 'DashboardPrestatiesAanbieders--split',
    showDetailsPanel && isFullscreen && 'DashboardPrestatiesAanbieders--fullscreen',
    showDetailsPanel ? 'h-screen' : 'pt-12 pb-24',
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <div className={containerClassNames}>
      {!isFullscreen && (
        <div className={showDetailsPanel ? 'DashboardPrestatiesAanbieders__overview pr-4 sm:pr-12' : ''}>
          {overviewContent}
        </div>
      )}

      {showDetailsPanel && (
        <div className="DashboardPrestatiesAanbieders__details flex-1 h-full overflow-y-auto pb-20">
          <PrestatiesAanbiedersDetailsPanel
            onClose={handleCloseDetailsPanel}
            onToggleFullscreen={handleToggleFullscreen}
            isFullscreen={isFullscreen}
          />
        </div>
      )}
    </div>
  );
}

export default DashboardPrestatiesAanbieders;
