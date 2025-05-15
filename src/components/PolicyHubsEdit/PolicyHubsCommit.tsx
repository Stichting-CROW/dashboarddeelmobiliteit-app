import { useEffect, useMemo, useState } from 'react';
import { useToast } from "../ui/use-toast"
import { useDispatch, useSelector } from 'react-redux';

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
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@radix-ui/react-tooltip';
import { InfoCircledIcon } from "@radix-ui/react-icons"
import { effect } from 'zod';

type FormDataType = {
    publish_on: any,
    effective_on: any,
    publish_on_relative: string,
    effective_on_relative: string,
}

type PublicationTimes = {
    publish_on: string,
    effective_on: string,
    publish_on_iso: string,
    effective_on_iso: string,
}

function addRelativeTime(timestamp, relativeDifference) {
    if(relativeDifference == "tomorrow") {
        return timestamp.add(1, 'days').set('hour', 4).set('minutes', 0).set('second', 0);
    } 
    if (relativeDifference == '3days') {
        return timestamp.add(3, 'days').set('hour', 4).set('minutes', 0).set('second', 0);
    } 
    if (relativeDifference == '1week') {
        return timestamp.add(1, 'weeks').set('hour', 4).set('minutes', 0).set('second', 0);
    }

    return timestamp;
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

    let publish_on_relative = localStorage.getItem("last_publish_on_relative_used") || "1week";
    let effective_on_relative = localStorage.getItem("last_effective_on_relative_used") || "1week";
    let publish_on = moment().add(7, 'days').format('YYYY-MM-DD 04:00');
    let stored_publish_on = localStorage.getItem("last_publish_on_absolute_used");
    if (stored_publish_on && moment(stored_publish_on) > moment()) {
        publish_on = moment(stored_publish_on).format("YYYY-MM-DD HH:mm");
    }

    let effective_on = moment().add(14, 'days').format('YYYY-MM-DD HH:mm');
    let stored_effective_on = localStorage.getItem("last_effective_on_absolute_used");
    if (stored_effective_on && moment(stored_effective_on) > moment()) {
        effective_on = moment(stored_effective_on).format("YYYY-MM-DD HH:mm");
        
        // if the current time is greater then the latest publish_on time but smaller then the latest effective_on time the effective on time is used as publish_on time.
        // This makes it easier for municipalities to use the same effective_on_time for changes that are not made on the same day.
        if (publish_on > effective_on) {
            publish_on = effective_on;
        }
    }


    const [formData, setFormData] = useState<FormDataType>({
        publish_on: publish_on,
        publish_on_relative: publish_on_relative,
        effective_on: effective_on,
        effective_on_relative: effective_on_relative
    });
    
    
    const publicationTimes = useMemo(
        () => {
            let publish_on = moment(formData.publish_on);
            if (formData.publish_on_relative != "other") {
                publish_on = addRelativeTime(moment(), formData.publish_on_relative);
            }
       
            
            let effective_on = moment(formData.effective_on);
            if (formData.effective_on_relative != "other") {
                effective_on = addRelativeTime(moment(publish_on), formData.effective_on_relative);
            }

            return {
                publish_on: publish_on.format('dddd D MMMM HH:mm'),
                publish_on_iso: publish_on.format(),
                effective_on: effective_on.format('dddd D MMMM HH:mm'),
                effective_on_iso: effective_on.format()
            }
        },
        [formData]
      );

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
        let update_text = `De hub${geographyIds.length > 1 ? 's': ''} ${geographyIds.length > 1 ? 'zijn' : 'is'} vastgesteld en omgezet naar fase: Vastgesteld concept`;

        let publish_on = publicationTimes.publish_on_iso;
        if (formData.publish_on_relative == "now") {
            publish_on = moment().add(5, 'seconds').format();
            update_text = `De hub${geographyIds.length > 1 ? 's': ''} ${geographyIds.length > 1 ? 'zijn' : 'is'} gepubliceerd en omgezet naar fase: Definitief gepubliceerd`
        }

        let effective_on = publicationTimes.effective_on_iso;
        if (formData.publish_on_relative == "now" && formData.effective_on_relative == "now") {
            effective_on = publish_on;
            update_text = `De hub${geographyIds.length > 1 ? 's': ''} ${geographyIds.length > 1 ? 'zijn' : 'is'} actief gemaakt en omgezet naar fase: Definitief actief`
        }

        const result = await commit_to_concept(token, {
            "geography_ids": geographyIds,
            "publish_on": publish_on,
            "effective_on": effective_on
        });

        // If error: Show error
        if(result && result?.detail) {
            notify(toast, 'Opslaan mislukt: ' + result?.detail, {
                title: 'Er ging iets fout',
                variant: 'destructive'
            });
            return;
        }

        localStorage.setItem("last_publish_on_relative_used", formData.publish_on_relative);
        localStorage.setItem("last_effective_on_relative_used", formData.effective_on_relative);
        localStorage.setItem("last_publish_on_absolute_used", publish_on);
        localStorage.setItem("last_effective_on_absolute_used", effective_on);

        notify(toast, update_text);

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

    const setRelativePublicationTime = () => {
        
    }
    if(! selected_policy_hubs) return <></>;
    return (
        <div>
            <div className={`mb-2 font-bold`}>
                Zone vaststellen
            </div>

            <div className="mb-8">
                Je staat op het punt <b>{selected_policy_hubs.length === 1 ? '1 concept' : `${selected_policy_hubs.length} concepten`}</b> vast te stellen. Stel nu de publicatie- en startdatum in.
            </div>
            <div>
                <FormLabel classes="mt-2 mb-2 font-bold">
                    Wanneer publiceren?
                    <TooltipProvider delayDuration={500}>
                    <Tooltip>
                        <TooltipTrigger>
                        <InfoCircledIcon className="inline-block ml-1 h-4 w-4 hover:text-[#15AEEF]" />
                        </TooltipTrigger>
                        <TooltipContent 
                        side="top"
                        align="center"
                        className="max-w-[300px] text-sm whitespace-normal text-left p-2 bg-[#15AEEF]"
                        >
                        <p className="text-sm leading-tight">
                            Vanaf deze datum is deze zone 'Definitief gepubliceerd', dat betekent dat de aanbieder deze kan gaan verwerken in het service gebied en er geen wijzigingen meer mogelijk zijn.
                        </p>
                        </TooltipContent>
                        </Tooltip>
                    </TooltipProvider>
                </FormLabel>

                <div className="
                        flex
                        rounded-lg bg-white
                        border-solid
                        border
                        border-gray-400
                        text-sm
                        mt-2 mb-2
                    ">
            {[
                {name: 'now', title: 'Nu'},
                {name: 'tomorrow', title: 'Morgen'},
                {name: '3days', title: '+3 dagen'},
                {name: '1week', title: '+1 week'},
                {name: 'other', title: 'Aangepast'},
            ].map(x => {
                return <div className={`
                    ${formData.publish_on_relative === x.name ? 'Button-blue' : 'text-gray-500'}
                    cursor-pointer
                    flex-1
                    rounded-lg
                    text-center
                    border-gray-500
                    h-10
                    flex
                    flex-col
                    justify-center
                `}
                key={x.name}
                onClick={() => {
                    setFormData({
                        ...formData,
                        ["publish_on_relative"]: x.name 
                    });
                }}
            >
                {x.title}
            </div>
            })}

                </div>
               

                {errors.publish_on && <p className="text-sm text-red-600 -mt-2 mb-2 font-bold">
                    Vul een valide publicatiedatum/-tijd in:
                </p>}

                {formData.publish_on_relative == "other" ?
                <FormInput
                    type="datetime-local"
                    name="publish_on"
                    value={formData.publish_on}
                    onChange={onChange}
                    classes="w-full"
                />
                : <div className="text-sm"> {publicationTimes.publish_on}</div>
                }
            

            
            </div>
            <div>
                <FormLabel classes="mt-8 mb-2 font-bold">
                    Activeren na publicatie
                    <TooltipProvider delayDuration={500}>
                    <Tooltip>
                        <TooltipTrigger>
                        <InfoCircledIcon className="inline-block ml-1 h-4 w-4 hover:text-[#15AEEF]" />
                        </TooltipTrigger>
                        <TooltipContent 
                        side="top"
                        align="center"
                        className="max-w-[300px] text-sm whitespace-normal text-left p-2 bg-[#15AEEF]"
                        >
                        <p className="text-sm leading-tight">
                            Vanaf deze datum is deze zone 'Definitief actief' en moet de aanbieder deze verwerkt hebben in het servicegebied. 
                        </p>
                        </TooltipContent>
                        </Tooltip>
                    </TooltipProvider>
                </FormLabel>

                <div className="
                        flex
                        rounded-lg bg-white
                        border-solid
                        border
                        border-gray-400
                        text-sm
                        mt-2 mb-2
                    ">
            {[
                {name: 'now', title: 'Meteen'},
                {name: 'tomorrow', title: '+1 dag'},
                {name: '3days', title: '+3 dagen'},
                {name: '1week', title: '+1 week'},
                {name: 'other', title: 'Aangepast'},
            ].map(x => {
                return <div className={`
                    ${formData.effective_on_relative === x.name ? 'Button-blue' : 'text-gray-500'}
                    cursor-pointer
                    flex-1
                    rounded-lg
                    text-center
                    border-gray-500
                    h-10
                    flex
                    flex-col
                    justify-center
                `}
                key={x.name}
                onClick={() => {
                    setFormData({
                        ...formData,
                        ["effective_on_relative"]: x.name 
                    });
                }}
            >
                {x.title}
            </div>
            })}

                </div>

                {errors.effective_on && <p className="text-sm text-red-600 -mt-2 mb-2 font-bold">
                    Vul een valide activeringsdatum/-tijd in:
                </p>}

                {formData.effective_on_relative == "other" ?
                    <FormInput
                        type="datetime-local"
                        name="effective_on"
                        value={formData.effective_on}
                        onChange={onChange}
                        classes="w-full"
                    />
                    : <div className="text-sm"> {publicationTimes.effective_on} </div>
                }
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
