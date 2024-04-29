import { useEffect, useState } from "react"
import { useDispatch, useSelector } from "react-redux"
import { StateType } from "@/src/types/StateType"

import { readable_phase } from "../../helpers/policy-hubs/common"
import { setSelectedPolicyHubs, setShowEditForm, setShowCommitForm, setShowList } from "../../actions/policy-hubs"

import { ImportZonesModal } from "../ImportZones/ImportZones"
import Modal from "../Modal/Modal"
import Button from "../Button/Button"

const ActionHeader = ({
    policyHubs
}, {
    policyHubs: any
}) => {
    const dispatch = useDispatch();

    const [doShowExportModal, setDoShowExportModal] = useState<Boolean>(false);
    const [doShowImportModal, setDoShowImportModal] = useState<Boolean>(false);

    const active_phase = useSelector((state: StateType) => state.policy_hubs ? state.policy_hubs.active_phase : '');
    const filterGebied = useSelector((state: StateType) => state.filter ? state.filter.gebied : null);
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

    return <>
        <div className="flex justify-between sticky left-0">
            <div className="flex justify-start">
                {canCommit() && <Button theme="white" onClick={commitHandler}>
                    Stel vast
                </Button>}
                {(selected_policy_hubs && selected_policy_hubs.length === 1) && <Button theme="white" onClick={editHandler}>
                    Bewerk
                </Button>}
                {active_phase === 'concept' && (selected_policy_hubs && selected_policy_hubs.length >= 1) && <Button theme="white" disabled={true}>
                    Verwijder
                </Button>}
            </div>
            <div className="flex justify-end">
               <Button theme="white"  onClick={() => {
                    setDoShowImportModal(true);
                }}>
                    Importeer
                </Button>
                <Button theme="white" onClick={() => {
                    setDoShowExportModal(true);
                }}>
                    Exporteer
                </Button>
            </div>
        </div>

        <Modal
            isVisible={doShowExportModal}
            title="Exporteer KML-bestand"
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
            Met onderstaande link kun je de ingetekende zones als KML-bestanden downloaden.
            </p>
            <p className="mb-4">
            Je krijgt een ZIP met daarin drie KML-bestanden: 1 voor de analyse-zones, 1 voor de parkeerzones en 1 voor de verbodszones.
            </p>
            <p className="mb-4">
            Je kunt de KML-bestanden gebruiken om te importeren in een ander GIS-programma, of om te delen met aanbieders.
            </p>
            <ul className="my-4">
            <li>
                &raquo; <a href={`${process.env.REACT_APP_MDS_URL}/kml/export${filterGebied ? '?municipality='+filterGebied : ''}`} className="font-bold theme-color-blue">
                Download zones als KML{filterGebied ? `, van gemeente ${filterGebied}` : ', van heel Nederland'}
                </a>
            </li>
            </ul>
        </Modal>

        {doShowImportModal && <ImportZonesModal postImportFunc={() => {
            setDoShowImportModal(false);
            // document.location = '/map/beleidshubs';
        }} />}
    </>;
}

export default ActionHeader;
