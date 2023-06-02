import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from "react-router-dom";
import { useParams } from 'react-router';
import './SharedDataOverview.css'; 
import {
  // useDispatch,
  useSelector
} from 'react-redux';

import {OrganisationType} from '../../types/OrganisationType';
import {StateType} from '../../types/StateType';

// Import API methods
import {getOrganisationList} from '../../api/organisations';

// Import components
import Button from '../Button/Button';
import GrantUser from './GrantUser';
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
  organisation: any,
  editClickHandler: Function,
  onSaveHandler: Function
) => {
  // Get organisationId from URL
  const { organisationId } = useParams();

  let organisation_type;
  if(organisation.type_of_organisation === 'OPERATOR') {
    organisation_type = 'Aanbieder';
  }
  else if(organisation.type_of_organisation === 'MUNICIPALITY') {
    organisation_type = 'Gemeente';
  }
  else if(organisation.type_of_organisation === 'ADMIN') {
    organisation_type = 'Admin';
  }

  return <div
    key={organisation.organisation_id}
    className={`TableRow ${organisationId == organisation.organisation_id ? 'no-hover' : ''}`}
    onClick={() => editClickHandler(organisation)}
  >
    <div className="flex">
      <div className="col-name text-sm">
        {organisation.name}
      </div>
      <div className="col-type text-sm">
        {organisation_type}
      </div>
      <div className="col-actions text-sm flex justify-end">
        <button className='edit-icon' style={{height: '100%'}} />
      </div>
    </div>

    {/*If organisation clicked edit: Show edit form */}
    <div className="col-span-3" hidden={organisationId != organisation.organisation_id}>
      {organisationId == organisation.organisation_id && <GrantUser organisation={organisation} onSaveHandler={onSaveHandler} />}
    </div>

  </div>
}

// SharedDataOverview
const SharedDataOverview = ({
  showAddOrganisationModule
}: {
  showAddOrganisationModule?: boolean
}) => {
  const [organisations, setOrganisations] = useState([]);
  const [showGrantUserForm, setShowGrantUserForm] = useState(false);

  const navigate = useNavigate();
  const token = useSelector((state: StateType) => (state.authentication.user_data && state.authentication.user_data.token)||null)

  // Get organisation list on component load
  useEffect(() => {
    fetchOrganisationList();
  }, []);

  const fetchOrganisationList = async () => {
    const organisations = await getOrganisationList(token);
    setOrganisations(organisations);
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
    navigate('/admin/organisations/new');
  }

  const editClickHandler = (organisation: OrganisationType) => {
    navigate(`/admin/organisations/${organisation.organisation_id}`)
  }

  return (
    <div className="SharedDataOverview" style={{maxWidth: '800px'}}>
      <H1Title>
        Data delen
      </H1Title>
      <p>
        Jouw organisatie heeft toegang tot alle data van Gemeente Rotterdam.
      </p>
      <p>
        Stel hieronder in welke organisaties en personen toegang hebben tot de data van jouw organisatie.
      </p>
      <div className='mb-8' style={{marginRight: '-0.5rem', marginLeft: '-0.5rem'}}>
        <Button theme='primary' classes='add-new' onClick={() => setShowGrantUserForm(true)}>Deel met gebruiker</Button>
      </div>
      {showGrantUserForm && <div className="mb-6">
        <GrantUser onSaveHandler={() => setShowGrantUserForm(false)} />
      </div>}
      <div className="
        Table
      ">
        <div className="TableRow flex justify-between no-hover">
          <H4Title className="col-name">Naam</H4Title>
          <H4Title className="col-type">Type</H4Title>
          <H4Title className="col-actions"></H4Title>
        </div>
        {organisations ? organisations.map(org => TableRow(org, editClickHandler, fetchOrganisationList)) : <></>}
      </div>
    </div>
  );
}

export default SharedDataOverview;
