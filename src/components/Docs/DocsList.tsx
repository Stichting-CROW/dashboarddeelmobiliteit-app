import { Link, useLocation } from "react-router-dom";
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

const getFilename = (path) => {
  if(! path) return;

  const filename = path.split('/')[1];
  if(! filename) return;
  if(filename.slice(-3) !== '.md') return;

  return filename;
}

const getFolderName = (path) => path.split('/')[path.split('/').length-1];

function DocsList({
  docs
}: {
  docs: Array<Doc>
}) {
  const location = useLocation();

  const [folderDocs, setFolderDocs] = useState([]);

  useEffect(() => {
    if(! docs) return;

    setFolderDocs(
      sortFolderDocs(
        getFolderDocsOnly(docs)
      )
    );
  }, [docs])

  // Only show docs of the active folder
  const getFolderDocsOnly = (docs) => {
    const currentFolder = location.pathname.replace('/docs/', '');

    return docs.filter(x => {
      const docFolder = x.path.split('/')[0];
      return docFolder === currentFolder;
    });
  }

  const sortFolderDocs = (docs) => {
    const sortedDocs = docs.slice(0);// slice() to copy the array and not just make a reference
    sortedDocs?.sort((a, b) => a.name < b.name ? 1 : -1);

    return sortedDocs;
  }

  return <>
    <h2 className="
      text-3xl
      font-bold
    ">
      {getFolderName(location.pathname)?.replaceAll('_', ' ')}
    </h2>

    {folderDocs?.map((x: Doc) => (
      <h3 className="
        mt-4 mb-4
        text-xl font-bold
      " title={x.name?.replaceAll('_', ' ')} key={x.path}>
        📃 <Link to={`./${getFilename(x.path)}`}>
          {x.name?.replaceAll('_', ' ')}
        </Link>
      </h3>
    ))}
  </>
}

export default DocsList;
