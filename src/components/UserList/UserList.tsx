import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from "react-router-dom";
import { useParams } from 'react-router';
import './UserList.css'; 
import {
  // useDispatch,
  useSelector
} from 'react-redux';

import {UserType} from '../../types/UserType';
import {StateType} from '../../types/StateType';

// Import API methods
import {
  getUserList,
  getUserListForOrganisation
} from '../../api/users';

// Import components
import Button from '../Button/Button';
import EditUser from '../EditUser/EditUser';
import H1Title from '../H1Title/H1Title';
import H4Title from '../H4Title/H4Title';

const readablePrivilege = (privilegeKey) => {
  switch(privilegeKey) {
    case 'CORE_GROUP':
      return 'Kernteam';
    case 'MICROHUB_EDIT':
      return 'Microhub bewerken';
    case 'DOWNLOAD_RAW_DATA':
      return 'Ruwe data download';
    case 'ORGANISATION_ADMIN':
      return 'Organisatie-admin';
  }
}

const TableRow = (
  user: any,
  editClickHandler: Function,
  onSaveHandler: Function
) => {
  // Get username from URL
  const { username } = useParams();

  return <div
    key={user.user_id}
    className={`TableRow ${username === user.user_id ? 'no-hover' : ''}`}
    onClick={() => editClickHandler(user)}
  >
    <div className="flex">
      <div className="px-2 col-email text-sm whitespace-nowrap text-ellipsis overflow-hidden" title={user.user_id}>
        {user.is_admin ? '👑' : ''} {user.user_id}
      </div>
      <div className="px-2 col-organisation text-sm whitespace-nowrap text-ellipsis overflow-hidden">
        {user.organisation_name}
      </div>
      <div className="px-2 col-privileges text-sm">
        {user.privileges.map(x => {
          return <div key={`x_${user.user_id}_${x}`}>{readablePrivilege(x)}</div>
        })}
        {user.is_admin ? 'Super-admin' : ''}
      </div>
      <div className="px-2 col-actions text-sm flex justify-end">
        <button className='edit-icon' style={{height: '100%'}} />
        {/*{username !== user.user_id && <button className='ml-1 delete-icon' style={{height: '100%'}} />}*/}
      </div>
    </div>

    {/*If user clicked edit: Show edit form */}
    <div className="col-span-3" hidden={username !== user.user_id}>
      {username === user.user_id && <EditUser user={user} onSaveHandler={onSaveHandler} />}
    </div>

  </div>
}

// UserList
const UserList = ({
  showAddUserModule,
  acl
}: {
  showAddUserModule?: boolean
  acl: any
}) => {
  const [users, setUsers] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');

  const navigate = useNavigate();
  const token = useSelector((state: StateType) => (state.authentication.user_data && state.authentication.user_data.token)||null)

  // Get user list on component load
  useEffect(() => {
    fetchUserList();
  }, [acl]);

  const fetchUserList = async () => {
    let users;
    // Get users for organisation
    if(isOrganisationAdmin() && ! isAdmin()) {
      users = await getUserListForOrganisation(token, acl.part_of_organisation);
    }
    // Or get all users if user is an admin
    else if(isAdmin()) {
      users = await getUserList(token);
    }
    // Otherwise just redirect to home, as the user doesn't have rights to see the user list
    else {
      navigate('/');
      return;
    }
    setUsers(users);
  }

  const getFetchOptions = () => {
    return {
      headers: {
        "authorization": `Bearer ${token}`,
        'mode':'no-cors'
      }
    }
  }

  const handleClick = () => {
    navigate('/admin/users/new');
  }

  const editClickHandler = (user: UserType) => {
    navigate(`/admin/users/${user.user_id}`)
  }

  const isAdmin = () => acl.is_admin === true;

  const isOrganisationAdmin = () => {
    return acl.privileges && acl.privileges.indexOf('ORGANISATION_ADMIN') > -1;
  }

  const filteredUsers = users.filter(x => {
    return x.user_id.toLowerCase().indexOf(searchQuery.toLowerCase()) > -1
            || x.organisation_name.toLowerCase().indexOf(searchQuery.toLowerCase()) > -1;
  });

  return (
    <div className="" style={{maxWidth: '800px'}}>
      <H1Title>Gebruikers</H1Title>
      <div className='mb-8' style={{marginRight: '-0.5rem', marginLeft: '-0.5rem'}}>
        <Button theme='primary' classes='add-new' onClick={() => handleClick()}>Nieuwe gebruiker</Button>
        <Button theme='primary' classes='download'>Exporteer gebruikers als spreadsheet</Button>
      </div>
      {showAddUserModule && <div className="mb-6">
        <EditUser onSaveHandler={fetchUserList} />
      </div>}
      <div className="
        Table
      ">
        <div className="TableRow flex justify-between no-hover">
          <H4Title className="col-email">E-mail</H4Title>
          <H4Title className="col-organisation">Organisatie</H4Title>
          <H4Title className="col-privileges">Privileges</H4Title>
          <H4Title className="col-actions"></H4Title>
        </div>
        <div className="TableRow flex justify-between no-hover">
          <div className="w-full">
            <input
              type="search"
              placeholder="Zoek.."
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full rounded-lg inline-block border-solid border-2 px-2 py-2 text-sm"
            />
          </div>
        </div>
        {users ? filteredUsers.map(user => TableRow(user, editClickHandler, fetchUserList)) : ''}
      </div>
    </div>
  );
}

export default UserList;
