import { TechniqueExtras } from '../../features/workouts/TechniqueExtras';
import React, { useEffect, useRef, useState } from 'react';
import { AppState } from 'react-native';
import { router, useLocalSearchParams, usePreventRemove } from 'expo-router';
import * as Haptics from 'expo-haptics';
import {
  Badge,
  Button,
  Card,
  Chip,
  Empty,
  Field,
  Heading,
  IconButton,
  Label,
  ProgressBar,
  Row,
  Screen,
  Sheet,
  confirm,
  useFeedback,
} from '../../components/ui';
import { useApp } from '../../store/useApp';
import { colors as c } from '../../constants/theme';
import {
  clone,
  uid,
  completedSets,
  durationLabel,
  durationMs,
  fromKg,
  isComplete,
  remainingSeconds,
  round,
  toKg,
  volume,
  weightUnit,
} from '../../lib/fitness';
import { Session } from '../../types/domain';
import { RestTimer } from '../../features/workouts/RestTimer';

type Inputs = Record<string, { reps: string; weight: string }>;
export default function SessionScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { data, update, finish } = useApp();
  const f = useFeedback();
  const session = data!.sessions.find((s) => s.id === id);
  const historical = session?.status === 'completed';
  const [now, setNow] = useState(() => Date.now());
  const [overview, setOverview] = useState(false);
  const [editingHistory, setEditingHistory] = useState(false);
  const [dirty, setDirty] = useState(false);
  const buffers = useRef<Inputs>(Object.create(null));
  const debounce = useRef<ReturnType<typeof setTimeout> | null>(null);
  const cue = useRef<number | null>(null);
  const units = data!.settings.units;
  const flush = async () => {
    const pending: Inputs = Object.assign(Object.create(null), buffers.current);
    if (!Object.keys(pending).length) return;
    for (const value of Object.values(pending)) {
      if (!/^\d+$/.test(value.reps) || Number(value.reps) > 1000)
        throw new Error('Repetitions must be a whole number between 0 and 1000.');
      if (
        value.weight.trim() &&
        (!/^\d+(\.\d+)?$/.test(value.weight) || toKg(Number(value.weight), units) > 1000)
      )
        throw new Error('Enter a valid non-negative weight, up to 1000 kg.');
    }
    await update((d) => {
      const s = d.sessions.find((x) => x.id === id);
      if (!s) throw new Error('Session was not found.');
      s.exercises.forEach((e) =>
        e.sets.forEach((set) => {
          const value = pending[set.id];
          if (value) {
            set.reps = Number(value.reps);
            set.weight = value.weight.trim() ? toKg(Number(value.weight), units) : null;
          }
        }),
      );
    });
    Object.keys(pending).forEach((key) => {
      if (buffers.current[key] === pending[key]) delete buffers.current[key];
    });
    if (!Object.keys(buffers.current).length) setDirty(false);
  };
  const flushRef = useRef(flush);
  const feedbackRef = useRef(f.run);
  useEffect(() => {
    flushRef.current = flush;
    feedbackRef.current = f.run;
  });
  usePreventRemove(dirty, ({ repeat }) => {
    void feedbackRef.current(async () => {
      await flushRef.current();
      setDirty(false);
      repeat();
    });
  });
  useEffect(() => {
    const tick = setInterval(() => setNow(Date.now()), 500);
    const sub = AppState.addEventListener('change', () => {
      setNow(Date.now());
      void feedbackRef.current(() => flushRef.current());
    });
    return () => {
      clearInterval(tick);
      sub.remove();
      if (debounce.current) clearTimeout(debounce.current);
      void flushRef.current().catch((e) => console.warn('Session input save failed', e));
    };
  }, []);
  const remaining = remainingSeconds(session?.timer ?? null, now);
  useEffect(() => {
    if (session?.timer?.endAt && remaining === 0 && cue.current !== session.timer.endAt) {
      cue.current = session.timer.endAt;
      if (data?.settings.haptics)
        void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
    }
  }, [remaining, session?.timer?.endAt, data?.settings.haptics]);
  if (!session)
    return (
      <Screen title="Workout unavailable">
        <Empty
          title="This session is no longer here"
          body="It may have been removed from your history."
          action={<Button title="Home" onPress={() => router.replace('/')} />}
        />
      </Screen>
    );
  const active = session.status === 'active';
  const previous = historical
    ? data!.sessions
        .filter(
          (s) =>
            s.status === 'completed' &&
            s.id !== session.id &&
            (s.planId ? s.planId === session.planId : s.name === session.name) &&
            s.finishedAt! < session.finishedAt!,
        )
        .sort((a, b) => b.finishedAt!.localeCompare(a.finishedAt!))[0]
    : undefined;
  const editable = active || editingHistory;
  const e = session.exercises[session.currentExercise];
  const totalSets = session.exercises.reduce((n, x) => n + x.sets.length, 0);
  const action = (task: () => Promise<unknown>) =>
    void f.run(async () => {
      if (debounce.current) clearTimeout(debounce.current);
      await flush();
      await task();
    });
  const mutate = (fn: (s: Session) => void) =>
    update((d) => {
      const current = d.sessions.find((x) => x.id === id);
      if (!current) throw new Error('Workout was not found.');
      fn(current);
    });
  const input = (setId: string, key: 'reps' | 'weight', value: string) => {
    const set = session.exercises.flatMap((x) => x.sets).find((x) => x.id === setId)!;
    const current = buffers.current[setId] ?? {
      reps: String(set.reps),
      weight: set.weight === null ? '' : String(round(fromKg(set.weight, units), 3)),
    };
    buffers.current[setId] = { ...current, [key]: value };
    setDirty(true);
    if (debounce.current) clearTimeout(debounce.current);
    debounce.current = setTimeout(() => {
      void f.run(() => flushRef.current());
    }, 500);
  };
  const go = (position: number) =>
    action(async () => {
      await mutate((s) => {
        s.currentExercise = position;
      });
      setOverview(false);
    });
  return (
    <Screen
      title={session.name}
      subtitle={
        historical
          ? `${new Date(session.finishedAt!).toLocaleString()} · Saved workout`
          : 'One set closer. Keep going.'
      }
      action={
        <IconButton
          name="arrow-left"
          label="Leave workout screen and save"
          onPress={() => action(async () => router.replace(historical ? '/history' : '/'))}
        />
      }
    >
      {f.feedback}
      <Card>
        <Row style={{ justifyContent: 'space-between', flexWrap: 'wrap' }}>
          <Badge color={historical ? c.lavender : c.lime}>
            {historical
              ? editingHistory
                ? 'EDITING SAVED RESULTS'
                : 'WORKOUT COMPLETE'
              : session.status === 'abandoned'
                ? 'ABANDONED'
                : session.runningSince === null
                  ? 'PAUSED'
                  : 'WORKOUT IN PROGRESS'}
          </Badge>
          <Label
            style={{
              fontVariant: ['tabular-nums'],
              fontWeight: '700',
              fontSize: 24,
              lineHeight: 30,
            }}
          >
            {durationLabel(durationMs(session, now))}
          </Label>
        </Row>
        <ProgressBar value={completedSets(session) / totalSets} />
        <Row style={{ justifyContent: 'space-between' }}>
          <Label muted>
            {completedSets(session)} of {totalSets} sets logged
          </Label>
          <Label muted>
            {round(fromKg(volume(session), units))} {weightUnit(units)} volume
          </Label>
        </Row>
        {active && (
          <Row>
            <Button
              title={session.runningSince === null ? 'Resume' : 'Pause workout'}
              tone="secondary"
              icon={session.runningSince === null ? 'play' : 'pause'}
              onPress={() =>
                action(() =>
                  mutate((s) => {
                    const time = Date.now();
                    s.activeMs = durationMs(s, time);
                    s.runningSince = s.runningSince === null ? time : null;
                    if (s.timer) {
                      const left = remainingSeconds(s.timer, time);
                      s.timer = {
                        ...s.timer,
                        remaining: left,
                        endAt: s.runningSince === null ? null : time + left * 1000,
                      };
                    }
                  }),
                )
              }
              style={{ flex: 1 }}
            />
            <Button
              title="Overview"
              tone="secondary"
              icon="list"
              onPress={() => action(async () => setOverview(true))}
            />
          </Row>
        )}
        {historical && (
          <Button
            title={editingHistory ? 'Save corrections' : 'Correct saved results'}
            tone="secondary"
            icon="edit-2"
            onPress={() =>
              action(async () => {
                if (editingHistory) {
                  if (
                    await confirm(
                      'Save corrections?',
                      'Progress and personal records will reflect your corrected results.',
                    )
                  )
                    setEditingHistory(false);
                } else if (
                  await confirm(
                    'Edit this workout?',
                    'Changes to sets are saved automatically. Progress is recalculated from saved results.',
                  )
                )
                  setEditingHistory(true);
              })
            }
          />
        )}
      </Card>
      {historical && previous && (
        <Card>
          <Badge color={c.lavender}>COMPARED WITH YOUR PREVIOUS SESSION</Badge>
          <Label muted>
            {new Date(previous.finishedAt!).toLocaleDateString()} · {previous.name}
          </Label>
          <Label>
            {completedSets(session)} sets vs {completedSets(previous)} sets ·{' '}
            {durationLabel(session.activeMs)} vs {durationLabel(previous.activeMs)} active time
          </Label>
          <Label muted>
            {round(fromKg(volume(session), units))} vs {round(fromKg(volume(previous), units))}{' '}
            {weightUnit(units)} measured volume. Different exercise selections may affect totals.
          </Label>
        </Card>
      )}
      <Row style={{ justifyContent: 'space-between' }}>
        <Heading small>{historical ? 'Workout results' : 'Your current movement'}</Heading>
        <Label muted>
          {session.currentExercise + 1} / {session.exercises.length}
        </Label>
      </Row>
      <Card>
        <Badge color={c.lavender}>
          {e.exercise.muscle.toUpperCase()} · {e.exercise.equipment.toUpperCase()}
        </Badge>
        <Heading small>{e.exercise.name}</Heading>
        <Button
          title="Watch YouTube demo"
          icon="play-circle"
          tone="secondary"
          onPress={() =>
            void f.run(async () => {
              await flush();
              router.push({
                pathname: '/exercise-video',
                params: { exerciseId: e.exercise.id, sessionId: session.id },
              });
            })
          }
        />
        {e.skipped && <Badge color={c.peach}>SKIPPED</Badge>}
        {e.exercise.instructions.map((step, i) => (
          <Label muted key={i} style={{ fontSize: 12, lineHeight: 21 }}>
            {i + 1}. {step}
          </Label>
        ))}
        <Label style={{ color: c.muted, fontSize: 11 }}>{e.exercise.notes}</Label>
        <TechniqueExtras
          collapsible
          exercise={e.exercise}
          swapDisabled={e.sets.some((x) => x.completed)}
          onSwap={
            !historical && session.status === 'active'
              ? (alternative) =>
                  void f.run(async () => {
                    await flush();
                    if (
                      !(await confirm(
                        'Switch exercise?',
                        'The alternative will replace this movement in this workout only. Uncompleted load entries are reset. Your saved plan stays the same.',
                      ))
                    )
                      return;
                    await update((d) => {
                      const s = d.sessions.find((x) => x.id === id)!;
                      const item = s.exercises.find((x) => x.id === e.id)!;
                      if (item.sets.some((x) => x.completed))
                        throw new Error('Undo completed sets before changing the exercise.');
                      item.exercise = clone(alternative);
                      item.effort = null;
                      item.skipped = false;
                      s.timer = null;
                      item.sets = item.sets.map((x) => ({
                        ...x,
                        id: uid(),
                        weight: null,
                        targetWeight: null,
                        reps: x.targetReps,
                        notes: '',
                      }));
                    });
                    f.show('Alternative selected for this workout.');
                  })
              : undefined
          }
        />
        <Label muted>Exercise effort · 1 easy to 10 maximal</Label>
        <Row style={{ flexWrap: 'wrap' }}>
          {Array.from({ length: 10 }, (_, i) => i + 1).map((n) => (
            <Chip
              key={n}
              title={String(n)}
              selected={e.effort === n}
              onPress={() =>
                void f.run(() =>
                  update((d) => {
                    const s = d.sessions.find((x) => x.id === id)!;
                    if (s.status !== 'active' && !editingHistory)
                      throw new Error('Unlock history editing first.');
                    s.exercises.find((x) => x.id === e.id)!.effort = e.effort === n ? null : n;
                  }),
                )
              }
            />
          ))}
        </Row>
      </Card>
      <Card>
        <Row>
          <Label style={{ width: 36, color: c.secondary, fontSize: 11 }}>SET</Label>
          <Label style={{ flex: 1, color: c.secondary, fontSize: 11 }}>REPS</Label>
          <Label style={{ flex: 1, color: c.secondary, fontSize: 11 }}>
            LOAD ({weightUnit(units)})
          </Label>
          <Label style={{ width: 60, color: c.secondary, fontSize: 11 }}>STATUS</Label>
        </Row>
        {e.sets.map((set) => (
          <Row key={set.id} style={{ alignItems: 'center', gap: 10 }}>
            <Label
              style={{ width: 30, color: set.completed ? c.lime : c.secondary, fontWeight: '700' }}
            >
              {String(set.number).padStart(2, '0')}
            </Label>
            <Field
              label={`Set ${set.number} reps`}
              keyboardType="number-pad"
              defaultValue={String(set.reps)}
              editable={editable && !e.skipped}
              onChangeText={(v) => input(set.id, 'reps', v)}
            />
            <Field
              label={`Set ${set.number} ${weightUnit(units)}`}
              keyboardType="decimal-pad"
              placeholder="BW"
              defaultValue={set.weight === null ? '' : String(round(fromKg(set.weight, units), 2))}
              editable={editable && !e.skipped}
              onChangeText={(v) => input(set.id, 'weight', v)}
            />
            <IconButton
              disabled={!editable || e.skipped}
              name={set.completed ? 'check-circle' : 'circle'}
              color={set.completed ? c.lime : c.muted}
              label={`${set.completed ? 'Unmark' : 'Complete'} set ${set.number}`}
              onPress={() =>
                editable &&
                !e.skipped &&
                action(async () => {
                  if (
                    historical &&
                    !(await confirm(
                      'Correct this set?',
                      'This changes the saved completion status and progress metrics.',
                    ))
                  )
                    return;
                  await mutate((s) => {
                    const exercise = s.exercises.find((x) => x.id === e.id)!;
                    const target = exercise.sets.find((x) => x.id === set.id)!;
                    target.completed = !target.completed;
                    if (target.completed && active && s.runningSince !== null)
                      s.timer = {
                        duration: exercise.rest,
                        remaining: exercise.rest,
                        endAt: Date.now() + exercise.rest * 1000,
                      };
                  });
                  if (data?.settings.haptics)
                    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
                })
              }
            />
          </Row>
        ))}
        <Label muted style={{ fontSize: 11 }}>
          Blank load = bodyweight / unmeasured. Volume only includes measured loads.
          {editable ? ' Valid entries save automatically.' : ''}
        </Label>
        {active && (
          <Button
            title={e.skipped ? 'Restore exercise' : 'Skip this exercise'}
            tone="secondary"
            onPress={() =>
              action(async () => {
                if (
                  e.skipped ||
                  (await confirm(
                    'Skip this exercise?',
                    'Any logged sets in this exercise will be cleared and it will be marked skipped.',
                  ))
                )
                  await mutate((s) => {
                    const item = s.exercises.find((x) => x.id === e.id)!;
                    item.skipped = !item.skipped;
                    if (item.skipped)
                      item.sets.forEach((x) => {
                        x.completed = false;
                      });
                  });
              })
            }
          />
        )}
      </Card>
      <Row>
        <Button
          title="Previous"
          tone="secondary"
          icon="arrow-left"
          disabled={session.currentExercise === 0}
          onPress={() => go(session.currentExercise - 1)}
          style={{ flex: 1 }}
        />
        <Button
          title="Next exercise"
          icon="arrow-right"
          disabled={session.currentExercise === session.exercises.length - 1}
          onPress={() => go(session.currentExercise + 1)}
          style={{ flex: 1 }}
        />
      </Row>
      {active && (
        <RestTimer
          timer={session.timer}
          now={now}
          defaultDuration={data!.settings.rest}
          run={action}
          change={mutate}
        />
      )}
      <Card>
        <Field
          label="Workout note"
          maxLength={2000}
          key={`${session.id}-note`}
          defaultValue={session.note}
          editable={editable}
          multiline
          placeholder="How did that feel?"
          onChangeText={(note) =>
            void f.run(() =>
              mutate((s) => {
                s.note = note;
              }),
            )
          }
        />
        <Label muted>How was your session?</Label>
        <Row>
          {[1, 2, 3, 4, 5].map((n) => (
            <Chip
              key={n}
              title={`${n} ★`}
              selected={session.rating === n}
              disabled={!editable}
              onPress={() =>
                editable &&
                action(() =>
                  mutate((s) => {
                    s.rating = n;
                  }),
                )
              }
            />
          ))}
        </Row>
      </Card>
      {active && (
        <>
          <Button
            title="Finish workout"
            icon="check"
            onPress={() =>
              action(async () => {
                const saved = useApp.getState().data!.sessions.find((s) => s.id === id)!;
                if (
                  await confirm(
                    isComplete(saved) ? 'Finish this workout?' : 'Some sets are still incomplete',
                    `Save ${completedSets(saved)} completed sets? Incomplete sets stay uncompleted in your history.`,
                  )
                )
                  await finish(id);
              })
            }
          />
          <Button
            title="Abandon workout"
            tone="danger"
            onPress={() =>
              action(async () => {
                if (
                  await confirm(
                    'Abandon this workout?',
                    'This session will not count toward progress. Its completed sets will not be counted.',
                    true,
                  )
                ) {
                  await mutate((s) => {
                    s.activeMs = durationMs(s);
                    s.status = 'abandoned';
                    s.runningSince = null;
                    s.timer = null;
                  });
                  router.replace('/');
                }
              })
            }
          />
        </>
      )}
      {historical && (
        <>
          <Label muted>
            Saved results update your progress automatically. Exercise loads are compared by highest
            weight, then repetitions at that weight.
          </Label>
          <Button
            title="Delete this workout"
            tone="danger"
            icon="trash-2"
            onPress={() =>
              action(async () => {
                if (
                  await confirm(
                    'Delete workout permanently?',
                    'This removes the session and its sets. Your progress and records will be recalculated.',
                    true,
                  )
                ) {
                  await update((d) => {
                    d.sessions = d.sessions.filter((s) => s.id !== id);
                  });
                  router.replace('/history');
                }
              })
            }
          />
        </>
      )}
      <Sheet visible={overview} title="Session overview" onClose={() => setOverview(false)}>
        {session.exercises.map((item, i) => (
          <Button
            key={item.id}
            title={`${i + 1}. ${item.exercise.name} · ${item.skipped ? 'Skipped' : `${item.sets.filter((s) => s.completed).length}/${item.sets.length} sets`}`}
            tone="secondary"
            onPress={() => go(i)}
          />
        ))}
      </Sheet>
    </Screen>
  );
}
