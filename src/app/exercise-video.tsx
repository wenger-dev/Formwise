import React, { useState } from 'react';
import { router, useLocalSearchParams } from 'expo-router';
import * as Linking from 'expo-linking';
import { Badge, Button, Card, Field, Heading, Label, Row, Screen, useFeedback } from '../components/ui';
import { useApp } from '../store/useApp';
import { catalog } from '../constants/catalog';
import { exerciseVideo, parseYouTubeId, youtubeSearch, youtubeWatch } from '../lib/youtube';
import { YouTubePlayer } from '../features/workouts/YouTubePlayer';

export default function ExerciseVideo() {
  const { exerciseId, sessionId } = useLocalSearchParams<{
    exerciseId: string;
    sessionId?: string;
  }>();
  const { data, update } = useApp();
  const f = useFeedback();
  const [link, setLink] = useState('');

  if (!data) return null;

  const exercise =
    catalog.find((x) => x.id === exerciseId) ??
    data.sessions
      .find((s) => s.id === sessionId)
      ?.exercises.find((x) => x.exercise.id === exerciseId)?.exercise;

  if (!exercise)
    return (
      <Screen title="Exercise unavailable">
        <Button title="Back" onPress={() => router.back()} />
      </Screen>
    );

  const videoId = exerciseVideo(exercise, data.settings.exerciseVideos);
  const custom = Object.prototype.hasOwnProperty.call(data.settings.exerciseVideos, exercise.id);

  return (
    <Screen
      title="See the movement."
      subtitle={exercise.name}
      action={
        <Button
          title={sessionId ? 'Back to workout' : 'Back'}
          tone="secondary"
          onPress={() => router.back()}
        />
      }
    >
      {f.feedback}
      <Card>
        <Badge>YOUTUBE · EXERCISE DEMO</Badge>
        <Heading small>{exercise.name}</Heading>

        {videoId ? (
          <>
            {/* Tap-to-load player with integrated loading, error, and fallback states */}
            <YouTubePlayer videoId={videoId} />
            <Row>
              <Button
                title="Open in YouTube"
                icon="external-link"
                tone="secondary"
                style={{ flex: 1 }}
                onPress={() => void f.run(() => Linking.openURL(youtubeWatch(videoId)))}
              />
            </Row>
            <Label muted style={{ fontSize: 12, lineHeight: 18 }}>
              Tap the thumbnail to load. Playback requires internet and may include YouTube ads.
              Some reference demos show a related variation — check the title and follow the cues
              for your chosen movement.
            </Label>
          </>
        ) : (
          <>
            <Label muted>
              No YouTube demo is saved for this movement yet. Find a demonstration, then paste its
              link below to watch it here.
            </Label>
            <Button
              title="Find demo on YouTube"
              icon="search"
              tone="secondary"
              onPress={() => void f.run(() => Linking.openURL(youtubeSearch(exercise)))}
            />
          </>
        )}
      </Card>

      <Card>
        <Heading small>{custom ? 'Your chosen demo' : 'Choose a YouTube demo'}</Heading>
        <Field
          label="YouTube video link"
          placeholder="https://www.youtube.com/watch?v=…"
          value={link}
          onChangeText={setLink}
          autoCapitalize="none"
          autoCorrect={false}
          keyboardType="url"
          maxLength={2000}
        />
        <Button
          title="Save demo for this exercise"
          icon="check"
          onPress={() =>
            void f.run(async () => {
              const id = parseYouTubeId(link);
              if (!id)
                throw new Error('Paste a valid YouTube video link (watch, Shorts, or youtu.be).');
              await update((d) => {
                d.settings.exerciseVideos = { ...d.settings.exerciseVideos, [exercise.id]: id };
              });
              setLink('');
              f.show('Your YouTube demo is saved.');
            })
          }
        />
        {custom && (
          <Button
            title="Use default demo"
            tone="secondary"
            onPress={() =>
              void f.run(() =>
                update((d) => {
                  delete d.settings.exerciseVideos[exercise.id];
                }),
              )
            }
          />
        )}
      </Card>

      <Card>
        <Heading small>Setup cues</Heading>
        {exercise.instructions.map((step, i) => (
          <Label muted key={i}>
            {i + 1}. {step}
          </Label>
        ))}
      </Card>
    </Screen>
  );
}
