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
import {getAcl} from '../../api/acl';
import {createUser} from '../../api/users';
import {grantUser} from '../../api/dataAccess';
import {getOrganisationList} from '../../api/organisations';

// Models
import {OrganisationType} from '../../types/OrganisationType';

// Styles
// import './GrantUser.css'; 

// Components
import H5Title from '../H5Title/H5Title';
import FormLabel from '../FormLabel/FormLabel';
import Modal from '../Modal/Modal.jsx';

function GrantUser({
  organisationToGrantDataFrom,
  onSaveHandler
}: {
  organisationToGrantDataFrom: number,
  onSaveHandler: Function
}) {
  const [grantedUserId, setGrantedUserId] = useState('');
  const [submitError, setSubmitError] = useState('');
  const [doShowModal, setDoShowModal] = useState(false);

  // Init navigation class, so we can easily redirect using navigate('/path')
  const navigate = useNavigate();

  // Get API token
  const token = useSelector((state: StateType) => (state.authentication.user_data && state.authentication.user_data.token)||null)


  const handleSubmit = async (e) => {
    if(e) e.preventDefault();
    if(! organisationToGrantDataFrom) return;

    try {
      // Grant user
      const response = await grantUser(token, {
        "owner_organisation_id": organisationToGrantDataFrom,
        "granted_user_id": grantedUserId
      });

      // Check if there was an error, like: User doesn't exist yet
      const userDoesntExist = response && response.detail && response.detail === "granted_user_id doesn't exist";
      if(userDoesntExist) {
        // setSubmitError('Deze gebruiker bestaat nog niet in het Dashboard Deelmobiliteit. Controleer of je het juiste e-mailadres hebt ingevuld of stuur je verzoek aan info@dashboarddeelmobiliteit.nl');
        // Create user
        const createdUser = await createUser(token, {
          "user_id": grantedUserId,
          "privileges": [],// No special privileges
          "organisation_id": 2// Default organisation: "Onbekend"
        });

        // Now that user is created, try granting again:
        // Grant user
        const retry_granting_response = await grantUser(token, {
          "owner_organisation_id": organisationToGrantDataFrom,
          "granted_user_id": grantedUserId
        });
      }
      handleClose();
      onSaveHandler();
    } catch(err) {
      console.error(err);
    }
  }
  
  const handleClose = () => {
    navigate('/admin/shared');
  }

  return (
    <div>
      <form onSubmit={handleSubmit} className='add-organisation-form'>
        <div>
          <FormLabel classes="mt-2 mb-4 font-bold">
            Deel data met deze gebruiker:
          </FormLabel>

          <input 
            type="text"
            name="granted_user_id" 
            className="rounded-lg inline-block border-solid border-2 px-2 py-2 mr-2 mb-2 text-sm w-80"
            placeholder="Bijvoorbeeld: example@example.com"
            onChange={(event) => {
              // Set state variable
              setGrantedUserId(event.target.value);
              // Clear error
              setSubmitError('');
            }}
          />
        </div>

        <div style={{marginLeft: '-0.5rem'}}>
          <div className="flex">
            <Button classes={'w-40 save'} type="submit" theme="primary">
              Opslaan
            </Button>
            <a className="ml-4 flex flex-col justify-center cursor-pointer" onClick={() => onSaveHandler()} style={{color: '#999'}}>
              Annuleren
            </a>
          </div>
          {submitError ? <p className="font-bold text-red-500 text-sm" style={{marginTop: '0.5rem', marginLeft: '0.5rem'}}>
            {submitError}
          </p>: <></>}
        </div>
      </form>
    </div>
  )
}

export default GrantUser
