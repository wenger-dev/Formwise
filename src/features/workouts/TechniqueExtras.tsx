import React, { useState } from 'react';
import * as Linking from 'expo-linking';
import { Button, Heading, Label, Sheet, useFeedback } from '../../components/ui';
import { referenceGuides, catalog } from '../../constants/catalog';
import { Exercise } from '../../types/domain';
const aliases: Record<string, string> = {
  pulldown: 'latpulldown',
  bridge: 'glutebridge',
  calf: 'calfraise',
};
export function TechniqueExtras({
  exercise,
  onSwap,
  swapDisabled = false,
  collapsible = false,
}: {
  exercise: Exercise;
  onSwap?: (exercise: Exercise) => void;
  swapDisabled?: boolean;
  collapsible?: boolean;
}) {
  const f = useFeedback();
  const [open, setOpen] = useState(false);
  const isAlternative = exercise.id.startsWith('alt-');
  const key = isAlternative
    ? exercise.id.replace('alt-', 'learn-')
    : exercise.id.startsWith('learn-')
      ? exercise.id
      : 'learn-' + aliases[exercise.id];
  const guide = referenceGuides[key];
  if (!guide) return null;
  const alternative = catalog.find(
    (x) => x.id === (isAlternative ? key : key.replace('learn-', 'alt-')),
  )!;
  const video = (id: string) =>
    id.startsWith('vimeo:')
      ? 'https://vimeo.com/' + id.slice(6)
      : 'https://www.youtube.com/watch?v=' + id;
  const content = (
    <>
      {f.feedback}
      <Heading small>{isAlternative ? 'Original movement cues' : 'Common mistakes'}</Heading>
      {(isAlternative ? guide.how : guide.mistakes).map((x) => (
        <Label muted key={x}>
          • {x}
        </Label>
      ))}
      <Heading small>{isAlternative ? 'Switch back when ready' : 'Machine unavailable?'}</Heading>
      <Label>{alternative.name}</Label>
      <Label muted>{isAlternative ? alternative.equipment : guide.alternative.equipment}</Label>
      {alternative.instructions.map((x, i) => (
        <Label muted key={i}>
          {i + 1}. {x}
        </Label>
      ))}
      {onSwap && (
        <Button
          title={isAlternative ? 'Use original movement' : 'Use this alternative'}
          tone="secondary"
          disabled={swapDisabled}
          onPress={() => {
            setOpen(false);
            onSwap(alternative);
          }}
        />
      )}
      {swapDisabled && onSwap && (
        <Label muted>
          Undo completed sets before changing the movement. Logged loads belong to the original
          exercise.
        </Label>
      )}
      <Button
        title="Watch reference demonstration ↗"
        tone="secondary"
        onPress={() => void f.run(() => Linking.openURL(video(guide.videoId)))}
      />
      <Label muted>
        {guide.videoLabel.split(' · ')[0]} · Opens an external service; internet required. Some
        reference videos demonstrate a related variation. Follow the written setup for your chosen
        movement.
      </Label>
      {guide.alternative.videoId && (
        <Button
          title="Watch alternative demonstration ↗"
          tone="secondary"
          onPress={() => void f.run(() => Linking.openURL(video(guide.alternative.videoId)))}
        />
      )}
    </>
  );
  return collapsible ? (
    <>
      <Button
        title="Form, video & alternatives"
        tone="secondary"
        icon="book-open"
        onPress={() => setOpen(true)}
      />
      <Sheet visible={open} title={exercise.name} onClose={() => setOpen(false)}>
        {content}
      </Sheet>
    </>
  ) : (
    content
  );
}
