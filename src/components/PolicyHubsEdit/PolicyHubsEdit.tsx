import { useEffect, useState, useRef } from 'react';
import { useToast } from "../ui/use-toast"

import {HubType} from '../../types/HubType';
import { DrawedAreaType } from '../../types/DrawedAreaType';

// Import API functions
import { postHub } from '../../helpers/policy-hubs/post-hub';
import { patchHub } from '../../helpers/policy-hubs/patch-hub';
import { deleteHub } from '../../helpers/policy-hubs/delete-hub';
import { readable_geotype, defaultStopProperties, readable_phase } from "../../helpers/policy-hubs/common"
import { deleteZoneHandler } from './utils/delete_zone';

import Button from '../Button/Button';
import Text from '../Text/Text';
import FormInput from '../FormInput/FormInput';
import ModalityRow from './ModalityRow';
import PolicyHubsEdit_bulk from './PolicyHubsEdit_bulk';
import { useDispatch, useSelector } from 'react-redux';
import { StateType } from '@/src/types/StateType';
import center from '@turf/center';
import { notify } from '../../helpers/notify';
import { setHubsInDrawingMode, setIsDrawingEnabled, setSelectedPolicyHubs, setShowEditForm } from '../../actions/policy-hubs';
import { PolicyHubsEdit_geographyType } from './PolicyHubsEdit_geographyType';
import { PolicyHubsEdit_isVirtual } from './PolicyHubsEdit_isVirtual';
import moment from 'moment';
import { canEditHubs } from '../../helpers/authentication';

const PolicyHubsEdit = ({
  fetchHubs,
  all_policy_hubs,
  selected_policy_hubs,
  drawed_area,
  active_phase,
  cancelHandler,
}: {
  fetchHubs?: Function,
  all_policy_hubs: any,
  selected_policy_hubs: any,
  drawed_area: DrawedAreaType,
  active_phase: string,
  cancelHandler: Function,
}) => {
  const dispatch = useDispatch()
  const { toast } = useToast()

  // Get gebied / municipality code
  const gm_code = useSelector((state: StateType) => state.filter.gebied);

  const acl = useSelector((state: StateType) => state.authentication?.user_data?.acl);

  const is_drawing_enabled = useSelector((state: StateType) => {
    return state.policy_hubs ? state.policy_hubs.is_drawing_enabled : [];
  });
  
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState<boolean>(false);
  const [hubData, setHubData] = useState<HubType>({
    stop: defaultStopProperties,
    name: '',
    geography_type: 'stop',
    zone_availability: 'auto',
    municipality: gm_code,
    description: 'Hub',
    internal_id: '',
    area: {},
    phase: 'concept'
  });

  useEffect(() => {
    console.log('hubData in render', hubData)
  }, [hubData]);

  const token = useSelector((state: StateType) => (state.authentication.user_data && state.authentication.user_data.token)||null)

  // If selected policy hubs changes: Load data of hub
  useEffect(() => {
    if(! selected_policy_hubs || ! selected_policy_hubs[0]) return;
    const zone_id = selected_policy_hubs[0];

    // Don't do anything if we changed to the same hub
    if(hubData.zone_id === zone_id) {
      return;
    }

    // If we selected an existing hub: Stop being in drawing mode 
    if(zone_id !== 'new') {
      // Stop being in drawing mode
      dispatch(setHubsInDrawingMode([]));
      dispatch(setIsDrawingEnabled(false));
    }

    // Load hub data
    setTimeout(() => {
      loadHubData(zone_id);
    }, 25);
  }, [
      selected_policy_hubs,
      selected_policy_hubs.length
  ]);

  // If amount of policy hubs changes: (Re)load data of hub
  useEffect(() => {
    if(! selected_policy_hubs || ! selected_policy_hubs[0]) return;
    const zone_id = selected_policy_hubs[0];
    
    if(! zone_id) return;
    if(zone_id === 'new') return;

    // Load hub data
    loadHubData(zone_id);
  }, [
    all_policy_hubs.length// If there's a new hub added
  ]);

  // If draw is done: Update feature geometry in hubData
  useEffect(() => {
    if(! drawed_area || ! drawed_area.features) return;

    let drawedAreaCenter;
    try {
      // Handle both Polygon and MultiPolygon types
      const feature = drawed_area.features[0];
      if (feature.geometry.type === 'MultiPolygon') {
        // For MultiPolygon, we need to create a proper Feature object
        drawedAreaCenter = center(feature);
      } else {
        // For regular Polygon, the existing approach works
        drawedAreaCenter = center(feature);
      }
    } catch (err) {
      console.error('Error calculating center:', err);
      return;
    }

    setHubData(prevHubData => {
      const newHubData = {
        ...prevHubData,
        area: {
          geometry: drawed_area.features[0]?.geometry,
          properties: drawed_area.features[0]?.properties,
          type: drawed_area.features[0]?.type
        },
        stop: prevHubData.geography_type === 'stop' ? {
          ...prevHubData.stop,
          location: drawedAreaCenter
        } : null
      };
      return newHubData;
    });

    setHasUnsavedChanges(true);
  }, [
    drawed_area
  ]);

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
    dispatch(setShowEditForm(zone_id ? true : false));

    dispatch(setHubsInDrawingMode([]));
    dispatch(setIsDrawingEnabled(false));

    // Fetch hubs from API
    fetchHubs();
  }

  const changeHandler = (e) => {
    if(! e) return;

    setHubData(prevHubData => ({
      ...prevHubData,
      [e.target.name]: e.target.value
    }));
  };

  const updateZoneAvailability = (name: string) => {
    setHasUnsavedChanges(true);

    setHubData(prevHubData => {
      if(name === 'auto') {
        return {
          ...prevHubData,
          zone_availability: name,
          stop: {
            ...prevHubData.stop,
            status: {
              control_automatic: true,
              is_returning: true,
              is_installed: false,
              is_renting: false
            }
          }
        };
      } else if(name === 'open') {
        return {
          ...prevHubData,
          zone_availability: name,
          stop: {
            ...prevHubData.stop,
            status: {
              control_automatic: false,
              is_returning: true,
              is_installed: false,
              is_renting: false
            }
          }
        };
      } else if(name === 'closed') {
        return {
          ...prevHubData,
          zone_availability: name,
          stop: {
            ...prevHubData.stop,
            status: {
              control_automatic: false,
              is_returning: false,
              is_installed: false,
              is_renting: false
            }
          }
        };
      }
      return prevHubData;
    });
  }

  const updateCapacityType = (name: string) => {
    setHasUnsavedChanges(true);

    setHubData(prevHubData => {
      if(name === 'combined') {
        return {
          ...prevHubData,
          stop: {
            ...prevHubData.stop,
            capacity: {
              combined: prevHubData?.stop?.capacity?.combined || 0
            }
          }
        };
      }
      else if(name === 'modality') {
        return {
          ...prevHubData,
          stop: {
            ...prevHubData.stop,
            capacity: {
              bicycle: prevHubData?.stop?.capacity?.bicycle || 0,
              moped: prevHubData?.stop?.capacity?.moped || 0,
              scooter: prevHubData?.stop?.capacity?.scooter || 0,
              cargo_bicycle: prevHubData?.stop?.capacity?.cargo_bicycle || 0,
              car: prevHubData?.stop?.capacity?.car || 0,
              other: prevHubData?.stop?.capacity?.other || 0
            }
          }
        };
      }
      return prevHubData;
    });
  }

  const updateCapacityValue = (key: string, value: number) => {
    if(! key) return;
    if(!value === undefined) return;

    setHasUnsavedChanges(true);

    setHubData(prevHubData => ({
      ...prevHubData,
      stop: {
        ...prevHubData.stop,
        capacity: {
          ...prevHubData.stop.capacity,
          [key]: value
        }
      }
    }));
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

  const getRelevantHubPhase = (active_phase, hub) => {
    if(active_phase === 'active') {
      // If this is a retirement concept but it's also still active: show active
      if(hub.phase === 'retirement_concept' && hub.retire_date === null) {
        return 'active';
      }
      else if(hub.phase === 'committed_retirement_concept' && moment(moment()).isBefore(hub.retire_date)) {
        return 'active';
      }
    }
    return hub.phase;
  }

  const labelClassNames = 'mb-2';
  const didChangeZoneConfig = false;

  const saveZone = async () => {
    // Remove certain properties based on the hub phase
    let fiteredHubData = Object.assign({}, hubData);
    if(fiteredHubData.phase === 'published'
        || fiteredHubData.phase === 'committed_concept'
        || fiteredHubData.phase === 'published'
        || fiteredHubData.phase === 'active'
    ) {
      delete fiteredHubData.area;
      delete fiteredHubData.name;
      delete fiteredHubData.description;
      delete fiteredHubData.geography_type;
      delete fiteredHubData.stop?.location;
    }

    // Remove capacity values that are 0
    if(fiteredHubData.stop?.capacity) {
      Object.keys(fiteredHubData.stop.capacity).forEach(key => {
        if(fiteredHubData.stop.capacity[key] === 0) {
          delete fiteredHubData.stop.capacity[key];
        }
      });
    }
    
    if(isNewZone) {
      const addedZone = await postHub(token, fiteredHubData);
      // Notify if something went wrong
      if(addedZone && addedZone.detail) {
        notify(toast, 'Er ging iets fout bij het opslaan: ' + addedZone?.detail, {
          title: 'Er ging iets fout',
          variant: 'destructive'
        })
        return;
      }
      if(addedZone && addedZone.zone_id) {
        notify(toast, 'Hub toegevoegd');
        postSaveOrDeleteCallback(addedZone.zone_id);
        setHubData(prevHubData => ({
          ...prevHubData,
          zone_id: addedZone.zone_id
        }));
      }
    }
    else {
      const updatedZone = await patchHub(token, fiteredHubData);
      if(updatedZone && updatedZone.detail) {
        notify(toast, 'Er ging iets fout bij het opslaan: ' + updatedZone?.detail, {
          title: 'Er ging iets fout',
          variant: 'destructive'
        })
        return;
      }
      postSaveOrDeleteCallback(updatedZone?.zone_id);
      notify(toast, 'Zone opgeslagen');
      dispatch(setShowEditForm(false));
    }
    setHasUnsavedChanges(false);
  }

  const cancelButtonHandler = () => {
    if(hasUnsavedChanges) {
      if(! window.confirm('Je hebt onopgeslagen wijzigen. Weet je zeker dat je door wilt gaan?')) {
        return;
      }
    }

    cancelHandler();
  };

  if(! selected_policy_hubs) return <></>;
  if(selected_policy_hubs.length > 1) {
    return <PolicyHubsEdit_bulk
      fetchHubs={fetchHubs}
      all_policy_hubs={all_policy_hubs}
      selected_policy_hubs={selected_policy_hubs}
      cancelHandler={cancelHandler}
      postSaveOrDeleteCallback={postSaveOrDeleteCallback}
    />
  };

  if(is_drawing_enabled && ! drawed_area) {
    return (
      <div>
        <div className={`${labelClassNames} font-bold`}>
          Zone {canEditHubs(acl) ?
            (isNewZone ? 'toevoegen' : 'wijzigen')
            : 'bekijken'
          }
        </div>
        <p className="my-2">
          Teken een gebied op de kaart.<br /><br />
          Indien gereed, klik op het punt waar je begonnen bent met tekenen om verder te gaan.
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

  const is_retirement_hub = false
      || hubData.phase === 'retirement_concept'
      || hubData.phase === 'retirement_committed_concept'
      || hubData.phase === 'committed_retirement_concept'
      || hubData.phase === 'published_retirement';

  const can_edit_hub_data = hubData.phase === 'concept'
      // || hubData.phase === 'retirement_concept';

  return (
    <div>
      <div className={`${labelClassNames} font-bold`}>
        Zone {canEditHubs(acl) ?
          (isNewZone ? 'toevoegen' : 'wijzigen')
          : 'bekijken'
        }
      </div>

      {hubData?.prev_geographies?.[0] && <div className="my-4">
        Deze hub is een nieuwe versie van een al eerder bestaande zone<u hidden className="cursor-pointer" title={hubData?.prev_geographies?.[0]}>deze hub</u>.
      </div>}

      {/* Committed concept data */}
      {(
        hubData.phase === 'committed_concept'
        || hubData.phase === 'retirement_concept'
        || hubData.phase === 'committed_retirement_concept'
        || hubData.phase === 'published_retirement'
        || hubData.phase === 'published'
        || hubData.phase === 'active'
      ) && <div className="my-4 rounded-lg bg-white border-solid border border-gray-400 p-4">
        <table className="w-full text-sm">
          <tbody>
            <tr>
              <th align="left" style={{verticalAlign: 'top'}}>
                Naam
              </th>
              <td valign="top">
                {hubData.name}
              </td>
            </tr>
            <tr>
              <th align="left" style={{verticalAlign: 'top'}}>
                Type
              </th>
              <td>
                {readable_geotype(hubData.geography_type)}
              </td>
            </tr>
            <tr>
              <th align="left" style={{verticalAlign: 'top'}}>
                Fase
              </th>
              <td valign="top">
                {readable_phase(getRelevantHubPhase(active_phase, hubData))}
              </td>
            </tr>
            {false && hubData.stop && <tr>
              <th align="left" style={{verticalAlign: 'top'}}>
                Fysiek of virtueel?
              </th>
              <td>
                {hubData.stop?.is_virtual ? 'Virtueel' : 'Fysiek'}
              </td>
            </tr>}
            <tr>
              <th align="left" style={{verticalAlign: 'top'}}>
                {moment(hubData.published_date).isBefore(moment()) ? 'Gepubliceerd op' : 'Publiceren op'}
              </th>
              <td valign='top'>
                {moment(hubData.published_date).format('DD-MM-YYYY HH:mm')}
              </td>
            </tr>
            <tr>
              <th align="left" style={{verticalAlign: 'top'}}>
                Geografie ID
              </th>
              <td valign='top'>
                <div 
                  onClick={(e) => {
                    e.stopPropagation();
                    navigator.clipboard.writeText(hubData.geography_id);
                    notify(toast, 'Geografie ID gekopieerd');
                  }}
                  className="cursor-pointer flex"
                  title="Klik om te kopiëren"
                >
                  <span className="overflow-hidden whitespace-nowrap text-ellipsis max-w-44">
                    {hubData.geography_id}
                  </span> <span>📄</span>
                </div>
              </td>
            </tr>
            <tr>
              <th align="left" style={{verticalAlign: 'top'}}>
                {moment(hubData.effective_date).isBefore(moment()) ? 'Geactiveerd op' : 'Activeren op'}
              </th>
              <td valign='top'>
                {moment(hubData.effective_date).format('DD-MM-YYYY HH:mm')}
              </td>
            </tr>
            {hubData.published_retire_date && <tr>
              <th align="left" style={{verticalAlign: 'top'}}>
                Archivering publiceren op
              </th>
              <td>
                {moment(hubData.published_retire_date).format('DD-MM-YYYY HH:mm')}
              </td>
            </tr>}
            {hubData.retire_date && <tr>
              <th align="left" style={{verticalAlign: 'top'}}>
                {moment(hubData.retire_date).isBefore(moment()) ? 'Gearchiveerd op' : 'Archiveren op'}
              </th>
              <td>
                {moment(hubData.retire_date).format('DD-MM-YYYY HH:mm')}
              </td>
            </tr>}
            {canEditHubs(acl) && <>
              <tr title={`Aangemaakt op ${moment(hubData.created_at).format('DD-MM-YYYY HH:mm')}`}>
                <th align="left" style={{verticalAlign: 'top'}}>
                  Gemaakt door
                </th>
                <td>
                  {hubData.created_by}
                </td>
              </tr>
              <tr title={`Gewijzigd op ${moment(hubData.modified_at).format('DD-MM-YYYY HH:mm')}`}>
                <th align="left" style={{verticalAlign: 'top'}}>
                  Gewijzigd door
                </th>
                <td>
                  {hubData.last_modified_by}
                </td>
              </tr>
            </>}
            {! canEditHubs(acl) && <>
              <tr>
                <th align="left" style={{verticalAlign: 'top'}}>
                  Gemaakt op
                </th>
                <td>
                  {moment(hubData.created_at).format('DD-MM-YYYY HH:mm')}
                </td>
              </tr>
              <tr>
                <th align="left" style={{verticalAlign: 'top'}}>
                    Gewijzigd op
                </th>
                <td>
                    {moment(hubData.modified_at).format('DD-MM-YYYY HH:mm')}
                </td>
              </tr>
            </>}
          </tbody>
        </table>
      </div>}

      {can_edit_hub_data && <div>
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
          disabled={! canEditHubs(acl)}
        />
      </div>}

      <div>
        <FormInput
          type="text"
          placeholder="Lokale ID (niet publiek)"
          name="internal_id"
          autoComplete="off"
          id="js-FilterbarZones-internal_id-input"
          value={hubData.internal_id || ""}
          onChange={changeHandler}
          classes="w-full mb-0"
          disabled={
            ! canEditHubs(acl) ||
            hubData.phase === 'published' ||
            hubData.phase === 'active' ||
            hubData.phase === 'published_retirement'
          }
        />
      </div>

      {can_edit_hub_data && <div className="relative">
        {! canEditHubs(acl) && <div className="absolute top-0 right-0 bottom-0 left-0" />}
        <PolicyHubsEdit_geographyType
          defaultStopProperties={defaultStopProperties}
          hubData={hubData}
          setHubData={setHubData}
          setHasUnsavedChanges={setHasUnsavedChanges}
        />
      </div>}
        
      <div className="relative">
        {! canEditHubs(acl) && <div className="absolute top-0 right-0 bottom-0 left-0" />}
        <PolicyHubsEdit_isVirtual
          hubData={hubData}
          setHubData={setHubData}
        />
      </div>

      {(true || ! is_retirement_hub) && <>

          <div className={`
              py-2
              relative
              ${hubData.geography_type === 'stop' ? 'visible' : 'invisible'}
          `}>
            {! canEditHubs(acl) && <div>
              <div className="absolute top-0 right-0 bottom-0 left-0" />
            </div>}
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
                  ${getZoneAvailability() === x.name ? 'Button-blue' : 'text-gray-500'}
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
                  updateZoneAvailability(x.name)
                }}
              >
                {x.title}
              </div>
              })}
            </div>
          </div>

          <div className={`${hubData.geography_type === 'stop' ? 'visible' : 'invisible'} relative`}>
            {! canEditHubs(acl) && <div>
              <div className="absolute top-0 right-0 bottom-0 left-0" />
            </div>}
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
                  value={hubData?.stop?.capacity?.combined || 50}
                  onChange={(e) => updateCapacityValue('combined', Number(e.target.value))}
              />}
              {getCapacityType() === 'modality' && <>
                <ModalityRow
                  imageUrl="https://i.imgur.com/IF05O8u.png"
                  name="vehicles-limit.bicycle"
                  value={hubData?.stop?.capacity?.bicycle || 0}
                  onChange={(e) => updateCapacityValue('bicycle', Number(e.target.value))}
                />
                <ModalityRow
                  imageUrl="https://i.imgur.com/FdVBJaZ.png"
                  name="vehicles-limit.cargo_bicycle"
                  value={hubData?.stop?.capacity?.cargo_bicycle || 0}
                  onChange={(e) => updateCapacityValue('cargo_bicycle', Number(e.target.value))}
                />
                <ModalityRow
                  imageUrl="https://i.imgur.com/h264sb2.png"
                  name="vehicles-limit.moped"
                  value={hubData?.stop?.capacity?.moped || 0}
                  onChange={(e) => updateCapacityValue('moped', Number(e.target.value))}
                />
                <ModalityRow
                  imageUrl="https://i.imgur.com/7Y2PYpv.png"
                  name="vehicles-limit.car"
                  value={hubData?.stop?.capacity?.car || 0}
                  onChange={(e) => updateCapacityValue('car', Number(e.target.value))}
                />
              </>}
            </div>
          </div>

      </>}

    <div className="flex w-full justify-between">

      <Button
        theme="white"
        style={{marginLeft: 0}}
        onClick={cancelButtonHandler}
      >
        Sluiten
      </Button>

      {canEditHubs(acl) && hubData.phase === 'concept' && <>
        {(! isNewZone) && <Button
            onClick={toggleDrawingForHub}
            theme={is_drawing_enabled ? `greenHighlighted` : ''}
        >
            ✒️
        </Button>}
        {! isNewZone && <Button
          onClick={(e) => {
            deleteZoneHandler(e, [hubData.geography_id], token, dispatch, setSelectedPolicyHubs, setShowEditForm, postSaveOrDeleteCallback);
          }}
        >
          🗑️
        </Button>}
      </>}

      {canEditHubs(acl) && <Button
        theme={didChangeZoneConfig ? `greenHighlighted` : `green`}
        style={{marginRight: 0}}
        onClick={saveZone}
      >
        Opslaan
      </Button>}

    </div>
  </div>
  )
}

export default PolicyHubsEdit;
