const { withGradleProperties } = require('expo/config-plugins');

// Expo SDK 58 defaults to 1024. Windows' bundled Ninja needs object paths below 260.
module.exports = (config) =>
  withGradleProperties(config, (mod) => {
    const key = 'expo.android.cmakeObjectPathMax';
    const existing = mod.modResults.find((entry) => entry.type === 'property' && entry.key === key);
    if (existing) existing.value = '259';
    else mod.modResults.push({ type: 'property', key, value: '259' });
    return mod;
  });
