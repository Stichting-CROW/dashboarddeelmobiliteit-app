import { IconButtonClose } from '../IconButtons.jsx';

import './css/FilterbarExtended.css';

function FilterbarExtended({closeFunction, children}) {
  return (
    <div className="FilterbarExtended" onClick={() => closeFunction(false)}>
      <div className="" onClick={e => e.stopPropagation()}>
        <div className="FilterbarExtended-close-button-wrapper flex justify-end">
          <IconButtonClose onClick={() => closeFunction(false)} />
        </div>
        <div className="grid-cols-4" >
          { children }
        </div>
      </div>
    </div>
  )
}

export default FilterbarExtended;
