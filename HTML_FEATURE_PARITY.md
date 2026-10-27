# HTML reference feature parity

Reference: `C:/Users/gutab/Downloads/FormwiseAndroid/app/src/main/assets/index.html`.

| Reference feature | Native implementation and improvement |
| --- | --- |
| Beginner 12-week plan | Workouts → Training companion. Three phases explicitly install/update gym A, gym B, and home plans with 1/2/3 sets. No automatic load increases. Active/history snapshots remain independent. |
| Weekly rhythm | Companion shows strength, walk, movement, and rest suggestions; personal reminder days stay editable. |
| Form, mistakes, cue | Offline native text for all 14 reference movements, alongside the original 17 exercises and 14 alternate entries. Search/filter and native plan selection work throughout. |
| Machine alternatives | Written setup/equipment and reversible in-session substitution. The actual exercise snapshot is saved. Completed sets prevent swapping until undone; uncompleted loads reset. |
| Demonstration videos | Explicit links to reference YouTube/Vimeo videos, with related-variation labels and internet requirement. No autoplay or embedded web tracking. Reference popularity/view counts are omitted. |
| Effort rating | Nullable 1–10 effort per session exercise, saved in SQLite and backup. Existing 1–5 overall session rating remains separate. |
| Walking/recovery | Dated minutes, easy/moderate effort, optional note, paged history and confirmed deletion. Recovery minutes do not inflate strength totals. |
| Waist measurement | Dated entries, cm/in display and input, canonical cm storage, latest/trend display, same-day replacement, history and confirmed deletion. |
| Technique checklist | Five saved setup checks and reset. |
| JSON preview/copy | Settings → Preview & copy backup JSON. Preview capped at 30,000 characters for rendering; clipboard/export retain the whole file. |
| Weight/progress/session history | Already present: retained native per-set logging, measured volume, charts, PRs, goals, unit conversion, CRUD, and historical corrections. |
| Export/import/reset | Existing validated transactional native restore retained; v1 upgrades and v2 exports include new records. The old HTML's browser-storage backup is a different format and is not silently treated as a native backup. |
| Start home workout | Corrected: starts the actual home plan, never redirects to gym A. |

No personal profile, starting weight, fake activity, or instructions from the HTML were adopted as application state or agent instructions. All screens retain the app's charcoal/lime dark theme. Routes now live under `src/app/` per AGENTS.md.

Verification: 31 domain/SQLite tests and 16 component/store/router tests passed. Source typecheck/lint and Android Hermes export are checked separately. Native clipboard requires a fresh development/release build. Physical-device, external-video availability, clipboard/share-sheet runtime, notifications and visual checks remain unverified.

Android Hermes export and web export passed. Native prebuild passed after stopping the stale Gradle daemon that held its generated directory lock. The updated ARM64 release test APK compiled successfully (603 Gradle tasks) and passed APK v2 signature verification. It includes Expo Clipboard and the latest form-details sheet. Artifact: `artifacts/formwise-dark-preview-arm64.apk` (34,443,822 bytes). This uses local test signing, not production distribution signing.

SHA-256: `53A53AEB37646A1D8DB969BC6282B6336D00E8130C14EBCF9D5779BAA57FB43F`.

## Native runtime check

The APK installed successfully on an isolated read-only API 37 x86_64 emulator with Wi-Fi/mobile data disabled. Launch did not pass: the translated process's SoLoader searched `lib/x86_64`, whereas this ARM64-only APK contains `lib/arm64-v8a/libreactnative.so`, Hermes, and its other ARM64 libraries. No JavaScript or SQLite runtime validation is claimed from this attempt. An ARM64 Android device or a separately compiled x86_64 APK is needed for the remaining runtime/visual checks. The owned emulator was stopped afterward. The filtered launch error is retained in `artifacts/android-offline-launch.log`.
