// import './ContentPage.css'
import React, { useState } from 'react';

// import { setUser } from '../../actions/authentication';
import { clearUser } from '../../actions/authentication.js';
import { useDispatch, useSelector } from 'react-redux';
import { Redirect } from "react-router-dom";
import moment from "moment";
import { Link } from "react-router-dom";

import {downloadReport, downloadRawData} from '../../api/aggregatedStats';

import Logo from '../Logo.jsx';
import { IconButtonClose } from '../IconButtons.jsx';
import DateFromTo from '../DateFromTo/DateFromTo.jsx';
import FormSelect from '../FormSelect/FormSelect.jsx';
import Button from '../Form/Button.jsx';

function Section({title, children}) {
  return <section className="my-6 py-2 border-t-2 border-solid border-gray-200" style={{
    maxWidth: '100%',
    width: '320px',
  }}>
    <h3 className="mt-4 mb-4 text-xl font-bold">
      {title}
    </h3>
    {children}
  </section>
}

export default function Misc(props) {
  const dispatch = useDispatch();

  const [startDate, setStartDate] = useState(moment(moment().subtract(1, 'month')).format('YYYY-MM-DD'));
  const [endDate, setEndDate] = useState(moment().format('YYYY-MM-DD'));
  const [municipalityCode, setMunicipalityCode] = useState('');
  const [doRenderRedirect, setDoRenderRedirect] = useState(false);

  const token = useSelector(state => {
    if(state.authentication && state.authentication.user_data) {
      return state.authentication.user_data.token
    } else {
      return undefined;
    }
  })

  const isVerified = useSelector(state => {
    if(state.authentication && state.authentication.user_data && state.authentication.user_data.user) {
      return state.authentication.user_data.user.verified
    } else {
      return false;
    }
  })

  const user = useSelector(state => {
    if(state.authentication && state.authentication.user_data && state.authentication.user_data.user) {
      return state.authentication.user_data.user
    } else {
      return false;
    }
  });

  const places = useSelector(state => {
    return (state.metadata && state.metadata.gebieden) ? state.metadata.gebieden : [];
  });

  const logOut = () => {
    if (user) {
      dispatch( clearUser() );
      dispatch( { type: "LOGOUT", payload: null });
    }
    setDoRenderRedirect(true);
  }

  const renderRedirect = () => {
    return (
      <Redirect to="/" />
    );
  }
 
  const handleDownloadReportClick = async () => {
    if(! startDate) {
      window.notify('Selecteer een startdatum');
      return;
    }
    if(! endDate) {
      window.notify('Selecteer een einddatum');
      return;
    }
    if(! municipalityCode) {
      window.notify('Selecteer de gemeente');
      return;
    }
    await downloadReport(token, {
      startDate: moment(startDate).format('YYYY-MM-DD'),
      endDate: moment(endDate).format('YYYY-MM-DD'),
      gm_code: municipalityCode
    });
  }

  const handleDownloadRawDataClick = async () => {
    await downloadRawData(token, {
      startDate: moment(startDate).format('YYYY-MM-DD'),
      endDate: moment(endDate).format('YYYY-MM-DD')
    });
  }

  if (doRenderRedirect) {
    return renderRedirect();
  }


  return (
    <div className="
      px-4
      min-h-screen
      sm:flex sm:justify-center
      sm:px-0
    ">
      <div className="mx-auto py-8">

        <IconButtonClose
          onClick={() => setDoRenderRedirect(true)}
          style={{position: 'absolute', right: '30px', top: '18px'}}
        />

        <Logo />

        <div className="
          mt-6 pt-10
          border-t-2 border-solid border-gray-200
        ">

          <h2 className="mt-4 mb-4 text-4xl font-bold">
            Hallo
            <span className="ml-4 inline-block text-gray-300 text-lg">
              {user ? user.email : ''}
            </span>
          </h2>

        </div>

        <p style={{
          maxWidth: '100%',
          width: '416px'
        }} className="mb-4">
          Je bent lid van het Dashboard Deelmobiliteit, een webtool van en voor overheden die de ontwikkelingen rond deelmobiliteit willen volgen.
        </p>

        &raquo; <Link to="/over" className="
          text-gray-400
          underline
          block
          mb-2
          inline-block
        ">
          Meer info
        </Link>

        <div className="flex">
          <Button classes="mr-2" color="blue" href="mailto:info@deelfietsdashboard.nl?subject=Feedback Dashboard Deelmobiliteit&body=Ik heb feedback: ">
            Zend feedback
          </Button>
          <Button color="gray" onClick={() => {
            if(window.confirm('Wil je uitloggen?')) {
              logOut();
            }
          }}>
            Uitloggen
          </Button>
        </div>

        <Section title="Download standaardrapportage">
          <DateFromTo
            label="Periode"
            startDate={moment(startDate).toDate()}
            endDate={moment(endDate).toDate()}
            onChange={(dates) => {
              const [start, end] = dates;
              setStartDate(start);
              setEndDate(end);
            }}
          />
          <FormSelect
            label="Plaats"
            onChange={(e) => {
              setMunicipalityCode(e.target.value)
            }}
            options={places.map(x => {
              return {
                value: x.gm_code,
                title: x.name
              }
            })}
          />
          <Button classes="" color="blue" onClick={() => handleDownloadReportClick()}>
            Download rapportage
          </Button>
        </Section>

        {isVerified && <Section title="Download ruwe data">
          <DateFromTo
            label="Periode"
            startDate={moment(startDate).toDate()}
            endDate={moment(endDate).toDate()}
            onChange={(dates) => {
              const [start, end] = dates;
              setStartDate(start);
              setEndDate(end);
            }}
          />
          <Button classes="" color="blue" onClick={() => handleDownloadRawDataClick()}>
            Download ruwe data (.csv)
          </Button>
        </Section>}

      </div>
    </div>
  );
}
