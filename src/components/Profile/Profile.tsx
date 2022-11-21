import React, { useState, useEffect } from 'react';

// import { setUser } from '../../actions/authentication';
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
import Section from '../Section/Section';

// import './Profile.css';

function Profile() {
  const dispatch = useDispatch();

  const user = useSelector(state => {
    if(state.authentication && state.authentication.user_data && state.authentication.user_data.user) {
      return state.authentication.user_data.user
    } else {
      return false;
    }
  });

  const logOut = () => {
    if (user) {
      dispatch( clearUser() );
      dispatch( { type: "LOGOUT", payload: null });
    }
    setDoRenderRedirect(true);
  }

  return (
    <div>

      <h2 className="mb-4 text-4xl font-bold">
        Hallo
        <span className="ml-4 inline-block text-gray-300 text-lg">
          {user ? user.email : ''}
        </span>
      </h2>

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
      </Link><br />

      &raquo; <Link to="/rondleiding" className="
        text-gray-400
        underline
        block
        mb-2
        inline-block
      ">
        Rondleiding
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

    </div>
  )
}

export default Profile;
