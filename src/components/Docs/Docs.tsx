import { Link, useLocation } from "react-router-dom";
import Section from '../Section/Section';
import {marked} from 'marked'
import { useEffect, useState } from "react";
import FoldersList from "./FoldersList";
import DocsList from "./DocsList";
import Doc from "./Doc";
import {RepoFile, useGitHubFolderTree} from 'github-folder-tree';

function Docs() {
  const docsPath = 'src/components/Docs/contents/';
  const [folderUrl, setFolderUrl] = useState('https://github.com/Stichting-CROW/dashboarddeelmobiliteit-app/tree/main/'+docsPath)
  const { repoFiles, error, log, fetchRepositoryContents, useGitHubFolderDownload, repoInfo } = useGitHubFolderTree(folderUrl, process ? process.env.REACT_APP_DOCS_GITHUB_API_KEY : '');

  const location = useLocation();

  const [view, setView] = useState('folders');
  const [docs, setDocs] = useState([])

  type Doc = {
    name: string,
    path: string,
    download_url: string
  }

  // On load: Load GitHub folder
  useEffect(() => {
    fetchRepositoryContents();
  }, [folderUrl]);

  // If repo folders/files are found: Set in state
  useEffect(() => {
    if(! repoFiles) return;

    const docs: Array<Doc> = getDocs(repoFiles);
    setDocs(docs);
  }, [repoFiles]);

  // If path changes: Change view
  useEffect(() => {
    const slashes_count = location.pathname.match(/\//g).length;

    if(slashes_count === 1) {// I.e. /docs
      setView('categories');
    }
    else if(slashes_count === 2) {// I.e. /docs/Beleidshubs
      setView('docs');
    }
    else if(slashes_count === 3) {// I.e. /docs/Beleidshubs/Introductie.md
      setView('doc');
    }
  }, [location])

  // Function that creates array with all files
  const getDocs = (files: Array<any>) => {
    let uniqueFilePaths = [];
    // Don't keep duplicate files
    return repoFiles?.filter((item, index) => {
      const isUnique = uniqueFilePaths.indexOf(item.name) <= -1
      uniqueFilePaths.push(item.name);
      return isUnique;
    })
    // Only keep markdown files
    .filter(x => {
      return x.file_type === 'md';
    })
    // Now return the file object
    .map(x => {
      return {
        name: x.name.replace('.md', ''),
        path: x.path.replace(docsPath, ''),
        download_url: x.download_url
      }
    });
  }

  // console.log(repoFiles, docs, view);
  // console.log('error', error)

  return (
    <div className="
      Docs
    ">
      <h1 className="
        text-4xl
        font-bold
      ">
        {view === 'categories' && <>Documentatie</>}
        {view !== 'categories' && <Link to={`/docs`}>Documentatie</Link>}
      </h1>

      <div className="my-5">
        {error && <p className="my-4">
          Dit is een experimentele versie van de Dashboard Deelmobiliteit docs. De content kan nu niet geladen worden. Probeer het later (bijvoorbeeld over een uur) opnieuw.
        </p>}
        {view === 'categories' && <FoldersList docs={docs} />}
        {view === 'docs' && <DocsList docs={docs} />}
        {view === 'doc' && <Doc docs={docs} />}
      </div>
    </div>
  )
}

export default Docs;
