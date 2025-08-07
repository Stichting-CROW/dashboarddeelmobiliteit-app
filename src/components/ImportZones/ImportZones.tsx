import Modal from '../Modal/Modal.jsx';
import React, {
  useEffect,
  useState,
  useCallback
} from 'react';
import {
  useSelector
} from 'react-redux';
import {StateType} from '../../types/StateType';

import {preprocessKmlFile, importKmlFile} from '../../helpers/import-kml.js';
import {preprocessGeoPackageFile, importGeoPackageFile} from '../../helpers/import-geopackage.js';

import {ZonesToImportConfigurator} from './ZonesToImportConfigurator';

const ImportZones = ({
  notificationText,
  importResult,
  fileChangedHandler
}) => {

  return <>
    <p className="mb-4">
      Importeer een GeoPackage-bestand met zone-polygonen middels onderstaande upload-functie.
    </p>

    <p className="mb-4">
      De zones zullen worden toegevoegd aan de conceptfase. Als je een zone importeert met een geography_id dat gelijk is aan het geography_id van een bestaande conceptzone, dan zal deze zone worden geupdate en niet opnieuw worden aangemaakt.
    </p>

    <p className="mb-4">
      Lees meer over het importeren van zones in de <a href="https://dashboarddeelmobiliteit.nl/docs/Beleidszones/Zones_importeren.md" target="_blank" rel="noopener noreferrer" className="font-bold underline">Beleidszones documentatie</a>. Je vindt er ook een GeoPackage-template dat dient als voorbeeld.
    </p>

    {! importResult || Object.keys(importResult).length <= 0 && <form encType="multipart/form-data">
      <p className="mt-4">
        <input type="file" name="file" id="js-kml-file" accept=".gpkg" onChange={fileChangedHandler} />
      </p>
    </form>}

    {notificationText && <div className="my-4 font-bold">
      {notificationText}
    </div>}

    {importResult && Object.keys(importResult).length > 0 && <div>
      <p className="mt-6 mb-4">
        <b>
          De zones zijn ge&iuml;mporteerd
        </b>
      </p>
      <ul>
        {importResult.created?.length > 0 && <li>- {importResult.created.length} zone{importResult.created.length !== 1 ? 's' : ''} toegevoegd</li>}
        {importResult.modified?.length > 0 && <li>- {importResult.modified.length} zone{importResult.modified.length !== 1 ? 's' : ''} aangepast</li>}
        {importResult.error?.length > 0 && <li>- {importResult.error.length} zone{importResult.error.length !== 1 ? 's' : ''} met fouten</li>}
      </ul>
    </div>}

  </>
}

const ImportZonesModal = ({
  postImportFunc
}) => {

  // Get API token
  const token = useSelector((state: StateType) => (state.authentication.user_data && state.authentication.user_data.token)||null)

  // Get gebied / municipality code
  const gm_code = useSelector((state: StateType) => state.filter.gebied);

  // Define state variables
  const [isModalVisible, setIsModalVisible] = useState(true);
  const [isProcessingFile, setIsProcessingFile] = useState(false);
  const [importWasSuccesful, setImportWasSuccesful] = useState(false);
  const [notificationText, setNotificationText] = useState('');
  const [importResult, setImportResult] = useState([]);

  const startProcessingFile = async () => {
    // Set loading=true
    setImportWasSuccesful(false);
    setNotificationText('Het bestand wordt verwerkt...');
    setIsProcessingFile(true);
    setImportResult([]);

    // Get file
    const file = (document.getElementById('js-kml-file') as HTMLInputElement).files[0];

    // Create formData object
    const body = new FormData;
    body.append("file", file);

    // Create function that's called if there's an error
    const postError = () => {
      // Set loading=false
      setNotificationText('Er was een fout bij het uploaden van het bestand. Controleer of het een geldig GeoPackage-bestand is.');
      setIsProcessingFile(false);
      setImportResult([]);
    }

    let responseJson; 
    try {
      responseJson = await preprocessGeoPackageFile({
        token,
        gm_code,
        body
      });

      if(responseJson && responseJson.detail) {
        postError();
        return;
      }

      setNotificationText('');
      setIsProcessingFile(false);
      setImportResult(responseJson);
    } catch(e) {
      postError();
    }
  }

  const getNotificationText = () => {
    if(notificationText && notificationText.length > 0) {
      return notificationText;
    } else {
      return '';
    }
  }

  const didImport = importResult && Object.keys(importResult).length > 0;

  return (
    <Modal
      isVisible={isModalVisible}
      title="Importeer een GeoPackage-bestand"
      button1Title={'Annuleer'}
      button1Handler={(e) => {
        postImportFunc();
      }}
      button2Title={
        didImport ? 
          'Sluiten' :
          'Importeer zones'
      }
      button2Handler={async (e) => {
        e.preventDefault();
        
        if(didImport) {
          postImportFunc();
        }
        else {
          startProcessingFile();
        }
        return;
      }}
      button2Options={{
        isLoading: isProcessingFile
      }}
      hideModalHandler={() => {
        postImportFunc();
      }}
    >
      <ImportZones
        notificationText={getNotificationText()}
        importResult={importResult}
        fileChangedHandler={() => {
          setImportWasSuccesful(false);
          setNotificationText('Je hebt een nieuw bestand geselecteerd. Klik op "Importeer zones" om deze te importeren.');
          setIsProcessingFile(false);
          setImportResult([]);
        }}
      />
    </Modal>
  )
}

export {
  ImportZones,
  ImportZonesModal
};
