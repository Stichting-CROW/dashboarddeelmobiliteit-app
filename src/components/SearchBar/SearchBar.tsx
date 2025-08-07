import React, {useEffect, useState} from "react";
import { useDispatch, useSelector } from "react-redux";
import { readable_geotype } from "../../helpers/policy-hubs/common"
import center from '@turf/center'
import maplibregl from 'maplibre-gl';

import SearchBarResults from './SearchBarResults';
import SearchBarInput from './SearchBarInput';

import {StateType} from '../../types/StateType';

import {
  setSearchBarQuery,
} from '../../actions/search';

import { fetch_hubs } from '../../helpers/policy-hubs/fetch-hubs'

import './SearchBar.css';

interface FlyToOptions {
  zoom?: number;
  duration?: number;
}

interface SearchResult {
  type: 'zone' | 'address';
  text: string;
  location?: {
    lat: number;
    lng: number;
  };
}

function SearchBar({map}: {map: any}) {
  const dispatch = useDispatch();
  const uniqueComponentId = Math.random()*9000000;

  // State vars
  const [policyHubs, setPolicyHubs] = useState([]);
  const [filteredPolicyHubs, setFilteredPolicyHubs] = useState([]);
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [marker, setMarker] = useState<maplibregl.Marker | null>(null);

  // Selectors
  const token = useSelector((state: StateType) => (state.authentication.user_data && state.authentication.user_data.token)||null)
  const searchBarQuery = useSelector((state: StateType) => state.search ? state.search.query : null);
  const active_phase = useSelector((state: StateType) => state.policy_hubs ? state.policy_hubs.active_phase : '');
  const filter = useSelector((state: StateType) => state.filter || null);
  const visible_layers = useSelector((state: StateType) => state.policy_hubs.visible_layers || []);
  const isFilterbarOpen = useSelector((state: StateType) => state.ui && state.ui.FILTERBAR || false);

  // Add AbortController ref
  const abortControllerRef = React.useRef<AbortController | null>(null);

  // On component load
  useEffect(() => {
    fetchHubs();
  }, [
    filter.gebied,
    active_phase,
    visible_layers
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

  const getAddressDetails = async (id: string, signal: AbortSignal): Promise<{ lat: number; lng: number } | null> => {
    try {
      const response = await fetch(
        `https://api.pdok.nl/bzk/locatieserver/search/v3_1/lookup?id=${id}`,
        { signal }
      );
      const data = await response.json();
      
      if (data.response.docs[0]?.centroide_ll) {
        // Format is "POINT(4.89088646 52.37291157)"
        const coordinates = data.response.docs[0].centroide_ll
          .replace('POINT(', '')
          .replace(')', '')
          .split(' ');
        
        return {
          lat: parseFloat(coordinates[1]),
          lng: parseFloat(coordinates[0])
        };
      }
      return null;
    } catch (error) {
      console.error('Error fetching address details:', error);
      return null;
    }
  };

  const handleSearch = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const searchValue = e.target.value;
    dispatch(setSearchBarQuery(searchValue));

    // Only keep one of each policy hub (x.name should be unique)
    // TODO: Remove retired hubs out of the policyHubs list
    const uniquePolicyHubs = policyHubs.filter((x, index, self) =>
      index === self.findIndex((t) => t.name === x.name)
    );
    // Filter policy hubs regardless of search length
    setFilteredPolicyHubs(
      uniquePolicyHubs.filter(x => x.name.toLowerCase().includes(searchValue.toLowerCase()))
    );

    if (searchValue.length < 3) {
      setSearchResults([]);
      if (marker) {
        marker.remove();
      }
      return;
    }

    // Cancel any ongoing fetch
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    // Create new AbortController for this fetch
    abortControllerRef.current = new AbortController();
    const { signal } = abortControllerRef.current;

    setIsLoading(true);
    try {
      const mapCenter = map?.getCenter();
      const locationParams = mapCenter 
        ? `&lat=${mapCenter.lat}&lon=${mapCenter.lng}` 
        : '';

      const searchWegOrAdres = searchValue.match(/\d/) ? 'adres' : 'weg';

      const response = await fetch(
        `https://api.pdok.nl/bzk/locatieserver/search/v3_1/suggest?q=${encodeURIComponent(searchValue)}&fq=type:${searchWegOrAdres}${locationParams}`,
        { signal }
      );
      const data = await response.json();

      const addressResults: SearchResult[] = await Promise.all(
        data.response.docs.map(async (result: any) => {
          const location = await getAddressDetails(result.id, signal);
          return {
            type: 'address',
            text: result.weergavenaam,
            location: location || undefined
          };
        })
      );

      setSearchResults(addressResults.filter(result => result.location));
    } catch (error) {
      // Only log error if it's not an abort error
      if (error.name !== 'AbortError') {
        console.error('Error fetching addresses:', error);
      }
    } finally {
      setIsLoading(false);
    }
  };
  
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

  const onAddressSelect = (location: { lat: number; lng: number }, options: FlyToOptions) => {
    if (marker) {
      marker.remove();
    }

    const newMarker = new maplibregl.Marker()
      .setLngLat([location.lng, location.lat])
      .addTo(map);
    
    // Add popup to marker
    const popup = new maplibregl.Popup({ offset: 25 })
      .setHTML(`<div>${searchResults.find(r => 
        r.location?.lat === location.lat && 
        r.location?.lng === location.lng
      )?.text || 'Locatie'}</div>`);

    newMarker.setPopup(popup);
    
    setMarker(newMarker);

    map.flyTo({
      center: [location.lng, location.lat],
      zoom: options.zoom,
      duration: options.duration
    });
  }

  const handleFocus = () => {
    setIsFocused(true);
    setIsExpanded(true);
  };

  const handleBlur = () => {
    // Small delay to allow clicking on results
    setTimeout(() => {
      setIsFocused(false);
      if (!searchBarQuery) {
        setIsExpanded(false);
      }
    }, 200);
  };

  const toggleSearch = () => {
    setIsExpanded(!isExpanded);
    if (!isExpanded) {
      // Focus the input when expanding
      const input = document.querySelector('.SearchBar input') as HTMLInputElement;
      if (input) {
        input.focus();
      }
    }
  };

  return (
    <div className={`
      SearchBar
      relative
    `}>
      <div style={{width: '300px'}}>
        {isExpanded ? (
          <SearchBarInput
            value={searchBarQuery}
            filterChanged={handleSearch}
            autoFocus={isExpanded}
            onFocus={handleFocus}
            onBlur={handleBlur}
            afterHtml={
              <></>
            }
          />
        ) : (
          <div className="flex justify-end">
            <button
              onClick={toggleSearch}
              className="
                h-12
                w-12
                rounded-full
                bg-white
                shadow-md
                flex
                items-center
                justify-center
                hover:bg-gray-50
                transition-colors
              "
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-6 w-6 text-gray-500"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                />
              </svg>
            </button>
          </div>
        )}
        {searchBarQuery && searchBarQuery.length > 0 && isFocused && <div
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

          {searchResults.length > 0 && (
            <div className="w-full mt-2 bg-white rounded-lg shadow-lg z-20">
              {searchResults.map((result, index) => (
                <div
                  key={index}
                  className="px-4 py-2 hover:bg-gray-100 cursor-pointer"
                  onClick={() => {
                    if (result.type === 'address' && result.location && onAddressSelect) {
                      onAddressSelect(result.location, {
                        zoom: 17,
                        duration: 1000
                      });
                    }
                  }}
                >
                  <div className="flex items-center">
                    <span className="mr-2">
                      {result.type === 'address' ? '📍' : '🅿️'}
                    </span>
                    {result.text}
                  </div>
                </div>
              ))}
            </div>
          )}
          {isLoading && (
            <div className="w-full mt-2 bg-white rounded-lg shadow-lg z-20 p-4 text-center">
              Zoeken...
            </div>
          )}
        </div>}
      </div>
    </div>
  );
}

export default SearchBar;
