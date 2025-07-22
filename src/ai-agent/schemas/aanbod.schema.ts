import { ViewSchema } from '../types/ViewSchema';

export const aanbodSchema: ViewSchema = {
  view: 'aanbod',
  label: 'Aanbod',
  description: 'Bekijk het actuele aanbod van deelvoertuigen',
  filters: [
    {
      key: 'datetime',
      label: 'Datum/tijd',
      type: 'datetime',
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
      key: 'parkeerduur',
      label: 'Parkeerduur',
      type: 'enum',
      required: false,
      options: [
        { value: '<2d', label: '< 2 dagen' },
        { value: '<4d', label: '< 4 dagen' },
        { value: '<14d', label: '< 14 dagen' },
        { value: '>14d', label: '> 14 dagen' },
      ],
    },
    {
      key: 'voertuigtype',
      label: 'Voertuigtype',
      type: 'multiselect',
      required: false,
      options: [
        { value: 'fiets', label: 'Fiets' },
        { value: 'bakfiets', label: 'Bakfiets' },
        { value: 'scooter', label: 'Scooter' },
        { value: 'auto', label: 'Auto' },
        { value: 'onbekend', label: 'Onbekend' },
      ],
    },
    {
      key: 'aanbieders',
      label: 'Aanbieders',
      type: 'multiselect',
      required: false,
      options: [], // To be filled dynamically
    },
  ],
  layers: ['heatmap', 'clusters', 'voertuigen', 'zones'],
}; 