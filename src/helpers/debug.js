// Debug utility to help track reload issues
export const debugReload = {
  log: (message, data = null) => {
    if (process.env.NODE_ENV === 'development') {
      console.log(`[Reload Debug] ${message}`, data);
    }
  },
  
  trackStateChange: (oldState, newState, reason) => {
    if (process.env.NODE_ENV === 'development') {
      console.log(`[Reload Debug] State change detected:`, {
        reason,
        oldState: oldState ? Object.keys(oldState) : null,
        newState: newState ? Object.keys(newState) : null,
        timestamp: new Date().toISOString()
      });
    }
  },
  
  trackAuthState: (authState) => {
    if (process.env.NODE_ENV === 'development') {
      // console.log(`[Reload Debug] Auth state:`, {
      //   hasUserData: !!authState?.user_data,
      //   hasToken: !!authState?.user_data?.token,
      //   timestamp: new Date().toISOString()
      // });
    }
  }
}; 