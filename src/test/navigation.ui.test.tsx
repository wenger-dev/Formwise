import { fireEvent, renderRouter, waitFor } from 'expo-router/testing-library';
import RootLayout from '../app/_layout';
import TabLayout from '../app/(tabs)/_layout';
import Home from '../app/(tabs)/index';
import Workouts from '../app/(tabs)/workouts';
import Progress from '../app/(tabs)/progress';
import Profile from '../app/(tabs)/profile';
import Settings from '../app/(tabs)/settings';
import Onboarding from '../app/onboarding';
import History from '../app/history';
import Plan from '../app/plan/[id]';
import Session from '../app/session/[id]';
import { freshData } from '../constants/catalog';
import { useApp } from '../store/useApp';

jest.mock('../db/open', () => ({ openRepository: jest.fn() }));

test('all five real tab destinations navigate and render their screen content', async () => {
  const data = freshData();
  data.profile.onboarded = true;
  useApp.setState({ data, error: null, busy: false });
  const view = await renderRouter(
    {
      _layout: RootLayout,
      '(tabs)/_layout': TabLayout,
      '(tabs)/index': Home,
      '(tabs)/workouts': Workouts,
      '(tabs)/progress': Progress,
      '(tabs)/profile': Profile,
      '(tabs)/settings': Settings,
      onboarding: Onboarding,
      history: History,
      'plan/[id]': Plan,
      'session/[id]': Session,
    },
    { initialUrl: '/' },
  );
  expect(view.getPathname()).toBe('/');
  for (const [label, path, heading] of [
    ['Workouts', '/workouts', 'Find your next challenge.'],
    ['Progress', '/progress', 'Progress you can feel.'],
    ['Profile', '/profile', 'All about you.'],
    ['Settings', '/settings', 'Make room for your rhythm.'],
    ['Home', '/', 'Let’s make it count.'],
  ]) {
    await fireEvent.press(view.getByText(label));
    await waitFor(() => expect(view.getPathname()).toBe(path));
    expect(view.getByText(heading)).toBeTruthy();
  }
});
