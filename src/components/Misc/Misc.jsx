import { useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useNavigate } from "react-router-dom";
import {StateType} from '../../types/StateType';

import LogoCrow from '../LogoCrow.jsx';
import PillMenu from '../PillMenu/PillMenu';
import { IconButtonClose } from '../IconButtons.jsx';

export default function Misc({children}) {
  const navigate = useNavigate();

  const isLoggedIn = useSelector((state: StateType) => {
    return state.authentication.user_data ? true : false;
  });

  const pillMenuItems = [
    {
      title: 'Profiel',
      link: '/profile',
    },
    {
      title: 'Documentatie',
      link: '/docs',
      public: true
    },
    {
      title: 'Exporteer',
      link: '/export'
    },
    {
      title: 'Datafeeds',
      link: '/active_feeds',
      public: true
    },
    // {
    //   title: 'Voertuigplafonds',
    //   link: '/permits',
    //   public: false
    // },
    {
      title: 'API keys',
      link: '/profile/api'
    }
  ];

  // Only show pill items user has access to
  const allowedPillMenuItems = pillMenuItems.filter(x => {
    if(isLoggedIn) return true;
    return x.public === true;
  });

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

        <LogoCrow title="" />

        <div className="mt-8">
          <PillMenu items={allowedPillMenuItems} />
        </div>

        <div className="
          mt-8
        " style={{
          width: '600px',
          maxWidth: '100%'
        }}>
          {children}
        </div>

      </div>
    </div>
  );
}
