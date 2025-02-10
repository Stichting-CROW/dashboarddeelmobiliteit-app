import * as React from "react";
import { useState } from "react";

interface SearchResult {
  type: 'zone' | 'address';
  text: string;
  location?: {
    lat: number;
    lng: number;
  };
}

interface FlyToOptions {
  zoom?: number;
  duration?: number;
}

function SearchBarInput({
  value,
  filterChanged,
  afterHtml,
  onAddressSelect,
  mapCenter
}: {
  value?: string;
  filterChanged: Function;
  afterHtml?: any;
  onAddressSelect?: (location: { lat: number; lng: number }, options: FlyToOptions) => void;
  mapCenter?: { lat: number; lng: number };
}) {
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const getAddressDetails = async (id: string): Promise<{ lat: number; lng: number } | null> => {
    try {
      const response = await fetch(
        `https://api.pdok.nl/bzk/locatieserver/search/v3_1/lookup?id=${id}`
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
    filterChanged(e);

    if (searchValue.length < 3) {
      setSearchResults([]);
      return;
    }

    setIsLoading(true);
    try {
      // Include lat/lon parameters if mapCenter is provided
      const locationParams = mapCenter 
        ? `&lat=${mapCenter.lat}&lon=${mapCenter.lng}` 
        : '';

      const response = await fetch(
        `https://api.pdok.nl/bzk/locatieserver/search/v3_1/suggest?q=${encodeURIComponent(searchValue)}&fq=type:adres${locationParams}`
      );
      const data = await response.json();

      const addressResults: SearchResult[] = await Promise.all(
        data.response.docs.map(async (result: any) => {
          const location = await getAddressDetails(result.id);
          return {
            type: 'address',
            text: result.weergavenaam,
            location: location || undefined
          };
        })
      );

      setSearchResults(addressResults.filter(result => result.location));
    } catch (error) {
      console.error('Error fetching addresses:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="relative">
      <input
        type="search"
        name=""
        placeholder="Zoek een zone of adres"
        className="
          sticky top-0 z-10
          h-12
          w-full
          rounded-3xl
          px-4
          shadow-md
        "
        onChange={handleSearch}
        value={value}
      />
      {searchResults.length > 0 && (
        <div className="absolute w-full mt-2 bg-white rounded-lg shadow-lg z-20">
          {searchResults.map((result, index) => (
            <div
              key={index}
              className="px-4 py-2 hover:bg-gray-100 cursor-pointer"
              onClick={() => {
                if (result.type === 'address' && result.location && onAddressSelect) {
                  onAddressSelect(result.location, {
                    zoom: 17,
                    duration: 500
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
        <div className="absolute w-full mt-2 bg-white rounded-lg shadow-lg z-20 p-4 text-center">
          Zoeken...
        </div>
      )}
      {afterHtml ? afterHtml : ''}
    </div>
  );
}

export default SearchBarInput;
