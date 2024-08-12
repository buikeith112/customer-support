// next.config.js or next.config.cjs
module.exports = {
  webpack: (config, { isServer }) => {
    // Exclude .node files from being processed by other loaders
    config.module.rules.push({
      test: /\.node$/,
      use: 'node-loader',
    });

    // Fixes npm packages that depend on `fs` module
    if (!isServer) {
      config.node = {
        fs: 'empty',
      };
    }

    return config;
  },
};
