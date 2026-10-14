import React, { useState } from 'react';
import { useParams, useNavigate, Link } from "react-router-dom";
import { useDispatch } from 'react-redux';

import { IconButtonClose } from '../components/IconButtons.jsx';
import LogoDashboardDeelmobiliteit from '../components/Logo/LogoDashboardDeelmobiliteit';
import { setUser } from '../actions/authentication';
import {
  changePassword,
  loginWithOneTimePassword
} from '../api/auth';
import { notifyInfo } from '../helpers/notify';

const SetPassword = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { changePasswordCode } = useParams();

  const [password, setPassword] = useState('');
  const [errorMessage, setErrorMessage] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async e => {
    e.preventDefault();
    setErrorMessage(null);
    setIsSubmitting(true);

    const changeResult = await changePassword(changePasswordCode, password);
    if (!changeResult) {
      setErrorMessage('Er ging iets fout bij het instellen van je nieuwe wachtwoord. Mogelijk was de link verlopen. In dat geval: klik hieronder op Annuleer en vraag een nieuwe wachtwoordlink aan.');
      setIsSubmitting(false);
      return;
    }

    if (changeResult.oneTimePassword) {
      const loginResponse = await loginWithOneTimePassword(
        changeResult.oneTimePassword
      );
      if (loginResponse) {
        dispatch({ type: 'LOGIN', payload: null });
        dispatch({ type: 'RESET_FILTER', payload: null });
        dispatch(setUser(loginResponse));
        notifyInfo('Succesvol ingelogd 👌');
        navigate('/map/park');
        return;
      }
    }

    // Password was set, but auto-login was not possible — fall back to login.
    notifyInfo('Je nieuwe wachtwoord is ingesteld. Log nu in met je nieuwe wachtwoord.');
    navigate('/login');
  };

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

        <LogoDashboardDeelmobiliteit />

        <h2 className="mt-4 mb-4 text-4xl font-bold">
          Stel je wachtwoord in
        </h2>

        <p className="mb-4">
          Op deze pagina kun je je wachtwoord wijzigen. Wil je je wachtwoord niet wijzigen, maar inloggen? Ga dan naar het <Link to="/login">inlogformulier</Link>.
        </p>

        <p className="mb-4">
          Vul hieronder je nieuwe wachtwoord in:
        </p>

        <form className="mt-8 mb-4" onSubmit={handleSubmit}>
          <label className="mt-4 block" htmlFor="password">Wachtwoord</label>
          <input
            className="w-full px-4 py-2 mt-2 border rounded-md focus:outline-none focus:ring-1 focus:ring-blue-600"
            type="password"
            placeholder="Wachtwoord"
            name="password"
            required
            disabled={isSubmitting}
            onChange={e => setPassword(e.target.value)}
          />
        
          {errorMessage && <div className="mt-4 bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative" role="alert">
            <span className="block sm:inline">{errorMessage}</span>
          </div>}

          <div className="flex items-baseline mt-4">
              <button
                type="submit"
                className="px-6 py-2 mr-4 mt-4 text-white bg-theme-blue rounded-lg"
                disabled={isSubmitting}
              >
                Wachtwoord opslaan
              </button>
              <button
                type="button"
                className="px-6 py-2 mt-4 text-white bg-gray-300 rounded-lg hover:bg-gray-400"
                onClick={() => {
                  navigate('/')
                }}
              >
                Annuleer
              </button>
          </div>
        </form>
      </div>
    </div>
  )

};

export default SetPassword;
