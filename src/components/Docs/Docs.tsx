import { Link } from "react-router-dom";
import Section from '../Section/Section';
import {marked} from 'marked'
import { useEffect, useState } from "react";
import DocsList from "./DocsList";

function Docs() {
  const [folderUrl, setFolderUrl] = useState('https://github.com/Stichting-CROW/dashboarddeelmobiliteit-app/tree/main/src/components/Faq')

  return (
    <div className="
      Docs
    ">
      <h1 className="
        text-4xl
        font-bold
      ">
        Docs
      </h1>

      <div className="my-5">
        <DocsList />
      </div>
    </div>
  )
}

export default Docs;
