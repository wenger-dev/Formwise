import React, { useState } from 'react';
import { View } from 'react-native';
import { router } from 'expo-router';
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
  Section,
  Sheet,
  confirm,
  useFeedback,
  useWide,
} from '../../components/ui';
import { Metric, MiniChart } from '../../components/visuals';
import { useApp } from '../../store/useApp';
import { colors as c } from '../../constants/theme';
import {
  dayOffset,
  fromKg,
  localDate,
  measurementGoalProgress,
  records,
  round,
  summary,
  toKg,
  uid,
  validDay,
  volume,
  weightUnit,
} from '../../lib/fitness';
import { Goal, WeightEntry } from '../../types/domain';
import { catalog } from '../../constants/catalog';

export default function Progress() {
  const { data, update } = useApp();
  const f = useFeedback();
  const wide = useWide();
  const [range, setRange] = useState(30);
  const [mountedAt] = useState(() => Date.now());
  const [chart, setChart] = useState('Frequency');
  const [weightOpen, setWeightOpen] = useState(false);
  const [measurementLimit, setMeasurementLimit] = useState(20);
  const [weightId, setWeightId] = useState<string | null>(null);
  const [weight, setWeight] = useState('');
  const [date, setDate] = useState(localDate());
  const [goalOpen, setGoalOpen] = useState(false);
  const [goalName, setGoalName] = useState('');
  const [goalType, setGoalType] = useState<Goal['type']>('weekly');
  const [target, setTarget] = useState('3');
  const [exerciseId, setExerciseId] = useState(catalog[0].id);
  if (!data) return null;
  const units = data.settings.units;
  const unit = weightUnit(units);
  const done = data.sessions.filter((s) => s.status === 'completed');
  const selected = done.filter(
    (s) => !range || localDate(s.finishedAt!) >= localDate(dayOffset(new Date(), -(range - 1))),
  );
  const stats = summary(selected);
  const lifetime = summary(done);
  const prs = records(done);
  const sortedWeights = [...data.weights].sort((a, b) => a.date.localeCompare(b.date));
  const chartWeights = sortedWeights.filter(
    (w) => !range || w.date >= localDate(dayOffset(new Date(), -(range - 1))),
  );
  const chartDays =
    range ||
    Math.max(
      7,
      Math.ceil(
        (mountedAt - Math.min(mountedAt, ...done.map((s) => new Date(s.finishedAt!).getTime()))) /
          86400000,
      ) + 1,
    );
  const buckets = Array.from({ length: Math.min(7, chartDays) }, (_, i) => {
    const start = localDate(
      dayOffset(new Date(), -chartDays + 1 + Math.floor((i * chartDays) / Math.min(7, chartDays))),
    );
    const end = localDate(
      dayOffset(
        new Date(),
        -chartDays + Math.floor(((i + 1) * chartDays) / Math.min(7, chartDays)),
      ),
    );
    const sessions = selected.filter(
      (s) => localDate(s.finishedAt!) >= start && localDate(s.finishedAt!) <= end,
    );
    return {
      label: `${Number(start.slice(5, 7))}/${Number(start.slice(8))}`,
      value:
        chart === 'Frequency'
          ? sessions.length
          : chart === 'Duration'
            ? sessions.reduce((n, s) => n + s.activeMs / 60000, 0)
            : sessions.reduce((n, s) => n + fromKg(volume(s), units), 0),
    };
  });
  const editWeight = (w?: WeightEntry) => {
    setWeightId(w?.id ?? null);
    setWeight(w ? String(round(fromKg(w.kg, units), 2)) : '');
    setDate(w?.date ?? localDate());
    setWeightOpen(true);
  };
  const goalValue = (g: Goal) =>
    g.type === 'weekly'
      ? lifetime.weekly
      : g.type === 'consistency'
        ? lifetime.current
        : g.type === 'exercise'
          ? (prs.find((r) => r.exerciseId === g.exerciseId)?.weight ?? 0)
          : (sortedWeights.at(-1)?.kg ?? 0);
  return (
    <Screen
      title="Progress you can feel."
      subtitle="The small wins are the big picture."
      action={
        <IconButton name="clock" label="Workout history" onPress={() => router.push('/history')} />
      }
    >
      {f.feedback}
      <Button
        title="Waist measurements & recovery"
        tone="secondary"
        icon="activity"
        onPress={() => router.push({ pathname: '/coach', params: { section: 'Measurements' } })}
      />
      <Row style={{ flexWrap: 'wrap' }}>
        {[7, 30, 90, 0].map((n) => (
          <Chip
            key={n}
            title={n ? `${n} days` : 'All time'}
            selected={range === n}
            onPress={() => setRange(n)}
          />
        ))}
      </Row>
      <Card>
        <Row style={{ flexWrap: 'wrap', gap: 22 }}>
          <Metric label="Workouts" value={String(stats.total)} detail="completed in this range" />
          <Metric label="Training time" value={`${stats.minutes} min`} color={c.lavender} />
          <Metric
            label="Measured volume"
            value={`${round(fromKg(stats.volume, units))}`}
            detail={unit}
            color={c.peach}
          />
        </Row>
      </Card>
      <View style={{ flexDirection: wide ? 'row' : 'column', gap: 20 }}>
        <Card style={{ flex: 1 }}>
          <Heading small>Your training rhythm</Heading>
          <Row style={{ flexWrap: 'wrap' }}>
            {['Frequency', 'Duration', 'Volume'].map((v) => (
              <Chip key={v} title={v} selected={chart === v} onPress={() => setChart(v)} />
            ))}
          </Row>
          {selected.length ? (
            <>
              <MiniChart
                data={buckets.map((b) => b.value)}
                labels={buckets.map((b) => b.label)}
                color={chart === 'Duration' ? c.lavender : chart === 'Volume' ? c.peach : c.lime}
              />
              <Label muted style={{ fontSize: 11 }}>
                Totals by date bucket ·{' '}
                {chart === 'Frequency'
                  ? 'completed workouts'
                  : chart === 'Duration'
                    ? 'active minutes'
                    : `${unit} × repetitions`}
                . Dates use your local calendar.
              </Label>
            </>
          ) : (
            <Empty
              title="Make your first mark"
              body="Complete a workout to see your training trend here."
            />
          )}
        </Card>
        <Card style={{ flex: wide ? 0.65 : 1 }}>
          <Heading small>Consistency, over time</Heading>
          <Metric label="Current streak" value={`${lifetime.current} days`} />
          <Metric label="Longest streak" value={`${lifetime.longest} days`} color={c.lavender} />
          <Label muted style={{ fontSize: 12 }}>
            A streak counts consecutive local calendar days with a completed workout. Yesterday’s
            streak stays active until today ends.
          </Label>
          <Button
            title="See workout history"
            tone="secondary"
            icon="arrow-up-right"
            onPress={() => router.push('/history')}
          />
        </Card>
      </View>
      <View>
        <Section title="Your personal bests" />
        {prs.length ? (
          <Card>
            {prs.map((r) => (
              <View key={r.exerciseId} style={{ gap: 8 }}>
                <Row style={{ justifyContent: 'space-between' }}>
                  <Label style={{ flex: 1 }}>{r.name}</Label>
                  <Badge color={c.lavender}>
                    {r.weight ? `${round(fromKg(r.weight, units))} ${unit}` : 'BODYWEIGHT'} ×{' '}
                    {r.reps}
                  </Badge>
                </Row>
                <Button
                  title="View record session"
                  tone="secondary"
                  onPress={() => router.push(`/session/${r.sessionId}`)}
                />
              </View>
            ))}
            <Label muted style={{ fontSize: 11 }}>
              Highest logged load, then most reps at that load. Completed sets only.
            </Label>
          </Card>
        ) : (
          <Card>
            <Label muted>
              Good things take a few reps. Your records will appear after you log completed sets.
            </Label>
          </Card>
        )}
      </View>
      {prs.length > 0 && (
        <Card>
          <Heading small>Exercise performance</Heading>
          <Row style={{ flexWrap: 'wrap' }}>
            {prs.map((r) => (
              <Chip
                key={r.exerciseId}
                title={r.name}
                selected={exerciseId === r.exerciseId}
                onPress={() => setExerciseId(r.exerciseId)}
              />
            ))}
          </Row>
          {(() => {
            const points = selected
              .filter((s) =>
                s.exercises.some(
                  (e) => e.exercise.id === exerciseId && e.sets.some((x) => x.completed),
                ),
              )
              .sort((a, b) => a.finishedAt!.localeCompare(b.finishedAt!))
              .slice(-7)
              .map((s) => {
                const sets = s.exercises
                  .filter((e) => e.exercise.id === exerciseId)
                  .flatMap((e) => e.sets)
                  .filter((x) => x.completed);
                return {
                  label: new Date(s.finishedAt!).toLocaleDateString(undefined, {
                    month: 'numeric',
                    day: 'numeric',
                  }),
                  value: Math.max(...sets.map((x) => fromKg(x.weight ?? 0, units))),
                };
              });
            return points.length ? (
              <>
                <MiniChart
                  data={points.map((x) => x.value)}
                  labels={points.map((x) => x.label)}
                  color={c.lavender}
                />
                <Label muted>
                  Highest logged load per session ({unit}); bodyweight = 0 measured load.
                </Label>
              </>
            ) : (
              <Label muted>No sessions for this exercise in the selected range.</Label>
            );
          })()}
        </Card>
      )}
      {data.settings.bodyweight && (
        <View>
          <Section
            title="Your body, your journey"
            action="Add measurement"
            onAction={() => editWeight()}
          />
          <Card>
            {chartWeights.length ? (
              <>
                <MiniChart
                  data={chartWeights.slice(-7).map((w) => round(fromKg(w.kg, units)))}
                  labels={chartWeights.slice(-7).map((w) => w.date.slice(5))}
                  color={c.peach}
                  suffix={` ${unit}`}
                />
                <Label muted style={{ fontSize: 11 }}>
                  Latest seven measurements in this range ({unit}). Measurements are shown
                  neutrally.
                </Label>
              </>
            ) : (
              <Label muted>
                Track measurements if they’re useful to you. No judgment, just information.
              </Label>
            )}
            {[...sortedWeights]
              .reverse()
              .slice(0, measurementLimit)
              .map((w) => (
                <Row key={w.id}>
                  <Label style={{ flex: 1 }}>{w.date}</Label>
                  <Label>
                    {round(fromKg(w.kg, units))} {unit}
                  </Label>
                  <IconButton
                    name="edit-2"
                    label={`Edit measurement ${w.date}`}
                    onPress={() => editWeight(w)}
                  />
                  <IconButton
                    name="trash-2"
                    label={`Delete measurement ${w.date}`}
                    color={c.danger}
                    onPress={() =>
                      void f.run(async () => {
                        if (
                          await confirm(
                            'Delete measurement?',
                            `Remove the measurement for ${w.date}?`,
                            true,
                          )
                        )
                          await update((d) => {
                            d.weights = d.weights.filter((x) => x.id !== w.id);
                          });
                      })
                    }
                  />
                </Row>
              ))}
            {sortedWeights.length > measurementLimit && (
              <Button
                title="Show 20 more measurements"
                tone="secondary"
                onPress={() => setMeasurementLimit((n) => n + 20)}
              />
            )}
            <Button
              title="Log a measurement"
              tone="secondary"
              icon="plus"
              onPress={() => editWeight()}
            />
          </Card>
        </View>
      )}
      <View>
        <Section
          title="Something to work toward"
          action="New goal"
          onAction={() => setGoalOpen(true)}
        />
        <View style={{ gap: 14 }}>
          {data.goals.map((g) => {
            const current = goalValue(g);
            const isWeight = g.type === 'weight';
            const initial = sortedWeights[0]?.kg;
            const progress = isWeight
              ? measurementGoalProgress(initial, sortedWeights.at(-1)?.kg, g.target)
              : current / g.target;
            return (
              <Card key={g.id}>
                <Row style={{ justifyContent: 'space-between' }}>
                  <Heading small>{g.name}</Heading>
                  <IconButton
                    name="trash-2"
                    label={`Delete goal ${g.name}`}
                    onPress={() =>
                      void f.run(async () => {
                        if (
                          await confirm(
                            'Remove goal?',
                            'Your measurements and workout history will stay saved.',
                            true,
                          )
                        )
                          await update((d) => {
                            d.goals = d.goals.filter((x) => x.id !== g.id);
                          });
                      })
                    }
                  />
                </Row>
                <ProgressBar value={progress} />
                <Label muted>
                  {isWeight && !sortedWeights.length
                    ? `Target: ${round(fromKg(g.target, units))} ${unit}`
                    : g.type === 'weight' || g.type === 'exercise'
                      ? `${round(fromKg(current, units))} / ${round(fromKg(g.target, units))} ${unit}`
                      : `${current} / ${g.target} ${g.type === 'weekly' ? 'workouts this week' : 'consecutive days'}`}
                </Label>
                {isWeight && !sortedWeights.length && (
                  <Label muted>Log a measurement to begin tracking this goal.</Label>
                )}
              </Card>
            );
          })}
          {!data.goals.length && (
            <Card>
              <Label muted>
                Set a weekly, consistency, exercise-load, or bodyweight goal that matters to you.
              </Label>
              <Button
                title="Create a goal"
                tone="secondary"
                icon="flag"
                onPress={() => setGoalOpen(true)}
              />
            </Card>
          )}
        </View>
      </View>
      <Sheet
        visible={weightOpen}
        title={weightId ? 'Edit measurement' : 'Check in with yourself'}
        onClose={() => setWeightOpen(false)}
      >
        <Field
          label={`Weight (${unit})`}
          value={weight}
          onChangeText={setWeight}
          keyboardType="decimal-pad"
        />
        <Field label="Date (YYYY-MM-DD)" value={date} onChangeText={setDate} />
        <Button
          title="Save measurement"
          onPress={() =>
            void f.run(async () => {
              const kg = toKg(Number(weight), units);
              if (!weight.trim() || !Number.isFinite(kg) || kg <= 0 || kg > 500)
                throw new Error('Enter a weight above zero and at most 500 kg (1102 lb).');
              if (!validDay(date) || date > localDate())
                throw new Error('Enter a real date, no later than today.');
              await update((d) => {
                if (weightId) {
                  const row = d.weights.find((w) => w.id === weightId)!;
                  row.kg = kg;
                  row.date = date;
                } else d.weights.push({ id: uid(), date, kg });
              });
              setWeightOpen(false);
            }, 'Measurement saved.')
          }
        />
        {f.feedback}
      </Sheet>
      <Sheet
        visible={goalOpen}
        title="A little direction goes a long way"
        onClose={() => setGoalOpen(false)}
      >
        <Field label="Goal name" value={goalName} onChangeText={setGoalName} />
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
          {(['weekly', 'consistency', 'exercise', 'weight'] as const).map((v) => (
            <Chip key={v} title={v} selected={goalType === v} onPress={() => setGoalType(v)} />
          ))}
        </View>
        {goalType === 'exercise' && (
          <View style={{ gap: 8 }}>
            {catalog.map((e) => (
              <Chip
                key={e.id}
                title={e.name}
                selected={exerciseId === e.id}
                onPress={() => setExerciseId(e.id)}
              />
            ))}
          </View>
        )}
        <Field
          label={
            goalType === 'weekly'
              ? 'Workouts per week (1–7)'
              : goalType === 'consistency'
                ? 'Consecutive days'
                : `Target (${unit})`
          }
          keyboardType="decimal-pad"
          value={target}
          onChangeText={setTarget}
        />
        <Button
          title="Save goal"
          onPress={() =>
            void f.run(async () => {
              const value =
                goalType === 'weight' || goalType === 'exercise'
                  ? toKg(Number(target), units)
                  : Number(target);
              if (
                !target.trim() ||
                !Number.isFinite(value) ||
                value <= 0 ||
                ((goalType === 'weekly' || goalType === 'consistency') && !Number.isInteger(value))
              )
                throw new Error(
                  'Enter a valid positive target; workout and day targets must be whole numbers.',
                );
              await update((d) => {
                d.goals.push({
                  id: uid(),
                  name: goalName,
                  type: goalType,
                  target: value,
                  exerciseId: goalType === 'exercise' ? exerciseId : null,
                });
                if (goalType === 'weekly') d.profile.weeklyTarget = value;
              });
              setGoalOpen(false);
              setGoalName('');
            }, 'Goal saved.')
          }
        />
        {f.feedback}
      </Sheet>
    </Screen>
  );
}
