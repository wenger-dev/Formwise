import { create } from 'zustand';
import { AppData } from '../types/domain';
import { Repository } from '../db/repository';
import { openRepository } from '../db/open';
import { clone, finishSession, startSession } from '../lib/fitness';

interface Store {
  data: AppData | null;
  error: string | null;
  busy: boolean;
  initialize: () => Promise<void>;
  update: (recipe: (draft: AppData) => void) => Promise<void>;
  replace: (data: AppData) => Promise<void>;
  start: (planId: string) => Promise<string>;
  finish: (sessionId: string) => Promise<void>;
}
let repository: Repository;
let queue = Promise.resolve();
let initializing: Promise<void> | null = null;
export const useApp = create<Store>((set, get) => ({
  data: null,
  error: null,
  busy: false,
  initialize: async () => {
    if (get().data) return;
    if (initializing) return initializing;
    initializing = (async () => {
      try {
        set({ error: null });
        repository = await openRepository();
        set({ data: await repository.initialize() });
      } catch (e) {
        set({ error: e instanceof Error ? e.message : 'Could not open local data.' });
      }
    })().finally(() => {
      initializing = null;
    });
    return initializing;
  },
  update: (recipe) => {
    const task = queue.then(async () => {
      const current = get().data;
      if (!current) throw new Error('Local data is not ready yet.');
      set({ busy: true });
      try {
        const draft = clone(current);
        recipe(draft);
        const saved = await repository.save(draft);
        set({ data: saved });
      } finally {
        set({ busy: false });
      }
    });
    queue = task.catch(() => {});
    return task;
  },
  replace: async (data) => get().update((draft) => Object.assign(draft, data)),
  start: async (planId) => {
    let id = '';
    await get().update((draft) => {
      const active = draft.sessions.find((s) => s.status === 'active');
      if (active) {
        id = active.id;
        return;
      }
      const plan = draft.plans.find((p) => p.id === planId);
      if (!plan) throw new Error('Workout plan was not found.');
      const session = startSession(plan);
      draft.sessions.push(session);
      id = session.id;
    });
    return id;
  },
  finish: async (sessionId) =>
    get().update((draft) => {
      const i = draft.sessions.findIndex((s) => s.id === sessionId);
      if (i < 0) throw new Error('Workout was not found.');
      draft.sessions[i] = finishSession(draft.sessions[i]);
    }),
}));
