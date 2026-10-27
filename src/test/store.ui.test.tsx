import { useApp } from '../store/useApp';
import { freshData } from '../constants/catalog';
import { AppData } from '../types/domain';
import { clone, validateData } from '../lib/fitness';

let mockDisk: AppData;
const mockSave = jest.fn(async (data: AppData) => {
  mockDisk = clone(validateData(data));
  return clone(mockDisk);
});
const mockInitialize = jest.fn(async () => clone(mockDisk));
const mockOpen = jest.fn(async () => ({ initialize: mockInitialize, save: mockSave }));
jest.mock('../db/open', () => ({ openRepository: () => mockOpen() }));
beforeEach(() => {
  mockDisk = freshData();
  useApp.setState({ data: null, error: null, busy: false });
  jest.clearAllMocks();
});
test('concurrent initialization opens one database and serialized updates retain both edits', async () => {
  await Promise.all([useApp.getState().initialize(), useApp.getState().initialize()]);
  expect(mockOpen).toHaveBeenCalledTimes(1);
  await Promise.all([
    useApp.getState().update((d) => {
      d.profile.name += 'A';
    }),
    useApp.getState().update((d) => {
      d.profile.name += 'B';
    }),
  ]);
  expect(useApp.getState().data!.profile.name).toBe('AB');
  expect(mockDisk.profile.name).toBe('AB');
  await useApp.getState().update((d) => {
    d.profile.name = '  Ari  ';
  });
  expect(useApp.getState().data!.profile.name).toBe('Ari');
  expect(mockDisk.profile.name).toBe('Ari');
});
test('a failed save leaves published state unchanged and later saves still work', async () => {
  await useApp.getState().initialize();
  mockSave.mockRejectedValueOnce(new Error('Storage full'));
  await expect(
    useApp.getState().update((d) => {
      d.profile.name = 'Unsaved';
    }),
  ).rejects.toThrow('Storage full');
  expect(useApp.getState().data!.profile.name).toBe('');
  expect(useApp.getState().busy).toBe(false);
  await useApp.getState().update((d) => {
    d.profile.name = 'Saved';
  });
  expect(mockDisk.profile.name).toBe('Saved');
});
test('rapid start and finish actions cannot duplicate a session and recovery retains logged sets', async () => {
  await useApp.getState().initialize();
  const planId = mockDisk.plans[0].id;
  const [first, second] = await Promise.all([
    useApp.getState().start(planId),
    useApp.getState().start(planId),
  ]);
  expect(first).toBe(second);
  expect(useApp.getState().data!.sessions).toHaveLength(1);
  await useApp.getState().update((d) => {
    d.sessions[0].exercises[0].sets[0].completed = true;
    d.sessions[0].exercises[0].sets[0].weight = 20;
  });
  useApp.setState({ data: null });
  await useApp.getState().initialize();
  expect(useApp.getState().data!.sessions[0].status).toBe('active');
  expect(useApp.getState().data!.sessions[0].exercises[0].sets[0].weight).toBe(20);
  await Promise.all([useApp.getState().finish(first), useApp.getState().finish(first)]);
  expect(mockDisk.sessions).toHaveLength(1);
  expect(mockDisk.sessions[0].status).toBe('completed');
});
