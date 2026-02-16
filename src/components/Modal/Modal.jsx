import ReactDOM from 'react-dom';

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
  const modalContent = (
    <div className={`
          modal fade ${isVisible ? 'show' : ''} fixed top-0 left-0 w-full h-full outline-none overflow-x-hidden overflow-y-auto
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
          modal-dialog modal-dialog-centered modal-dialog-scrollable relative w-auto pointer-events-auto
          max-w-full
        " style={{
          height: '90%',
          ...(config && config.minWidth ? { minWidth: config.minWidth } : {})
        }}>
          <div className={
            "modal-content border-none shadow-lg relative flex flex-col pointer-events-auto bg-white bg-clip-padding rounded-md outline-none text-current mx-auto max-w-full" +
            (config && config.fullWidth ? " w-11/12" : "")
          } style={{
            width: config && config.fullWidth ? '96%' : 'fit-content',
            minWidth: config && config.minWidth ? config.minWidth : 'auto',
            maxWidth: config && config.maxWidth ? config.maxWidth : (config && config.fullWidth ? '96%' : '600px'),
            maxHeight: '100%'
          }}>
            <div className="modal-header flex flex-shrink-0 items-center justify-between p-4 border-b border-gray-200 rounded-t-md">
              <h5 
                className={`text-xl leading-normal text-gray-800 font-semibold ${onTitleClick ? 'cursor-pointer hover:text-blue-600' : ''}`}
                id="exampleModalCenteredScrollableLabel"
                onClick={(e) => { e.stopPropagation(); onTitleClick?.(e); }}
                style={onTitleClick ? { userSelect: 'none' } : {}}
              >
                {title}
              </h5>
              <button type="button"
                className="btn-close box-content w-4 h-4 p-1 text-black border-none rounded-none opacity-50 focus:shadow-none focus:outline-none focus:opacity-100 hover:text-black hover:opacity-75 hover:no-underline"
                data-bs-dismiss="modal" aria-label="Close"
                onClick={handleHide}
                ></button>
            </div>
            {children && <div className="
              modal-body relative p-4
              overflow-auto
              flex-1
            ">
              {children}
            </div>}
            <div
              className="modal-footer flex flex-shrink-0 flex-wrap items-center justify-end p-4 border-t border-gray-200 rounded-b-md">
              {button1Title && <button type="button"
                className="inline-block px-6 py-2.5 bg-gray-600 text-white font-medium text-xs leading-tight uppercase rounded shadow-md hover:bg-gray-700 hover:shadow-lg focus:bg-gray-700 focus:shadow-lg focus:outline-none focus:ring-0 active:bg-gray-800 active:shadow-lg transition duration-150 ease-in-out cursor-pointer"
                data-bs-dismiss="modal"
                onClick={(e) => blurThen(() => button1Handler?.(e))}>
                {button1Title}
              </button>}
              {button2Title && <button type="button"
                className={`
                  inline-block px-6 py-2.5 bg-blue-600 text-white font-medium text-xs leading-tight uppercase rounded shadow-md hover:bg-blue-700 hover:shadow-lg focus:bg-blue-700 focus:shadow-lg focus:outline-none focus:ring-0 active:bg-blue-800 active:shadow-lg transition duration-150 ease-in-out ml-1
                  ${button2Options && button2Options.isLoading === true ? 'cursor-wait' : ''}
                  ${button2Options && button2Options.disabled === true ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
                `}
                onClick={(e) => blurThen(() => button2Handler?.(e))}
                disabled={(button2Options && button2Options.isLoading === true) || (button2Options && button2Options.disabled === true)}
                >
                {button2Title}
              </button>}
            </div>
          </div>
        </div>
      </div>
  );
  const rootEl = document.getElementById('root');
  return ReactDOM.createPortal(modalContent, rootEl || document.body);
}


export default Modal;
