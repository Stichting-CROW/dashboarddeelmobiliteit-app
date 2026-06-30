import React, { useState, useEffect } from 'react';
import Select from 'react-select';
import { useLocation, useNavigate } from "react-router-dom";
import { useParams } from 'react-router';
import moment from 'moment';
import './UserList.css'; 
import {
  // useDispatch,
  useSelector
} from 'react-redux';
import {
  downloadCsv,
} from '../../helpers/stats/index';

import {UserType} from '../../types/UserType';
import {StateType} from '../../types/StateType';

// Import API methods
import {
  getUserList,
  getUserListForOrganisation
} from '../../api/users';
import {
  getOrganisationList
} from '../../api/organisations';

// Import components
import Button from '../Button/Button';
import EditUser from '../EditUser/EditUser';
import PageTitle from '../common/PageTitle';
import H4Title from '../H4Title/H4Title';

const DELIMITER  = ';';

const readablePrivilege = (privilegeKey) => {
  switch(privilegeKey) {
    case 'CORE_GROUP':
      return 'Kernteam';
    case 'MICROHUB_EDIT':
      return 'Zones beheren';
    case 'DOWNLOAD_RAW_DATA':
      return 'Ruwe data download';
    case 'ORGANISATION_ADMIN':
      return 'Organisatie-admin';
  }
}

const TableRow = ({
  isAdmin,
  acl,
  user,
  editClickHandler,
  onSaveHandler
}: {
  isAdmin: boolean,
  acl,
  user: any,
  editClickHandler: Function,
  onSaveHandler: Function
}) => {
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
      {isAdmin && <div className="px-2 col-organisation text-sm whitespace-nowrap text-ellipsis overflow-hidden">
        {user.organisation_name}
      </div>}
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
      {username === user.user_id && <EditUser acl={acl} user={user} onSaveHandler={onSaveHandler} />}
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
  const [organisationOptionList, setOrganisationOptionList] = useState([]);
  const [selectedOrganisation, setSelectedOrganisation] = useState(null);

  const navigate = useNavigate();
  const token = useSelector((state: StateType) => (state.authentication.user_data && state.authentication.user_data.token)||null)

  // Get user list on component load
  useEffect(() => {
    fetchUserList();
  }, [acl]);

  // Fetch the list of organisations (super-admin only) to populate the filter
  useEffect(() => {
    if(! acl || acl.is_admin !== true) return;
    fetchOrganisationList();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [acl]);

  const fetchOrganisationList = async () => {
    const organisations = await getOrganisationList(token);
    if(! organisations || ! organisations.forEach) return;
    const optionsList = [];
    organisations.forEach(x => {
      optionsList.push({
        value: x.organisation_id,
        label: x.name
      });
    });
    optionsList.sort((a, b) => a.label.localeCompare(b.label));
    setOrganisationOptionList(optionsList);
  }

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
    // Filter by selected organisation (if any)
    if(selectedOrganisation && selectedOrganisation.value && x.organisation_id !== selectedOrganisation.value) {
      return false;
    }
    // Filter by free text search
    return x.user_id.toLowerCase().indexOf(searchQuery.toLowerCase()) > -1
            || x.organisation_name.toLowerCase().indexOf(searchQuery.toLowerCase()) > -1;
  });

  const prepareDataForCsv = (data: any) => {
    if(! data || data.length <= 0) return;
    if(  typeof data !== 'object') return;
    console.log('data', data);

    let csvRows = [];

    const privileges = [
      'ORGANISATION_ADMIN',
      'CORE_GROUP',
      'MICROHUB_EDIT',
      'DOWNLOAD_RAW_DATA'
    ];

    // Get headers
    const headers = ['E-mail', 'Organisatie', 'Super-admin'];
    privileges.forEach((key) => {
      headers.push(readablePrivilege(key));
    });
    csvRows.push(headers.join(DELIMITER));

    // Loop over the rows
    for (const x of data) {
      // Add standard columns
      const values = [x.user_id, x.organisation_name, (x.is_admin ? 'Ja' : '')];
      // Add privilege columns
      privileges.forEach((key) => {
        if(x.privileges && x.privileges.indexOf(key) > -1) {
          values.push('Ja');
        } else {
          values.push('');
        }
      });
      // Add columns to spreadsheet
      csvRows.push(values.join(DELIMITER));
    };

    return csvRows.join("\n");
  }

  return (
    <div className="" style={{maxWidth: '800px'}}>
      <div className="flex justify-between flex-wrap items-center">
        <PageTitle style={{marginTop: 0}}>Gebruikers</PageTitle>
        {isAdmin() && organisationOptionList.length > 1 &&
          <div>
            <Select
              className="my-2 w-80"
              isMulti={false}
              isClearable={true}
              options={organisationOptionList}
              value={selectedOrganisation}
              placeholder="Filter op organisatie"
              onChange={(choice: any) => {
                setSelectedOrganisation(choice || null);
              }}
            />
          </div>
        }
      </div>
      <div className='mb-8' style={{marginRight: '-0.5rem', marginLeft: '-0.5rem'}}>
        <Button theme='primary' classes='add-new' onClick={() => handleClick()}>Nieuwe gebruiker</Button>
        <Button theme='primary' classes='download' onClick={() => downloadCsv(
          prepareDataForCsv(filteredUsers),
          `Dashboard Deelmobiliteit gebruikers - ${moment().format('YYYY-MM-DD HH_mm')}.csv`
        )}>Exporteer gebruikers als spreadsheet</Button>
      </div>
      {showAddUserModule && <div className="mb-6">
        <EditUser acl={acl} onSaveHandler={fetchUserList} />
      </div>}
      <div className="
        Table
      ">
        <input
          type="search"
          placeholder="Zoek gebruiker.."
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-80 rounded-lg inline-block border-solid border-2 px-2 py-2 text-sm mb-2"
         />
        <div className="TableRow flex justify-between no-hover">
          <H4Title className="col-email whitespace-nowrap overflow-hidden pl-2">E-mail</H4Title>
          {isAdmin() && <H4Title className="col-organisation">Organisatie</H4Title>}
          <H4Title className="col-privileges">Privileges</H4Title>
          <H4Title className="col-actions"></H4Title>
        </div>
        {users ? filteredUsers.map(user =>
          <TableRow key={user.user_id} acl={acl} isAdmin={isAdmin()} user={user} editClickHandler={editClickHandler} onSaveHandler={fetchUserList} />) : ''
        }
      </div>
    </div>
  );
}

export default UserList;
