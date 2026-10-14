import { cn } from "../lib/utils";
import { toast as globalToast } from "../components/ui/use-toast";

const baseToastClassName = cn(
  'top-0 flex fixed mx-auto inset-x-0 md:max-w-[420px] md:top-4 '
);

/**
 * Show a success/confirmation toast.
 *
 * Historically callers passed the `toast` function obtained from the
 * `useToast()` hook. That is still supported, but `toast` is now optional:
 * when omitted we fall back to the global toast instance so the helper can be
 * called from anywhere (event handlers, plain functions, `window.notify`).
 */
export const notify = (toast: any, msg: string, config?: any) => {
  const toastFn = toast || globalToast;
  if(! toastFn) return;

  toastFn(Object.assign({
    className: baseToastClassName,
    variant: 'default',
    title: "Actie voltooid",
    duration: 2000,
    description: msg,
  }, config));
}

/**
 * Show a neutral, informational toast.
 */
export const notifyInfo = (msg: string, config?: any) => {
  globalToast(Object.assign({
    className: baseToastClassName,
    variant: 'default',
    duration: 3000,
    description: msg,
  }, config));
}

/**
 * Show an error toast. Replaces native `alert()` calls so error feedback is
 * consistent with the rest of the app instead of a blocking browser dialog.
 */
export const notifyError = (msg: string, config?: any) => {
  globalToast(Object.assign({
    className: baseToastClassName,
    variant: 'destructive',
    title: "Er ging iets mis",
    duration: 5000,
    description: msg,
  }, config));
}
