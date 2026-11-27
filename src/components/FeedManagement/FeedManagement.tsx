import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { useSelector } from 'react-redux';

import { StateType } from '../../types/StateType';
import { AclType } from '../../types/AclType';
import { FeedDataType, FeedSummary, VehicleTypeOption, DATA_TYPE_LABELS } from '../../types/FeedType';
import { getFeeds, getFeedVehicleTypes } from '../../api/feeds';
import { fetchOperators, getCachedOperators, OperatorData } from '../../api/operators';

import EditFeed from './EditFeed';
import FeedDetails from './FeedDetails';
import FeedList from './FeedList';
import { buildOperatorOptions, FeedFilters } from './feedUtils';

import './FeedManagement.css';

interface FeedManagementProps {
  acl: AclType | any;
}

const filtersFromSearchParams = (searchParams: URLSearchParams): FeedFilters => {
  const dataType = searchParams.get('type');
  return {
    operator: searchParams.get('operator') || null,
    dataType: dataType && dataType in DATA_TYPE_LABELS ? dataType as FeedDataType : null,
    showInactive: searchParams.get('inactive') === '1',
    search: searchParams.get('q') || '',
  };
};

const filtersToSearchParams = (filters: FeedFilters): URLSearchParams => {
  const params = new URLSearchParams();
  if (filters.operator) params.set('operator', filters.operator);
  if (filters.dataType) params.set('type', filters.dataType);
  if (filters.showInactive) params.set('inactive', '1');
  if (filters.search) params.set('q', filters.search);
  return params;
};

/**
 * Management of the feeds the importer reads (super admins only). Credentials
 * are never part of the list; they are only fetched on an explicit request.
 */
const FeedManagement = ({ acl }: FeedManagementProps) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { feedId } = useParams();
  const [searchParams, setSearchParams] = useSearchParams();
  const token = useSelector((state: StateType) => (
    state.authentication.user_data && state.authentication.user_data.token
  ) || null);

  const [feeds, setFeeds] = useState<FeedSummary[] | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [vehicleTypes, setVehicleTypes] = useState<VehicleTypeOption[]>([]);
  const [operators, setOperators] = useState<OperatorData[]>(() => getCachedOperators() || []);

  const isNew = location.pathname.replace(/\/$/, '').endsWith('/admin/feeds/new');
  const filters = useMemo(() => filtersFromSearchParams(searchParams), [searchParams]);
  const operatorOptions = useMemo(() => buildOperatorOptions(operators, feeds || []), [operators, feeds]);
  const listSearch: string = (location.state as any)?.listSearch || '';

  useEffect(() => {
    if (!acl || Object.keys(acl).length === 0) return;
    if (acl.is_admin !== true) navigate('/');
  }, [acl, navigate]);

  const loadFeeds = useCallback(async () => {
    if (!token) return;
    try {
      setFeeds(await getFeeds(token));
      setLoadError(null);
    } catch (e: any) {
      setLoadError(e?.message || 'onbekende fout');
    }
  }, [token]);

  useEffect(() => {
    loadFeeds();
  }, [loadFeeds]);

  useEffect(() => {
    if (!token) return;
    getFeedVehicleTypes(token)
      .then(setVehicleTypes)
      .catch((e) => console.error('Error loading vehicle types', e));
  }, [token]);

  useEffect(() => {
    fetchOperators().then((result) => {
      if (result) setOperators(result);
    });
  }, []);

  const replaceFeed = (saved: FeedSummary) => {
    setFeeds((previous) => {
      const others = (previous || []).filter((feed) => feed.feed_id !== saved.feed_id);
      return [...others, saved].sort((a, b) => (
        a.system_id.localeCompare(b.system_id) || a.data_type.localeCompare(b.data_type) || a.feed_id - b.feed_id
      ));
    });
  };

  const openFeed = (id: number) => {
    navigate(`/admin/feeds/${id}`, { state: { listSearch: location.search } });
  };

  const backToList = () => navigate(`/admin/feeds${listSearch}`);

  if (loadError) {
    return (
      <div className="rounded-lg border px-3 py-2 text-sm bg-red-50 border-red-300 text-red-800" role="status">
        De feeds konden niet geladen worden: {loadError}
      </div>
    );
  }
  if (!feeds) {
    return <p className="text-sm text-gray-600">Feeds worden geladen...</p>;
  }

  if (isNew) {
    return (
      <div className="FeedManagement">
        <EditFeed
          token={token}
          feed={null}
          vehicleTypes={vehicleTypes}
          operatorOptions={operatorOptions}
          onSaved={(saved) => {
            replaceFeed(saved);
            navigate(`/admin/feeds/${saved.feed_id}`, { state: { listSearch } });
          }}
          onCancel={backToList}
        />
      </div>
    );
  }

  if (feedId) {
    const feed = feeds.find((x) => String(x.feed_id) === feedId);
    if (!feed) {
      return (
        <div className="FeedManagement text-sm">
          <p>Feed {feedId} bestaat niet.</p>
          <button type="button" className="underline bg-transparent p-0" onClick={backToList}>
            Terug naar alle feeds
          </button>
        </div>
      );
    }
    return (
      <div className="FeedManagement">
        <FeedDetails
          token={token}
          feed={feed}
          vehicleTypes={vehicleTypes}
          operatorOptions={operatorOptions}
          onChanged={replaceFeed}
          onBack={backToList}
        />
      </div>
    );
  }

  return (
    <div className="FeedManagement">
      <p className="mb-4 text-sm text-gray-700" style={{ maxWidth: '800px' }}>
        Beheer de datafeeds die de importer ophaalt. Credentials worden niet getoond, tenzij je daar
        per feed om vraagt. Wijzigingen aan actieve feeds moet je expliciet bevestigen.
      </p>
      <FeedList
        feeds={feeds}
        operatorOptions={operatorOptions}
        filters={filters}
        onFiltersChange={(next) => setSearchParams(filtersToSearchParams(next), { replace: true })}
        onOpenFeed={openFeed}
        onNewFeed={() => navigate('/admin/feeds/new', { state: { listSearch: location.search } })}
      />
    </div>
  );
};

export default FeedManagement;
