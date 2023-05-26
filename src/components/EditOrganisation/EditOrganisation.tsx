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
// import './EditOrganisation.css'; 

// Components
import H5Title from '../H5Title/H5Title';
import FormLabel from '../FormLabel/FormLabel';
import Modal from '../Modal/Modal.jsx';

function EditOrganisation({
  organisation,
  onSaveHandler
}: {
  organisation?: OrganisationType,// User can be optional as this component is also used for adding new organisations
  onSaveHandler: Function
}) {
  const [municipalities, setMunicipalities] = useState([]);
  const [municipalityOptionList, setMunicipalityOptionList] = useState([])

  const [operators, setOperators] = useState([]);
  const [operatorOptionList, setOperatorOptionList] = useState([])

  // const [message, setMessage] = useState('')
  // const [messageDesign, setMessageDesign] = useState('')

  const [organisationName, setOrganisationName] = useState(organisation ? organisation.name : null);
  const [organisationType, setOrganisationType] = useState(organisation ? organisation.type_of_organisation : null);
  const [selectedMunicipalities, setSelectedMunicipalities] = useState([]);
  const [dataOwnerOfMunicipalities, setDataOwnerOfMunicipalities] = useState(organisation && organisation.data_owner_of_municipalities ? organisation.data_owner_of_municipalities : null);
  const [selectedOperators, setSelectedOperators] = useState([]);
  const [dataOwnerOfOperators, setDataOwnerOfOperators] = useState(organisation && organisation.data_owner_of_operators ? organisation.data_owner_of_operators : null);
  // const [isOrganisationAdmin, setIsOrganisationAdmin] = useState(organisation && organisation.privileges && organisation.privileges.indexOf('ORGANISATION_ADMIN') > -1);
  // const [isCoreGroup, setIsCoreGroup] = useState(organisation && organisation.privileges && organisation.privileges.indexOf('CORE_GROUP') > -1);
  // const [canEditMicrohubs, setCanEditMicrohubs] = useState(organisation && organisation.privileges && organisation.privileges.indexOf('MICROHUB_EDIT') > -1);
  // const [canDownloadRawData, setCanDownloadRawData] = useState(organisation && organisation.privileges && organisation.privileges.indexOf('DOWNLOAD_RAW_DATA') > -1);
  // const [isSuperAdmin, setIsSuperAdmin] = useState(organisation && organisation.is_admin);
  // const [sendEmail, setSendEmail] = useState(false)

  const [doShowModal, setDoShowModal] = useState(false);

  // Init navigation class, so we can easily redirect using navigate('/path')
  const navigate = useNavigate();

  // Get API token
  const token = useSelector((state: StateType) => (state.authentication.user_data && state.authentication.user_data.token)||null)

  // On component load: Get municipalities and generate autosuggestion list
  const fetchMunicipalitiesAndOperators = async () => {
    const acl = await getAcl(token);
    if(! acl || ! acl.municipalities || ! acl.operators) return;
    setMunicipalities(acl.municipalities);
    setOperators(acl.operators);
  };
  useEffect(() => {
    fetchMunicipalitiesAndOperators();
  }, [token]);

  useEffect(() => {
    buildMunicipalityOptionsValue();
    prepareDefaultSelectedMunicipalities();
  }, [municipalities]);
  
  const prepareDefaultSelectedMunicipalities = () => {
    if(! organisation || ! organisation.data_owner_of_municipalities) return;
    let currentUserMunicipalities = [];
    organisation.data_owner_of_municipalities.forEach(gm_code => {
      let relatedMunicipality: any = municipalities.filter(x => x.gm_code === gm_code);
      if(relatedMunicipality && relatedMunicipality.length > 0) {
        currentUserMunicipalities.push({ label: relatedMunicipality[0].name, value: relatedMunicipality[0].gm_code });
      }
    })
    setSelectedMunicipalities(currentUserMunicipalities);
  }

  // On component load: Get operators and generate autosuggestion list
  useEffect(() => {
    buildOperatorOptionsValue();
    prepareDefaultSelectedOperators();
  }, [operators]);
  
  const prepareDefaultSelectedOperators = () => {
    if(! organisation || ! organisation.data_owner_of_operators) return;
    let currentUserOperators = [];
    organisation.data_owner_of_operators.forEach(system_id => {
      let relatedOperator: any = operators.filter(x => x.system_id === system_id);
      if(relatedOperator && relatedOperator.length > 0) {
        currentUserOperators.push({ label: relatedOperator[0].name, value: relatedOperator[0].system_id });
      }
    })
    setSelectedOperators(currentUserOperators);
  }

  function getHeaders(): any {
    return {
      headers: {
        "Authorization": `Bearer ${token}`
      }
    };
  }

  const handleSubmit = async (e) => {
    if(e) e.preventDefault();

    // Build municipalityCodeArray
    let data_owner_of_municipalities = selectedMunicipalities.map(x => x.value);

    // Build operatorArray
    let data_owner_of_operators = selectedOperators.map(x => x.value);

    // Update
    if(organisation && organisation.organisation_id) {
      await updateOrganisation(token, {
        "organisation_id": organisation.organisation_id,
        "name": organisationName,
        "type_of_organisation": organisationType,
        "data_owner_of_municipalities": data_owner_of_municipalities,
        "organisation_details": organisation.organisation_details,
        "data_owner_of_operators": data_owner_of_operators
      });
    }
    // Or add
    else {
      await createOrganisation(token, {
        "name": organisationName,
        "type_of_organisation": organisationType,
        "data_owner_of_municipalities": data_owner_of_municipalities,
        "organisation_details": null,
        "data_owner_of_operators": data_owner_of_operators
      });
    }

    handleClose();
    onSaveHandler();
  }
  
  const handleClose = () => {
    navigate('/admin/organisations');
  }

  const buildMunicipalityOptionsValue = async () => {
    const optionsList = []
    municipalities.forEach(x => {
      optionsList.push({
        value: x.gm_code,
        label: x.name
      })
    })
    setMunicipalityOptionList(optionsList)
  }

  const buildOperatorOptionsValue = async () => {
    const optionsList = []
    operators.forEach(x => {
      optionsList.push({
        value: x.system_id,
        label: x.name
      })
    })
    setOperatorOptionList(optionsList)
  }

  return (
    <div>
      <form onSubmit={handleSubmit} className='add-organisation-form'>
        <div className="email">
          <FormLabel classes="mt-2 mb-4 font-bold">
            Organisatienaam
          </FormLabel>
          <input 
            type="text"
            name="name" 
            className="rounded-lg inline-block border-solid border-2 px-2 py-2 mr-2 mb-2 text-sm w-80"
            value={organisationName}
            placeholder="Bijvoorbeeld: Gemeente Amersfoort"
            onChange={(event) => setOrganisationName(event.target.value)}
          />
        </div>

        <div>
          <FormLabel classes="mt-2 mb-4 font-bold">
            Organisatietype
          </FormLabel>
          <select
            name="type_of_organisation" 
            className="rounded-lg inline-block border-solid border-2 px-2 py-2 mr-2 mb-2 text-sm w-80"
            value={organisationType}
            onChange={(event) => setOrganisationType(event.target.value)}
          >
            <option value=""></option>
            <option value="MUNICIPALITY">Gemeente</option>
            <option value="OPERATOR">Aanbieder</option>
            <option value="ADMIN">Admin</option>
          </select>
        </div>

        {organisationType === 'MUNICIPALITY' && <div>
          <FormLabel classes="mt-2 mb-4 font-bold">
            Data-eigenaar van de volgende gemeentes
          </FormLabel>
          <Select
            className="my-2 w-80"
            isMulti={true}
            options={municipalityOptionList}
            defaultValue={selectedMunicipalities}
            value={selectedMunicipalities}
            onChange={(choices: any) => {
              setSelectedMunicipalities(choices);
            }}
          />
        </div>}

        {organisationType === 'OPERATOR' && <div>
          <FormLabel classes="mt-2 mb-4 font-bold">
            Data-eigenaar van de volgende aanbieder(s)
          </FormLabel>
          <Select
            className="my-2 w-80"
            isMulti={true}
            options={operatorOptionList}
            defaultValue={selectedOperators}
            value={selectedOperators}
            onChange={(choices: any) => {
              setSelectedOperators(choices);
            }}
          />
        </div>}

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

export default EditOrganisation
