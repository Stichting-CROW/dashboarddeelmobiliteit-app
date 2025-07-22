import { ViewSchema } from '../types/ViewSchema';

export const verhuringenSchema: ViewSchema = {
  view: 'verhuringen',
  label: 'Verhuringen',
  description: 'Bekijk verhuurdata van deelvoertuigen',
  filters: [
    {
      key: 'eindtijd',
      label: 'Eindtijd',
      type: 'datetime',
      required: true,
    },
    {
      key: 'periode',
      label: 'Periode',
      type: 'enum',
      required: true,
      options: [
        { value: '1h', label: '1 uur' },
        { value: '4h', label: '4 uur' },
        { value: '8h', label: '8 uur' },
        { value: '1d', label: '1 dag' },
        { value: '2d', label: '2 dagen' },
        { value: '3d', label: '3 dagen' },
      ],
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
      key: 'afstand',
      label: 'Afstand',
      type: 'enum',
      required: false,
      options: [
        { value: '1km', label: '1km' },
        { value: '2km', label: '2km' },
        { value: '5km', label: '5km' },
        { value: '>5km', label: '>5km' },
      ],
    },
    {
      key: 'herkomstbestemming',
      label: 'Herkomst of bestemming?',
      type: 'enum',
      required: true,
      options: [
        { value: 'herkomst', label: 'Herkomst' },
        { value: 'bestemming', label: 'Bestemming' },
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
  layers: ['HB', 'heatmap', 'clusters', 'voertuigen', 'zones'],
}; 