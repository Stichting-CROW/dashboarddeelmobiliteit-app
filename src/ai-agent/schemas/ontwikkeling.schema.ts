import { ViewSchema } from '../types/ViewSchema';

export const ontwikkelingSchema: ViewSchema = {
  view: 'ontwikkeling',
  label: 'Ontwikkeling',
  description: 'Analyseer trends in beschikbaarheid en verhuur over tijd',
  filters: [
    {
      key: 'periode',
      label: 'Periode',
      type: 'string', // Could be a date range picker in UI
      required: true,
    },
    {
      key: 'plaats',
      label: 'Plaats',
      type: 'enum',
      required: true,
      options: [], // To be filled dynamically
    },
    {
      key: 'zones',
      label: 'Zones',
      type: 'multiselect',
      required: false,
      options: [], // To be filled dynamically
    },
    {
      key: 'aanbieders',
      label: 'Aanbieders',
      type: 'multiselect',
      required: false,
      options: [], // To be filled dynamically
    },
    {
      key: 'interval',
      label: 'Interval',
      type: 'enum',
      required: true,
      options: [
        { value: 'dag', label: 'Dag' },
        { value: 'week', label: 'Week' },
        { value: 'maand', label: 'Maand' },
      ],
      default: 'dag',
    },
  ],
  layers: [], // No map layers, only charts in this view
}; 