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
import ErrorMessage from '../NotificationMessage/ErrorMessage';

function fallbackCopyTextToClipboard(text) {
  var textArea = document.createElement("textarea");
  textArea.value = text;
  
  // Avoid scrolling to bottom
  textArea.style.top = "0";
  textArea.style.left = "0";
  textArea.style.position = "fixed";

  document.body.appendChild(textArea);
  textArea.focus();
  textArea.select();

  try {
    var successful = document.execCommand('copy');
    var msg = successful ? 'successful' : 'unsuccessful';
    console.log('Fallback: Copying text command was ' + msg);
  } catch (err) {
    console.error('Fallback: Oops, unable to copy', err);
  }

  document.body.removeChild(textArea);
}
function copyTextToClipboard(text) {
  if (!navigator.clipboard) {
    fallbackCopyTextToClipboard(text);
    return;
  }
  navigator.clipboard.writeText(text).then(function() {
    console.log('Async: Copying to clipboard was successful!');
  }, function(err) {
    console.error('Async: Could not copy text: ', err);
  });
}

function EditUser({
  acl,
  user,
  onSaveHandler
}: {
  acl: any
  user?: UserType,// User can be optional as this component is also used for adding new users
  onSaveHandler: Function
}) {
  const [organisations, setOrganisations] = useState([]);
  const [organisationOptionList, setOrganisationOptionList] = useState([])

  const {username} = useParams();

  const [message, setMessage] = useState('')

  const [emailAddress, setEmailAddress] = useState(user ? user.user_id : null);
  const [organisationId, setOrganisationId] = useState(
    user
    ? user.organisation_id // If user exists: Load organisation for the user that is edited
    : (acl
        ? acl.part_of_organisation // If user doesn't exist: Load organisation the logged in user is part of
        : null
      )
  );
  const [isOrganisationAdmin, setIsOrganisationAdmin] = useState(user && user.privileges && user.privileges.indexOf('ORGANISATION_ADMIN') > -1);
  const [isCoreGroup, setIsCoreGroup] = useState(user && user.privileges && user.privileges.indexOf('CORE_GROUP') > -1);
  const [canEditMicrohubs, setCanEditMicrohubs] = useState(user && user.privileges && user.privileges.indexOf('MICROHUB_EDIT') > -1);
  const [canDownloadRawData, setCanDownloadRawData] = useState(user && user.privileges && user.privileges.indexOf('DOWNLOAD_RAW_DATA') > -1);
  const [sendEmail, setSendEmail] = useState(false)
  const [credentials, setCredentials] = useState({username: '', password: ''})

  const [doShowDeleteModal, setDoShowDeleteModal] = useState(false);
  const [doShowCredentialsModal, setDoShowCredentialsModal] = useState(false);
  const [doShowCanEditMicrohubs, setDoShowCanEditMicrohubs] = useState(false);

  // Init navigation class, so we can easily redirect using navigate('/path')
  const navigate = useNavigate();

  // Get API token
  const token = useSelector((state: StateType) => (state.authentication.user_data && state.authentication.user_data.token)||null)

  // On component load: Get municipalities and generate autosuggestion list
  useEffect(() => {
    buildOptionsValue();
  }, [organisations]);

  // Get organisations list on component load
  useEffect(() => {
    fetchOrganisations();
  }, []);

  // Get organisation of logged in user
  useEffect(() => {
    if(! organisations || organisations.length <= 0) return;
    if(! organisationId) return;

    const organisation_of_logged_in_user = getOrganisation(organisationId);
    if(! organisation_of_logged_in_user) return;

    const org_types_allowed_to_edit_zones = [
      'MUNICIPALITY',
      'OTHER_GOVERNMENT',
      'ADMIN'
    ];
    // Set in state
    setDoShowCanEditMicrohubs(
      org_types_allowed_to_edit_zones.indexOf(organisation_of_logged_in_user.type_of_organisation) > -1
    );
  }, [
    organisations,
    organisationId
  ]);

  const isAdmin = () => acl.is_admin === true;
  const getOrganisation = (organisationId) => organisations.find(x=>x.organisation_id == organisationId);
  
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

  const handleSubmit = async (e) => {
    if(e) e.preventDefault();

    console.log('acl', acl);
    console.log('organisation_id', organisationId);

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
      handleClose();
      onSaveHandler();
    }
    // Or add
    else {
      const createdUser = await createUser(token, {
        "user_id": emailAddress,
        "privileges": privileges,
        "organisation_id": organisationId
      });
      // Check if there were errors
      let error;
      if(createdUser.detail) {
        if(typeof createdUser.detail === 'string' && createdUser.detail === 'user already exists in fusionauth') {
          error = `De gebruiker kan niet gecreëerd worden, want er bestaat al een gebruikersaccount met e-mailadres ${emailAddress}`;
        }
        else if(createdUser.detail[0].type === 'type_error.none.not_allowed' && createdUser.detail[0].loc[1] === 'organisation_id') {
          error = 'Organisatie is een verplicht veld';
        }
        setMessage(error);
        return;
      }
      // If no errors:
      setDoShowCredentialsModal(true);
      setCredentials({
        username: createdUser.user_account.user_id,
        password: createdUser.generated_password
      })
    }
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

        {isAdmin() && <>
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
        </>}

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

        {doShowCanEditMicrohubs && <div className=" flex">
          <input 
            type="checkbox"
            id="microhub-edit" 
            checked={canEditMicrohubs}
            value="true"
            onChange={(event) => setCanEditMicrohubs(event.target.checked ? true : false)}
          />
          <FormLabel htmlFor="microhub-edit" classes="py-3 px-2">
            Kan zones beheren
          </FormLabel>
        </div>}

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
            onClick={() => setDoShowDeleteModal(true)}
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

      {message && <ErrorMessage title="Fout" message={message} />}

      <Modal
        isVisible={doShowDeleteModal}
        title="Weet je het zeker?"
        button1Title={'Nee, annuleer'}
        button1Handler={(e) => {
          setDoShowDeleteModal(false);
        }}
        button2Title={"Ja, verwijder gebruiker"}
        button2Handler={async (e) => {
          e.preventDefault();
          // Hide modal
          setDoShowDeleteModal(false);
          // Delete user
          await deleteUser(token, encodeURIComponent(user.user_id));
          // Post save action
          onSaveHandler();
        }}
        hideModalHandler={() => {
          setDoShowDeleteModal(false);
        }}
      >
        <p className="mb-4">
          Weet je zeker dat je deze gebruiker, {user ? user.user_id : ''}, wilt verwijderen?
        </p>
        <p className="my-4">
          Dit kan niet ongedaan gemaakt worden.
        </p>
      </Modal>

      <Modal
        isVisible={doShowCredentialsModal}
        title="Gebruiker toegevoegd"
        button2Title={"Sluiten"}
        button2Handler={async (e) => {
          // Hide modal
          setDoShowCredentialsModal(false);
          handleClose();
          onSaveHandler();
        }}
        hideModalHandler={() => {
          setDoShowCredentialsModal(false);
          handleClose();
          onSaveHandler();
        }}
      >
        <p className="mb-4">
          <small style={{color: '#f00', fontStyle: 'italic'}}>
            Kopieer de tekst hieronder en plak dit in een email aan: {credentials.username} <span title="Kopieer e-mailadres naar klembord" onClick={() => copyTextToClipboard(credentials.username)} className="cursor-pointer">📋</span>
          </small>
        </p>
        <p>
          Welkom bij het Dashboard Deelmobiliteit! Mocht je vragen of feedback hebben, neem dan vooral contact op met info@dashboarddeelmobiliteit.nl
        </p>
        <p className="mb-4">
          Hierbij stuur ik je inloggegevens voor <a href="https://dashboarddeelmobiliteit.nl/login" target="_blank">https://dashboarddeelmobiliteit.nl/login</a>
        </p>
        <p className="mb-4">
          <b>Gebruikersnaam:</b><br />
          {credentials.username}
        </p>
        <p className="mb-4">
          <b>Wachtwoord:</b><br />
          {credentials.password}
        </p>
        <br />
        <p className="mb-4">
          Handige links:
        </p>
        <ul className="mb-4">
          <li><a href="https://www.fietsberaad.nl/Kennisbank/Afspraken-over-data-en-financiering-van-dashboard" target="_blank">Afspraken over openbaarheid</a></li>
          <li><a href="https://dashboarddeelmobiliteit.nl/rondleiding">Korte rondleiding door het dashboard</a></li>
          <li><a href="https://dashboarddeelmobiliteit.nl/faq">Veelgestelde vragen</a></li>
        </ul>
        <p className="mb-4">
          Bij vragen, opmerkingen of feedback horen we graag van je!
        </p>
      </Modal>

    </div>
  )
}

export default EditUser
