import React, { useState } from 'react';
import { setUser } from '../actions/authentication';
import { useDispatch } from 'react-redux';
import {
  Redirect
 } from "react-router-dom";

const Login = () => {
  const [emailaddress, setEmailaddress] = useState('');
  const [password, setPassword] = useState('');
  const [recoverPassword, setRecoverPassword] = useState(false);
  const [errorMessage, setErrorMessage] = useState(null);
  const [loggedIn, setLoggedIn] = useState(false);
  const dispatch = useDispatch();

  const login = e => {
    
    e.preventDefault();

    // Clear error message
    setErrorMessage(null);

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
        return true;
      }).catch(error => {
        console.log(error)
        // setErrorMessage('Controleer of je e-mailadres klopt. Mocht het daarna nog steeds niet lukken, neem dan contact op met info@deelfietsdashboard.nl');
        setErrorMessage('Dank voor je verzoek voor een wachtwoord-resetmail. Het opvragen van je wachtwoord werkt nog niet in dit nieuwe Dashboard. Stuur alsjeblieft een mail aan info@deelfietsdashboard.nl met je e-mailadres, dan zorgen wij dat je een wachtwoord-herstel-link ontvangt. Dank!');
        return false;
      });

    // do login here
  };

  const renderLogin = () => {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-100">
        <div className="px-8 py-6 mt-4 text-left bg-white shadow-lg">
          <h3 className="text-2xl font-bold text-center">Login</h3>
          <form>
            <label className="block" htmlFor="emailaddress">Email</label>
            <input
              className="w-full px-4 py-2 mt-2 border rounded-md focus:outline-none focus:ring-1 focus:ring-blue-600"
              autoCapitalize="off"
              placeholder="email"
              name="emailaddress"
              required
              onChange={e => setEmailaddress(e.target.value)}
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

            <div className="flex items-baseline justify-between">
                <button className="px-6 py-2 mr-4 mt-4 text-white bg-blue-600 rounded-lg hover:bg-blue-900" onClick={login}>Login</button>
                <button className="px-6 py-2 mt-4 text-white bg-blue-600 rounded-lg hover:bg-blue-900" onClick={() => setRecoverPassword(true)}>Wachtwoord vergeten</button>
            </div>
          </form>
        </div>
      </div>)
  }
  
  const renderRecoverPassword = () => {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-100">
        <div className="px-8 py-6 mt-4 text-left bg-white shadow-lg">
          <h3 className="text-2xl font-bold text-center">Wachtwoord herstellen</h3>
          <form>
            <label className="block" htmlFor="emailaddress">Email</label>
            <input
              className="w-full px-4 py-2 mt-2 border rounded-md focus:outline-none focus:ring-1 focus:ring-blue-600"
              autoCapitalize="off"
              placeholder="Email"
              name="emailaddress"
              required
              onChange={e => setEmailaddress(e.target.value)}
            />
     
            {errorMessage && <div className="mt-4 bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative" role="alert">
              <span className="block sm:inline">{errorMessage}</span>
            </div>}

            <div className="flex items-baseline justify-between">
                <button className="px-6 py-2 mr-4 mt-4 text-white bg-blue-600 rounded-lg hover:bg-blue-900" onClick={recover}>Herstel</button>
                <button className="px-6 py-2 mt-4 text-white bg-blue-600 rounded-lg hover:bg-blue-900" onClick={() => {
                  setErrorMessage(null);
                  setRecoverPassword(false);
                }}>Annuleer</button>
            </div>
          </form>
        </div>
      </div>)
  }
  const renderRedirect = () => {
    return (
        <Redirect to="/" />
    );
  }
 
  if (loggedIn) {
    return renderRedirect();
  }

  return recoverPassword ? renderRecoverPassword() : renderLogin();
};

export default Login;