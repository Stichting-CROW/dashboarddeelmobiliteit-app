import React from 'react';

import { FeedSummary } from '../../types/FeedType';
import { FeedStatusKey, getFeedStatus } from './feedUtils';

const STATUS_CLASSES: Record<FeedStatusKey, string> = {
  ok: 'bg-green-100 text-green-800',
  down: 'bg-red-100 text-red-800',
  never_imported: 'bg-orange-100 text-orange-800',
  inactive: 'bg-gray-200 text-gray-700',
};

const FeedStatusBadge = ({ feed }: { feed: FeedSummary }) => {
  const status = getFeedStatus(feed);
  return (
    <span className={`inline-block rounded-full px-2 py-0.5 text-xs whitespace-nowrap ${STATUS_CLASSES[status.key]}`}>
      {status.label}
    </span>
  );
};

export default FeedStatusBadge;
