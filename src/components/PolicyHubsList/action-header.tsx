import { useToast } from "../ui/use-toast"
import { useEffect, useState } from "react"
import { useDispatch, useSelector } from "react-redux"
import { StateType } from "../../types/StateType"
import { notify } from '../../helpers/notify';

import { deleteHubs } from '../../helpers/policy-hubs/delete-hubs';
import { getGeoIdForZoneIds, readable_phase } from "../../helpers/policy-hubs/common"
import { setSelectedPolicyHubs, setShowEditForm, setShowCommitForm, setShowList, setHubRefetchCounter } from "../../actions/policy-hubs"
import { canEditHubs } from "../../helpers/authentication"

import { ImportZonesModal } from "../ImportZones/ImportZones"
import Modal from "../Modal/Modal"
import Button from "../Button/Button"
import { export_kml, export_geopackage } from "../../helpers/policy-hubs/export-kml";
import moment from "moment";

const ActionHeader = ({
    policyHubs,
    fetchHubs
}, {
    policyHubs: any,
    fetchHubs: Function
}) => {
    const dispatch = useDispatch();
    const { toast } = useToast()

    const [doShowExportModal, setDoShowExportModal] = useState<Boolean>(false);
    const [doShowImportModal, setDoShowImportModal] = useState<Boolean>(false);

    const token = useSelector((state: StateType) => (state.authentication.user_data && state.authentication.user_data.token)||null)
    const acl = useSelector((state: StateType) => state.authentication?.user_data?.acl);
    const active_phase = useSelector((state: StateType) => state.policy_hubs ? state.policy_hubs.active_phase : '');
    const hub_refetch_counter = useSelector((state: StateType) => state.policy_hubs ? state.policy_hubs.hub_refetch_counter : 0);
    const selected_policy_hubs = useSelector((state: StateType) => state.policy_hubs ? state.policy_hubs.selected_policy_hubs : []);

    const editHandler = () => {
        if(! selected_policy_hubs || selected_policy_hubs.length === 0) {
            // Nothing to edit
            return;
        }
        dispatch(setSelectedPolicyHubs(selected_policy_hubs));
        dispatch(setShowList(false));
        dispatch(setShowEditForm(true));
    }

    const commitHandler = () => {
        if(! selected_policy_hubs || selected_policy_hubs.length === 0) {
            // Nothing to commit
            return;
        }
        dispatch(setSelectedPolicyHubs(selected_policy_hubs));
        dispatch(setShowList(false));
        dispatch(setShowEditForm(false));
        dispatch(setShowCommitForm(true));
    }

    const deleteHandler = async () => {
        if(! window.confirm('Weet je zeker dat je deze hub(s) wilt verwijderen?')) {
            alert('Verwijderen geannuleerd');
            return;
        }

        try {
            const selectedGeoIds = getGeoIdForZoneIds(policyHubs, selected_policy_hubs);
            const response = await deleteHubs(token, selectedGeoIds);
            console.log('Delete reponse', response);
    
            if(response && response.detail) {
                // Give error if something went wrong
                notify(toast, 'Er ging iets fout bij het verwijderen', {
                    title: 'Er ging iets fout',
                    variant: 'destructive'
                });
            }
            else {
                notify(toast, 'Zone(s) verwijderd');
                dispatch(setSelectedPolicyHubs([]))
                dispatch(setHubRefetchCounter(hub_refetch_counter+1))
                fetchHubs();
            }
        } catch(err) {
            console.error('Delete error', err);
        }
    }

    // Function: canCommit
    // User can only commit if in concept phase & no monitoring hubs are selected
    const canCommit = () => {
        // There should be a policy hubs list
        if(! policyHubs || policyHubs.length === 0) {
            return;
        }
        // At least one hub should be selected
        if(! selected_policy_hubs || selected_policy_hubs.length <= 0) {
            return false;
        }
        // Phase should be 'concept'
        if(active_phase !== 'concept') {
            return false;
        }
        // None of the selected hubs should be 'monitoring' hubs
        let isHubOrNoParkingHub = true;
        const allowedGeoTypes = ['stop', 'no_parking']
        policyHubs
            .filter(x => selected_policy_hubs.indexOf(x.zone_id) > -1)
            .forEach(x => {
                if(allowedGeoTypes.indexOf(x.geography_type) <= -1) {
                    isHubOrNoParkingHub = false;
                }
            });
        return isHubOrNoParkingHub;
    }

    const exportKml = async () => {
      if(! selected_policy_hubs || selected_policy_hubs.length === 0) {
          notify(toast, 'Geen zones geselecteerd')
          return;
      }
      const geography_ids = getGeoIdForZoneIds(policyHubs, selected_policy_hubs);
      const blob = await export_kml(token, geography_ids);

      if(! blob) return;
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${moment().format('YYYY-MM-DD_HH-mm')}_exported-kml.zip`;
      document.body.appendChild(a); // append the element to the dom, otherwise it will not work in firefox
      a.click();    
      a.remove();//afterwards remove the element again
  }

  const exportGeoPackage = async () => {
    if(! selected_policy_hubs || selected_policy_hubs.length === 0) {
        notify(toast, 'Geen zones geselecteerd')
        return;
    }
    const geography_ids = getGeoIdForZoneIds(policyHubs, selected_policy_hubs);
    const blob = await export_geopackage(token, geography_ids);

    if(! blob) return;
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${moment().format('YYYY-MM-DD_HH-mm')}_exported-geopackage.zip`;
    document.body.appendChild(a); // append the element to the dom, otherwise it will not work in firefox
    a.click();    
    a.remove();//afterwards remove the element again
  }

    // Function that checks if all hubs have same geotype
    const haveSameGeoType = (hubs) => {
      // If no hubs are found: Return false
      if(! hubs || hubs.length === 0) return false;
      // If only 1 hub was given: Always return true
      if(hubs && hubs.length === 1) return true;

      let found_geotype, are_the_same = true;
      hubs.forEach((hubId) => {
        // Stop if we already know that hubs don't have same geotype
        if(! are_the_same) return;
        // Find hub data
        const hubData = policyHubs.find(x => x.zone_id === hubId);
        if(! hubData) return;
        // Compare geotype to last geotype
        if(found_geotype && hubData.geography_type !== found_geotype) {
          are_the_same = false;
        }
        // Keep track of last geography_type
        found_geotype = hubData.geography_type;
      });

      return are_the_same;
    }

    return <>
        <div className="flex justify-between" style={{minHeight: '55px'}}>
            {canEditHubs(acl) && <div className="flex justify-start">
                {<Button theme="white" onClick={commitHandler} disabled={! canCommit()}>
                    Stel vast
                </Button>}
                {<Button theme="white" onClick={editHandler} disabled={! haveSameGeoType(selected_policy_hubs)}>
                    Bewerk
                </Button>}
                {active_phase === 'concept' && (selected_policy_hubs && selected_policy_hubs.length >= 1) && <Button theme="white" onClick={deleteHandler}>
                    Verwijder
                </Button>}
            </div>}
            <div className="flex justify-end">
                {selected_policy_hubs && selected_policy_hubs.length > 0 && <Button theme="white" onClick={() => {
                    setDoShowExportModal(true);
                }}>
                    Exporteer
                </Button>}
                {canEditHubs(acl) && <>
                  {active_phase === 'concept' && <Button theme="white"  onClick={() => {
                      setDoShowImportModal(true);
                  }}>
                      Importeer
                  </Button>}
                  {active_phase !== 'concept' && <div style={{height: '55px'}} className="flex flex-col justify-center text-xs mr-4">
                      Importeren kan in de conceptfase
                  </div>}
                </>}
            </div>
        </div>

        <Modal
            isVisible={doShowExportModal}
            title="Exporteer zones"
            button1Title={false}
            button1Handler={(e) => {
                setDoShowExportModal(false);
            }}
            button2Title={"Sluiten"}
            button2Handler={(e) => {
            e.preventDefault();
                // Hide modal
                setDoShowExportModal(false);
            }}
            hideModalHandler={() => {
                setDoShowExportModal(false);
            }}
        >
            <p className="mb-4">
                Met onderstaande link kun je de geselecteerde zones als GeoPackage- of KML-bestand downloaden.
            </p>
            <p className="mb-4">
                De zones zijn onderverdeeld in: analyse-zones, parkeerzones en verbodszones.
            </p>
            <p className="mb-4">
                Je kunt de bestanden gebruiken om te importeren in een ander GIS-programma, of om te delen met aanbieders. Wij raden het GeoPackage-formaat aan boven het gebruik van KML.
            </p>
            <ul className="my-4">
              <li>
                  &raquo; <a onClick={exportGeoPackage} className="cursor-pointer font-bold theme-color-blue">
                    <u>Download de geselecteerde zones als GeoPackage</u>
                  </a>
              </li>
              <li>
                  &raquo; <a onClick={exportKml} className="cursor-pointer theme-color-blue">
                    <u>Download de geselecteerde zones als KML</u>
                  </a>
              </li>
            </ul>
        </Modal>

        {doShowImportModal && <ImportZonesModal postImportFunc={() => {
            setDoShowImportModal(false);
            fetchHubs();
        }} />}
    </>;
}

export default ActionHeader;
