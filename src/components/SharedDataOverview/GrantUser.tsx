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
  organisation,
  onSaveHandler
}: {
  organisation?: OrganisationType,// User can be optional as this component is also used for adding new organisations
  onSaveHandler: Function
}) {
  const [grantedUserId, setGrantedUserId] = useState('');
  const [ownerOrganisationId, setOwnerOrganisationId] = useState();
  const [submitError, setSubmitError] = useState('');
  const [doShowModal, setDoShowModal] = useState(false);

  // Init navigation class, so we can easily redirect using navigate('/path')
  const navigate = useNavigate();

  // Get API token
  const token = useSelector((state: StateType) => (state.authentication.user_data && state.authentication.user_data.token)||null)

  useEffect(() => {
    (async () => {
      const acl = await getAcl(token);
      setOwnerOrganisationId(acl.part_of_organisation);
    })();
  }, [token])

  const handleSubmit = async (e) => {
    if(e) e.preventDefault();
    if(! ownerOrganisationId) return;

    try {
      const response = await grantUser(token, {
        "owner_organisation_id": ownerOrganisationId,
        "granted_user_id": grantedUserId
      });
      const isUserError = response && response.detail && response.detail === "granted_user_id doesn't exist";
      if(isUserError) {
        setSubmitError('Deze gebruiker bestaat nog niet in het Dashboard Deelmobiliteit. Controleer of je het juiste e-mailadres hebt ingevuld of stuur je verzoek aan info@dashboarddeelmobiliteit.nl');
        return;
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
          <Button classes={'w-40 save'} type="submit" theme="primary">
            Opslaan
          </Button>
          {submitError ? <p className="font-bold text-red-500 text-sm" style={{marginTop: '0.5rem', marginLeft: '0.5rem'}}>
            {submitError}
          </p>: <></>}
        </div>
      </form>

      {/*{message && <p className={`rounded-lg inline-block border-solid border-2 px-2 py-2 mr-2 mb-2 text-sm ${(messageDesign == "red") ? "error-message" : "success-message"}`}>{message} </p>}*/}

      <Modal
        isVisible={doShowModal}
        title="Weet je het zeker?"
        button1Title={'Nee, annuleer'}
        button1Handler={(e) => {
          setDoShowModal(false);
        }}
        button2Title={"Ja, verwijder organisatie"}
        button2Handler={async (e) => {
          e.preventDefault();
          // Hide modal
          setDoShowModal(false);
          // Delete organisation
          // await deleteOrganisation(token, encodeURIComponent(organisation.organisation_id));
          // Post save action
          onSaveHandler();
        }}
        hideModalHandler={() => {
          setDoShowModal(false);
        }}
      >
        <p className="mb-4">
          Weet je zeker dat je deze organisatie, <b>{organisation ? organisation.name : ''}</b>, wilt verwijderen?
        </p>
        <p className="my-4">
          Dit kan niet ongedaan gemaakt worden.
        </p>
      </Modal>

    </div>
  )
}

export default GrantUser
