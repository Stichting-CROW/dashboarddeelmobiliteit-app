import React, { useState, useEffect } from 'react';
import { Redirect, useLocation,  } from "react-router-dom";

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

  // Run this function on component load
  useEffect(() => {
    const usersFromDatabase = [
      {id: 1, name: 'Giulia'},
      {id: 2, name: 'Sven'}
    ];
    setUsers(usersFromDatabase);
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
