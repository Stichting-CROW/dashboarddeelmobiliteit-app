module.exports = {
  babel: {
    loaderOptions: {
      ignore: [
        "./node_modules/mapbox-gl/dist/mapbox-gl.js",
        "./node_modules/maplibre-gl/dist/maplibre-gl.js"
      ],
    },
  },
  webpack: {
    configure: (webpackConfig) => {
      const sourceMapLoaderRule = webpackConfig.module.rules.find(
        (rule) =>
          rule.enforce === 'pre' &&
          (
            (rule.loader &&
              typeof rule.loader === 'string' &&
              rule.loader.includes('source-map-loader')) ||
            (rule.use &&
              rule.use.some((use) => {
                if (typeof use === 'string') {
                  return use.includes('source-map-loader');
                }

                return (
                  use &&
                  use.loader &&
                  typeof use.loader === 'string' &&
                  use.loader.includes('source-map-loader')
                );
              }))
          )
      );

      if (sourceMapLoaderRule) {
        const currentExclude = sourceMapLoaderRule.exclude;

        if (Array.isArray(currentExclude)) {
          sourceMapLoaderRule.exclude = [
            ...currentExclude,
            /github-folder-tree/,
          ];
        } else if (currentExclude) {
          sourceMapLoaderRule.exclude = [
            currentExclude,
            /github-folder-tree/,
          ];
        } else {
          sourceMapLoaderRule.exclude = [/github-folder-tree/];
        }
      }

      return webpackConfig;
    },
  },
}
