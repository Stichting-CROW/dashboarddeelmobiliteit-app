import { useEffect, useState } from 'react';
import { useToast } from "../ui/use-toast"
import { useDispatch, useSelector } from 'react-redux';

import {
    fetch_hubs
} from '../../helpers/policy-hubs/fetch-hubs'

import {HubType} from '../../types/HubType';

import Button from '../Button/Button';
import Text from '../Text/Text';
import FormInput from '../FormInput/FormInput';
import ModalityRow from './ModalityRow';
import { StateType } from '@/src/types/StateType';
import FormLabel from '../FormLabel/FormLabel';
import moment from 'moment';
import { commit_to_concept } from '../../helpers/policy-hubs/commit-to-concept';
import { notify } from '../../helpers/notify';
import { setSelectedPolicyHubs, setShowCommitForm, setShowEditForm } from '../../actions/policy-hubs';

type FormDataType = {
    publish_on: any,
    effective_on: any
}

const PolicyHubsCommit = ({
    all_policy_hubs,
    selected_policy_hubs,
    fetchHubs
}) => {
    const dispatch = useDispatch()
    const { toast } = useToast()

    const [geographyIds, setGeographyIds] = useState([]);
    const [errors, setErrors] = useState<any>({});
    const [formData, setFormData] = useState<FormDataType>({
        publish_on: moment().add(7, 'days').format('YYYY-MM-DD 04:00'),
        effective_on: moment().add(14, 'days').format('YYYY-MM-DD 04:00')
    });

    const token = useSelector((state: StateType) => (state.authentication.user_data && state.authentication.user_data.token)||null)

    // If selected policy hubs changes: Load data of hub
    useEffect(() => {
        if(! selected_policy_hubs || selected_policy_hubs.length === 0) return;

        // Load hub data
        fetchGeographyIds(selected_policy_hubs);
    }, [
        selected_policy_hubs,
        selected_policy_hubs.length
    ]);

    // Find hub data in array with all policy hubs
    const fetchGeographyIds = async (zone_ids) => {
        const foundHub = all_policy_hubs.filter(x => x.geography_id && zone_ids.indexOf(x.zone_id) > -1).map(x => x.geography_id);
        if(foundHub) setGeographyIds(foundHub);
    }

    const postCommitCallback = (zone_id?: number) => {
        // Deselect hub (close action modal)
        dispatch(setSelectedPolicyHubs([]));
        // Refetch hubs (for removing the changed hub from the map)
        fetchHubs();
    }

    const commitToConcept = async () => {
        if(! geographyIds) return;
        if(! formData.publish_on) {
            setErrors({
                publish_on: true
            });
            return;
        }
        if(! formData.effective_on) {
            setErrors({
                effective_on: true
            });
            return;
        }

        const result = await commit_to_concept(token, {
            "geography_ids": geographyIds,
            "publish_on": moment(`${formData.publish_on}`).format(),
            "effective_on": moment(`${formData.effective_on}`).format()
        });

        // If error: Show error
        if(result && result?.detail) {
            notify(toast, 'Opslaan mislukt: ' + result?.detail, {
                title: 'Er ging iets fout',
                variant: 'destructive'
            });
            return;
        }

        notify(toast, `De hub${geographyIds.length > 1 ? 's': ''} ${geographyIds.length > 1 ? 'zijn' : 'is'} vastgesteld en omgezet naar fase: Vastgesteld concept`);

        dispatch(setShowCommitForm(false));

        postCommitCallback();
    }

    const onChange = (e) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value
        });
        setErrors({})
    }

    const hideCommitForm = () => {
        dispatch({
            type: 'SET_SHOW_COMMIT_FORM',
            payload: false
        });
        dispatch(setShowEditForm(false));
    }

    if(! selected_policy_hubs) return <></>;
    return (
        <div>

            <div className="mb-8">
                Je staat op het punt <b>{selected_policy_hubs.length === 1 ? '1 concept' : `${selected_policy_hubs.length} concepten`}</b> vast te stellen. Stel nu de publicatie- en startdatum in.
            </div>
            <div>
                <FormLabel classes="mt-2 mb-4 font-bold">
                    Publiceren op (standaard +7 dagen)
                </FormLabel>
                {errors.publish_on && <p className="text-sm text-red-600 -mt-2 mb-2 font-bold">
                    Vul een valide publicatiedatum/-tijd in:
                </p>}
                <FormInput
                    type="datetime-local"
                    name="publish_on"
                    value={formData.publish_on}
                    onChange={onChange}
                    classes="w-full"
                />
            </div>
            <div>
                <FormLabel classes="mt-2 mb-4 font-bold">
                    Activeren op (standaard +14 dagen)
                </FormLabel>
                {errors.effective_on && <p className="text-sm text-red-600 -mt-2 mb-2 font-bold">
                    Vul een valide activeringsdatum/-tijd in:
                </p>}
                <FormInput
                    type="datetime-local"
                    name="effective_on"
                    value={formData.effective_on}
                    onChange={onChange}
                    classes="w-full"
                />
            </div>
            <div className="flex w-full justify-between">

                <Button
                    theme="white"
                    style={{marginLeft: 0}}
                    onClick={hideCommitForm}
                >
                    Sluiten
                </Button>
                <Button
                    theme={`greenHighlighted`}
                    style={{marginRight: 0}}
                    onClick={commitToConcept}
                >
                    Stel vast
                </Button>

            </div>
        </div>
    )
}

export default PolicyHubsCommit;
