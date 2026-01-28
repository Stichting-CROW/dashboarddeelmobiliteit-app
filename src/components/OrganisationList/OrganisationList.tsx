import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from "react-router-dom";
import { useParams } from 'react-router';
import './OrganisationList.css'; 
import {
  useSelector
} from 'react-redux';

import {OrganisationType} from '../../types/OrganisationType';
import {StateType} from '../../types/StateType';

// Import API methods
import {getOrganisationList} from '../../api/organisations';
import {getMunicipalityList} from '../../api/municipalities';

// Import components
import Button from '../Button/Button';
import EditOrganisation from '../EditOrganisation/EditOrganisation';
import PageTitle from '../common/PageTitle';
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

const TableRow = ({
  organisations,
  municipalities,
  organisation,
  editClickHandler,
  onSaveHandler
}: {
  organisations: any,
  municipalities: any,
  organisation: any,
  editClickHandler: Function,
  onSaveHandler: Function
}) => {
  // Get organisationId from URL
  const { organisationId } = useParams();

  const readableOrganisationType = (type_of_organisation: string) => {
    const conversionTable = [];
    conversionTable['MUNICIPALITY'] = 'Gemeente';
    conversionTable['OTHER_GOVERNMENT'] = 'Andere overheid';
    conversionTable['OPERATOR'] = 'Aanbieder';
    conversionTable['OTHER_COMPANY'] = 'Ander bedrijf';
    conversionTable['ADMIN'] = 'Admin';
    return conversionTable[type_of_organisation];
  }

  const organisation_type = readableOrganisationType(organisation.type_of_organisation);

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
      {organisationId == organisation.organisation_id && <EditOrganisation
        municipalities={municipalities}
        organisations={organisations}
        organisation={organisation}
        onSaveHandler={onSaveHandler}
      />}
    </div>

  </div>
}

// OrganisationList
const OrganisationList = ({
  showAddOrganisationModule,
}: {
  showAddOrganisationModule?: boolean,
}) => {
  const [organisations, setOrganisations] = useState([]);
  const [municipalities, setMunicipalities] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');

  const navigate = useNavigate();
  const token = useSelector((state: StateType) => (state.authentication.user_data && state.authentication.user_data.token)||null)

  // Get organisation list and municipality list on component load
  useEffect(() => {
    fetchOrganisationList();
    fetchMunicipalityList();
  }, []);

  const fetchOrganisationList = async () => {
    const organisations = await getOrganisationList(token);
    setOrganisations(organisations);
  }

  const fetchMunicipalityList = async () => {
    const result = await getMunicipalityList(token);
    if(! result.municipalities) return;
    setMunicipalities(result.municipalities);
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

  const filteredOrganisations = organisations.filter(x => {
    return (x.name && x.name.toLowerCase().indexOf(searchQuery.toLowerCase()) > -1)
            || x.type_of_organisation.toLowerCase().indexOf(searchQuery.toLowerCase()) > -1;
  });

  return (
    <div className="OrganisationList" style={{maxWidth: '800px'}}>
      <PageTitle>Organisaties</PageTitle>
      <div className='mb-8' style={{marginRight: '-0.5rem', marginLeft: '-0.5rem'}}>
        <Button theme='primary' classes='add-new' onClick={() => handleClick()}>Nieuwe organisatie</Button>
      </div>
      {showAddOrganisationModule && <div className="mb-6">
        <EditOrganisation
          key="EditOrganistion"
          municipalities={municipalities}
          organisations={organisations}
          onSaveHandler={fetchOrganisationList} />
      </div>}
      <div className="
        Table
      ">
        <div className="TableRow flex justify-between no-hover">
          <H4Title className="col-name">Naam</H4Title>
          <H4Title className="col-type">Type</H4Title>
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
        {organisations ? filteredOrganisations.map(org => {
          return <TableRow
            organisations={organisations}
            organisation={org}
            municipalities={municipalities}
            editClickHandler={editClickHandler}
            onSaveHandler={fetchOrganisationList}
          />;
        }) : <></>}
      </div>
    </div>
  );
}

export default OrganisationList;
