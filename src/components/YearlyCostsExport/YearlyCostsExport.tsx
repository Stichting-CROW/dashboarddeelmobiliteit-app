import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from "react-router-dom";
import { useParams } from 'react-router';
// import './OrganisationList.css';
import {
  useSelector
} from 'react-redux';
import {getYearlyCostOverview} from '../../api/organisations';

// import {OrganisationType} from '../../types/OrganisationType';
import {StateType} from '../../types/StateType';

// Import API methods
// import {getOrganisationList} from '../../api/organisations';

// Import components
import Button from '../Button/Button';
import FormInput from '../FormInput/FormInput';
import FormLabel from '../FormLabel/FormLabel';
// import EditOrganisation from '../EditOrganisation/EditOrganisation';
import H1Title from '../H1Title/H1Title';
import H4Title from '../H4Title/H4Title';

// YearlyCostsExport
const YearlyCostsExport = ({
  showAddOrganisationModule,
}: {
  showAddOrganisationModule?: boolean,
}) => {
  // const [organisations, setOrganisations] = useState([]);
  // const [searchQuery, setSearchQuery] = useState('');
  const [date, setDate] = useState();

  const navigate = useNavigate();
  const token = useSelector((state: StateType) => (state.authentication.user_data && state.authentication.user_data.token)||null)

  const handleSubmit = (e) => {
    e.preventDefault();

    if(! date) {
      window['notify']('Selecteer een referentiedatum');
      return;
    }

    getYearlyCostOverview(token, date);
  }

  return (
    <div className="YearlyCostsExport" style={{maxWidth: '800px'}}>
      <H1Title>Exporteer jaarbijdrage</H1Title>
      <p>
        Op deze pagina kun je een spreadsheet exporteren met daarin een overzicht van de jaarbijdrage per gemeente, gebaseerd op het aantal voertuigen op een bepaalde datum.
      </p>
      <form method="post" className='mb-8' onSubmit={handleSubmit}>
        <FormLabel classes="mt-2 mb-4 font-bold">
          Referentiedatum
        </FormLabel>
        <FormInput type="date" name="referenceDate" onChange={(e) => setDate(e.target.value)} />
        <Button type="submit" theme='primary' style={{marginRight: '0rem', marginLeft: '0rem'}}>
          Download CSV
        </Button>
      </form>
    </div>
  );
}

export default YearlyCostsExport;
