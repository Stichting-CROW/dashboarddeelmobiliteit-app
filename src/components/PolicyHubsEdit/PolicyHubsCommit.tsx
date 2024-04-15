import { useEffect, useState } from 'react';

import {
    fetch_hubs
} from '../../helpers/policy-hubs/fetch-hubs'

import {HubType} from '../../types/HubType';

// Import API functions
import {
    putZone,
} from '../../helpers/policy-hubs/put-hub';

import Button from '../Button/Button';
import Text from '../Text/Text';
import FormInput from '../FormInput/FormInput';
import ModalityRow from './ModalityRow';
import { useSelector } from 'react-redux';
import { StateType } from '@/src/types/StateType';
import FormLabel from '../FormLabel/FormLabel';
import moment from 'moment';
import { commit_to_concept } from '../../helpers/policy-hubs/commit-to-concept';

type FormDataType = {
    publish_on: any,
    effective_on: any
}

const PolicyHubsCommit = ({
    all_policy_hubs,
    selected_policy_hubs
}) => {
    const [hubData, setHubData] = useState<HubType>({
        stop: {},
        name: '',
        geography_type: '',
        zone_availability: '',
        geography_id: '',
        published_date: '',
        effective_date: ''
    });
    const [formData, setFormData] = useState<FormDataType>({
        publish_on: moment().add(7, 'days').format('YYYY-MM-DD'),
        effective_on: moment().add(14, 'days').format('YYYY-MM-DD')
    });

    const token = useSelector((state: StateType) => (state.authentication.user_data && state.authentication.user_data.token)||null)

    // If selected policy hubs changes: Load data of hub
    useEffect(() => {
        if(! selected_policy_hubs || ! selected_policy_hubs[0]) return;

        // Load hub data
        loadHubData(selected_policy_hubs[0]);
    }, [
        selected_policy_hubs,
        selected_policy_hubs.length
    ]);

    // Find hub data in array with all policy hubs
    const loadHubData = async (hub_id) => {
        const foundHub = all_policy_hubs.find(x => x.zone_id === hub_id);
        if(foundHub) setHubData(foundHub);
    }

    const commitToConcept = () => {
        if(! hubData) return;
        if(! formData.publish_on) return;
        if(! formData.effective_on) return;

        commit_to_concept(token, {
            "geography_ids": [hubData.geography_id],
            "publish_on": moment(`${formData.publish_on} 04:00:00`).format(),
            "effective_on": moment(`${formData.effective_on} 04:00:00`).format()
        })
    }

    const onChange = (e) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value
        });
    }

    if(! selected_policy_hubs) return <></>;
    if(selected_policy_hubs.length > 1) return <></>;
    return (
        <div>
            <div>
                Je staat op het punt een concept vast te stellen. Stel nu de publicatie- en startdatum in.
            </div>
            <div>
                <FormLabel classes="mt-2 mb-4 font-bold">
                    Publicatiedatum (standaard +7 dagen)
                </FormLabel>
                <FormInput
                    type="date"
                    name="publish_on"
                    value={formData.publish_on}
                    onChange={() => {}}
                    classes="w-full"
                />
            </div>
            <div>
                <FormLabel classes="mt-2 mb-4 font-bold">
                    Startdatum (standaard +14 dagen)
                </FormLabel>
                <FormInput
                    type="date"
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
                    onClick={onChange}
                >
                    Annuleer
                </Button>
                <Button
                    theme={`greenHighlighted`}
                    style={{marginRight: 0}}
                    onClick={commitToConcept}
                >
                    Opslaan
                </Button>

            </div>
        </div>
    )
}

export default PolicyHubsCommit;
