const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// Add 'xml' to assetExts so Metro can resolve Android Vector Drawables for @expo/ui
config.resolver.assetExts.push('xml');

module.exports = config;
