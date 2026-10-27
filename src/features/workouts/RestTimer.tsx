import React, { useState } from 'react';
import { Button, Card, Chip, Field, Heading, Label, Badge, Row } from '../../components/ui';
import { Session } from '../../types/domain';
import { durationLabel, remainingSeconds } from '../../lib/fitness';

type Timer = Session['timer'];
export function RestTimer({
  timer,
  now,
  defaultDuration,
  run,
  change,
}: {
  timer: Timer;
  now: number;
  defaultDuration: number;
  run: (task: () => Promise<unknown>) => void;
  change: (recipe: (s: Session) => void) => Promise<void>;
}) {
  const [custom, setCustom] = useState(String(defaultDuration));
  const remaining = remainingSeconds(timer, now);
  const start = (seconds: number) =>
    change((s) => {
      s.timer = { duration: seconds, remaining: seconds, endAt: Date.now() + seconds * 1000 };
    });
  const adjust = (seconds: number) =>
    change((s) => {
      if (!s.timer) return;
      const left = Math.max(0, Math.min(3600, remainingSeconds(s.timer) + seconds));
      s.timer = {
        ...s.timer,
        remaining: left,
        endAt: s.timer.endAt === null ? null : Date.now() + left * 1000,
      };
    });
  return (
    <Card style={{ borderColor: '#53643C' }}>
      <Row style={{ justifyContent: 'space-between', flexWrap: 'wrap' }}>
        <Heading small>Take a breath.</Heading>
        <Badge>
          {timer
            ? remaining === 0
              ? 'REST COMPLETE'
              : timer.endAt === null
                ? 'TIMER PAUSED'
                : 'REST TIMER'
            : 'REST TIMER'}
        </Badge>
      </Row>
      <Label
        style={{
          textAlign: 'center',
          fontVariant: ['tabular-nums'],
          fontWeight: '700',
          fontSize: 58,
          lineHeight: 68,
          letterSpacing: -2,
        }}
      >
        {durationLabel(remaining * 1000)}
      </Label>
      <Row style={{ flexWrap: 'wrap', justifyContent: 'center' }}>
        {[30, 45, 60, 90, 120].map((seconds) => (
          <Chip
            key={seconds}
            title={`${seconds}s`}
            selected={timer?.duration === seconds}
            onPress={() => run(() => start(seconds))}
          />
        ))}
      </Row>
      <Row>
        <Field
          label="Custom rest (0–1800 sec)"
          value={custom}
          onChangeText={setCustom}
          keyboardType="number-pad"
        />
        <Button
          title="Start"
          onPress={() =>
            run(async () => {
              const n = Number(custom);
              if (!Number.isInteger(n) || n < 0 || n > 1800 || !custom.trim())
                throw new Error('Choose a duration from 0 to 1800 seconds.');
              await start(n);
            })
          }
        />
      </Row>
      {timer && (
        <>
          <Row style={{ justifyContent: 'center', flexWrap: 'wrap' }}>
            <Button title="−15 sec" tone="secondary" onPress={() => run(() => adjust(-15))} />
            <Button title="+15 sec" tone="secondary" onPress={() => run(() => adjust(15))} />
          </Row>
          <Row style={{ flexWrap: 'wrap' }}>
            <Button
              title={timer.endAt === null ? 'Resume timer' : 'Pause timer'}
              tone="secondary"
              onPress={() =>
                run(() =>
                  change((s) => {
                    if (!s.timer) return;
                    const left = remainingSeconds(s.timer);
                    s.timer = {
                      ...s.timer,
                      remaining: left,
                      endAt: s.timer.endAt === null ? Date.now() + left * 1000 : null,
                    };
                  }),
                )
              }
            />
            <Button
              title="Reset"
              tone="secondary"
              onPress={() =>
                run(() =>
                  change((s) => {
                    if (s.timer) s.timer = { ...s.timer, remaining: s.timer.duration, endAt: null };
                  }),
                )
              }
            />
            <Button
              title={remaining === 0 ? 'Ready for next set' : 'Skip rest'}
              onPress={() =>
                run(() =>
                  change((s) => {
                    s.timer = null;
                  }),
                )
              }
            />
          </Row>
        </>
      )}
      <Label muted style={{ fontSize: 11 }}>
        Rest time uses a saved end timestamp and recalculates when you return. Background alerts are
        not enabled.
      </Label>
    </Card>
  );
}
