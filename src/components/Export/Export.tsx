import React, { useState, useEffect } from 'react';
import {marked} from 'marked'

import { clearUser } from '../../actions/authentication.js';
import { useDispatch, useSelector } from 'react-redux';
import moment from "moment";
import { Link } from "react-router-dom";

import {downloadReport, downloadRawData} from '../../api/aggregatedStats';

import Logo from '../Logo.jsx';
import { IconButtonClose } from '../IconButtons.jsx';
import DateFromTo from '../DateFromTo/DateFromTo.jsx';
import FormSelect from '../FormSelect/FormSelect.jsx';
import Button from '../Form/Button.jsx';
import PillMenu from '../PillMenu/PillMenu';
import Section from '../Section/Section';

function Export() {
  const dispatch = useDispatch();

  const [isVerified, setIsVerified] = useState(false);
  const [startDate, setStartDate] = useState(moment(moment().subtract(1, 'month')).format('YYYY-MM-DD'));
  const [endDate, setEndDate] = useState(moment().format('YYYY-MM-DD'));
  const [municipalityCode, setMunicipalityCode] = useState('');
  const [succesfullRawDataRequest, setSuccesfullRawDataRequest] = useState(false);
  const [succesfullRawDataRequestEmail, setSuccesfullRawDataRequestEmail] = useState("");
  const [succesfullRawDataRequestNumberOfTasks, setSuccesfullRawDataRequestNumberOfTasks] = useState(0);

  const places = useSelector(state => {
    return (state.metadata && state.metadata.gebieden) ? state.metadata.gebieden : [];
  });

  const token = useSelector(state => {
    if(state.authentication && state.authentication.user_data) {
      return state.authentication.user_data.token
    } else {
      return undefined;
    }
  })

  const user = useSelector(state => {
    if(state.authentication && state.authentication.user_data && state.authentication.user_data.user) {
      return state.authentication.user_data.user
    } else {
      return false;
    }
  });

  useEffect(x => {
    if(! token) return;

    let url = "https://api.deelfietsdashboard.nl/dashboard-api/menu/acl";
    let options = { headers : { "authorization": "Bearer " + token }}
    
    fetch(url, options).then((response) => {
      if(!response.ok) {
        console.error("unable to fetch: %o", response);
        return false
      }
      response.json().then((acl) => {
        const isAdmin = acl.is_admin === true;
        const isContactPerson = acl.is_contact_person_municipality === true;

        if(isAdmin || isContactPerson) {
          setIsVerified(true);
        }
      });
    });
  }, [token])

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
    setSuccesfullRawDataRequest(false);
    let result = await downloadRawData(token, {
      startDate: moment(startDate).format('YYYY-MM-DD'),
      endDate: moment(endDate).format('YYYY-MM-DD')
    });
    if ("email" in result) {
      setSuccesfullRawDataRequest(true);
      setSuccesfullRawDataRequestEmail(result.email);
      setSuccesfullRawDataRequestNumberOfTasks(result.number_of_requests_in_queue);
    }
  }

  const updateMunicipalityCode = (gm_code) => {
    setMunicipalityCode(gm_code);
  }

  const isDateRangeMoreThanOneMonth = moment(endDate).diff(startDate, 'days') > 30;

  return (
    <div className="Export">
      <h1 className="
        text-4xl
        font-bold
      ">
        Exporteer data
      </h1>

      <div className="my-5">

        <Section title="Download standaardrapportage">
          <div className="lg:w-72">
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
          </div>
          <FormSelect
            label="Plaats"
            onChange={(e) => updateMunicipalityCode(e.target.value)}
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
          <div className="lg:w-72">
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
          </div>

          <Button classes="" color="blue" onClick={() => handleDownloadRawDataClick()}>
            Vraag ruwe data export aan (.csv)
          </Button>

          {succesfullRawDataRequest && <div className="mt-4 bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded relative">
            <span className="block sm:inline">
              Succesvolle ruwe data export aangevraagd, zodra de gegevens geëxporteerd zijn ontvangt u een mail op {succesfullRawDataRequestEmail}.
              Dit duurt tussen de 5-60 minuten afhankelijk van de hoeveelheid te exporteren data en het aantal export verzoeken.
              Op dit moment staan er {succesfullRawDataRequestNumberOfTasks} (andere) dataverzoeken in de wachtrij.
            </span>
          </div>}
          
        </Section>}

      </div>

    </div>
  )
}

export default Export;
