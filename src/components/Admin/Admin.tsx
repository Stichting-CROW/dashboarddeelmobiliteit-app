import { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { useNavigate, useLocation,  } from "react-router-dom";
import {getAcl} from '../../api/acl';
import {StateType} from '../../types/StateType';

import Logo from '../Logo.jsx';
import PillMenu from '../PillMenu/PillMenu';
import { IconButtonClose } from '../IconButtons.jsx';

export default function Admin({
  children
}: {
  children: any
}) {
  const navigate = useNavigate();

  const token = useSelector((state: StateType) => (state.authentication.user_data && state.authentication.user_data.token)||null)

  const [acl, setAcl] = useState({});
  const [isAdmin, setIsAdmin] = useState(false);
  const [isOrganisationAdmin, setIsOrganisationAdmin] = useState(false);

  useEffect(() => {
    (async () => {
      const theAcl = await getAcl(token);
      setAcl(theAcl);
      setIsOrganisationAdmin(theAcl.privileges && theAcl.privileges.indexOf('ORGANISATION_ADMIN') > -1);
      setIsAdmin(theAcl.is_admin);
    })();
  }, [token])

  // Define menu items for this Admin page
  const pillMenuItems = [
    // {title: 'Statistieken', link: '/admin/stats'},
  ];
  if(isAdmin || isOrganisationAdmin) {
    pillMenuItems.push({title: 'Gebruikers', link: '/admin/users'})
    pillMenuItems.push({title: 'Data delen', link: '/admin/shared'})
    if(isAdmin) pillMenuItems.push({title: 'Organisaties', link: '/admin/organisations'})
    if(isAdmin) pillMenuItems.push({title: 'Mail-templates', link: '/admin/mail-templates'})
    if(isAdmin) pillMenuItems.push({title: 'Jaarbijdrage', link: '/admin/yearly-costs'})
  }
  pillMenuItems.push({title: 'API keys', link: '/admin/api'})

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
