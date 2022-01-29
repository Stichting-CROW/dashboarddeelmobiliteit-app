import {clustersPointLayer} from './common.js';

const layer = Object.assign({}, clustersPointLayer, {
  'id': 'rentals-origins-clusters-point',
  'source': 'rentals-origins-clusters',
  'layout': Object.assign({}, clustersPointLayer.layout, {
    'icon-image': ["concat", ['get', 'system_id'], '-r:', ['get', 'distance_bin']]
  }),
})

export default layer;
