import React from 'react'
import ReactPlayer from 'react-player'
import { Link, useLocation } from "react-router-dom";
import { useEffect, useState } from "react";
import {marked} from 'marked'

import './Doc.css';
import { DocItem } from "./types";

const Video = ({url}: {url: string}) => {
  return <ReactPlayer
    width="100%"
    url={url}
    controls={true}
    config={{
      file: {
        attributes: {
          controls: true
        }
      }
    }}
  />
}

function Doc({
  docs
}: {
  docs: Array<DocItem>
}) {
  const location = useLocation();

  const [activeDoc, setActiveDoc] = useState<DocItem | undefined>()
  const [markdown, setMarkdown] = useState('')

  useEffect(() => {
    if(! docs || docs.length <= 0) return;

    const active = getActiveDoc(docs);

    setActiveDoc(active);
    setMarkdown(active?.content ?? '');
  }, [location, docs]);

  const getActiveDoc = (docs: Array<DocItem>) => {
    const currentPathName = location.pathname.replace('/docs/', '');

    return docs.find(x => x?.path === currentPathName);
  }

  const getFolderName = (path?: string) => path?.split('/')[0];

  const gitHubEditPage = `https://github.com/Stichting-CROW/dashboarddeelmobiliteit-app/edit/main/src/components/Docs/contents/${activeDoc?.path}`

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
    {markdown.match(/<div class="video-wrapper">(.*?)<\/div>/g)?.map((video, index) => {
      const url = video.match(/<div class="video-wrapper">(.*?)<\/div>/)?.[1];
      return url ? <Video url={url} /> : null;
    })}

    <br /><hr /><br />

    <div className="flex justify-between">
      <p>
      ⚪ <Link to={`/docs/${getFolderName(activeDoc?.path)}`}>
          Bekijk het <b>{activeDoc ? getFolderName(activeDoc?.path)?.replaceAll('_', ' ') : ' '}</b> overzicht
        </Link>
      </p>
      <p>
        <a href={gitHubEditPage} target="_blank" rel="external">
          Bewerk
        </a>
      </p>
    </div>
  </>
}

export default Doc;
