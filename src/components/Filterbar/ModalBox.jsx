import './css/Filterbar.css';
import { IconButtonClose } from '../IconButtons.jsx';

function ModalBox({closeFunction, children}) {
  return (
    <div className="modalbox-bg" onClick={() => closeFunction(false)}>
      <div className="modalbox" onClick={e=>e.stopPropagation()}>
        <div className="absolute absolute top-0 right-0">
          <IconButtonClose onClick={() => closeFunction(false)} />
        </div>
        <div className="grid-cols-4" >
          { children }
        </div>
      </div>
    </div>
  )
}

export default ModalBox;