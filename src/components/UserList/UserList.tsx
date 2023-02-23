import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from "react-router-dom";
import { useParams } from 'react-router';
import './UserList.css'; 
import {
  // useDispatch,
  useSelector
} from 'react-redux';

import Button from '../Button/Button';
import AddUser from '../AddUser/AddUser';
import EditUser from '../EditUser/EditUser';
import H1Title from '../H1Title/H1Title';
import H4Title from '../H4Title/H4Title';

const TableRow = (user: any, editClickHandler: Function) => {
  // Get username from URL
  const { username } = useParams();

  return <React.Fragment key={user.id}>
    <div className="text-sm">
      {user.username}
    </div>
    <div className="text-sm">
      {user && 
        user.filter_municipality ? "Overheid" 
        : user.filter_operator ? "Aanbieder"
        : user.is_admin ? "Admin"
        : null}
    </div>
    <div className="text-sm">
      <button onClick={() => editClickHandler(user)}>Edit</button>
      {username !== user.username && <button>Delete</button>}
    </div>

    {/*If user clicked edit: Show edit form */}
    <div className="col-span-3">
      {username === user.username && <EditUser user={user} />}
    </div>

  </React.Fragment>
}

// Mockup for UserList
export default function UserList({
  showAddUserModule
}: {
  showAddUserModule?: boolean
}) {
  const [users, setUsers] = useState([]);

  const navigate = useNavigate();
  const token = useSelector(state => (state.authentication.user_data && state.authentication.user_data.token)||null)

  const fetchOptions = {
    headers: {
      "authorization": `Bearer ${token}`,
      'mode':'no-cors'
    }
  }

  // Get list of municipalities and providers
  useEffect(() => {
    const getAclFromDatabase = async () => {
      const response = await fetch('https://api.deelfietsdashboard.nl/dashboard-api/menu/acl', fetchOptions);
      return await response.json();
    }

    (async () => {
      const acl = await getAclFromDatabase();
      console.log('acl', acl);
    })();

  }, []);

  // Get user list on component load
  useEffect(() => {
    const getUsersFromDatabase = async () => {
      const response = await fetch('https://api.deelfietsdashboard.nl/dashboard-api/admin/user/list', fetchOptions);
      return await response.json();
    }

    (async () => {
      const actualUsersFromDatabase = await getUsersFromDatabase();
      console.log('actualUsersFromDatabase', actualUsersFromDatabase);
      setUsers(actualUsersFromDatabase);
    })();


  }, []);

  const handleClick = () => {
    navigate('/admin/users/new');
  }

  const editClickHandler = (user: object) => {
    navigate(`/admin/users/${user.username}`)
  }

  return (
    <div className="">
      <H1Title>Gebruikers</H1Title>
      <div className='pb-4'>
        <Button theme='primary' classes='add-new' onClick={handleClick}>Nieuwe gebruiker</Button>
        <Button theme='primary' classes='download'>Exporteer gebruikers als spreadsheet</Button>
      </div>
      <AddUser showModule={showAddUserModule} /> 
      <div className="grid gap-4 grid-cols-3 grid-container">
        <H4Title>Email</H4Title>
        <H4Title>Rol</H4Title>
        <H4Title></H4Title>
        {users.map(user => TableRow(user, editClickHandler))}
      </div>
    </div>
  );
}
