import { useEffect, useState } from 'react';

import {
    fetch_hubs
} from '../../helpers/policy-hubs/fetch-hubs'

import {HubType} from '../../types/HubType';
import { DrawedAreaType } from '../../types/DrawedAreaType';

// Import API functions
import { postHub } from '../../helpers/policy-hubs/post-hub';
import { patchHub } from '../../helpers/policy-hubs/patch-hub';
import { deleteHub } from '../../helpers/policy-hubs/delete-hub';

import Button from '../Button/Button';
import Text from '../Text/Text';
import FormInput from '../FormInput/FormInput';
import ModalityRow from './ModalityRow';
import { useDispatch, useSelector } from 'react-redux';
import { StateType } from '@/src/types/StateType';
import center from '@turf/center';
import { notify } from '../../helpers/notify';
import { setHubsInDrawingMode, setIsDrawingEnabled, setSelectedPolicyHubs } from '../../actions/policy-hubs';

const PolicyHubsEdit = ({
    fetchHubs,
    all_policy_hubs,
    selected_policy_hubs,
    drawed_area,
    cancelHandler,
}: {
    fetchHubs?: Function,
    all_policy_hubs: any,
    selected_policy_hubs: any,
    drawed_area: DrawedAreaType,
    cancelHandler: Function,
}) => {
    const dispatch = useDispatch()

    // Get gebied / municipality code
    const gm_code = useSelector((state: StateType) => state.filter.gebied);

    const is_drawing_enabled = useSelector((state: StateType) => {
        return state.policy_hubs ? state.policy_hubs.is_drawing_enabled : [];
    });
    
    const defaultStopProperties = {
        location: {},
        is_virtual: true,
        status: {
            control_automatic: true
        },
        capacity: {
            combined: 50
        }
    }

    const [hasUnsavedChanges, setHasUnsavedChanges] = useState<boolean>(false);
    const [hubData, setHubData] = useState<HubType>({
        stop: defaultStopProperties,
        name: '',
        geography_type: 'stop',
        zone_availability: '',
        municipality: gm_code,
        description: 'Hub',
        internal_id: '',
        area: {},
        phase: 'concept'
    });

    const token = useSelector((state: StateType) => (state.authentication.user_data && state.authentication.user_data.token)||null)

    // On unload
    // useEffect(() => {
    // }, [])

    // If selected policy hubs changes: Load data of hub
    useEffect(() => {
        if(! selected_policy_hubs || ! selected_policy_hubs[0]) return;
        const zone_id = selected_policy_hubs[0];

        // Don't do anything if we changed to the same hub
        if(hubData.zone_id === zone_id) {
            return;
        }

        // Stop being in drawing mode
        dispatch(setHubsInDrawingMode([]));
        dispatch(setIsDrawingEnabled(false));

        // Load hub data
        setTimeout(() => {
           loadHubData(zone_id);
        }, 25);
    }, [
        selected_policy_hubs,
        selected_policy_hubs.length
    ]);

    // If draw is done: Update feature geometry in hubData
    useEffect(() => {
        if(! drawed_area || ! drawed_area.features) return;

        const drawedAreaCenter = center(drawed_area.features[0]);

        setHubData({
            ...hubData,
            area: {
                geometry: drawed_area.features[0]?.geometry,
                properties: drawed_area.features[0]?.properties,
                type: drawed_area.features[0]?.type
            },
            stop: hubData.geography_type === 'stop' ? {
                ...hubData.stop,
                location: drawedAreaCenter
            } : null
        });
        setHasUnsavedChanges(true);
    }, [drawed_area])

    const isNewZone = selected_policy_hubs && selected_policy_hubs[0] && selected_policy_hubs[0] === 'new';

    // Find hub data in array with all policy hubs
    const loadHubData = async (hub_id) => {
        const foundHub = all_policy_hubs.find(x => x.zone_id === hub_id);
        if(foundHub) {
            // Set hub data in local state
            setHubData(foundHub);
        }
    }

    const getZoneAvailability = () => {
        if(! hubData || ! hubData.stop || ! hubData.stop.status) return;

        const status = hubData.stop.status;

        if(status?.control_automatic === true) {
            return 'auto';
        } else if(! status?.control_automatic && status?.is_returning === true) {
            return 'open';
        } else if(! status?.control_automatic && status?.is_returning === false) {
            return 'closed';
        }
    }

    const getCapacityType = () => {
        if(! hubData || ! hubData.stop || ! hubData.stop.capacity) return;

        const capacity = hubData.stop.capacity;

        if(capacity?.combined !== undefined) {
            return 'combined';
        } else {
            return 'modality';
        }
    }

    const postSaveOrDeleteCallback = (zone_id?: number) => {
        dispatch(setSelectedPolicyHubs(zone_id ? [zone_id] : []))
        dispatch(setHubsInDrawingMode([]));
        dispatch(setIsDrawingEnabled(false));
        fetchHubs();
    }

    const saveZone = async () => {
        if(isNewZone) {
            const addedZone = await postHub(token, hubData);
            // Notify if something went wrong
            if(addedZone && addedZone.detail) {
                notify('Er ging iets fout bij het opslaan: ' + addedZone?.detail)
                return;
            }
            if(addedZone && addedZone.zone_id) {
                notify('Hub toegevoegd');
                postSaveOrDeleteCallback(addedZone.zone_id);
                setHubData({
                    ...hubData,
                    zone_id: addedZone.zone_id
                })
            }
        }
        else {
            const updatedZone = await patchHub(token, hubData);
            if(updatedZone && updatedZone.detail) {
                notify('Er ging iets fout bij het opslaan: ' + updatedZone?.detail)
                return;
            }
            if(updatedZone && updatedZone.zone_id) {
                postSaveOrDeleteCallback(updatedZone.zone_id);
            }
            notify('Hub opgeslagen')
        }
        setHasUnsavedChanges(false);
    }

    const deleteZoneHandler = async (e) => {
        if(! hubData || ! hubData.geography_id) return;
        if(! window.confirm('Weet je zeker dat je deze hub wilt verwijderen?')) {
            alert('Verwijderen geannuleerd');
            return;
        }

        try {
            const response = await deleteHub(token, hubData.geography_id);
            console.log('Delete reponse', response);
    
            if(response && response.detail) {
                // Give error if something went wrong
                notify('Er ging iets fout bij het verwijderen');
            }
            else {
                notify('Hub verwijderd');
                // Hide edit form
                dispatch(setSelectedPolicyHubs([]))
                postSaveOrDeleteCallback();
            }
        } catch(err) {
            console.error('Delete error', err);
        }
    };

    const cancelButtonHandler = () => {
        if(hasUnsavedChanges) {
            if(! window.confirm('Je hebt onopgeslagen wijzigen. Weet je zeker dat je door wilt gaan?')) {
                return;
            }
        }

        dispatch({
            type: 'SET_SELECTED_POLICY_HUBS',
            payload: []
        });
        cancelHandler();
    };

    const changeHandler = (e) => {
        if(! e) return;

        setHubData({
            ...hubData,
            [e.target.name]: e.target.value
        });
    };

    const updateGeographyType = (type: string) => {
        const polygonCenter = center(hubData?.area);

        setHubData({
            ...hubData,
            geography_type: type,
            description: (type === 'no_parking' ? 'Verbodsgebied' : 'Hub'),
            stop: type === 'stop' ? {
                ...hubData.stop,
                is_virtual: hubData.stop?.is_virtual || defaultStopProperties.is_virtual,
                status: hubData.stop?.status || defaultStopProperties.status,
                capacity: hubData.stop?.capacity || defaultStopProperties.capacity,
                location: polygonCenter
            } : null
        });
        setHasUnsavedChanges(true);
    }

    const updateIsVirtual = (key: string) => {
        if(key === 'is_virtual') {
            setHubData({
                ...hubData,
                stop: {
                    ...hubData.stop,
                    is_virtual: true
                }
            });
        }
        else {
            setHubData({
                ...hubData,
                stop: {
                    ...hubData.stop,
                    is_virtual: false
                }
            });
        }
    }

    const updateZoneAvailability = (name: string) => {
        setHasUnsavedChanges(true);

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

        const status = hubData?.stop?.status;

        if(status?.control_automatic === true) {
            return 'auto';
        } else if(! status?.control_automatic && status?.is_returning === true) {
            return 'open';
        } else if(! status?.control_automatic && status?.is_returning === false) {
            return 'closed';
        }

    }

    const updateCapacityType = (name: string) => {
        setHasUnsavedChanges(true);

        if(name === 'combined') {
            setHubData({
                ...hubData,
                stop: {
                    ...hubData.stop,
                    capacity: {
                        combined: hubData?.stop?.capacity?.combined || 0
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
                        bicycle: hubData?.stop?.capacity?.bicycle || 0,
                        moped: hubData?.stop?.capacity?.moped || 0,
                        scooter: hubData?.stop?.capacity?.scooter || 0,
                        cargo_bicycle: hubData?.stop?.capacity?.cargo_bicycle || 0,
                        car: hubData?.stop?.capacity?.car || 0,
                        other: hubData?.stop?.capacity?.other || 0
                    }
                }
            });
        }
    }

    const updateCapacityValue = (key: string, value: number) => {
        if(! key) return;
        if(! value) return;

        setHasUnsavedChanges(true);

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

    const toggleDrawingForHub = () => {
        if(! hubData.zone_id) return;
        
        // Enable
        if(! is_drawing_enabled) {
            dispatch(setHubsInDrawingMode([hubData.zone_id]))
            dispatch(setIsDrawingEnabled(hubData.zone_id));
        }
        // Or disable drawing
        else {
            // Alert if there're unsaved changes
            if(! window.confirm('Klik op OK om het bewerken van de contouren te annuleren.')) {
                return;
            }

            dispatch(setHubsInDrawingMode([]));
            dispatch(setIsDrawingEnabled(false));
        }
    }

    const labelClassNames = 'mb-2 text-sm';
    const didChangeZoneConfig = false;
    const viewMode = 'adminEdit';

    if(! selected_policy_hubs) return <></>;
    if(selected_policy_hubs.length > 1) return <></>;

    console.log('drawed_area', drawed_area)
    if(! drawed_area) {
        return (
            <div>
                <div className={`${labelClassNames} font-bold`}>
                    Hub {isNewZone ? 'toevoegen' : 'wijzigen'}
                </div>
                <p className="my-2">
                    Teken een gebied op de kaart 
                </p>
                <div className="flex w-full justify-between">

                <Button
                    theme="white"
                    style={{marginLeft: 0}}
                    onClick={cancelButtonHandler}
                >
                    Sluiten
                </Button>
                </div>
            </div>
        )
    }

    return (
        <div>
            <div className={`${labelClassNames} font-bold`}>
                Hub {isNewZone ? 'toevoegen' : 'wijzigen'}
            </div>
            <div>
                <FormInput
                    type="text"
                    autofocus
                    placeholder="Naam van de zone"
                    name="name"
                    autoComplete="off"
                    id="js-FilterbarZones-name-input"
                    value={hubData.name || ""}
                    onChange={changeHandler}
                    classes="w-full"
                />
            </div>
            <div>
                <FormInput
                    type="text"
                    autofocus
                    placeholder="Lokale ID (niet publiek)"
                    name="internal_id"
                    autoComplete="off"
                    id="js-FilterbarZones-internal_id-input"
                    value={hubData.internal_id || ""}
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
                        {name: 'monitoring', title: 'Analyse', color: '#15aeef'},
                        {name: 'stop', title: 'Hub', color: '#fd862e'},
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
                            backgroundColor: `${hubData.geography_type === x.name ? x.color : ''}`,
                            flex: x.name === 'no_parking' ?  '2' : '1'
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
                mt-2
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
                    {[
                        {name: 'is_virtual', title: 'Virtuele hub', color: '#15aeef'},
                        {name: 'is_not_virtual', title: 'Fysieke hub', color: '#15aeef'}
                    ].map(x => {
                        return <div className={`
                            ${(hubData?.stop?.is_virtual === true && x.name === 'is_virtual') ? 'Button-orange' : ''}
                            ${(hubData?.stop?.is_virtual === false && x.name === 'is_not_virtual') ? 'Button-orange' : ''}
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
                            updateIsVirtual(x.name);
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
                    updateCapacityType('combined');
                }} className={`
                    ${getCapacityType() === 'combined' ? 'underline' : ''}
                    cursor-pointer
                `}>
                totaal
                </a> | <a onClick={() => {
                    updateCapacityType('modality');
                }} className={`
                    ${getCapacityType() === 'modality' ? 'underline' : ''}
                    cursor-pointer
                `}>
                per modaliteit
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
                    value={hubData?.stop?.capacity?.combined}
                    onChange={(e) => updateCapacityValue('combined', Number(e.target.value))}
                />}
                {getCapacityType() === 'modality' && <>
                <ModalityRow
                    imageUrl="https://i.imgur.com/IF05O8u.png"
                    name="vehicles-limit.bicycle"
                    value={hubData?.stop?.capacity?.bicycle}
                    onChange={(e) => updateCapacityValue('bicycle', Number(e.target.value))}
                />
                <ModalityRow
                    imageUrl="https://i.imgur.com/FdVBJaZ.png"
                    name="vehicles-limit.cargo_bicycle"
                    value={hubData?.stop?.capacity?.cargo_bicycle}
                    onChange={(e) => updateCapacityValue('cargo_bicycle', Number(e.target.value))}
                />
                <ModalityRow
                    imageUrl="https://i.imgur.com/h264sb2.png"
                    name="vehicles-limit.moped"
                    value={hubData?.stop?.capacity?.moped}
                    onChange={(e) => updateCapacityValue('moped', Number(e.target.value))}
                />
                <ModalityRow
                    imageUrl="https://i.imgur.com/7Y2PYpv.png"
                    name="vehicles-limit.car"
                    value={hubData?.stop?.capacity?.car}
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
               Verwijder hub
            </Text>
        </div>}

        <div className="flex w-full justify-between">

            <Button
                theme="white"
                style={{marginLeft: 0}}
                onClick={cancelButtonHandler}
            >
                Sluiten
            </Button>
            {! isNewZone && <Button
                onClick={toggleDrawingForHub}
                theme={is_drawing_enabled ? `greenHighlighted` : ''}
            >
                ✒️
            </Button>}
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
