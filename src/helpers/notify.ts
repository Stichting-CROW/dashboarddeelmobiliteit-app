import { cn } from "../lib/utils";

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

export const notify = (toast: any, msg: string, config?: any) => {
  if(! toast) return;

  toast(Object.assign({
    className: cn(
      'top-0 flex fixed mx-auto inset-x-0 md:max-w-[420px] md:top-4 '
    ),
    variant: 'default',
    title: "Actie voltooid",
    duration: 2000,
    description: msg,
  }, config));
}
