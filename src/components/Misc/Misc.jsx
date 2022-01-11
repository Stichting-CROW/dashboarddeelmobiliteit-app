// import './ContentPage.css'
import React, { useState } from 'react';

// import { setUser } from '../../actions/authentication';
import { clearUser } from '../../actions/authentication.js';
import { useDispatch, useSelector } from 'react-redux';
import { Redirect } from "react-router-dom";
import moment from "moment";

import Logo from '../Logo.jsx';
import { IconButtonClose } from '../IconButtons.jsx';
import DateFromTo from '../DateFromTo/DateFromTo.jsx';
import FormSelect from '../FormSelect/FormSelect.jsx';
import Button from '../Form/Button.jsx';

function Section({title, children}) {
  return <section className="my-6 py-2 border-t-2 border-solid border-gray-200" style={{
    maxWidth: '100%',
    width: '320px',
  }}>
    <h3 className="mt-4 mb-4 text-xl font-bold">
      {title}
    </h3>
    {children}
  </section>
}

export default function Misc(props) {
  const dispatch = useDispatch();

  const [doRenderRedirect, setDoRenderRedirect] = useState(false);

  const user = useSelector(state => {
    if(! state.authentication) return false;
    return state.authentication.user_data.user
  });

  const places = useSelector(state => {
    return (state.metadata && state.metadata.gebieden) ? state.metadata.gebieden : [];
  });

  const logOut = () => {
    if (user) {
      dispatch( clearUser() );
      dispatch( { type: "LOGOUT", payload: null });
    }
    setDoRenderRedirect(true);
  }

  const renderRedirect = () => {
    return (
      <Redirect to="/" />
    );
  }
 
  if (doRenderRedirect) {
    return renderRedirect();
  }

  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="mx-auto py-8">

        <IconButtonClose
          onClick={() => setDoRenderRedirect(true)}
          style={{position: 'absolute', right: '30px', top: '18px'}}
        />

        <Logo />

        <div className="
          mt-6 pt-10
          border-t-2 border-solid border-gray-200
        ">

          <h2 className="mt-4 mb-4 text-4xl font-bold">
            Hallo
            <span className="ml-4 inline-block text-gray-300 text-lg">
              {user ? user.email : ''}
            </span>
          </h2>

        </div>

        <p style={{
          maxWidth: '100%',
          width: '416px'
        }} className="mb-4">
          Je bent lid van het Dashboard Deelmobiliteit, een webtool van en voor overheden die de ontwikkelingen rond deelmobiliteit willen volgen.
        </p>

        <div className="flex">
          <Button classes="mr-2" color="blue" href="mailto:info@deelfietsdashboard.nl?subject=Feedback Dashboard Deelmobiliteit&body=Ik heb feedback: ">
            Zend feedback
          </Button>
          <Button color="gray" onClick={() => {
            setDoRenderRedirect(true)
          }}>
            Uitloggen
          </Button>
        </div>

        <Section title="Download standaardrapportage">
          <DateFromTo
            label="Periode"
            startDate={moment().toDate()}
            endDate={moment().subtract(7, 'days').toDate()}
          />
          <FormSelect
            label="Plaats"
            options={places.map(x => {
              return {
                value: x.gm_code,
                title: x.name
              }
            })}
          />
          <Button classes="" color="blue">
            Download rapportage
          </Button>
        </Section>

        <Section title="Download ruwe data">
          <DateFromTo label="Periode" />
          <Button classes="" color="blue">
            Download ruwe data (.csv)
          </Button>
        </Section>

      </div>
    </div>
  );
}
