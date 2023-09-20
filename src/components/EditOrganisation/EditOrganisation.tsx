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
import {getMenuAcl} from '../../api/acl';
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
  organisations,
  organisation,
  onSaveHandler
}: {
  organisations: any,
  organisation?: OrganisationType,// User can be optional as this component is also used for adding new organisations
  onSaveHandler: Function
}) {
  const [municipalityOptionList, setMunicipalityOptionList] = useState([])
  const [operatorOptionList, setOperatorOptionList] = useState([])

  const [organisationName, setOrganisationName] = useState(organisation ? organisation.name : null);
  const [organisationType, setOrganisationType] = useState(organisation ? organisation.type_of_organisation : null);
  const [selectedMunicipalities, setSelectedMunicipalities] = useState([]);
  const [dataOwnerOfMunicipalities, setDataOwnerOfMunicipalities] = useState(organisation && organisation.data_owner_of_municipalities ? organisation.data_owner_of_municipalities : null);
  const [selectedOperators, setSelectedOperators] = useState([]);
  const [dataOwnerOfOperators, setDataOwnerOfOperators] = useState(organisation && organisation.data_owner_of_operators ? organisation.data_owner_of_operators : null);

  const [doShowModal, setDoShowModal] = useState(false);

  // Init navigation class, so we can easily redirect using navigate('/path')
  const navigate = useNavigate();

  // Get API token
  const token = useSelector((state: StateType) => (state.authentication.user_data && state.authentication.user_data.token)||null)

  useEffect(() => {
    buildMunicipalityOptionsValue();
    prepareDefaultSelectedMunicipalities();

    buildOperatorOptionsValue();
    prepareDefaultSelectedOperators();
  }, [token]);

  const prepareDefaultSelectedMunicipalities = () => {
    if(! organisations || ! organisation || ! organisation.data_owner_of_municipalities) return;
    let currentUserMunicipalities = [];
    organisation.data_owner_of_municipalities.forEach(gm_code => {
      let relatedMunicipality: any = organisations.filter(x => x.data_owner_of_municipalities && x.data_owner_of_municipalities[0] === gm_code);
      if(relatedMunicipality && relatedMunicipality.length > 0) {
        currentUserMunicipalities.push({ label: relatedMunicipality[0].name, value: gm_code });
      }
    })
    setSelectedMunicipalities(currentUserMunicipalities);
  }
  
  const prepareDefaultSelectedOperators = () => {
    if(! organisations || ! organisation || ! organisation.data_owner_of_operators) return;
    let currentUserOperators = [];
    organisation.data_owner_of_operators.forEach(system_id => {
      let relatedOperator: any = organisations.filter(x => x.data_owner_of_operators && x.data_owner_of_operators[0] === system_id);
      if(relatedOperator && relatedOperator.length > 0) {
        currentUserOperators.push({ label: relatedOperator[0].name, value: system_id });
      }
    });
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
    console.log('municipalityOptionList', municipalityOptionList)
    console.log('selectedMunicipalities', selectedMunicipalities)

    // Build operatorArray
    let data_owner_of_operators = selectedOperators.map(x => x.value);

    console.log('handleSubmit')
    console.log('data_owner_of_municipalities', data_owner_of_municipalities)
    console.log('data_owner_of_operators', data_owner_of_operators)

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
    const optionsList = [];
    const municipalities = organisations.filter(x => x.type_of_organisation === 'MUNICIPALITY');
    municipalities.forEach(x => {
      optionsList.push({
        value: x.data_owner_of_municipalities[0],
        label: x.name
      })
    })
    setMunicipalityOptionList(optionsList)
  }

  const buildOperatorOptionsValue = async () => {
    const optionsList = [];
    const operators = organisations.filter(x => x.type_of_organisation === 'OPERATOR');
    operators.forEach(x => {
      optionsList.push({
        value: x.data_owner_of_operators[0],
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
            <option value="OTHER_GOVERNEMENT">Andere overheid</option>
            <option value="OPERATOR">Aanbieder</option>
            <option value="OTHER_COMPANY">Ander bedrijf</option>
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

        {/*Nieuw
        <FormLabel classes="mt-2 mb-4 font-bold">
          Status overeenkomst
        </FormLabel>
        <Select
          className="my-2 w-80"
          isMulti={false}
          options={[{
            value: 'Geen',
            label: 'Geen'
          }, {
            value: 'Voorlopig',
            label: 'Voorlopig'
          }, {
            value: 'Ondertekend',
            label: 'Ondertekend'
          }]}
          onChange={(choices: any) => {
          }}
        />

        <FormLabel classes="mt-2 mb-4 font-bold">
          Datum overeenkomst
        </FormLabel>
        <input 
          type="date"
          name="name" 
          className="rounded-lg inline-block border-solid border-2 px-2 py-2 mr-2 mb-2 text-sm w-80"
          value=""
          placeholder=""
          onChange={(event) => {}}
        />

        <FormLabel classes="mt-2 mb-4 font-bold">
          Betalingskenmerk
        </FormLabel>
        <input 
          type="text"
          name="name" 
          className="rounded-lg inline-block border-solid border-2 px-2 py-2 mr-2 mb-2 text-sm w-80"
          value=""
          placeholder=""
          onChange={(event) => {}}
        />

        <FormLabel classes="mt-2 mb-4 font-bold">
          Adressering factuur
        </FormLabel>
        <textarea
          name="name" 
          className="rounded-lg inline-block border-solid border-2 px-2 py-2 mr-2 mb-2 text-sm w-80"
          placeholder=""
          onChange={(event) => {}}
        ></textarea>

        <FormLabel classes="mt-2 mb-4 font-bold">
          Mailadres factuur
        </FormLabel>
        <input 
          type="email"
          name="name" 
          className="rounded-lg inline-block border-solid border-2 px-2 py-2 mr-2 mb-2 text-sm w-80"
          value=""
          placeholder=""
          onChange={(event) => {}}
        />
        End nieuw*/}

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
              <div className="
                inline-block underline
              "
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
