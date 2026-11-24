import React from 'react';

interface ChartEmptyStateProps {
  title?: string;
  hint?: string;
}

/**
 * Shown in place of a chart when the API returned no data for the selection.
 */
export function ChartEmptyState({
  title = 'Geen data voor deze selectie',
  hint = 'Kies een andere periode, plaats of zone, of controleer de geselecteerde aanbieders.'
}: ChartEmptyStateProps) {
  return (
    <div
      className="flex h-full w-full flex-col items-center justify-center rounded-md border border-dashed border-gray-200 bg-gray-50 px-6 text-center"
      role="status"
    >
      <svg
        width="32"
        height="32"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="mb-3 text-gray-300"
        aria-hidden="true"
      >
        <path d="M3 3v18h18" />
        <path d="M7 15l4-4 3 3 5-6" />
      </svg>
      <p className="text-sm font-medium text-gray-700">{title}</p>
      <p className="mt-1 max-w-xs text-xs text-gray-500">{hint}</p>
    </div>
  );
}

interface ChartErrorStateProps {
  onRetry?: () => void;
  message?: string;
}

/**
 * Shown in place of a chart when loading the data failed.
 */
export function ChartErrorState({
  onRetry,
  message = 'De gegevens konden niet worden geladen.'
}: ChartErrorStateProps) {
  return (
    <div
      className="flex h-full w-full flex-col items-center justify-center rounded-md border border-red-100 bg-red-50 px-6 text-center"
      role="alert"
    >
      <p className="text-sm font-medium text-red-700">{message}</p>
      <p className="mt-1 text-xs text-red-600">
        Controleer je internetverbinding of probeer het later opnieuw.
      </p>
      {onRetry && (
        <button
          type="button"
          onClick={onRetry}
          className="mt-3 rounded-md border border-red-200 bg-white px-3 py-1.5 text-xs font-medium text-red-700 hover:bg-red-100 transition-colors"
        >
          Opnieuw proberen
        </button>
      )}
    </div>
  );
}

/**
 * Semi-transparent overlay shown on top of an existing chart while newer
 * data for a changed selection is being fetched.
 */
export function ChartRefreshingOverlay() {
  return (
    <div
      className="pointer-events-none absolute inset-0 z-10 flex items-start justify-center bg-white/60"
      role="status"
      aria-live="polite"
    >
      <span className="mt-3 inline-flex items-center gap-2 rounded-full bg-white px-3 py-1 text-xs font-medium text-gray-600 shadow-sm">
        <span className="inline-block h-3 w-3 animate-spin rounded-full border-2 border-gray-300 border-t-theme-blue" aria-hidden="true" />
        Bijwerken…
      </span>
    </div>
  );
}
