import { ReactElement, useEffect, useState } from 'react';
import { useToast } from "../ui/use-toast"
import {getVehicleIconUrl} from '../../helpers/vehicleTypes';

import {
    fetch_hubs
} from '../../helpers/policy-hubs/fetch-hubs'

import {HubType} from '../../types/HubType';
import { DrawedAreaType } from '../../types/DrawedAreaType';

// Import API functions
import { readable_geotype, defaultStopProperties, readable_phase } from "../../helpers/policy-hubs/common"

import Button from '../Button/Button';
import Text from '../Text/Text';
import FormInput from '../FormInput/FormInput';
import { useDispatch, useSelector } from 'react-redux';
import { StateType } from '../../types/StateType';
import { notify } from '../../helpers/notify';
import { setHubsInDrawingMode, setIsDrawingEnabled, setSelectedPolicyHubs, setShowEditForm } from '../../actions/policy-hubs';
import moment from 'moment';
import { themes } from '../../themes';
import { HubStatsWidget } from '../HubStatsWidget/HubStatsWidget';

const Section = ({
  classes,
  style,
  children
}: {
  classes?: string,
  style?: object,
  children: any
}) => {
  return <div className={`p-4 bg-white rounded-lg border border-gray-300 ${classes}`} style={style}>
    {children}
  </div>
}

const HubStats = ({
  hubData
}): ReactElement => {
  if(! hubData) return <div />;
  if(! hubData.stop) return <div />;

  const stop = hubData.stop;

  // Color between green and red
  const perc2color = (perc) => {
    perc = 100 - perc;
    var r, g, b = 0;
    if(perc < 50) {
      r = 255;
      g = Math.round(5.1 * perc);
    }
    else {
      g = 255;
      r = Math.round(510 - 5.10 * perc);
    }
    var h = r * 0x10000 + g * 0x100 + b * 0x1;
    return '#' + ('000000' + h.toString(16)).slice(-6);
  }

  const calculateGradient = (number_of_vehicles, capacity) => {
    var ratio = Math.min(100.0, number_of_vehicles / capacity * 100);
    return perc2color(ratio);
  }

  const getNumPlacesAvailable = (stop) => {
    if(! stop) return;
    const realtimeData = stop.realtime_data;
    if(! realtimeData) return;
    if(! realtimeData.num_places_available) return;
  
    // If it's a combined capacity: return this capacity
    if(stop.capacity && stop.capacity.combined) {
      return stop.capacity.combined;
    }
  
    let total = 0;
    Object.keys(stop.capacity).forEach(key => {
      total += parseInt(stop.capacity[key]);
    });
  
    return total;
  }
  
  const getNumVehiclesAvailable = (realtimeData) => {
    if(! realtimeData) return;
    if(! realtimeData.num_vehicles_available) return;
  
    let total = 0;
    Object.keys(realtimeData.num_vehicles_available).forEach(key => {
      total += parseInt(realtimeData.num_vehicles_available[key]);
    });
  
    return total;
  }
  
  const getIndicatorColor = (parked, capacity) => {
    const pct = parseInt(parked)/parseInt(capacity)*100;
  
    if(isNaN(pct)) {
      return 'transparent';
    }
    return calculateGradient(parked, capacity);
  }

  if(! stop) return <>
    <div className="font-inter" style={{minWidth: '180px'}}>
      <div className="text-lg font-bold">
        ${hubData.name}
      </div>
    </div>
    </>
  if(! stop.realtime_data) return <div>
    Er zijn nog geen realtime statistieken beschikbaar voor deze zone.
  </div>;// Realtime data not yet loaded

  const isControlledAutomatically = stop.status.control_automatic === true;
  const isManuallySetToOpen = ! isControlledAutomatically && stop.status.is_returning === true;
  const isManuallySetToClosed = ! isControlledAutomatically && stop.status.is_returning === false;

  const getCapacityForModality = (capacity, modality) => {
    // Return nothing if no stop capacity was found
    if(! capacity || capacity.length === 0) return;
    // If it's a modality specific value: return value
    if(capacity[modality]) return capacity[modality];
    // If it's a combined value: return combined
    return capacity.combined;
  }

  const getAvailableForModality = (num_places_available, modality) => {
    // Return nothing if no stop capacity was found
    if(! num_places_available) return;
    if(! modality) return;

    if(num_places_available[modality]) return num_places_available[modality];
  }

  const getParkedVehiclesForModality = (num_vehicles_available, modality) => {
    // Return nothing if no stop capacity was found
    if(! num_vehicles_available || num_vehicles_available.length === 0) return;
    // If it's a modality specific value: return value
    if(num_vehicles_available[modality]) return num_vehicles_available[modality];
  }

  const modalityNameToModalityTitle = (modalityName) => {
    if(modalityName === 'moped') return 'scooters';
    if(modalityName === 'bicycle') return 'fietsen';
    if(modalityName === 'cargo_bicycle') return 'bakfietsen';
    if(modalityName === 'car') return 'auto\'s';
    if(modalityName === 'other') return 'overige voertuigen';
  }

  const renderModalityRows = (stop) => {
    if(! stop) return;

    // Loop modalities
    let element = [];
    Object.keys(stop.realtime_data.num_places_available).forEach(modalityName => {
      const parkedVehiclesForModality = getParkedVehiclesForModality(stop.realtime_data.num_vehicles_available, modalityName);
      const capacityForModality = getCapacityForModality(stop.capacity, modalityName);
      const availableForModality = getAvailableForModality(stop.realtime_data.num_places_available, modalityName);
      // Don't show row if no relevant data is available
      if(! parkedVehiclesForModality && ! capacityForModality) return;

      const getDotColor = () => {
        if(availableForModality > 0) {
          return themes.zone.quiet.primaryColor;
        } else {
          return themes.zone.busy.primaryColor;
        }
      }

      return element.push(
        <div className="flex my-1" style={{minWidth: '180px'}} key={modalityName}>
          <div className="mr-2 flex justify-center flex-col">
            <div
              className="rounded-full w-3 h-3" style={{background: getDotColor()}}
              title={`${availableForModality > 0 ? `Open voor` : `Gesloten voor`} ${modalityNameToModalityTitle(modalityName)}`}
            ></div>
          </div>
          <div className="mr-4 w-5">
            <img className="inline-block w-5" src={getVehicleIconUrl(modalityName)} alt={modalityName} style={{maxWidth: 'none'}} />
          </div>
          <div className="mr-2 flex justify-center flex-col">
            {parkedVehiclesForModality
                ? parkedVehiclesForModality
                : '0'
            }
            {stop.capacity && stop.capacity.combined
              ? ''
              : capacityForModality ? `/${capacityForModality}` : ''
            }
          </div>
        </div>
      );
    });

    return element;
  }

  const renderVisualIndicator = (numVehicles, numPlaces) => {
    if(! numVehicles) return <div />;
    if(! numPlaces) return <div />;

    // Calculate percentage
    const percentageOfVehiclesAvailable = parseInt(numVehicles)/parseInt(numPlaces)*100;

    return <div className="rounded-xl flex" style={{background: '#f6f5f4'}}>
      <div className="rounded-l-xl font-bold py-1 px-2" style={{
        backgroundColor: getIndicatorColor(numVehicles, numPlaces),
        minWidth: `${percentageOfVehiclesAvailable > 100 ? 100 : percentageOfVehiclesAvailable}%`
      }}>
        {percentageOfVehiclesAvailable > 100 ? 100 : Math.round(percentageOfVehiclesAvailable)}%
      </div>
      <div className="flex-1" />
    </div>
  }

  // num_places_available is het aantal beschikbare plkken
  const numPlacesAvailable = getNumPlacesAvailable(stop)
  // num_vehicles_available = Hoeveel voertuigen staan in dat gebied geparkeerd
  const numVehiclesAvailable = getNumVehiclesAvailable(stop.realtime_data)
  // Percentage
  const percentageOfVehiclesAvailable = numVehiclesAvailable/numPlacesAvailable*100;

  return <>
    <div className="font-inter">
      <div className="text-lg font-bold">
        {hubData.name}
      </div>
      <div className="mt-2 text-sm font-bold" hidden={isControlledAutomatically} style={{color: '#15aeef'}}>
        Instelling actief: <b>altijd {isManuallySetToOpen ? 'open' : 'gesloten'}</b>
      </div>
      <div className="mt-2 text-sm font-bold" hidden={(! numPlacesAvailable || isNaN(percentageOfVehiclesAvailable))}>
        Actuele bezetting: {numVehiclesAvailable}{isControlledAutomatically ? `/${numPlacesAvailable}` : ''}
      </div>
      <div className="mt-2 text-sm bg-green" hidden={(! numPlacesAvailable || isNaN(percentageOfVehiclesAvailable))}>
        {renderVisualIndicator(numVehiclesAvailable, numPlacesAvailable)}
      </div>
      <div className="mt-4 text-sm">
        {renderModalityRows(stop)}
      </div>
      <div className="mt-2 text-base" hidden>
        Scooter aanbieders:
      </div>
      <div className="mt-2 text-base" hidden>
        Andere aanbieders:
      </div>
      <div className="text-xs" hidden>
        (tellen niet mee voor capaciteit)
      </div>
      <div hidden>
        donkey: 25<br />
        htm: 4
      </div>
    </div>
  </>
}

const PolicyHubsStats = ({
    all_policy_hubs,
    selected_policy_hubs,
    cancelHandler,
}: {
    fetchHubs?: Function,
    all_policy_hubs: any,
    selected_policy_hubs: any,
    cancelHandler: Function,
}) => {
    const dispatch = useDispatch()

    // Get gebied / municipality code
    const gm_code = useSelector((state: StateType) => state.filter.gebied);

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

    const isNewZone = selected_policy_hubs && selected_policy_hubs[0] && selected_policy_hubs[0] === 'new';

    // Find hub data in array with all policy hubs
    const loadHubData = async (hub_id) => {
        const foundHub = all_policy_hubs.find(x => x.zone_id === hub_id);
        if(foundHub) {
            // Set hub data in local state
            setHubData(foundHub);
        }
    }

    const labelClassNames = 'mb-2';
        
    return (
      <div>
        <div className={`${labelClassNames} font-bold`}>
            Zone statistieken
        </div>

        <Section>
          <HubStats hubData={hubData} />
        </Section>

        <Section classes="mt-2 pt-0 pr-0 pb-1 pl-0">
          <HubStatsWidget zone_id={hubData.zone_id} />
        </Section>

        <div className="flex w-full justify-between">
          <Button
              theme="white"
              style={{marginLeft: 0}}
              onClick={cancelHandler}
          >
              Sluiten
          </Button>
      </div>
    </div>
  )
}

export default PolicyHubsStats;
