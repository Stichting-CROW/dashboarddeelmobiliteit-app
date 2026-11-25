import React from 'react';
import { Plus } from 'lucide-react';
import ProviderLabel from '../PrestatiesAanbieders/ProviderLabel';
import DataQualityIndicator from './DataQualityIndicator';
import DataQualityTimeline from './DataQualityTimeline';
import RejectionDetails from './RejectionDetails';
import FeedNameList from './FeedNameList';
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
  STATUS_COLORS,
  describeFeedShare,
  formatDateTime,
  formatRejectionPeriod,
  getFeedStatusColor,
  getFeedsDownBetween,
  getIndividualFeeds,
  getOfflineFeeds,
  getRejectionsForDataType,
  hasMultipleFeeds,
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

const getRejectionSubtitle = (rejections: ManualRejection[]): string | undefined => {
  if (rejections.length === 0) return undefined;
  if (rejections.length === 1) {
    return `Handmatig afgekeurd: ${formatRejectionPeriod(rejections[0])}`;
  }
  return `Handmatig afgekeurd: ${rejections.length} periodes`;
};

const getStatusLabel = (feed: FeedAvailability | undefined): string => {
  const label = FEED_STATUS_LABELS[feed?.status ?? 'unknown'];
  const offlineCount = getOfflineFeeds(feed).length;
  if (feed?.status !== 'unavailable' || !hasMultipleFeeds(feed) || offlineCount === 0) {
    return label;
  }
  return `${label} (${offlineCount}/${getIndividualFeeds(feed).length})`;
};

const renderFeedTooltip = (
  feed: FeedAvailability | undefined,
  now: number
): React.ReactNode => {
  if (!feed || feed.status === 'unknown') {
    return 'Er is nog geen controle van deze feed uitgevoerd.';
  }
  if (feed.status === 'not_expected') {
    return 'Deze aanbieder levert deze feed niet aan.';
  }
  const multipleFeeds = hasMultipleFeeds(feed);
  const feedCount = getIndividualFeeds(feed).length;
  const offlineFeeds = getOfflineFeeds(feed);
  return (
    <>
      Laatste controle: {formatDateTime(feed.last_checked_at)}
      <br />
      Laatst data ontvangen: {formatDateTime(feed.last_data_received_at)}
      {multipleFeeds && (
        <>
          <br />
          {offlineFeeds.length > 0
            ? <b>Nu offline: {describeFeedShare(offlineFeeds.length, feedCount)}</b>
            : `Alle ${feedCount} feeds online`}
          <FeedNameList feeds={offlineFeeds} total={feedCount} showDownSince />
        </>
      )}
      {feed.outages.length > 0 && (
        <>
          <b className="block mt-1">Storingen in periode:</b>
          {feed.outages.slice(0, 5).map((outage) => {
            const start = new Date(outage.start_time).getTime();
            const end = outage.end_time ? new Date(outage.end_time).getTime() : now;
            const feedsDown = multipleFeeds ? getFeedsDownBetween(feed, start, end, now) : [];
            return (
              <div key={outage.start_time}>
                {formatRejectionPeriod(outage)}
                {feedsDown.length > 0 && (
                  <> ({describeFeedShare(feedsDown.length, feedCount)})</>
                )}
                <FeedNameList feeds={feedsDown} total={feedCount} max={3} />
              </div>
            );
          })}
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
        {DATA_TYPES.map((dataType) => {
          const feed = operator.feeds[dataType];
          const feedRejections = getRejectionsForDataType(operator.rejections, dataType);
          const isRejected = feedRejections.length > 0;
          return (
            <DataQualityIndicator
              key={dataType}
              label={`${DATA_TYPE_LABELS[dataType]} feed beschikbaar`}
              valueLabel={
                isRejected
                  ? `Afgekeurd${feedRejections.length > 1 ? ` (${feedRejections.length})` : ''}`
                  : getStatusLabel(feed)
              }
              color={isRejected ? STATUS_COLORS.issue : getFeedStatusColor(feed?.status)}
              subtitle={getRejectionSubtitle(feedRejections)}
              detail={getFeedDetail(feed)}
              tooltip={renderFeedTooltip(feed, now)}
              valuePopoverLabel={isRejected ? 'details afkeuring tonen' : undefined}
              renderValuePopover={isRejected ? (close) => (
                <div className="flex flex-col gap-2">
                  {feedRejections.map((rejection) => (
                    <RejectionDetails
                      key={rejection.rejection_id}
                      rejection={rejection}
                      labels={labels}
                      canEdit={canEdit}
                      onEdit={(r) => { close(); onEditRejection(r); }}
                      onDelete={(r) => { close(); onDeleteRejection(r); }}
                    />
                  ))}
                </div>
              ) : undefined}
            />
          );
        })}
      </div>

      <DataQualityTimeline operator={operator} period={period} now={now} />

      {operator.rejections.length > 0 && (
        <div className="flex flex-col gap-2 mt-3">
          {operator.rejections.map((rejection) => (
            <RejectionDetails
              key={rejection.rejection_id}
              rejection={rejection}
              labels={labels}
              canEdit={canEdit}
              onEdit={onEditRejection}
              onDelete={onDeleteRejection}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default React.memo(DataQualityCard);
