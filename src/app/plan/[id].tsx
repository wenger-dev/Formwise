import React, { useState } from 'react';
import { Pressable, View } from 'react-native';
import { router, useLocalSearchParams, usePreventRemove } from 'expo-router';
import {
  Badge,
  Button,
  Card,
  Empty,
  Field,
  Heading,
  IconButton,
  Label,
  Row,
  Screen,
  confirm,
  useFeedback,
} from '../../components/ui';
import { ExerciseBrowser } from '../../features/workouts/ExerciseBrowser';
import { YouTubePlayer } from '../../features/workouts/YouTubePlayer';
import { useApp } from '../../store/useApp';
import { Plan } from '../../types/domain';
import { catalog } from '../../constants/catalog';
import { clone, estimatedMinutes, fromKg, round, toKg, uid, weightUnit } from '../../lib/fitness';
import { exerciseVideo } from '../../lib/youtube';
import { colors as c } from '../../constants/theme';

// ─── Muscle tag colour mapping ──────────────────────────────────────────────
const MUSCLE_COLORS: Record<string, string> = {
  Chest: c.peach,
  Back: c.blue,
  Legs: c.lime,
  Glutes: c.lime,
  Shoulders: c.lavender,
  Arms: c.peach,
  Core: c.blue,
  Cardio: '#98f5c4',
  Mobility: '#98f5c4',
};

function muscleColor(muscle: string) {
  for (const [key, color] of Object.entries(MUSCLE_COLORS)) {
    if (muscle.includes(key)) return color;
  }
  return c.lime;
}

// ─── Single exercise row (view mode) ────────────────────────────────────────
function ExerciseRow({
  exercise,
  index,
  prescription,
  units,
  videoId,
}: {
  exercise: ReturnType<typeof catalog.find> & object;
  index: number;
  prescription: { sets: number; reps: number; rest: number; weight: number | null };
  units: 'metric' | 'imperial';
  videoId: string | null;
}) {
  const [expanded, setExpanded] = useState(false);
  const num = String(index + 1).padStart(2, '0');
  const tagColor = muscleColor((exercise as any).muscle ?? '');

  return (
    <Card>
      {/* ── Header row: number badge + name + expand toggle ── */}
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`${expanded ? 'Collapse' : 'Expand'} ${(exercise as any).name}`}
        onPress={() => setExpanded((v) => !v)}
      >
        <Row style={{ alignItems: 'flex-start', gap: 12 }}>
          {/* Number badge */}
          <View
            style={{
              width: 40,
              height: 40,
              borderRadius: 12,
              backgroundColor: `${c.lime}18`,
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}
          >
            <Label style={{ color: c.lime, fontWeight: '800', fontSize: 13, letterSpacing: 0.5 }}>
              {num}
            </Label>
          </View>

          {/* Name + muscle/equipment chips */}
          <View style={{ flex: 1, gap: 5 }}>
            <Label style={{ fontWeight: '700', fontSize: 15, letterSpacing: -0.2 }}>
              {(exercise as any).name}
            </Label>
            <Row style={{ flexWrap: 'wrap', gap: 5 }}>
              <View
                style={{
                  paddingHorizontal: 8,
                  paddingVertical: 4,
                  borderRadius: 7,
                  backgroundColor: `${tagColor}18`,
                }}
              >
                <Label style={{ color: tagColor, fontSize: 10, fontWeight: '700' }}>
                  {(exercise as any).muscle?.toUpperCase()}
                </Label>
              </View>
              <View
                style={{
                  paddingHorizontal: 8,
                  paddingVertical: 4,
                  borderRadius: 7,
                  backgroundColor: `${c.secondary}15`,
                }}
              >
                <Label style={{ color: c.secondary, fontSize: 10, fontWeight: '600' }}>
                  {(exercise as any).equipment?.toUpperCase()}
                </Label>
              </View>
            </Row>
          </View>

          {/* Expand chevron */}
          <View style={{ paddingTop: 10 }}>
            <Label style={{ color: c.muted, fontSize: 13 }}>{expanded ? '▲' : '▼'}</Label>
          </View>
        </Row>
      </Pressable>

      {/* ── Prescription summary ── */}
      <Label muted style={{ marginTop: 8, fontSize: 13 }}>
        {prescription.sets} sets × {prescription.reps} reps · {prescription.rest}s rest
        {prescription.weight !== null
          ? ` · ${round(fromKg(prescription.weight, units))} ${weightUnit(units)}`
          : ' · Choose your load'}
      </Label>

      {/* ── Expanded: instructions + video ── */}
      {expanded && (
        <View style={{ marginTop: 14, gap: 10 }}>
          {/* Instructions */}
          <View
            style={{
              backgroundColor: '#0e130f',
              borderRadius: 12,
              borderWidth: 1,
              borderColor: c.border,
              padding: 14,
              gap: 8,
            }}
          >
            {((exercise as any).instructions ?? []).map((step: string, n: number) => (
              <Row key={n} style={{ alignItems: 'flex-start', gap: 10 }}>
                <Label
                  style={{
                    color: c.lime,
                    fontWeight: '800',
                    fontSize: 12,
                    minWidth: 20,
                    paddingTop: 1,
                  }}
                >
                  {n + 1}.
                </Label>
                <Label muted style={{ flex: 1, fontSize: 13, lineHeight: 20 }}>
                  {step}
                </Label>
              </Row>
            ))}
            {(exercise as any).notes ? (
              <View
                style={{
                  marginTop: 6,
                  paddingTop: 8,
                  borderTopWidth: 1,
                  borderTopColor: c.border,
                  flexDirection: 'row',
                  gap: 8,
                  alignItems: 'flex-start',
                }}
              >
                <Label style={{ color: c.lime, fontSize: 12, fontWeight: '700' }}>💡</Label>
                <Label style={{ flex: 1, color: c.lime, fontSize: 12, lineHeight: 18 }}>
                  {(exercise as any).notes}
                </Label>
              </View>
            ) : null}
          </View>

          {/* Video player */}
          {videoId ? (
            <View style={{ gap: 6 }}>
              <Label style={{ color: c.secondary, fontSize: 11, fontWeight: '600', letterSpacing: 0.4 }}>
                DEMONSTRATION VIDEO
              </Label>
              <YouTubePlayer videoId={videoId} />
            </View>
          ) : null}
        </View>
      )}
    </Card>
  );
}

export default function PlanDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { data, update, start } = useApp();
  const f = useFeedback();
  const original = data!.plans.find((p) => p.id === id);
  const [editing, setEditing] = useState(id === 'new');
  const [browser, setBrowser] = useState(false);
  const [draft, setDraft] = useState<Plan>(() =>
    original
      ? clone(original)
      : {
          id: uid(),
          name: '',
          description: '',
          template: false,
          archived: false,
          updatedAt: new Date().toISOString(),
          exercises: [],
        },
  );
  const disableGuard = usePreventRemove(editing, ({ repeat }) => {
    void f.run(async () => {
      if (await confirm('Discard changes?', 'Your unsaved plan edits will be lost.')) {
        setEditing(false);
        repeat();
      }
    });
  });
  if (!data) return null;
  if (!original && id !== 'new')
    return (
      <Screen title="Plan unavailable">
        <Empty
          title="This plan was removed"
          body="Your completed workout history is still saved."
          action={<Button title="Back to workouts" onPress={() => router.replace('/workouts')} />}
        />
      </Screen>
    );
  const plan = editing ? draft : (original ?? draft);
  const change = (index: number, key: string, value: number | null) =>
    setDraft((p) => ({
      ...p,
      exercises: p.exercises.map((e, i) => (i === index ? { ...e, [key]: value } : e)),
    }));
  const save = () =>
    void f.run(async () => {
      await update((d) => {
        const saved = { ...draft, updatedAt: new Date().toISOString() };
        const index = d.plans.findIndex((p) => p.id === saved.id);
        if (index < 0) d.plans.push(saved);
        else d.plans[index] = saved;
      });
      disableGuard();
      setEditing(false);
      if (id === 'new') router.replace(`/plan/${draft.id}`);
    }, 'Workout saved.');
  return (
    <Screen
      title={editing ? (id === 'new' ? 'Make it your own.' : 'Refine your routine.') : plan.name}
      subtitle={editing ? 'Build a session that works for you.' : plan.description}
      action={
        <IconButton name="arrow-left" label="Back to workouts" onPress={() => router.back()} />
      }
    >
      {f.feedback}
      {editing ? (
        <Card>
          <Field
            label="Workout name"
            value={draft.name}
            onChangeText={(name) => setDraft((p) => ({ ...p, name }))}
            placeholder="e.g. Monday strength"
            maxLength={100}
          />
          <Field
            label="Focus / description"
            value={draft.description}
            onChangeText={(description) => setDraft((p) => ({ ...p, description }))}
            multiline
          />
        </Card>
      ) : (
        <Card>
          <Row style={{ justifyContent: 'space-between', flexWrap: 'wrap' }}>
            <Badge>{plan.template ? 'CUSTOMIZABLE STARTER TEMPLATE' : 'YOUR CUSTOM PLAN'}</Badge>
            <Label muted>
              {plan.exercises.length} exercises · ~{estimatedMinutes(plan)} min
            </Label>
          </Row>
          <Button
            title={
              data.sessions.some((s) => s.status === 'active')
                ? 'Resume active workout'
                : 'Start workout'
            }
            icon="play"
            onPress={() => void f.run(async () => router.push(`/session/${await start(plan.id)}`))}
          />
          <Row style={{ flexWrap: 'wrap' }}>
            <Button
              title="Edit plan"
              tone="secondary"
              icon="edit-2"
              onPress={() => {
                setDraft(clone(plan));
                setEditing(true);
              }}
            />
            <Button
              title="Make a copy"
              tone="secondary"
              icon="copy"
              onPress={() =>
                void f.run(async () => {
                  const copy = {
                    ...clone(plan),
                    id: uid(),
                    name: `${plan.name.slice(0, 90)} (copy)`,
                    template: false,
                    archived: false,
                    updatedAt: new Date().toISOString(),
                  };
                  await update((d) => {
                    d.plans.push(copy);
                  });
                  router.replace(`/plan/${copy.id}`);
                })
              }
            />
          </Row>
        </Card>
      )}

      <Heading small>{editing ? 'Build your exercise list' : 'The game plan'}</Heading>

      {plan.exercises.map((e, i) => {
        const exercise = catalog.find((x) => x.id === e.exerciseId)!;
        if (!exercise) return null;

        if (editing) {
          return (
            <Card key={e.id}>
              <Row>
                <Badge>{String(i + 1).padStart(2, '0')}</Badge>
                <View style={{ flex: 1 }}>
                  <Label style={{ fontWeight: '700' }}>{exercise.name}</Label>
                  <Label muted style={{ fontSize: 11 }}>
                    {exercise.muscle} · {exercise.equipment}
                  </Label>
                </View>
                <IconButton
                  name="x"
                  label={`Remove ${exercise.name}`}
                  onPress={() =>
                    setDraft((p) => ({ ...p, exercises: p.exercises.filter((_, n) => n !== i) }))
                  }
                />
              </Row>
              <Row style={{ flexWrap: 'wrap' }}>
                <Field
                  label="Sets"
                  keyboardType="number-pad"
                  value={String(e.sets)}
                  onChangeText={(v) => change(i, 'sets', v === '' ? 0 : Number(v))}
                />
                <Field
                  label="Reps"
                  keyboardType="number-pad"
                  value={String(e.reps)}
                  onChangeText={(v) => change(i, 'reps', v === '' ? 0 : Number(v))}
                />
                <Field
                  label="Rest (sec)"
                  keyboardType="number-pad"
                  value={String(e.rest)}
                  onChangeText={(v) => change(i, 'rest', Number(v))}
                />
              </Row>
              <Field
                label={`Target weight (${weightUnit(data.settings.units)}, optional)`}
                keyboardType="decimal-pad"
                defaultValue={
                  e.weight === null ? '' : String(round(fromKg(e.weight, data.settings.units), 2))
                }
                onChangeText={(v) =>
                  change(
                    i,
                    'weight',
                    v.trim() === '' ? null : toKg(Number(v), data.settings.units),
                  )
                }
              />
              <Row>
                <Button
                  title="Move up"
                  tone="secondary"
                  disabled={i === 0}
                  onPress={() =>
                    setDraft((p) => {
                      const exercises = [...p.exercises];
                      [exercises[i - 1], exercises[i]] = [exercises[i], exercises[i - 1]];
                      return { ...p, exercises };
                    })
                  }
                />
                <Button
                  title="Move down"
                  tone="secondary"
                  disabled={i === plan.exercises.length - 1}
                  onPress={() =>
                    setDraft((p) => {
                      const exercises = [...p.exercises];
                      [exercises[i + 1], exercises[i]] = [exercises[i], exercises[i + 1]];
                      return { ...p, exercises };
                    })
                  }
                />
              </Row>
            </Card>
          );
        }

        const videoId = exerciseVideo(exercise, data.settings.exerciseVideos);
        return (
          <ExerciseRow
            key={e.id}
            exercise={exercise}
            index={i}
            prescription={e}
            units={data.settings.units}
            videoId={videoId}
          />
        );
      })}

      {editing ? (
        <>
          <Button
            title="Add exercise"
            icon="plus"
            tone="secondary"
            onPress={() => setBrowser(true)}
          />
          <Button title="Save workout" icon="check" onPress={save} disabled={data === null} />
          <Button
            title="Cancel editing"
            tone="secondary"
            onPress={() =>
              void f.run(async () => {
                if (await confirm('Discard changes?', 'Your saved plan will stay as it was.')) {
                  disableGuard();
                  setEditing(false);
                  if (id === 'new') router.back();
                }
              })
            }
          />
        </>
      ) : (
        <>
          <Button
            title={
              data.profile.preferredPlanId === plan.id
                ? 'Your preferred workout ✓'
                : 'Set as preferred workout'
            }
            tone="secondary"
            icon="calendar"
            onPress={() =>
              void f.run(
                () =>
                  update((d) => {
                    d.profile.preferredPlanId = plan.id;
                  }),
                'Preferred workout updated.',
              )
            }
          />
          <Row style={{ flexWrap: 'wrap' }}>
            <Button
              title={plan.archived ? 'Restore plan' : 'Archive plan'}
              tone="secondary"
              icon="archive"
              onPress={() =>
                void f.run(async () => {
                  if (
                    await confirm(
                      plan.archived ? 'Restore plan?' : 'Archive plan?',
                      'This changes its visibility in your workout library. History stays saved.',
                    )
                  )
                    await update((d) => {
                      d.plans.find((p) => p.id === plan.id)!.archived = !plan.archived;
                    });
                })
              }
            />
            <Button
              title="Delete plan"
              tone="danger"
              icon="trash-2"
              onPress={() =>
                void f.run(async () => {
                  if (
                    await confirm(
                      'Delete workout plan?',
                      'This removes the plan. Saved sessions and active workout snapshots will remain.',
                      true,
                    )
                  ) {
                    await update((d) => {
                      d.plans = d.plans.filter((p) => p.id !== plan.id);
                      if (d.profile.preferredPlanId === plan.id) d.profile.preferredPlanId = null;
                    });
                    router.replace('/workouts');
                  }
                })
              }
            />
          </Row>
        </>
      )}
      <ExerciseBrowser
        visible={browser}
        onClose={() => setBrowser(false)}
        onSelect={(exercise) => {
          setDraft((p) => ({
            ...p,
            exercises: [
              ...p.exercises,
              {
                id: uid(),
                exerciseId: exercise.id,
                sets: exercise.sets,
                reps: exercise.reps,
                rest: data.settings.rest,
                weight: null,
              },
            ],
          }));
          setBrowser(false);
        }}
      />
    </Screen>
  );
}
