import { useState, useEffect } from 'react';
import { useNavigate, useLocation,  } from "react-router-dom";

import Logo from '../Logo.jsx';
import PillMenu from '../PillMenu/PillMenu';
import { IconButtonClose } from '../IconButtons.jsx';

import LoginStats from '../LoginStats/LoginStats';
import UserList from '../UserList/UserList';

export default function Admin({
  children
}: {
  children: any
}) {
  const navigate = useNavigate();

  // Define menu items for this Admin page
  const pillMenuItems = [
    {title: 'Gebruikers', link: '/admin/users'},
    // {title: 'Data delen', link: '/admin/shared'},
    {title: 'Organisaties', link: '/admin/organisations'},
    {title: 'Statistieken', link: '/admin/stats'},
  ]

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
          {children}
        </div>

      </div>
    </div>
  );
}
