import { useRef, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';

import Button from '../Button/Button';

import { parseRentalsCsv } from '../../helpers/rentalsCsvImport';
import { forceUpdateVerhuringenData } from '../../poll-api/pollVerhuringenData';

// 'Ruwe data import' for the Verhuringen view: load a CSV export of
// park_events (system_id, lat, lon, start_time, end_time, form_factor,
// propulsion_type) and show it on the map instead of the API data
export default function FilteritemRuweDataImport() {
  const dispatch = useDispatch();
  const fileInputRef = useRef(null);
  const [errorMessage, setErrorMessage] = useState(null);

  const csvData = useSelector((state) => {
    return state.rentals ? state.rentals.csv_data : null;
  });

  const onFileSelected = (event) => {
    const file = event.target.files && event.target.files[0];
    // Reset input, so selecting the same file again re-triggers onChange
    event.target.value = '';
    if (!file) return;

    setErrorMessage(null);

    const reader = new FileReader();
    reader.onload = () => {
      try {
        const { rows, skipped } = parseRentalsCsv(reader.result);
        dispatch({
          type: 'SET_RENTALS_CSV_DATA',
          payload: {
            fileName: file.name,
            rows: rows,
            skipped: skipped
          }
        });
        forceUpdateVerhuringenData();
      } catch (error) {
        setErrorMessage(error.message || 'Het CSV-bestand kon niet worden gelezen');
      }
    };
    reader.onerror = () => {
      setErrorMessage('Het bestand kon niet worden gelezen');
    };
    reader.readAsText(file);
  };

  const clearImport = () => {
    setErrorMessage(null);
    dispatch({ type: 'CLEAR_RENTALS_CSV_DATA' });
    // Re-fetch API data, so the map switches back to live data
    forceUpdateVerhuringenData();
  };

  return (
    <div className="mb-1">
      <input
        ref={fileInputRef}
        type="file"
        accept=".csv,text/csv"
        className="hidden"
        onChange={onFileSelected}
      />

      {! csvData && (
        <Button
          theme="white"
          classes="w-full"
          style={{marginLeft: 0, marginRight: 0}}
          onClick={() => fileInputRef.current && fileInputRef.current.click()}
        >
          CSV laden
        </Button>
      )}

      {csvData && (
        <div className="text-sm">
          <div className="font-bold break-all">
            {csvData.fileName}
          </div>
          <div>
            {csvData.rows.length} verhuringen geladen
            {csvData.skipped > 0 && `, ${csvData.skipped} rijen overgeslagen`}
          </div>
          <div className="mt-1">
            <small>
              De kaart toont nu geïmporteerde data. Datum- en afstandsfilters zijn hierop niet van toepassing.
            </small>
          </div>
          <Button
            theme="white"
            classes="w-full"
            style={{marginLeft: 0, marginRight: 0}}
            onClick={clearImport}
          >
            Import verwijderen
          </Button>
        </div>
      )}

      {errorMessage && (
        <div className="text-sm mt-1" style={{color: '#FD3E48'}}>
          {errorMessage}
        </div>
      )}
    </div>
  );
}
