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
        <li>
          <Link to="/profile">
            Profiel
          </Link>
        </li>
        <li>
          <Link to="/faq">
            FAQ
          </Link>
        </li>
        <li>
          <Link to="/export">
            Exporteer
          </Link>
        </li>
      </ul>
    </div>
  )
}

export default PillMenu;
