import React, { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import './DashboardPrestatiesAanbieders.css';
import PermitsMunicipalityView from '../../components/PrestatiesAanbieders/PrestatiesAanbiedersMunicipalityView';
import PermitsOperatorView from '../../components/PrestatiesAanbieders/PrestatiesAanbiedersOperatorView';
import PrestatiesAanbiedersDetailsPanel from '../../components/PrestatiesAanbieders/PrestatiesAanbiedersDetailsPanel';
import { useSelector } from 'react-redux';
import { StateType } from '../../types/StateType';
import {
  PRESTATIES_VIEW_URL_PARAM,
  canToggleViewMode,
  getAanbiederSystemId,
  resolveOperatorSystemId,
  resolvePrestatiesViewMode,
} from '../../helpers/prestatiesAanbiedersViewMode';

interface DashboardPrestatiesAanbiedersProps {}

function DashboardPrestatiesAanbieders(props: DashboardPrestatiesAanbiedersProps) {
  const activeorganisation = useSelector((state: StateType) => state.filter.gebied);
  const aanbieders = useSelector((state: StateType) =>
    state.metadata?.aanbieders ? state.metadata.aanbieders : []
  );
  const aclOperators = useSelector((state: StateType) =>
    state.metadata?.aclOperators ? state.metadata.aclOperators : []
  );
  const metadataLoaded = useSelector(
    (state: StateType) => Boolean(state.metadata?.metadata_loaded)
  );
  const isAdmin = useSelector((state: StateType) =>
    Boolean(state.authentication?.user_data?.acl?.is_admin)
  );

  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const urlView = searchParams.get(PRESTATIES_VIEW_URL_PARAM);
  const viewMode = resolvePrestatiesViewMode(aclOperators, isAdmin, urlView);
  const isMunicipalityView = viewMode === 'municipality';
  const adminCanToggle = canToggleViewMode(isAdmin, aclOperators);

  const urlSystemId = searchParams.get('system_id');
  const urlOperator = searchParams.get('operator');
  const activeoperator = resolveOperatorSystemId(
    aclOperators,
    urlSystemId || urlOperator
  );

  useEffect(() => {
    if (!metadataLoaded) return;
    if (isMunicipalityView) return;
    if (!activeoperator) return;

    if (urlSystemId === activeoperator && urlOperator === activeoperator) {
      return;
    }
    const next = new URLSearchParams(searchParams);
    next.set('system_id', activeoperator);
    next.set('operator', activeoperator);
    navigate(`/stats/prestaties-aanbieders?${next.toString()}`, { replace: true });
  }, [
    metadataLoaded,
    isMunicipalityView,
    activeoperator,
    urlSystemId,
    urlOperator,
    searchParams,
    navigate,
  ]);

  // When admin switches into operator view but no operator is selected yet,
  // default to the first available operator so the view has something to render.
  useEffect(() => {
    if (!metadataLoaded) return;
    if (!adminCanToggle) return;
    if (isMunicipalityView) return;
    if (urlSystemId || urlOperator) return;
    if (aanbieders.length === 0) return;

    const firstOperator = getAanbiederSystemId(aanbieders[0]);
    if (!firstOperator) return;

    const next = new URLSearchParams(searchParams);
    next.set('system_id', firstOperator);
    next.set('operator', firstOperator);
    navigate(`/stats/prestaties-aanbieders?${next.toString()}`, { replace: true });
  }, [
    metadataLoaded,
    adminCanToggle,
    isMunicipalityView,
    urlSystemId,
    urlOperator,
    aanbieders,
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
    newParams.delete('gm_code');
    newParams.delete('form_factor');
    newParams.delete('propulsion_type');
    newParams.delete('fullscreen');
    // In municipality view, also clear the operator so we return to a clean
    // overview. In operator view the URL needs `system_id`/`operator` to keep
    // showing the selected operator's data – otherwise the auto-populate
    // effect would silently switch us to the first operator in the list.
    if (isMunicipalityView) {
      newParams.delete('operator');
      newParams.delete('system_id');
    }
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
