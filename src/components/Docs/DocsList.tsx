import { Link } from "react-router-dom";
import Section from '../Section/Section';
import {marked} from 'marked'
import { useEffect, useState } from "react";
import {RepoFile, useGitHubFolderTree} from 'github-folder-tree';

type Doc = {
  name: string,
  path: string,
  download_url: string
}

function DocsList() {
  const [folderUrl, setFolderUrl] = useState('https://github.com/Stichting-CROW/dashboarddeelmobiliteit-app/tree/main/src/components/Docs')
  const [docs, setDocs] = useState([])
  const { repoFiles, error, log, fetchRepositoryContents, useGitHubFolderDownload, repoInfo } = useGitHubFolderTree(folderUrl, null);

  useEffect(() => {
    fetchRepositoryContents();
  }, [folderUrl]);

  useEffect(() => {
    const result: Array<Doc> = getDocs(repoFiles);
    setDocs(result);
  }, [repoFiles]);

  const getDocs = (files: Array<any>) => {
    return repoFiles.filter(x => {
      return x.file_type === 'md';
    }).map(x => {
      return {
        name: x.name.replace('.md', ''),
        path: x.path,
        download_url: x.download_url
      }
    });
  }

  // Get category name from query params
  // Load files of category folder
  // Link every file to /category/filename (dashed)
  // If file name is given: append .md & Load file contents & show markdown of the file

  console.log('repoFiles', repoFiles)

  return <>
    {repoFiles.map((x: RepoFile) => (
      <h3 className="
        mt-4 mb-4
        text-xl font-bold
      " title={x.name} key={x.path}>
        <Link to={`/Beleidszones/${x.name}`}>
          {x.name}
        </Link>
      </h3>
    ))}
  </>
}

export default DocsList;
