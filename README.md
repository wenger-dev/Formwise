# Formwise

A local-first React Native fitness app for Android, built with Expo SDK 58, TypeScript, Expo Router, SQLite, Zustand, Zod, and native SVG charts. Dark charcoal surfaces, lime accents, rounded cards, and a locally rendered athlete illustration take inspiration from the supplied design reference.

The app includes five tabs, optional onboarding, editable profiles, seven customizable starter templates, seventeen offline exercise guides, custom plans, guided sessions, set logging, a rest timer, session recovery, workout history and corrections, real-data progress charts and records, goals, optional bodyweight tracking, preferences, versioned backup restoration, and native reminder scheduling.

New installations have **no completed sessions, records, or fabricated progress**. Starter templates are labeled as templates. There is no account, server, subscription, analytics SDK, or remote exercise-media dependency.

## Run locally

Use Node 24 LTS and npm. From PowerShell:

```powershell
cd C:\Users\gutab\Videos\gym_app
npm ci
npm start -- --port 8097
```

For the browser build:

```powershell
npm run web -- --port 8097
```

Open `http://localhost:8097`. Browser SQLite requires a secure context (localhost qualifies), workers, WebAssembly, and cross-origin isolation. `metro.config.js` supplies the required COOP/COEP headers. A deployed static web export needs those same headers and SPA route fallback. Browser storage belongs to that browser profile and origin; it does not share data with the Android app. Browser private mode/storage restrictions may prevent SQLite initialization.

## Run on Android

Use an Android emulator or a USB-connected Android device with debugging enabled. Install Android Studio's SDK/NDK/CMake requirements and JDK 17. SDK components required by the generated project may be downloaded on the first build. The React Native Gradle plugins specifically request a JDK 17 toolchain even if Gradle itself starts with a newer JDK.

```powershell
$env:ANDROID_HOME = "$env:LOCALAPPDATA\Android\Sdk"
$env:JAVA_HOME = "$env:USERPROFILE\.gradle\jdks\eclipse_adoptium-17-amd64-windows.2"
npx expo run:android --device --port 8097
```

That JDK path was provisioned and verified on this machine during the build attempt; on another computer, set `JAVA_HOME` to its installed JDK 17. The command generates the native project, builds it, installs it on the selected device, and connects Metro. Use a native development build for SDK 58; this project has not been verified in Expo Go. For later launches of an installed debug build, start Metro with `npm start -- --port 8097`.

Core activity works offline in a standalone build. Debug builds need Metro for their JavaScript during development. Reminders and haptics use native APIs and require device verification. Reminders request notification permission only when enabled; denial is handled as an error without claiming scheduling succeeded.

## YouTube exercise demos

During a workout, tap **Watch YouTube demo** under the movement name. The dark video screen plays the demo inside the app, with fullscreen and **Open in YouTube** fallback. The exercise library offers the same button. Loading happens only after you open that screen, playback requires tapping Play, and backgrounding/leaving the screen unloads the player.

Reference YouTube demos follow the chosen movement and its alternative. For movements without a saved YouTube demo, use **Find demo on YouTube**, then paste a watch/Shorts/youtu.be link and select **Save demo for this exercise**. Your choice applies across plans, survives restart, and is included in backups. **Use default demo** clears that choice. Normal preference resets preserve saved demos; a whole-app reset removes them. No YouTube API key is required. Videos require internet and may include YouTube ads; fitness records remain local.

Native playback uses SDK-compatible React Native WebView; install an updated native build after adding it. Browser builds use a credentialless iframe so supported browsers can embed YouTube alongside the cross-origin isolation required by SQLite. Use Open in YouTube if the browser blocks the embed. The native player supplies the package identifier as its HTTP Referer, following [YouTube's WebView integration requirements](https://developers.google.com/youtube/terms/required-minimum-functionality#embedded-youtube-player).

## Download the local Android test build

The latest ARM64 test APK is in `artifacts/formwise-youtube-preview-arm64.apk` (about 35 MB). It includes in-app YouTube playback, saved demo links, the HTML-reference additions, and native Clipboard. It uses local test signing; it is not a Play Store production build. See `YOUTUBE_FEATURE.md` for its hash and verification details.

## Build an APK or Play Store bundle

An EAS preview APK configuration and production AAB configuration are provided. Cloud builds require your Expo account and signing setup:

```powershell
npx eas-cli@latest login
npx eas-cli@latest build:configure
npm run build:android
# For a Play Store AAB:
npx eas-cli@latest build --platform android --profile production
```

Review account/project association and signing prompts yourself. No EAS build or upload was submitted during implementation. An AAB also needs Play Console setup and device QA before release.

The native config plugin sets `expo.android.cmakeObjectPathMax=259`, resolving the Windows CMake object-path failure from this checkout. Generate native projects using Expo; do not edit generated Android files by hand. Stop Gradle before regenerating on Windows to avoid file locks.

```powershell
npx expo prebuild --platform android --no-install
.\android\gradlew.bat -p android assembleRelease --no-daemon --max-workers=2 -PreactNativeArchitectures=arm64-v8a
```

The generated local release uses a test signing key. Use EAS production signing for distribution. No EAS upload has been submitted.

## Features added from the HTML reference

Open **Workouts → Open training companion** for phase-based beginner gym A/B and home plans, a weekly rhythm, a persistent setup checklist, walking/recovery logs, and waist measurements with unit-aware trends. Progress links directly to measurements. Exercise guides include mistakes, written alternatives, and external reference demonstrations. Active sessions can switch between original/alternative movements before sets are completed; loads reset and history keeps the actual movement. Exercise effort is recorded on a 1–10 scale.

Settings includes a selectable JSON preview and complete-backup copy action. Native backup versions 1 and 2 are accepted; exports use version 2. Existing SQLite data upgrades transactionally to schema 2. The reference HTML's personal profile and initial weight are never seeded. Its browser-storage JSON uses a different format from native backups.

## Validate

```powershell
npm run typecheck
npm run lint
npm test
npm run test:ui
npx expo-doctor
npx expo install --check
npm run export:web
npm run export:android
```

`npm test` runs business logic and real SQLite tests using Node's SQLite engine. `npm run test:ui` runs native component interaction and store-coordination tests using Jest/React Native Testing Library; platform services are mocked. See [TESTING.md](TESTING.md) for exact validation boundaries and the device checklist.

## Data and privacy

- SQLite `formwise.db` is the authoritative local store. Changes publish to the UI only after a successful transaction.
- Export JSON from Settings before reinstalling, clearing app storage, or moving devices. Backups contain personal fitness data in plain JSON; keep them private.
- Restore validates a version 1 or 2 native Formwise JSON file and asks before replacing local data. It is transactional; malformed files and failed transactions preserve existing records. Merge is not implemented.
- Restored backups do not restore notification permissions or device notification IDs; enable reminders on the destination device.
- Active sessions snapshot the plan, so editing/deleting a plan does not rewrite a session.
- Android OS auto-backup is disabled in app configuration. Broad external-storage and overlay permissions are blocked. File selection and sharing use platform dialogs.

## Project map

```text
src/app/                   Expo Router stack, five tabs, onboarding, plan/session details, history
src/components/            Shared dark UI, charts, athlete illustration
src/constants/             Theme tokens, offline exercise catalog, starter plans
src/db/                    SQLite opening, schema versioning, transactional repository
src/features/profile/      Profile/onboarding form
src/features/workouts/     Exercise browser and rest-timer controls
src/hooks/                 Focus refresh and reduced-motion preferences
src/lib/                   Fitness calculations, backup/file handling, notifications
src/store/                 Serialized Zustand coordination
src/types/                 Domain types and Zod validation
src/test/                  Business, SQLite, store, and UI interaction tests
assets/                    App icon and editable SVG brand mark
scripts/create-brand.ps1   Reproducible native icon generation on Windows
plugins/                   Reproducible native dark-launch and Windows CMake configuration
```

Read [ARCHITECTURE.md](ARCHITECTURE.md) for data conventions and [IMPLEMENTATION_STATUS.md](IMPLEMENTATION_STATUS.md) for the honest acceptance checklist and remaining validation.

Expo compatibility was checked against the installed SDK with `expo install --check` and Expo Doctor. Useful primary references: [Expo SDK 58 release notes](https://expo.dev/changelog/sdk-58), [SQLite](https://docs.expo.dev/versions/latest/sdk/sqlite/), and [notifications](https://docs.expo.dev/versions/latest/sdk/notifications/).
