import React, { useMemo, useState } from 'react';
import moment from 'moment';
import { useSelector } from 'react-redux';
import Modal from '../Modal/Modal.jsx';
import { Checkbox } from '../ui/checkbox';
import { RadioButton } from '../ui/radio-button';
import MultiSelectList, { MultiSelectOption } from './MultiSelectList';
import { StateType } from '../../types/StateType';
import type {
  DataQualityDataType,
  IssueOwner,
  ManualRejection,
  ManualRejectionInput,
} from '../../types/DataQuality';
import { getAanbiederSystemId } from '../../helpers/prestatiesAanbiedersViewMode';
import {
  DATA_TYPES,
  DATA_TYPE_LABELS,
  ISSUE_OWNER_LABELS,
  validateRejectionInput,
} from './dataQualityUtils';
import type { DataQualityLabels } from './useDataQualityLabels';

interface ManualRejectionDialogProps {
  /** Existing rejection to edit; null to create a new one */
  rejection: ManualRejection | null;
  defaultSystemId: string | null;
  labels: DataQualityLabels;
  onSave: (input: ManualRejectionInput, rejectionId?: number) => Promise<boolean>;
  onClose: () => void;
}

interface FormState {
  allOperators: boolean;
  systemIds: string[];
  start: string;
  end: string;
  allMunicipalities: boolean;
  municipalities: string[];
  allVehicleTypes: boolean;
  vehicleTypes: string[];
  dataTypes: DataQualityDataType[];
  issueOwner: IssueOwner;
  note: string;
}

const DATETIME_LOCAL_FORMAT = 'YYYY-MM-DDTHH:mm';
const EMPTY_LIST: never[] = [];

const toLocalInput = (iso: string | null): string => {
  return iso ? moment(iso).format(DATETIME_LOCAL_FORMAT) : '';
};

const toIso = (local: string): string => {
  return local ? moment(local, DATETIME_LOCAL_FORMAT).toISOString() : '';
};

const buildInitialState = (
  rejection: ManualRejection | null,
  defaultSystemId: string | null
): FormState => {
  if (!rejection) {
    return {
      allOperators: false,
      systemIds: defaultSystemId ? [defaultSystemId] : [],
      start: moment().startOf('hour').format(DATETIME_LOCAL_FORMAT),
      end: '',
      allMunicipalities: true,
      municipalities: [],
      allVehicleTypes: true,
      vehicleTypes: [],
      dataTypes: ['aanbod'],
      issueOwner: 'operator',
      note: '',
    };
  }
  return {
    allOperators: rejection.system_ids === 'all',
    systemIds: rejection.system_ids === 'all' ? [] : rejection.system_ids,
    start: toLocalInput(rejection.start_time),
    end: toLocalInput(rejection.end_time),
    allMunicipalities: rejection.municipalities === 'all',
    municipalities: rejection.municipalities === 'all' ? [] : rejection.municipalities,
    allVehicleTypes: rejection.vehicle_types === 'all',
    vehicleTypes: rejection.vehicle_types === 'all' ? [] : rejection.vehicle_types,
    dataTypes: rejection.data_types,
    issueOwner: rejection.issue_owner,
    note: rejection.note,
  };
};

const toInput = (form: FormState): ManualRejectionInput => ({
  system_ids: form.allOperators ? 'all' : form.systemIds,
  start_time: toIso(form.start),
  end_time: form.end ? toIso(form.end) : null,
  municipalities: form.allMunicipalities ? 'all' : form.municipalities,
  vehicle_types: form.allVehicleTypes ? 'all' : form.vehicleTypes,
  data_types: form.dataTypes,
  issue_owner: form.issueOwner,
  note: form.note.trim(),
});

interface ToggleRowProps {
  id: string;
  label: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
}

const ToggleRow = ({ id, label, checked, onChange }: ToggleRowProps) => (
  <div className="flex items-center gap-2 mb-2">
    <Checkbox id={id} checked={checked} onCheckedChange={(value) => onChange(value === true)} />
    <label htmlFor={id} className="text-sm cursor-pointer">{label}</label>
  </div>
);

const ManualRejectionDialog = ({
  rejection,
  defaultSystemId,
  labels,
  onSave,
  onClose,
}: ManualRejectionDialogProps) => {
  const aanbieders = useSelector((state: StateType) => state.metadata?.aanbieders || EMPTY_LIST);
  const gebieden = useSelector((state: StateType) => state.metadata?.gebieden || EMPTY_LIST);
  const vehicleTypes = useSelector((state: StateType) =>
    state.metadata?.vehicle_types || EMPTY_LIST
  );

  const [form, setForm] = useState<FormState>(() => buildInitialState(rejection, defaultSystemId));
  const [errors, setErrors] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);

  const operatorOptions: MultiSelectOption[] = useMemo(() => {
    const ids = new Set<string>(aanbieders.map(getAanbiederSystemId).filter(Boolean));
    form.systemIds.forEach((id) => ids.add(id));
    return Array.from(ids)
      .map((id) => ({ id, label: labels.getOperatorName(id) }))
      .sort((a, b) => a.label.localeCompare(b.label, 'nl', { sensitivity: 'base' }));
  }, [aanbieders, form.systemIds, labels]);

  const municipalityOptions: MultiSelectOption[] = useMemo(() => {
    return gebieden
      .filter((g: { gm_code?: string }) => Boolean(g.gm_code))
      .map((g: { gm_code: string; name?: string }) => ({ id: g.gm_code, label: g.name || g.gm_code }))
      .sort((a: MultiSelectOption, b: MultiSelectOption) => a.label.localeCompare(b.label, 'nl'));
  }, [gebieden]);

  const vehicleTypeOptions: MultiSelectOption[] = useMemo(() => {
    return vehicleTypes.map((vt: { id: string; name: string }) => ({ id: vt.id, label: vt.name }));
  }, [vehicleTypes]);

  const update = <K extends keyof FormState>(key: K, value: FormState[K]) => {
    setForm((current) => ({ ...current, [key]: value }));
  };

  const handleIssueOwnerChange = (issueOwner: IssueOwner) => {
    setForm((current) => ({
      ...current,
      issueOwner,
      // An outage on our side usually affects every operator.
      allOperators: issueOwner === 'dashboard_deelmobiliteit' && !rejection
        ? true
        : current.allOperators,
    }));
  };

  const toggleDataType = (dataType: DataQualityDataType, checked: boolean) => {
    update(
      'dataTypes',
      checked
        ? DATA_TYPES.filter((d) => d === dataType || form.dataTypes.includes(d))
        : form.dataTypes.filter((d) => d !== dataType)
    );
  };

  const handleSave = async () => {
    const input = toInput(form);
    const validationErrors = validateRejectionInput(input);
    setErrors(validationErrors);
    if (validationErrors.length > 0) return;

    setSaving(true);
    const success = await onSave(input, rejection?.rejection_id);
    setSaving(false);
    if (success) onClose();
  };

  return (
    <Modal
      isVisible={true}
      title={rejection ? 'Afkeuring bewerken' : 'Afkeuring toevoegen'}
      button1Title="Annuleren"
      button1Handler={onClose}
      button2Title="Opslaan"
      button2Handler={handleSave}
      button2Options={{ isLoading: saving }}
      hideModalHandler={onClose}
      config={{ maxWidth: '640px', width: '640px' }}
    >
      <div className="data-quality-form">
        {errors.length > 0 && (
          <div className="data-quality-form-errors" role="alert">
            {errors.map((error) => <div key={error}>{error}</div>)}
          </div>
        )}

        <fieldset>
          <legend>Aanbieder(s)</legend>
          <ToggleRow
            id="dq-all-operators"
            label="Alle aanbieders"
            checked={form.allOperators}
            onChange={(checked) => update('allOperators', checked)}
          />
          {!form.allOperators && (
            <MultiSelectList
              idPrefix="dq-operator"
              options={operatorOptions}
              selected={form.systemIds}
              onChange={(selected) => update('systemIds', selected)}
              searchable
              searchPlaceholder="Zoek aanbieder"
            />
          )}
        </fieldset>

        <fieldset>
          <legend>Periode</legend>
          <div className="flex flex-wrap gap-4">
            <label className="data-quality-form-label">
              Van
              <input
                type="datetime-local"
                className="data-quality-input"
                value={form.start}
                onChange={(e) => update('start', e.target.value)}
                required
              />
            </label>
            <label className="data-quality-form-label">
              Tot (leeg = nog gaande)
              <input
                type="datetime-local"
                className="data-quality-input"
                value={form.end}
                onChange={(e) => update('end', e.target.value)}
              />
            </label>
          </div>
        </fieldset>

        <fieldset>
          <legend>Gebied</legend>
          <ToggleRow
            id="dq-all-municipalities"
            label="Heel Nederland"
            checked={form.allMunicipalities}
            onChange={(checked) => update('allMunicipalities', checked)}
          />
          {!form.allMunicipalities && (
            <MultiSelectList
              idPrefix="dq-municipality"
              options={municipalityOptions}
              selected={form.municipalities}
              onChange={(selected) => update('municipalities', selected)}
              searchable
              searchPlaceholder="Zoek gemeente"
            />
          )}
        </fieldset>

        <fieldset>
          <legend>Voertuigtype</legend>
          <ToggleRow
            id="dq-all-vehicle-types"
            label="Alle voertuigtypes"
            checked={form.allVehicleTypes}
            onChange={(checked) => update('allVehicleTypes', checked)}
          />
          {!form.allVehicleTypes && (
            <MultiSelectList
              idPrefix="dq-vehicle-type"
              options={vehicleTypeOptions}
              selected={form.vehicleTypes}
              onChange={(selected) => update('vehicleTypes', selected)}
            />
          )}
        </fieldset>

        <fieldset>
          <legend>Datatype</legend>
          {DATA_TYPES.map((dataType) => (
            <ToggleRow
              key={dataType}
              id={`dq-data-type-${dataType}`}
              label={DATA_TYPE_LABELS[dataType]}
              checked={form.dataTypes.includes(dataType)}
              onChange={(checked) => toggleDataType(dataType, checked)}
            />
          ))}
        </fieldset>

        <fieldset>
          <legend>Issue owner</legend>
          {(Object.keys(ISSUE_OWNER_LABELS) as IssueOwner[]).map((owner) => (
            <div key={owner} className="flex items-center gap-2 mb-2">
              <RadioButton
                id={`dq-issue-owner-${owner}`}
                checked={form.issueOwner === owner}
                onCheckedChange={() => handleIssueOwnerChange(owner)}
              />
              <label htmlFor={`dq-issue-owner-${owner}`} className="text-sm cursor-pointer">
                {ISSUE_OWNER_LABELS[owner]}
              </label>
            </div>
          ))}
        </fieldset>

        <fieldset>
          <legend>Notitie</legend>
          <textarea
            className="data-quality-input"
            rows={3}
            value={form.note}
            onChange={(e) => update('note', e.target.value)}
            placeholder="Omschrijf wat er mis is met de data"
            aria-label="Notitie"
          />
        </fieldset>
      </div>
    </Modal>
  );
};

export default ManualRejectionDialog;
