const { getDefaultConfig } = require("expo/metro-config");
const { withNativeWind } = require("nativewind/metro");

const config = getDefaultConfig(__dirname);

// Aquí le decimos a Metro que procese Tailwind usando nuestro archivo global.css
module.exports = withNativeWind(config, { input: "./global.css" });