import React, { useCallback, useMemo, useState } from 'react';
import moment from 'moment';
import { useSelector } from 'react-redux';
import { Download, Plus } from 'lucide-react';
import '../../components/Datakwaliteit/Datakwaliteit.css';
import PageTitle from '../../components/common/PageTitle';
import { Button } from '../../components/ui/button';
import { Skeleton } from '../../components/ui/skeleton';
import { TooltipProvider } from '../../components/ui/tooltip';
import DataQualityCard from '../../components/Datakwaliteit/DataQualityCard';
import ManualRejectionDialog from '../../components/Datakwaliteit/ManualRejectionDialog';
import { useDataQualityData } from '../../components/Datakwaliteit/useDataQualityData';
import { useDataQualityLabels } from '../../components/Datakwaliteit/useDataQualityLabels';
import {
  buildRejectionCsvColumns,
  sortOperators,
} from '../../components/Datakwaliteit/dataQualityUtils';
import { downloadCsvFile, slugifyForFilename, toCsv } from '../../helpers/csv';
import { isAdmin } from '../../helpers/authentication.js';
import { StateType } from '../../types/StateType';
import type { ManualRejection } from '../../types/DataQuality';

interface DialogState {
  rejection: ManualRejection | null;
  defaultSystemId: string | null;
}

function DashboardDatakwaliteit() {
  const canEdit = useSelector((state: StateType) => isAdmin(state));
  const gmCode: string | null = useSelector((state: StateType) => state.filter?.gebied || null);
  const labels = useDataQualityLabels();
  const {
    operators,
    visibleRejections,
    period,
    now,
    loading,
    error,
    isDemoData,
    saveRejection,
    removeRejection,
  } = useDataQualityData();

  const [dialog, setDialog] = useState<DialogState | null>(null);

  const sortedOperators = useMemo(
    () => sortOperators(operators, labels.getOperatorName),
    [operators, labels.getOperatorName]
  );

  const handleAddRejection = useCallback((systemId: string | null) => {
    setDialog({ rejection: null, defaultSystemId: systemId });
  }, []);

  const handleEditRejection = useCallback((rejection: ManualRejection) => {
    setDialog({ rejection, defaultSystemId: null });
  }, []);

  const handleDeleteRejection = useCallback((rejection: ManualRejection) => {
    const coversMultiple = rejection.system_ids === 'all' || rejection.system_ids.length > 1;
    const message = coversMultiple
      ? 'Deze afkeuring geldt voor meerdere aanbieders en wordt bij allemaal verwijderd. ' +
        'Weet je zeker dat je deze afkeuring wilt verwijderen?'
      : 'Weet je zeker dat je deze afkeuring wilt verwijderen?';
    if (!window.confirm(message)) return;
    removeRejection(rejection.rejection_id);
  }, [removeRejection]);

  const handleDownloadCsv = () => {
    if (!period) return;
    const csv = toCsv(visibleRejections, buildRejectionCsvColumns(labels));
    const area = gmCode ? labels.getMunicipalityName(gmCode) : 'nederland';
    const from = moment(period.start).format('YYYY-MM-DD');
    const to = moment(period.end - 1).format('YYYY-MM-DD');
    downloadCsvFile(csv, `afkeuringen-${slugifyForFilename(area)}-${from}-${to}`);
  };

  let content: React.ReactNode;
  if (!period) {
    content = <div className="permits-loading-state">Periode laden...</div>;
  } else if (loading && operators.length === 0) {
    content = (
      <div className="data-quality-grid">
        {[0, 1, 2].map((i) => <Skeleton key={i} className="h-72 w-96 rounded-lg" />)}
      </div>
    );
  } else if (error) {
    content = <div className="permits-error-state">{error}</div>;
  } else if (operators.length === 0) {
    content = (
      <div className="permits-empty-state">
        Er zijn geen aanbieders met data gevonden voor deze periode en dit gebied.
      </div>
    );
  } else {
    content = (
      <TooltipProvider delayDuration={300}>
        <div className="data-quality-grid">
          {sortedOperators.map((operator) => (
            <DataQualityCard
              key={operator.system_id}
              operator={operator}
              period={period}
              now={now}
              labels={labels}
              canEdit={canEdit}
              onAddRejection={handleAddRejection}
              onEditRejection={handleEditRejection}
              onDeleteRejection={handleDeleteRejection}
            />
          ))}
        </div>
      </TooltipProvider>
    );
  }

  return (
    <div className="DashboardDatakwaliteit pt-12 pb-24">
      <div className="flex flex-wrap items-center gap-4 mb-4">
        <PageTitle className="mb-0 mr-4">Datakwaliteit</PageTitle>
        <div className="flex flex-wrap gap-2">
          {canEdit && (
            <Button type="button" size="sm" onClick={() => handleAddRejection(null)}>
              <Plus className="h-4 w-4 mr-1" />
              Afkeuring toevoegen
            </Button>
          )}
          <Button
            type="button"
            size="sm"
            variant="outline"
            onClick={handleDownloadCsv}
            disabled={visibleRejections.length === 0}
          >
            <Download className="h-4 w-4 mr-1" />
            Download afkeuringen (CSV)
          </Button>
        </div>
      </div>

      <p className="text-sm text-gray-600 mb-6 max-w-3xl">
        Per aanbieder zie je of data handmatig is afgekeurd en of de feeds voor aanbod,
        verhuringen en servicegebieden beschikbaar zijn. Feeds worden elke 5 minuten
        gecontroleerd. Houd bij analyses rekening met afgekeurde periodes en storingen.
      </p>

      {isDemoData && (
        <div className="data-quality-demo-notice">
          Demomodus: dit is voorbeelddata. Wijzigingen worden niet opgeslagen.
        </div>
      )}

      {content}

      {dialog && (
        <ManualRejectionDialog
          key={dialog.rejection?.rejection_id ?? `new-${dialog.defaultSystemId ?? ''}`}
          rejection={dialog.rejection}
          defaultSystemId={dialog.defaultSystemId}
          labels={labels}
          onSave={saveRejection}
          onClose={() => setDialog(null)}
        />
      )}
    </div>
  );
}

export default DashboardDatakwaliteit;
