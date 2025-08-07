import { Link } from "react-router-dom";
import Section from '../Section/Section';
import {marked} from 'marked'
import { useEffect, useState } from "react";

type Folder = {
  name: string,
  path: string
}

type Doc = {
  name: string,
  path: string,
  download_url: string
}

// Generates a list of folders
function FoldersList({
  docs
}: {
  docs: Array<Doc>
}) {
  const [folders, setFolders] = useState([])

  // If docs updates: Re-create folders list
  useEffect(() => {
    if(! docs) return;

    let uniqueFolders = [];

    setFolders(
      // Convert doc to folder
      docs?.map((x: Doc) => {
        const folderName = x.path.split('/')[0];

        return {
          name: folderName,
          path: folderName
        }
      })
      // Only keep unique folders
      .filter((x, index) => {
        const folderName = x.path.split('/')[0];

        const isUnique = uniqueFolders.indexOf(folderName) <= -1
        uniqueFolders.push(folderName);

        return isUnique;
      })
    );
  }, [docs]);

  return <>
    <h2 className="
      text-3xl
      font-bold
    ">
      Selecteer een categorie
    </h2>

    {folders.map((x: Folder) => (
      <h3 className="
        mt-4 mb-4
        text-xl font-bold
      " title={x.name} key={x.path}>
        ➡️ <Link to={`./${x.path}`}>
          {x.path?.replaceAll('_', ' ')}
        </Link>
      </h3>
    ))}
  </>
}

export default FoldersList;
