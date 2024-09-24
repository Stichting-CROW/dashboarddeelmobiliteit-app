import React, {useEffect, useState} from 'react';
import { useDispatch, useSelector } from 'react-redux';
import SearchBarResult from '../SearchBar/SearchBarResult';
import {StateType} from '../../types/StateType';
import { fetch_hubs } from "../../helpers/policy-hubs/fetch-hubs"

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
          key={x.title}
          title={x.title}
          subTitle={x.subTitle}
          onClick={x.onClick}
        />
      })}
    </div>
  );
}

export default SearchBarResults;
