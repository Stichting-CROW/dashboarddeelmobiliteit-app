import {clustersPointLayer} from './common.js';

const layer = Object.assign({}, clustersPointLayer, {
  'id': 'rentals-destinations-clusters-point',
  'source': 'rentals-destinations-clusters',
  'layout': Object.assign({}, clustersPointLayer.layout, {
    'icon-image': ["concat", ['get', 'system_id'], '-r:', ['get', 'distance_bin']]
  }),
})

export default layer;
