import React, { useState } from 'react';
import { setUser } from '../actions/authentication';
import { useDispatch } from 'react-redux';
import {
  Redirect,
  Route
 } from "react-router-dom";

const Login = () => {
  const [emailaddress, setEmailaddress] = useState('');
  const [password, setPassword] = useState('');
  const [recoverPassword, setRecoverPassword] = useState(false);
  const [loggedIn, setLoggedIn] = useState(false);
  const dispatch = useDispatch();

  const login = e => {
    
    e.preventDefault();

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
        dispatch( setUser(response) );
        setLoggedIn(true);
      }).catch(error => {
        setLoggedIn(false);
    });
  };
  
  const recover = e => {
    e.preventDefault();
    
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
        return false;
      });

    // do login here
  };

  const renderLogin = () => {
    return (
      <div class="flex items-center justify-center min-h-screen bg-gray-100">
        <div class="px-8 py-6 mt-4 text-left bg-white shadow-lg">
          <h3 class="text-2xl font-bold text-center">Login</h3>
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

            <label class="block" htmlFor="password">Wachtwoord</label>
            <input
              className="w-full px-4 py-2 mt-2 border rounded-md focus:outline-none focus:ring-1 focus:ring-blue-600"
              type="password"
              placeholder="Wachtwoord"
              name="password"
              required
              onChange={e => setPassword(e.target.value)}
            />
          
            <div class="flex items-baseline justify-between">
                <button class="px-6 py-2 mr-4 mt-4 text-white bg-blue-600 rounded-lg hover:bg-blue-900" onClick={login}>Login</button>
                <button class="px-6 py-2 mt-4 text-white bg-blue-600 rounded-lg hover:bg-blue-900" onClick={()=>setRecoverPassword(true)}>Wachtwoord vergeten</button>
            </div>
          </form>
        </div>
      </div>)
  }
  
  const renderRecoverPassword = () => {
    return (
      <div class="flex items-center justify-center min-h-screen bg-gray-100">
        <div class="px-8 py-6 mt-4 text-left bg-white shadow-lg">
          <h3 class="text-2xl font-bold text-center">Wachtwoord herstellen</h3>
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
          
            <div class="flex items-baseline justify-between">
                <button class="px-6 py-2 mr-4 mt-4 text-white bg-blue-600 rounded-lg hover:bg-blue-900" onClick={recover}>Herstel</button>
                <button class="px-6 py-2 mt-4 text-white bg-blue-600 rounded-lg hover:bg-blue-900" onClick={()=>setRecoverPassword(false)}>Annuleer</button>
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