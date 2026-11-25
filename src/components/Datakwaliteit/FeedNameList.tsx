import React from 'react';
import type { IndividualFeed } from '../../types/DataQuality';
import { formatDateTime, getDownSince } from './dataQualityUtils';
import './Datakwaliteit.css';

interface FeedNameListProps {
  feeds: IndividualFeed[];
  /** Number of feeds of the data type; the list is hidden when all of them are listed */
  total: number;
  /** Show since when each feed is offline */
  showDownSince?: boolean;
  max?: number;
}

const FeedNameList = ({ feeds, total, showDownSince = false, max = 5 }: FeedNameListProps) => {
  if (feeds.length === 0 || feeds.length >= total) return null;
  return (
    <ul className="data-quality-feed-list">
      {feeds.slice(0, max).map((feed) => {
        const downSince = showDownSince ? getDownSince(feed) : null;
        return (
          <li key={feed.feed_id}>
            {feed.name}
            {downSince && <> (sinds {formatDateTime(downSince)})</>}
          </li>
        );
      })}
      {feeds.length > max && <li>en {feeds.length - max} meer</li>}
    </ul>
  );
};

export default FeedNameList;
