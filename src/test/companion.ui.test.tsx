import React from 'react';
import { fireEvent, render, waitFor } from '@testing-library/react-native';
import Coach from '../app/coach';
import { freshData } from '../constants/catalog';
import { clone, validateData } from '../lib/fitness';
import { AppData } from '../types/domain';
let mockData: AppData;
const mockUpdate = jest.fn(async (recipe: (d: AppData) => void) => {
  const d = clone(mockData);
  recipe(d);
  mockData = validateData(d);
});
const mockStart = jest.fn().mockResolvedValue('home-session');
jest.mock('../store/useApp', () => ({
  useApp: () => ({ data: mockData, update: mockUpdate, start: mockStart }),
}));
jest.mock('expo-router', () => ({
  router: { back: jest.fn(), push: jest.fn() },
  useLocalSearchParams: () => ({}),
}));
beforeEach(() => {
  mockData = freshData();
  jest.clearAllMocks();
});
test('installs phase-specific beginner plans and starts the actual home plan', async () => {
  const view = await render(<Coach />);
  await fireEvent.press(view.getByText('Weeks 3–6'));
  await fireEvent.press(view.getByRole('button', { name: 'Add 2-set beginner plans' }));
  await waitFor(() => expect(mockData.plans.some((p) => p.id === 'beginner-home')).toBe(true));
  expect(mockData.plans.find((p) => p.id === 'beginner-home')!.exercises[0].sets).toBe(2);
  await fireEvent.press(view.getByRole('button', { name: 'Start Beginner · Home' }));
  expect(mockStart).toHaveBeenCalledWith('beginner-home');
});
test('imperial waist entry persists canonical centimeters and invalid input preserves it', async () => {
  mockData.settings.units = 'imperial';
  const view = await render(<Coach />);
  await fireEvent.press(view.getByText('Measurements'));
  await fireEvent.changeText(view.getByLabelText('Waist (in)'), '36');
  await fireEvent.press(view.getByRole('button', { name: 'Save waist measurement' }));
  await waitFor(() => expect(mockData.wellness.waist).toHaveLength(1));
  expect(mockData.wellness.waist[0].cm).toBeCloseTo(91.44);
  await fireEvent.changeText(view.getByLabelText('Waist (in)'), '0');
  await fireEvent.press(view.getByRole('button', { name: 'Save waist measurement' }));
  expect(mockData.wellness.waist).toHaveLength(1);
  expect(mockData.wellness.waist[0].cm).toBeCloseTo(91.44);
});
test('recovery save validates duration and keeps walks separate from strength sessions', async () => {
  const view = await render(<Coach />);
  await fireEvent.press(view.getByText('Recovery'));
  await fireEvent.changeText(view.getByLabelText('Minutes walked'), '25');
  await fireEvent.press(view.getByText('Moderate'));
  await fireEvent.press(view.getByRole('button', { name: 'Save recovery activity' }));
  await waitFor(() => expect(mockData.wellness.recovery).toHaveLength(1));
  expect(mockData.wellness.recovery[0]).toMatchObject({ minutes: 25, effort: 'Moderate' });
  expect(mockData.sessions).toHaveLength(0);
});
