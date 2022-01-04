import { useDispatch, useSelector } from 'react-redux';
import { Link, useLocation } from "react-router-dom";

import './MobileSlideBox.css';
import { IconButtonClose } from '../IconButtons.jsx';

function MobileSlideBox(props) {
  return (
    <div className={`
      MobileSlideBox w-full sm:hidden absolute left-0
      ${props.isVisible ? 'is-visible' : ''}
      ${props.classes}
    `} style={props.style}>

      <header className="flex justify-between">
        <h1 className="">{props.title}</h1>
        <IconButtonClose onClick={props.closeHandler} />
      </header>

      <div className="w-full">
        {props.children}
      </div>

    </div>
  )
}

export default MobileSlideBox;
