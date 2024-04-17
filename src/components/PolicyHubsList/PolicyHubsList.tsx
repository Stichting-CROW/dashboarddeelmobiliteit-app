import Button from "../Button/Button"

import { Hub, columns } from "./columns"
import { DataTable } from "../ui/data-table"
import { useEffect, useState } from "react"
import { useSelector } from "react-redux"
import { StateType } from "@/src/types/StateType"
import { fetch_hubs } from "../../helpers/policy-hubs/fetch-hubs"
import { X } from "lucide-react"

const readable_phase = (name: string) => {
    if(name === 'concept') return 'Concept';
    else if(name === 'active') return 'Actief';
}

const readable_geotype = (name: string) => {
    if(name === 'stop') return 'Hub';
    if(name === 'no_parking') return 'Verbodsgebied';
    if(name === 'monitoring') return 'Analysegebied';
    return '';
}

// async function getData(): Promise<Payment[]> {
function populateTableData(policyHubs) {
    if(! policyHubs || policyHubs.detail) return [];// .detail means there was an errors

    return policyHubs.map((hub) => {
        return {
            id: hub.zone_id,
            name: hub.name,
            type: readable_geotype(hub.geography_type),
            fase: readable_phase(hub.phase),
            // interne_id: 0,
            // vervangt_zone: 0,

        }
    });
}

const ActionHeader = () => {
    return (
        <div className="flex justify-between">
            <div className="flex justify-start">
                <Button theme="white">
                    Stel vast
                </Button>
                <Button theme="white">
                    Bewerk
                </Button>
                <Button theme="white">
                    Verwijder
                </Button>
            </div>
            <div className="flex justify-end">
               <Button theme="white">
                    Filter
                </Button>
                <Button theme="white">
                    Download
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
            <div data-name="body" className="p-4">
                <DataTable columns={columns} data={tableData} />
            </div>
        </div>
    );
}

export default PolicyHubsList;
