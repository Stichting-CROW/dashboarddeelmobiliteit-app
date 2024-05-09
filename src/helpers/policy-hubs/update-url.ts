const allowedLayerNames = [
  'append visible hub-concept',
  'verbodsgebied-concept',
  'monitoring-concept',
  'hub-committed_concept',
  'hub-concept',
  'hub-published',
  'hub-active',
  'hub-archive',
  'verbodsgebied-committed_concept',
  'verbodsgebied-published',
  'verbodsgebied-active',
  'verbodsgebied-archive',
];

export const update_url = (params) => {
    if(! params) return;

    let url = new URL(window.location.href)

    if(params.phase) url.searchParams.set('phase', params.phase);
    if(params.gm_code) url.searchParams.set('gm_code', params.gm_code);

    if(params.visible_layers) {
        url.searchParams.delete('visible');
        params.visible_layers.forEach((x) => {
            if(allowedLayerNames.indexOf(x) <= -1) {
                // console.log('update-url - layer name not allowed. Layer name: ', x)
                return;
            }
            url.searchParams.append('visible', x);
        })
    }
    if(params.selected) {
        url.searchParams.delete('selected');
        params.selected.forEach((x) => {
            url.searchParams.append('selected', x);
        })
    }
    window.history.pushState({}, '', url.href)
}
