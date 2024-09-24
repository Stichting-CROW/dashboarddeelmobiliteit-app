import React, {useEffect, useState} from "react";
import { useDispatch, useSelector } from "react-redux";
import { readable_geotype } from "../../helpers/policy-hubs/common"

import SearchBarResults from './SearchBarResults';
import SearchBarInput from './SearchBarInput';

import {StateType} from '../../types/StateType';

import {
  setSearchBarQuery,
} from '../../actions/search';

import { fetch_hubs } from '../../helpers/policy-hubs/fetch-hubs'

import './SearchBar.css';

function SearchBar() {
  const dispatch = useDispatch();
  const uniqueComponentId = Math.random()*9000000;

  // State vars
  const [policyHubs, setPolicyHubs] = useState([]);
  const [filteredPolicyHubs, setFilteredPolicyHubs] = useState([]);

  // Selectors
  const token = useSelector((state: StateType) => (state.authentication.user_data && state.authentication.user_data.token)||null)
  const searchBarQuery = useSelector((state: StateType) => state.search ? state.search.query : null);
  const active_phase = useSelector((state: StateType) => state.policy_hubs ? state.policy_hubs.active_phase : '');
  const filter = useSelector((state: StateType) => state.filter || null);
  const visible_layers = useSelector((state: StateType) => state.policy_hubs.visible_layers || []);
  const isFilterbarOpen = useSelector((state: StateType) => state.ui && state.ui.FILTERBAR || false);

  // On component load
  useEffect(() => {
    fetchHubs();
  }, [
    filter.gebied,
    active_phase,
    visible_layers
  ]);

  // If searchBarQuery changes: Reload hubs
  useEffect(() => {
    if(! searchBarQuery) return;

    setFilteredPolicyHubs(
      policyHubs.filter(x => x.name.toLowerCase().indexOf(searchBarQuery.toLowerCase()) > -1)
    );
  }, [
    searchBarQuery
  ]);

  // Fetch hubs
  const fetchHubs = async () => {
    // Add a small delay to prevent multiple fetches
    try {
      const res: any = await fetch_hubs({
        token: token,
        municipality: filter.gebied,
        phase: active_phase,
        visible_layers: visible_layers
      }, uniqueComponentId);
      setPolicyHubs(res);
    }
    catch(err) {
      console.error(err);
    }
  };

  const flyTo = (area, zone_id) => {
    if(! area) return;
    if(! zone_id) return;
  
    // Trigger setSelectedZone custom event (see FilterbarZones.tsx)
    const event = new CustomEvent('flyToHubTrigger', {
      detail: {
        area,
        zone_id
      }
    });
    window.dispatchEvent(event);
  }
  
  const results = filteredPolicyHubs.map((x) => {
    return {
      title: x.name,
      subTitle: readable_geotype(x.geography_type),
      onClick: () => {
        flyTo(x.area, x.zone_id);
        dispatch(setSearchBarQuery(''));
      }
    }
  });

  return (
    <div className={`
      SearchBar
      absolute
      right-0
      my-3
      z-0
      ${isFilterbarOpen ? 'filter-open' : ''}
    `}>
      <div className="mx-auto" style={{width: '300px'}}>
        <SearchBarInput
          value={searchBarQuery}
          filterChanged={(e: { target: { value: any; }; }) => {
            dispatch(setSearchBarQuery(e.target.value));
          }}
          afterHtml={
            <></>
          }
        />
        {searchBarQuery && searchBarQuery.length > 0 && <div
          className={`
            ParkingFacilityBrowser
            rounded-3xl
            bg-white
            py-0
            text-left
            shadow-lg
          `}
          style={{
            maxWidth: "100%",
            overflow: "auto",
          }}
        >
          <SearchBarResults results={results} />
        </div>}
      </div>
    </div>
  );
}

export default SearchBar;
