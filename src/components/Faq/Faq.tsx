import { Link, useLocation } from "react-router-dom";
import Section from '../Section/Section';
import {marked} from 'marked'
import { useEffect, useState } from "react";

function Faq() {
  const [pathName, setPathName] = useState(document.location.pathname);

  // Store window location in a local variable
  let location = useLocation();
  useEffect(() => {
    setPathName(location ? location.pathname : null);
  }, [location]);

  return (
    <div className="
      Faq
    ">
      <h1 className="
        text-4xl
        font-bold
      ">
        FAQ
      </h1>

      <div className="my-5">
        De FAQ is verplaatst naar <a href="/docs">dashboarddeelmobiliteit.nl/docs</a>
      </div>

    </div>
  )
}

export default Faq;
