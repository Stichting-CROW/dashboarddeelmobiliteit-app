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
import {createOrganisation, updateOrganisation, deleteOrganisation} from '../../api/organisations';
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
  organisation,
  onSaveHandler
}: {
  organisation?: OrganisationType,// User can be optional as this component is also used for adding new organisations
  onSaveHandler: Function
}) {
  const [organisations, setOrganisations] = useState([]);
  const [organisationsOptionList, setOrganisationsOptionList] = useState([])
  const [selectedOrganisations, setSelectedOrganisations] = useState([]);
  const [doShowModal, setDoShowModal] = useState(false);

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
    // prepareDefaultSelectedMunicipalities();
  }, [organisations]);
  
  // const prepareDefaultSelectedMunicipalities = () => {
  //   if(! organisation || ! organisation.data_owner_of_municipalities) return;
  //   let currentUserMunicipalities = [];
  //   organisation.data_owner_of_municipalities.forEach(gm_code => {
  //     let relatedMunicipality: any = municipalities.filter(x => x.gm_code === gm_code);
  //     if(relatedMunicipality && relatedMunicipality.length > 0) {
  //       currentUserMunicipalities.push({ label: relatedMunicipality[0].name, value: relatedMunicipality[0].gm_code });
  //     }
  //   })
  //   setSelectedMunicipalities(currentUserMunicipalities);
  // }

  function getHeaders(): any {
    return {
      headers: {
        "Authorization": `Bearer ${token}`
      }
    };
  }

  const handleSubmit = async (e) => {
    if(e) e.preventDefault();

    // // Build municipalityCodeArray
    // let data_owner_of_municipalities = selectedMunicipalities.map(x => x.value);

    // // Build operatorArray
    // let data_owner_of_operators = selectedOperators.map(x => x.value);

    // // Update
    // if(organisation && organisation.organisation_id) {
    //   await updateOrganisation(token, {
    //     "organisation_id": organisation.organisation_id,
    //     "name": organisationName,
    //     "type_of_organisation": organisationType,
    //     "data_owner_of_municipalities": data_owner_of_municipalities,
    //     "organisation_details": organisation.organisation_details,
    //     "data_owner_of_operators": data_owner_of_operators
    //   });
    // }
    // // Or add
    // else {
    //   await createOrganisation(token, {
    //     "name": organisationName,
    //     "type_of_organisation": organisationType,
    //     "data_owner_of_municipalities": data_owner_of_municipalities,
    //     "organisation_details": null,
    //     "data_owner_of_operators": data_owner_of_operators
    //   });
    // }

    handleClose();
    onSaveHandler();
  }
  
  const handleClose = () => {
    navigate('/admin/organisations');
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
            isMulti={true}
            options={organisationsOptionList}
            // defaultValue={selectedOrganisations}
            // value={selectedOrganisations}
            onChange={(choices: any) => {
              setSelectedOrganisations(choices);
            }}
          />
        </div>

        <div className="flex justify-between" style={{marginLeft: '-0.5rem'}}>
          <Button classes={'w-40 save'} type="submit" theme="primary">
            Opslaan
          </Button>
          {(organisation && organisation.organisation_id) && <div
            className="flex flex-col justify-center cursor-pointer"
            style={{color: '#B2B2B2'}}
            onClick={() => setDoShowModal(true)}
          >
            <div className="flex">
              <div
                className="inline-block underline"
              >Verwijder organisatie</div>
              <button className='ml-2 delete-icon' style={{height: '100%'}} />
            </div>
          </div>}
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
          await deleteOrganisation(token, encodeURIComponent(organisation.organisation_id));
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

export default GrantOrganisation
