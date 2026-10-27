# YouTube exercise demos

Open any workout session and tap **Watch YouTube demo** below the exercise name. The exercise library has the same action.

- A dark video screen embeds the YouTube player on Android/iOS and an iframe in browser builds. Play is manual; fullscreen, reload, and Open in YouTube controls are available.
- The resolver uses the current movement, including selected alternatives. Reference IDs are reused where available; no video is invented for missing entries.
- Find demo on YouTube opens a search for the exercise/equipment. Paste a watch, Shorts, live, embed, or youtu.be link to save a personal demo. Plain video IDs are also accepted.
- Saved IDs are validated and included in the existing transactional settings/backup flow. Old settings default to an empty map. Use default demo clears an override; ordinary preference resets retain the map.
- Typed workout inputs flush before video navigation. Leaving the video route or backgrounding the app unloads playback; hiding the browser tab also unloads its iframe.
- Native requests send the installed app identifier as the Referer, as required by YouTube. Browser iframe uses credentialless mode where supported for compatibility with SQLite's cross-origin isolation. Open in YouTube remains available for blocked embeds, private/restricted/deleted videos, unsupported browsers, or network errors.

## Build and checks

`artifacts/formwise-youtube-preview-arm64.apk` — 34,698,255 bytes. Local test signing, ARM64 Android, not a production release. Native assembleRelease passed (645 Gradle tasks), APK v2 signature verified, and new video route/actions/Referer confirmed in the packaged Hermes bundle.

SHA-256: `8718AA62493B9CEC4F2ACE43106935D0A5896EA3BB6673944FE66AE74DA409DE`.

34 domain/SQLite tests and 19 component/store/router tests passed (53 total). TypeScript, Expo lint, final web export, SDK compatibility, and Expo Doctor 20/20 passed. The screen tests mock the player; live YouTube playback/fullscreen/background handling and visual layout still need an ARM64 device/browser check. The previous x86 emulator could not launch ARM64 React Native libraries, so no runtime success is inferred from that attempt.
