import React, { useState } from 'react';
import { Pressable, View } from 'react-native';
import { router } from 'expo-router';
import {
  Badge,
  Button,
  Card,
  Chip,
  Empty,
  Field,
  Heading,
  Icon,
  Label,
  Row,
  Screen,
  useWide,
} from '../../components/ui';
import { ExerciseBrowser } from '../../features/workouts/ExerciseBrowser';
import { useApp } from '../../store/useApp';
import { colors as c } from '../../constants/theme';
import { estimatedMinutes } from '../../lib/fitness';
import { catalog } from '../../constants/catalog';

// Colour palette for plan cards (cycles through muscle accent colours)
const CARD_ACCENTS = [c.lime, c.lavender, c.peach, c.blue, '#98f5c4', c.peach, c.lime, c.blue, c.lavender];

// Pick an icon based on the dominant muscle group of exercises in the plan
function planIcon(exerciseIds: string[]): React.ComponentProps<typeof Icon>['name'] {
  const muscles = exerciseIds
    .map((id) => catalog.find((x) => x.id === id)?.muscle ?? '')
    .join(' ');
  if (muscles.includes('Cardio')) return 'wind';
  if (muscles.includes('Core')) return 'target';
  if (muscles.includes('Glute') || muscles.includes('Legs')) return 'trending-up';
  if (muscles.includes('Chest')) return 'activity';
  if (muscles.includes('Back')) return 'layers';
  if (muscles.includes('Shoulder')) return 'zap';
  return 'activity';
}

export default function Workouts() {
  const data = useApp((s) => s.data)!;
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('All workouts');
  const [sort, setSort] = useState('Recently used');
  const [browser, setBrowser] = useState(false);
  const [equipment, setEquipment] = useState('All equipment');
  const wide = useWide();
  const plans = data.plans
    .filter(
      (p) =>
        (filter === 'Archived' ? p.archived : !p.archived) &&
        (filter !== 'My plans' || !p.template) &&
        p.name.toLowerCase().includes(search.toLowerCase()) &&
        (equipment === 'All equipment' ||
          p.exercises.every((e) => {
            const item = catalog.find((x) => x.id === e.exerciseId);
            return item?.equipment === equipment || item?.equipment === 'Bodyweight';
          })),
    )
    .sort((a, b) =>
      sort === 'A–Z'
        ? a.name.localeCompare(b.name)
        : (
            data.sessions.filter((s) => s.planId === b.id).at(-1)?.startedAt ?? b.updatedAt
          ).localeCompare(
            data.sessions.filter((s) => s.planId === a.id).at(-1)?.startedAt ?? a.updatedAt,
          ),
    );
  return (
    <Screen
      title="Find your next challenge."
      subtitle="Good plans. Great possibilities."
      action={<Button title="Create plan" icon="plus" onPress={() => router.push('/plan/new')} />}
    >
      <Card style={{ backgroundColor: '#252B22' }}>
        <Row style={{ flexWrap: 'wrap', justifyContent: 'space-between' }}>
          <View style={{ gap: 6, flex: 1, minWidth: 180 }}>
            <Heading small>A movement for every moment.</Heading>
            <Label muted>Explore technique guides for {catalog.length} offline exercises.</Label>
          </View>
          <Button
            title="Exercise library"
            icon="book-open"
            tone="secondary"
            onPress={() => setBrowser(true)}
          />
        </Row>
      </Card>
      <Card>
        <Badge>NEW TO TRAINING?</Badge>
        <Heading small>A little guidance goes a long way.</Heading>
        <Label muted>
          12-week beginner plans, technique checklists, recovery activities, and waist trends.
        </Label>
        <Button
          title="Open training companion"
          tone="secondary"
          icon="compass"
          onPress={() => router.push('/coach')}
        />
      </Card>
      <Field
        label="Search your workouts"
        placeholder="What do you feel like training?"
        value={search}
        onChangeText={setSearch}
      />
      <Row style={{ flexWrap: 'wrap' }}>
        {['All workouts', 'My plans', 'Archived'].map((v) => (
          <Chip key={v} title={v} selected={filter === v} onPress={() => setFilter(v)} />
        ))}
        <View style={{ flex: 1 }} />
        <Chip
          title={sort}
          selected={false}
          onPress={() => setSort(sort === 'A–Z' ? 'Recently used' : 'A–Z')}
        />
      </Row>
      <Row style={{ flexWrap: 'wrap' }}>
        {['All equipment', 'Bodyweight', 'Dumbbells', 'Full gym', 'Resistance bands'].map((v) => (
          <Chip key={v} title={v} selected={equipment === v} onPress={() => setEquipment(v)} />
        ))}
      </Row>

      {/* ── Plan cards grid ────────────────────────────────────── */}
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 14 }}>
        {plans.map((p, i) => {
          const accent = CARD_ACCENTS[i % CARD_ACCENTS.length];
          const icon = planIcon(p.exercises.map((e) => e.exerciseId));
          // Collect unique muscle groups for this plan
          const muscles = [...new Set(
            p.exercises
              .map((e) => catalog.find((x) => x.id === e.exerciseId)?.muscle ?? '')
              .filter(Boolean)
              .map((m) => m.split(' · ')[0]) // first muscle only
          )].slice(0, 3);

          return (
            <Pressable
              key={p.id}
              accessibilityRole="button"
              accessibilityLabel={`View ${p.name}`}
              onPress={() => router.push(`/plan/${p.id}`)}
              style={{ width: wide ? '47.5%' : '100%' }}
            >
              <Card style={{ gap: 14, minHeight: 200 }}>
                {/* ── Top row: icon + badge ── */}
                <Row style={{ justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <View
                    style={{
                      width: 48,
                      height: 48,
                      borderRadius: 15,
                      backgroundColor: `${accent}18`,
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <Icon name={icon} color={accent} size={22} />
                  </View>
                  <Badge color={p.template ? c.lavender : c.lime}>
                    {p.template ? 'TEMPLATE' : 'YOUR PLAN'}
                  </Badge>
                </Row>

                {/* ── Plan name + description ── */}
                <View style={{ gap: 4 }}>
                  <Label
                    style={{ fontWeight: '800', fontSize: 17, letterSpacing: -0.4, color: c.text }}
                  >
                    {p.name}
                  </Label>
                  <Label muted style={{ fontSize: 12, lineHeight: 18 }}>
                    {p.description}
                  </Label>
                </View>

                {/* ── Muscle chips ── */}
                {muscles.length > 0 && (
                  <Row style={{ flexWrap: 'wrap', gap: 5 }}>
                    {muscles.map((m) => (
                      <View
                        key={m}
                        style={{
                          paddingHorizontal: 8,
                          paddingVertical: 4,
                          borderRadius: 7,
                          backgroundColor: `${accent}15`,
                        }}
                      >
                        <Label style={{ color: accent, fontSize: 10, fontWeight: '700' }}>
                          {m.toUpperCase()}
                        </Label>
                      </View>
                    ))}
                  </Row>
                )}

                {/* ── Footer: exercise count + duration + arrow ── */}
                <Row style={{ justifyContent: 'space-between', alignItems: 'center', marginTop: 'auto' }}>
                  <Label muted style={{ fontSize: 12 }}>
                    {p.exercises.length} exercises · ~{estimatedMinutes(p)} min
                  </Label>
                  <View
                    style={{
                      width: 32,
                      height: 32,
                      borderRadius: 10,
                      backgroundColor: `${accent}18`,
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <Icon name="arrow-up-right" color={accent} size={16} />
                  </View>
                </Row>
              </Card>
            </Pressable>
          );
        })}
      </View>

      {!plans.length && (
        <Empty
          title="Room for a fresh start"
          body="Create your own plan, or try another search or filter."
          action={<Button title="Create a workout" onPress={() => router.push('/plan/new')} />}
        />
      )}
      <ExerciseBrowser visible={browser} onClose={() => setBrowser(false)} />
    </Screen>
  );
}
