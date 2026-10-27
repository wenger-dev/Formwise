const { withAndroidColors } = require('expo/config-plugins');

// Keep Android's system launch surface dark before the React Native screen is ready.
module.exports = (config) =>
  withAndroidColors(config, (mod) => {
    const colors = mod.modResults.resources.color ?? [];
    const existing = colors.find((color) => color.$?.name === 'splashscreen_background');
    const background = config.backgroundColor ?? '#101310';
    if (existing) existing._ = background;
    else colors.push({ $: { name: 'splashscreen_background' }, _: background });
    mod.modResults.resources.color = colors;
    return mod;
  });
