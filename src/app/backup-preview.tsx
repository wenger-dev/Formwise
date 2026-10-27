import React, { useMemo } from 'react';
import { router } from 'expo-router';
import * as Clipboard from 'expo-clipboard';
import { Button, Card, Heading, Label, Screen, useFeedback } from '../components/ui';
import { useApp } from '../store/useApp';
import { serializeBackup } from '../lib/fitness';
export default function BackupPreview() {
  const data = useApp((s) => s.data);
  const f = useFeedback();
  const json = useMemo(() => (data ? serializeBackup(data) : ''), [data]);
  if (!data) return null;
  return (
    <Screen
      title="Your portable progress."
      subtitle="Preview what leaves your device."
      action={<Button title="Back" tone="secondary" onPress={() => router.back()} />}
    >
      {f.feedback}
      <Card>
        <Heading small>Backup contents</Heading>
        <Label muted>
          Your profile, plans, workouts, goals, measurements, recovery entries, and settings. Copy
          only when you are ready to share these personal records.
        </Label>
        <Label>
          {data.sessions.length} workouts · {data.weights.length} weigh-ins ·{' '}
          {data.wellness.waist.length} waist entries · {data.wellness.recovery.length} recovery
          activities
        </Label>
        <Button
          title="Copy complete backup JSON"
          icon="copy"
          onPress={() =>
            void f.run(async () => {
              const ok = await Clipboard.setStringAsync(json);
              if (!ok)
                throw new Error(
                  'Clipboard access was not available. Use Export backup in Settings.',
                );
              f.show('Complete backup copied.');
            })
          }
        />
      </Card>
      <Card>
        <Label muted>
          {json.length > 30000
            ? 'Preview shortened to 30,000 characters. Copy and export include the complete backup.'
            : 'Complete JSON preview'}
        </Label>
        <Label selectable style={{ fontFamily: 'monospace', fontSize: 11, lineHeight: 17 }}>
          {json.slice(0, 30000)}
        </Label>
      </Card>
    </Screen>
  );
}
