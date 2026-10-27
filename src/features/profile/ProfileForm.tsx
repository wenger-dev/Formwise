import React, { useState } from 'react';
import { View } from 'react-native';
import { Button, Card, Chip, Field, Heading, Label, Row, useFeedback } from '../../components/ui';
import { useApp } from '../../store/useApp';
import { Profile } from '../../types/domain';
import {
  clone,
  fromCm,
  fromKg,
  localDate,
  round,
  toCm,
  toKg,
  uid,
  weightUnit,
} from '../../lib/fitness';

export function ProfileForm({
  onDone,
  onboarding = false,
}: {
  onDone?: () => void;
  onboarding?: boolean;
}) {
  const { data, update } = useApp();
  const f = useFeedback();
  const [draft, setDraft] = useState(() => clone(data!.profile));
  const [units, setUnits] = useState(data!.settings.units);
  const latest = [...data!.weights].sort((a, b) => b.date.localeCompare(a.date))[0];
  const [age, setAge] = useState(draft.age?.toString() ?? '');
  const [height, setHeight] = useState(
    draft.heightCm === null ? '' : String(round(fromCm(draft.heightCm, units), 2)),
  );
  const [weight, setWeight] = useState(latest ? String(round(fromKg(latest.kg, units), 2)) : '');
  const [heightEdited, setHeightEdited] = useState(false);
  const [weightEdited, setWeightEdited] = useState(false);
  const [duration, setDuration] = useState(String(draft.duration));
  const set = <K extends keyof Profile>(key: K, value: Profile[K]) =>
    setDraft((d) => ({ ...d, [key]: value }));
  const changeUnits = (next: typeof units) => {
    if (next === units) return;
    if (height.trim() && Number.isFinite(Number(height)))
      setHeight(String(round(fromCm(toCm(Number(height), units), next), 2)));
    if (weight.trim() && Number.isFinite(Number(weight)))
      setWeight(String(round(fromKg(toKg(Number(weight), units), next), 2)));
    setUnits(next);
  };
  const save = () =>
    void f.run(async () => {
      const kg = weight.trim() ? toKg(Number(weight), units) : null;
      if (kg !== null && (!Number.isFinite(kg) || kg <= 0 || kg > 500))
        throw new Error('Enter a weight above 0 and at most 500 kg (1102 lb).');
      await update((d) => {
        d.profile = {
          ...draft,
          age: age.trim() ? Number(age) : null,
          heightCm: heightEdited
            ? height.trim()
              ? toCm(Number(height), units)
              : null
            : draft.heightCm,
          duration: Number(duration),
          onboarded: true,
        };
        d.settings.units = units;
        if (weightEdited && kg !== null && (!latest || Math.abs(latest.kg - kg) > 0.0001)) {
          const today = d.weights.find((w) => w.date === localDate());
          if (today) today.kg = kg;
          else d.weights.push({ id: uid(), date: localDate(), kg });
        }
      });
      onDone?.();
    }, 'Your profile is saved.');
  return (
    <View style={{ gap: 22 }}>
      {f.feedback}
      <Card>
        <Field
          label="What should we call you?"
          placeholder="Your name (optional)"
          value={draft.name}
          onChangeText={(v) => set('name', v)}
          maxLength={60}
        />
        <Row>
          <Field
            label="Age (optional, 13–120)"
            keyboardType="number-pad"
            value={age}
            onChangeText={setAge}
          />
          <Field
            label={units === 'metric' ? 'Height (cm, optional)' : 'Height (total inches, optional)'}
            keyboardType="decimal-pad"
            value={height}
            onChangeText={(v) => {
              setHeight(v);
              setHeightEdited(true);
            }}
          />
        </Row>
        <Row>
          {(['metric', 'imperial'] as const).map((v) => (
            <Chip
              key={v}
              title={v === 'metric' ? 'kg / cm' : 'lb / ft + in'}
              selected={units === v}
              onPress={() => changeUnits(v)}
            />
          ))}
        </Row>
        {units === 'imperial' && height.trim() && Number.isFinite(Number(height)) && (
          <Label muted>
            Height: {Math.floor(Number(height) / 12)} ft {round(Number(height) % 12)} in
          </Label>
        )}
        <Field
          label={`Current weight (${weightUnit(units)}, optional)`}
          value={weight}
          onChangeText={(v) => {
            setWeight(v);
            setWeightEdited(true);
          }}
          keyboardType="decimal-pad"
        />
        <Label muted style={{ fontSize: 11 }}>
          Optional measurements stay on your device. You can change them anytime.
        </Label>
      </Card>
      <Card>
        <Heading small>What moves you?</Heading>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
          {(
            [
              'Build consistency',
              'Build muscle',
              'Lose fat',
              'Get stronger',
              'General fitness',
            ] as const
          ).map((goal) => (
            <Chip
              key={goal}
              title={goal}
              selected={draft.goal === goal}
              onPress={() => set('goal', goal)}
            />
          ))}
        </View>
        <Label muted>Training experience</Label>
        <Row style={{ flexWrap: 'wrap' }}>
          {(['Beginner', 'Intermediate', 'Advanced'] as const).map((v) => (
            <Chip
              key={v}
              title={v}
              selected={draft.experience === v}
              onPress={() => set('experience', v)}
            />
          ))}
        </Row>
        <Label muted>Available equipment</Label>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
          {(
            ['Full gym', 'Dumbbells', 'Resistance bands', 'Bodyweight', 'Home equipment'] as const
          ).map((v) => (
            <Chip
              key={v}
              title={v}
              selected={draft.equipment === v}
              onPress={() => set('equipment', v)}
            />
          ))}
        </View>
      </Card>
      <Card>
        <Heading small>Find your rhythm.</Heading>
        <Label muted>Preferred training days</Label>
        <Row style={{ flexWrap: 'wrap' }}>
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((v, i) => (
            <Chip
              key={v}
              title={v}
              selected={draft.days.includes(i)}
              onPress={() =>
                set(
                  'days',
                  draft.days.includes(i) ? draft.days.filter((d) => d !== i) : [...draft.days, i],
                )
              }
            />
          ))}
        </Row>
        <Label muted>Weekly workout target</Label>
        <Row style={{ flexWrap: 'wrap' }}>
          {[1, 2, 3, 4, 5, 6, 7].map((v) => (
            <Chip
              key={v}
              title={String(v)}
              selected={draft.weeklyTarget === v}
              onPress={() => set('weeklyTarget', v)}
            />
          ))}
        </Row>
        <Field
          label="Typical workout duration (5–240 minutes)"
          value={duration}
          onChangeText={setDuration}
          keyboardType="number-pad"
        />
      </Card>
      <Button
        title={onboarding ? 'Let’s get moving' : 'Save profile'}
        icon="arrow-right"
        onPress={save}
      />
      {onboarding && (
        <Button
          title="Set up later"
          tone="secondary"
          onPress={() =>
            void f.run(async () => {
              await update((d) => {
                d.profile.onboarded = true;
              });
              onDone?.();
            })
          }
        />
      )}
    </View>
  );
}
