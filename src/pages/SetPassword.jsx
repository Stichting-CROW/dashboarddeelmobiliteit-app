import React, { useState } from 'react';
import { useParams, useNavigate } from "react-router-dom";
import { Link } from "react-router-dom";

import LogoCrow from '../components/LogoCrow.jsx';
import { IconButtonClose } from '../components/IconButtons.jsx';

const SetPassword = () => {
  const navigate = useNavigate();
  const { changePasswordCode } = useParams();

  const [password, setPassword] = useState('');
  const [errorMessage, setErrorMessage] = useState(null);

  const handleSubmit = e => {
    e.preventDefault();

    // Clear error message
    setErrorMessage(null);

    const url = (process ? process.env.REACT_APP_FUSIONAUTH_URL : '') + `/api/user/change-password/${changePasswordCode}`
    var data = {
      password: password,
    };

    return fetch(url, {
      method: 'POST',
      body: JSON.stringify(data),
      headers: {
        'Content-Type': 'application/json'
      }
    })
    .then(res => {
      if(res.ok === true) {
        window.notify('Je nieuwe wachtwoord is ingesteld. Log nu in met je nieuwe wachtwoord')
        document.location = '/login'
        return true;
      } else {
        setErrorMessage('Er ging iets fout bij het instellen van je nieuwe wachtwoord. Mogelijk was de link verlopen. In dat geval: klik hieronder op Annuleer en vraag een nieuwe wachtwoordlink aan.');
        return false;
      }
    })
  }

  return (
    <div className="
      px-4
      min-h-screen
      sm:flex sm:justify-center
      sm:px-0
    ">
      <div className="mx-auto py-8" style={{
        width: '100%',
        maxWidth: '416px'
      }}>

        <IconButtonClose
          onClick={() => navigate('/')}
          style={{position: 'absolute', right: '30px', top: '18px'}}
        />

        <LogoCrow />

        <h2 className="mt-4 mb-4 text-4xl font-bold">
          Dashboard Deelmobiliteit
        </h2>

        <p className="mb-4">
          Op deze pagina kun je je wachtwoord wijzigen. Wil je je wachtwoord niet wijzigen, maar inloggen? Ga dan naar het <Link to="/login">inlogformulier</Link>.
        </p>

        <p className="mb-4">
          Vul hieronder je nieuwe wachtwoord in:
        </p>

        <form className="mt-8 mb-4">
          <label className="mt-4 block" htmlFor="password">Wachtwoord</label>
          <input
            className="w-full px-4 py-2 mt-2 border rounded-md focus:outline-none focus:ring-1 focus:ring-blue-600"
            type="password"
            placeholder="Wachtwoord"
            name="password"
            required
            onChange={e => setPassword(e.target.value)}
          />
        
          {errorMessage && <div className="mt-4 bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative" role="alert">
            <span className="block sm:inline">{errorMessage}</span>
          </div>}

          <div className="flex items-baseline mt-4">
              <button className="px-6 py-2 mr-4 mt-4 text-white bg-theme-blue rounded-lg" onClick={handleSubmit}>
                Wachtwoord opslaan
              </button>
              <button className="px-6 py-2 mt-4 text-white bg-gray-300 rounded-lg hover:bg-gray-400" onClick={() => {
                navigate('/')
              }}>
                Annuleer
              </button>
          </div>
        </form>
      </div>
    </div>
  )

};

export default SetPassword;