import React, { useState } from 'react'
import Button from '../Button/Button'
import {
  useSelector
} from 'react-redux';
import { useLocation, useNavigate } from "react-router-dom";

// Styles
import './AddUser.css'; 

// Components
import H5Title from '../H5Title/H5Title';

function AddUser(props) {
  // Init navigation class, so we can easily redirect using navigate('/path')
  const navigate = useNavigate();

  // Get API token
  const token = useSelector(state => (state.authentication.user_data && state.authentication.user_data.token)||null)

  // State variables
  const [message, setMessage] = useState('')
  const [email, setEmail] = useState('')
  const [sendEmail, setSendEmail] = useState(false)
  const [admin, setAdmin] = useState(true)
  const [overheid, setOverheid] = useState(false)
  const [aanbieder, setAanbieder] = useState(false)
  const [overigBedrijf, setOverigBedrijf] = useState(false)
  const [kernteam, setKernteam] = useState(false)
  const [downloadrechten, setDownloadrechten] = useState(false)

  if (!props.showModule) {
    return null
  }

let userRoles = ""

  const handleSubmit = (event) => {
    event.preventDefault();
    console.log(admin)
    if (admin) {
      userRoles = ""
      userRoles = "Admin"
    } 
    if (overheid) {
      userRoles = ""
      userRoles = "Overheid"
    } 
    if (aanbieder) {
      userRoles = ""
      userRoles = "Aanbieder"
    } 
    console.log('userRoles', userRoles)
    createUser(email, userRoles)
  }
  
  function getHeaders() {
    return {
      headers: {
        "Authorization":  `Bearer ${token}`
      }
    };
  }
  
  const handleClose = () => {
    navigate('/admin/users');
  }

  function createUser(email, role) {
    let roles = {
        "Admin": "administer",
        "Overheid": "municipality",
        "Aanbieder": "operator",
    };
    let body = {
        email: email,
        user_type: roles[role]
    };
    let url = 'https://api.deelfietsdashboard.nl/dashboard-api/admin/user/create';
    let options =  getHeaders();
    options.method = "PUT";
    options.body = JSON.stringify(body);
    options.headers['Content-Type'] = 'application/json';
    return fetch(url, options)
        .then((response) => {
            if (response.status == 200) {
              setMessage("User created successfully!")         
              setTimeout(() => {
                handleClose()
              }, 2000)
            } else {
                //errorNoPermission(response);
                setMessage("There has been an error. Please try again.")
                setTimeout(() => {
                  handleClose()
                }, 2000)
                
            }
            return response.json();
        });
  }

  
  
  return (
    <div>
      <form onSubmit={handleSubmit} className='add-user-form'>
        <div className="email p-2">
          <H5Title>Emailadres</H5Title>
          <input 
            type="email" 
            className="rounded-lg inline-block border-solid border-2 px-2 py-2 mr-2 mb-2 text-sm cursor-pointer w-80"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
          />
        </div>
        <div className="p-2">
          <H5Title>Rollen</H5Title>
          <ul className='rollen'>
            <li>
              <label className={`rounded-lg inline-block border-solid border-2 px-2 py-2 mr-2 mb-2 text-sm cursor-pointer ${admin ? "active" : ""}`}
                htmlFor="admin">Admin</label>
              <input 
                type="radio" 
                id="admin"
                name="rollen"
                value={admin}
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
                value={overheid}
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
                value={aanbieder}
                onClick={() => {
                  setAanbieder(true); 
                  setAdmin(false)
                  setOverheid(false)
                }}
              />
            </li>
          </ul>
        </div>
        <div className="p-2">
          <input 
            type="checkbox" 
            value={sendEmail}
            onChange={(event) => setSendEmail(event.target.value)}
          />
          <H5Title className="p-3">Stuur welkomstmail</H5Title>
        </div>
      
        <Button type="submit" theme="primary">Opslaan</Button>
      </form>
      {message && <p>{message}</p>}
    </div>
  )
}

export default AddUser


