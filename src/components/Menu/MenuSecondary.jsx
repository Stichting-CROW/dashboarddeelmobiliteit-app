import { useDispatch } from 'react-redux';

import './MenuSecondaryItem.css';
// import { IconButtonFilter } from './IconButtons.jsx';
// import { clearUser } from '../actions/authentication';

function MenuSecondaryItem(props) {
  return (
    <a
      href="#"
      className="MenuSecondaryItem cursor-pointer mx-2"
      onClick={props.onClick}
    >
      {props.text}
    </a>
  )
}

function MenuSecondary() {
  const dispatch = useDispatch()

  const setVisibility = (name, visibility) => {
    dispatch({
      type: `SET_VISIBILITY`,
      payload: {
        name: name,
        visibility: visibility
      }
    })
  }

  return (
    <div className="MenuSecondary block sm:hidden absolute left-0 z-10">
      <MenuSecondaryItem
        text="Filters"
        onClick={() => {
          setVisibility('FILTERBAR', true)
        }}
      />
      <MenuSecondaryItem
        text="Lagen"
        onClick={() => {
          setVisibility('MenuSecondary.layers', true)
        }}
      />
      {/*
      <MenuSecondaryItem
        text="Info"
        onClick={() => {
          setVisibility('METASTATS', true)
        }}
      />
    */}
    </div>
  )
}

export default MenuSecondary;

