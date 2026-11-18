import { useEffect } from 'react';
import { useDispatch, useStore } from 'react-redux';

import { logout } from '../actions/authentication.js';
import { notifyInfo } from '../helpers/notify';
import {
  SESSION_IDLE_TIMEOUT_MS,
  SessionEndReason,
  getSessionEndReason,
  markActivity,
  readLastActivity,
} from '../helpers/session';
import { StateType } from '../types/StateType';

const CHECK_INTERVAL_MS = 30 * 1000;
const ACTIVITY_WRITE_THROTTLE_MS = 10 * 1000;
const ACTIVITY_EVENTS = ['mousedown', 'keydown', 'wheel', 'touchstart', 'scroll'] as const;

const SESSION_END_MESSAGES: Record<SessionEndReason, string> = {
  expired: 'Je sessie is verlopen. Log opnieuw in om verder te gaan.',
  idle: `Je bent automatisch uitgelogd na ${SESSION_IDLE_TIMEOUT_MS / 60000} minuten inactiviteit.`,
};

/**
 * Logs the user out when the JWT expires or after a period of inactivity.
 */
export const useSessionGuard = (isLoggedIn: boolean): void => {
  const dispatch = useDispatch();
  const store = useStore<StateType>();

  useEffect(() => {
    if (!isLoggedIn) return;

    let lastWrite = 0;
    const onActivity = () => {
      const now = Date.now();
      if (now - lastWrite < ACTIVITY_WRITE_THROTTLE_MS) return;
      lastWrite = now;
      markActivity(now);
    };

    const checkSession = () => {
      const userData = store.getState().authentication.user_data;
      const reason = getSessionEndReason(userData, readLastActivity());
      if (!reason) return;
      dispatch(logout());
      notifyInfo(SESSION_END_MESSAGES[reason], { duration: 10000 });
    };

    // Run the check before recording activity, so a stale session is ended
    // instead of being revived by the first interaction.
    checkSession();
    onActivity();

    ACTIVITY_EVENTS.forEach((eventName) => {
      window.addEventListener(eventName, onActivity, { passive: true });
    });
    // Background tabs throttle timers, so also check when the tab becomes visible.
    const onVisibilityChange = () => {
      if (document.visibilityState === 'visible') checkSession();
    };
    document.addEventListener('visibilitychange', onVisibilityChange);
    const intervalId = window.setInterval(checkSession, CHECK_INTERVAL_MS);

    return () => {
      ACTIVITY_EVENTS.forEach((eventName) => {
        window.removeEventListener(eventName, onActivity);
      });
      document.removeEventListener('visibilitychange', onVisibilityChange);
      window.clearInterval(intervalId);
    };
  }, [isLoggedIn, dispatch, store]);
};

export default useSessionGuard;
