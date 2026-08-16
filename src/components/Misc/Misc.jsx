import { useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useNavigate } from "react-router-dom";
import {StateType} from '../../types/StateType';

import LogoCrow from '../LogoCrow.jsx';
import PillMenu from '../PillMenu/PillMenu';
import { IconButtonClose } from '../IconButtons.jsx';
import LogoDashboardDeelmobiliteit from '../Logo/LogoDashboardDeelmobiliteit';

export default function Misc({children, contentWidth = '600px'}) {
  const navigate = useNavigate();

  const isLoggedIn = useSelector((state: StateType) => {
    return state.authentication.user_data ? true : false;
  });

  const loggedInPillMenuItems = [
    {
      title: 'Start',
      link: '/profile',
    },
    {
      title: 'Documentatie',
      link: '/docs',
    },
    {
      title: 'Exporteer',
      link: '/export'
    },
    {
      title: 'Datafeeds',
      link: '/active_feeds',
    },
    // {
    //   title: 'Voertuigplafonds',
    //   link: '/permits',
    // },
    {
      title: 'API keys',
      link: '/profile/api'
    }
  ];

  const guestPillMenuItems = [
    {
      title: 'Functies',
      link: '/features',
    },
    {
      title: 'Over',
      link: '/over',
    },
    {
      title: 'Documentatie',
      link: '/docs',
    },
    {
      title: 'Datafeeds',
      link: '/active_feeds',
    },
  ];

  const allowedPillMenuItems = isLoggedIn
    ? loggedInPillMenuItems
    : guestPillMenuItems;

  return (
    <div className="
      px-4
      min-h-screen
      sm:flex sm:justify-center
      sm:px-0
    ">
      <div className="mx-auto py-8">

        <IconButtonClose
          onClick={() => navigate('/')}
          style={{position: 'absolute', right: '30px', top: '18px'}}
        />

        <LogoDashboardDeelmobiliteit />

        <div className="mt-8">
          <PillMenu items={allowedPillMenuItems} />
        </div>

        <div className="
          mt-8
        " style={{
          width: contentWidth,
          maxWidth: '100%'
        }}>
          {children}
        </div>

      </div>
    </div>
  );
}
