export const update_url = (params) => {
    if(! params) return;

    let url = new URL(window.location.href)

    if(params.phase) {
        url.searchParams.set('phase', params.phase);
    }
    if(params.visible_layers) {
        url.searchParams.delete('visible');
        params.visible_layers.forEach((x) => {
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
