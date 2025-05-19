import {
  setHubsInDrawingMode,
  setSelectedPolicyHubs,
  setIsDrawingEnabled,
  setVisibleLayers,
  setShowEditForm,
  setShowList,
  setHubRefetchCounter
} from '../../actions/policy-hubs'
import { getGeoIdForZoneIds, sortZonesInPreferedOrder } from '../../helpers/policy-hubs/common';
import { proposeRetirement } from '../../helpers/policy-hubs/propose-retirement';

import { makeConcept } from '../../helpers/policy-hubs/make-concept';
import { notify } from '../../helpers/notify';

import { canEditHubs } from '../../helpers/authentication';
import { useDispatch, useSelector } from "react-redux";
import { StateType } from "@/src/types/StateType";

import Button from '../Button/Button';
import { ActionButtons } from "../ActionButtons/ActionButtons";
import { useToast } from '../ui/use-toast';
import { enableDrawingPolygon } from '../Map/MapUtils/map.policy_hubs.draw';

const PolicyHubsActionBar = ({
  draw,
  policyHubs,
  fetchHubs,
  drawed_area,
  setDrawedArea,
  setIsDrawingMultiPolygonActive
}) => {
  const dispatch = useDispatch();
  const { toast } = useToast()

  const acl = useSelector((state: StateType) => state.authentication?.user_data?.acl);
  const token = useSelector((state: StateType) => {
    if(state.authentication && state.authentication.user_data) {
      return state.authentication.user_data.token;
    }
    return null;
  });
  const is_stats_or_manage_mode = useSelector((state: StateType) => state.policy_hubs.is_stats_or_manage_mode || 'stats');
  const is_drawing_enabled = useSelector((state: StateType) => state.policy_hubs ? state.policy_hubs.is_drawing_enabled : []);
  const active_phase = useSelector((state: StateType) => state.policy_hubs ? state.policy_hubs.active_phase : '');
  const show_commit_form = useSelector((state: StateType) => state.policy_hubs ? state.policy_hubs.show_commit_form : false);
  const selected_policy_hubs = useSelector((state: StateType) => {
    return state.policy_hubs ? state.policy_hubs.selected_policy_hubs : [];
  });
  const hub_refetch_counter = useSelector((state: StateType) => state.policy_hubs ? state.policy_hubs.hub_refetch_counter : 0);

  // Add handler for the "Voeg stukje multipolygon toe" button
  const handleAddPolygon = () => {
    if (!draw) return;

    // Store existing features
    const existingFeatures = draw.getAll().features;
    if (existingFeatures.length === 0) {
      notify(toast, 'Teken eerst een polygon voordat je een nieuwe toevoegt', {
        variant: 'destructive'
      });
      return;
    }

    // Set the drawing mode to multi polygon
    setIsDrawingMultiPolygonActive(true);

    // Set the drawed area to the existing features
    setDrawedArea({
      features: existingFeatures,
      type: 'draw.create'
    });

    // Enable drawing mode for new polygon
    enableDrawingPolygon(draw);

  };


  const didSelectHub = () => {
    // If we did draw a new polygon, return true
    if(selected_policy_hubs && selected_policy_hubs[0] === 'new') return true;
    // Oth`erwise: Check if a hub is selected
    return getSelectedHub() ? true : false;
  }

  const didSelectOneHub = () => {
    if(! selected_policy_hubs || selected_policy_hubs.length <= 0) {
      return false;
    }
    // Check if only 1 hub was selected
    const didSelectOneHub = selected_policy_hubs.length === 1;
    if(! didSelectOneHub) return false;

    return true;
  }

  const getSelectedHub = () => {
    if(! selected_policy_hubs || selected_policy_hubs.length <= 0) {
      return false;
    }
    
    if(! policyHubs || policyHubs.length <= 0) return;

    const selected_hub = policyHubs.find(x => selected_policy_hubs && x.zone_id === selected_policy_hubs[0]);
    if(! selected_hub) return false;

    return selected_hub;
  }

  const getSelectedHubs = () => {
    if(! selected_policy_hubs || selected_policy_hubs.length <= 0) {
      return [];
    }
    
    if(! policyHubs || policyHubs.length <= 0) return [];

    return policyHubs.filter(x => selected_policy_hubs.indexOf(x.zone_id) > -1);
  }

  const didSelectConceptHub = () => {
    if(! didSelectHub()) return;

    // Get extra hub info
    if(! policyHubs || policyHubs.length <= 0) return;

    // Hub phases we want to keep
    const wantedHubPhases = [
      'concept',
    ];
    // If we are not in ACTIVE phase, we also want to keep retirement_concepts
    if(active_phase !== 'active') {
      wantedHubPhases.push('retirement_concept');
    }

    // Every selected hub should be a concept hub
    const unwantedHubs = policyHubs.filter(x => selected_policy_hubs.indexOf(x.zone_id) > -1).filter((x) => {
      return wantedHubPhases.indexOf(x.phase) <= -1;
    })

    const didSelectUnwantedHubs = unwantedHubs?.length > 0;

    return unwantedHubs?.length === 0;
  }

  const didSelectCommittedConceptHub = () => {
    // Get extra hub info
    if(! policyHubs || ! policyHubs[0]) return;
    const selected_hub = policyHubs.find(x => selected_policy_hubs && x.zone_id === selected_policy_hubs[0]);
    if(! selected_hub) return false;

    // Return if hub is a concept hub
    return selected_hub.phase === 'committed_concept';
  }

  const didSelectPublishedHub = () => {
    if(! didSelectOneHub()) return;

    // Get extra hub info
    if(! policyHubs || ! policyHubs[0]) return;
    const selected_hub = policyHubs.find(x => selected_policy_hubs && x.zone_id === selected_policy_hubs[0]);
    if(! selected_hub) return false;
    
    // Return if hub is a concept hub
    return selected_hub.phase === 'published';
  }

  const didSelectActiveHub = () => {
    if(! didSelectOneHub()) return;

    // Get extra hub info
    if(! policyHubs || ! policyHubs[0]) return;
    const selected_hub = policyHubs.find(x => selected_policy_hubs && x.zone_id === selected_policy_hubs[0]);
    if(! selected_hub) return false;
    
    // Return if hub is a concept hub
    return selected_hub.phase === 'active';
  }

  const didSelectCommittedRetirementHub = () => {
    if(! didSelectOneHub()) return;

    // Get extra hub info
    if(! policyHubs || ! policyHubs[0]) return;
    const selected_hub = policyHubs.find(x => selected_policy_hubs && x.zone_id === selected_policy_hubs[0]);
    if(! selected_hub) return false;
    
    // Return if hub is a concept hub
    return selected_hub.phase === 'committed_retirement_concept';
  }

  const didSelectAnyMonitoringHubs = () => {
    if(! didSelectHub()) return;
    if(! policyHubs || policyHubs.length <= 0) return;

    // Hub geotypes we want to keep
    const wantedGeoTypes = [
      'monitoring'
    ];

    // At least one hub should be a monitoring hub
    const monitoringHubs = policyHubs.filter(x => selected_policy_hubs.indexOf(x.zone_id) > -1).filter((x) => {
      return wantedGeoTypes.indexOf(x.geography_type) > -1;
    })

    return monitoringHubs?.length > 0;
  }

  const commitToConcept = (zone_id) => {
    dispatch({
      type: 'SET_SHOW_COMMIT_FORM',
      payload: true
    });
  }

  return <>

    {(canEditHubs(acl) && is_stats_or_manage_mode === 'manage') && <ActionButtons>
      {/* Teken hub button */}
      {(! is_drawing_enabled && active_phase === 'concept') && 
        <Button theme="white" onClick={() => {
          dispatch(setIsDrawingEnabled('new'))
          dispatch(setSelectedPolicyHubs([]))
          // Reset drawed area so we start fresh
          setDrawedArea(undefined);
        }}>
          Teken nieuwe zone
        </Button>
      }

      {(
        // If drawing enabled AND 
        (is_drawing_enabled === 'new' && drawed_area)
        || (is_drawing_enabled && is_drawing_enabled !== 'new' && didSelectConceptHub())
      ) && (
        <Button 
          theme="white" 
          onClick={handleAddPolygon}
        >
          Voeg stukje multipolygon toe
        </Button>
      )}

      {/* Vaststellen button */}
      {(didSelectConceptHub()
        && ! didSelectAnyMonitoringHubs()
        && ! show_commit_form
      ) && 
        <Button theme="white" onClick={() => commitToConcept(selected_policy_hubs ? selected_policy_hubs[0] : null)}>
          Vaststellen
        </Button>
      }

      {/* Terug naar concept button */}
      {((didSelectCommittedConceptHub() || didSelectCommittedRetirementHub()) && ! show_commit_form) && 
        <Button theme="red" onClick={async () => {
          await makeConcept(token, getSelectedHubs().map(x => x.geography_id));
          if(! window.confirm('Wil je de vastgestelde hub(s) terugzetten naar de conceptfase?')) {
            return;
          }

          notify(toast, 'De hub(s) is/zijn teruggezet naar de conceptfase');

          dispatch(setSelectedPolicyHubs([]));
          dispatch(setShowEditForm(false));
          fetchHubs();
        }}>
          Terugzetten naar concept
        </Button>
      }

      {/* 'Nieuw concept op basis van' button */}
      {(didSelectPublishedHub() || didSelectActiveHub()) && <>
        <Button theme="white" onClick={async () => {
          if(! window.confirm('Wil je een wijziging aanbrengen in deze definitieve hub d.w.z. een nieuwe concepthub maken? Klik dan op OK')) {
            return;
          }
          await makeConcept(token, [getSelectedHub()?.geography_id]);
          notify(toast, 'De hub is omgezet naar een nieuw concept');
          dispatch(setSelectedPolicyHubs([]));
          dispatch(setShowEditForm(false));
          fetchHubs();
        }}>
          Omzetten naar nieuw concept
        </Button>
      </>}

      {(didSelectPublishedHub() || didSelectActiveHub()) && <>
        <Button theme="white" onClick={async () => {
          if(! window.confirm('Wil je voorstellen deze hub te verwijderen? Er komt dan een voorstel tot verwijderen in de conceptfase.')) {
            return;
          }
          try {
            const selectedGeoIds = getGeoIdForZoneIds(policyHubs, selected_policy_hubs);
            const response = await proposeRetirement(token, selectedGeoIds);
    
            if(response && response.detail) {
                // Give error if something went wrong
                notify(
                  toast,
                  'Er ging iets fout bij het voorstellen tot verwijderen',
                  {
                    title: 'Er ging iets fout',
                    variant: 'destructive'
                  }
                );
            }
            else {
              notify(toast, 'Het verwijdervoorstel is toegevoegd, zie de conceptfase');
              dispatch(setShowEditForm(false));
              dispatch(setHubRefetchCounter(hub_refetch_counter+1))
            }
          } catch(err) {
              console.error('Delete error', err);
          }
        }}>
          Voorstel tot verwijderen
        </Button>
      </>}
    </ActionButtons>}

  </>
}

export default PolicyHubsActionBar;