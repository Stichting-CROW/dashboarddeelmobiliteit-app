import React, { useState, useEffect } from 'react';
import moment from 'moment';

type Feed = {
  feed_id: number;
  feed_type: "gbfs" | "mds";
  last_time_succesfully_imported: Date;
  system_id: string;
  up: boolean;
}

const Feed = ({data}) => {
  return <div className="mb-4 pb-4 sm:pb-0 border-b border-solid border-black sm:border-none sm:mb-0 sm:flex w-full justify-between">
    <div className="sm:w-48">
      <span className="sm:hidden inline-block w-48 font-bold">Aanbieder:</span> 
      {data.system_id}
    </div>
    <div className="sm:w-16">
      <span className="sm:hidden inline-block w-48 font-bold">Open standaard:</span> 
      {data.feed_type}
    </div>
    {data.up ? <div className="sm:w-12 font-bold" style={{color: 'darkgreen'}}>
      <span className="sm:hidden inline-block w-48 font-bold">Status:</span> 
      up
    </div> :
    <div className="sm:w-12 font-bold" style={{color: 'red'}}>
      <span className="sm:hidden inline-block w-48 font-bold">Status:</span> 
      down
    </div>}
    {data.last_time_succesfully_imported ? <div className="sm:w-40">
      <span className="sm:hidden inline-block w-48 font-bold">Laatst geimporteerd:</span> 
      {moment(data.last_time_succesfully_imported).format('YYYY-MM-DD HH:mm')}
    </div> : <div className="sm:w-40" />}
  </div>
}

const ActiveFeeds = () => {
  const [datafeeds, setDatafeeds] = useState([]);

  useEffect(() => {
    // Variable to keep track of interval variable
    let TO_refresh_datafeeds;

    // Load datafeeds once every minute
    load_datafeeds();
    TO_refresh_datafeeds = setInterval(load_datafeeds, 1000*60);

    return () => {
      // Clear interval on component unload
      clearInterval(TO_refresh_datafeeds);
    }
  }, []);

  const load_datafeeds = async () => {
    const result = await fetch_datafeeds();
    const sorted = sort_datafeeds(result);
    setDatafeeds(sorted);
  }

  const fetch_datafeeds = async () => {
    const response = await fetch('https://api.dashboarddeelmobiliteit.nl/dashboard-api/public/active_feeds');
    if(! response) throw Error('Active feeds could not be fetched from API');

    const json = await response.json();
    return json;
  }

  const sort_datafeeds = (feeds) => {
    return feeds.sort((a, b) => a.up === false ? 1 : -1);
  }

  return (
    <div className="ActiveFeeds">
      <h1 className="
        text-4xl
        font-bold
      ">
        Actieve datafeeds
      </h1>
      <div className="my-5">
        {datafeeds.map((x) => <Feed key={x.feed_id} data={x} />)}
      </div>

    </div>
  )
}

export default ActiveFeeds;
