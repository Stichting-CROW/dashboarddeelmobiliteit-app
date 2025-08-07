import { useCallback, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { markFeatureAsSeen, setLatestSeenVersion } from '../actions/authentication.js';

/**
 * Custom hook for managing new feature indicators
 * @param {string} featureId - Unique identifier for the feature
 * @param {string} version - Version date when this feature was introduced (format: 'YYYY-MM-DD')
 * @returns {Object} - Object containing isNew and markAsSeen function
 */
export const useNewFeature = (featureId, version) => {
  const dispatch = useDispatch();
  
  // Get state with fallbacks to prevent undefined errors
  const authenticationState = useSelector((state) => state.authentication || {});
  const seenFeatures = authenticationState.seenFeatures || {};
  const latestSeenVersion = authenticationState.latestSeenVersion || null;

  // Check if this feature should be shown as new
  const isNew = useCallback(() => {
    // If user has already seen this specific feature, it's not new
    if (seenFeatures && seenFeatures[featureId]) {
      return false;
    }

    // If user has seen a version later than or equal to this feature's version, it's not new
    if (latestSeenVersion && latestSeenVersion >= version) {
      return false;
    }

    return true;
  }, [featureId, version, seenFeatures, latestSeenVersion]);

  // Mark this feature as seen
  const markAsSeen = useCallback(() => {
    dispatch(markFeatureAsSeen(featureId));
    
    // Also update the latest seen version if this feature's version is newer
    if (!latestSeenVersion || version > latestSeenVersion) {
      dispatch(setLatestSeenVersion(version));
    }
  }, [dispatch, featureId, version, latestSeenVersion]);

  // Load and save to localStorage
  useEffect(() => {
    // Load from localStorage on mount
    const savedSeenFeatures = localStorage.getItem('seenFeatures');
    const savedLatestVersion = localStorage.getItem('latestSeenVersion');
    
    if (savedSeenFeatures) {
      try {
        const parsed = JSON.parse(savedSeenFeatures);
        Object.keys(parsed).forEach(featureId => {
          if (parsed[featureId]) {
            dispatch(markFeatureAsSeen(featureId));
          }
        });
      } catch (e) {
        console.warn('Failed to parse saved seen features:', e);
      }
    }
    
    if (savedLatestVersion) {
      dispatch(setLatestSeenVersion(savedLatestVersion));
    }
  }, [dispatch]);

  // Save to localStorage whenever state changes
  useEffect(() => {
    if (seenFeatures && Object.keys(seenFeatures).length > 0) {
      localStorage.setItem('seenFeatures', JSON.stringify(seenFeatures));
    }
  }, [seenFeatures]);

  useEffect(() => {
    if (latestSeenVersion) {
      localStorage.setItem('latestSeenVersion', latestSeenVersion);
    }
  }, [latestSeenVersion]);

  return {
    isNew: isNew(),
    markAsSeen
  };
}; 