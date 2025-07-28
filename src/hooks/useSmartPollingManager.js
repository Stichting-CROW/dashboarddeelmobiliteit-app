import { useCallback, useRef } from 'react';
import { useSelector } from 'react-redux';
import { StateType } from '../types/StateType';
import useSmartPolling from '../customHooks/useSmartPolling';
import { initUpdateParkingData, clearParkingDataCache } from '../poll-api/pollParkingData';
import { initUpdateVerhuringenData, clearRentalsDataCache } from '../poll-api/pollVerhuringenData';

/**
 * Smart Polling Manager Hook
 * 
 * Manages polling for different data types with intelligent scheduling
 * and user activity detection.
 */
export const useSmartPollingManager = (store) => {
  const displayMode = useSelector((state: StateType) => state.layers?.displaymode);
  const isLoggedIn = useSelector((state: StateType) => state.authentication.user_data ? true : false);
  const metadata = useSelector((state: StateType) => state.metadata);
  const filter = useSelector((state: StateType) => state.filter);
  
  const lastUpdateRef = useRef({
    parking: 0,
    rentals: 0
  });

  // Parking data polling callback
  const updateParkingData = useCallback(() => {
    if (displayMode !== 'displaymode-park') return;
    if (isLoggedIn && !metadata.zones_loaded) return;
    
    const now = Date.now();
    const timeSinceLastUpdate = now - lastUpdateRef.current.parking;
    
    // Prevent too frequent updates (minimum 10 seconds between updates)
    if (timeSinceLastUpdate < 10000) {
      // console.log('⏱️ Skipping parking data update (too recent)');
      return;
    }
    
    // console.log('🔄 Smart polling: Updating parking data');
    lastUpdateRef.current.parking = now;
    initUpdateParkingData(store);
  }, [displayMode, isLoggedIn, metadata.zones_loaded, store]);

  // Rentals data polling callback
  const updateRentalsData = useCallback(() => {
    if (displayMode !== 'displaymode-rentals') return;
    if (isLoggedIn && !metadata.zones_loaded) return;
    
    const now = Date.now();
    const timeSinceLastUpdate = now - lastUpdateRef.current.rentals;
    
    // Prevent too frequent updates (minimum 10 seconds between updates)
    if (timeSinceLastUpdate < 10000) {
      // console.log('⏱️ Skipping rentals data update (too recent)');
      return;
    }
    
    // console.log('🔄 Smart polling: Updating rentals data');
    lastUpdateRef.current.rentals = now;
    initUpdateVerhuringenData(store);
  }, [displayMode, isLoggedIn, metadata.zones_loaded, store]);

  // Parking data smart polling
  const parkingPolling = useSmartPolling(updateParkingData, 60000, { // 1 minute interval
    inactivityTimeout: 300000, // 5 minutes
    debug: false
  });

  // Rentals data smart polling
  const rentalsPolling = useSmartPolling(updateRentalsData, 60000, { // 1 minute interval
    inactivityTimeout: 300000, // 5 minutes
    debug: false
  });

  // Global cache clearing
  const clearAllCaches = useCallback(() => {
    // console.log('🧹 Clearing all data caches');
    clearParkingDataCache();
    clearRentalsDataCache();
  }, []);

  // Force update all data
  const forceUpdateAll = useCallback(() => {
    // console.log('⚡ Force updating all data');
    parkingPolling.forceUpdate();
    rentalsPolling.forceUpdate();
  }, [parkingPolling, rentalsPolling]);

  // Pause all polling
  const pauseAllPolling = useCallback(() => {
    // console.log('⏸️ Pausing all polling');
    parkingPolling.pausePolling();
    rentalsPolling.pausePolling();
  }, [parkingPolling, rentalsPolling]);

  // Resume all polling
  const resumeAllPolling = useCallback(() => {
    // console.log('▶️ Resuming all polling');
    parkingPolling.resumePolling();
    rentalsPolling.resumePolling();
  }, [parkingPolling, rentalsPolling]);

  return {
    // Individual polling controls
    parkingPolling,
    rentalsPolling,
    
    // Global controls
    clearAllCaches,
    forceUpdateAll,
    pauseAllPolling,
    resumeAllPolling,
    
    // Status
    isParkingActive: parkingPolling.isActive,
    isRentalsActive: rentalsPolling.isActive,
    
    // Debug info
    lastUpdate: lastUpdateRef.current
  };
}; 