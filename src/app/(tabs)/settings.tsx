import { router } from 'expo-router';
import React, { useRef, useState } from 'react';
import { Switch, View } from 'react-native';
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
} from '../../components/ui';
import { useApp } from '../../store/useApp';
import { colors as c } from '../../constants/theme';
import { freshData } from '../../constants/catalog';
import { exportBackup, chooseBackup } from '../../lib/backup';
import { cancelReminders, scheduleReminders } from '../../lib/reminders';
import { settingsSchema } from '../../types/domain';
import { useFocusRevision } from '../../hooks/useFocusRevision';
export default function Settings() {
  const revision = useFocusRevision();
  return <SettingsContent key={revision} />;
}
function SettingsContent() {
  const { data, update, replace } = useApp();
  const f = useFeedback();
  const [rest, setRest] = useState(String(data!.settings.rest));
  const [duration, setDuration] = useState(String(data!.profile.duration));
  const [hour, setHour] = useState(String(data!.settings.reminder.hour));
  const [minute, setMinute] = useState(String(data!.settings.reminder.minute));
  const [days, setDays] = useState(data!.settings.reminder.days);
  const reminderLock = useRef(false);
  const [nativeBusy, setNativeBusy] = useState(false);
  const nativeAction = async (task: () => Promise<void>) => {
    if (reminderLock.current) throw new Error('A reminder change is already in progress.');
    reminderLock.current = true;
    setNativeBusy(true);
    try {
      await task();
    } finally {
      reminderLock.current = false;
      setNativeBusy(false);
    }
  };
  if (!data) return null;
  const s = data.settings;
  return (
    <Screen
      title="Make room for your rhythm."
      subtitle="Simple preferences. A space that feels like you."
    >
      {f.feedback}
      <Card>
        <Heading small>Your training space</Heading>
        <Label muted>
          Appearance is always dark — charcoal, a little lime, and room to focus.
        </Label>
        <Label muted>Measurement system</Label>
        <Row>
          {(['metric', 'imperial'] as const).map((v) => (
            <Chip
              key={v}
              title={v === 'metric' ? 'Metric · kg / cm' : 'Imperial · lb / ft'}
              selected={s.units === v}
              onPress={() =>
                void f.run(() =>
                  update((d) => {
                    d.settings.units = v;
                  }),
                )
              }
            />
          ))}
        </Row>
        <Label muted style={{ fontSize: 11 }}>
          Saved values stay in kilograms and centimeters. Only display and input units change.
        </Label>
        <Row style={{ justifyContent: 'space-between' }}>
          <Label>Haptic feedback</Label>
          <Switch
            accessibilityLabel="Haptic feedback"
            trackColor={{ true: c.lime, false: c.border }}
            thumbColor={c.text}
            value={s.haptics}
            onValueChange={(v) =>
              void f.run(() =>
                update((d) => {
                  d.settings.haptics = v;
                }),
              )
            }
          />
        </Row>
        <Row style={{ justifyContent: 'space-between' }}>
          <Label>Show bodyweight tracking</Label>
          <Switch
            accessibilityLabel="Show bodyweight tracking"
            trackColor={{ true: c.lime, false: c.border }}
            thumbColor={c.text}
            value={s.bodyweight}
            onValueChange={(v) =>
              void f.run(() =>
                update((d) => {
                  d.settings.bodyweight = v;
                }),
              )
            }
          />
        </Row>
        <Field
          label="Default rest (0–1800 seconds)"
          value={rest}
          onChangeText={setRest}
          keyboardType="number-pad"
          onBlur={() =>
            void f.run(async () => {
              if (!rest.trim()) throw new Error('Enter a rest duration.');
              await update((d) => {
                d.settings.rest = Number(rest);
              });
            }, 'Default rest saved.')
          }
        />
        <Label muted style={{ fontSize: 11 }}>
          Used for exercises you add to a plan. Templates retain their own rest times. Timer audio
          is not enabled.
        </Label>
        <Field
          label="Typical workout (5–240 minutes)"
          value={duration}
          onChangeText={setDuration}
          keyboardType="number-pad"
          onBlur={() =>
            void f.run(async () => {
              if (!duration.trim()) throw new Error('Enter a workout duration.');
              await update((d) => {
                d.profile.duration = Number(duration);
              });
            }, 'Workout duration preference saved.')
          }
        />
      </Card>
      <Card>
        <Row style={{ justifyContent: 'space-between' }}>
          <Heading small>A gentle nudge</Heading>
          <Badge color={c.lavender}>
            {s.reminder.enabled ? 'SCHEDULED ON DEVICE' : 'REMINDERS OFF'}
          </Badge>
        </Row>
        <Label muted>
          Choose when to make a little time for yourself. Device notifications require permission.
        </Label>
        <Row style={{ flexWrap: 'wrap' }}>
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day, i) => (
            <Chip
              key={day}
              title={day}
              selected={days.includes(i)}
              onPress={() => setDays(days.includes(i) ? days.filter((d) => d !== i) : [...days, i])}
            />
          ))}
        </Row>
        <Label muted style={{ fontSize: 12 }}>Reminder time</Label>
        <Row style={{ flexWrap: 'wrap', gap: 8 }}>
          {[6, 7, 8, 9, 10, 12, 17, 18, 19, 20, 21].map((h) => (
            <Chip
              key={h}
              title={h < 12 ? `${h}am` : h === 12 ? '12pm' : `${h - 12}pm`}
              selected={Number(hour) === h}
              onPress={() => { setHour(String(h)); setMinute('0'); }}
            />
          ))}
        </Row>
        <Label muted style={{ fontSize: 11 }}>
          Selected: {(() => {
            const h = Number(hour);
            const m = Number(minute);
            const period = h < 12 ? 'am' : 'pm';
            const displayH = h === 0 ? 12 : h > 12 ? h - 12 : h;
            return `${displayH}:${String(m).padStart(2, '0')} ${period} device time`;
          })()}
        </Label>
        <Button
          title={s.reminder.enabled ? 'Update reminder schedule' : 'Enable reminders'}
          disabled={nativeBusy}
          icon="bell"
          onPress={() =>
            void f.run(
              () =>
                nativeAction(async () => {
                  if (!hour.trim() || !minute.trim()) throw new Error('Enter an hour and minute.');
                  const reminder = settingsSchema.shape.reminder.parse({
                    enabled: true,
                    days,
                    hour: Number(hour),
                    minute: Number(minute),
                    ids: [],
                  });
                  const ids = await scheduleReminders(reminder);
                  try {
                    await update((d) => {
                      d.settings.reminder = { ...reminder, ids };
                    });
                  } catch (e) {
                    await cancelReminders(ids);
                    throw e;
                  }
                  await cancelReminders(s.reminder.ids);
                }),
              'Reminder schedule confirmed by your device.',
            )
          }
        />
        {s.reminder.enabled && (
          <Button
            title="Turn reminders off"
            disabled={nativeBusy}
            tone="secondary"
            onPress={() =>
              void f.run(
                () =>
                  nativeAction(async () => {
                    await cancelReminders(s.reminder.ids);
                    await update((d) => {
                      d.settings.reminder.enabled = false;
                      d.settings.reminder.ids = [];
                    });
                  }),
                'Reminders turned off.',
              )
            }
          />
        )}
        <Label muted style={{ fontSize: 11 }}>
          Delivery may be delayed by battery saving or device notification settings.
        </Label>
      </Card>
      <Card>
        <Heading small>Your data belongs to you.</Heading>
        <Label muted>
          Everything lives in this app’s local database. Export a backup before switching devices or
          reinstalling.
        </Label>
        <Button
          title="Export JSON backup"
          tone="secondary"
          icon="download"
          onPress={() =>
            void f.run(
              () => exportBackup(data),
              'Backup prepared. On Android, finish saving it in the share sheet.',
            )
          }
        />
        <Button
          title="Restore from backup"
          disabled={nativeBusy}
          tone="secondary"
          icon="upload"
          onPress={() =>
            void f.run(async () => {
              const backup = await chooseBackup();
              if (!backup) return;
              if (
                await confirm(
                  'Replace local data with this backup?',
                  `Restore ${backup.plans.length} plans, ${backup.sessions.length} sessions, and ${backup.weights.length} measurements? Current data will be replaced atomically. Export it first if needed. Device reminders will be turned off.`,
                  true,
                )
              ) {
                await replace(backup);
                await cancelReminders(s.reminder.ids);
                setRest(String(backup.settings.rest));
                setDuration(String(backup.profile.duration));
                setDays(backup.settings.reminder.days);
                setHour(String(backup.settings.reminder.hour));
                setMinute(String(backup.settings.reminder.minute));
                f.show('Backup restored. Check your library and history.');
              }
            })
          }
        />
        <Label muted style={{ fontSize: 11 }}>
          Formwise version 1 and 2 JSON supported. Restore replaces all app data after validation
          and confirmation; merge is not supported. Malformed files leave existing data intact. Keep
          backups private: they contain your profile and fitness records.
        </Label>
      </Card>
      <Button
        title="Preview & copy backup JSON"
        icon="file-text"
        tone="secondary"
        onPress={() => router.push('/backup-preview')}
      />
      <Card>
        <Heading small>A fresh page</Heading>
        <Button
          title="Clear workout history"
          tone="danger"
          icon="trash-2"
          onPress={() =>
            void f.run(async () => {
              if (
                await confirm(
                  'Clear completed workout history?',
                  'All completed and abandoned sessions will be deleted. An active workout, your plans, measurements, and profile will remain.',
                  true,
                )
              ) {
                await update((d) => {
                  d.sessions = d.sessions.filter((s) => s.status === 'active');
                });
                f.show('Workout history cleared.');
              }
            })
          }
        />
        <Button
          title="Reset preferences"
          disabled={nativeBusy}
          tone="secondary"
          onPress={() =>
            void f.run(async () => {
              if (
                await confirm(
                  'Reset preferences?',
                  'Units, haptics, timers, and reminder preferences will return to defaults. Fitness data will remain.',
                )
              ) {
                await cancelReminders(s.reminder.ids);
                await update((d) => {
                  d.settings = {
                    ...freshData().settings,
                    exerciseVideos: d.settings.exerciseVideos,
                  };
                });
                setRest('60');
                setDays(freshData().settings.reminder.days);
                setHour('18');
                setMinute('0');
                f.show('Preferences reset.');
              }
            })
          }
        />
        <Button
          title="Reset the entire app"
          disabled={nativeBusy}
          tone="danger"
          onPress={() =>
            void f.run(async () => {
              if (
                await confirm(
                  'Erase all Formwise data?',
                  'This permanently removes your profile, custom plans, sessions, measurements, goals, and settings. Export a backup first. Starter templates will be restored.',
                  true,
                )
              ) {
                await cancelReminders(s.reminder.ids);
                await replace(freshData());
              }
            })
          }
        />
      </Card>
      <View style={{ alignItems: 'center', gap: 8, padding: 20 }}>
        <Label style={{ color: c.lime, fontSize: 22, fontWeight: '700' }}>formwise</Label>
        <Label muted style={{ fontSize: 11 }}>
          Version 1.0.0 · Made for your momentum.
        </Label>
        <Label muted style={{ textAlign: 'center', fontSize: 11 }}>
          Fitness records stay on this device. Optional YouTube playback connects to YouTube and may
          include ads.
        </Label>
      </View>
    </Screen>
  );
}
