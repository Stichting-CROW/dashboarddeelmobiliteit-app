import React, { useState } from 'react';
import { setUser } from '../actions/authentication';
import { useDispatch } from 'react-redux';
import { Redirect } from "react-router-dom";
import { Link } from "react-router-dom";

import Logo from '../components/Logo.jsx';
import { IconButtonClose } from '../components/IconButtons.jsx';

const Login = () => {
  const [emailaddress, setEmailaddress] = useState('');
  const [password, setPassword] = useState('');
  const [recoverPassword, setRecoverPassword] = useState(false);
  const [errorMessage, setErrorMessage] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);
  const [loggedIn, setLoggedIn] = useState(false);
  const [doRenderRedirect, setDoRenderRedirect] = useState(false);
  const dispatch = useDispatch();

  const login = e => {
    
    e.preventDefault();

    // Clear error message
    setErrorMessage(null);

    // Basic validation
    if(! emailaddress) {
      setErrorMessage('Voer alsjeblieft een e-mailadres in');
      return;
    }

    if(! password) {
      setErrorMessage('Voer alsjeblieft een wachtwoord in');
      return;
    }

    const url = process.env.REACT_APP_FUSIONAUTH_SERVER + "/login";
    var data = {
      loginId: emailaddress,
      password: password,
      applicationId: process.env.REACT_APP_FUSIONAUTH_APPLICATION_ID
    };
    
    fetch(url, {
      method: 'POST',
      body: JSON.stringify(data),
      headers: {
        'Content-Type': 'application/json'
      }
    }).then(res => res.json())
      .then(response => {
        dispatch( { type: 'LOGIN', payload: null } );
        dispatch( { type: 'RESET_FILTER', payload: null } );
        dispatch( setUser(response) );
        setLoggedIn(true);
        document.location = '/map/park';
      }).catch(error => {
        console.error("Login failed! (%s)", error.message);
        setErrorMessage('Login mislukt. Heb je het juiste e-mailadres en wachtwoord ingevuld?');
        setLoggedIn(false);
    });
  };
  
  const recover = e => {
    e.preventDefault();

    // Clear error message
    setErrorMessage(null);

    const url = process.env.REACT_APP_FUSIONAUTH_SERVER + "/user/forgot-password"
    var data = {
      loginId: emailaddress,
    };

    return fetch(url, {
      method: 'POST',
      body: JSON.stringify(data),
      headers: {
        'Content-Type': 'application/json'
      }
    }).then(res => res.json())
      .then(response => {
        console.log(response);
        setSuccessMessage('Als je e-mailadres bij ons bekend is, heb je nu e-mail ontvangen. Hiermee kun je je wachtwoord opnieuw instellen.');
        return true;
      }).catch(error => {
        console.log(error)
        setSuccessMessage('Als je e-mailadres bij ons bekend is, heb je nu e-mail ontvangen. Hiermee kun je je wachtwoord opnieuw instellen.');
        return false;
      });
  };

  const renderLogin = () => {
    return (
      <>
        <p style={{
          maxWidth: '100%',
          width: '416px'
        }} className="mb-4">
          Het Dashboard Deelmobiliteit is een webtool van en voor overheden die de ontwikkelingen rond deelmobiliteit op de voeten willen volgen.
        </p>
        <p style={{
          maxWidth: '100%',
          width: '416px'
        }} className="mb-4">
          Hoe lang en waar staan deelvoertuigen ongebruikt in de openbare ruimte? Hoe vaak worden de deelvoertuigen verhuurd? In welke wijken en op welke tijdstippen zijn deelvoertuigen populair?
        </p>
        <p style={{
          maxWidth: '100%',
          width: '416px'
        }} className="mb-4">
          Met de informatie uit het Dashboard Deelmobiliteit kunnen overheden hun beleid ontwikkelen, evalueren en bijsturen.
        </p>

        <form className="mt-8 mb-4">
          <label className="block" htmlFor="emailaddress">Email</label>
          <input
            className="w-full px-4 py-2 mt-2 border rounded-md focus:outline-none focus:ring-1 focus:ring-blue-600"
            autoCapitalize="off"
            placeholder="email"
            name="emailaddress"
            required
            onChange={e => setEmailaddress(e.target.value.trim())}
          />

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

          <p className="my-4">
            <a href="#" onClick={() => setRecoverPassword(true)} className="
              text-gray-400
              underline
              text-sm
            ">
              Wachtwoord vergeten?
            </a>
          </p>

          <div className="flex items-baseline mt-4">
              <button className="px-6 py-2 mr-4 mt-4 text-white bg-theme-blue rounded-lg" onClick={login}>
                Login
              </button>
              <button className="px-6 py-2 mt-4 text-white bg-gray-300 rounded-lg hover:bg-gray-400" onClick={() => {
                setDoRenderRedirect(true)
              }}>
                Annuleer
              </button>
          </div>
      </form>
      </>
    )
  }
  
  const renderRecoverPassword = () => {
    return (
      <div>

        <p style={{
          maxWidth: '100%',
          width: '416px'
        }} className="mb-4">
          Ben je je wachtwoord vergeten? Vul dan hieronder je mailadres in om een nieuw wachtwoord in te stellen.
        </p>

        <p style={{
          maxWidth: '100%',
          width: '416px'
        }} className="mb-4">
          Liever inloggen? Ga dan door naar het <Link to="/login">loginformulier</Link>.
        </p>

        <br />

        <form>
          <label className="block" htmlFor="emailaddress">E-mailadres</label>
          <input
            className="w-full px-4 py-2 mt-2 border rounded-md focus:outline-none focus:ring-1 focus:ring-blue-600"
            autoCapitalize="off"
            placeholder="E-mailadres"
            name="emailaddress"
            required
            onChange={e => setEmailaddress(e.target.value.trim())}
          />
             
          {successMessage && <div className="mt-4 bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded relative" role="info">
            <span className="block sm:inline">{successMessage}</span>
          </div>}

          {errorMessage && <div className="mt-4 bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative" role="alert">
            <span className="block sm:inline">{errorMessage}</span>
          </div>}

          <div>
            <button className="px-6 py-2 mr-4 mt-4 text-white bg-theme-blue rounded-lg" onClick={recover}>
              Herstel
            </button>
            <button className="px-6 py-2 mt-4 text-white bg-gray-300 rounded-lg hover:bg-gray-400" onClick={() => {
              setErrorMessage(null);
              setRecoverPassword(false);
            }}>
              Annuleer
            </button>
          </div>
        </form>
      </div>
    )
  }
  const renderRedirect = () => {
    return (
      <Redirect to="/" />
    );
  }
 
  if (loggedIn || doRenderRedirect) {
    return renderRedirect();
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
          onClick={() => setDoRenderRedirect(true)}
          style={{position: 'absolute', right: '30px', top: '18px'}}
        />

        <Logo />

        <h2 className="mt-4 mb-4 text-4xl font-bold">
          Dashboard Deelmobiliteit
        </h2>

        {recoverPassword ? renderRecoverPassword() : renderLogin()}

      </div>
    </div>
  )
};

export default Login;