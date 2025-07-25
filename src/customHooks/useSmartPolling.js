import { useEffect, useRef, useState } from 'react';

/**
 * Smart Polling Hook
 * 
 * Pauses polling when user is inactive and resumes when they become active.
 * This reduces unnecessary API calls when the user is not actively using the application.
 */
const useSmartPolling = (callback, interval, options = {}) => {
  const [isActive, setIsActive] = useState(true);
  const intervalRef = useRef(null);
  const timeoutRef = useRef(null);
  
  const {
    inactivityTimeout = 300000, // 5 minutes of inactivity
    enableActivityDetection = true,
    debug = false
  } = options;

  // Activity detection
  useEffect(() => {
    if (!enableActivityDetection) return;

    const handleActivity = () => {
      if (!isActive) {
        if (debug) console.log('🟢 User became active, resuming polling');
        setIsActive(true);
      }
      
      // Reset inactivity timer
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      
      timeoutRef.current = setTimeout(() => {
        if (debug) console.log('🔴 User inactive for', inactivityTimeout / 1000, 'seconds, pausing polling');
        setIsActive(false);
      }, inactivityTimeout);
    };

    const resetTimeout = () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      timeoutRef.current = setTimeout(() => {
        if (debug) console.log('🔴 User inactive for', inactivityTimeout / 1000, 'seconds, pausing polling');
        setIsActive(false);
      }, inactivityTimeout);
    };

    // Activity events
    const events = ['mousemove', 'mousedown', 'keypress', 'scroll', 'touchstart', 'click'];
    
    events.forEach(event => {
      document.addEventListener(event, handleActivity, { passive: true });
    });

    // Start inactivity timer
    resetTimeout();

    // Cleanup
    return () => {
      events.forEach(event => {
        document.removeEventListener(event, handleActivity);
      });
      
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [isActive, inactivityTimeout, enableActivityDetection, debug]);

  // Polling logic
  useEffect(() => {
    if (!isActive || !interval) {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      return;
    }

    // Initial call
    callback();

    // Set up interval
    intervalRef.current = setInterval(callback, interval);

    if (debug) console.log('🔄 Smart polling started with interval:', interval, 'ms');

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [callback, interval, isActive, debug]);

  // Manual control functions
  const pausePolling = () => {
    if (debug) console.log('⏸️ Manually pausing polling');
    setIsActive(false);
  };

  const resumePolling = () => {
    if (debug) console.log('▶️ Manually resuming polling');
    setIsActive(true);
  };

  const forceUpdate = () => {
    if (debug) console.log('⚡ Force updating data');
    callback();
  };

  return {
    isActive,
    pausePolling,
    resumePolling,
    forceUpdate
  };
};

export default useSmartPolling; 