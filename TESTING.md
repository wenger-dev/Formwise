# Testing and verification

Validation date: October 27, 2026 (Africa/Kigali).

## Automated suites

`npm test` executes 34 Node tests: domain calculations, canonical conversions, session snapshots, pause accounting, timestamp-based timer expiry, measured volume, idempotent completion, local streaks, weekly summaries, leap days and DST transitions, records, backup round trips and rejection, input validation, fresh SQLite initialization, repeatable migrations, plan operations, recovery from an actual closed/reopened SQLite file, historical corrections/deletion, a clean-database restore, rollback after an injected write failure, future schema rejection, and limiting writes to the affected workout.

These tests run the production repository against Node's actual SQLite engine through a thin adapter. They validate SQL and transactions, but they do not replace testing the Expo SQLite bridge on Android.

`npm run test:ui` executes 19 Jest tests in five suites. Eight render native components and exercise onboarding, invalid inputs, unit switching without measurement drift, custom-plan creation from the exercise library, set logging, timer pause/reset/skip, exercise navigation, confirmed incomplete completion, and canceled history deletion. Three store tests cover coalesced initialization, serialized edits, save failures, recovery, rapid Start, and duplicate Finish protection. Icons, navigation, safe-area values, and haptics are mocked. Store-coordination tests use an in-memory repository stand-in; SQLite is tested separately by the Node suite.

One suite uses the real Expo Router test harness to navigate all five tab destinations. New component tests cover phase installation, the actual home plan, imperial waist persistence, separate recovery logging, and reversible exercise substitution with load reset. Four new Node tests cover schema-1 migration, wellness/effort persistence, version-1 backup defaults and malformed entries, and independent home-plan snapshots. These are not physical-device end-to-end or screenshot tests.

## Commands and observed results

| Command | Result |
| --- | --- |
| `npm run typecheck` | Passed after excluding malformed experimental generated route declarations; strict source checking stays enabled |
| `npm run lint` | Passed without errors or warnings at the last completed check |
| `npm test` | 34 passed |
| `TZ=America/New_York npm test` (PowerShell environment equivalent) | Earlier 27-test baseline passed, including DST calendar behavior |
| `npm run test:ui` | 19 passed across five suites |
| `npx expo install --check` | Installed SDK dependencies compatible |
| `npx expo-doctor` | 20/20 checks passed |
| `npx expo export --platform web` | Passed; exports JavaScript, SQLite WASM/worker, icons, and assets |
| `npx expo export --platform android --output-dir dist-android` | Passed; produced Android Hermes bytecode and local assets |
| `npx expo prebuild --platform android --no-install` | Passed with final configuration after resolving a Windows directory lock during an earlier attempt |
| `android\gradlew.bat assembleRelease --no-daemon` | Updated ARM64 release test build passed: 603 tasks, 19 minutes |
| APK signature / installation | v2 signature verified; fresh install succeeded on read-only x86_64 test emulator |
| Offline launch | Failed before JavaScript: translated process searched x86_64 libraries in ARM64-only APK. ARM64 device runtime check remains. |
| Browser UI review | Blocked: browser permission gate denied access to the local preview; no workaround was used |

TypeScript, lint, suites, and exports should be rerun after source changes. The checked-in status document records final observed outcomes, not inferred release readiness.

## Dependency audit

The final Expo SDK 58 patch alignment reported **zero npm audit vulnerabilities**. The earlier Expo CLI dependency finding was resolved by the SDK patch dependency tree; no forced major-version upgrade was used.

## Required manual Android checks

These are unverified until performed on an actual Android runtime:

1. Install and open a native build with a fresh database; complete and skip onboarding on separate test installs. Visit all five tabs and secondary routes. Check the software keyboard, navigation/system bars, long text, larger font size, and small screens.
2. Create a custom plan, add/remove/reorder exercises, change targets, duplicate/rename/archive/restore/delete it. Cancel deletion and verify records remain. Restart and confirm persisted edits.
3. Start a session, type reps/load, complete sets, navigate between exercises, skip/restore an exercise, pause/resume the workout, and inspect overview. Return home and resume. Confirm a plan edit does not rewrite the session snapshot.
4. Exercise all timer presets and custom values; add/reduce, pause/resume, reset, skip, and expire. Background past the deadline and foreground. Check optional haptics. Verify no background rest alert is promised.
5. Force-stop and relaunch after completed set writes; recover the active session. Test a kill during the 500 ms input debounce separately and document the short uncommitted-input boundary.
6. Finish an incomplete session, confirm the warning, and tap Finish rapidly. Ensure only one history record appears, with incomplete flags retained. Correct results and compare refreshed records/charts. Delete it and verify recalculation.
7. Record/edit/delete bodyweight, switch metric/imperial, create each goal type, and verify charts only show actual saved data. Test ranges and the empty-history state.
8. Export through Android's share sheet, save the JSON, restore into a clean test install, and compare profile/plans/sessions/sets/measurements/goals. Import malformed/unsupported files; prior records must remain. Cancel replacement and verify no changes.
9. Deny notification permission, then enable it through OS settings. Schedule/change/disable reminders, confirm scheduled IDs, and observe actual delivery on the selected weekday/time. Test battery-saving mode and reboot. Check cleanup after backup restore/reset.
10. Disable network access in a standalone build and repeat navigation, profile edits, workouts, timer, history, charts, and file backup flows. Debug Metro connectivity is not an offline-release test.
11. Check TalkBack labels and disabled states, reduced-motion settings, focus/keyboard behavior, and performance with a large imported archive.

Production signing, Play Store upload, notification delivery, OS interruption behavior, visual screenshot review, and iOS runtime testing must not be claimed from the automated checks above.

## YouTube update

Three added domain tests cover YouTube URL parsing/host validation, original/alternative resolution and overrides, missing-video fallback, and persistence/defaults in backups. Two new screen tests cover the current video player, external YouTube fallback, searching for a missing demo, saving a replacement and resetting it. A session interaction test proves typed loads flush before navigating to the current exercise video. The player is mocked in screen tests; actual YouTube playback, restrictions/ads, fullscreen, and background behavior still require device/browser QA. Web export passed. Strict TypeScript, Expo lint, SDK compatibility, and Expo Doctor (20/20) passed.

Updated YouTube ARM64 APK: native assembleRelease passed (645 tasks; 94 executed / 551 cached), APK v2 signature verified. The packaged Hermes bundle includes the video route, saved demo action, and native YouTube Referer. This pass does not claim live player/device verification; the earlier ARM64-on-x86 emulator limitation remains.
