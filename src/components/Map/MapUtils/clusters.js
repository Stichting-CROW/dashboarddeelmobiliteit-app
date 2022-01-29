
// Init Cluster event handlers
export const initClusters = (theMap) => {
  ['vehicles-clusters', 'rentals-origins-clusters', 'rentals-destinations-clusters'].forEach(x => {
    theMap.on('click', x, function (e) {
      var features = theMap.queryRenderedFeatures(e.point, {
        layers: [x]
      });
      var clusterId = features[0].properties.cluster_id;
      theMap.getSource(x).getClusterExpansionZoom(
        clusterId,
        function (err, zoom) {
          if (err) return;
          theMap.easeTo({
            center: features[0].geometry.coordinates,
            zoom: zoom
          });
        }
      );
    });
    theMap.on('mouseenter', x, function () {
      theMap.getCanvas().style.cursor = 'pointer';
    });
    theMap.on('mouseleave', x, function () {
      theMap.getCanvas().style.cursor = '';
    });
  })
}
