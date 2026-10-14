import React from 'react';
import SearchBarResult from '../SearchBar/SearchBarResult';

function SearchBarResults({
  results
}: {
  results: any[]
}) {
  if(! results) {
    return <></>;
  }

  return (
    <div>
      {results.map((x: any) => {
        return <SearchBarResult
          key={x.key ?? x.title}
          title={x.title}
          subTitle={x.subTitle}
          tag={x.tag}
          onClick={x.onClick}
        />
      })}
    </div>
  );
}

export default SearchBarResults;
