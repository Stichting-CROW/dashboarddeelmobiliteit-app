import React, { useState, useEffect} from 'react'
import Select from 'react-select'
import Button from '../Button/Button'
import {
  useSelector
} from 'react-redux';
import { useParams } from 'react-router';
import { useLocation, useNavigate } from "react-router-dom";

import {StateType} from '../../types/StateType';

// Styles
import './EditUser.css'; 

// Components
import H5Title from '../H5Title/H5Title';
import FormLabel from '../FormLabel/FormLabel';

function EditUser({
  user
}: {
  user: object
}) {
  // Get userId from URL
  const { username } = useParams();
  const [message, setMessage] = useState('')
  const [messageDesign, setMessageDesign] = useState('')
  const [email, setEmail] = useState('')
  const [sendEmail, setSendEmail] = useState(false)
  const [admin, setAdmin] = useState(true)
  const [overheid, setOverheid] = useState(false)
  const [aanbieder, setAanbieder] = useState(false)
  const [overigBedrijf, setOverigBedrijf] = useState(false)
  const [kernteam, setKernteam] = useState(false)
  const [downloadrechten, setDownloadrechten] = useState(false)
  const [municipalitiesOptionList, setMunicipalitiesOptionList] = useState([])

  // Init navigation class, so we can easily redirect using navigate('/path')
  const navigate = useNavigate();

  // Get API token
  const token = useSelector((state: StateType) => (state.authentication.user_data && state.authentication.user_data.token)||null)

  // On component load: Get municipalities and generate autosuggestion list
  useEffect(() => {
    buildOptionsValue();
  }, []);
  
  function getHeaders(): any {
    return {
      headers: {
        "Authorization":  `Bearer ${token}`
      }
    };
  }

  const data = {
    filter_municipality: overheid ? true : false,
    filter_operator: aanbieder ? true : false,
    is_admin: admin ? true : false,
    is_contact_person_municipality: false,
    municipalities: [],
    operators: [],
    username: email
  }

  const handleSubmit = (event: object) => {
    let url = 'https://api.deelfietsdashboard.nl/dashboard-api/admin/user/permission';
    let options =  getHeaders();
    options.method = "PUT";
    options.body = JSON.stringify(data);
    options.headers['Content-Type'] = 'application/json';
    return fetch(url, options)
        .then((response) => {
            if (response.status == 401) {
              console.error(response)
                // errorNoPermission(response);
            }
            return response.status;
        });

  }
  
  const handleClose = () => {
    navigate('/admin/users');
  }


  const fetchOptions = {
    headers: {
      "authorization": `Bearer ${token}`,
      'mode':'no-cors'
    }
  }

  const getAclFromDatabase = async () => {
    const response = await fetch('https://api.deelfietsdashboard.nl/dashboard-api/menu/acl', fetchOptions);
    const parsed = await response.json();

    return parsed 
  }


  const buildOptionsValue = async () => {
    const acl = await getAclFromDatabase();
    const optionsList = []
    acl.municipalities.forEach(element => {
      optionsList.push({
        value: element.name,
        label: element.name
      })
    })
    setMunicipalitiesOptionList(optionsList)
  }

  return (
    <div>
    <form onSubmit={handleSubmit} className='add-user-form'>
        <div className="email">
          <FormLabel classes="mt-2 mb-4">Wijzig emailadres</FormLabel>
          <input 
            type="email" 
            disabled
            className="rounded-lg inline-block border-solid border-2 px-2 py-2 mr-2 mb-2 text-sm cursor-pointer w-80"
            value={username}
            onChange={(event) => setEmail(event.target.value)}
          />
        </div>
        <div>
          <FormLabel classes="mt-2 mb-4">Wijzig rollen</FormLabel>
          <ul className='rollen flex'>
            <li>
              <label className={`rounded-lg inline-block border-solid border-2 px-2 py-2 mr-2 mb-2 text-sm cursor-pointer ${admin ? "active" : ""}`}
                htmlFor="admin">Admin</label>
              <input 
                type="radio" 
                id="admin"
                name="rollen"
                className="hidden"
                onClick={() =>{
                  setAdmin(true)
                  setAanbieder(false)
                  setOverheid(false)
                }}
              />
            </li>
            <li >
              <label className={`rounded-lg inline-block border-solid border-2 px-2 py-2 mr-2 mb-2 text-sm cursor-pointer ${overheid ? "active" : ""}`}
                htmlFor="overheid">Overheid</label>
              <input 
                type="radio" 
                id="overheid"
                name="rollen"
                className="hidden"
                onClick={() => {
                  setOverheid(true)
                  setAanbieder(false)
                  setAdmin(false)
                }}
              />
            </li>
            <li>
              <label className={`rounded-lg inline-block border-solid border-2 px-2 py-2 mr-2 mb-2 text-sm cursor-pointer ${aanbieder ? "active" : ""}`}
                htmlFor="aanbieder">Aanbieder</label>
              <input 
                type="radio" 
                id="aanbieder"
                name="rollen"
                className="hidden"
                onClick={() => {
                  setAanbieder(true); 
                  setAdmin(false)
                  setOverheid(false)
                }}
              />
            </li>
          </ul>
        </div>
        {overheid && <Select
          className="mt-2"
          options={municipalitiesOptionList}
          placeholder="Selecteer 1 of meerdere overheden"
        />}
        <div className="my-2">
          <input 
            type="checkbox" 
            value={sendEmail ? 'true' : 'false'}
            onChange={(event) => setSendEmail(event.target.value ? true : false)}
          />
          <H5Title classes="p-3">Stuur welkomstmail</H5Title>
        </div>
      
        <Button classes={'w-40 save'} type="submit" theme="primary">Opslaan</Button>
      </form>
      {message && <p className={`rounded-lg inline-block border-solid border-2 px-2 py-2 mr-2 mb-2 text-sm ${(messageDesign == "red") ? "error-message" : "success-message"}`}>{message} </p>}


      </div>
  )
}

export default EditUser
