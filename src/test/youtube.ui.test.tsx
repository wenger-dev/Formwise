import { YouTubePlayer } from '../features/workouts/YouTubePlayer';
import React from 'react';
import { fireEvent, render, waitFor } from '@testing-library/react-native';
import * as Linking from 'expo-linking';
import VideoScreen from '../app/exercise-video';
import { freshData } from '../constants/catalog';
import { clone, validateData } from '../lib/fitness';
import { AppData } from '../types/domain';
let mockData: AppData;
let mockExerciseId = 'squat';
const mockUpdate = jest.fn(async (recipe: (d: AppData) => void) => {
  const draft = clone(mockData);
  recipe(draft);
  mockData = validateData(draft);
});
jest.mock('../store/useApp', () => ({ useApp: () => ({ data: mockData, update: mockUpdate }) }));
jest.mock('expo-router', () => ({
  router: { back: jest.fn() },
  useLocalSearchParams: () => ({ exerciseId: mockExerciseId }),
}));
jest.mock('expo-linking', () => ({ openURL: jest.fn().mockResolvedValue(true) }));
jest.mock('../features/workouts/YouTubePlayer', () => ({ YouTubePlayer: jest.fn(() => null) }));
beforeEach(() => {
  mockData = freshData();
  mockExerciseId = 'squat';
  jest.clearAllMocks();
});
test('watch screen exposes a player and opens the exact current exercise video in YouTube', async () => {
  const view = await render(<VideoScreen />);
  expect(jest.mocked(YouTubePlayer).mock.calls.at(-1)?.[0]).toEqual({ videoId: '5Y3KW5rWMh4' });
  await fireEvent.press(view.getByRole('button', { name: 'Open in YouTube' }));
  expect(Linking.openURL).toHaveBeenCalledWith('https://www.youtube.com/watch?v=5Y3KW5rWMh4');
});
test('pasting a custom link saves it and overrides the default demo; clearing restores default', async () => {
  // squat has a default video ID; pasting a different one overrides it
  mockExerciseId = 'squat';
  const view = await render(<VideoScreen />);
  // default video plays
  expect(jest.mocked(YouTubePlayer).mock.calls.at(-1)?.[0]).toEqual({ videoId: '5Y3KW5rWMh4' });
  // paste a replacement link
  await fireEvent.changeText(
    view.getByLabelText('YouTube video link'),
    'https://youtu.be/hCDzSR6Tgow',
  );
  await fireEvent.press(view.getByRole('button', { name: 'Save demo for this exercise' }));
  await waitFor(() => expect(mockData.settings.exerciseVideos.squat).toBe('hCDzSR6Tgow'));
  expect(jest.mocked(YouTubePlayer).mock.calls.at(-1)?.[0]).toEqual({ videoId: 'hCDzSR6Tgow' });
  // clear the override — default should be restored
  await fireEvent.press(view.getByRole('button', { name: 'Use default demo' }));
  await view.rerender(<VideoScreen />);
  // back to default video
  expect(jest.mocked(YouTubePlayer).mock.calls.at(-1)?.[0]).toEqual({ videoId: '5Y3KW5rWMh4' });
});
