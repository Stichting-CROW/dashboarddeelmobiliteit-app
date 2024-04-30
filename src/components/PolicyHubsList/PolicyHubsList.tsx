import Button from "../Button/Button"

import { Hub, columns } from "./columns"
import { DataTable } from "./data-table"
import { useEffect, useState } from "react"
import { useDispatch, useSelector } from "react-redux"
import { StateType } from "@/src/types/StateType"
import { fetch_hubs } from "../../helpers/policy-hubs/fetch-hubs"
import { X } from "lucide-react"
import { readable_geotype, readable_phase } from "../../helpers/policy-hubs/common"
import moment from "moment"
import Modal from "../Modal/Modal"
import { ImportZonesModal } from "../ImportZones/ImportZones"
import { setSelectedPolicyHubs, setShowEditForm, setShowList } from "../../actions/policy-hubs"
import ActionHeader from './action-header';

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
            last_modified_by: hub.last_modified_by,
            modified_at: moment(hub.modified_at).format('YYYY-MM-DD HH:mm'),
            is_virtual: hub.stop?.is_virtual ? 'Virtueel' : 'Fysiek',
            // vervangt_zone: 0,

        }
    });
}

const PolicyHubsList = () => {
    const dispatch = useDispatch();
    
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

    // On load: Hide edit modal
    useEffect(() => {
        dispatch(setShowEditForm(false));
    }, [])
    
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

        // Only keep hubs in active phase
        const filteredHubs = (policyHubs) => {
            return policyHubs.filter((x) => x.phase === active_phase)
        }

        (() => {
            setTableData(populateTableData(filteredHubs(policyHubs)));
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
            <ActionHeader
                policyHubs={policyHubs}
                fetchHubs={fetchHubs    }
            />
            <div data-name="body" className="p-4" style={{}}>
                <DataTable columns={columns} data={tableData} />
            </div>
        </>
    );
}

export default PolicyHubsList;
