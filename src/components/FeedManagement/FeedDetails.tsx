import React, { useEffect, useState } from 'react';
import { ArrowLeft } from 'lucide-react';

import {
  DATA_TYPE_LABELS,
  FeedSummary,
  FeedUpdate,
  FeedValidationResult as FeedValidationResultType,
  VehicleTypeOption
} from '../../types/FeedType';
import { updateFeed, validateFeed } from '../../api/feeds';

import Button from '../Button/Button';
import ConfirmFeedChangeModal from './ConfirmFeedChangeModal';
import EditFeed from './EditFeed';
import FeedCredentials from './FeedCredentials';
import FeedStatusBadge from './FeedStatusBadge';
import FeedValidationResult from './FeedValidationResult';
import { describeChanges, formatDateTime, OperatorOption } from './feedUtils';

interface FeedDetailsProps {
  token: string;
  feed: FeedSummary;
  vehicleTypes: VehicleTypeOption[];
  operatorOptions: OperatorOption[];
  onChanged: (feed: FeedSummary) => void;
  onBack: () => void;
}

const FeedDetails = ({ token, feed, vehicleTypes, operatorOptions, onChanged, onBack }: FeedDetailsProps) => {
  const [isEditing, setIsEditing] = useState<boolean>(false);
  const [validation, setValidation] = useState<FeedValidationResultType | null>(null);
  const [validationError, setValidationError] = useState<string | null>(null);
  const [isValidating, setIsValidating] = useState<boolean>(false);
  const [validatedAt, setValidatedAt] = useState<string | null>(null);
  const [pendingUpdate, setPendingUpdate] = useState<FeedUpdate | null>(null);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [notice, setNotice] = useState<string | null>(null);

  useEffect(() => {
    setIsEditing(false);
    setValidation(null);
    setValidationError(null);
    setValidatedAt(null);
    setNotice(null);
  }, [feed.feed_id]);

  const operatorLabel = operatorOptions.find((option) => option.value === feed.system_id)?.label || feed.system_id;
  const vehicleTypeLabel = (id: number): string => {
    const option = vehicleTypes.find((x) => x.vehicle_type_id === id);
    return option ? option.label : `#${id}`;
  };
  // A validation only counts for the configuration that was saved when it ran.
  const hasValidPassed = validation !== null && validation.valid && validatedAt === feed.last_time_updated;

  const handleValidate = async () => {
    setIsValidating(true);
    setValidationError(null);
    try {
      setValidation(await validateFeed(token, { feed_id: feed.feed_id }));
      setValidatedAt(feed.last_time_updated);
    } catch (e: any) {
      setValidation(null);
      setValidationError(e?.message || 'onbekende fout');
    } finally {
      setIsValidating(false);
    }
  };

  const handleConfirmActiveChange = async () => {
    if (!pendingUpdate) return;
    setIsSaving(true);
    try {
      const saved = await updateFeed(token, pendingUpdate);
      setPendingUpdate(null);
      setNotice(saved.is_active ? 'De feed is geactiveerd.' : 'De feed is gedeactiveerd.');
      onChanged(saved);
    } catch (e: any) {
      setPendingUpdate(null);
      setNotice(`Opslaan mislukt: ${e?.message || 'onbekende fout'}`);
    } finally {
      setIsSaving(false);
    }
  };

  if (isEditing) {
    return (
      <EditFeed
        token={token}
        feed={feed}
        vehicleTypes={vehicleTypes}
        operatorOptions={operatorOptions}
        onSaved={(saved) => {
          setIsEditing(false);
          setNotice('De wijzigingen zijn opgeslagen.');
          onChanged(saved);
        }}
        onCancel={() => setIsEditing(false)}
      />
    );
  }

  const isActivating = pendingUpdate?.is_active === true;

  return (
    <div className="FeedDetails" style={{ maxWidth: '900px' }}>
      <button
        type="button"
        className="inline-flex items-center gap-1 text-sm underline bg-transparent p-0 mb-4"
        onClick={onBack}
      >
        <ArrowLeft size={14} /> Terug naar alle feeds
      </button>

      <div className="flex items-center gap-3 flex-wrap mb-1">
        <h2 className="text-lg font-semibold m-0">{operatorLabel}</h2>
        <FeedStatusBadge feed={feed} />
      </div>
      <p className="text-sm text-gray-600 mb-4">
        Feed {feed.feed_id} · {DATA_TYPE_LABELS[feed.data_type]} · {feed.feed_type}
      </p>

      {notice && (
        <div className="rounded-lg border px-3 py-2 text-sm mb-4 bg-blue-50 border-blue-300 text-blue-800" role="status">
          {notice}
        </div>
      )}

      <div className="mb-4" style={{ marginLeft: '-0.5rem' }}>
        <Button theme="primary" type="button" onClick={handleValidate} disabled={isValidating}>
          {isValidating ? 'Bezig met valideren...' : 'Valideer feed'}
        </Button>
        <Button theme="white" type="button" onClick={() => setIsEditing(true)}>
          Bewerken
        </Button>
        <Button
          theme="white"
          type="button"
          onClick={() => setPendingUpdate({ feed_id: feed.feed_id, is_active: !feed.is_active })}
        >
          {feed.is_active ? 'Deactiveren...' : 'Activeren...'}
        </Button>
      </div>

      <dl className="FeedManagement-dl text-sm mb-4">
        <dt>URL</dt>
        <dd className="font-mono break-all">{feed.feed_url}</dd>
        <dt>Authenticatie</dt>
        <dd>{feed.authentication_type || 'geen'}</dd>
        <dt>Request headers</dt>
        <dd>{feed.request_header_names.length > 0 ? feed.request_header_names.join(', ') : 'geen'}</dd>
        {feed.data_type === 'vehicles' && <><dt>Importstrategie</dt><dd>{feed.import_strategy}</dd></>}
        {feed.data_type !== 'service_areas' && (
          <>
            <dt>Standaard voertuigtype</dt>
            <dd>{feed.default_vehicle_type !== null ? vehicleTypeLabel(feed.default_vehicle_type) : 'geen'}</dd>
          </>
        )}
        {feed.data_type === 'trips' && (
          <>
            <dt>Ritten importeren vanaf</dt>
            <dd>{feed.trip_import_start_date ? feed.trip_import_start_date.slice(0, 10) : 'standaard'}</dd>
          </>
        )}
        <dt>Opmerkingen</dt>
        <dd className="whitespace-pre-wrap">{feed.remarks || '-'}</dd>
        <dt>Laatst gewijzigd</dt>
        <dd>{formatDateTime(feed.last_time_updated)}</dd>
        <dt>Laatste succesvolle import</dt>
        <dd>{formatDateTime(feed.last_time_succesfully_imported)}</dd>
        {feed.down_since && <><dt>Storing sinds</dt><dd>{formatDateTime(feed.down_since)}</dd></>}
        {feed.ignore_disruptions_in_feed_until && (
          <><dt>Storingen genegeerd tot</dt><dd>{formatDateTime(feed.ignore_disruptions_in_feed_until)}</dd></>
        )}
      </dl>

      <div className="mb-6">
        <FeedCredentials token={token} feedId={feed.feed_id} />
      </div>

      <FeedValidationResult result={validation} isLoading={isValidating} error={validationError} />

      <ConfirmFeedChangeModal
        isVisible={pendingUpdate !== null}
        title={isActivating ? `Feed ${feed.feed_id} activeren` : `Feed ${feed.feed_id} deactiveren`}
        systemId={feed.system_id}
        changes={pendingUpdate ? describeChanges(feed, pendingUpdate, vehicleTypeLabel) : []}
        requireTypedConfirmation={isActivating ? !hasValidPassed : true}
        typedConfirmationReason={isActivating
          ? 'De importer gaat deze feed direct ophalen.'
          : 'Er wordt geen data van deze feed meer geïmporteerd.'}
        warning={isActivating && !hasValidPassed
          ? 'Deze feed is nog niet succesvol gevalideerd. Valideer de feed eerst, zodat je zeker weet dat de importer hem kan verwerken.'
          : undefined}
        confirmTitle={isActivating ? 'Activeren' : 'Deactiveren'}
        isSaving={isSaving}
        onConfirm={handleConfirmActiveChange}
        onCancel={() => setPendingUpdate(null)}
      />
    </div>
  );
};

export default FeedDetails;
