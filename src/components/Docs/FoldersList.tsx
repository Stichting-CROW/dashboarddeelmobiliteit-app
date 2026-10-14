import { Link } from "react-router-dom";
import { useEffect, useState } from "react";
import { DocItem } from "./types";

type Folder = {
  name: string,
  path: string
}

// Generates a list of folders
function FoldersList({
  docs
}: {
  docs: Array<DocItem>
}) {
  const [folders, setFolders] = useState([])

  // If docs updates: Re-create folders list
  useEffect(() => {
    if(! docs) return;

    let uniqueFolders = [];

    setFolders(
      // Convert doc to folder
      docs?.map((x: DocItem) => {
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
