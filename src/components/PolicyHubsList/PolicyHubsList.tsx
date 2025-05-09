import { Hub, columns } from "./columns"
import { DataTable } from "./data-table"
import { useEffect, useRef, useState } from "react"
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
// import { canEditHubs } from "../../helpers/authentication"
import React from "react";
import { isHubInPhase, deDuplicateHubs } from "../../helpers/policy-hubs/common";

function populateTableData(policyHubs) {
  if(! policyHubs || policyHubs.detail) {
    return [];// .detail means there was an errors
  }

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
      published_date: hub.published_date ? moment(hub.published_date).format('YYYY-MM-DD HH:mm') : '',
      effective_date: hub.effective_date ? moment(hub.effective_date).format('YYYY-MM-DD HH:mm') : '',
      retire_date: hub.retire_date ? moment(hub.retire_date).format('YYYY-MM-DD HH:mm') : '',
      published_retire_date: hub.published_retire_date ? moment(hub.published_retire_date).format('YYYY-MM-DD HH:mm') : '',
      propose_retirement: hub.propose_retirement,
      area: hub.area
      // vervangt_zone: 0,
    }
  });
}

const PolicyHubsList = () => {
  const TO_fetch = useRef(null);
  const dispatch = useDispatch();
  
  const [counter, setCounter] = useState<number>(0);
  const [policyHubs, setPolicyHubs] = useState([]);
  const [tableData, setTableData] = useState([]);

  const filter = useSelector((state: StateType) => state.filter || null);
  const acl = useSelector((state: StateType) => state.authentication?.user_data?.acl);

  const token = useSelector((state: StateType) => {
    if(state.authentication && state.authentication.user_data) {
      return state.authentication.user_data.token;
    }
    return null;
  });

  const active_phase = useSelector((state: StateType) => state.policy_hubs ? state.policy_hubs.active_phase : '');
  const visible_layers = useSelector((state: StateType) => state.policy_hubs.visible_layers || []);

  const uniqueComponentId = Math.random()*9000000;

  // On load: Hide edit modal
  useEffect(() => {
    dispatch(setShowEditForm(false));

    return () => {
      clearTimeout(TO_fetch.current);
    }
  }, []);

  // Fetch hubs
  useEffect(() => {
    if(TO_fetch.current) clearTimeout(TO_fetch.current);
    TO_fetch.current = setTimeout(() => {
      fetchHubs();
    }, 50)
  }, [
    token,
    active_phase,
    filter.gebied,
    visible_layers,
    visible_layers.length
  ]);

  // Fetch hubs
  const fetchHubs = async () => {
    try {
      const all: any = await fetch_hubs({
        token: token,
        municipality: filter.gebied,
        phase: active_phase,
        visible_layers: visible_layers
      }, uniqueComponentId);
      if(all) {
        setPolicyHubs(all);
      }
    } catch(err) {
      console.error(err);
    }
  };

  // Populate table data if policyHubs change
  useEffect(() => {
    if(! active_phase) return;
    if(! policyHubs || policyHubs.length === 0) return;

    // Only keep hubs in active phase
    const filteredHubs = filterVisible(
      filterPhase(policyHubs)
    );
    const uniqueHubs = deDuplicateHubs(filteredHubs);

    const data = [...populateTableData(uniqueHubs)];
    if(! data || data.length === 0) return;
    
    setTableData(data);
  }, [
    policyHubs,
    policyHubs?.length,
    active_phase
  ]);

  const filterPhase = (policyHubs) => {
    return policyHubs.filter((hub) => isHubInPhase(hub, active_phase, visible_layers));
  }

  const filterVisible = (policyHubs) => {
    // Only keep hubs of layers that are selected
    let visiblePhaseLayers = visible_layers.map(x => {
      // For every layer, only keep 'hub' or 'monitoring'
      return x.split('-')[0];
    });
    visiblePhaseLayers = visiblePhaseLayers.filter((x, index) => {
      // Remove duplicate values
      return visiblePhaseLayers.indexOf(x) === index;
    }).map(x => {
      // Finally rename 'verbodsgebied' to 'no_parking' and 'hub' to 'stop'
      if(x === 'hub') return 'stop';
      if(x === 'verbodsgebied') return 'no_parking';
      return x;
    });
    return policyHubs.filter(hub => {
      return visiblePhaseLayers.indexOf(hub.geography_type) > -1;
    });
  }

  // Filter colums if guest user
  const filterColumnsForGuest = (columns) => {
    if(true) {
      return columns;
    }

    const columns_to_remove = [
      'internal_id',
      'created_by',
      'last_modified_by'
    ]
    return columns.filter(x =>
      columns_to_remove.indexOf(x.accessorKey) <= -1
      && x.id !== 'select'
    );
  }

  return (
    <>
      <ActionHeader
        policyHubs={policyHubs}
        fetchHubs={fetchHubs}
      />
      <div data-name="body" className="mx-auto p-4" style={{
        width: 'fit-content'
      }}>
        <DataTable key="data-table" columns={filterColumnsForGuest(columns)} data={tableData} />
      </div>
      <div className="text-gray-200 px-2" onClick={() => {
        fetchHubs();
      }}>.</div>
    </>
  );
}

export default PolicyHubsList;
