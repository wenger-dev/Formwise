# Implementation status

Formwise is implemented as a native React Native/Expo project with a dark theme. This is a functional local-first implementation, but it is **not a certified production release**: physical-device QA, visual review, real reminder delivery, and distribution signing remain distinct verification steps. The test APK compiles, verifies, and installs; the available x86_64 emulator could not launch its ARM64 native libraries.

## Implemented and automatically tested

- Strict domain validation and canonical kg/cm conversions; switching display units preserves untouched measurements.
- Session plan/catalog snapshots, set completion, measured volume, pause accounting, timestamp rest calculation, idempotent finish, streak/weekly/record calculations, and DST calendar behavior.
- Real SQLite schema initialization, repeatable migrations, future-version protection, persisted plan edits, file-close/reopen session recovery, historical corrections/deletion, clean-database JSON restore, foreign-key integrity, and rollback after a failed write.
- Serialized shared-state updates, coalesced initialization, failure recovery, rapid Start deduplication, and rapid Finish deduplication.
- Rendered component flows for optional onboarding, invalid profile input, unit display changes, custom plan creation from the catalog, set-input flushing, completion/rest controls, exercise navigation, confirmed incomplete completion, and canceled history deletion.

Current automated counts: **34 business/SQLite tests and 19 component/store/router tests**. The earlier 27-test baseline also passed with `TZ=America/New_York`.

## Implemented; native/manual verification remains

Five tabs and secondary routes; dark responsive dashboard; optional onboarding and profile editing; plan create/edit/duplicate/rename/reorder/archive/restore/delete; seven initial templates plus three explicitly installed beginner templates; forty-five exercise entries (including reference movements and alternatives) with filtering and instructions; guided sessions; overview/skip/pause/resume; set input autosave; workout notes and ratings; rest presets/custom controls; active-session recovery; virtualized history and search/date ranges; historical corrections/deletion and prior-session comparison; real-data frequency/duration/volume/performance charts; personal records; streaks; bodyweight CRUD/charts; goal creation/deletion/progress; preferred plan; units; haptics; default durations; reduced-motion handling; JSON file dialogs; reminder scheduling/cancellation; data reset confirmations; app branding.

These features have source implementation and compile into web/Android JavaScript exports. This does not establish correct visual layout, Android bridge behavior, notification delivery, or physical-device usability.

## Deliberately omitted or limited

- Theme follows the user's explicit dark-mode request; a light/system theme selector is not offered.
- Rest audio and background rest-timer notifications are not implemented or claimed. Timer display recovers from timestamps when foregrounded.
- Reminder delivery, share-sheet save outcomes, Android notification permission behavior, TalkBack, background/force-stop behavior, and iOS execution are unverified.
- Backup restore replaces a validated snapshot after confirmation. Merge is not implemented. Reminders must be re-enabled after restoration.
- The exercise catalog is fixed; custom exercise creation/import is not supported. Per-set note fields exist in the model/backup, but only a workout-level note editor is exposed.
- Historical numeric corrections autosave after explicit edit-mode confirmation. Editing a whole session's name/date or duration is not exposed.
- The app uses a preferred workout and saved training-day preferences; it does not implement a multi-week scheduling calendar or an automatic training-program generator.
- Very large archives have not been profiled. History rendering is virtualized and measurement lists are paged, but full validated domain state is hydrated in memory.
- Uncommitted partial numeric typing can be lost if the OS kills the app within the 500 ms autosave window. Completed sets and committed actions are persisted before acknowledgement.
- Experimental SDK-generated route types are disabled after a malformed Windows watcher output; strict application TypeScript checking remains enabled.
- A local release compile uses the generated test signing configuration. Production signing and Play Store distribution require a separate release process.

## Build and environment

- Web export: passed.
- Android Hermes JavaScript export: passed. This is not an APK.
- Expo compatibility: `expo install --check` passed; Expo Doctor passed 20/20 checks.
- TypeScript and lint: passed at the last completed source check.
- Final Android prebuild: passed with dark appearance, branding, blocked unused permissions, and disabled OS auto-backup. A prior regeneration hit a Windows directory lock while Gradle ran. The first bootstrap build was intentionally stopped after its Gradle/JDK downloads so the final native configuration could be regenerated; it was not an application-code failure.
- Earlier native ARM64 release compile succeeded (603 Gradle tasks), after using the SDK-supported CMake object-path limit. The HTML-feature update, including Expo Clipboard, also compiled successfully: ARM64 APK, 603 Gradle tasks, v2 APK signature verified. See HTML_FEATURE_PARITY.md for the artifact and hash.
- Runtime smoke: updated ARM64 APK installed on a read-only API 37 x86_64 emulator, but launch failed in SoLoader while seeking x86_64 native libraries. The APK contains the required ARM64 React Native/Hermes libraries. No JavaScript/SQLite runtime success is claimed. The emulator was stopped. ARM64 device QA remains.
- Browser visual review: access to the local preview was denied by the browser permission gate. No alternate browser surface or workaround was used.
- Dependency audit: the final SDK 58 patch installation reported zero vulnerabilities.

## Acceptance checklist

“Implemented” below describes code/automated evidence, not a claim of manual Android verification.

| Acceptance criterion | Evidence / status |
| --- | --- |
| Launches successfully in supported development environment | Bundles export; actual interactive launch remains unverified |
| Five-tab navigation | Real Expo Router integration test passes; device touch check pending |
| Onboarding and profile editing | Implemented; component flows tested |
| Profile/preferences survive restart | SQLite repository persistence tested; device restart pending |
| Create/edit/duplicate/delete plans | Implemented; repository operations and create UI tested |
| Exercise library | Implemented; catalog-picker interaction tested |
| Start from plan | Session/store logic tested; device navigation pending |
| Sets/repetitions/weights | Component and repository tests pass |
| Rest start/pause/resume/reset/skip | Implemented; timestamp logic and pause/reset/skip UI tested; native background check pending |
| Recover active workout after restart | Actual SQLite file-close/reopen test passes; force-stop device test pending |
| Complete session without duplicates | Domain/store/repository tests pass |
| Completed sessions in history | Implemented from persisted records; manual route check pending |
| Saved historical results | Repository tests pass; detail view implemented |
| Progress from real saved data | Calculation tests pass; no fake history seeded |
| Optional bodyweight tracking | Implemented; unit validation/conversion tested; full CRUD UI pending manual check |
| Unit conversions preserve data | Unit and untouched-form conversion tests pass |
| Versioned JSON export | Serialization and round-trip tests pass; native save dialog unverified |
| Safe validated import | Cross-record validation and SQLite rollback/restore tests pass; native picker unverified |
| Destructive confirmations | Implemented; cancellation tested for history clearing |
| Offline core | No network dependency in fitness domain; standalone airplane-mode test pending |
| Empty/error states | Implemented; selected validation errors tested; visual checks pending |
| Core business tests | 34 pass |
| Accurate documentation | README, architecture, testing, and this status file present |
| Functional primary controls | Implemented; manual complete-control walkthrough pending |
| No fabricated workout history/progress | Fresh database tests confirm empty sessions; metrics derive from completed sessions |

See README.md for exact local/Android commands and TESTING.md for the remaining device release checklist.


## HTML feature update — October 27

Added a dark native training companion, three beginner templates with selectable set phases, a weekly rhythm, saved technique checklist, recovery minutes/effort/notes, waist measurements and trends, machine mistakes and alternatives, user-triggered external demonstrations, exercise effort, reversible session substitution, and backup preview/copy. Schema 2 and native backup version 2 preserve new fields; version 1 native backups migrate with safe defaults. No reference profile or initial body weight was copied. See HTML_FEATURE_PARITY.md for exact behavior.

Native feature build: `artifacts/formwise-dark-preview-arm64.apk` (34,443,822 bytes), verified APK v2 signature, SHA-256 `53A53AEB37646A1D8DB969BC6282B6336D00E8130C14EBCF9D5779BAA57FB43F`.

## YouTube playback update

A visible demo button on every session exercise and exercise-library detail opens a dark native playback screen. Native uses React Native WebView; browser uses iframe. Playback requires a tap, unmounts on background/route departure, supports fullscreen, and offers external YouTube/reload fallbacks. Per-exercise replacement links are validated, saved in settings, and backed up; old settings default to an empty map. Exercises without a demo offer YouTube search and link entry. Workout inputs flush before video navigation. Tests: 34 domain/SQLite plus 19 component/store/router. Actual YouTube playback is not claimed as manually verified.

YouTube native build passed: `artifacts/formwise-youtube-preview-arm64.apk`, 34,698,255 bytes, APK v2 signature verified. SHA-256: `8718AA62493B9CEC4F2ACE43106935D0A5896EA3BB6673944FE66AE74DA409DE`. Physical-device playback/visual QA remains unverified.
