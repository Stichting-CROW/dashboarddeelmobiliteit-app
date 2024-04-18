import Button from "../Button/Button"

import { Hub, columns } from "./columns"
import { DataTable } from "../ui/data-table"
import { useEffect, useState } from "react"
import { useSelector } from "react-redux"
import { StateType } from "@/src/types/StateType"
import { fetch_hubs } from "../../helpers/policy-hubs/fetch-hubs"
import { X } from "lucide-react"
import { readable_geotype } from "../../helpers/policy-hubs/common"
import moment from "moment"
import Modal from "../Modal/Modal"
import { ImportZonesModal } from "../ImportZones/ImportZones"

const readable_phase = (name: string) => {
    if(name === 'concept') return 'Concept';
    else if(name === 'active') return 'Actief';
    else if(name === 'retirement_concept') return 'Concept';
    else if(name === 'committed_concept') return 'Voorgesteld concept';
    else if(name === 'retirement_committed_concept') return 'Voorgesteld concept';
    else if(name === 'published') return 'Definitief gepland';
    else if(name === 'active') return 'Definitief Actief';
    return name;
}

// async function getData(): Promise<Payment[]> {
function populateTableData(policyHubs) {
    if(! policyHubs || policyHubs.detail) return [];// .detail means there was an errors

    return policyHubs.map((hub) => {
        return {
            fase: readable_phase(hub.phase),
            id: hub.zone_id,
            internal_id: hub.internal_id,
            name: hub.name,
            type: readable_geotype(hub.geography_type),
            created_by: hub.created_by,
            created_at: moment(hub.created_at).format('YYYY-MM-DD HH:mm'),
            modified_by: hub.modified_by,
            modified_at: moment(hub.modified_at).format('YYYY-MM-DD HH:mm'),
            is_virtual: hub.stop?.is_virtual ? 'Virtueel' : 'Fysiek',
            // vervangt_zone: 0,

        }
    });
}

const ActionHeader = () => {
    const [doShowExportModal, setDoShowExportModal] = useState<Boolean>(false);
    const [doShowImportModal, setDoShowImportModal] = useState<Boolean>(false);

    const filterGebied = useSelector((state: StateType) => {
      return state.filter ? state.filter.gebied : null
    });

    return <>
        <div className="flex justify-between">
            <div className="flex justify-start">
                <Button theme="white" disabled={true}>
                    Stel vast
                </Button>
                <Button theme="white" disabled={true}>
                    Bewerk
                </Button>
                <Button theme="white" disabled={true}>
                    Verwijder
                </Button>
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

const PolicyHubsList = () => {
    const [policyHubs, setPolicyHubs] = useState([]);
    const [tableData, setTableData] = useState([]);
    const [doShowExportModal, setDoShowExportModal] = useState(false);

    const filter = useSelector((state: StateType) => state.filter || null);
  
    const token = useSelector((state: StateType) => {
      if(state.authentication && state.authentication.user_data) {
        return state.authentication.user_data.token;
      }
      return null;
    });
  
    const active_phase = useSelector((state: StateType) => state.policy_hubs ? state.policy_hubs.active_phase : '');
    const visible_layers = useSelector((state: StateType) => state.policy_hubs.visible_layers || []);


    // Fetch hubs
    useEffect(() => {
        if(! filter.gebied) return;
        if(! visible_layers || visible_layers.length === 0) return;
  
        // Fetch hubs
        fetchHubs();
    }, [
      filter.gebied,
      visible_layers,
      visible_layers.length
    ]);

    // Populate table data if policyHubs change
    useEffect(() => {
        if(! policyHubs) return;

        (() => {
            setTableData(populateTableData(policyHubs));
        })();
    }, [
        policyHubs
    ]);

    // Fetch hubs
    const fetchHubs = async () => {
        const res = await fetch_hubs({
            token: token,
            municipality: filter.gebied,
            visible_layers: visible_layers
        });
        setPolicyHubs(res);
    };

    return (
        <>
            <div>
                <ActionHeader />
                <div data-name="body" className="p-4" style={{}}>
                    <DataTable columns={columns} data={tableData} />
                </div>
            </div>
        </>
    );
}

export default PolicyHubsList;
