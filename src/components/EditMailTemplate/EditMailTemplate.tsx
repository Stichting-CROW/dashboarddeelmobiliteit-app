import React, { useState, useEffect} from 'react'
import Select from 'react-select'
import Button from '../Button/Button'
import {
  useSelector
} from 'react-redux';
import { useParams } from 'react-router';
import { useLocation, useNavigate } from "react-router-dom";

import {StateType} from '../../types/StateType';
import {MailTemplateType} from '../../types/MailTemplateType';

// Import API methods
import {getMenuAcl} from '../../api/acl';
import {createTemplate} from '../../api/mailTemplates';
// import {getMailTemplateList} from '../../api/mailTemplates';

// Models
import {OrganisationType} from '../../types/OrganisationType';

// Components
import H5Title from '../H5Title/H5Title';
import FormLabel from '../FormLabel/FormLabel';
import Modal from '../Modal/Modal.jsx';

function EditOrganisation({
  mailTemplates,
  mailTemplate,
  onSaveHandler
}: {
  mailTemplates: any,
  mailTemplate?: MailTemplateType,// User can be optional as this component is also used for adding new organisations
  onSaveHandler: Function
}) {
  const [formName, setFormName] = useState(mailTemplate ? mailTemplate.name : null);
  const [formDefaultTemplate, setFormDefaultTemplate] = useState(mailTemplate ? mailTemplate.name : null);

  const [doShowModal, setDoShowModal] = useState(false);

  // Init navigation class, so we can easily redirect using navigate('/path')
  const navigate = useNavigate();

  // Get API token
  const token = useSelector((state: StateType) => (state.authentication.user_data && state.authentication.user_data.token)||null)

  const handleSubmit = async (e) => {
    if(e) e.preventDefault();

    // Update
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
      await createTemplate(token, {
        "name": formName,
        "defaultTemplate": formDefaultTemplate
      });
    // }

    handleClose();
    onSaveHandler();
  }
  
  const handleClose = () => {
    navigate('/admin/mail-templates');
  }

  return (
    <div>
      <form onSubmit={handleSubmit} className='add-mailTemplate-form'>
        <div className="email">
          <FormLabel classes="mt-2 mb-4 font-bold">
            Naam van de template
          </FormLabel>
          <input 
            type="text"
            name="name" 
            className="rounded-lg inline-block border-solid border-2 px-2 py-2 mr-2 mb-2 text-sm w-80"
            value={formName}
            placeholder="Bijvoorbeeld: Registratie-mail"
            onChange={(event) => setFormName(event.target.value)}
          />
        </div>

        <div>
          <FormLabel classes="mt-2 mb-4 font-bold">
            Mailtekst
          </FormLabel>
          <textarea
            name="defaultTemplate"
            className="rounded-lg inline-block border-solid border-2 px-2 py-2 mr-2 mb-2 text-sm w-80 w-full"
            style={{height: '200px'}}
            onChange={(event) => setFormDefaultTemplate(event.target.value)}
          ></textarea>
        </div>

        <div className="flex justify-between" style={{marginLeft: '-0.5rem'}}>
          <Button classes={'w-40 save'} type="submit" theme="primary">
            Opslaan
          </Button>
        </div>
      </form>

    </div>
  )
}

export default EditOrganisation
