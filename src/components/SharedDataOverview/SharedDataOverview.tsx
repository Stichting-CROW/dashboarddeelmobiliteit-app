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
import {
  getOrganisationList
} from '../../api/organisations';

import {
  getDataAccessReceived
} from '../../api/dataAccess';

// Import components
import Button from '../Button/Button';
import GrantUser from './GrantUser';
import H1Title from '../H1Title/H1Title';
import H4Title from '../H4Title/H4Title';

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
      <div className="col-actions text-sm flex justify-end">
        <button className='edit-icon' style={{height: '100%'}} />
      </div>
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
  const [dataAccessReceived, setDataAccessReceived] = useState([]);
  const [showGrantUserForm, setShowGrantUserForm] = useState(false);

  const navigate = useNavigate();
  const token = useSelector((state: StateType) => (state.authentication.user_data && state.authentication.user_data.token)||null)

  // Get data on component load
  useEffect(() => {
    fetchOrganisationList();
    fetchDataAccessReceived();
  }, []);

  const fetchOrganisationList = async () => {
    const organisations = await getOrganisationList(token);
    setOrganisations(organisations);
  }

  const fetchDataAccessReceived = async () => {
    const result = await getDataAccessReceived(token);
    setDataAccessReceived(result);
  }

  const getDataAccessReceivedString = (data) => {
    if(! data || data.length === 0) return;
    let organisationsString = '';
    data.forEach(x => {
      // Only add if this _organisation_ was granted
      if(! x.granted_organisation_id) return;
      // Add 'en' between the organisations
      if(organisationsString.length > 0) {
        organisationsString += `en `;
      }
      // Append the organisation name
      organisationsString += `${x.owner_organisation_name}`;
    });
    if(organisationsString && organisationsString.length > 0) {
      return `Jouw organisatie heeft toegang tot alle data van ${organisationsString}.`;
    } else {
      return '';
    }
  }

  const handleClick = () => {
    navigate('/admin/organisations/new');
  }

  const editClickHandler = (organisation: OrganisationType) => {
    navigate(`/admin/organisations/${organisation.organisation_id}`)
  }

  console.log('dataAccessReceived', dataAccessReceived)

  return (
    <div className="SharedDataOverview" style={{maxWidth: '800px'}}>
      <H1Title>
        Data delen
      </H1Title>
      {(dataAccessReceived && dataAccessReceived.filter(x => x.granted_organisation_id !== null).length > 0) && <p>
        {getDataAccessReceivedString(dataAccessReceived)}
      </p>}
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
          <H4Title className="col-name">Gedeeld met</H4Title>
          <H4Title className="col-actions">Intrekken</H4Title>
        </div>
        {organisations ? organisations.map(org => TableRow(org, editClickHandler, fetchOrganisationList)) : <></>}
      </div>
    </div>
  );
}

export default SharedDataOverview;
