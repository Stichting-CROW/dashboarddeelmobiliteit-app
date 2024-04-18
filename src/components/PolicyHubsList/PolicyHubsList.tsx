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
            // interne_id: 0,
            // vervangt_zone: 0,

        }
    });
}

const ActionHeader = () => {
    return (
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
               <Button theme="white">
                    Importeer
                </Button>
                <Button theme="white">
                    Exporteer
                </Button>
            </div>
        </div>
    );
}

const PolicyHubsList = () => {
    const [policyHubs, setPolicyHubs] = useState([]);
    const [tableData, setTableData] = useState([]);

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
        <div>
            <ActionHeader />
            <div data-name="body" className="p-4" style={{}}>
                <DataTable columns={columns} data={tableData} />
            </div>
        </div>
    );
}

export default PolicyHubsList;
