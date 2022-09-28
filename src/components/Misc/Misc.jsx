import { useState } from 'react';
import { Redirect } from "react-router-dom";

import Logo from '../Logo.jsx';
import PillMenu from '../PillMenu/PillMenu';
import { IconButtonClose } from '../IconButtons.jsx';

export default function Misc({children}) {
  const [doRenderRedirect, setDoRenderRedirect] = useState(false);

  const renderRedirect = () => {
    return (
      <Redirect to="/" />
    );
  }

  if (doRenderRedirect) {
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
        width: '500px',
        maxWidth: '100%'
      }}>

        <IconButtonClose
          onClick={() => setDoRenderRedirect(true)}
          style={{position: 'absolute', right: '30px', top: '18px'}}
        />

        <Logo title="Extra" />

        <div className="mt-8">
          <PillMenu />
        </div>

        <div className="
          mt-8
        ">
          {children}
        </div>

      </div>
    </div>
  );
}
