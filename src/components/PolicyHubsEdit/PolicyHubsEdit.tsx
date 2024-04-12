import { useEffect, useState } from 'react';

import {
    fetch_hubs
} from '../../helpers/policy-hubs/fetch-hubs'
  
import Button from '../Button/Button';
import Text from '../Text/Text';
import FormInput from '../FormInput/FormInput';
import ModalityRow from './ModalityRow';

type HubType = {
    geography_type: string;
    name: string;
    zone_availability: string;
}

const PolicyHubsEdit = ({
    all_policy_hubs,
    selected_policy_hubs
}) => {
    const [limitType, setLimitType] = useState('');
    const [hubData, setHubData] = useState<HubType>({
        name: '',
        geography_type: '',
        zone_availability: ''
    });

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

    const saveZone = () => {
    }
    const deleteZoneHandler = saveZone;
    const cancelButtonHandler = saveZone;
    const changeHandler = saveZone;

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
            <div className="flex justify-between" style={{marginLeft: '-0.5rem'}}>
                <Button
                    theme={didChangeZoneConfig ? `greenHighlighted` : `green`}
                    onClick={saveZone}
                >
                    Opslaan
                </Button>

                <div className="-mr-2">
                    {! isNewZone && <Button
                        onClick={deleteZoneHandler}
                        >
                        🗑️
                    </Button>}

                    <Button
                        theme="white"
                        onClick={cancelButtonHandler}
                        >
                        Annuleer
                    </Button>
                </div>
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
                        {name: 'no_parking', title: 'No parking', color: '#fd3e48'}
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
                        ${hubData.zone_availability === x.name ? 'Button-blue' : ''}
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
                    >
                        {x.title}
                    </div>
                })}
            </div>
            </div>

            <div className={hubData.geography_type === 'stop' ? 'visible' : 'invisible'}>
            <p className="mb-2 text-sm">
                Limiet <a onClick={() => setLimitType('modality')} className={`
                    ${limitType === 'modality' ? 'underline' : ''}
                    cursor-pointer
                `}>
                per modaliteit
                </a> | <a onClick={() => setLimitType('combined')} className={`
                    ${limitType === 'combined' ? 'underline' : ''}
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
                {limitType === 'combined' && <ModalityRow
                    imageUrl=""
                    name="vehicles-limit.combined"
                    value={hubData['vehicles-limit.combined']}
                    onChange={changeHandler}
                />}
                {limitType === 'modality' && <>
                <ModalityRow
                    imageUrl="https://i.imgur.com/IF05O8u.png"
                    name="vehicles-limit.bicycle"
                    value={hubData['vehicles-limit.bicycle']}
                    onChange={changeHandler}
                />
                <ModalityRow
                    imageUrl="https://i.imgur.com/FdVBJaZ.png"
                    name="vehicles-limit.cargo_bicycle"
                    value={hubData['vehicles-limit.cargo_bicycle']}
                    onChange={changeHandler}
                />
                <ModalityRow
                    imageUrl="https://i.imgur.com/h264sb2.png"
                    name="vehicles-limit.moped"
                    value={hubData['vehicles-limit.moped']}
                    onChange={changeHandler}
                />
                <ModalityRow
                    imageUrl="https://i.imgur.com/7Y2PYpv.png"
                    name="vehicles-limit.car"
                    value={hubData['vehicles-limit.car']}
                    onChange={changeHandler}
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
        </div>
    )
}

export default PolicyHubsEdit;
