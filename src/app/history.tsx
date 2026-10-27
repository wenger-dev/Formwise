import React, { useState } from 'react';
import { FlatList, Pressable } from 'react-native';
import { router } from 'expo-router';
import {
  Badge,
  Button,
  Card,
  Chip,
  Empty,
  Field,
  Icon,
  IconButton,
  Label,
  Row,
  Screen,
} from '../components/ui';
import { useApp } from '../store/useApp';
import {
  completedSets,
  dayOffset,
  durationLabel,
  fromKg,
  localDate,
  round,
  volume,
  weightUnit,
} from '../lib/fitness';
import { colors as c } from '../constants/theme';
export default function History() {
  const data = useApp((s) => s.data)!;
  const [search, setSearch] = useState('');
  const [range, setRange] = useState(30);
  const sessions = data.sessions
    .filter(
      (s) =>
        s.status === 'completed' &&
        s.name.toLowerCase().includes(search.toLowerCase()) &&
        (!range || localDate(s.finishedAt!) >= localDate(dayOffset(new Date(), -(range - 1)))),
    )
    .sort((a, b) => b.finishedAt!.localeCompare(a.finishedAt!));
  return (
    <Screen
      scroll={false}
      title="Look how far you’ve come."
      subtitle="Every session is a step forward."
      action={<IconButton name="arrow-left" label="Back" onPress={() => router.back()} />}
    >
      <Field
        label="Search history"
        containerStyle={{ flex: 0 }}
        value={search}
        onChangeText={setSearch}
        placeholder="Workout name…"
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
      <FlatList
        data={sessions}
        keyExtractor={(s) => s.id}
        style={{ flex: 1 }}
        contentContainerStyle={{ gap: 16, paddingBottom: 36 }}
        initialNumToRender={10}
        maxToRenderPerBatch={10}
        windowSize={7}
        ListEmptyComponent={
          <Empty
            title="Your next chapter is waiting"
            body="Completed workouts appear here. Try a different date range or start your first session."
            action={<Button title="Find a workout" onPress={() => router.push('/workouts')} />}
          />
        }
        renderItem={({ item: s }) => (
          <Pressable
            key={s.id}
            accessibilityRole="button"
            onPress={() => router.push(`/session/${s.id}`)}
          >
            <Card>
              <Row style={{ justifyContent: 'space-between' }}>
                <Badge>
                  {new Date(s.finishedAt!).toLocaleDateString(undefined, {
                    month: 'short',
                    day: 'numeric',
                  })}
                </Badge>
                <Icon name="arrow-up-right" color={c.lime} />
              </Row>
              <Label style={{ fontWeight: '700', fontSize: 20 }}>{s.name}</Label>
              <Label muted>
                {durationLabel(s.activeMs)} min · {s.exercises.length} exercises ·{' '}
                {completedSets(s)} sets · {round(fromKg(volume(s), data.settings.units))}{' '}
                {weightUnit(data.settings.units)}
              </Label>
              {s.note ? <Label muted>{s.note}</Label> : null}
            </Card>
          </Pressable>
        )}
      />
    </Screen>
  );
}
