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

import {ZonesToImportConfigurator} from './ZonesToImportConfigurator';

const ImportZones = ({
  notificationText,
  draftZones,
  fileChangedHandler
}) => {

  return <>
    <p className="mb-4">
      Importeer een KML-bestand met zone-polygonen middels onderstaande upload-functie. Tip: importeer niet te veel zones, maar enkel de zones waar je analyses op gaat doen.
    </p>

    <form encType="multipart/form-data">
      <p className="mt-4">
        <input type="file" name="file" id="js-kml-file" accept=".kml" onChange={fileChangedHandler} />
      </p>
    </form>

    {notificationText && <div className="my-4 font-bold">
      {notificationText}
    </div>}

    {draftZones && Object.values(draftZones).length > 0 && <div className="my-4">
      <ZonesToImportConfigurator draftZones={draftZones} />
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
  const [draftZones, setDraftZones] = useState([]);

  const startProcessingFile = async () => {
    // Set loading=true
    setImportWasSuccesful(false);
    setNotificationText('Het bestand wordt verwerkt...');
    setIsProcessingFile(true);
    setDraftZones([]);

    // Get file
    const file = (document.getElementById('js-kml-file') as HTMLInputElement).files[0];

    // Create formData object
    const body = new FormData;
    body.append("file", file);

    // Create function that's called if there's an error
    const postError = () => {
      // Set loading=false
      setNotificationText('Er was een fout bij het uploaden van het bestand. Controleer of het een geldig KML-bestand is.');
      setIsProcessingFile(false);
      setDraftZones([]);
    }

    let responseJson; 
    try {
      responseJson = await preprocessKmlFile({
        token,
        gm_code,
        body
      });

      if(responseJson && responseJson.detail) {
        postError();
        return;
      }

      setNotificationText('Het bestand is succesvol verwerkt. Selecteer hieronder de zones die je wilt importeren en klik dan op de knop: Importeer zones.');
      setIsProcessingFile(false);
      setDraftZones(responseJson);
    } catch(e) {
      postError();
    }
  }

  const startImportingFile = async () => {

    const checkboxes = (document.querySelectorAll('input[type=checkbox]') as NodeListOf<Element>);
    let zoneGeographyIdsToKeep = [];
    checkboxes.forEach(x => {
      // Get input name
      const name = x['name'];
      // Check if this is a checkbox we want to check
      if(name.indexOf('import_zone_') <= -1) return;
      // Check if checkbox is checked
      if(x['checked']) {
        // Get geographyId from name
        const geographyId = name.replace('import_zone_', '');
        // Add this geographyId to the zoneGeographyIdsToKeep var
        zoneGeographyIdsToKeep.push(geographyId)
      }
    });

    // Set loading=true
    setImportWasSuccesful(false);
    setNotificationText('De zones worden geimporteerd...');
    setIsProcessingFile(true);

    // Process draftZones, but only keep the ones that are checked by user
    const zonesToImport = draftZones.filter(x => {
      return zoneGeographyIdsToKeep.indexOf(x.zone.geography_id) > -1;
    });

    if(! zonesToImport || zonesToImport.length <= 0) {
      console.error('Error: No zones to import');
      setNotificationText('Er zijn geen zones geselecteerd om te importeren');
      setIsProcessingFile(false);
      return;
    }

    // Populate body for API call that imports the zones
    const body = zonesToImport.map(x => {
      return Object.assign({}, x.zone, {
        published: true
      });
    });

    const response = await importKmlFile({
      token,
      gm_code,
      body
    });

    // Check if there was an error
    if(response && response.detail) {
      console.error(response);
      setNotificationText('Er was een fout bij het importeren: ' + response.detail);
      setIsProcessingFile(false);
    }
    // If no error: show that import was done succesful
    else {
      setNotificationText('De zones zijn succesvol geimporteerd! Klik op "Sluiten" om de nieuwe zone(s) te bekijken in de filterbalk.');
      setImportWasSuccesful(true);
      setIsProcessingFile(false);
      setDraftZones([]);
    }

    return;
  }

  const getNotificationText = () => {
    if(notificationText && notificationText.length > 0) {
      return notificationText;
    } else {
      return '';
    }
  }

  const didPreprocess = draftZones && draftZones.length > 0;

  return (
    <Modal
      isVisible={isModalVisible}
      title="Importeer een KML-bestand"
      button1Title={'Annuleer'}
      button1Handler={(e) => {
        postImportFunc();
      }}
      button2Title={
        importWasSuccesful ? 
          'Sluiten' :
          didPreprocess ? 'Importeer zones' : 'Laad zones'
      }
      button2Handler={async (e) => {
        e.preventDefault();
        
        if(importWasSuccesful) {
          postImportFunc();
        }
        if(didPreprocess) {
          // Import zones
          await startImportingFile();
        } else {
          // Preprocess zones
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
        draftZones={draftZones}
        fileChangedHandler={() => {
          setImportWasSuccesful(false);
          setNotificationText('Je hebt een nieuw bestand geselecteerd. Klik op "Laad zones" om verder te gaan.');
          setIsProcessingFile(false);
          setDraftZones([]);
        }}
      />
    </Modal>
  )
}

export {
  ImportZones,
  ImportZonesModal
};
