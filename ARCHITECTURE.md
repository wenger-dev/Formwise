# Architecture

## Application and navigation

React Native components render every screen; there is no WebView. Expo Router provides a root native stack and five primary tabs: Home, Workouts, Progress, Profile, Settings. Plan details, sessions, history, and onboarding are nested stack routes. Wider browser/tablet layouts add a sidebar; phones retain bottom navigation with safe-area insets. Tokens are centralized in `src/constants/theme.ts`. Local SVG primitives supply charts and illustrations, so no media request is needed for core use. Reduced-motion preferences disable stack/sheet animation.

Simple forms use controlled React state and Zod validation rather than adding React Hook Form. This is a deliberate dependency choice: there are no dynamic nested form validation requirements that require that library. The exercise catalog is intentionally small and offline. No custom-exercise editor, authentication, or backend is included.

Experimental generated typed-route declarations are disabled. During validation, the SDK 58 Windows route watcher produced a malformed declaration with an appended tail and included a source hook as a route type. Application TypeScript remains strict; generated `.expo` declarations are excluded. Runtime routes are still filesystem routes. There are no source edits to dependencies to work around this.

## State, persistence, and transactions

SQLite is authoritative; Zustand coordinates a hydrated snapshot and serialized mutations. Initialization is coalesced so repeated mounts do not open concurrent initialization transactions. Each update clones the latest committed snapshot, applies the recipe, validates, writes through the repository, and only then publishes. Failed writes leave the previous UI state and database intact. Failed operations do not poison the mutation queue.

Schema version 2 adds a singleton `wellness` table for validated waist/recovery/checklist data. Version 1 databases upgrade transactionally without re-seeding plans or history. Session JSON receives a nullable effort default. Native backup versions 1 and 2 are accepted and exports use version 2. The schema includes `schema_migrations`, `user_profile`, `app_settings`, `exercises`, `workout_plans`, `workout_plan_exercises`, `workout_sessions`, `session_exercises`, `workout_sets`, `bodyweight_entries`, and `fitness_goals`. Foreign keys, cascading children, an active-session uniqueness index, and lookup indexes enforce relations. A database from a newer schema version is refused rather than reset. Initial templates are seeded only for a new profile; deleting a template does not cause it to reappear on restart.

The schema combines relational IDs/status/ordering columns with versioned JSON payloads. Parent plan/session payloads contain complete typed aggregates for fast hydration; child exercise/set rows mirror those aggregates in the same transaction. The repository is the sole writer. Aggregate payloads are the source used for hydration. Tests check relational consistency after writes and restores. This trades some storage duplication for simpler reliable snapshot recovery; it is not a fully column-per-field relational model.

The repository compares validated aggregates to its last committed snapshot, upserts changed parents, replaces only those parents' children, and deletes explicitly removed parents. Logging a set leaves unrelated plans and historical sessions untouched. Cache state advances only after commit. All application writes must go through the serialized store; multiple independently writing app processes are outside the current design. On the web, use one app tab per database origin.

All hydrated history remains in memory. The history UI is virtualized, and measurement rows load in pages, but very large archives have not been load-tested. A future version can page repository queries and derive aggregates in SQL without changing routes.

## Domain conventions

- IDs are stable timestamp/random strings and never interpolated into SQL. Values use prepared parameters.
- Timestamps are ISO UTC instants. Calendar activity/streaks group by the device's current local date. Traveling across time zones can change the day grouping of an existing timestamp.
- Bodyweight, equipment load, and load goals are stored in kilograms. Height is stored in centimeters. Conversion occurs at UI boundaries; merely switching units does not rewrite measurements. Imperial height input uses total inches, with feet/inches shown as a helper.
- Sets retain target reps/weight plus actual reps/weight, completion status, and notes. A null weight means bodyweight/unmeasured; zero is an explicitly entered measured zero. Only completed measured sets contribute load × repetitions to volume. Uncompleted sets are never inferred as complete from navigation.
- Session exercises contain a complete catalog snapshot and prescribed rest. Skipping clears completed-set flags for that exercise and records it as skipped. An abandoned session remains excluded from all progress.
- One active session is allowed. Rapid Start taps resume that session. Finishing is idempotent and needs at least one completed set. Incomplete workouts require confirmation and retain incomplete flags in history.
- Historical changes are explicitly unlocked with confirmation. Set edits autosave while unlocked; finishing corrections closes editing. Deleting or correcting records immediately changes derived metrics; no stale totals are stored.
- Personal records use highest logged load, then highest repetitions at that load. Bodyweight records use repetitions when load is zero/unmeasured. Estimated 1RM is intentionally not offered.
- The current streak is consecutive completed local days ending today or yesterday. Duplicate workouts on one day count as one streak day. Longest streak is calculated across all completed local days. Weeks run Monday–Sunday; weekly workout totals count sessions, not only distinct days.
- The workout duration estimate assumes 40 seconds per set plus configured rest. It is an estimate, not a tracked result.

## Workout timing and interruption

Elapsed workout time is accumulated active milliseconds plus the difference from `runningSince`. Explicit Pause freezes elapsed time and any existing rest timer; Resume starts a new running interval. Without an explicit pause, elapsed time includes rest and time spent away from the app. It is wall-clock active time, not sensor-detected movement. Clock changes on the device can affect running intervals; negative intervals are clamped to zero.

A rest timer persists duration, remaining seconds, and an optional end timestamp. UI ticks only refresh display; they are not the clock. Foregrounding recalculates from the end timestamp. Pause stores remaining time and clears the end timestamp. Reset leaves a paused full-duration timer. Adding/subtracting time is bounded to 0–3600 seconds; initial custom durations allow 0–1800 seconds. On expiry, a foreground haptic is attempted if enabled. No sound or reliable background rest alert is claimed.

Set numeric input is buffered while typing and saved after 500 ms of valid input; completing a set or navigating through screen controls flushes it immediately. App backgrounding attempts a flush. Navigation removal is guarded while edits remain unsaved. OS force-kill within that short typing window can still lose the last partial input; explicitly completed sets and committed session/timer actions are durable. No JavaScript process can promise to run while Android is suspended.

## Backups and platform services

Backups have `format: formwise`, `version: 1`, `exportedAt`, and the complete user data snapshot. JSON is parsed as data, validated with Zod and cross-record validation, and never evaluated as code. Invalid dates, duplicate IDs, unknown plan exercises, incompatible versions, multiple active sessions, inconsistent session flags, and invalid goal references are rejected. Files are capped at 25 MB. Restoration replaces all local data only after confirmation and commits atomically. No merge mode is exposed.

The bundled exercise definitions are reproducible catalog data, while historical definitions travel inside session snapshots. The current fixed catalog cannot safely import plans referring to custom exercises, so those backups are rejected. This version does not create custom exercises.

Native export writes a temporary cache file and opens the system share dialog. The app cannot know whether the user ultimately saved or canceled that dialog, so feedback says the backup was prepared. Browser export uses a local Blob download; browser import reads the selected file. Native import uses Expo Document Picker and File System.

Reminders use native weekly triggers, Sunday = 1, and the device's local time. They are opt-in and silent. Permission and scheduled IDs are checked before claiming scheduling success. Failed partial scheduling cancels newly created IDs. Notification storage and SQLite cannot be one atomic transaction: a failure while canceling an old schedule can still require retrying the reminder controls. Restoring a backup disables saved reminder state and cancels this installation's prior IDs. Battery optimization, disabled channels, timezone changes, reboots, and actual OS delivery need device QA.

## Privacy and release boundaries

No fitness-data network client is present. Database and temporary export files use app-private storage; exports intentionally leave the app only through the user's sharing choice. Android automatic OS backup is disabled, and unused broad storage/overlay permissions are blocked by configuration. App data is not separately encrypted beyond the OS application sandbox. Backups are plain JSON. Development Metro traffic and optional EAS build services are development infrastructure, not fitness-data synchronization.

The generated Android local-release template uses test signing. Production distribution still requires actual signing credentials, a successful native build, device QA, and store setup. See the status and testing documents for what was actually executed.


Routes live in `src/app/`; reusable features and persistence code stay outside the route directory. Reference HTML exercise content is parsed as static JSON data, not executed or embedded as a WebView. External demonstration links open only after an explicit tap. Beginner templates are added explicitly, so existing plans are not silently changed. Recovery activity is excluded from lifting volume and strength-goal counts. Alternative swaps reset uncompleted load entries and are blocked while any set is completed.


YouTube: `settings.exerciseVideos` is a bounded map of validated 11-character YouTube IDs, with empty-map defaults for old databases/backups. It is persisted in the existing settings transaction; no SQL schema change is required. `src/lib/youtube.ts` accepts only explicit YouTube hosts and supported video paths. The video route resolves the current exercise snapshot and alternative; no arbitrary pasted URL enters WebView. Native requests identify `com.formwise.fitness` through the Referer header. Native and web players unmount when backgrounded/hidden and never autoplay. Normal preference resets preserve this user-selected demo map. Live playback and embedding availability are not covered by mocked screen tests.
