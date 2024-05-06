import { useDispatch, useSelector } from "react-redux";
import { useToast } from "../ui/use-toast"
import { StateType } from '../../types/StateType';
import { readable_geotype, defaultStopProperties } from "../../helpers/policy-hubs/common"
import { PolicyHubsEdit_isVirtual } from './PolicyHubsEdit_isVirtual';
import { useEffect, useState } from "react";
import { HubType } from "../../types/HubType";
import { patchHub } from '../../helpers/policy-hubs/patch-hub';

import Button from '../Button/Button';
import { setSelectedPolicyHubs, setShowEditForm } from "../../actions/policy-hubs";
import { notify } from "../../helpers/notify";

const PolicyHubsEdit_bulk = ({
    fetchHubs,
    all_policy_hubs,
    selected_policy_hubs,
    cancelHandler,
    postSaveOrDeleteCallback
}: {
    fetchHubs?: Function,
    all_policy_hubs: any,
    selected_policy_hubs: any,
    cancelHandler: Function,
    postSaveOrDeleteCallback: Function
}) => {
    const dispatch = useDispatch()
    const { toast } = useToast()

    const gm_code = useSelector((state: StateType) => state.filter.gebied);
    const token = useSelector((state: StateType) => (state.authentication.user_data && state.authentication.user_data.token)||null)

    const labelClassNames = 'mb-2 text-sm';
    const [selectedHubsData, setSelectedHubsData] = useState([]);
    const [selectedHubsPhase, setSelectedHubsPhase] = useState('');
    const [hubsData, setHubsData] = useState<HubType>();

    useEffect(() => {
        setSelectedHubsData(get_selected_hubs_data());
    }, [
        selected_policy_hubs
    ])

    useEffect(() => {
        setSelectedHubsPhase(get_phase(selectedHubsData));
    }, [
        selectedHubsData,
        selectedHubsData.length
    ]);

    // Get common attributes
    useEffect(() => {
        // This function gets common attributes, shared amongst all selected hubs
        let common_geography_type, common_is_virtual;
        selectedHubsData.forEach((hub) => {
            // Get common geography type
            common_geography_type = common_geography_type === 'mixed' ? 'mixed' : (
                (! common_geography_type || common_geography_type === hub.geography_type) ? hub.geography_type : 'mixed'
            );
            // Get common 'is_virtual' value
            common_is_virtual = common_is_virtual === 'mixed' ? 'mixed' : (
                (! common_is_virtual || common_is_virtual === hub.stop?.is_virtual) ? hub.stop?.is_virtual : 'mixed'
            );
        });
        // Set common hub attributes in state
        const newHubData: HubType = {};
        if(common_geography_type !== 'mixed') newHubData.geography_type = common_geography_type;
        if(common_is_virtual !== 'mixed') newHubData.stop = {is_virtual: common_is_virtual};
        setHubsData(newHubData);
    }, [
        selectedHubsData,
        selectedHubsData.length
    ]);

    const get_selected_hubs_data = () => {
        if(! all_policy_hubs) return [];
        if(! selected_policy_hubs) return [];

        const selected_hubs = all_policy_hubs.filter(hub => {
            return selected_policy_hubs.indexOf(hub.zone_id) > -1;
        });

        return selected_hubs;
    }

    // Get phase. If not all hub phases are equal -> return 'mixed'
    const get_phase = (selectedHubsData) => {
        if(! selectedHubsData) return;
        
        let foundPhase = '';
        selectedHubsData.forEach((hub) => {
            if(hub.phase === 'mixed') return;
            if(hub.phase !== foundPhase && foundPhase.length > 0) foundPhase = 'mixed';
            foundPhase = hub.phase;
        });

        return foundPhase;
    }

    const setHubData = () => {

    }

    const saveZone = async () => {
        // Remove certain properties based on the hub phase
        let newHubsData = Object.assign({}, {
          "geography_ids": [selectedHubsData.map(x => x.geography_id)]
        }, hubsData);
        console.log('newHubData', newHubsData);

        const updatedZone = await patchHub(token, newHubsData);
        if(updatedZone && updatedZone.detail) {
            notify(toast, 'Er ging iets fout bij het opslaan: ' + updatedZone?.detail, {
                title: 'Er ging iets fout',
                variant: 'destructive'
            })
            return;
        }
        if(updatedZone && updatedZone.zone_id) {
            postSaveOrDeleteCallback(updatedZone.zone_id);
        }
        notify(toast, 'Zone opgeslagen')
    }

    const cancelButtonHandler = () => {
        dispatch(setSelectedPolicyHubs([]));
        dispatch(setShowEditForm(false));

        cancelHandler();
    };

    return <div>
        <div className={`${labelClassNames} font-bold`}>
            Meerdere zones tegelijkertijd wijzigen
        </div>

        {selectedHubsPhase === 'concept' && <PolicyHubsEdit_isVirtual
            hubData={hubsData}
            setHubData={setHubsData}
        />}


        <div className="flex w-full justify-between">

        <Button
            theme="white"
            style={{marginLeft: 0}}
            onClick={cancelButtonHandler}
        >
            Sluiten
        </Button>

        <Button
            theme={`green`}
            style={{marginRight: 0}}
            onClick={saveZone}
        >
            Opslaan
        </Button>

        </div>

    </div>
}

export default PolicyHubsEdit_bulk;
