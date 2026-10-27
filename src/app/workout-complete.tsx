import React from 'react';
import { View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { Badge, Button, Card, Heading, Icon, Label, Row, Screen, Section } from '../components/ui';
import { Ring } from '../components/visuals';
import { useApp } from '../store/useApp';
import { colors as c } from '../constants/theme';
import {
  completedSets,
  durationLabel,
  fromKg,
  records,
  round,
  summary,
  volume,
  weightUnit,
} from '../lib/fitness';

export default function WorkoutComplete() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const data = useApp((s) => s.data)!;
  const session = data.sessions.find((s) => s.id === id);
  if (!session || session.status !== 'completed') {
    router.replace('/');
    return null;
  }

  const units = data.settings.units;
  const unit = weightUnit(units);
  const totalSets = session.exercises.reduce((n, e) => n + e.sets.length, 0);
  const done = completedSets(session);
  const vol = round(fromKg(volume(session), units));
  const allDone = data.sessions.filter((s) => s.status === 'completed');
  const stats = summary(allDone);
  const prs = records(allDone);

  // Find new PRs set in this session
  const sessionPRs = prs.filter((r) => r.sessionId === session.id);

  return (
    <Screen
      title="Workout complete."
      subtitle={`${new Date(session.finishedAt!).toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' })}`}
    >
      {/* ── Hero celebration card ── */}
      <View
        style={{
          backgroundColor: c.lime,
          borderRadius: 28,
          padding: 26,
          gap: 14,
          overflow: 'hidden',
        }}
      >
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
          <View
            style={{
              backgroundColor: '#10130914',
              borderRadius: 14,
              padding: 10,
            }}
          >
            <Icon name="check" color={c.bg} size={28} />
          </View>
          <View style={{ flex: 1, gap: 4 }}>
            <Label
              style={{ color: '#2D3D1A', fontSize: 11, fontWeight: '800', letterSpacing: 1.1 }}
            >
              YOU DID IT
            </Label>
            <Label
              style={{ color: c.bg, fontSize: 26, fontWeight: '800', letterSpacing: -0.8, lineHeight: 30 }}
            >
              {session.name}
            </Label>
          </View>
        </View>
        <Row style={{ gap: 18 }}>
          <View style={{ flex: 1, gap: 4 }}>
            <Label style={{ color: '#46562E', fontSize: 11 }}>Duration</Label>
            <Label style={{ color: c.bg, fontSize: 22, fontWeight: '700' }}>
              {durationLabel(session.activeMs)}
            </Label>
          </View>
          <View style={{ flex: 1, gap: 4 }}>
            <Label style={{ color: '#46562E', fontSize: 11 }}>Sets logged</Label>
            <Label style={{ color: c.bg, fontSize: 22, fontWeight: '700' }}>
              {done} / {totalSets}
            </Label>
          </View>
          <View style={{ flex: 1, gap: 4 }}>
            <Label style={{ color: '#46562E', fontSize: 11 }}>Volume</Label>
            <Label style={{ color: c.bg, fontSize: 22, fontWeight: '700' }}>
              {vol > 0 ? `${vol} ${unit}` : '—'}
            </Label>
          </View>
        </Row>
      </View>

      {/* ── Personal records from this session ── */}
      {sessionPRs.length > 0 && (
        <View>
          <Section title="New personal bests 🏆" />
          <Card style={{ gap: 14 }}>
            <Badge color={c.peach}>PR ALERT</Badge>
            {sessionPRs.map((r) => (
              <Row key={r.exerciseId} style={{ justifyContent: 'space-between' }}>
                <Label style={{ flex: 1 }}>{r.name}</Label>
                <Badge color={c.peach}>
                  {r.weight ? `${round(fromKg(r.weight, units))} ${unit}` : 'BW'} × {r.reps}
                </Badge>
              </Row>
            ))}
          </Card>
        </View>
      )}

      {/* ── Overall progress snapshot ── */}
      <Card>
        <Row style={{ justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <View style={{ gap: 6, flex: 1 }}>
            <Heading small>Your progress this week</Heading>
            <Label muted>
              {stats.weekly} / {data.profile.weeklyTarget} workouts
            </Label>
            <Label muted style={{ fontSize: 12 }}>
              {stats.current > 0 ? `${stats.current}-day streak going. Keep it up.` : 'Every session counts.'}
            </Label>
          </View>
          <Ring value={stats.weekly / data.profile.weeklyTarget} />
        </Row>
      </Card>

      {/* ── Completion breakdown ── */}
      <Card>
        <Badge>EXERCISE BREAKDOWN</Badge>
        {session.exercises.map((ex) => {
          const completedCount = ex.sets.filter((s) => s.completed).length;
          return (
            <Row key={ex.id} style={{ justifyContent: 'space-between' }}>
              <Label style={{ flex: 1, fontSize: 13 }}>
                {ex.skipped ? (
                  <Label style={{ color: c.muted, fontSize: 13 }}>{ex.exercise.name}</Label>
                ) : (
                  ex.exercise.name
                )}
              </Label>
              <Label
                style={{
                  fontSize: 12,
                  color: ex.skipped ? c.muted : completedCount === ex.sets.length ? c.lime : c.secondary,
                  fontWeight: '600',
                }}
              >
                {ex.skipped ? 'Skipped' : `${completedCount}/${ex.sets.length} sets`}
              </Label>
            </Row>
          );
        })}
      </Card>

      {/* ── Rating if set ── */}
      {session.rating && (
        <Card>
          <Row>
            <Icon name="star" color={c.peach} />
            <Label>You rated this session {session.rating} / 5</Label>
          </Row>
        </Card>
      )}

      {/* ── CTAs ── */}
      <Button
        title="Back to home"
        icon="home"
        onPress={() => router.replace('/')}
      />
      <Button
        title="View full session details"
        tone="secondary"
        icon="list"
        onPress={() => router.replace(`/session/${session.id}`)}
      />
    </Screen>
  );
}
