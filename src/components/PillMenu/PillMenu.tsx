import { Link, NavLink, useLocation } from "react-router-dom";

import './PillMenu.css';

interface Item {
  title: '',
  icon: '',
  link: '',
  isActive: false
}

interface PillMenuProps {
  items: any
}

function PillMenu({
  items,
}: PillMenuProps) {
  // const location = useLocation();
  // const pathname = location.pathname;

  return (
    <div className="PillMenu px-5">
      <ul className="flex">
        {items.map(x => {
          return (
            <li key={x.title}>
              {typeof x.link === 'function' ? <div onClick={x.link}>
                {x.title}
              </div> : <NavLink to={x.link}>
                {x.title}
              </NavLink>}
            </li>
          )
        })}
      </ul>
    </div>
  )
}

export default PillMenu;
