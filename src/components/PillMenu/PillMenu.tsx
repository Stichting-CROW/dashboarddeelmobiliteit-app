import { Link, NavLink } from "react-router-dom";

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
  return (
    <div className="PillMenu px-5">
      <ul className="flex">
        {items.map(x => {
          return (
            <li key={x.title}>
              {typeof x.link === 'function' ? <div onClick={x.link}>
                {x.title}
              </div> : <Link to={x.link}>
                {x.title}
              </Link>}
            </li>
          )
        })}
      </ul>
    </div>
  )
}

export default PillMenu;
