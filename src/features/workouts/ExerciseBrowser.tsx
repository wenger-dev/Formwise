import { router } from 'expo-router';
import { TechniqueExtras } from './TechniqueExtras';
import React, { useState } from 'react';
import { Pressable, View } from 'react-native';
import { catalog } from '../../constants/catalog';
import { Exercise } from '../../types/domain';
import { colors as c } from '../../constants/theme';
import { Badge, Button, Chip, Field, Icon, Label, Row, Sheet } from '../../components/ui';

export function ExerciseBrowser({
  visible,
  onClose,
  onSelect,
}: {
  visible: boolean;
  onClose: () => void;
  onSelect?: (e: Exercise) => void;
}) {
  const [search, setSearch] = useState('');
  const [muscle, setMuscle] = useState('All');
  const [detail, setDetail] = useState<Exercise | null>(null);
  return (
    <Sheet
      visible={visible}
      title={onSelect ? 'Add an exercise' : 'Exercise library'}
      onClose={onClose}
    >
      {detail ? (
        <>
          <Button
            title="Back to exercises"
            tone="secondary"
            icon="arrow-left"
            onPress={() => setDetail(null)}
          />
          <Badge>
            {detail.muscle.toUpperCase()} · {detail.equipment.toUpperCase()}
          </Badge>
          <Label style={{ fontSize: 24, lineHeight: 30, fontWeight: '700' }}>{detail.name}</Label>
          {detail.instructions.map((step, i) => (
            <Row key={i} style={{ alignItems: 'flex-start' }}>
              <Label style={{ color: c.lime, fontWeight: '700' }}>0{i + 1}</Label>
              <Label style={{ flex: 1, lineHeight: 23 }}>{step}</Label>
            </Row>
          ))}
          <Button
            title="Watch YouTube demo"
            icon="play-circle"
            tone="secondary"
            onPress={() => {
              onClose();
              router.push({ pathname: '/exercise-video', params: { exerciseId: detail.id } });
            }}
          />
          <Label muted>{detail.notes}</Label>
          <TechniqueExtras exercise={detail} />
          {onSelect && (
            <Button
              title="Add to workout"
              icon="plus"
              onPress={() => {
                onSelect(detail);
                setDetail(null);
              }}
            />
          )}
        </>
      ) : (
        <>
          <Field
            label="Search exercises"
            placeholder="Try squat, back, dumbbells…"
            value={search}
            onChangeText={setSearch}
          />
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
            {[
              'All',
              'Chest',
              'Back',
              'Legs',
              'Glutes',
              'Shoulders',
              'Arms',
              'Core',
              'Cardio',
              'Mobility',
            ].map((m) => (
              <Chip key={m} title={m} selected={muscle === m} onPress={() => setMuscle(m)} />
            ))}
          </View>
          {catalog
            .filter(
              (e) =>
                (muscle === 'All' || e.muscle === muscle) &&
                `${e.name} ${e.muscle} ${e.equipment}`.toLowerCase().includes(search.toLowerCase()),
            )
            .map((e) => (
              <Pressable
                key={e.id}
                accessibilityRole="button"
                accessibilityLabel={`View ${e.name}`}
                onPress={() => setDetail(e)}
                style={{
                  minHeight: 72,
                  paddingVertical: 12,
                  borderBottomWidth: 1,
                  borderBottomColor: c.border,
                }}
              >
                <Row>
                  <View
                    style={{
                      width: 44,
                      height: 44,
                      alignItems: 'center',
                      justifyContent: 'center',
                      backgroundColor: c.raised,
                      borderRadius: 13,
                    }}
                  >
                    <Icon name="activity" color={c.lavender} />
                  </View>
                  <View style={{ flex: 1, gap: 4 }}>
                    <Label style={{ fontWeight: '600' }}>{e.name}</Label>
                    <Label muted style={{ fontSize: 11 }}>
                      {e.muscle} · {e.equipment}
                    </Label>
                  </View>
                  {onSelect && <Button title="Add" tone="secondary" onPress={() => onSelect(e)} />}
                  <Icon name="chevron-right" color={c.muted} size={15} />
                </Row>
              </Pressable>
            ))}
        </>
      )}
    </Sheet>
  );
}
