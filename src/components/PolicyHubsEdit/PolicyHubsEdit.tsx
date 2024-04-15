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

const PolicyHubsEdit = ({
    all_policy_hubs,
    selected_policy_hubs
}) => {
    const [hubData, setHubData] = useState<HubType>({
        stop: {},
        name: '',
        geography_type: '',
        zone_availability: '',
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

    const getZoneAvailability = () => {
        if(! hubData || ! hubData.stop || ! hubData.stop.status) return;

        const status = hubData.stop.status;

        if(status.control_automatic === true) {
            return 'auto';
        } else if(! status.control_automatic && status.is_returning === true) {
            return 'open';
        } else if(! status.control_automatic && status.is_returning === false) {
            return 'closed';
        }
    }

    const getCapacityType = () => {
        if(! hubData || ! hubData.stop || ! hubData.stop.capacity) return;

        const capacity = hubData.stop.capacity;

        if(capacity.combined !== undefined) {
            return 'combined';
        } else {
            return 'modality';
        }
    }

    const saveZone = async () => {
        const updatedZone = await putZone(token, hubData);
    }
    const deleteZoneHandler = saveZone;
    const cancelButtonHandler = saveZone;

    const changeHandler = (e) => {
        if(! e) return;

        setHubData({
            ...hubData,
            [e.target.name]: e.target.value
        });
    };

    const updateGeographyType = (type: string) => {
        setHubData({
            ...hubData,
            geography_type: type
        });
    }

    const updateZoneAvailability = (name: string) => {
        if(name === 'auto') {
            setHubData({
                ...hubData,
                stop: {
                    ...hubData.stop,
                    status: {
                        control_automatic: true,
                        is_returning: true,
                        is_installed: false,
                        is_renting: false
                    }
                }
            });
        } else if(name === 'open') {
            setHubData({
                ...hubData,
                stop: {
                    ...hubData.stop,
                    status: {
                        control_automatic: false,
                        is_returning: true,
                        is_installed: false,
                        is_renting: false
                    }
                }
            });

        } else if(name === 'closed') {
            setHubData({
                ...hubData,
                stop: {
                    ...hubData.stop,
                    status: {
                        control_automatic: false,
                        is_returning: false,
                        is_installed: false,
                        is_renting: false
                    }
                }
            });
        }

        const status = hubData.stop.status;

        if(status.control_automatic === true) {
            return 'auto';
        } else if(! status.control_automatic && status.is_returning === true) {
            return 'open';
        } else if(! status.control_automatic && status.is_returning === false) {
            return 'closed';
        }

    }

    const updateCapacityType = (name: string) => {
        if(name === 'combined') {
            setHubData({
                ...hubData,
                stop: {
                    ...hubData.stop,
                    capacity: {
                        combined: hubData.stop.capacity.combined || 0
                    }
                }
            });
        }
        else if(name === 'modality') {
            setHubData({
                ...hubData,
                stop: {
                    ...hubData.stop,
                    capacity: {
                        bicycle: hubData.stop.capacity.bicycle || 0,
                        moped: hubData.stop.capacity.moped || 0,
                        scooter: hubData.stop.capacity.scooter || 0,
                        cargo_bicycle: hubData.stop.capacity.cargo_bicycle || 0,
                        car: hubData.stop.capacity.car || 0,
                        other: hubData.stop.capacity.other || 0
                    }
                }
            });
        }
    }

    const updateCapacityValue = (key: string, value: number) => {
        if(! key) return;
        if(! value) return;

        setHubData({
            ...hubData,
            stop: {
                ...hubData.stop,
                capacity: {
                    ...hubData.stop.capacity,
                    [key]: value
                }
            }
        });
    }

    const labelClassNames = 'mb-2 text-sm';
    const isNewZone = false;
    const didChangeZoneConfig = false;
    const viewMode = 'adminEdit';

    if(! selected_policy_hubs) return <></>;
    if(selected_policy_hubs.length > 1) return <></>;
    return (
        <div>
            <div className={labelClassNames}>
                Zone {isNewZone ? 'toevoegen' : 'wijzigen'}
            </div>
            <div>
                <FormInput
                    type="text"
                    placeholder="Naam van de zone"
                    name="name"
                    autoComplete="off"
                    id="js-FilterbarZones-name-input"
                    value={hubData.name || ""}
                    onChange={changeHandler}
                    classes="w-full"
                />
            </div>

            <div className="
                mt-0
            ">
                <div className="
                    flex
                    rounded-lg bg-white
                    border-solid
                    border
                    border-gray-400
                    text-sm
                ">
                    {[
                        {name: 'stop', title: 'Parking', color: '#fd862e'},
                        {name: 'no_parking', title: 'Verbodsgebied', color: '#fd3e48'}
                    ].map(x => {
                        return <div className={`
                            ${hubData.geography_type === x.name ? 'Button-orange' : ''}
                            cursor-pointer
                            flex-1
                            
                            rounded-lg
                            text-gray-500
                            text-center
                            h-10
                            flex
                            flex-col
                            justify-center
                        `}
                        style={{
                            backgroundColor: `${hubData.geography_type === x.name ? x.color : ''}`
                        }}
                        key={x.name}
                        onClick={() => {
                            updateGeographyType(x.name);
                        }}
                        >
                            {x.title}
                        </div>
                    })}
                </div>
            </div>

            <div className={`
                py-2
                ${hubData.geography_type === 'stop' ? 'visible' : 'invisible'}
            `}>
                <div className="
                    flex
                    rounded-lg bg-white
                    border-solid
                    border
                    border-gray-400
                    text-sm
                ">
                    {/*
                        Availability zit verstopt in status.
                        is_enabled = true is open, is_enabled = false is gesloten
                        control_automatic=true
                    */}
                    {[
                        {name: 'auto', title: 'Automatisch'},
                        {name: 'open', title: 'Open'},
                        {name: 'closed', title: 'Gesloten'}
                    ].map(x => {
                    return <div className={`
                        ${getZoneAvailability() === x.name ? 'Button-blue' : ''}
                        cursor-pointer
                        flex-1
                        rounded-lg
                        text-gray-500
                        text-center
                        border-gray-500
                        h-10
                        flex
                        flex-col
                        justify-center
                    `}
                    key={x.name}
                    onClick={() => {
                        updateZoneAvailability(x.name)
                    }}
                    >
                        {x.title}
                    </div>
                })}
            </div>
            </div>

            <div className={hubData.geography_type === 'stop' ? 'visible' : 'invisible'}>
            <p className="mb-2 text-sm">
                Limiet <a onClick={() => {
                    updateCapacityType('modality');
                }} className={`
                    ${getCapacityType() === 'modality' ? 'underline' : ''}
                    cursor-pointer
                `}>
                per modaliteit
                </a> | <a onClick={() => {
                    updateCapacityType('combined');
                }} className={`
                    ${getCapacityType() === 'combined' ? 'underline' : ''}
                    cursor-pointer
                `}>
                totaal
                </a>
            </p>

            <div className="
                rounded-lg
                bg-white
                border-solid
                border
                border-gray-400
                p-4
            ">
                {getCapacityType() === 'combined' && <ModalityRow
                    imageUrl=""
                    name="vehicles-limit.combined"
                    value={hubData['vehicles-limit.combined']}
                    onChange={(e) => updateCapacityValue('combined', Number(e.target.value))}
                />}
                {getCapacityType() === 'modality' && <>
                <ModalityRow
                    imageUrl="https://i.imgur.com/IF05O8u.png"
                    name="vehicles-limit.bicycle"
                    value={hubData['vehicles-limit.bicycle']}
                    onChange={(e) => updateCapacityValue('bicycle', Number(e.target.value))}
                />
                <ModalityRow
                    imageUrl="https://i.imgur.com/FdVBJaZ.png"
                    name="vehicles-limit.cargo_bicycle"
                    value={hubData['vehicles-limit.cargo_bicycle']}
                    onChange={(e) => updateCapacityValue('cargo_bicycle', Number(e.target.value))}
                />
                <ModalityRow
                    imageUrl="https://i.imgur.com/h264sb2.png"
                    name="vehicles-limit.moped"
                    value={hubData['vehicles-limit.moped']}
                    onChange={(e) => updateCapacityValue('moped', Number(e.target.value))}
                />
                <ModalityRow
                    imageUrl="https://i.imgur.com/7Y2PYpv.png"
                    name="vehicles-limit.car"
                    value={hubData['vehicles-limit.car']}
                    onChange={(e) => updateCapacityValue('car', Number(e.target.value))}
                />
                </>}
            </div>
        </div>

        {(false && ! isNewZone && viewMode === 'adminEdit') && <div className="my-2 text-center">
            <Text
                theme="red"
                onClick={deleteZoneHandler}
                classes="text-xs"
            >
               Verwijder zone
            </Text>
        </div>}
        <div className="flex w-full justify-between">

            <Button
                theme="white"
                style={{marginLeft: 0}}
                onClick={cancelButtonHandler}
            >
                Annuleer
            </Button>
            {! isNewZone && <Button
                onClick={deleteZoneHandler}
            >
                🗑️
            </Button>}
            <Button
                theme={didChangeZoneConfig ? `greenHighlighted` : `green`}
                style={{marginRight: 0}}
                onClick={saveZone}
            >
                Opslaan
            </Button>

            </div>
        </div>
    )
}

export default PolicyHubsEdit;