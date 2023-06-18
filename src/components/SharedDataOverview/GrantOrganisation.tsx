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
import {grantOrganisation} from '../../api/dataAccess';
import {getOrganisationList} from '../../api/organisations';

// Models
import {OrganisationType} from '../../types/OrganisationType';

// Styles
// import './GrantOrganisation.css'; 

// Components
import H5Title from '../H5Title/H5Title';
import FormLabel from '../FormLabel/FormLabel';
import Modal from '../Modal/Modal.jsx';

function GrantOrganisation({
  organisationToGrantDataFrom,
  onSaveHandler
}: {
  organisationToGrantDataFrom: number,
  onSaveHandler: Function
}) {
  const [organisations, setOrganisations] = useState([]);
  const [organisationsOptionList, setOrganisationsOptionList] = useState([])
  const [grantedOrganisation, setGrantedOrganisation] = useState({
    value: 0,
    label: ''
  })
  const [submitError, setSubmitError] = useState('');

  // Init navigation class, so we can easily redirect using navigate('/path')
  const navigate = useNavigate();

  // Get API token
  const token = useSelector((state: StateType) => (state.authentication.user_data && state.authentication.user_data.token)||null)

  // On component load: Get municipalities and generate autosuggestion list
  const fetchOrganisations = async () => {
    const result = await getOrganisationList(token);
    if(! result) return;
    setOrganisations(result);
  };
  useEffect(() => {
    fetchOrganisations();
  }, [token]);

  const buildOrganisationsOptionsValue = async () => {
    const optionsList = []
    organisations.forEach(x => {
      optionsList.push({
        value: x.organisation_id,
        label: x.name
      })
    })
    setOrganisationsOptionList(optionsList)
  }

  useEffect(() => {
    buildOrganisationsOptionsValue();
  }, [organisations]);
  
  function getHeaders(): any {
    return {
      headers: {
        "Authorization": `Bearer ${token}`
      }
    };
  }

  const handleSubmit = async (e) => {
    if(e) e.preventDefault();
    if(! organisationToGrantDataFrom) return;
    if(! grantedOrganisation || ! grantedOrganisation.value) return;

    try {
      const response = await grantOrganisation(token, {
        "owner_organisation_id": organisationToGrantDataFrom,
        "granted_organisation_id": grantedOrganisation.value
      });
      const isOrganisationError = response && response.detail && response.detail === "granted_organisation_id doesn't exist";
      if(isOrganisationError) {
        setSubmitError('Er was een fout bij het toevoegen van deze organisatie. Neem contact op met info@dashboarddeelmobiliteit.nl');
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
            Deel data met deze organisatie:
          </FormLabel>

          <Select
            className="my-2 w-80"
            isMulti={false}
            options={organisationsOptionList}
            onChange={(choice: any) => {
              setGrantedOrganisation(choice);
            }}
          />
        </div>

        <div className="flex justify-between" style={{marginLeft: '-0.5rem'}}>
          <div className="flex">
            <Button classes={'w-40 save'} type="submit" theme="primary">
              Opslaan
            </Button>
            {submitError ? <p className="font-bold text-red-500 text-sm" style={{marginTop: '0.5rem', marginLeft: '0.5rem'}}>
              {submitError}
            </p>: <></>}
            <a className="ml-4 flex flex-col justify-center cursor-pointer" onClick={() => onSaveHandler()} style={{color: '#999'}}>
              Annuleren
            </a>
          </div>
        </div>
      </form>
    </div>
  )
}

export default GrantOrganisation
