import React, { useEffect, useState } from 'react';
import { Pressable, View } from 'react-native';
import { router } from 'expo-router';
import {
  Badge,
  Button,
  Card,
  Heading,
  Icon,
  IconButton,
  Label,
  ProgressBar,
  Row,
  Screen,
  Section,
  useFeedback,
  useWide,
} from '../../components/ui';
import { Athlete, Metric, Ring } from '../../components/visuals';
import { useApp } from '../../store/useApp';
import { colors as c } from '../../constants/theme';
import { completedSets, estimatedMinutes, localDate, summary, weekDays } from '../../lib/fitness';

export default function Home() {
  const { data, start } = useApp();
  const wide = useWide();
  const f = useFeedback();
  const [selectedDay, setSelectedDay] = useState(localDate());
  const onboarded = data?.profile.onboarded;
  useEffect(() => {
    if (onboarded === false) router.replace('/onboarding');
  }, [onboarded]);
  if (!data) return null;
  const stats = summary(data.sessions);
  const active = data.sessions.find((s) => s.status === 'active');
  const plan =
    data.plans.find((p) => p.id === data.profile.preferredPlanId && !p.archived) ??
    data.plans.find((p) => !p.archived);
  const done = data.sessions
    .filter((s) => s.status === 'completed')
    .sort((a, b) => b.finishedAt!.localeCompare(a.finishedAt!));
  const daySessions = done.filter((s) => localDate(s.finishedAt!) === selectedDay);
  const date = new Date().toLocaleDateString(undefined, {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  });
  const begin = () =>
    void f.run(async () => {
      if (active) router.push(`/session/${active.id}`);
      else if (plan) router.push(`/session/${await start(plan.id)}`);
      else router.push('/workouts');
    });
  return (
    <Screen
      title={`Let’s make it count${data.profile.name ? `, ${data.profile.name.split(' ')[0]}` : ''}.`}
      subtitle={date}
      action={
        <IconButton name="user" label="Your profile" onPress={() => router.push('/profile')} />
      }
    >
      {f.feedback}
      <View style={{ flexDirection: wide ? 'row' : 'column', gap: 22 }}>
        <View style={{ flex: wide ? 1.65 : undefined, gap: 24 }}>
          <View
            style={{
              backgroundColor: c.lime,
              borderRadius: 28,
              minHeight: 280,
              overflow: 'hidden',
              padding: 26,
            }}
          >
            <View
              style={{ position: 'absolute', right: -20, bottom: -9, opacity: wide ? 1 : 0.65 }}
            >
              <Athlete size={270} />
            </View>
            <View style={{ gap: 17, maxWidth: '70%', zIndex: 1 }}>
              <View
                style={{
                  backgroundColor: '#10131014',
                  paddingVertical: 6,
                  paddingHorizontal: 10,
                  borderRadius: 8,
                  alignSelf: 'flex-start',
                }}
              >
                <Label
                  style={{ color: '#344522', fontSize: 10, fontWeight: '800', letterSpacing: 1.2 }}
                >
                  {active ? 'PICK UP WHERE YOU LEFT OFF' : 'YOUR NEXT GOOD DECISION'}
                </Label>
              </View>
              <Label
                style={{
                  color: c.bg,
                  fontWeight: '800',
                  fontSize: 34,
                  lineHeight: 38,
                  letterSpacing: -1.4,
                }}
              >
                {active ? 'Keep your\nmomentum.' : 'Show up.\nGet stronger.'}
              </Label>
              <Label style={{ color: '#46562E', fontSize: 13, maxWidth: 190 }}>
                Small steps today. A stronger you tomorrow.
              </Label>
              <Button
                title={active ? 'Resume workout' : 'Start your workout'}
                icon="arrow-up-right"
                onPress={begin}
                tone="secondary"
                style={{ alignSelf: 'flex-start', backgroundColor: c.bg, marginTop: 8 }}
              />
            </View>
          </View>
          <View>
            <Section
              title={active ? 'In progress' : 'On your training list'}
              action="All workouts"
              onAction={() => router.push('/workouts')}
            />
            <Card>
              <Row style={{ justifyContent: 'space-between' }}>
                <Badge>
                  {active ? 'ACTIVE SESSION' : plan?.template ? 'STARTER TEMPLATE' : 'YOUR PLAN'}
                </Badge>
                <Icon name="activity" color={c.lime} />
              </Row>
              <Heading small>{active?.name ?? plan?.name ?? 'Make room for movement'}</Heading>
              <Label muted>
                {active
                  ? `${completedSets(active)} sets logged • Your progress is saved`
                  : plan
                    ? `${plan.exercises.length} exercises   ·   ~${estimatedMinutes(plan)} min   ·   Strength`
                    : 'Choose a template or build a workout that fits your day.'}
              </Label>
              <Row>
                <Button
                  title={active ? 'Continue session' : 'View workout'}
                  tone="secondary"
                  onPress={() =>
                    active
                      ? router.push(`/session/${active.id}`)
                      : plan
                        ? router.push(`/plan/${plan.id}`)
                        : router.push('/workouts')
                  }
                  style={{ flex: 1 }}
                />
                <IconButton
                  name="arrow-up-right"
                  label="Start or resume workout"
                  onPress={begin}
                  color={c.lime}
                />
              </Row>
            </Card>
          </View>
          <View>
            <Section title="Your week, in motion" />
            <Card>
              <Row style={{ justifyContent: 'space-between' }}>
                <Label muted>
                  {new Date().toLocaleDateString(undefined, { month: 'long', year: 'numeric' })}
                </Label>
                <Badge color={c.lavender}>
                  {stats.weekly} / {data.profile.weeklyTarget} WORKOUTS
                </Badge>
              </Row>
              <Row style={{ justifyContent: 'space-between', gap: 5 }}>
                {weekDays().map((d) => {
                  const key = localDate(d);
                  const trained = done.some((s) => localDate(s.finishedAt!) === key);
                  const selected = key === selectedDay;
                  return (
                    <Pressable
                      key={key}
                      accessibilityRole="button"
                      accessibilityLabel={`${d.toDateString()}, ${trained ? 'workout completed' : 'no workout'}`}
                      onPress={() => setSelectedDay(key)}
                      style={{
                        alignItems: 'center',
                        paddingVertical: 12,
                        paddingHorizontal: 5,
                        flex: 1,
                        gap: 10,
                        borderRadius: 18,
                        backgroundColor: selected ? c.lime : c.raised,
                      }}
                    >
                      <Label style={{ fontSize: 10, color: selected ? c.bg : c.secondary }}>
                        {d.toLocaleDateString(undefined, { weekday: 'short' }).slice(0, 1)}
                      </Label>
                      <Label
                        style={{ fontSize: 17, fontWeight: '700', color: selected ? c.bg : c.text }}
                      >
                        {d.getDate()}
                      </Label>
                      <Icon
                        name={trained ? 'check-circle' : 'minus'}
                        size={14}
                        color={selected ? c.bg : trained ? c.lime : c.muted}
                      />
                    </Pressable>
                  );
                })}
              </Row>
              <Label muted style={{ fontSize: 11 }}>
                {daySessions.length
                  ? `${daySessions.length} workout${daySessions.length > 1 ? 's' : ''} completed · ${daySessions.map((s) => s.name).join(', ')}`
                  : `${selectedDay === localDate() ? 'Today' : selectedDay}: no completed workouts. Every day is a fresh start.`}
              </Label>
            </Card>
          </View>
        </View>
        <View style={{ flex: wide ? 1 : undefined, gap: 24 }}>
          <View>
            <Section title="A little progress adds up" />
            <Card>
              <Row style={{ justifyContent: 'space-between' }}>
                <View style={{ gap: 6 }}>
                  <Label muted style={{ fontSize: 12 }}>
                    Weekly goal
                  </Label>
                  <Label style={{ fontSize: 29, lineHeight: 36, fontWeight: '700' }}>
                    {stats.weekly}
                    <Label muted> / {data.profile.weeklyTarget}</Label>
                  </Label>
                  <Label muted style={{ fontSize: 11 }}>
                    workouts completed
                  </Label>
                </View>
                <Ring value={stats.weekly / data.profile.weeklyTarget} />
              </Row>
              <View style={{ height: 1, backgroundColor: c.border }} />
              <Row>
                <Metric label="Current streak" value={`${stats.current} days`} color={c.peach} />
                <Metric label="Training time" value={`${stats.minutes} min`} color={c.lavender} />
              </Row>
              <Label muted style={{ fontSize: 11 }}>
                Built from your completed sessions. One workout at a time.
              </Label>
            </Card>
          </View>
          <Card style={{ backgroundColor: '#242820' }}>
            <Row>
              <Icon name="compass" color={c.lime} />
              <Label style={{ fontWeight: '600' }}>Your journey, your pace</Label>
            </Row>
            <Label muted style={{ lineHeight: 22 }}>
              You don’t need a perfect routine. You need a place to start.
            </Label>
            <ProgressBar value={stats.total ? 1 : 0} />
            <Button
              title={stats.total ? 'Explore your progress' : 'Find your first workout'}
              tone="secondary"
              icon="arrow-right"
              onPress={() => router.push(stats.total ? '/progress' : '/workouts')}
            />
          </Card>
          <View>
            <Section
              title="Recent activity"
              action="History"
              onAction={() => router.push('/history')}
            />
            {done.length ? (
              <View style={{ gap: 10 }}>
                {done.slice(0, 3).map((s) => (
                  <Pressable key={s.id} onPress={() => router.push(`/session/${s.id}`)}>
                    <Card style={{ padding: 16 }}>
                      <Row>
                        <View
                          style={{ backgroundColor: '#B9ACF51A', borderRadius: 14, padding: 12 }}
                        >
                          <Icon name="check" color={c.lavender} />
                        </View>
                        <View style={{ flex: 1, gap: 4 }}>
                          <Label style={{ fontWeight: '600' }}>{s.name}</Label>
                          <Label muted style={{ fontSize: 11 }}>
                            {new Date(s.finishedAt!).toLocaleDateString()} · {completedSets(s)} sets
                          </Label>
                        </View>
                        <Icon name="chevron-right" size={16} color={c.muted} />
                      </Row>
                    </Card>
                  </Pressable>
                ))}
              </View>
            ) : (
              <Card style={{ paddingVertical: 28 }}>
                <Icon name="wind" color={c.muted} />
                <Label>No sessions yet. Your story starts here.</Label>
                <Label muted style={{ fontSize: 12 }}>
                  Finish a workout to see it in your timeline.
                </Label>
              </Card>
            )}
          </View>
        </View>
      </View>
      <Label
        style={{
          textAlign: 'center',
          color: c.muted,
          fontSize: 10,
          letterSpacing: 1.6,
          marginTop: 8,
        }}
      >
        BUILT AROUND YOU. NOT THE OTHER WAY AROUND.
      </Label>
    </Screen>
  );
}
