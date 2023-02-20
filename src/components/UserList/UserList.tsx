import React, { useState, useEffect } from 'react';
import { Redirect, useLocation,  } from "react-router-dom";

import {
  // useDispatch,
  useSelector
} from 'react-redux';
import Button from '../Button/Button';
import AddUserModule from '../AddUserModule/AddUserModule';

const renderTableRow = (user: any) => {
  return <React.Fragment key={user.id}>
    <div className="">
      {user.username}
    </div>
    <div className="">
      {user && 
        user.filter_municipality ? "Overheid" 
        : user.filter_operator ? "Aanbieder"
        : user.is_admin ? "Admin"
        : null}
    </div>
    <div className="">
      <button>Edit</button>
      <button>Delete</button>
    </div>
  </React.Fragment>
}

// Mockup for UserList
export default function UserList() {
  const [users, setUsers] = useState([]);
  const [showModule, setShowModule] = useState(false)

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

  const handleClik = () => {
    setShowModule(true)
  }

  return (
    <div className="">
      <h1 className="
        text-4xl
        font-bold
      ">
        Gebruikers
      </h1>
      <div>
        <Button onClick={handleClik}>Nieuwe gebruiker</Button>
        <Button>Exporteer gebruikers als spreadsheet</Button>
      </div>
      <AddUserModule showModule={showModule} setShowModule={setShowModule}/> 
      <div className="grid gap-4 grid-cols-3">
        <div className="font-bold">Email</div>
        <div className="font-bold">Rol</div>
        <div className="font-bold"></div>
        {users.map(user => renderTableRow(user))}
      </div>
    </div>
  );
}
