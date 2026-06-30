import ReactDOM from 'react-dom';
import { X } from 'lucide-react';
import { Button } from '../ui/button';

const Modal = ({
  isVisible,
  title,
  children,
  button1Title,
  button1Handler,
  button2Title,
  button2Handler,
  button2Options,
  hideModalHandler,
  config,
  onTitleClick
}: {
  isVisible?: any,
  title?: any,
  children?: any,
  button1Title?: any,
  button1Handler?: any,
  button2Title?: any,
  button2Handler?: any,
  button2Options?: any,
  hideModalHandler?: any,
  config?: any,
  onTitleClick?: (e?: React.MouseEvent) => void
}) => {
  const blurThen = (fn?: () => void) => {
    if (document.activeElement instanceof HTMLElement) {
      document.activeElement.blur();
    }
    fn?.();
  };
  const handleHide = () => blurThen(hideModalHandler);
  const button2Loading = button2Options && button2Options.isLoading === true;
  const button2Disabled = button2Loading || (button2Options && button2Options.disabled === true);
  const modalContent = (
    <div className={`
          fixed top-0 left-0 w-full h-full outline-none overflow-x-hidden overflow-y-auto
        `}
        id="exampleModalCenteredScrollable"
        tabIndex="-1"
        aria-hidden={!isVisible}
        aria-labelledby="exampleModalCenteredScrollable"
        aria-modal="true"
        style={{
          'display': isVisible ? 'block' : 'none',
          zIndex: (config && config.zIndex != null) ? config.zIndex : 9999,
          padding: '50px 0'
        }}
        role="dialog"
      >
        <div
          className="absolute top-0 right-0 bottom-0 left-0"
          style={{
            'display': isVisible ? 'block' : 'none',
            backgroundColor: 'rgba(0,0,0,0.3)',
            zIndex: -1,
            padding: '50px 0'
          }}
          onClick={handleHide}
        >
        </div>
        
        <div className="
          modal-dialog relative w-auto pointer-events-auto
          max-w-full
        " style={{
          height: '90%',
          ...(config && config.minWidth ? { minWidth: config.minWidth } : {})
        }}>
          <div className={
            "border-none shadow-lg relative flex flex-col pointer-events-auto bg-white bg-clip-padding rounded-md outline-none text-current mx-auto max-w-full" +
            (config && config.fullWidth ? " w-11/12" : "")
          } style={{
            width: config && config.width ? config.width : (config && config.fullWidth ? '96%' : 'fit-content'),
            minWidth: config && config.minWidth ? config.minWidth : 'auto',
            maxWidth: config && config.maxWidth ? config.maxWidth : (config && config.fullWidth ? '96%' : '600px'),
            maxHeight: '100%'
          }}>
            <div className="flex flex-shrink-0 items-center justify-between p-4 border-b border-gray-200 rounded-t-md">
              <h5 
                className={`text-xl leading-normal text-gray-800 font-semibold ${onTitleClick ? 'cursor-pointer hover:text-theme-blue' : ''}`}
                id="exampleModalCenteredScrollableLabel"
                onClick={(e) => { e.stopPropagation(); onTitleClick?.(e); }}
                style={onTitleClick ? { userSelect: 'none' } : {}}
              >
                {title}
              </h5>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-gray-500 hover:text-gray-900"
                aria-label="Sluiten"
                onClick={handleHide}
              >
                <X className="h-5 w-5" />
              </Button>
            </div>
            {children && <div className={`
              relative p-4
              flex-1
              ${config && config.noBodyScroll ? 'overflow-hidden min-h-0' : 'overflow-auto'}
            `}>
              {children}
            </div>}
            <div
              className="flex flex-shrink-0 flex-wrap items-center justify-end gap-2 p-4 border-t border-gray-200 rounded-b-md">
              {button1Title && <Button
                type="button"
                variant="secondary"
                onClick={(e) => blurThen(() => button1Handler?.(e))}>
                {button1Title}
              </Button>}
              {button2Title && <Button
                type="button"
                className={`bg-theme-blue text-white hover:bg-theme-blue/90 ${button2Loading ? 'cursor-wait' : ''}`}
                onClick={(e) => blurThen(() => button2Handler?.(e))}
                disabled={button2Disabled}
                >
                {button2Title}
              </Button>}
            </div>
          </div>
        </div>
      </div>
  );
  const rootEl = document.getElementById('root');
  return ReactDOM.createPortal(modalContent, rootEl || document.body);
}


export default Modal;
