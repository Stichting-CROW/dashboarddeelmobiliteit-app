import React, { useState, useEffect} from 'react'
import Select from 'react-select'
import Button from '../Button/Button'
import {
  useSelector
} from 'react-redux';
import { useParams } from 'react-router';
import { useLocation, useNavigate } from "react-router-dom";

import {StateType} from '../../types/StateType';

// Import API methods
import {createUser, updateUser, deleteUser} from '../../api/users';
import {getOrganisationList} from '../../api/organisations';

// Models
import {UserType} from '../../types/UserType';

// Styles
import './EditUser.css'; 

// Components
import H5Title from '../H5Title/H5Title';
import FormLabel from '../FormLabel/FormLabel';
import Modal from '../Modal/Modal.jsx';

function EditUser({
  user,
  onSaveHandler
}: {
  user?: UserType,// User can be optional as this component is also used for adding new users
  onSaveHandler: Function
}) {
  const [organisations, setOrganisations] = useState([]);
  const [organisationOptionList, setOrganisationOptionList] = useState([])

  const {username} = useParams();

  const [message, setMessage] = useState('')
  const [messageDesign, setMessageDesign] = useState('')

  const [emailAddress, setEmailAddress] = useState(user ? user.user_id : null);
  const [organisationId, setOrganisationId] = useState(user ? user.organisation_id : null);
  const [isOrganisationAdmin, setIsOrganisationAdmin] = useState(user && user.privileges && user.privileges.indexOf('ORGANISATION_ADMIN') > -1);
  const [isCoreGroup, setIsCoreGroup] = useState(user && user.privileges && user.privileges.indexOf('CORE_GROUP') > -1);
  const [canEditMicrohubs, setCanEditMicrohubs] = useState(user && user.privileges && user.privileges.indexOf('MICROHUB_EDIT') > -1);
  const [canDownloadRawData, setCanDownloadRawData] = useState(user && user.privileges && user.privileges.indexOf('DOWNLOAD_RAW_DATA') > -1);
  const [sendEmail, setSendEmail] = useState(false)

  const [doShowModal, setDoShowModal] = useState(false);

  // Init navigation class, so we can easily redirect using navigate('/path')
  const navigate = useNavigate();

  // Get API token
  const token = useSelector((state: StateType) => (state.authentication.user_data && state.authentication.user_data.token)||null)

  // On component load: Get municipalities and generate autosuggestion list
  useEffect(() => {
    buildOptionsValue();
  }, [organisations]);
  
  function getHeaders(): any {
    return {
      headers: {
        "Authorization": `Bearer ${token}`
      }
    };
  }

  const fetchOrganisations = async () => {
    const users = await getOrganisationList(token);
    setOrganisations(users);
  };

  // Get user list on component load
  useEffect(() => {
    fetchOrganisations();
  }, []);

  const handleSubmit = async (e) => {
    if(e) e.preventDefault();

    // Build privileges
    const privileges = [];
    if(isOrganisationAdmin) privileges.push('ORGANISATION_ADMIN');
    if(isCoreGroup) privileges.push('CORE_GROUP');
    if(canEditMicrohubs) privileges.push('MICROHUB_EDIT');
    if(canDownloadRawData) privileges.push('DOWNLOAD_RAW_DATA');

    // Update
    if(user && user.user_id) {
      await updateUser(token, {
        "user_id": emailAddress,
        "privileges": privileges,
        "organisation_id": organisationId
      });
    }
    // Or add
    else {
      await createUser(token, {
        "user_id": emailAddress,
        "privileges": privileges,
        "organisation_id": organisationId
      });
    }
    
    handleClose();
    onSaveHandler();
  }
  
  const handleClose = () => {
    navigate('/admin/users');
  }

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

  return (
    <div>
      <form onSubmit={handleSubmit} className='add-user-form'>
        <div className="email">
          <FormLabel classes="mt-2 mb-4 font-bold">
            E-mailadres
          </FormLabel>
          <input 
            type="email" 
            disabled={user && user.user_id ? true : false}
            className="rounded-lg inline-block border-solid border-2 px-2 py-2 mr-2 mb-2 text-sm w-80"
            value={emailAddress}
            placeholder="Vul het mailadres in"
            onChange={(event) => setEmailAddress(event.target.value)}
          />
        </div>

        <FormLabel classes="mt-2 mb-4 font-bold">
          Organisatie
        </FormLabel>
        <div className="w-80">
          <Select
            className="my-2"
            options={organisationOptionList}
            defaultValue={{ label: user ? user.organisation_name : null, value: user ? user.organisation_id : null }}
            placeholder="Selecteer de organisatie"
            onChange={(choice: any) => {
              setOrganisationId(choice.value);
            }}
          />
        </div>

        <div className="mt-2 flex">
          <input 
            type="checkbox"
            id="is-organisation-admin" 
            checked={isOrganisationAdmin}
            value="true"
            onChange={(event) => setIsOrganisationAdmin(event.target.checked ? true : false)}
          />
          <FormLabel htmlFor="is-organisation-admin" classes="py-3 px-2">
            Organisatie-admin
          </FormLabel>
        </div>

        <div className=" flex">
          <input 
            type="checkbox"
            id="kernteam" 
            checked={isCoreGroup}
            value="true"
            onChange={(event) => setIsCoreGroup(event.target.checked ? true : false)}
          />
          <FormLabel htmlFor="kernteam" classes="py-3 px-2">
            Onderdeel van het kernteam
          </FormLabel>
        </div>

        <div className=" flex">
          <input 
            type="checkbox"
            id="microhub-edit" 
            checked={canEditMicrohubs}
            value="true"
            onChange={(event) => setCanEditMicrohubs(event.target.checked ? true : false)}
          />
          <FormLabel htmlFor="microhub-edit" classes="py-3 px-2">
            Kan microhubs beheren
          </FormLabel>
        </div>

        <div className=" flex">
          <input 
            type="checkbox"
            id="raw-data-download" 
            checked={canDownloadRawData}
            value="true"
            onChange={(event) => setCanDownloadRawData(event.target.checked ? true : false)}
          />
          <FormLabel htmlFor="raw-data-download" classes="py-3 px-2">
            Kan ruwe data downloaden
          </FormLabel>
        </div>

        {/*
        <div className="mb-2 flex">
          <input 
            type="checkbox"
            id="send-welcome-email" 
            value={sendEmail ? 'true' : 'false'}
            onChange={(event) => setSendEmail(event.target.value ? true : false)}
          />
          <FormLabel htmlFor="send-welcome-email" classes="py-3 px-2">
            Stuur welkomstmail
          </FormLabel>
        </div>
        */}
      
        <div className="flex justify-between" style={{marginLeft: '-0.5rem'}}>
          <Button classes={'w-40 save'} type="submit" theme="primary">
            Opslaan
          </Button>
          {(user && user.user_id) && <div
            className="flex flex-col justify-center cursor-pointer"
            style={{color: '#B2B2B2'}}
            onClick={() => setDoShowModal(true)}
          >
            <div className="flex">
              <div
                className="inline-block underline"
              >Verwijder gebruiker</div>
              <button className='ml-2 delete-icon' style={{height: '100%'}} />
            </div>
          </div>}
        </div>
      </form>

      {message && <p className={`rounded-lg inline-block border-solid border-2 px-2 py-2 mr-2 mb-2 text-sm ${(messageDesign == "red") ? "error-message" : "success-message"}`}>{message} </p>}

      <Modal
        isVisible={doShowModal}
        title="Weet je het zeker?"
        button1Title={'Nee, annuleer'}
        button1Handler={(e) => {
          setDoShowModal(false);
        }}
        button2Title={"Ja, verwijder gebruiker"}
        button2Handler={async (e) => {
          e.preventDefault();
          // Hide modal
          setDoShowModal(false);
          // Delete user
          await deleteUser(token, encodeURIComponent(user.user_id));
          // Post save action
          onSaveHandler();
        }}
        hideModalHandler={() => {
          setDoShowModal(false);
        }}
      >
        <p className="mb-4">
          Weet je zeker dat je deze gebruiker, {user ? user.user_id : ''}, wilt verwijderen?
        </p>
        <p className="my-4">
          Dit kan niet ongedaan gemaakt worden.
        </p>
      </Modal>

    </div>
  )
}

export default EditUser
