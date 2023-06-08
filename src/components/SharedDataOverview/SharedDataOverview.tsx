import React, { useState, useEffect } from 'react';
import Select from 'react-select'
import { useLocation, useNavigate } from "react-router-dom";
import { useParams } from 'react-router';
import './SharedDataOverview.css'; 
import Modal from '../Modal/Modal.jsx';
import {
  // useDispatch,
  useSelector
} from 'react-redux';

import {OrganisationType} from '../../types/OrganisationType';
import {StateType} from '../../types/StateType';
import {AclType} from '../../types/AclType';

// Import API methods
import {
  getOrganisationList
} from '../../api/organisations';
import {getAcl} from '../../api/acl';

import {
  getDataAccessReceived,
  getDataAccessGranted,
  revokeDataAccess
} from '../../api/dataAccess';

// Import components
import Button from '../Button/Button';
import GrantUser from './GrantUser';
import GrantOrganisation from './GrantOrganisation';
import H1Title from '../H1Title/H1Title';
import H4Title from '../H4Title/H4Title';

const TableRow = ({
  entry,
  onRevokeHandler
}, {
  entry: any,
  onRevokeHandler: Function
}) => {
  const [showRevokeModal, setShowRevokeModal] = useState(false);

  return (
    <>
      <div
        key={entry.grant_view_data_id}
        className={`TableRow no-hover`}
      >
        <div className="flex">
          <div className="col-name text-sm">
            {entry.granted_user_id ? entry.granted_user_id : ''}
            {entry.granted_organisation_name ? entry.granted_organisation_name : ''}
          </div>
          <div className="col-actions text-sm flex justify-end">
            <button className='delete-icon' style={{height: '100%'}} onClick={() => setShowRevokeModal(true)} />
          </div>

          {showRevokeModal ? (
            <Modal
              isVisible={showRevokeModal}
              title="Weet je het zeker?"
              button1Title={'Nee, annuleer'}
              button1Handler={(e) => {
                setShowRevokeModal(false);
              }}
              button2Title={"Ja, stop met delen"}
              button2Handler={async (e) => {
                e.preventDefault();
                // Hide modal
                setShowRevokeModal(false);
                // Revoke action
                onRevokeHandler(entry);
              }}
              hideModalHandler={() => {
                setShowRevokeModal(false);
              }}
            >
              <p className="mb-4">
                Weet je zeker dat je wilt stoppen met delen met deze organisatie/persoon?
              </p>
            </Modal>
          ): <></>}
        </div>
      </div>
    </>
  )
}

// SharedDataOverview
const SharedDataOverview = ({
  showAddOrganisationModule
}: {
  showAddOrganisationModule?: boolean
}) => {
  const [organisationOptionList, setOrganisationOptionList] = useState([])
  const [organisations, setOrganisations] = useState([]);
  const [organisationId, setOrganisationId] = useState();
  const [defaultSelectedOrganisation, setDefaultSelectedOrganisation] = useState({});

  const [acl, setAcl] = useState<AclType>  ({});
  const [dataAccessReceived, setDataAccessReceived] = useState([]);
  const [dataAccessGranted, setDataAccessGranted] = useState([]);
  const [showGrantUserForm, setShowGrantUserForm] = useState(false);
  const [showGrantOrganisationForm, setShowGrantOrganisationForm] = useState(false);

  const token = useSelector((state: StateType) => (state.authentication.user_data && state.authentication.user_data.token)||null)

  // Get data on component load
  useEffect(() => {
    fetchAcl();
    fetchOrganisationList();
    fetchDataAccessReceived();
  }, []);
  useEffect(() => {
    if(! acl || ! acl.part_of_organisation) return;
    fetchDataAccessGranted(acl.part_of_organisation);
  }, [
    acl
  ]);

  // If organisations array is in state:
  useEffect(() => {
    // Generate autosuggestion list
    buildOptionsValue();
  }, [organisations]);

  // If organisationId is set:
  useEffect(() => {
    if(! organisationId) return;

    // Set default organisation to show in the organisation select list
    const userOrganisation = getOrganisationBasedOnId(organisationId);
    setDefaultSelectedOrganisation({
      label: userOrganisation.name,
      value: acl.part_of_organisation
    });

    fetchDataAccessGranted(organisationId);
  }, [organisationId]);

  const navigate = useNavigate();

  const buildOptionsValue = async () => {
    const optionsList = []
    organisations.forEach(x => {
      optionsList.push({
        value: x.organisation_id,
        label: x.name
      })
    })
    setOrganisationOptionList(optionsList)
  }

  const fetchAcl = async () => {
    const theAcl = await getAcl(token);
    setAcl(theAcl);
    if(theAcl.part_of_organisation) setOrganisationId(theAcl.part_of_organisation);
  }

  const fetchOrganisationList = async () => {
    // Fetch organisations and set in state
    const organisations = await getOrganisationList(token);
    setOrganisations(organisations);
  }

  const getOrganisationBasedOnId = (id) => {
    if(! organisations || organisations.length <= 0) return {
      name: 'Loading'
    };
    const foundOrg = organisations.filter(x => x.organisation_id === id);
    if(foundOrg && foundOrg.length > 0) return foundOrg[0];
    return {
      name: 'Not found'
    };
  }

  const fetchDataAccessReceived = async () => {
    const result = await getDataAccessReceived(token);
    setDataAccessReceived(result);
  }

  const fetchDataAccessGranted = async (part_of_organisation) => {
    const result = await getDataAccessGranted(token, part_of_organisation);
    setDataAccessGranted(result);
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

  const onRevokeHandler = async (entry) => {
    await revokeDataAccess(token, entry.grant_view_data_id);
    await fetchDataAccessGranted(organisationId);
  }

  return (
    <div className="SharedDataOverview" style={{maxWidth: '800px'}}>
      <div className="flex justify-between flex-wrap">
        <H1Title>
          Data delen
        </H1Title>
        <div>
          <Select
            className="my-2 w-80"
            isMulti={false}
            options={organisationOptionList}
            defaultValue={defaultSelectedOrganisation}
            value={defaultSelectedOrganisation}
            placeholder="Organisatie"
            onChange={(choice: any) => {
              setOrganisationId(choice.value);
            }}
          />
        </div>
      </div>
      {(dataAccessReceived && dataAccessReceived.filter(x => x.granted_organisation_id !== null).length > 0) && <p>
        {getDataAccessReceivedString(dataAccessReceived)}
      </p>}
      <p>
        Stel hieronder in welke organisaties en personen toegang hebben tot de data van jouw organisatie.
      </p>
      <div className='mb-8' style={{marginRight: '-0.5rem', marginLeft: '-0.5rem'}}>
        <Button theme='primary' classes='add-new' onClick={() => {
          setShowGrantUserForm(true);
          setShowGrantOrganisationForm(false);
        }}>
          Deel met gebruiker
        </Button>
        <Button theme='primary' classes='add-new' onClick={() => {
          setShowGrantUserForm(false);
          setShowGrantOrganisationForm(true);
        }}>
          Deel met organisatie
        </Button>
      </div>
      {showGrantUserForm && <div className="mb-6">
        <GrantUser onSaveHandler={() => {
          setShowGrantUserForm(false);
          fetchDataAccessGranted(acl.part_of_organisation);
        }} />
      </div>}
      {showGrantOrganisationForm && <div className="mb-6">
        <GrantOrganisation onSaveHandler={() => {
          setShowGrantOrganisationForm(false);
          fetchDataAccessGranted(acl.part_of_organisation);
        }} />
      </div>}
      <div className="
        Table
      ">
        <div className="TableRow flex justify-between no-hover">
          <H4Title className="col-name">Gedeeld met</H4Title>
          <H4Title className="col-actions">Intrekken</H4Title>
        </div>
        {(dataAccessGranted && dataAccessGranted.length > 0) ? dataAccessGranted.map(entry => {
          return <TableRow entry={entry} onRevokeHandler={onRevokeHandler} />
        }) : <></>}
      </div>
    </div>
  );
}

export default SharedDataOverview;
