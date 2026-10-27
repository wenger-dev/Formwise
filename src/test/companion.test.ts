import assert from 'node:assert/strict';
import { test } from 'node:test';
import { Repository } from '../db/repository';
import { TestDatabase } from './adapter';
import { freshData, beginnerPlans } from '../constants/catalog';
import { clone, parseBackup, serializeBackup, startSession, validateData } from '../lib/fitness';

test('schema 1 database upgrades without resetting workouts or profile', async () => {
  const db = new TestDatabase();
  const repo = new Repository(db);
  const data = await repo.initialize();
  data.profile.name = 'Existing user';
  data.sessions.push(startSession(data.plans[0]));
  await repo.save(data);
  await db.execAsync('DROP TABLE wellness; DELETE FROM schema_migrations WHERE version=2;');
  const old = JSON.parse(
    (await db.getAllAsync<{ payload: string }>('SELECT payload FROM workout_sessions'))[0].payload,
  );
  old.exercises.forEach((e: Record<string, unknown>) => delete e.effort);
  await db.runAsync('UPDATE workout_sessions SET payload=?', JSON.stringify(old));
  const next = await new Repository(db).initialize();
  assert.equal(next.profile.name, 'Existing user');
  assert.equal(next.sessions[0].id, data.sessions[0].id);
  assert.equal(next.sessions[0].exercises[0].effort, null);
  assert.deepEqual(next.wellness, { waist: [], recovery: [], checks: [] });
  db.native.close();
});
test('wellness records and exercise effort survive SQLite reopen and backup restore', async () => {
  const db = new TestDatabase();
  const repo = new Repository(db);
  const data = await repo.initialize();
  data.wellness = {
    waist: [{ id: 'waist-1', date: '2026-10-26', cm: 92.4 }],
    recovery: [{ id: 'walk-1', date: '2026-10-26', minutes: 25, effort: 'Easy', note: 'Park' }],
    checks: [0, 3],
  };
  data.sessions.push(startSession(data.plans[0]));
  data.sessions[0].exercises[0].effort = 7;
  await repo.save(data);
  const loaded = await new Repository(db).initialize();
  assert.deepEqual(loaded, data);
  assert.deepEqual(parseBackup(serializeBackup(loaded)), data);
  assert.equal(JSON.parse(serializeBackup(data)).version, 2);
  db.native.close();
});
test('old version 1 backups receive safe empty defaults and invalid new entries are rejected', () => {
  const old = clone(freshData()) as unknown as Record<string, unknown>;
  delete old.wellness;
  const result = parseBackup(
    JSON.stringify({
      format: 'formwise',
      version: 1,
      exportedAt: new Date().toISOString(),
      data: old,
    }),
  );
  assert.equal(result.wellness.waist.length, 0);
  assert.equal(result.wellness.recovery.length, 0);
  assert.equal(result.wellness.checks.length, 0);
  result.wellness.waist.push({ id: 'one', date: '2026-02-30', cm: 90 });
  assert.throws(() => validateData(result), /calendar/);
  result.wellness.waist = [];
  result.wellness.recovery.push({
    id: 'walk',
    date: '2026-10-26',
    minutes: 0,
    effort: 'Easy',
    note: '',
  });
  assert.throws(() => validateData(result));
});
test('home beginner plan creates home movements rather than gym A and phase edits leave snapshots intact', () => {
  const plans = beginnerPlans();
  const home = plans.find((p) => p.id === 'beginner-home')!;
  const session = startSession(home);
  assert.equal(session.exercises[0].exercise.name, 'Chair squat');
  assert.ok(session.exercises.every((e) => e.exercise.equipment === 'Bodyweight'));
  home.exercises.forEach((e) => (e.sets = 3));
  assert.equal(session.exercises[0].sets.length, 1);
});
