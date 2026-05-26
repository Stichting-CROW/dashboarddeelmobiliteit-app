import { Link, useLocation } from "react-router-dom";
import { useEffect, useMemo, useState } from "react";
import FoldersList from "./FoldersList";
import DocsList from "./DocsList";
import Doc from "./Doc";
import { DocItem } from "./types";

// Read every markdown file under ./contents at build time.
// With the `asset/source` rule in craco.config.js the imported
// module is the raw file content as a string, so no runtime
// GitHub API calls (and no API token) are needed.
const loadBundledDocs = (): Array<DocItem> => {
  const ctx = (require as any).context(
    './contents',
    true,
    /\.md$/
  );

  return ctx.keys().map((key: string): DocItem => {
    const relativePath = key.replace(/^\.\//, '');
    const fileName = relativePath.split('/').pop() as string;
    const raw = ctx(key);
    const content: string = typeof raw === 'string' ? raw : raw?.default ?? '';

    return {
      name: fileName.replace(/\.md$/, ''),
      path: relativePath,
      content,
    };
  });
};

function Docs() {
  const docs = useMemo<Array<DocItem>>(() => loadBundledDocs(), []);

  const location = useLocation();
  const [view, setView] = useState<'categories' | 'docs' | 'doc'>('categories');

  useEffect(() => {
    const slashes_count = location.pathname.match(/\//g)?.length ?? 0;

    if (slashes_count === 1) {
      setView('categories');
    } else if (slashes_count === 2) {
      setView('docs');
    } else if (slashes_count === 3) {
      setView('doc');
    }
  }, [location]);

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
        {view === 'categories' && <FoldersList docs={docs} />}
        {view === 'docs' && <DocsList docs={docs} />}
        {view === 'doc' && <Doc docs={docs} />}
      </div>
    </div>
  )
}

export default Docs;
