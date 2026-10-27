import assert from 'node:assert/strict';
import { test } from 'node:test';
import { freshData } from '../constants/catalog';
import {
  clone,
  completedSets,
  dayOffset,
  durationMs,
  finishSession,
  fromCm,
  fromKg,
  localDate,
  measurementGoalProgress,
  parseBackup,
  records,
  remainingSeconds,
  serializeBackup,
  startSession,
  streaks,
  summary,
  toCm,
  toKg,
  validateData,
  validDay,
  volume,
  weekDays,
} from '../lib/fitness';
import { Session } from '../types/domain';
const at = (day: number, hour = 12) => new Date(2026, 9, day, hour).getTime();
test('measurement goals track distance neutrally for gains and losses without inventing achievement', () => {
  assert.equal(measurementGoalProgress(undefined, undefined, 70), 0);
  assert.equal(measurementGoalProgress(80, 75, 70), 0.5);
  assert.equal(measurementGoalProgress(60, 65, 70), 0.5);
  assert.equal(measurementGoalProgress(70, 70, 70), 1);
  assert.equal(measurementGoalProgress(70, 80, 70), 0);
  assert.equal(measurementGoalProgress(80, 90, 70), 0);
});
const completed = (day: number): Session => {
  const s = startSession(freshData().plans[0], at(day));
  s.exercises[0].sets[0] = { ...s.exercises[0].sets[0], completed: true, reps: 8, weight: 20 };
  return finishSession(s, at(day) + 600000);
};
test('weight and height unit conversions round trip without changing canonical values', () => {
  for (const n of [0, 0.5, 75.6, 250]) {
    assert.ok(Math.abs(toKg(fromKg(n, 'imperial'), 'imperial') - n) < 1e-9);
    assert.equal(toKg(n, 'metric'), n);
    assert.ok(Math.abs(toCm(fromCm(n, 'imperial'), 'imperial') - n) < 1e-9);
  }
});
test('session snapshots are independent of the original plan', () => {
  const data = freshData();
  const s = startSession(data.plans[0], at(26));
  data.plans[0].exercises[0].reps = 99;
  data.plans[0].name = 'Changed';
  assert.equal(s.exercises[0].sets[0].targetReps, 10);
  assert.equal(s.name, 'Full body foundations');
});
test('active duration handles pauses and resume without counting paused time', () => {
  const s = startSession(freshData().plans[0], 1000);
  assert.equal(durationMs(s, 6000), 5000);
  s.activeMs = 5000;
  s.runningSince = null;
  assert.equal(durationMs(s, 20000), 5000);
  s.runningSince = 20000;
  assert.equal(durationMs(s, 25000), 10000);
});
test('rest timer derives remaining time from timestamps and clamps expiry', () => {
  const timer = { duration: 60, remaining: 60, endAt: 61000 };
  assert.equal(remainingSeconds(timer, 1000), 60);
  assert.equal(remainingSeconds(timer, 40500), 21);
  assert.equal(remainingSeconds(timer, 80000), 0);
  assert.equal(remainingSeconds({ ...timer, endAt: null, remaining: 22 }, 90000), 22);
});
test('volume counts only completed measured sets', () => {
  const s = completed(26);
  s.exercises[0].sets[1].weight = 100;
  s.exercises[0].sets[1].reps = 10;
  s.exercises[1].sets[0].completed = true;
  s.exercises[1].sets[0].weight = null;
  assert.equal(volume(s), 160);
  assert.equal(completedSets(s), 2);
});
test('finishing is idempotent, records timestamps, and rejects empty sessions', () => {
  const s = completed(26);
  assert.deepEqual(finishSession(s, at(27)), s);
  assert.equal(s.activeMs, 600000);
  assert.equal(s.runningSince, null);
  assert.throws(() => finishSession(startSession(freshData().plans[0])), /at least one set/);
});
test('streak counts unique local days, accepts yesterday, and excludes abandoned workouts', () => {
  const sessions = [completed(23), completed(24), completed(24), completed(25)];
  assert.deepEqual(streaks(sessions, new Date(at(26))), { current: 3, longest: 3 });
  assert.equal(streaks(sessions, new Date(at(27))).current, 0);
  sessions[0].status = 'abandoned';
  assert.equal(streaks(sessions, new Date(at(26))).longest, 2);
});
test('weekly activity uses Monday through Sunday and only completed sessions', () => {
  const active = startSession(freshData().plans[0], at(26));
  const stats = summary([completed(25), completed(26), active], new Date(at(26)));
  assert.equal(stats.weekly, 1);
  assert.equal(stats.total, 2);
  assert.equal(weekDays(new Date(at(26)))[0].getDay(), 1);
  assert.equal(weekDays(new Date(at(26)))[6].getDay(), 0);
});
test('calendar offsets cross months, leap days, and local midnight', () => {
  assert.equal(localDate(dayOffset(new Date(2024, 2, 1), -1)), '2024-02-29');
  assert.equal(localDate(dayOffset(new Date(2026, 0, 1), -1)), '2025-12-31');
  assert.equal(validDay('2026-02-30'), false);
  assert.equal(validDay('2024-02-29'), true);
  const d = new Date(2026, 9, 26, 0, 1);
  assert.equal(localDate(d), '2026-10-26');
});
test('personal records compare load first then reps, ignore incomplete and abandoned sets', () => {
  const a = completed(24);
  const b = completed(25);
  b.exercises[0].sets[0].reps = 12;
  const c = completed(26);
  c.exercises[0].sets[0].weight = 30;
  c.status = 'abandoned';
  const best = records([a, b, c])[0];
  assert.equal(best.weight, 20);
  assert.equal(best.reps, 12);
  assert.equal(best.sessionId, b.id);
});
test('backup round trip retains real records and disables device-specific reminders', () => {
  const data = freshData();
  data.sessions.push(completed(26));
  data.profile.name = 'Ari';
  data.settings.reminder = { ...data.settings.reminder, enabled: true, ids: ['device-only'] };
  const restored = parseBackup(serializeBackup(data));
  assert.deepEqual(restored.sessions, data.sessions);
  assert.equal(restored.profile.name, 'Ari');
  assert.equal(restored.settings.reminder.enabled, false);
  assert.deepEqual(restored.settings.reminder.ids, []);
});
test('backup rejects malformed JSON, future versions, invalid references and duplicate IDs', () => {
  const routed = freshData();
  routed.plans[0].id = '../settings';
  assert.throws(() => validateData(routed), /Record IDs/);
  routed.plans[0].id = 'new';
  assert.throws(() => validateData(routed), /reserved/);
  assert.throws(() => parseBackup('{'), /valid JSON/);
  const data = freshData();
  assert.throws(
    () => parseBackup(JSON.stringify({ format: 'formwise', version: 8, data })),
    /supported/,
  );
  const invalid = clone(data);
  invalid.plans[0].exercises[0].exerciseId = 'missing';
  assert.throws(() => validateData(invalid), /unknown/);
  data.plans.push(clone(data.plans[0]));
  assert.throws(() => validateData(data), /Duplicate/);
});
test('input validation rejects impossible profile values and multiple active workouts', () => {
  const data = freshData();
  data.profile.heightCm = 500;
  assert.throws(() => validateData(data));
  data.profile.heightCm = 170;
  data.sessions.push(startSession(data.plans[0]), startSession(data.plans[1]));
  assert.throws(() => validateData(data), /one active/);
  data.sessions = [];
  data.settings.reminder.days = [1, 1];
  assert.throws(() => validateData(data), /weekday only once/);
  data.settings.reminder.days = Array.from({ length: 100 }, () => 1);
  assert.throws(() => validateData(data));
});
test('deletion and correction derive fresh metrics rather than cached totals', () => {
  const data = freshData();
  data.sessions = [completed(25), completed(26)];
  assert.equal(summary(data.sessions).total, 2);
  data.sessions[1].exercises[0].sets[0].weight = 40;
  assert.equal(volume(data.sessions[1]), 320);
  data.sessions.pop();
  assert.equal(summary(data.sessions).total, 1);
  assert.equal(records(data.sessions)[0].weight, 20);
});
test('calendar-day streaks remain consecutive across the daylight saving transition', () => {
  const days = [new Date(2026, 9, 31, 12), new Date(2026, 10, 1, 12), new Date(2026, 10, 2, 12)];
  const sessions = days.map((d) => {
    const s = startSession(freshData().plans[0], d.getTime());
    s.exercises[0].sets[0].completed = true;
    return finishSession(s, d.getTime() + 60000);
  });
  assert.deepEqual(streaks(sessions, days[2]), { current: 3, longest: 3 });
});
