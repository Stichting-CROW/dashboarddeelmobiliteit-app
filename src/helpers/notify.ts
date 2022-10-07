let TO_notificationDuration;
export const showNotification = (msg, setStateFunc) => {
  // Set (and show) message
  setStateFunc(msg);

  // Hide message after X seconds
  clearTimeout(TO_notificationDuration);
  TO_notificationDuration = setTimeout(x => {
    setStateFunc(false);
  }, 4000)
}
