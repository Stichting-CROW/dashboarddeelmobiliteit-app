import React, { useEffect, useState } from 'react';

import Modal from '../Modal/Modal.jsx';
import { FeedChange } from './feedUtils';

interface ConfirmFeedChangeModalProps {
  isVisible: boolean;
  title: string;
  systemId: string;
  changes: FeedChange[];
  /** Ask to type the system_id before the change can be saved. */
  requireTypedConfirmation: boolean;
  typedConfirmationReason?: string;
  warning?: React.ReactNode;
  confirmTitle: string;
  isSaving: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

const ConfirmFeedChangeModal = ({
  isVisible,
  title,
  systemId,
  changes,
  requireTypedConfirmation,
  typedConfirmationReason = 'Deze feed is actief; de wijziging heeft direct effect op de import.',
  warning,
  confirmTitle,
  isSaving,
  onConfirm,
  onCancel
}: ConfirmFeedChangeModalProps) => {
  const [typed, setTyped] = useState<string>('');

  useEffect(() => {
    if (!isVisible) setTyped('');
  }, [isVisible]);

  const isConfirmed = !requireTypedConfirmation || typed.trim() === systemId;

  return (
    <Modal
      isVisible={isVisible}
      title={title}
      button1Title="Annuleren"
      button1Handler={onCancel}
      button2Title={isSaving ? 'Bezig met opslaan...' : confirmTitle}
      button2Handler={() => {
        if (isConfirmed && !isSaving) onConfirm();
      }}
      button2Options={{ isLoading: isSaving, disabled: !isConfirmed }}
      hideModalHandler={onCancel}
      config={{ maxWidth: '720px' }}
    >
      {warning && (
        <div className="rounded-lg border px-3 py-2 text-sm mb-3 bg-orange-50 border-orange-300 text-orange-900">
          {warning}
        </div>
      )}
      <table className="FeedManagement-table text-sm w-full mb-3">
        <thead>
          <tr>
            <th>Veld</th>
            <th>Was</th>
            <th>Wordt</th>
          </tr>
        </thead>
        <tbody>
          {changes.map((change) => (
            <tr key={change.field}>
              <td className="font-semibold">{change.label}</td>
              <td className="break-all text-gray-600">{change.from}</td>
              <td className="break-all">{change.to}</td>
            </tr>
          ))}
        </tbody>
      </table>
      {requireTypedConfirmation && (
        <div>
          <label htmlFor="confirmFeedSystemId" className="block text-sm mb-1">
            {typedConfirmationReason} Typ <strong className="font-mono">{systemId}</strong> om te bevestigen.
          </label>
          <input
            id="confirmFeedSystemId"
            type="text"
            autoComplete="off"
            className="rounded-lg border-solid border-2 px-2 py-1 text-sm w-full font-mono"
            value={typed}
            onChange={(e) => setTyped(e.target.value)}
          />
        </div>
      )}
    </Modal>
  );
};

export default ConfirmFeedChangeModal;
