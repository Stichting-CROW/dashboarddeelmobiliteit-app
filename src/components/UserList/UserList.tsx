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

import Button from '../Button/Button';
import AddUser from '../AddUser/AddUser';
import EditUser from '../EditUser/EditUser';
import H1Title from '../H1Title/H1Title';
import H4Title from '../H4Title/H4Title';

const TableRow = (user: any, editClickHandler: Function) => {
  // Get username from URL
  const { username } = useParams();

  return <React.Fragment key={user.username}>
    <div className="text-sm flex flex-col justify-center">
      {user.username}
    </div>
    <div className="text-sm flex flex-col justify-center">
      {user && 
        user.filter_municipality ? "Overheid" 
        : user.filter_operator ? "Aanbieder"
        : user.is_admin ? "Admin"
        : null}
    </div>
    <div className="text-sm">
      <button className='edit-icon' onClick={() => editClickHandler(user)} style={{height: '100%'}} />
      {username !== user.username && <button className='ml-1 delete-icon'  style={{height: '100%'}} />}
    </div>

    {/*Horizontal line*/}
    <div className="col-span-3" style={{
      height: '1px',
      backgroundColor: '#CCCCCC'
    }}>
    </div>

    {/*If user clicked edit: Show edit form */}
    <div className="col-span-3" hidden={username !== user.username}>
      {username === user.username && <EditUser user={user}/>}
    </div>

  </React.Fragment>
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

  // Get list of municipalities and providers
  useEffect(() => {
    const getAclFromDatabase = async () => {
      const response = await fetch('https://api.deelfietsdashboard.nl/dashboard-api/menu/acl', getFetchOptions());
      return await response.json();
    }

    (async () => {
      const acl = await getAclFromDatabase();
      // console.log('acl', acl);
    })();

  }, []);

  // Get user list on component load
  useEffect(() => {
    const getUsersFromDatabase = async () => {
      const response = await fetch('https://api.deelfietsdashboard.nl/dashboard-api/admin/user/list', getFetchOptions());
      return await response.json();
    }

    (async () => {
      const actualUsersFromDatabase = await getUsersFromDatabase();
      // console.log('actualUsersFromDatabase', actualUsersFromDatabase);
      setUsers(actualUsersFromDatabase);
    })();


  }, []);

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
    navigate(`/admin/users/${user.username}`)
  }

  return (
    <div className="">
      <H1Title>Gebruikers</H1Title>
      <div className='mb-8' style={{marginRight: '-0.5rem', marginLeft: '-0.5rem'}}>
        <Button theme='primary' classes='add-new' onClick={handleClick}>Nieuwe gebruiker</Button>
        <Button theme='primary' classes='download'>Exporteer gebruikers als spreadsheet</Button>
      </div>
      <AddUser showModule={showAddUserModule} /> 
      <div className="grid gap-x-4 grid-container" style={{
        rowGap: '0.75rem',
        gridTemplateColumns: 'minmax(100px, 1fr) 100px 50px'
      }}>
        <H4Title>Email</H4Title>
        <H4Title>Rol</H4Title>
        <H4Title></H4Title>
        {users.map(user => TableRow(user, editClickHandler))}
      </div>
    </div>
  );
}

export default UserList;
