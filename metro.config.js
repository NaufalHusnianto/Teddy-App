const { getDefaultConfig } = require("@expo/metro-config");

const config = getDefaultConfig(__dirname);
config.resolver.sourceExts.push("cjs");
config.resolver.unstable_enablePackageExports = false;

config.transformer = {
  ...config.transformer,
  assetPlugins: ["expo-asset/tools/hashAssetFiles"],
};

module.exports = config;
