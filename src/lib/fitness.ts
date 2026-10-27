import { AppData, Plan, Session, Settings, backupSchema, dataSchema } from '../types/domain';
import { catalog } from '../constants/catalog';

let sequence = 0;
export const uid = () =>
  `${Date.now().toString(36)}-${(++sequence).toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
export const clone = <T>(value: T): T => JSON.parse(JSON.stringify(value));
export const localDate = (value: string | number | Date = new Date()): string => {
  const d = new Date(value);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};
export const dayOffset = (date: Date, days: number) => {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
};
export function validDay(day: string) {
  const d = new Date(`${day}T12:00:00`);
  return !isNaN(d.getTime()) && localDate(d) === day;
}
export const fromKg = (kg: number, units: Settings['units']) =>
  units === 'metric' ? kg : kg * 2.2046226218;
export const toKg = (value: number, units: Settings['units']) =>
  units === 'metric' ? value : value / 2.2046226218;
export const fromCm = (cm: number, units: Settings['units']) =>
  units === 'metric' ? cm : cm / 2.54;
export const toCm = (value: number, units: Settings['units']) =>
  units === 'metric' ? value : value * 2.54;
export const weightUnit = (units: Settings['units']) => (units === 'metric' ? 'kg' : 'lb');
export const round = (n: number, digits = 1) => Number(n.toFixed(digits));
export function measurementGoalProgress(
  initial: number | undefined,
  current: number | undefined,
  target: number,
) {
  if (initial === undefined || current === undefined) return 0;
  const distance = Math.abs(initial - target);
  return distance === 0
    ? current === target
      ? 1
      : 0
    : Math.max(0, Math.min(1, 1 - Math.abs(current - target) / distance));
}
export const durationMs = (session: Session, now = Date.now()) =>
  session.activeMs +
  (session.status === 'active' && session.runningSince !== null
    ? Math.max(0, now - session.runningSince)
    : 0);
export const durationLabel = (ms: number) =>
  `${Math.floor(ms / 60000)}:${String(Math.floor(ms / 1000) % 60).padStart(2, '0')}`;
export const remainingSeconds = (timer: Session['timer'], now = Date.now()) =>
  !timer
    ? 0
    : timer.endAt === null
      ? timer.remaining
      : Math.max(0, Math.ceil((timer.endAt - now) / 1000));
export const completedSets = (session: Session) =>
  session.exercises.flatMap((e) => e.sets).filter((s) => s.completed).length;
export const volume = (session: Session) =>
  session.exercises.reduce(
    (sum, e) => sum + e.sets.reduce((n, s) => n + (s.completed ? (s.weight ?? 0) * s.reps : 0), 0),
    0,
  );
export const isComplete = (session: Session) =>
  session.exercises.every((e) => e.skipped || e.sets.every((s) => s.completed));
export const estimatedMinutes = (plan: Plan) =>
  Math.round(plan.exercises.reduce((n, e) => n + e.sets * (40 + e.rest), 0) / 60);
export function startSession(plan: Plan, now = Date.now()): Session {
  return {
    id: uid(),
    planId: plan.id,
    name: plan.name,
    startedAt: new Date(now).toISOString(),
    finishedAt: null,
    status: 'active',
    activeMs: 0,
    runningSince: now,
    currentExercise: 0,
    timer: null,
    note: '',
    rating: null,
    exercises: plan.exercises.map((p) => {
      const exercise = catalog.find((e) => e.id === p.exerciseId);
      if (!exercise)
        throw new Error('An exercise in this plan is unavailable. Edit the plan before starting.');
      return {
        id: uid(),
        exercise: clone(exercise),
        rest: p.rest,
        skipped: false,
        effort: null,
        sets: Array.from({ length: p.sets }, (_, i) => ({
          id: uid(),
          number: i + 1,
          targetReps: p.reps,
          reps: p.reps,
          targetWeight: p.weight,
          weight: p.weight,
          completed: false,
          notes: '',
        })),
      };
    }),
  };
}
export function finishSession(session: Session, now = Date.now()): Session {
  if (session.status !== 'active') return session;
  if (!completedSets(session))
    throw new Error(
      'Complete at least one set before saving a workout. You can abandon an unused session.',
    );
  return {
    ...session,
    status: 'completed',
    finishedAt: new Date(now).toISOString(),
    activeMs: durationMs(session, now),
    runningSince: null,
    timer: null,
  };
}
export function streaks(sessions: Session[], now = new Date()) {
  const days = new Set(
    sessions.filter((s) => s.status === 'completed').map((s) => localDate(s.finishedAt!)),
  );
  let current = 0;
  let cursor = days.has(localDate(now)) ? now : dayOffset(now, -1);
  while (days.has(localDate(cursor))) {
    current++;
    cursor = dayOffset(cursor, -1);
  }
  let longest = 0;
  let run = 0;
  let previous = '';
  [...days].sort().forEach((day) => {
    run = previous === localDate(dayOffset(new Date(`${day}T12:00:00`), -1)) ? run + 1 : 1;
    longest = Math.max(longest, run);
    previous = day;
  });
  return { current, longest };
}
export function weekDays(now = new Date()) {
  const start = dayOffset(now, -((now.getDay() + 6) % 7));
  return Array.from({ length: 7 }, (_, i) => dayOffset(start, i));
}
export function summary(sessions: Session[], now = new Date()) {
  const done = sessions.filter((s) => s.status === 'completed');
  const week = new Set(weekDays(now).map((d) => localDate(d)));
  const weekly = done.filter((s) => week.has(localDate(s.finishedAt!)));
  return {
    total: done.length,
    weekly: weekly.length,
    minutes: Math.round(done.reduce((n, s) => n + s.activeMs, 0) / 60000),
    volume: done.reduce((n, s) => n + volume(s), 0),
    ...streaks(done, now),
  };
}
export function records(sessions: Session[]) {
  const map = new Map<string, { name: string; weight: number; reps: number; sessionId: string }>();
  sessions
    .filter((s) => s.status === 'completed')
    .forEach((s) =>
      s.exercises.forEach((e) =>
        e.sets
          .filter((x) => x.completed && x.reps > 0)
          .forEach((set) => {
            const prior = map.get(e.exercise.id);
            const weight = set.weight ?? 0;
            if (
              !prior ||
              weight > prior.weight ||
              (weight === prior.weight && set.reps > prior.reps)
            )
              map.set(e.exercise.id, {
                name: e.exercise.name,
                weight,
                reps: set.reps,
                sessionId: s.id,
              });
          }),
      ),
    );
  return [...map.entries()].map(([exerciseId, record]) => ({ exerciseId, ...record }));
}
export function validateData(input: unknown): AppData {
  const data = dataSchema.parse(input);
  const unique = (ids: string[], name: string) => {
    if (new Set(ids).size !== ids.length) throw new Error(`Duplicate ${name} IDs in backup.`);
  };
  unique(
    data.plans.map((p) => p.id),
    'plan',
  );
  unique(
    data.sessions.map((s) => s.id),
    'session',
  );
  unique(
    data.weights.map((w) => w.id),
    'measurement',
  );
  unique(
    data.goals.map((g) => g.id),
    'goal',
  );
  const known = new Set(catalog.map((e) => e.id));
  data.plans.forEach((p) => {
    unique(
      p.exercises.map((e) => e.id),
      'plan exercise',
    );
    p.exercises.forEach((e) => {
      if (!known.has(e.exerciseId)) throw new Error('Backup contains an unknown plan exercise.');
    });
  });
  if (
    data.profile.preferredPlanId &&
    !data.plans.some((p) => p.id === data.profile.preferredPlanId)
  )
    throw new Error('Preferred plan is missing from the backup.');
  if (data.sessions.filter((s) => s.status === 'active').length > 1)
    throw new Error('Only one active workout can be restored.');
  data.sessions.forEach((s) => {
    if (s.currentExercise >= s.exercises.length)
      throw new Error('Invalid session exercise position.');
    if (
      (s.status === 'completed') !== (s.finishedAt !== null) ||
      (s.status !== 'active' && s.runningSince !== null)
    )
      throw new Error('Invalid workout status.');
    if (s.finishedAt && new Date(s.finishedAt) < new Date(s.startedAt))
      throw new Error('Workout finish precedes its start.');
    if (s.status === 'completed' && completedSets(s) === 0)
      throw new Error('A completed workout needs a completed set.');
    unique(
      s.exercises.map((e) => e.id),
      'session exercise',
    );
    unique(
      s.exercises.flatMap((e) => e.sets.map((set) => set.id)),
      'set',
    );
    s.exercises.forEach((e) => {
      if (e.skipped && e.sets.some((x) => x.completed))
        throw new Error('A skipped exercise cannot contain completed sets.');
    });
  });
  for (const [name, entries] of [
    ['waist', data.wellness.waist],
    ['recovery', data.wellness.recovery],
  ] as const) {
    unique(
      entries.map((x) => x.id),
      name,
    );
    if (entries.some((x) => !validDay(x.date)))
      throw new Error('Entries need a valid calendar date.');
  }
  data.weights.forEach((w) => {
    // A previously valid local date may be ahead of today after travel or a device-clock change.
    // New entries are checked against today by the form, not by database hydration.
    if (!validDay(w.date)) throw new Error('Measurements need a valid calendar date.');
  });
  data.goals.forEach((g) => {
    if ((g.type === 'weekly' || g.type === 'consistency') && !Number.isInteger(g.target))
      throw new Error('Workout and day goals need whole-number targets.');
    if (g.type === 'exercise' && (!g.exerciseId || !known.has(g.exerciseId)))
      throw new Error('An exercise goal needs an available exercise.');
    if (g.type === 'weekly' && g.target > 7)
      throw new Error('Weekly goals cannot exceed seven workouts.');
    if (g.type === 'weight' && g.target > 500)
      throw new Error('Weight goals must be at most 500 kg.');
  });
  return data;
}
export const serializeBackup = (data: AppData) =>
  JSON.stringify(
    {
      format: 'formwise',
      version: 2,
      exportedAt: new Date().toISOString(),
      data: validateData(data),
    },
    null,
    2,
  );
export function parseBackup(raw: string) {
  if (raw.length > 25_000_000) throw new Error('This backup is too large (maximum 25 MB).');
  let input: unknown;
  try {
    input = JSON.parse(raw);
  } catch {
    throw new Error('This file is not valid JSON.');
  }
  const result = backupSchema.safeParse(input);
  if (!result.success)
    throw new Error('This is not a supported Formwise backup, or some values are invalid.');
  const data = validateData(result.data.data);
  data.settings.reminder.enabled = false;
  data.settings.reminder.ids = [];
  return data;
}
