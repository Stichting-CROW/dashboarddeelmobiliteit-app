import React, { useState, useEffect } from 'react';
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
import H1Title from '../H1Title/H1Title';
import H4Title from '../H4Title/H4Title';

const TableRow = (
  entry: any,
  onRevokeHandler: Function
) => {
  // const [doShowModal, setDoShowModal] = useState(false);

  return <div>dfs</div>

  // return <div
  //   key={entry.grant_view_data_id}
  //   className={`TableRow no-hover`}
  // >
  //   <div className="flex">
  //     <div className="col-name text-sm">
  //       {entry.granted_user_id ? entry.granted_user_id : ''}
  //       {entry.granted_organisation_name ? entry.granted_organisation_name : ''}
  //     </div>
  //     <div className="col-actions text-sm flex justify-end">
  //       <button className='delete-icon' style={{height: '100%'}} onClick={() => setDoShowModal(true)} />
  //     </div>
  //   </div>

  //   {doShowModal ? (
  //     <Modal
  //       isVisible={doShowModal}
  //       title="Weet je het zeker?"
  //       button1Title={'Nee, annuleer'}
  //       button1Handler={(e) => {
  //         setDoShowModal(false);
  //       }}
  //       button2Title={"Ja, stop met delen"}
  //       button2Handler={async (e) => {
  //         e.preventDefault();
  //         // Hide modal
  //         setDoShowModal(false);
  //         // Revoke action
  //         onRevokeHandler(entry);
  //       }}
  //       hideModalHandler={() => {
  //         setDoShowModal(false);
  //       }}
  //     >
  //       <p className="mb-4">
  //         Weet je zeker dat je wilt stoppen met delen met deze organisatie/persoon?
  //       </p>
  //     </Modal>
  //   ): <></>}

  // </div>
}

// SharedDataOverview
const SharedDataOverview = ({
  showAddOrganisationModule
}: {
  showAddOrganisationModule?: boolean
}) => {
  const [organisations, setOrganisations] = useState([]);
  const [acl, setAcl] = useState<AclType>  ({});
  const [dataAccessReceived, setDataAccessReceived] = useState([]);
  const [dataAccessGranted, setDataAccessGranted] = useState([]);
  const [showGrantUserForm, setShowGrantUserForm] = useState(false);

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

  const navigate = useNavigate();

  const fetchAcl = async () => {
    const theAcl = await getAcl(token);
    setAcl(theAcl);
  }

  const fetchOrganisationList = async () => {
    const organisations = await getOrganisationList(token);
    setOrganisations(organisations);
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
  }

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
        {dataAccessGranted ? dataAccessGranted.map(entry => TableRow(entry, onRevokeHandler)) : <></>}
      </div>
    </div>
  );
}

export default SharedDataOverview;
