import React from 'react';
import { Pencil, Plus, Trash2 } from 'lucide-react';
import ProviderLabel from '../PrestatiesAanbieders/ProviderLabel';
import DataQualityIndicator from './DataQualityIndicator';
import DataQualityTimeline from './DataQualityTimeline';
import type {
  DataQualityPeriod,
  FeedAvailability,
  ManualRejection,
  OperatorDataQuality,
} from '../../types/DataQuality';
import {
  DATA_TYPES,
  DATA_TYPE_LABELS,
  FEED_STATUS_LABELS,
  ISSUE_OWNER_LABELS,
  STATUS_COLORS,
  describeRejectionDataTypes,
  describeRejectionMunicipalities,
  describeRejectionOperators,
  describeRejectionVehicleTypes,
  formatDateTime,
  formatRejectionPeriod,
  getFeedStatusColor,
} from './dataQualityUtils';
import type { DataQualityLabels } from './useDataQualityLabels';

interface DataQualityCardProps {
  operator: OperatorDataQuality;
  period: DataQualityPeriod;
  now: number;
  labels: DataQualityLabels;
  canEdit: boolean;
  onAddRejection: (systemId: string) => void;
  onEditRejection: (rejection: ManualRejection) => void;
  onDeleteRejection: (rejection: ManualRejection) => void;
}

const formatPct = (value: number): string => `${value.toFixed(1).replace('.', ',')}%`;

const getFeedDetail = (feed: FeedAvailability | undefined): string | undefined => {
  if (!feed || feed.status === 'not_expected' || feed.status === 'unknown') return undefined;
  const parts: string[] = [];
  if (feed.availability_pct !== null) {
    parts.push(`${formatPct(feed.availability_pct)} beschikbaar in periode`);
  }
  if (feed.outages.length > 0) {
    parts.push(`${feed.outages.length} ${feed.outages.length === 1 ? 'storing' : 'storingen'}`);
  }
  return parts.join(' · ') || undefined;
};

const renderFeedTooltip = (feed: FeedAvailability | undefined): React.ReactNode => {
  if (!feed || feed.status === 'unknown') {
    return 'Er is nog geen controle van deze feed uitgevoerd.';
  }
  if (feed.status === 'not_expected') {
    return 'Deze aanbieder levert deze feed niet aan.';
  }
  return (
    <>
      Laatste controle: {formatDateTime(feed.last_checked_at)}
      <br />
      Laatst data ontvangen: {formatDateTime(feed.last_data_received_at)}
      {feed.outages.length > 0 && (
        <>
          <br />
          <b>Storingen in periode:</b>
          {feed.outages.slice(0, 5).map((outage) => (
            <div key={outage.start_time}>{formatRejectionPeriod(outage)}</div>
          ))}
          {feed.outages.length > 5 && <div>en {feed.outages.length - 5} meer</div>}
        </>
      )}
    </>
  );
};

const DataQualityCard = ({
  operator,
  period,
  now,
  labels,
  canEdit,
  onAddRejection,
  onEditRejection,
  onDeleteRejection,
}: DataQualityCardProps) => {
  const rejectionCount = operator.rejections.length;

  return (
    <div className="data-quality-card" id={`data-quality-card-${operator.system_id}`}>
      <div className="flex items-center justify-between gap-2 mb-3">
        <ProviderLabel
          label={labels.getOperatorName(operator.system_id)}
          color={labels.getOperatorColor(operator.system_id)}
        />
        {canEdit && (
          <button
            type="button"
            className="data-quality-icon-button"
            title="Afkeuring toevoegen"
            aria-label="Afkeuring toevoegen"
            onClick={() => onAddRejection(operator.system_id)}
          >
            <Plus className="h-4 w-4" />
          </button>
        )}
      </div>

      <div className="flex flex-col gap-1">
        <DataQualityIndicator
          label="Handmatig afgekeurd"
          valueLabel={rejectionCount > 0 ? `Ja (${rejectionCount})` : 'Nee'}
          color={rejectionCount > 0 ? STATUS_COLORS.issue : STATUS_COLORS.ok}
        />
        {DATA_TYPES.map((dataType) => {
          const feed = operator.feeds[dataType];
          return (
            <DataQualityIndicator
              key={dataType}
              label={`${DATA_TYPE_LABELS[dataType]} feed beschikbaar`}
              valueLabel={FEED_STATUS_LABELS[feed?.status ?? 'unknown']}
              color={getFeedStatusColor(feed?.status)}
              detail={getFeedDetail(feed)}
              tooltip={renderFeedTooltip(feed)}
            />
          );
        })}
      </div>

      <DataQualityTimeline operator={operator} period={period} now={now} />

      {rejectionCount > 0 && (
        <div className="flex flex-col gap-2 mt-3">
          {operator.rejections.map((rejection) => {
            const coversOthers = rejection.system_ids === 'all' || rejection.system_ids.length > 1;
            return (
              <div key={rejection.rejection_id} className="data-quality-rejection">
                <div className="flex items-start justify-between gap-2">
                  <div className="font-semibold">{formatRejectionPeriod(rejection)}</div>
                  {canEdit && (
                    <div className="flex gap-1 shrink-0">
                      <button
                        type="button"
                        className="data-quality-icon-button"
                        title="Afkeuring bewerken"
                        aria-label="Afkeuring bewerken"
                        onClick={() => onEditRejection(rejection)}
                      >
                        <Pencil className="h-4 w-4" />
                      </button>
                      <button
                        type="button"
                        className="data-quality-icon-button"
                        title="Afkeuring verwijderen"
                        aria-label="Afkeuring verwijderen"
                        onClick={() => onDeleteRejection(rejection)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  )}
                </div>
                <dl className="data-quality-rejection-fields">
                  {coversOthers && (
                    <>
                      <dt>Aanbieders</dt>
                      <dd>{describeRejectionOperators(rejection, labels)}</dd>
                    </>
                  )}
                  <dt>Gebied</dt>
                  <dd>{describeRejectionMunicipalities(rejection, labels)}</dd>
                  <dt>Voertuigtype</dt>
                  <dd>{describeRejectionVehicleTypes(rejection, labels)}</dd>
                  <dt>Datatype</dt>
                  <dd>{describeRejectionDataTypes(rejection)}</dd>
                  <dt>Issue owner</dt>
                  <dd>{ISSUE_OWNER_LABELS[rejection.issue_owner]}</dd>
                  {rejection.note && (
                    <>
                      <dt>Notitie</dt>
                      <dd className="whitespace-pre-line">{rejection.note}</dd>
                    </>
                  )}
                </dl>
                <div className="data-quality-rejection-audit">
                  Aangemaakt door {rejection.created_by} op {formatDateTime(rejection.created_at)}
                  {rejection.updated_by && rejection.updated_at && (
                    <>
                      <br />
                      Laatst gewijzigd door {rejection.updated_by} op{' '}
                      {formatDateTime(rejection.updated_at)}
                    </>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default React.memo(DataQualityCard);
