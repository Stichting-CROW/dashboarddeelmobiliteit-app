import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import {StateType} from '../../types/StateType';
import {getAcl} from '../../api/acl';

import moment from "moment";
import {downloadCsv} from '../../helpers/stats';

import DateTimePicker from 'react-datetime-picker/dist/entry.nostyle'; //
import calendarIcon from '../../images/calendar.svg';

import FormLabel from '../FormLabel/FormLabel';
import FormTextarea from '../FormTextarea/FormTextarea';
import FormInput from '../FormInput/FormInput';
import Button from '../Form/Button.jsx';

function Export() {
  const token = useSelector((state: StateType) => (state.authentication.user_data && state.authentication.user_data.token)||null)

  const [isAdmin, setIsAdmin] = useState(false);
  const [acl, setAcl] = useState({});

  const [exportTitle, setExportTitle] = useState('');
  const [exportDate, setExportDate] = useState(new Date().toISOString());
  const [exportGeoJSON, setExportGeoJSON] = useState('{\
    "type": "Polygon",\
    "coordinates": [[[1.882351, 50.649545], [7.023702, 49.333254], [8.108420, 53.729841], [2.235547, 53.721598]]]\
  }');

  useEffect(() => {
    (async () => {
      const theAcl = await getAcl(token);
      setAcl(theAcl);
      setIsAdmin(theAcl.is_admin);
    })();
  }, [token])

  const downloadParkeertelling = async () => {
    // const parkeertellingApiUrl: string = `${process.env.REACT_APP_MAIN_API_URL}/parkeertelling`;
    const parkeertellingApiUrl: string = `https://api.deelfietsdashboard.nl/dashboard-api/parkeertelling`;

    let geoJsonAsObject;
    try {
      geoJsonAsObject = JSON.parse(exportGeoJSON);
    } catch(err) {
      console.error(err);
      window['notify']('Er is een fout in de GeoJSON, controleer deze alsjeblieft');
      return;
    }

    let response;
    try {
      response = await fetch(parkeertellingApiUrl, {
        method: 'POST',
        headers: {
          "Authorization":  `Bearer ${token}`,
          "Content-Type": 'application/json'
        },
        body: JSON.stringify({
          name: exportTitle,
          timestamp: moment(exportDate).format("YYYY-MM-DDTHH:mm:ss")+'Z',
          geojson: geoJsonAsObject
        })
      });
    } catch(err) {
      console.log(err);
      window['notify']('Er was een fout bij het ophalen van de parkeertellingdata');
    }

    let parkeertellingData;
    try {
      parkeertellingData = await response.json();
    } catch(err) {
      console.error(err);
    }

    downloadCsv(generateCsvData(parkeertellingData), `parkeertelling-${moment(exportDate).format("YYYY-MM-DDTHH_mm_ss")+'Z'}.csv`);
  }

  const generateCsvData = (data) => {
    if(! data || data.length <= 0) return;
    if(  typeof data !== 'object') return;

    let csvRows = [];

    // Get headers
    const headers = ['Modaliteit', 'Aantal voertuigen in gebied'];
    csvRows.push(headers.join(';'));

    // Loop over the rows
    for (const x of data) {
      const values = [x[0] ? x[0] : 'other', x[1]];
      csvRows.push(values.join(';'));
    };

    return csvRows.join("\n");
  }

  return (
    <>
      <div className="lg:w-72">
        <p>
          Middels dit formulier kun je het aantal voertuigen per modaliteit downloaden voor een specifiek gebied, op een specifieke datum/tijd.
        </p>
        <p>
          Vraag bijvoorbeeld op: Hoeveel deelvoertuigen stonden er op 1 januari om 10:00 uur in de fietsenstalling van Rotterdam CS?
        </p>
        <p>
          Er is ook een API beschikbaar voor het opvragen van de data. Zie de API-documentatie 'Parkeertelling'.
        </p>
        <p>
          Stel hieronder in welke informatie je wilt hebben en klik dan op "Download parkeertelling".
        </p>
      </div>

      <br />

      <div hidden>
        <FormLabel classes="mt-2 mb-4 font-bold">
          Naam van de parkeertelling
        </FormLabel>
        <FormInput
          type="text"
          placeholder=""
          name="name"
          autoComplete="off"
          value={exportTitle}
          onChange={(e) => setExportTitle(e.target.value)}
          classes="w-80 max-w-full"
        />
      </div>

      <div>
        <FormLabel classes="mt-2 mb-4 font-bold">
          Datum/tijd
        </FormLabel>
        <div className="
          rounded-xl
          border
          border-gray-400
          p-1
          px-2
          inline-block
        ">
          <DateTimePicker
            onChange={setExportDate}
            value={new Date(exportDate)}
            clearIcon={null}
            calendarIcon={<img src={calendarIcon} alt="Logo" />}
            format={"y-MM-dd H:mm"}
            disableClock={true}
          />
        </div>
      </div>

      <div className="mt-4">
        <FormLabel classes="mt-2 mb-4 font-bold">
          GeoJSON
        </FormLabel>
        <FormTextarea
          placeholder='{
            "type": "Polygon", 
            "coordinates":  [
              [
                [5.90802,51.98173],
                [5.90808,51.98171],
                [5.90924,51.98199],
                [5.90921,51.98202],
                [5.90802,51.98173]
              ]
            ]
          }'
          name="name"
          onChange={(e) => setExportGeoJSON(e.target.value)}
          classes="w-80 max-w-full"
          style={{height: '160px', fontFamily: 'monotype'}}
          value={exportGeoJSON}
          defaultValue={exportGeoJSON}
        ></FormTextarea>
      </div>

      <div className="my-2">
        <Button classes="" color="blue" onClick={downloadParkeertelling}>
          Download parkeertelling
        </Button>
      </div>
    </>
  )
}

export default Export;
