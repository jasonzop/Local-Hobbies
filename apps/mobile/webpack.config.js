const createExpoWebpackConfigAsync = require("@expo/webpack-config");

module.exports = async function (env, argv) {
  const config = await createExpoWebpackConfigAsync(env, argv);

  // Proxy API calls through the web dev server (same origin as the web app)
  config.devServer = {
    ...(config.devServer || {}),
    proxy: {
      "/api": {
        target: "http://127.0.0.1:8080",
        changeOrigin: true,
        secure: false,
        pathRewrite: { "^/api": "" },
      },
    },
  };

  return config;
};
