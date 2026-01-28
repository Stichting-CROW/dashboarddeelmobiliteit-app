import React, { useState, useEffect } from 'react';

// import { setUser } from '../../actions/authentication';
import { clearUser } from '../../actions/authentication.js';
import { useDispatch, useSelector } from 'react-redux';
import moment from "moment";
import { Link, useNavigate } from "react-router-dom";

import {StateType} from '../../types/StateType';

import {downloadReport, downloadRawData} from '../../api/aggregatedStats';

import Logo from '../Logo.jsx';
import { IconButtonClose } from '../IconButtons.jsx';
import DateFromTo from '../DateFromTo/DateFromTo.jsx';
import FormSelect from '../FormSelect/FormSelect.jsx';
import Button from '../Button/Button';
import Section from '../Section/Section';
import ActiveUserStats from '../ActiveUserStats/ActiveUserStats';

// import './Profile.css';

function Profile() {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const user = useSelector((state: StateType) => {
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
    navigate('/');
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
        <Button classes="mr-2" theme="blue" onClick={() => window.location.href = "mailto:info@dashboarddeelmobiliteit.nl?subject=Feedback Dashboard Deelmobiliteit&body=Ik heb feedback: "}>
          Zend feedback
        </Button>
        <Button theme="gray" onClick={() => {
          if(window.confirm('Wil je uitloggen?')) {
            logOut();
          }
        }}>
          Uitloggen
        </Button>
      </div>

      {false && <div className="my-4">
        <ActiveUserStats />
      </div>}

    </div>
  )
}

export default Profile;
