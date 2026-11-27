import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';

import { FeedCredentials as FeedCredentialsType } from '../../types/FeedType';
import { getFeedCredentials } from '../../api/feeds';

export const CREDENTIALS_REVEAL_DURATION_MS = 10000;

interface FeedCredentialsProps {
  token: string;
  feedId: number;
}

/**
 * Credentials are only fetched on an explicit click and are removed from
 * memory again after a few seconds, so they do not end up in screenshots.
 */
const FeedCredentials = ({ token, feedId }: FeedCredentialsProps) => {
  const [credentials, setCredentials] = useState<FeedCredentialsType | null>(null);
  const [secondsLeft, setSecondsLeft] = useState<number>(0);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const hide = useCallback(() => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    intervalRef.current = null;
    setCredentials(null);
    setSecondsLeft(0);
  }, []);

  useEffect(() => hide, [hide, feedId]);

  const reveal = async () => {
    setError(null);
    setIsLoading(true);
    try {
      const result = await getFeedCredentials(token, feedId);
      setCredentials(result);
      const hideAt = Date.now() + CREDENTIALS_REVEAL_DURATION_MS;
      setSecondsLeft(Math.ceil(CREDENTIALS_REVEAL_DURATION_MS / 1000));
      if (intervalRef.current) clearInterval(intervalRef.current);
      intervalRef.current = setInterval(() => {
        const left = Math.ceil((hideAt - Date.now()) / 1000);
        if (left <= 0) {
          hide();
        } else {
          setSecondsLeft(left);
        }
      }, 250);
    } catch (e: any) {
      setError(e?.message || 'onbekende fout');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="FeedCredentials">
      {credentials ? (
        <div className="rounded-lg border border-red-300 bg-red-50 px-3 py-2 text-sm">
          <div className="flex items-center justify-between gap-2 mb-2">
            <strong className="text-red-800">Credentials zichtbaar, verborgen over {secondsLeft} s</strong>
            <button
              type="button"
              className="inline-flex items-center gap-1 underline text-gray-700 bg-transparent p-0"
              onClick={hide}
            >
              <EyeOff size={14} /> Verberg
            </button>
          </div>
          <dl className="FeedManagement-dl text-xs">
            <dt>URL</dt>
            <dd className="font-mono break-all">{credentials.feed_url}</dd>
            <dt>Authenticatie</dt>
            <dd>
              {credentials.authentication
                ? <pre className="font-mono whitespace-pre-wrap break-all m-0">{JSON.stringify(credentials.authentication, null, 2)}</pre>
                : 'geen'}
            </dd>
            <dt>Request headers</dt>
            <dd>
              {credentials.request_headers
                ? <pre className="font-mono whitespace-pre-wrap break-all m-0">{JSON.stringify(credentials.request_headers, null, 2)}</pre>
                : 'geen'}
            </dd>
          </dl>
        </div>
      ) : (
        <div className="flex items-center gap-3 flex-wrap text-sm">
          <button
            type="button"
            className="inline-flex items-center gap-1 underline text-gray-700 bg-transparent p-0"
            onClick={reveal}
            disabled={isLoading}
          >
            <Eye size={14} /> {isLoading ? 'Credentials worden geladen...' : 'Toon credentials'}
          </button>
          <span className="text-xs text-gray-500">
            Toont de volledige URL, authenticatie en headers voor {CREDENTIALS_REVEAL_DURATION_MS / 1000} seconden.
            Het opvragen wordt gelogd.
          </span>
          {error && <span className="text-xs text-red-700">Ophalen mislukt: {error}</span>}
        </div>
      )}
    </div>
  );
};

export default FeedCredentials;
