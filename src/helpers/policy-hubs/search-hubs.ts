import { HubType } from '../../types/HubType';

const SEARCHABLE_GEOGRAPHY_TYPES = ['stop', 'no_parking'];
const SEARCHABLE_PHASES = ['active', 'concept'];
const MAX_SEARCH_RESULTS = 10;

export const getSearchableZoneLayers = (isLoggedIn: boolean): string[] => {
  const layers = ['hub-active', 'verbodsgebied-active'];
  if (isLoggedIn) {
    layers.push('hub-concept', 'verbodsgebied-concept');
  }
  return layers;
};

const getDedupeKey = (hub: HubType): string => {
  return `${hub.name}|${hub.geography_type}`;
};

const isSearchableHub = (hub: HubType): boolean => {
  if (!hub.name?.trim()) return false;
  if (!SEARCHABLE_GEOGRAPHY_TYPES.includes(hub.geography_type || '')) return false;
  if (!SEARCHABLE_PHASES.includes(hub.phase || '')) return false;
  return true;
};

const getPhaseSortOrder = (phase?: string): number => {
  if (phase === 'active') return 0;
  if (phase === 'concept') return 1;
  return 2;
};

export const filterHubsForSearch = (hubs: HubType[], query: string): HubType[] => {
  const trimmedQuery = query.trim();
  if (!trimmedQuery) return [];

  const queryLower = trimmedQuery.toLowerCase();
  const deduped = new Map<string, HubType>();

  hubs.filter(isSearchableHub).forEach((hub) => {
    if (!hub.name?.toLowerCase().includes(queryLower)) return;

    const key = getDedupeKey(hub);
    const existing = deduped.get(key);

    if (!existing) {
      deduped.set(key, hub);
      return;
    }

    if (existing.phase !== 'active' && hub.phase === 'active') {
      deduped.set(key, hub);
    }
  });

  return Array.from(deduped.values())
    .sort((a, b) => {
      const phaseDiff = getPhaseSortOrder(a.phase) - getPhaseSortOrder(b.phase);
      if (phaseDiff !== 0) return phaseDiff;

      const aStartsWith = a.name!.toLowerCase().startsWith(queryLower);
      const bStartsWith = b.name!.toLowerCase().startsWith(queryLower);
      if (aStartsWith !== bStartsWith) return aStartsWith ? -1 : 1;

      return a.name!.localeCompare(b.name!, 'nl');
    })
    .slice(0, MAX_SEARCH_RESULTS);
};
