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
import {getUserList} from '../../api/users';

// Import components
import Button from '../Button/Button';
import AddUser from '../AddUser/AddUser';
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
      <div className="col-email text-sm">
        {user.is_admin ? '👑' : ''} {user.user_id}
      </div>
      <div className="col-organisation text-sm">
        {user.organisation_name}
      </div>
      <div className="col-privileges text-sm">
        {user.privileges.map(x => {
          return <div key={`x_${user.user_id}_${x}`}>{readablePrivilege(x)}</div>
        })}
        {user.privileges.length === 0 && user.is_admin ? 'Super-admin' : ''}
      </div>
      <div className="col-actions text-sm flex justify-end">
        <button className='edit-icon' style={{height: '100%'}} />
        {username !== user.user_id && <button className='ml-1 delete-icon' style={{height: '100%'}} />}
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
  showAddUserModule
}: {
  showAddUserModule?: boolean
}) => {
  const [users, setUsers] = useState([]);

  const navigate = useNavigate();
  const token = useSelector((state: StateType) => (state.authentication.user_data && state.authentication.user_data.token)||null)

  // Get user list on component load
  useEffect(() => {
    fetchUserList();
  }, []);

  const fetchUserList = async () => {
    const users = await getUserList(token);
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
          <H4Title className="col-email">Email</H4Title>
          <H4Title className="col-organisation">Organisatie</H4Title>
          <H4Title className="col-privileges">Privileges</H4Title>
          <H4Title className="col-actions"></H4Title>
        </div>
        {users.map(user => TableRow(user, editClickHandler, fetchUserList))}
      </div>
    </div>
  );
}

export default UserList;
