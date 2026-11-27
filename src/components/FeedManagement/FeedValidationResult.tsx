import React from 'react';
import { AlertTriangle, CheckCircle2, CircleSlash, Loader2, XCircle } from 'lucide-react';

import {
  FeedValidationFile,
  FeedValidationResult as FeedValidationResultType,
  FeedValidationStatus
} from '../../types/FeedType';
import { formatDateTime } from './feedUtils';

interface FeedValidationResultProps {
  result: FeedValidationResultType | null;
  isLoading: boolean;
  error: string | null;
  /** The form changed after this result was made. */
  isOutdated?: boolean;
}

const STATUS_INFO: Record<FeedValidationStatus, { label: string; classes: string; icon: React.ReactNode }> = {
  valid: {
    label: 'De feed voldoet aan de standaard',
    classes: 'bg-green-50 border-green-300 text-green-800',
    icon: <CheckCircle2 size={20} />,
  },
  invalid: {
    label: 'De feed voldoet niet',
    classes: 'bg-red-50 border-red-300 text-red-800',
    icon: <XCircle size={20} />,
  },
  unreachable: {
    label: 'De feed is niet (volledig) bereikbaar',
    classes: 'bg-red-50 border-red-300 text-red-800',
    icon: <XCircle size={20} />,
  },
  not_checked: {
    label: 'De feed is bereikbaar, maar er is geen schema om tegen te controleren',
    classes: 'bg-blue-50 border-blue-300 text-blue-800',
    icon: <CircleSlash size={20} />,
  },
  config_error: {
    label: 'De feedconfiguratie is niet bruikbaar',
    classes: 'bg-red-50 border-red-300 text-red-800',
    icon: <AlertTriangle size={20} />,
  },
};

const FileSection = ({ file }: { file: FeedValidationFile }) => {
  const errorGroups = file.error_groups || [];
  const messages = file.messages || [];
  const ok = file.reachable && file.valid;
  return (
    <details className="rounded-lg border mb-2" open={!ok}>
      <summary className="cursor-pointer px-3 py-2 flex items-center gap-2 text-sm">
        {ok
          ? <CheckCircle2 size={16} className="text-green-700 flex-shrink-0" />
          : <XCircle size={16} className="text-red-700 flex-shrink-0" />}
        <strong>{file.name}</strong>
        <span className="text-gray-600">
          {!file.reachable
            ? 'niet bereikbaar'
            : file.schema_checked
              ? (file.valid ? 'voldoet' : `${file.error_count} ${file.error_count === 1 ? 'fout' : 'fouten'}`)
              : 'niet tegen een schema gecontroleerd'}
        </span>
      </summary>
      <div className="px-3 pb-3 text-sm">
        <dl className="FeedManagement-dl text-xs text-gray-700 mb-2">
          <dt>URL</dt>
          <dd className="font-mono break-all">{file.url}</dd>
          {file.http_status > 0 && <><dt>HTTP-status</dt><dd>{file.http_status}</dd></>}
          {file.schema && <><dt>Schema</dt><dd>{file.schema}</dd></>}
          {file.declared_version && <><dt>Versie in feed</dt><dd>{file.declared_version}</dd></>}
          {file.records_checked !== null && <><dt>Records</dt><dd>{file.records_checked}</dd></>}
        </dl>
        {messages.length > 0 && (
          <ul className="list-disc pl-5 mb-2">
            {messages.map((message, index) => <li key={index}>{message}</li>)}
          </ul>
        )}
        {errorGroups.length > 0 && (
          <div className="overflow-x-auto">
            <table className="FeedManagement-table text-xs w-full">
              <thead>
                <tr>
                  <th>Plaats</th>
                  <th>Fout</th>
                  <th>Aantal</th>
                  <th>Eerste voorbeeld</th>
                </tr>
              </thead>
              <tbody>
                {errorGroups.map((group, index) => (
                  <tr key={index}>
                    <td className="font-mono break-all">{group.path || '/'}</td>
                    <td>{group.message}</td>
                    <td>{group.count}</td>
                    <td className="font-mono break-all">{group.example}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            {file.error_groups_truncated && (
              <p className="text-xs text-gray-500 mt-1">Er zijn meer soorten fouten dan hier getoond worden.</p>
            )}
          </div>
        )}
      </div>
    </details>
  );
};

/** Shows the outcome of POST /admin/feed/validate per checked file. */
const FeedValidationResult = ({ result, isLoading, error, isOutdated }: FeedValidationResultProps) => {
  if (isLoading) {
    return (
      <div className="rounded-lg border px-3 py-3 text-sm flex items-center gap-2" role="status">
        <Loader2 size={16} className="animate-spin" />
        De feed wordt gedownload en gecontroleerd. Dit kan tot een minuut duren...
      </div>
    );
  }
  if (error) {
    return (
      <div className="rounded-lg border px-3 py-2 text-sm bg-red-50 border-red-300 text-red-800" role="status">
        Valideren mislukt: {error}
      </div>
    );
  }
  if (!result) return null;

  const info = STATUS_INFO[result.status] || STATUS_INFO.invalid;
  const importerIssues = result.importer_issues || [];
  const messages = result.messages || [];
  const files = result.files || [];

  return (
    <div className="FeedValidationResult" data-testid="feed-validation-result">
      <div className={`rounded-lg border px-3 py-2 text-sm mb-3 flex items-start gap-2 ${info.classes}`} role="status">
        <span className="flex-shrink-0 mt-0.5">{info.icon}</span>
        <div>
          <strong>{info.label}</strong>
          <div className="text-xs mt-1">
            {result.standard && <>{result.standard}{result.declared_version ? ` ${result.declared_version}` : ''} · </>}
            gecontroleerd op {formatDateTime(result.checked_at)} in {(result.duration_ms / 1000).toFixed(1)} s
          </div>
          {isOutdated && (
            <div className="text-xs mt-1 font-semibold">
              Je hebt het formulier daarna gewijzigd; valideer opnieuw.
            </div>
          )}
        </div>
      </div>

      {importerIssues.length > 0 && (
        <div className="rounded-lg border px-3 py-2 text-sm mb-3 bg-orange-50 border-orange-300 text-orange-900">
          <strong>De importer kan deze feed zo niet goed verwerken:</strong>
          <ul className="list-disc pl-5 mt-1">
            {importerIssues.map((issue, index) => <li key={index}>{issue}</li>)}
          </ul>
        </div>
      )}

      {messages.length > 0 && (
        <ul className="list-disc pl-5 mb-3 text-sm">
          {messages.map((message, index) => <li key={index}>{message}</li>)}
        </ul>
      )}

      {files.map((file, index) => <FileSection key={`${file.name}-${index}`} file={file} />)}
    </div>
  );
};

export default FeedValidationResult;
