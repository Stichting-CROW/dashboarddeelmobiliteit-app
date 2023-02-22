import { useState, useEffect } from 'react';
import { useNavigate, useLocation,  } from "react-router-dom";

import Logo from '../Logo.jsx';
import PillMenu from '../PillMenu/PillMenu';
import { IconButtonClose } from '../IconButtons.jsx';

import LoginStats from '../LoginStats/LoginStats';
import UserList from '../UserList/UserList';

export default function Admin() {
  const navigate = useNavigate();

  // Our state variables
  const [pathName, setPathName] = useState(document.location ? document.location.pathname : null);

  // Store window location in a local variable
  let location = useLocation();
  useEffect(() => {
    setPathName(location ? location.pathname : null);
  }, [location]);

  // Define menu items for this Admin page
  const pillMenuItems = [
    {title: 'Gebruikers', link: '/admin/users'},
    {title: 'Statistieken', link: '/admin/stats'},
  ]

  const renderInnerContent = (pathname) => {
    if(! pathname) return <div />

    if(pathname === '/admin') return <UserList />
    if(pathname === '/admin/users') return <UserList />
    if(pathname === '/admin/stats') return <LoginStats />
  }

  return (
    <div className="
      px-4
      min-h-screen
      sm:flex sm:justify-center
      sm:px-0
    ">
      <div className="mx-auto px-8 py-8" style={{
        width: '100%',
        maxWidth: '100%'
      }}>

        <IconButtonClose
          onClick={() => navigate('/')}
          style={{position: 'absolute', right: '30px', top: '18px'}}
        />

        <Logo title="Admin" />

        <div className="mt-8">
          <PillMenu items={pillMenuItems} />
        </div>

        <div className="
          mt-8
        ">
          {renderInnerContent(location?.pathname)}
        </div>

      </div>
    </div>
  );
}
