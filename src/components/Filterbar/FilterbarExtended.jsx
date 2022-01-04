import { IconButtonClose } from '../IconButtons.jsx';

import './css/FilterbarExtended.css';

function FilterbarExtended({closeFunction, children}) {
  return (
    <div className="FilterbarExtended" onClick={() => closeFunction(false)}>
      <div className="" onClick={e => e.stopPropagation()}>
        <div className="flex justify-end mr-2">
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