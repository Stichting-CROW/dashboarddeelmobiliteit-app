import { useState, useEffect } from 'react';
import { Redirect, useLocation,  } from "react-router-dom";

import Logo from '../Logo.jsx';
import PillMenu from '../PillMenu/PillMenu';
import LoginStats from '../LoginStats/LoginStats';
import { IconButtonClose } from '../IconButtons.jsx';

export default function Admin() {
  // Our state variables
  const [pathName, setPathName] = useState(document.location.pathname);

  // Store window location in a local variable
  let location = useLocation();
  useEffect(() => {
    setPathName(location ? location.pathname : null);
  }, [location]);

  // Define menu items for this Admin page
  const pillMenuItems = [
    {title: 'Statistieken', url: '/admin/stats'},
  ]

  const renderInnerContent = (pathname) => {
    if(! pathname) return <div />

    if(pathname === '/admin') return <LoginStats />
    if(pathname === '/admin/stats') return <LoginStats />
  }

  return (
    <div className="
      px-4
      min-h-screen
      sm:flex sm:justify-center
      sm:px-0
    ">
      <div className="mx-auto py-8" style={{
        width: '500px',
        maxWidth: '100%'
      }}>

        <IconButtonClose
          onClick={() => setDoRenderRedirect(true)}
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
