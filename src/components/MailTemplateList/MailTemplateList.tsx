import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from "react-router-dom";
// import { useParams } from 'react-router';
// import './OrganisationList.css'; 
import {
  useSelector
} from 'react-redux';

// import {OrganisationType} from '../../types/OrganisationType';
import {StateType} from '../../types/StateType';

// Import API methods
import {getMailTemplateList} from '../../api/mailTemplates';

// Import components
import Button from '../Button/Button';
import EditMailTemplate from '../EditMailTemplate/EditMailTemplate';
import PageTitle from '../common/PageTitle';
import H4Title from '../H4Title/H4Title';

const TableRow = ({
  mailTemplates,
  mailTemplate,
  editClickHandler,
  onSaveHandler
}: {
  mailTemplates: any,
  mailTemplate: any,
  editClickHandler: Function,
  onSaveHandler: Function
}) => {
  return <div>OK</div>
  // // Get organisationId from URL
  // const { organisationId } = useParams();

  // let organisation_type;
  // if(organisation.type_of_organisation === 'OPERATOR') {
  //   organisation_type = 'Aanbieder';
  // }
  // else if(organisation.type_of_organisation === 'MUNICIPALITY') {
  //   organisation_type = 'Gemeente';
  // }
  // else if(organisation.type_of_organisation === 'ADMIN') {
  //   organisation_type = 'Admin';
  // }

  // return <div
  //   key={organisation.organisation_id}
  //   className={`TableRow ${organisationId == organisation.organisation_id ? 'no-hover' : ''}`}
  //   onClick={() => editClickHandler(organisation)}
  // >
  //   <div className="flex">
  //     <div className="col-name text-sm">
  //       {organisation.name}
  //     </div>
  //     <div className="col-type text-sm">
  //       {organisation_type}
  //     </div>
  //     <div className="col-actions text-sm flex justify-end">
  //       <button className='edit-icon' style={{height: '100%'}} />
  //     </div>
  //   </div>

  //   {/*If organisation clicked edit: Show edit form */}
  //   <div className="col-span-3" hidden={organisationId != organisation.organisation_id}>
  //     {organisationId == organisation.organisation_id && <EditOrganisation
  //       organisations={organisations}
  //       organisation={organisation}
  //       onSaveHandler={onSaveHandler}
  //     />}
  //   </div>

  // </div>
}

// MailTemplateList
const MailTemplateList = ({
  showAddMailTemplateModule,
}: {
  showAddMailTemplateModule?: boolean,
}) => {
  const [mailTemplates, setMailTemplates] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');

  const navigate = useNavigate();
  const token = useSelector((state: StateType) => (state.authentication.user_data && state.authentication.user_data.token)||null)

  // Get organisation list on component load
  useEffect(() => {
    fetchMailTemplatesList();
  }, []);

  const fetchMailTemplatesList = async () => {
    const mailTemplates = await getMailTemplateList(token);
    setMailTemplates(mailTemplates);
  }

  const getFetchOptions = () => {
    return {
      headers: {
        "authorization": `Bearer ${token}`,
        'mode':'no-cors'
      }
    }
  }

  const handleClick = () => {
    navigate('/admin/mail-templates/new');
  }

  const editClickHandler = () => {
    // navigate(`/admin/organisations/${organisation.organisation_id}`)
  }

  const filteredMailTemplates = mailTemplates.filter(x => {
    return (x.name && x.name.toLowerCase().indexOf(searchQuery.toLowerCase()) > -1);
  });

  return (
    <div className="OrganisationList" style={{maxWidth: '800px'}}>
      <PageTitle>Mail templates</PageTitle>
      <div className='mb-8' style={{marginRight: '-0.5rem', marginLeft: '-0.5rem'}}>
        <Button theme='primary' classes='add-new' onClick={() => handleClick()}>Nieuwe template</Button>
      </div>
      {showAddMailTemplateModule && <div className="mb-6">
        <EditMailTemplate
          mailTemplates={mailTemplates}
          onSaveHandler={fetchMailTemplatesList}
        />
      </div>}
      <div className="
        Table
      ">
        <div className="TableRow flex justify-between no-hover">
          <H4Title className="col-name">Naam</H4Title>
          <H4Title className="col-type">Type</H4Title>
          <H4Title className="col-actions"></H4Title>
        </div>
        <div className="TableRow flex justify-between no-hover">
          <div className="w-full">
            <input
              type="search"
              placeholder="Zoek.."
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full rounded-lg inline-block border-solid border-2 px-2 py-2 text-sm"
            />
          </div>
        </div>
        {mailTemplates ? filteredMailTemplates.map(x => {
          return <TableRow
            mailTemplates={mailTemplates}
            mailTemplate={x}
            editClickHandler={editClickHandler}
            onSaveHandler={fetchMailTemplatesList}
          />;
        }) : <></>}
      </div>
    </div>
  );
}

export default MailTemplateList;
