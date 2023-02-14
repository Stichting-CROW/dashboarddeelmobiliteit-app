import React, { useState, useEffect } from 'react';
import { Redirect, useLocation,  } from "react-router-dom";

import {
  // useDispatch,
  useSelector
} from 'react-redux';

const renderTableRow = (user: any) => {
  return <React.Fragment key={user.id}>
    <div className="">
      {user.name}
    </div>
    <div className="">
      Admin
    </div>
  </React.Fragment>
}

// Mockup for UserList
export default function UserList() {
  const [users, setUsers] = useState([]);

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
      // setUsers(actualUsersFromDatabase);
    })();

    const exampleUsers = [
      {id: 1, name: 'Giulia'},
      {id: 2, name: 'Sven'}
    ];

    setUsers(exampleUsers);
  }, []);

  return (
    <div className="">
      <h1 className="
        text-4xl
        font-bold
      ">
        Gebruikers
      </h1>
      <div className="grid gap-4 grid-cols-2">
        <div className="font-bold">Email</div>
        <div className="font-bold">Rol</div>
        {users.map(user => renderTableRow(user))}
      </div>
    </div>
  );
}
