import React, { useMemo } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  DndContext,
  closestCenter,
  PointerSensor,
  TouchSensor,
  useSensor,
  useSensors,
  DragEndEvent
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  useSortable,
  verticalListSortingStrategy
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Check, GripVertical } from 'lucide-react';

import { useDataLayer } from '../Map/MapUtils/useDataLayer';
import { setDataLayerOrder, toggleOverlayLayer, setOverlayPhase } from '../../actions/layers';
import { toggleVisibleLayer } from '../../actions/policy-hubs';
import { get_phases } from '../../helpers/policy-hubs/get-phases';
import {
  selectActiveDataLayers,
  selectDataLayerOrder,
  selectOverlayLayers,
  isOverlayLayerEnabled,
  isParkLayerActive,
  isRentalsLayerActive
} from '../../helpers/layerSelectors';
import { StateType } from '../../types/StateType';
import {
  DISPLAYMODE_PARK,
  DISPLAYMODE_RENTALS,
  DISPLAYMODE_POLICY_HUBS,
  DISPLAYMODE_PARKEERDATA_VOERTUIGEN,
  DISPLAYMODE_PARKEERDATA_CLUSTERS,
  DISPLAYMODE_PARKEERDATA_HEATMAP,
  DISPLAYMODE_VERHUURDATA_VOERTUIGEN,
  DISPLAYMODE_VERHUURDATA_CLUSTERS,
  DISPLAYMODE_VERHUURDATA_HEATMAP,
  DISPLAYMODE_VERHUURDATA_HB,
  DATA_LAYER_ORDER_GROUP,
  DATA_LAYER_ORDER_CBS,
  DATA_LAYER_ORDER_SERVICE_AREAS,
  DATA_LAYER_ORDER_HUBS,
  DATA_LAYER_ORDER_VERBODSGEBIEDEN,
  VALID_OVERLAY_PHASES,
  DEFAULT_DATA_LAYER_ORDER
} from '../../reducers/layers.js';

interface DataLayerListProps {
  displayMode: string;
  isLoggedIn: boolean;
  isOperatorUser: boolean;
  zonesVisible: boolean;
}

interface VisualizationOption {
  id: string;
  label: string;
}

interface SortableRowProps {
  id: string;
  disabled: boolean;
  children: React.ReactNode;
}

const PARK_OPTIONS: VisualizationOption[] = [
  {
    id: DISPLAYMODE_PARKEERDATA_VOERTUIGEN,
    label: 'Aanbod als losse voertuigen'
  },
  {
    id: DISPLAYMODE_PARKEERDATA_CLUSTERS,
    label: 'Aanbod als clusters'
  },
  {
    id: DISPLAYMODE_PARKEERDATA_HEATMAP,
    label: 'Aanbod als heat map'
  }
];

const OVERLAY_LABELS: { [id: string]: string } = {
  [DATA_LAYER_ORDER_SERVICE_AREAS]: 'Servicegebieden',
  [DATA_LAYER_ORDER_HUBS]: 'Hubs',
  [DATA_LAYER_ORDER_VERBODSGEBIEDEN]: 'Verbodsgebieden'
};

// Map overlay list ids to the prefix used in policy_hubs.visible_layers
const POLICY_HUBS_LAYER_PREFIX: { [id: string]: string } = {
  [DATA_LAYER_ORDER_HUBS]: 'hub',
  [DATA_LAYER_ORDER_VERBODSGEBIEDEN]: 'verbodsgebied'
};

const PHASE_OPTIONS = VALID_OVERLAY_PHASES.map((phase: string) => ({
  value: phase,
  label: get_phases()[phase]?.title || phase
}));

const RENTALS_OPTIONS: VisualizationOption[] = [
  {
    id: DISPLAYMODE_VERHUURDATA_VOERTUIGEN,
    label: 'Verhuringen als losse voertuigen'
  },
  {
    id: DISPLAYMODE_VERHUURDATA_CLUSTERS,
    label: 'Verhuringen als clusters'
  },
  {
    id: DISPLAYMODE_VERHUURDATA_HEATMAP,
    label: 'Verhuringen als heat map'
  },
  {
    id: DISPLAYMODE_VERHUURDATA_HB,
    label: 'Verhuringen als HB matrix'
  }
];

const SortableRow = ({ id, disabled, children }: SortableRowProps) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging
  } = useSortable({ id, disabled });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.85 : undefined,
    zIndex: isDragging ? 2 : undefined
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`DataLayerList-item${disabled ? ' is-disabled' : ''}${isDragging ? ' is-dragging' : ''}`}
    >
      <button
        type="button"
        className="DataLayerList-handle"
        aria-label="Sleep om de z-positie te wijzigen"
        disabled={disabled}
        {...attributes}
        {...listeners}
      >
        <GripVertical size={16} />
      </button>
      <div className="DataLayerList-itemBody">
        {children}
      </div>
    </div>
  );
};

const DataLayerList = ({
  displayMode,
  isLoggedIn,
  isOperatorUser,
  zonesVisible
}: DataLayerListProps) => {
  const dispatch = useDispatch();
  const { setSingleLayer } = useDataLayer();
  const activeDataLayers = useSelector(selectActiveDataLayers);
  const dataLayerOrder = useSelector(selectDataLayerOrder);
  const overlayLayers = useSelector(selectOverlayLayers);

  const isPolicyHubsPage = displayMode === DISPLAYMODE_POLICY_HUBS;

  // Policy hubs state, used for the Hubs/Verbodsgebieden rows on /map/beleidshubs
  const policyHubsActivePhase = useSelector((state: StateType) => {
    return (state.policy_hubs && state.policy_hubs.active_phase) || 'active';
  });
  const policyHubsVisibleLayers = useSelector((state: StateType) => {
    return state.policy_hubs ? (state.policy_hubs.visible_layers || []) : [];
  });

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 6 }
    }),
    useSensor(TouchSensor, {
      activationConstraint: { delay: 150, tolerance: 5 }
    })
  );

  const storedOrder = useMemo(() => {
    const fallback = DEFAULT_DATA_LAYER_ORDER[displayMode] || [
      DATA_LAYER_ORDER_GROUP,
      DATA_LAYER_ORDER_CBS
    ];
    const current = dataLayerOrder[displayMode] || fallback;
    if (!isLoggedIn) {
      return current.filter((id: string) => id !== DATA_LAYER_ORDER_CBS);
    }
    return current;
  }, [dataLayerOrder, displayMode, isLoggedIn]);

  const isItemChecked = (id: string) => {
    if (id === DATA_LAYER_ORDER_GROUP) return true;
    if (id === DATA_LAYER_ORDER_CBS) return zonesVisible;
    if (id === DATA_LAYER_ORDER_SERVICE_AREAS) {
      return isOverlayLayerEnabled(overlayLayers, displayMode, id);
    }
    if (id === DATA_LAYER_ORDER_HUBS || id === DATA_LAYER_ORDER_VERBODSGEBIEDEN) {
      // On the beleidshubs page these rows reflect the policy hubs visible layers
      if (isPolicyHubsPage) {
        return policyHubsVisibleLayers.includes(`${POLICY_HUBS_LAYER_PREFIX[id]}-${policyHubsActivePhase}`);
      }
      return isOverlayLayerEnabled(overlayLayers, displayMode, id);
    }
    return false;
  };

  const visualOrder = useMemo(() => {
    const checked = storedOrder.filter(isItemChecked);
    const unchecked = storedOrder.filter((id: string) => !isItemChecked(id));
    return [...checked, ...unchecked];
  }, [
    storedOrder,
    zonesVisible,
    overlayLayers,
    displayMode,
    isPolicyHubsPage,
    policyHubsVisibleLayers,
    policyHubsActivePhase
  ]);

  const visualizationOptions = useMemo(() => {
    if (displayMode === DISPLAYMODE_PARK) {
      return PARK_OPTIONS;
    }
    if (displayMode === DISPLAYMODE_RENTALS) {
      return isOperatorUser
        ? RENTALS_OPTIONS.filter((option) => option.id !== DISPLAYMODE_VERHUURDATA_HB)
        : RENTALS_OPTIONS;
    }
    return [];
  }, [displayMode, isOperatorUser]);

  const isVisualizationActive = (layerName: string) => {
    if (displayMode === DISPLAYMODE_PARK) {
      return isParkLayerActive(activeDataLayers, layerName);
    }
    return isRentalsLayerActive(activeDataLayers, layerName);
  };

  const handleVisualizationSelect = (layerName: string) => {
    setSingleLayer(layerName, displayMode);
  };

  const moveItemToTop = (id: string) => {
    dispatch(setDataLayerOrder(displayMode, [
      id,
      ...storedOrder.filter((x: string) => x !== id)
    ]));
  };

  const handleCbsToggle = () => {
    const willBeVisible = !zonesVisible;
    dispatch({ type: 'LAYER_TOGGLE_ZONES_VISIBLE', payload: null });
    if (willBeVisible) {
      moveItemToTop(DATA_LAYER_ORDER_CBS);
    }
  };

  const handleOverlayToggle = (id: string) => {
    const willBeVisible = !isItemChecked(id);

    if (isPolicyHubsPage && POLICY_HUBS_LAYER_PREFIX[id]) {
      // On the beleidshubs page, toggle the corresponding policy hubs visible layer
      dispatch(toggleVisibleLayer(`${POLICY_HUBS_LAYER_PREFIX[id]}-${policyHubsActivePhase}`));
    } else {
      dispatch(toggleOverlayLayer(displayMode, id));
    }

    if (willBeVisible) {
      moveItemToTop(id);
    }
  };

  const handleOverlayPhaseChange = (id: string, phase: string) => {
    dispatch(setOverlayPhase(id, phase));
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const activeId = String(active.id);
    const overId = String(over.id);

    if (!isItemChecked(activeId) || !isItemChecked(overId)) return;

    const oldIndex = visualOrder.indexOf(activeId);
    const newIndex = visualOrder.indexOf(overId);
    if (oldIndex < 0 || newIndex < 0) return;

    const newVisual = arrayMove(visualOrder, oldIndex, newIndex);
    const newChecked = newVisual.filter(isItemChecked);
    const newUnchecked = storedOrder.filter((id: string) => !isItemChecked(id));
    dispatch(setDataLayerOrder(displayMode, [...newChecked, ...newUnchecked]));
  };

  const renderGroupCard = () => (
    <div className="DataLayerList-group">
      <div className="DataLayerList-groupHint">1 van deze is actief</div>
      <div className="DataLayerList-radios" role="radiogroup" aria-label="Visualisatie">
        {visualizationOptions.map((option) => {
          const isActive = isVisualizationActive(option.id);
          return (
            <button
              key={option.id}
              type="button"
              role="radio"
              aria-checked={isActive}
              className={`DataLayerList-radio${isActive ? ' is-active' : ''}`}
              onClick={() => handleVisualizationSelect(option.id)}
            >
              <span className={`DataLayerList-radioMark${isActive ? ' is-checked' : ''}`}>
                {isActive && <Check size={12} strokeWidth={3} />}
              </span>
              <span className="DataLayerList-radioLabel">{option.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );

  const renderCbsRow = () => (
    <button
      type="button"
      className={`DataLayerList-checkRow${zonesVisible ? ' is-active' : ''}`}
      onClick={handleCbsToggle}
      aria-pressed={zonesVisible}
    >
      <span className={`DataLayerList-checkbox${zonesVisible ? ' is-checked' : ''}`}>
        {zonesVisible && <Check size={12} strokeWidth={3} />}
      </span>
      <span className="DataLayerList-checkLabel">CBS-gebied</span>
    </button>
  );

  const renderOverlayRow = (id: string) => {
    const checked = isItemChecked(id);
    const showPhaseSelect = !isPolicyHubsPage
      && (id === DATA_LAYER_ORDER_HUBS || id === DATA_LAYER_ORDER_VERBODSGEBIEDEN);

    return (
      <div
        className={`DataLayerList-checkRow${checked ? ' is-active' : ''}`}
        role="button"
        tabIndex={0}
        aria-pressed={checked}
        onClick={() => handleOverlayToggle(id)}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            handleOverlayToggle(id);
          }
        }}
      >
        <span className={`DataLayerList-checkbox${checked ? ' is-checked' : ''}`}>
          {checked && <Check size={12} strokeWidth={3} />}
        </span>
        <span className="DataLayerList-checkLabel">{OVERLAY_LABELS[id]}</span>
        {showPhaseSelect && (
          <select
            className="DataLayerList-phaseSelect"
            value={overlayLayers.phases[id]}
            aria-label={`Fase voor ${OVERLAY_LABELS[id]}`}
            onClick={(e) => e.stopPropagation()}
            onKeyDown={(e) => e.stopPropagation()}
            onChange={(e) => handleOverlayPhaseChange(id, e.target.value)}
          >
            {PHASE_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        )}
      </div>
    );
  };

  const renderItem = (id: string) => {
    const checked = isItemChecked(id);
    const isOverlayRow = id === DATA_LAYER_ORDER_SERVICE_AREAS
      || id === DATA_LAYER_ORDER_HUBS
      || id === DATA_LAYER_ORDER_VERBODSGEBIEDEN;
    return (
      <SortableRow key={id} id={id} disabled={!checked}>
        {id === DATA_LAYER_ORDER_GROUP && renderGroupCard()}
        {id === DATA_LAYER_ORDER_CBS && renderCbsRow()}
        {isOverlayRow && renderOverlayRow(id)}
      </SortableRow>
    );
  };

  return (
    <div className="DataLayerList">
      <p className="DataLayerList-zHint">Bovenste laag ligt over lagen eronder</p>
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
      >
        <SortableContext items={visualOrder} strategy={verticalListSortingStrategy}>
          {visualOrder.map(renderItem)}
        </SortableContext>
      </DndContext>
    </div>
  );
};

export default DataLayerList;
