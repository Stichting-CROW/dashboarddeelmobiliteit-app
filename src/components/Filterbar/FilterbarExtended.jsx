import { IconButtonClose } from '../IconButtons.jsx';

import './css/FilterbarExtended.css';

function FilterbarExtended({closeFunction, title, children}) {
  return (
    <div className="FilterbarExtended" onClick={() => closeFunction(false)}>
      <div className="" onClick={e => e.stopPropagation()}>
        <div className="flex justify-between">
          <h1 className="title flex flex-col justify-center">
            {title||''}
          </h1>
          <div className="FilterbarExtended-close-button-wrapper">
            <IconButtonClose onClick={() => closeFunction(false)} />
          </div>
        </div>
        <div className="grid-cols-4" >
          { children }
        </div>
      </div>
    </div>
  )
}

export default FilterbarExtended;
