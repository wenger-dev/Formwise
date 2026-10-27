import React, { useState } from 'react';
import { View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import {
  Badge,
  Button,
  Card,
  Chip,
  Field,
  Heading,
  Label,
  Row,
  Screen,
  confirm,
  useFeedback,
} from '../components/ui';
import { MiniChart } from '../components/visuals';
import { useApp } from '../store/useApp';
import { beginnerPlans, beginnerPlanIds } from '../constants/catalog';
import { localDate, round, uid, validDay } from '../lib/fitness';
import { colors as c } from '../constants/theme';

const checks = [
  'I adjusted the seat and pads to fit me.',
  'I know how to start and stop the equipment.',
  'I can control the weight in both directions.',
  'I can breathe steadily without jerking or swinging.',
  'I feel ready to train without sharp pain or dizziness.',
];
export default function Coach() {
  const { data, update, start } = useApp();
  const f = useFeedback();
  const { section } = useLocalSearchParams<{ section?: string }>();
  const [tab, setTab] = useState(
    ['Recovery', 'Measurements', 'Technique'].includes(section ?? '') ? section! : 'Start here',
  );
  const [phase, setPhase] = useState(0);
  const [date, setDate] = useState(localDate());
  const [waist, setWaist] = useState('');
  const [minutes, setMinutes] = useState('20');
  const [effort, setEffort] = useState<'Easy' | 'Moderate'>('Easy');
  const [note, setNote] = useState('');
  const [limit, setLimit] = useState(20);
  if (!data) return null;
  const imperial = data.settings.units === 'imperial';
  const waistRows = [...data.wellness.waist].sort((a, b) => b.date.localeCompare(a.date));
  const recovery = [...data.wellness.recovery].sort((a, b) => b.date.localeCompare(a.date));
  const validDate = () => {
    if (!validDay(date) || date > localDate())
      throw new Error('Choose a real date, today or earlier (YYYY-MM-DD).');
  };
  return (
    <Screen
      title="Your training companion."
      subtitle="Learn the movement. Build the habit."
      action={<Button title="Back" tone="secondary" onPress={() => router.back()} />}
    >
      {f.feedback}
      <Row style={{ flexWrap: 'wrap' }}>
        {['Start here', 'Recovery', 'Measurements', 'Technique'].map((x) => (
          <Chip key={x} title={x} selected={tab === x} onPress={() => setTab(x)} />
        ))}
      </Row>
      {tab === 'Start here' && (
        <>
          <Card style={{ backgroundColor: c.raised }}>
            <Badge>12 WEEKS · YOUR OWN PACE</Badge>
            <Heading>Build confidence, one session at a time.</Heading>
            <Label muted>
              A beginner gym A/B rotation, a genuine home workout, and space for recovery. Choose
              the phase that suits your experience; the app never increases your load automatically.
            </Label>
          </Card>
          <Row style={{ flexWrap: 'wrap' }}>
            {['Weeks 1–2', 'Weeks 3–6', 'Weeks 7–12'].map((x, i) => (
              <Chip key={x} title={x} selected={phase === i} onPress={() => setPhase(i)} />
            ))}
          </Row>
          <Card>
            <Heading small>
              {['Learn the movements', 'Build consistency', 'Progress gradually'][phase]}
            </Heading>
            <Label muted>
              {
                [
                  'One easy working set per movement. Focus on setup and controlled repetitions.',
                  'Two working sets per movement. Add repetitions before increasing load.',
                  'Up to three controlled sets. Change load by the smallest available increment when ready.',
                ][phase]
              }
            </Label>
            <Label muted>
              Templates use 10 repetitions and 90 seconds rest. Edit a plan to match your needs.
            </Label>
            <Button
              title={`Add ${phase + 1}-set beginner plans`}
              icon="plus"
              onPress={() =>
                void f.run(async () => {
                  const installed = beginnerPlanIds.some((id) =>
                    data.plans.some((p) => p.id === id),
                  );
                  if (
                    installed &&
                    !(await confirm(
                      'Update beginner templates?',
                      'Their set targets will change to the selected phase. Completed and active workout snapshots stay intact.',
                    ))
                  )
                    return;
                  await update((d) => {
                    for (const p of beginnerPlans()) {
                      const existing = d.plans.find((x) => x.id === p.id);
                      if (existing && !existing.template)
                        throw new Error(
                          'An existing custom workout conflicts with this template. Duplicate or remove that workout before adding the beginner plans.',
                        );
                      p.exercises.forEach((e) => {
                        e.sets = phase + 1;
                      });
                      p.updatedAt = new Date().toISOString();
                      if (existing) Object.assign(existing, p);
                      else d.plans.push(p);
                    }
                  });
                  f.show('Beginner plans are ready in Workouts.');
                })
              }
            />
            {beginnerPlanIds.map((id) => {
              const p = data.plans.find((x) => x.id === id && !x.archived);
              return (
                p && (
                  <Button
                    key={id}
                    title={`Start ${p.name}`}
                    tone="secondary"
                    onPress={() =>
                      void f.run(async () => {
                        const sid = await start(id);
                        router.push(`/session/${sid}`);
                      })
                    }
                  />
                )
              );
            })}
          </Card>
          <Card>
            <Heading small>A weekly rhythm</Heading>
            {[
              ['Mon', 'Gym A'],
              ['Tue', 'Comfortable walk'],
              ['Wed', 'Gentle movement'],
              ['Thu', 'Gym B'],
              ['Fri', 'Comfortable walk'],
              ['Sat', 'Gym A or home'],
              ['Sun', 'Rest'],
            ].map(([day, activity]) => (
              <Row key={day} style={{ justifyContent: 'space-between' }}>
                <Label style={{ color: c.lime }}>{day}</Label>
                <Label muted>{activity}</Label>
              </Row>
            ))}
            <Label muted>
              A suggested rhythm. Your profile and reminder days remain yours to choose.
            </Label>
          </Card>
        </>
      )}
      {(tab === 'Measurements' || tab === 'Recovery') && (
        <Field label="Entry date · YYYY-MM-DD" value={date} onChangeText={setDate} maxLength={10} />
      )}
      {tab === 'Measurements' && (
        <>
          <Card>
            <Badge color={c.lavender}>BEYOND THE SCALE</Badge>
            <Heading small>Waist trend</Heading>
            <Label muted>Use the same measuring position and similar conditions each time.</Label>
            <Field
              label={`Waist (${imperial ? 'in' : 'cm'})`}
              value={waist}
              onChangeText={setWaist}
              keyboardType="decimal-pad"
            />
            <Button
              title="Save waist measurement"
              onPress={() =>
                void f.run(async () => {
                  validDate();
                  const cm = Number(waist) * (imperial ? 2.54 : 1);
                  if (!waist.trim() || !Number.isFinite(cm) || cm < 30 || cm > 250)
                    throw new Error(
                      'Enter a waist measurement between 30 and 250 cm (11.82–98.42 in).',
                    );
                  await update((d) => {
                    d.wellness.waist = d.wellness.waist.filter((x) => x.date !== date);
                    d.wellness.waist.push({ id: uid(), date, cm });
                  });
                  setWaist('');
                  f.show('Waist measurement saved.');
                })
              }
            />
            {waistRows.length > 0 && (
              <>
                <Label>
                  {round(waistRows[0].cm / (imperial ? 2.54 : 1))} {imperial ? 'in' : 'cm'} ·{' '}
                  {waistRows[0].date}
                </Label>
                <MiniChart
                  labels={[...waistRows]
                    .reverse()
                    .slice(-7)
                    .map((x) => x.date.slice(5))}
                  suffix={imperial ? 'in' : 'cm'}
                  data={[...waistRows]
                    .reverse()
                    .slice(-7)
                    .map((x) => x.cm / (imperial ? 2.54 : 1))}
                  color={c.lavender}
                />
              </>
            )}
          </Card>
          {waistRows.slice(0, limit).map((x) => (
            <Card key={x.id}>
              <Row style={{ justifyContent: 'space-between' }}>
                <View>
                  <Label>
                    {round(x.cm / (imperial ? 2.54 : 1))} {imperial ? 'in' : 'cm'}
                  </Label>
                  <Label muted>{x.date}</Label>
                </View>
                <Button
                  title="Delete"
                  tone="danger"
                  onPress={() =>
                    void f.run(async () => {
                      if (
                        await confirm(
                          'Delete measurement?',
                          'This waist entry will be removed.',
                          true,
                        )
                      )
                        await update((d) => {
                          d.wellness.waist = d.wellness.waist.filter((v) => v.id !== x.id);
                        });
                    })
                  }
                />
              </Row>
            </Card>
          ))}
          {waistRows.length === 0 && (
            <Label muted>No waist measurements yet. Your first entry starts the trend.</Label>
          )}
          {waistRows.length > limit && (
            <Button
              title="Show more measurements"
              tone="secondary"
              onPress={() => setLimit(limit + 20)}
            />
          )}
        </>
      )}
      {tab === 'Recovery' && (
        <>
          <Card>
            <Badge color={c.peach}>MOVEMENT COUNTS</Badge>
            <Heading small>Walking & active recovery</Heading>
            <Label muted>
              Recovery minutes are tracked separately from strength sessions and lifting volume.
            </Label>
            <Field
              label="Minutes walked"
              value={minutes}
              onChangeText={setMinutes}
              keyboardType="number-pad"
            />
            <Row>
              {(['Easy', 'Moderate'] as const).map((x) => (
                <Chip key={x} title={x} selected={effort === x} onPress={() => setEffort(x)} />
              ))}
            </Row>
            <Field
              label="Recovery note"
              value={note}
              onChangeText={setNote}
              multiline
              maxLength={2000}
            />
            <Button
              title="Save recovery activity"
              onPress={() =>
                void f.run(async () => {
                  validDate();
                  const n = Number(minutes);
                  if (!/^\d+$/.test(minutes) || n < 1 || n > 300)
                    throw new Error('Enter 1–300 whole minutes.');
                  await update((d) => {
                    d.wellness.recovery.push({
                      id: uid(),
                      date,
                      minutes: n,
                      effort,
                      note: note.trim(),
                    });
                  });
                  setNote('');
                  f.show('Recovery activity saved.');
                })
              }
            />
          </Card>
          <Label>
            {recovery.length} activities · {recovery.reduce((n, x) => n + x.minutes, 0)} total
            minutes
          </Label>
          {recovery.slice(0, limit).map((x) => (
            <Card key={x.id}>
              <Row style={{ justifyContent: 'space-between' }}>
                <Heading small>{x.minutes} min walk</Heading>
                <Badge color={c.peach}>{x.effort}</Badge>
              </Row>
              <Label muted>{x.date}</Label>
              {!!x.note && <Label>{x.note}</Label>}
              <Button
                title="Delete activity"
                tone="danger"
                onPress={() =>
                  void f.run(async () => {
                    if (
                      await confirm(
                        'Delete recovery activity?',
                        'This saved walk will be removed.',
                        true,
                      )
                    )
                      await update((d) => {
                        d.wellness.recovery = d.wellness.recovery.filter((v) => v.id !== x.id);
                      });
                  })
                }
              />
            </Card>
          ))}
          {recovery.length > limit && (
            <Button
              title="Show more activities"
              tone="secondary"
              onPress={() => setLimit(limit + 20)}
            />
          )}
        </>
      )}
      {tab === 'Technique' && (
        <Card>
          <Badge>YOUR SETUP CHECKLIST</Badge>
          <Heading small>Ready before the first rep.</Heading>
          <Label muted>Saved on this device. Revisit for each new exercise or machine.</Label>
          {checks.map((x, i) => (
            <Button
              key={x}
              title={`${data.wellness.checks.includes(i) ? '✓' : '○'} ${x}`}
              tone="secondary"
              onPress={() =>
                void f.run(() =>
                  update((d) => {
                    d.wellness.checks = d.wellness.checks.includes(i)
                      ? d.wellness.checks.filter((v) => v !== i)
                      : [...d.wellness.checks, i];
                  }),
                )
              }
            />
          ))}
          <Button
            title="Reset checklist"
            tone="secondary"
            onPress={() =>
              void f.run(() =>
                update((d) => {
                  d.wellness.checks = [];
                }),
              )
            }
          />
        </Card>
      )}
    </Screen>
  );
}
