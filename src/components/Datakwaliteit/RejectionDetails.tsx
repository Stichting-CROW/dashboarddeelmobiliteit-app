import React from 'react';
import { Pencil, Trash2 } from 'lucide-react';
import type { ManualRejection } from '../../types/DataQuality';
import {
  ISSUE_OWNER_LABELS,
  describeRejectionDataTypes,
  describeRejectionMunicipalities,
  describeRejectionOperator,
  describeRejectionVehicleTypes,
  formatDateTime,
  formatRejectionPeriod,
} from './dataQualityUtils';
import type { DataQualityLabels } from './useDataQualityLabels';

interface RejectionDetailsProps {
  rejection: ManualRejection;
  labels: DataQualityLabels;
  canEdit: boolean;
  onEdit: (rejection: ManualRejection) => void;
  onDelete: (rejection: ManualRejection) => void;
}

const RejectionDetails = ({
  rejection,
  labels,
  canEdit,
  onEdit,
  onDelete,
}: RejectionDetailsProps) => {
  const coversOthers = rejection.system_id === 'all';

  return (
    <div className="data-quality-rejection">
      <div className="flex items-start justify-between gap-2">
        <div className="font-semibold">{formatRejectionPeriod(rejection)}</div>
        {canEdit && (
          <div className="flex gap-1 shrink-0">
            <button
              type="button"
              className="data-quality-icon-button"
              title="Afkeuring bewerken"
              aria-label="Afkeuring bewerken"
              onClick={() => onEdit(rejection)}
            >
              <Pencil className="h-4 w-4" />
            </button>
            <button
              type="button"
              className="data-quality-icon-button"
              title="Afkeuring verwijderen"
              aria-label="Afkeuring verwijderen"
              onClick={() => onDelete(rejection)}
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
        )}
      </div>
      <dl className="data-quality-rejection-fields">
        {coversOthers && (
          <>
            <dt>Aanbieder</dt>
            <dd>{describeRejectionOperator(rejection, labels)}</dd>
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
};

export default RejectionDetails;
