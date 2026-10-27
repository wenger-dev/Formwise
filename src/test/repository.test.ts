import assert from 'node:assert/strict';
import { test } from 'node:test';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { Repository } from '../db/repository';
import { TestDatabase } from './adapter';
import {
  clone,
  finishSession,
  parseBackup,
  serializeBackup,
  startSession,
  uid,
} from '../lib/fitness';
test('empty database initializes schema and starter templates without fake history', async () => {
  const db = new TestDatabase();
  const repo = new Repository(db);
  const data = await repo.initialize();
  assert.ok(data.plans.length >= 6);
  assert.equal(data.sessions.length, 0);
  assert.deepEqual(await db.getAllAsync('SELECT version FROM schema_migrations'), [
    { version: 1 },
    { version: 2 },
  ]);
  assert.deepEqual(await db.getAllAsync('PRAGMA foreign_key_check'), []);
  db.native.close();
});
test('migrations are repeatable and preserve user data', async () => {
  const db = new TestDatabase();
  const repo = new Repository(db);
  const data = await repo.initialize();
  data.profile.name = 'Migration survivor';
  await repo.save(data);
  assert.equal((await repo.initialize()).profile.name, 'Migration survivor');
  assert.equal((await db.getAllAsync('SELECT * FROM schema_migrations')).length, 2);
  db.native.close();
});
test('create, edit, duplicate, reorder and delete plans survive repository reloads', async () => {
  const db = new TestDatabase();
  const repo = new Repository(db);
  const data = await repo.initialize();
  const p = clone(data.plans[0]);
  p.id = uid();
  p.template = false;
  p.name = 'My custom plan';
  p.exercises.reverse();
  data.plans.push(p);
  await repo.save(data);
  let loaded = await repo.load();
  assert.deepEqual(
    loaded.plans.find((x) => x.id === p.id),
    p,
  );
  loaded.plans.find((x) => x.id === p.id)!.name = 'Renamed';
  await repo.save(loaded);
  loaded = await repo.load();
  assert.equal(loaded.plans.find((x) => x.id === p.id)!.name, 'Renamed');
  loaded.plans = loaded.plans.filter((x) => x.id !== p.id);
  await repo.save(loaded);
  assert.equal((await repo.load()).plans.length, data.plans.length - 1);
  db.native.close();
});
test('real SQLite file recovers active set tracking and timer after close/reopen', async () => {
  const dir = mkdtempSync(join(tmpdir(), 'formwise-'));
  const path = join(dir, 'test.db');
  try {
    const db = new TestDatabase(path);
    const repo = new Repository(db);
    const data = await repo.initialize();
    const s = startSession(data.plans[0]);
    s.exercises[0].sets[0].completed = true;
    s.exercises[0].sets[0].weight = 25;
    s.timer = { duration: 60, remaining: 60, endAt: Date.now() + 60000 };
    data.sessions.push(s);
    await repo.save(data);
    db.native.close();
    const reopened = new TestDatabase(path);
    const restored = await new Repository(reopened).initialize();
    assert.deepEqual(restored.sessions[0], s);
    assert.equal(restored.sessions[0].status, 'active');
    reopened.native.close();
  } finally {
    rmSync(dir, { recursive: true });
  }
});
test('complete once, correct historical sets, delete history, preserve unrelated data', async () => {
  const db = new TestDatabase();
  const repo = new Repository(db);
  const data = await repo.initialize();
  let s = startSession(data.plans[0]);
  s.exercises[0].sets[0].completed = true;
  s = finishSession(s);
  data.sessions = [finishSession(s)];
  data.weights.push({ id: uid(), date: '2026-01-01', kg: 70 });
  await repo.save(data);
  const loaded = await repo.load();
  assert.equal(loaded.sessions.length, 1);
  loaded.sessions[0].exercises[0].sets[0].reps = 15;
  await repo.save(loaded);
  assert.equal((await repo.load()).sessions[0].exercises[0].sets[0].reps, 15);
  loaded.sessions = [];
  await repo.save(loaded);
  assert.equal((await repo.load()).weights[0].kg, 70);
  assert.deepEqual(await db.getAllAsync('PRAGMA foreign_key_check'), []);
  db.native.close();
});
test('export into a clean SQLite database restores all records and relations', async () => {
  const first = new TestDatabase();
  const repo = new Repository(first);
  const data = await repo.initialize();
  const s = startSession(data.plans[0]);
  s.exercises[0].sets[0].completed = true;
  data.sessions.push(finishSession(s));
  data.profile.name = 'Backup person';
  data.weights.push({ id: uid(), kg: 75, date: '2026-01-01' });
  data.goals.push({
    id: uid(),
    name: 'Three sessions',
    type: 'weekly',
    target: 3,
    exerciseId: null,
  });
  await repo.save(data);
  const backup = parseBackup(serializeBackup(await repo.load()));
  const second = new TestDatabase();
  const restored = new Repository(second);
  await restored.initialize();
  await restored.save(backup);
  assert.deepEqual(await restored.load(), backup);
  assert.deepEqual(await second.getAllAsync('PRAGMA foreign_key_check'), []);
  const sets = await second.getAllAsync('SELECT id FROM workout_sets');
  assert.equal(
    sets.length,
    s.exercises.reduce((n, e) => n + e.sets.length, 0),
  );
  first.native.close();
  second.native.close();
});
test('a failed import transaction rolls back all deleted and inserted records', async () => {
  const db = new TestDatabase();
  const repo = new Repository(db);
  const prior = await repo.initialize();
  prior.profile.name = 'Keep me';
  await repo.save(prior);
  const replacement = clone(prior);
  replacement.profile.name = 'Must rollback';
  replacement.weights.push({ id: uid(), date: '2026-01-01', kg: 65 });
  db.failOn = 'INSERT INTO bodyweight_entries';
  await assert.rejects(repo.save(replacement), /Injected/);
  db.failOn = null;
  assert.deepEqual(await repo.load(), prior);
  db.native.close();
});
test('malformed data is rejected before entering a write transaction', async () => {
  const db = new TestDatabase();
  const repo = new Repository(db);
  const prior = await repo.initialize();
  const invalid = clone(prior);
  invalid.profile.weeklyTarget = 99;
  await assert.rejects(repo.save(invalid));
  assert.deepEqual(await repo.load(), prior);
  db.native.close();
});
test('newer migration versions are rejected without modifying saved data', async () => {
  const db = new TestDatabase();
  const repo = new Repository(db);
  await repo.initialize();
  await db.runAsync('INSERT INTO schema_migrations(version) VALUES(?)', 3);
  await assert.rejects(repo.initialize(), /newer Formwise/);
  assert.equal((await db.getAllAsync('SELECT version FROM schema_migrations')).length, 3);
  db.native.close();
});
test('logging a set leaves unrelated plans untouched', async () => {
  const db = new TestDatabase();
  const repo = new Repository(db);
  const data = await repo.initialize();
  data.sessions.push(startSession(data.plans[0]));
  await repo.save(data);
  db.failOn = 'INSERT INTO workout_plans';
  data.sessions[0].exercises[0].sets[0].completed = true;
  await repo.save(data);
  assert.equal((await repo.load()).sessions[0].exercises[0].sets[0].completed, true);
  assert.deepEqual(await db.getAllAsync('PRAGMA foreign_key_check'), []);
  db.native.close();
});
test('an incomplete existing database is preserved instead of being treated as a new install', async () => {
  const db = new TestDatabase();
  const repo = new Repository(db);
  const data = await repo.initialize();
  data.plans[0].name = 'Preserve my plan';
  await repo.save(data);
  await db.runAsync('DELETE FROM user_profile');
  await assert.rejects(repo.initialize(), /database has been preserved/);
  const rows = await db.getAllAsync<{ payload: string }>(
    'SELECT payload FROM workout_plans WHERE id = ?',
    data.plans[0].id,
  );
  assert.equal(JSON.parse(rows[0].payload).name, 'Preserve my plan');
  db.native.close();
});
