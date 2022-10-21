import { Link } from "react-router-dom";

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
          return <li key={x.url}>
            <Link to={x.url}>
              {x.title}
            </Link>
          </li>
        })}
      </ul>
    </div>
  )
}

export default PillMenu;
