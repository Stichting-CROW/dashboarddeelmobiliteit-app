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
      webpackConfig.watchOptions = {
        ...(webpackConfig.watchOptions || {}),
        poll: 1000,
      };

      // Load *.md files as raw strings so the Docs pages can bundle
      // their content at build time (no runtime GitHub API calls).
      // Must be inserted into CRA's `oneOf` chain before the
      // fallback asset/resource rule, otherwise markdown files get
      // emitted as static files and `require()` returns a URL.
      const oneOfRule = webpackConfig.module.rules.find((rule) =>
        Array.isArray(rule.oneOf)
      );
      if (oneOfRule) {
        oneOfRule.oneOf.unshift({
          test: /\.md$/,
          type: 'asset/source',
        });
      }

      return webpackConfig;
    },
  },
}
