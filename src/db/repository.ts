import { AppData } from '../types/domain';
import { catalog, freshData } from '../constants/catalog';
import { clone, validateData } from '../lib/fitness';

export interface Database {
  execAsync(sql: string): Promise<void>;
  runAsync(sql: string, ...params: (string | number | null)[]): Promise<unknown>;
  getAllAsync<T>(sql: string, ...params: (string | number | null)[]): Promise<T[]>;
  withTransactionAsync(task: () => Promise<void>): Promise<void>;
}
export const migrationSQL = `
CREATE TABLE IF NOT EXISTS schema_migrations (version INTEGER PRIMARY KEY);
CREATE TABLE IF NOT EXISTS wellness (id INTEGER PRIMARY KEY CHECK (id = 1), payload TEXT NOT NULL);
CREATE TABLE IF NOT EXISTS user_profile (id INTEGER PRIMARY KEY CHECK (id = 1), payload TEXT NOT NULL);
CREATE TABLE IF NOT EXISTS app_settings (id INTEGER PRIMARY KEY CHECK (id = 1), payload TEXT NOT NULL);
CREATE TABLE IF NOT EXISTS exercises (id TEXT PRIMARY KEY, payload TEXT NOT NULL);
CREATE TABLE IF NOT EXISTS workout_plans (id TEXT PRIMARY KEY, payload TEXT NOT NULL);
CREATE TABLE IF NOT EXISTS workout_plan_exercises (id TEXT PRIMARY KEY, plan_id TEXT NOT NULL REFERENCES workout_plans(id) ON DELETE CASCADE, exercise_id TEXT NOT NULL REFERENCES exercises(id), position INTEGER NOT NULL, payload TEXT NOT NULL);
CREATE TABLE IF NOT EXISTS workout_sessions (id TEXT PRIMARY KEY, status TEXT NOT NULL CHECK(status IN ('active','completed','abandoned')), payload TEXT NOT NULL);
CREATE TABLE IF NOT EXISTS session_exercises (id TEXT PRIMARY KEY, session_id TEXT NOT NULL REFERENCES workout_sessions(id) ON DELETE CASCADE, position INTEGER NOT NULL, payload TEXT NOT NULL);
CREATE TABLE IF NOT EXISTS workout_sets (id TEXT PRIMARY KEY, session_exercise_id TEXT NOT NULL REFERENCES session_exercises(id) ON DELETE CASCADE, position INTEGER NOT NULL, payload TEXT NOT NULL);
CREATE TABLE IF NOT EXISTS bodyweight_entries (id TEXT PRIMARY KEY, payload TEXT NOT NULL);
CREATE TABLE IF NOT EXISTS fitness_goals (id TEXT PRIMARY KEY, payload TEXT NOT NULL);
CREATE INDEX IF NOT EXISTS idx_plan_children ON workout_plan_exercises(plan_id, position);
CREATE INDEX IF NOT EXISTS idx_session_status ON workout_sessions(status);
CREATE INDEX IF NOT EXISTS idx_session_children ON session_exercises(session_id, position);
CREATE INDEX IF NOT EXISTS idx_sets ON workout_sets(session_exercise_id, position);
CREATE UNIQUE INDEX IF NOT EXISTS one_active_session ON workout_sessions(status) WHERE status = 'active';
INSERT OR IGNORE INTO schema_migrations(version) VALUES(1);
INSERT OR IGNORE INTO schema_migrations(version) VALUES(2);`;

export class Repository {
  private current: AppData | null = null;
  constructor(private db: Database) {}
  async initialize() {
    await this.db.execAsync('PRAGMA foreign_keys = ON; PRAGMA journal_mode = WAL;');
    const exists = await this.db.getAllAsync<{ name: string }>(
      "SELECT name FROM sqlite_master WHERE type='table' AND name='schema_migrations'",
    );
    if (exists.length) {
      const versions = await this.db.getAllAsync<{ version: number }>(
        'SELECT version FROM schema_migrations',
      );
      if (versions.some((v) => v.version > 2))
        throw new Error(
          'This database was created by a newer Formwise version. Update the app to open it.',
        );
    }
    await this.db.withTransactionAsync(async () => {
      await this.db.execAsync(migrationSQL);
      for (const exercise of catalog)
        await this.db.runAsync(
          'INSERT OR IGNORE INTO exercises(id,payload) VALUES(?,?)',
          exercise.id,
          JSON.stringify(exercise),
        );
    });
    const profiles = await this.db.getAllAsync('SELECT id FROM user_profile');
    if (!profiles.length) {
      const [existing] = await this.db.getAllAsync<{ total: number }>(
        'SELECT (SELECT COUNT(*) FROM workout_plans) + (SELECT COUNT(*) FROM workout_sessions) + (SELECT COUNT(*) FROM bodyweight_entries) + (SELECT COUNT(*) FROM app_settings) + (SELECT COUNT(*) FROM fitness_goals) + (SELECT COUNT(*) FROM wellness) AS total',
      );
      if (existing.total)
        throw new Error(
          'A required profile record is missing. Your existing database has been preserved; it has not been reset.',
        );
      await this.save(freshData());
    }
    return this.load();
  }
  async load(): Promise<AppData> {
    const rows = async <T>(table: string) =>
      (await this.db.getAllAsync<{ payload: string }>(`SELECT payload FROM ${table}`)).map(
        (r) => JSON.parse(r.payload) as T,
      );
    const profile = (await rows<AppData['profile']>('user_profile'))[0];
    const settings = (await rows<AppData['settings']>('app_settings'))[0];
    const plans = await rows<AppData['plans'][number]>('workout_plans');
    const sessions = await rows<AppData['sessions'][number]>('workout_sessions');
    const data = validateData({
      profile,
      settings,
      wellness: (await rows('wellness'))[0],
      plans,
      sessions,
      weights: await rows('bodyweight_entries'),
      goals: await rows('fitness_goals'),
    });
    this.current = clone(data);
    return data;
  }
  async save(input: AppData) {
    const data = validateData(input);
    const prior = this.current;
    const priorPlans = new Map(prior?.plans.map((row) => [row.id, row]));
    const priorSessions = new Map(prior?.sessions.map((row) => [row.id, row]));
    const priorWeights = new Map(prior?.weights.map((row) => [row.id, row]));
    const priorGoals = new Map(prior?.goals.map((row) => [row.id, row]));
    const changed = (a: unknown, b: unknown) => JSON.stringify(a) !== JSON.stringify(b);
    await this.db.withTransactionAsync(async () => {
      for (const [table, before, after] of [
        ['workout_plans', prior?.plans ?? [], data.plans],
        ['workout_sessions', prior?.sessions ?? [], data.sessions],
        ['bodyweight_entries', prior?.weights ?? [], data.weights],
        ['fitness_goals', prior?.goals ?? [], data.goals],
      ] as const) {
        const ids = new Set(after.map((row) => row.id));
        for (const row of before)
          if (!ids.has(row.id)) await this.db.runAsync(`DELETE FROM ${table} WHERE id = ?`, row.id);
      }
      if (changed(prior?.wellness, data.wellness))
        await this.db.runAsync(
          'INSERT OR REPLACE INTO wellness(id,payload) VALUES(1,?)',
          JSON.stringify(data.wellness),
        );
      if (changed(prior?.profile, data.profile))
        await this.db.runAsync(
          'INSERT OR REPLACE INTO user_profile(id,payload) VALUES(1,?)',
          JSON.stringify(data.profile),
        );
      if (changed(prior?.settings, data.settings))
        await this.db.runAsync(
          'INSERT OR REPLACE INTO app_settings(id,payload) VALUES(1,?)',
          JSON.stringify(data.settings),
        );
      for (const plan of data.plans) {
        if (!changed(priorPlans.get(plan.id), plan)) continue;
        await this.db.runAsync(
          'INSERT INTO workout_plans(id,payload) VALUES(?,?) ON CONFLICT(id) DO UPDATE SET payload=excluded.payload',
          plan.id,
          JSON.stringify(plan),
        );
        await this.db.runAsync('DELETE FROM workout_plan_exercises WHERE plan_id = ?', plan.id);
        for (let i = 0; i < plan.exercises.length; i++) {
          const e = plan.exercises[i];
          await this.db.runAsync(
            'INSERT INTO workout_plan_exercises(id,plan_id,exercise_id,position,payload) VALUES(?,?,?,?,?)',
            `${plan.id}:${e.id}`,
            plan.id,
            e.exerciseId,
            i,
            JSON.stringify(e),
          );
        }
      }
      // Release the single-active-session index before inserting a replacement active session.
      for (const session of [...data.sessions].sort(
        (a, b) => Number(a.status === 'active') - Number(b.status === 'active'),
      )) {
        if (!changed(priorSessions.get(session.id), session)) continue;
        await this.db.runAsync(
          'INSERT INTO workout_sessions(id,status,payload) VALUES(?,?,?) ON CONFLICT(id) DO UPDATE SET status=excluded.status,payload=excluded.payload',
          session.id,
          session.status,
          JSON.stringify(session),
        );
        await this.db.runAsync('DELETE FROM session_exercises WHERE session_id = ?', session.id);
        for (let i = 0; i < session.exercises.length; i++) {
          const e = session.exercises[i];
          const eid = `${session.id}:${e.id}`;
          await this.db.runAsync(
            'INSERT INTO session_exercises(id,session_id,position,payload) VALUES(?,?,?,?)',
            eid,
            session.id,
            i,
            JSON.stringify(e),
          );
          for (let j = 0; j < e.sets.length; j++) {
            const s = e.sets[j];
            await this.db.runAsync(
              'INSERT INTO workout_sets(id,session_exercise_id,position,payload) VALUES(?,?,?,?)',
              `${eid}:${s.id}`,
              eid,
              j,
              JSON.stringify(s),
            );
          }
        }
      }
      for (const w of data.weights) {
        if (!changed(priorWeights.get(w.id), w)) continue;
        await this.db.runAsync(
          'INSERT INTO bodyweight_entries(id,payload) VALUES(?,?) ON CONFLICT(id) DO UPDATE SET payload=excluded.payload',
          w.id,
          JSON.stringify(w),
        );
      }
      for (const g of data.goals) {
        if (!changed(priorGoals.get(g.id), g)) continue;
        await this.db.runAsync(
          'INSERT INTO fitness_goals(id,payload) VALUES(?,?) ON CONFLICT(id) DO UPDATE SET payload=excluded.payload',
          g.id,
          JSON.stringify(g),
        );
      }
    });
    this.current = clone(data);
    return data;
  }
}
