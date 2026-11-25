import React, { useMemo, useState } from 'react';
import { Eye, EyeOff, Plus, Trash2 } from 'lucide-react';

import {
  AUTHENTICATION_TYPES,
  DATA_TYPE_LABELS,
  FEED_TYPES_BY_DATA_TYPE,
  FeedCredentials,
  FeedDataType,
  FeedSummary,
  FeedUpdate,
  FeedValidationResult as FeedValidationResultType,
  IMPORT_STRATEGIES,
  VehicleTypeOption
} from '../../types/FeedType';
import { createFeed, getFeedCredentials, updateFeed, validateFeed } from '../../api/feeds';

import Button from '../Button/Button';
import FormLabel from '../FormLabel/FormLabel';
import Modal from '../Modal/Modal.jsx';
import ConfirmFeedChangeModal from './ConfirmFeedChangeModal';
import FeedValidationResult from './FeedValidationResult';
import {
  applyCredentials,
  AUTH_FIELDS,
  buildCreatePayload,
  buildUpdatePayload,
  buildValidateRequest,
  CredentialSection,
  describeChanges,
  emptyFormValues,
  FeedFormValues,
  formValuesFromFeed,
  isRiskyChange,
  OperatorOption,
  validateFormValues
} from './feedUtils';

interface EditFeedProps {
  token: string;
  /** null to create a new feed */
  feed: FeedSummary | null;
  vehicleTypes: VehicleTypeOption[];
  operatorOptions: OperatorOption[];
  onSaved: (feed: FeedSummary) => void;
  onCancel: () => void;
}

const INPUT_CLASSES = 'rounded-lg border-solid border-2 px-2 py-2 text-sm w-full';

const SecretInput = ({
  id,
  value,
  multiline,
  onChange
}: {
  id: string;
  value: string;
  multiline?: boolean;
  onChange: (value: string) => void;
}) => {
  const [isVisible, setIsVisible] = useState<boolean>(false);
  return (
    <div className="flex items-start gap-2">
      {multiline && isVisible ? (
        <textarea
          id={id}
          className={`${INPUT_CLASSES} font-mono text-xs`}
          rows={6}
          autoComplete="off"
          value={value}
          onChange={(e) => onChange(e.target.value)}
        />
      ) : (
        <input
          id={id}
          type={isVisible ? 'text' : 'password'}
          className={`${INPUT_CLASSES} font-mono`}
          autoComplete="new-password"
          value={value}
          onChange={(e) => onChange(e.target.value)}
        />
      )}
      <button
        type="button"
        className="p-2 bg-transparent text-gray-600 hover:text-gray-900"
        title={isVisible ? 'Verberg' : 'Toon'}
        aria-label={isVisible ? 'Verberg' : 'Toon'}
        onClick={() => setIsVisible(!isVisible)}
      >
        {isVisible ? <EyeOff size={16} /> : <Eye size={16} />}
      </button>
    </div>
  );
};

const FieldError = ({ error }: { error?: string }) => (
  error ? <p className="text-xs text-red-700 mt-1 mb-0" role="alert">{error}</p> : null
);

const EditFeed = ({ token, feed, vehicleTypes, operatorOptions, onSaved, onCancel }: EditFeedProps) => {
  const isNew = feed === null;
  const [values, setValues] = useState<FeedFormValues>(() => (feed ? formValuesFromFeed(feed) : emptyFormValues()));
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [credentials, setCredentials] = useState<FeedCredentials | null>(null);
  const [loadingSection, setLoadingSection] = useState<CredentialSection | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const [validation, setValidation] = useState<FeedValidationResultType | null>(null);
  const [validationSignature, setValidationSignature] = useState<string | null>(null);
  const [validationError, setValidationError] = useState<string | null>(null);
  const [isValidating, setIsValidating] = useState<boolean>(false);

  const [pendingUpdate, setPendingUpdate] = useState<FeedUpdate | null>(null);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [doShowDiscardModal, setDoShowDiscardModal] = useState<boolean>(false);

  const validateRequest = useMemo(() => buildValidateRequest(values, feed), [values, feed]);
  const currentSignature = JSON.stringify(validateRequest);
  const isValidationCurrent = validation !== null && validationSignature === currentSignature;

  const update = useMemo(
    () => (feed ? buildUpdatePayload(feed, values, credentials) : null),
    [feed, values, credentials]
  );
  const isDirty = feed
    ? Object.keys(update).length > 1
    : JSON.stringify(values) !== JSON.stringify(emptyFormValues());

  const vehicleTypeLabel = (id: number): string => {
    const option = vehicleTypes.find((x) => x.vehicle_type_id === id);
    return option ? option.label : `#${id}`;
  };

  const setValue = <K extends keyof FeedFormValues>(key: K, value: FeedFormValues[K]) => {
    setValues((previous) => ({ ...previous, [key]: value }));
    setNotice(null);
  };

  const setDataType = (dataType: FeedDataType) => {
    setValues((previous) => ({
      ...previous,
      data_type: dataType,
      feed_type: FEED_TYPES_BY_DATA_TYPE[dataType].includes(previous.feed_type)
        ? previous.feed_type
        : FEED_TYPES_BY_DATA_TYPE[dataType][0],
    }));
  };

  const setAuthenticationValue = (key: string, value: string) => {
    setValues((previous) => ({
      ...previous,
      authentication_values: { ...previous.authentication_values, [key]: value },
    }));
  };

  const setHeader = (index: number, key: 'name' | 'value', value: string) => {
    setValues((previous) => ({
      ...previous,
      request_headers: previous.request_headers.map((row, i) => (i === index ? { ...row, [key]: value } : row)),
    }));
  };

  /** Opens a credential section for editing, filled with the stored values. */
  const openSection = async (section: CredentialSection) => {
    if (!feed) return;
    setLoadingSection(section);
    try {
      const stored = credentials || await getFeedCredentials(token, feed.feed_id);
      setCredentials(stored);
      setValues((previous) => applyCredentials(previous, stored, [section]));
    } catch (e: any) {
      setNotice(`De huidige gegevens konden niet geladen worden: ${e?.message || 'onbekende fout'}`);
    } finally {
      setLoadingSection(null);
    }
  };

  const handleValidate = async () => {
    const formErrors = validateFormValues(values, isNew);
    setErrors(formErrors);
    if (Object.keys(formErrors).length > 0) return;
    setIsValidating(true);
    setValidationError(null);
    const signature = currentSignature;
    try {
      const result = await validateFeed(token, validateRequest);
      setValidation(result);
      setValidationSignature(signature);
    } catch (e: any) {
      setValidation(null);
      setValidationError(e?.message || 'onbekende fout');
    } finally {
      setIsValidating(false);
    }
  };

  const handleSave = async () => {
    const formErrors = validateFormValues(values, isNew);
    setErrors(formErrors);
    if (Object.keys(formErrors).length > 0) {
      setNotice('Controleer de gemarkeerde velden.');
      return;
    }
    if (isNew) {
      setIsSaving(true);
      try {
        onSaved(await createFeed(token, buildCreatePayload(values)));
      } catch (e: any) {
        setNotice(`Aanmaken mislukt: ${e?.message || 'onbekende fout'}`);
      } finally {
        setIsSaving(false);
      }
      return;
    }
    if (!isDirty) {
      setNotice('Er zijn geen wijzigingen om op te slaan.');
      return;
    }
    setPendingUpdate(update);
  };

  const handleConfirmUpdate = async () => {
    if (!pendingUpdate) return;
    setIsSaving(true);
    try {
      const saved = await updateFeed(token, pendingUpdate);
      setPendingUpdate(null);
      onSaved(saved);
    } catch (e: any) {
      setPendingUpdate(null);
      setNotice(`Opslaan mislukt: ${e?.message || 'onbekende fout'}`);
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    if (isDirty) {
      setDoShowDiscardModal(true);
    } else {
      onCancel();
    }
  };

  const authenticationFields = AUTH_FIELDS[values.authentication_type] || [];
  const showVehicleType = values.data_type !== 'service_areas';
  const pendingIsRisky = feed && pendingUpdate ? isRiskyChange(feed, pendingUpdate) : false;

  return (
    <div className="EditFeed" style={{ maxWidth: '800px' }}>
      <h2 className="text-lg font-semibold mb-1">
        {isNew ? 'Nieuwe feed' : `Feed ${feed.feed_id} bewerken`}
      </h2>
      <p className="text-sm text-gray-600 mb-4">
        {isNew
          ? 'Een nieuwe feed wordt inactief aangemaakt. Valideer en activeer hem daarna vanaf de feedpagina.'
          : 'Wijzigingen worden pas opgeslagen na bevestiging. Credentials blijven ongewijzigd tenzij je ze wijzigt.'}
      </p>

      <section className="mb-6">
        <FormLabel htmlFor="feedSystemId" classes="mb-1 font-bold">Aanbieder (system_id)</FormLabel>
        {isNew ? (
          <>
            <input
              id="feedSystemId"
              list="feedSystemIdOptions"
              className={`${INPUT_CLASSES} font-mono`}
              autoComplete="off"
              value={values.system_id}
              onChange={(e) => setValue('system_id', e.target.value.toLowerCase())}
            />
            <datalist id="feedSystemIdOptions">
              {operatorOptions.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
            </datalist>
            <FieldError error={errors.system_id} />
          </>
        ) : (
          <p className="text-sm font-mono mb-0">{values.system_id}</p>
        )}

        <FormLabel classes="mt-4 mb-1 font-bold">Datatype</FormLabel>
        {isNew ? (
          <div className="flex gap-4 flex-wrap text-sm">
            {(Object.keys(DATA_TYPE_LABELS) as FeedDataType[]).map((dataType) => (
              <label key={dataType} className="flex items-center gap-1 cursor-pointer">
                <input
                  type="radio"
                  name="feedDataType"
                  checked={values.data_type === dataType}
                  onChange={() => setDataType(dataType)}
                />
                {DATA_TYPE_LABELS[dataType]}
              </label>
            ))}
          </div>
        ) : (
          <p className="text-sm mb-0">
            {DATA_TYPE_LABELS[values.data_type]}
            <span className="text-xs text-gray-500"> (aanbieder en datatype liggen vast; maak voor een ander datatype een nieuwe feed)</span>
          </p>
        )}

        <FormLabel htmlFor="feedType" classes="mt-4 mb-1 font-bold">Feedtype</FormLabel>
        <select
          id="feedType"
          className={INPUT_CLASSES}
          value={values.feed_type}
          onChange={(e) => setValue('feed_type', e.target.value)}
        >
          {FEED_TYPES_BY_DATA_TYPE[values.data_type].map((feedType) => (
            <option key={feedType} value={feedType}>{feedType}</option>
          ))}
        </select>
        <FieldError error={errors.feed_type} />

        <FormLabel htmlFor="feedUrl" classes="mt-4 mb-1 font-bold">URL</FormLabel>
        {values.replace_feed_url ? (
          <>
            <input
              id="feedUrl"
              type="text"
              className={`${INPUT_CLASSES} font-mono`}
              autoComplete="off"
              placeholder="https://..."
              value={values.feed_url}
              onChange={(e) => setValue('feed_url', e.target.value)}
            />
            <FieldError error={errors.feed_url} />
          </>
        ) : (
          <div className="flex items-center gap-3 flex-wrap">
            <code className="text-sm break-all">{feed.feed_url}</code>
            <button
              type="button"
              className="underline text-sm bg-transparent p-0"
              disabled={loadingSection !== null}
              onClick={() => openSection('feed_url')}
            >
              {loadingSection === 'feed_url' ? 'Laden...' : 'Wijzig URL'}
            </button>
            <span className="text-xs text-gray-500 w-full">
              De URL bevat verborgen waarden. Bij wijzigen wordt de volledige URL getoond.
            </span>
          </div>
        )}
      </section>

      <section className="mb-6">
        <h3 className="font-bold text-sm mb-1">Authenticatie</h3>
        {values.replace_authentication ? (
          <div className="rounded-lg border px-3 py-3">
            <FormLabel htmlFor="feedAuthenticationType" classes="mb-1">Type</FormLabel>
            <select
              id="feedAuthenticationType"
              className={INPUT_CLASSES}
              value={values.authentication_type}
              onChange={(e) => setValue('authentication_type', e.target.value)}
            >
              <option value="">Geen authenticatie</option>
              {AUTHENTICATION_TYPES.map((type) => <option key={type} value={type}>{type}</option>)}
            </select>
            {authenticationFields.map((field) => {
              const id = `feedAuth-${field.key}`;
              const value = values.authentication_values[field.key] || '';
              return (
                <div key={field.key} className="mt-3">
                  <FormLabel htmlFor={id} classes="mb-1">
                    {field.label}{field.required ? '' : ' (optioneel)'}
                  </FormLabel>
                  {field.secret ? (
                    <SecretInput
                      id={id}
                      value={value}
                      multiline={field.multiline}
                      onChange={(newValue) => setAuthenticationValue(field.key, newValue)}
                    />
                  ) : (
                    <input
                      id={id}
                      type="text"
                      className={INPUT_CLASSES}
                      autoComplete="off"
                      value={value}
                      onChange={(e) => setAuthenticationValue(field.key, e.target.value)}
                    />
                  )}
                </div>
              );
            })}
            <FieldError error={errors.authentication} />
          </div>
        ) : (
          <div className="flex items-center gap-3 text-sm">
            <span>{feed.authentication_type ? `${feed.authentication_type} (ingesteld)` : 'Geen'}</span>
            <button
              type="button"
              className="underline bg-transparent p-0"
              disabled={loadingSection !== null}
              onClick={() => openSection('authentication')}
            >
              {loadingSection === 'authentication' ? 'Laden...' : 'Wijzig authenticatie'}
            </button>
          </div>
        )}
      </section>

      <section className="mb-6">
        <h3 className="font-bold text-sm mb-1">Request headers</h3>
        {values.replace_request_headers ? (
          <div className="rounded-lg border px-3 py-3">
            {values.request_headers.length === 0 && (
              <p className="text-sm text-gray-600 mb-2">Geen extra headers.</p>
            )}
            {values.request_headers.map((row, index) => (
              <div key={index} className="flex items-start gap-2 mb-2">
                <input
                  type="text"
                  aria-label="Headernaam"
                  placeholder="Naam"
                  className={`${INPUT_CLASSES} font-mono`}
                  style={{ maxWidth: '220px' }}
                  autoComplete="off"
                  value={row.name}
                  onChange={(e) => setHeader(index, 'name', e.target.value)}
                />
                <div className="flex-1">
                  <SecretInput
                    id={`feedHeader-${index}`}
                    value={row.value}
                    onChange={(value) => setHeader(index, 'value', value)}
                  />
                </div>
                <button
                  type="button"
                  className="p-2 bg-transparent text-gray-600 hover:text-red-700"
                  title="Verwijder header"
                  aria-label="Verwijder header"
                  onClick={() => setValue('request_headers', values.request_headers.filter((_, i) => i !== index))}
                >
                  <Trash2 size={16} />
                </button>
              </div>
            ))}
            <button
              type="button"
              className="inline-flex items-center gap-1 underline text-sm bg-transparent p-0"
              onClick={() => setValue('request_headers', [...values.request_headers, { name: '', value: '' }])}
            >
              <Plus size={14} /> Header toevoegen
            </button>
            <FieldError error={errors.request_headers} />
          </div>
        ) : (
          <div className="flex items-center gap-3 text-sm">
            <span>{feed.request_header_names.length > 0 ? feed.request_header_names.join(', ') : 'Geen'}</span>
            <button
              type="button"
              className="underline bg-transparent p-0"
              disabled={loadingSection !== null}
              onClick={() => openSection('request_headers')}
            >
              {loadingSection === 'request_headers' ? 'Laden...' : 'Wijzig headers'}
            </button>
          </div>
        )}
      </section>

      <section className="mb-6">
        {values.data_type === 'vehicles' && (
          <>
            <FormLabel htmlFor="feedImportStrategy" classes="mb-1 font-bold">Importstrategie</FormLabel>
            <select
              id="feedImportStrategy"
              className={INPUT_CLASSES}
              value={values.import_strategy}
              onChange={(e) => setValue('import_strategy', e.target.value)}
            >
              {IMPORT_STRATEGIES.map((strategy) => <option key={strategy} value={strategy}>{strategy}</option>)}
            </select>
            <p className="text-xs text-gray-500 mt-1">De importer verwerkt beide strategieën op dit moment op dezelfde manier.</p>
          </>
        )}

        {showVehicleType && (
          <>
            <FormLabel htmlFor="feedDefaultVehicleType" classes="mt-4 mb-1 font-bold">Standaard voertuigtype</FormLabel>
            <select
              id="feedDefaultVehicleType"
              className={INPUT_CLASSES}
              value={values.default_vehicle_type === null ? '' : String(values.default_vehicle_type)}
              onChange={(e) => setValue('default_vehicle_type', e.target.value ? Number(e.target.value) : null)}
            >
              <option value="">Geen (voertuigtype uit de feed)</option>
              {vehicleTypes.map((option) => (
                <option key={option.vehicle_type_id} value={option.vehicle_type_id}>{option.label}</option>
              ))}
            </select>
            <p className="text-xs text-gray-500 mt-1">Wordt gebruikt voor voertuigen waarvan de feed geen type meegeeft.</p>
          </>
        )}

        {values.data_type === 'trips' && (
          <>
            <FormLabel htmlFor="feedTripStart" classes="mt-4 mb-1 font-bold">Ritten importeren vanaf (optioneel)</FormLabel>
            <input
              id="feedTripStart"
              type="date"
              className={INPUT_CLASSES}
              style={{ maxWidth: '220px' }}
              value={values.trip_import_start_date}
              onChange={(e) => setValue('trip_import_start_date', e.target.value)}
            />
          </>
        )}

        <FormLabel htmlFor="feedRemarks" classes="mt-4 mb-1 font-bold">Opmerkingen</FormLabel>
        <textarea
          id="feedRemarks"
          className={INPUT_CLASSES}
          rows={3}
          value={values.remarks}
          onChange={(e) => setValue('remarks', e.target.value)}
        />
        <FieldError error={errors.remarks} />
      </section>

      <section className="mb-6">
        <h3 className="font-bold text-sm mb-2">Valideren</h3>
        <p className="text-xs text-gray-500 mb-2">
          Controleer de ingevulde gegevens tegen MDS of GBFS voordat je opslaat. Er wordt niets opgeslagen.
        </p>
        <div style={{ marginLeft: '-0.5rem' }}>
          <Button theme="white" type="button" onClick={handleValidate} disabled={isValidating}>
            {isValidating ? 'Bezig met valideren...' : 'Valideer ingevulde gegevens'}
          </Button>
        </div>
        <FeedValidationResult
          result={validation}
          isLoading={isValidating}
          error={validationError}
          isOutdated={validation !== null && !isValidationCurrent}
        />
      </section>

      {notice && (
        <div className="rounded-lg border px-3 py-2 text-sm mb-3 bg-blue-50 border-blue-300 text-blue-800" role="status">
          {notice}
        </div>
      )}

      <div style={{ marginLeft: '-0.5rem' }}>
        <Button theme="white" type="button" onClick={handleCancel} disabled={isSaving}>
          Annuleren
        </Button>
        <Button theme="primary" type="button" onClick={handleSave} disabled={isSaving || (!isNew && !isDirty)}>
          {isNew ? (isSaving ? 'Bezig met aanmaken...' : 'Feed aanmaken (inactief)') : 'Wijzigingen opslaan...'}
        </Button>
      </div>

      {feed && (
        <ConfirmFeedChangeModal
          isVisible={pendingUpdate !== null}
          title={`Feed ${feed.feed_id} (${feed.system_id}) wijzigen`}
          systemId={feed.system_id}
          changes={pendingUpdate ? describeChanges(feed, pendingUpdate, vehicleTypeLabel) : []}
          requireTypedConfirmation={pendingIsRisky}
          warning={pendingIsRisky && !(isValidationCurrent && validation.valid)
            ? 'Je hebt deze gegevens nog niet succesvol gevalideerd. Een fout in de configuratie kan de import van deze actieve feed stoppen.'
            : undefined}
          confirmTitle="Opslaan"
          isSaving={isSaving}
          onConfirm={handleConfirmUpdate}
          onCancel={() => setPendingUpdate(null)}
        />
      )}

      <Modal
        isVisible={doShowDiscardModal}
        title="Wijzigingen weggooien?"
        button1Title="Verder bewerken"
        button1Handler={() => setDoShowDiscardModal(false)}
        button2Title="Weggooien"
        button2Handler={() => {
          setDoShowDiscardModal(false);
          onCancel();
        }}
        hideModalHandler={() => setDoShowDiscardModal(false)}
      >
        <p>Je wijzigingen zijn nog niet opgeslagen.</p>
      </Modal>
    </div>
  );
};

export default EditFeed;
