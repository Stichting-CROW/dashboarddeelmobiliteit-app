import React, { useMemo } from 'react';
import Select from 'react-select';

import { DATA_TYPE_LABELS, FeedDataType, FeedSummary } from '../../types/FeedType';

import Button from '../Button/Button';
import FeedStatusBadge from './FeedStatusBadge';
import { FeedFilters, filterFeeds, formatDateTime, OperatorOption } from './feedUtils';

interface FeedListProps {
  feeds: FeedSummary[];
  operatorOptions: OperatorOption[];
  filters: FeedFilters;
  onFiltersChange: (filters: FeedFilters) => void;
  onOpenFeed: (feedId: number) => void;
  onNewFeed: () => void;
}

const DATA_TYPE_OPTIONS = (Object.keys(DATA_TYPE_LABELS) as FeedDataType[])
  .map((dataType) => ({ value: dataType, label: DATA_TYPE_LABELS[dataType] }));

const FeedList = ({ feeds, operatorOptions, filters, onFiltersChange, onOpenFeed, onNewFeed }: FeedListProps) => {
  const visibleFeeds = useMemo(() => filterFeeds(feeds, filters), [feeds, filters]);
  const inactiveCount = useMemo(
    () => filterFeeds(feeds, { ...filters, showInactive: true }).length - filterFeeds(feeds, filters).length,
    [feeds, filters]
  );
  // Only offer operators that have feeds, so every choice gives results.
  const usedOperatorOptions = useMemo(() => {
    const systemIds = new Set(feeds.map((feed) => feed.system_id));
    return operatorOptions.filter((option) => systemIds.has(option.value));
  }, [feeds, operatorOptions]);
  const operatorLabels = useMemo(
    () => new Map(operatorOptions.map((option) => [option.value, option.label])),
    [operatorOptions]
  );

  return (
    <div className="FeedList">
      <div className="flex flex-wrap items-end gap-3 mb-4">
        <div style={{ minWidth: '260px' }}>
          <label className="block text-sm font-bold mb-1" htmlFor="feedOperatorFilter">Aanbieder</label>
          <Select
            inputId="feedOperatorFilter"
            isClearable={true}
            options={usedOperatorOptions}
            value={usedOperatorOptions.find((option) => option.value === filters.operator) || null}
            placeholder="Alle aanbieders"
            noOptionsMessage={() => 'Geen aanbieders gevonden'}
            onChange={(choice: any) => onFiltersChange({ ...filters, operator: choice ? choice.value : null })}
          />
        </div>
        <div style={{ minWidth: '200px' }}>
          <label className="block text-sm font-bold mb-1" htmlFor="feedDataTypeFilter">Datatype</label>
          <Select
            inputId="feedDataTypeFilter"
            isClearable={true}
            options={DATA_TYPE_OPTIONS}
            value={DATA_TYPE_OPTIONS.find((option) => option.value === filters.dataType) || null}
            placeholder="Alle datatypes"
            onChange={(choice: any) => onFiltersChange({ ...filters, dataType: choice ? choice.value : null })}
          />
        </div>
        <div style={{ minWidth: '200px' }}>
          <label className="block text-sm font-bold mb-1" htmlFor="feedSearch">Zoeken</label>
          <input
            id="feedSearch"
            type="search"
            className="rounded border px-2 text-sm w-full"
            style={{ height: '38px', borderColor: 'hsl(0, 0%, 80%)' }}
            placeholder="Feedtype, URL, opmerking of id"
            value={filters.search}
            onChange={(e) => onFiltersChange({ ...filters, search: e.target.value })}
          />
        </div>
        <label className="flex items-center gap-2 text-sm cursor-pointer" style={{ height: '38px' }}>
          <input
            type="checkbox"
            checked={filters.showInactive}
            onChange={(e) => onFiltersChange({ ...filters, showInactive: e.target.checked })}
          />
          Toon inactieve feeds{!filters.showInactive && inactiveCount > 0 ? ` (${inactiveCount})` : ''}
        </label>
        <div className="ml-auto">
          <Button theme="primary" type="button" onClick={onNewFeed}>Nieuwe feed</Button>
        </div>
      </div>

      <p className="text-sm text-gray-600 mb-2">
        {visibleFeeds.length} van {feeds.length} feeds
      </p>

      <div className="overflow-x-auto">
        <table className="FeedManagement-table FeedList-table text-sm w-full">
          <thead>
            <tr>
              <th>Id</th>
              <th>Aanbieder</th>
              <th>Datatype</th>
              <th>Feedtype</th>
              <th>Status</th>
              <th>Laatste import</th>
              <th>URL</th>
              <th>Auth.</th>
            </tr>
          </thead>
          <tbody>
            {visibleFeeds.map((feed) => (
              <tr
                key={feed.feed_id}
                className="cursor-pointer"
                tabIndex={0}
                onClick={() => onOpenFeed(feed.feed_id)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') onOpenFeed(feed.feed_id);
                }}
              >
                <td>{feed.feed_id}</td>
                <td>{operatorLabels.get(feed.system_id) || feed.system_id}</td>
                <td>{DATA_TYPE_LABELS[feed.data_type]}</td>
                <td className="font-mono text-xs">{feed.feed_type}</td>
                <td><FeedStatusBadge feed={feed} /></td>
                <td className="whitespace-nowrap">{formatDateTime(feed.last_time_succesfully_imported)}</td>
                <td className="font-mono text-xs FeedList-url" title={feed.feed_url}>{feed.feed_url}</td>
                <td className="text-xs">{feed.authentication_type || '-'}</td>
              </tr>
            ))}
            {visibleFeeds.length === 0 && (
              <tr>
                <td colSpan={8} className="text-gray-600">Geen feeds gevonden met deze filters.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default FeedList;
