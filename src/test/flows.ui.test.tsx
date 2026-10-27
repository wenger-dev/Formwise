import { router } from 'expo-router';
import React from 'react';
import { Alert } from 'react-native';
import { fireEvent, render, waitFor } from '@testing-library/react-native';
import { freshData, beginnerPlans } from '../constants/catalog';
import { clone, finishSession, startSession, validateData } from '../lib/fitness';
import { AppData } from '../types/domain';
import { ProfileForm } from '../features/profile/ProfileForm';
import SessionScreen from '../app/session/[id]';
import PlanScreen from '../app/plan/[id]';
import SettingsScreen from '../app/(tabs)/settings';

let mockData: AppData;
let mockId = 'new';
const mockReplace = jest.fn();
const mockPreventRemove = jest.fn((...args: unknown[]) => {
  void args;
  return jest.fn();
});
const mockUpdate = jest.fn(async (recipe: (draft: AppData) => void) => {
  const next = clone(mockData);
  recipe(next);
  mockData = validateData(next);
});
const mockFinish = jest.fn(async (id: string) => {
  await mockUpdate((d) => {
    const i = d.sessions.findIndex((s) => s.id === id);
    d.sessions[i] = finishSession(d.sessions[i]);
  });
});
jest.mock('../store/useApp', () => ({
  useApp: Object.assign(
    () => ({ data: mockData, update: mockUpdate, finish: mockFinish, replace: jest.fn() }),
    { getState: () => ({ data: mockData }) },
  ),
}));
jest.mock('expo-router', () => ({
  router: {
    replace: (...args: unknown[]) => mockReplace(...args),
    push: jest.fn(),
    back: jest.fn(),
  },
  useLocalSearchParams: () => ({ id: mockId }),
  usePreventRemove: (...args: unknown[]) => mockPreventRemove(...args),
  useFocusEffect: jest.fn(),
}));
beforeEach(() => {
  mockData = freshData();
  mockId = 'new';
  jest.clearAllMocks();
});
afterEach(() => {
  jest.restoreAllMocks();
});
test('onboarding saves entered profile and can be completed without optional measurements', async () => {
  const done = jest.fn();
  const view = await render(<ProfileForm onboarding onDone={done} />);
  await fireEvent.changeText(view.getByLabelText('What should we call you?'), 'Ari');
  await fireEvent.press(view.getByRole('button', { name: 'Let’s get moving' }));
  await waitFor(() => expect(done).toHaveBeenCalled());
  expect(mockData.profile.name).toBe('Ari');
  expect(mockData.profile.onboarded).toBe(true);
  expect(mockData.weights).toEqual([]);
});
test('invalid optional profile measurements show an error and do not persist', async () => {
  const view = await render(<ProfileForm />);
  await fireEvent.changeText(view.getByLabelText('Current weight (kg, optional)'), '-5');
  await fireEvent.press(view.getByRole('button', { name: 'Save profile' }));
  expect(
    await view.findByText('Enter a weight above 0 and at most 500 kg (1102 lb).'),
  ).toBeTruthy();
  expect(mockUpdate).not.toHaveBeenCalled();
});
test('changing display units preserves canonical measurements when fields are untouched', async () => {
  mockData.profile.heightCm = 173.123;
  mockData.weights.push({ id: 'measurement', date: '2026-01-01', kg: 72.345 });
  const view = await render(<ProfileForm />);
  await fireEvent.press(view.getByRole('button', { name: 'lb / ft + in' }));
  await fireEvent.press(view.getByRole('button', { name: 'Save profile' }));
  await waitFor(() => expect(mockData.settings.units).toBe('imperial'));
  expect(mockData.profile.heightCm).toBe(173.123);
  expect(mockData.weights).toHaveLength(1);
  expect(mockData.weights[0].kg).toBe(72.345);
});
test('a custom plan can add a catalog exercise and persist its configuration', async () => {
  const view = await render(<PlanScreen />);
  await fireEvent.changeText(view.getByLabelText('Workout name'), 'My first workout');
  await fireEvent.press(view.getByRole('button', { name: 'Add exercise' }));
  await fireEvent.press(view.getAllByRole('button', { name: 'Add' })[0]);
  await fireEvent.press(view.getByRole('button', { name: 'Save workout' }));
  await waitFor(() => expect(mockReplace).toHaveBeenCalled());
  const saved = mockData.plans.find((p) => p.name === 'My first workout')!;
  expect(saved.template).toBe(false);
  expect(saved.exercises[0].exerciseId).toBe('squat');
  expect(saved.exercises[0].sets).toBe(3);
});
test('set inputs are saved before completing a set and the rest timer starts', async () => {
  mockData.sessions.push(startSession(mockData.plans[0]));
  mockData.sessions[0].exercises[0].sets[0].id = '__proto__';
  mockId = mockData.sessions[0].id;
  const view = await render(<SessionScreen />);
  await fireEvent.changeText(view.getByLabelText('Set 1 reps'), '8');
  await fireEvent.changeText(view.getByLabelText('Set 1 kg'), '20');
  await fireEvent.press(view.getByRole('button', { name: 'Complete set 1' }));
  await waitFor(() => expect(mockData.sessions[0].exercises[0].sets[0].completed).toBe(true));
  expect(mockData.sessions[0].exercises[0].sets[0].reps).toBe(8);
  expect(mockData.sessions[0].exercises[0].sets[0].weight).toBe(20);
  expect(mockData.sessions[0].timer?.endAt).not.toBeNull();
  await view.rerender(<SessionScreen />);
  await fireEvent.press(view.getByRole('button', { name: 'Pause timer' }));
  await waitFor(() => expect(mockData.sessions[0].timer?.endAt).toBeNull());
  await view.rerender(<SessionScreen />);
  await fireEvent.press(view.getByRole('button', { name: 'Reset' }));
  await waitFor(() => expect(mockData.sessions[0].timer?.remaining).toBe(60));
  await fireEvent.press(view.getByRole('button', { name: 'Skip rest' }));
  await waitFor(() => expect(mockData.sessions[0].timer).toBeNull());
});
test('moving between exercises does not mark unfinished sets complete', async () => {
  mockData.sessions.push(startSession(mockData.plans[0]));
  mockId = mockData.sessions[0].id;
  const view = await render(<SessionScreen />);
  await fireEvent.press(view.getByRole('button', { name: 'Next exercise' }));
  await waitFor(() => expect(mockData.sessions[0].currentExercise).toBe(1));
  expect(mockData.sessions[0].exercises[0].sets.every((s) => !s.completed)).toBe(true);
});
test('finishing an incomplete workout requires confirmation and persists only completed sets', async () => {
  mockData.sessions.push(startSession(mockData.plans[0]));
  mockId = mockData.sessions[0].id;
  mockData.sessions[0].exercises[0].sets[0].completed = true;
  jest.spyOn(Alert, 'alert').mockImplementation((_title, _message, buttons) => {
    buttons?.find((b) => b.text === 'Confirm')?.onPress?.();
  });
  const view = await render(<SessionScreen />);
  await fireEvent.press(view.getByRole('button', { name: 'Finish workout' }));
  await waitFor(() => expect(mockData.sessions[0].status).toBe('completed'));
  expect(mockData.sessions[0].exercises[0].sets[1].completed).toBe(false);
  expect(mockFinish).toHaveBeenCalledTimes(1);
});
test('canceling clear history leaves completed sessions intact', async () => {
  const session = startSession(mockData.plans[0]);
  session.exercises[0].sets[0].completed = true;
  mockData.sessions.push(finishSession(session));
  jest.spyOn(Alert, 'alert').mockImplementation((_title, _message, buttons) => {
    buttons?.find((b) => b.text === 'Cancel')?.onPress?.();
  });
  const view = await render(<SettingsScreen />);
  await fireEvent.press(view.getByRole('button', { name: 'Clear workout history' }));
  await waitFor(() => expect(Alert.alert).toHaveBeenCalled());
  expect(mockData.sessions).toHaveLength(1);
  expect(mockUpdate).not.toHaveBeenCalled();
});

test('exercise alternative changes the snapshot, clears uncompleted loads, and supports returning to original', async () => {
  const session = startSession(beginnerPlans()[0]);
  session.exercises[0].sets[0].weight = 35;
  session.exercises[0].sets[0].targetWeight = 35;
  mockId = session.id;
  mockData.sessions.push(session);
  jest.spyOn(Alert, 'alert').mockImplementation((_title, _message, buttons) => {
    buttons?.find((b) => b.text === 'Confirm')?.onPress?.();
  });
  const view = await render(<SessionScreen />);
  await fireEvent.press(view.getByRole('button', { name: 'Form, video & alternatives' }));
  await fireEvent.press(view.getByRole('button', { name: 'Use this alternative' }));
  await waitFor(() => expect(mockData.sessions[0].exercises[0].exercise.id).toBe('alt-legpress'));
  expect(mockData.sessions[0].exercises[0].sets[0].weight).toBeNull();
  expect(mockData.sessions[0].exercises[0].sets[0].targetWeight).toBeNull();
  await view.rerender(<SessionScreen />);
  await fireEvent.press(view.getByRole('button', { name: 'Form, video & alternatives' }));
  await fireEvent.press(view.getByRole('button', { name: 'Use original movement' }));
  await waitFor(() => expect(mockData.sessions[0].exercises[0].exercise.id).toBe('learn-legpress'));
});

test('opening a YouTube demo flushes typed set input and passes the current exercise', async () => {
  const session = startSession(mockData.plans[0]);
  mockData.sessions.push(session);
  mockId = session.id;
  const view = await render(<SessionScreen />);
  await fireEvent.changeText(view.getByLabelText('Set 1 kg'), '22');
  await fireEvent.press(view.getByRole('button', { name: 'Watch YouTube demo' }));
  await waitFor(() =>
    expect(router.push).toHaveBeenCalledWith({
      pathname: '/exercise-video',
      params: { exerciseId: 'squat', sessionId: session.id },
    }),
  );
  expect(mockData.sessions[0].exercises[0].sets[0].weight).toBe(22);
});
