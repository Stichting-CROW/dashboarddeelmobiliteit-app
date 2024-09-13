import { Link, useLocation } from "react-router-dom";
import { useEffect, useState } from "react";
import {marked} from 'marked'

type Doc = {
  name: string,
  path: string,
  download_url: string
}

function Doc({
  docs
}: {
  docs: Array<Doc>
}) {
  const location = useLocation();

  const [activeDoc, setActiveDoc] = useState<Doc>()
  const [markdown, setMarkdown] = useState('')

  // On component load: Load doc contents
  useEffect(() => {
    if(! docs || docs.length <= 0) return;

    const active = getActiveDoc(docs);

    setActiveDoc(active);
    loadDocContents(active);
  }, [location, docs]);

  const getActiveDoc = (docs) => {
    const currentPathName = location.pathname.replace('/docs/', '');

    return docs.find(x => {
      return x?.path === currentPathName;
    });
  }

  const loadDocContents = async (active) => {
    if(! active || ! active.download_url) return;

    const response = await fetch(active.download_url);
    const text = await response.text();

    setMarkdown(text);
  }
  
  const getFolderName = (path) => path?.split('/')[0];

  if(! activeDoc) return <>
    Aan het laden..
  </>

  return <>
    <h2 className="
      text-3xl
      font-bold
    ">
      <Link to={`/docs/${getFolderName(activeDoc?.path)}`}>{activeDoc ? getFolderName(activeDoc?.path)?.replaceAll('_', ' ') : ' '}</Link> &gt;&nbsp;
      {activeDoc ? activeDoc.name?.replaceAll('_', ' ') : ' '}
    </h2>

    <div dangerouslySetInnerHTML={{__html: marked(markdown)}} />

    <br /><hr /><br />

    <p>
    ⚪ <Link to={`/docs/${getFolderName(activeDoc?.path)}`}>
        Bekijk het <b>{activeDoc ? getFolderName(activeDoc?.path)?.replaceAll('_', ' ') : ' '}</b> overzicht
      </Link>
    </p>
  </>
}

export default Doc;
