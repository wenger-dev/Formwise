import { Platform } from 'react-native';
import { Settings } from '../types/domain';

const REST_DONE_ID = 'formwise-rest-done';

/** Schedule a one-shot local notification N seconds from now for rest-timer end.
 *  Safe to call on web (no-op). Replaces any previously scheduled rest notification. */
export async function scheduleRestNotification(seconds: number): Promise<void> {
  if (Platform.OS === 'web' || seconds <= 0) return;
  try {
    const N = await import('expo-notifications');
    await N.cancelScheduledNotificationAsync(REST_DONE_ID).catch(() => {});
    if (Platform.OS === 'android')
      await N.setNotificationChannelAsync('rest-timer', {
        name: 'Rest timer',
        importance: N.AndroidImportance.HIGH,
        sound: null,
      });
    const existing = await N.getPermissionsAsync();
    if (!existing.granted) {
      const result = await N.requestPermissionsAsync();
      if (!result.granted) return; // silently skip — not critical
    }
    await N.scheduleNotificationAsync({
      identifier: REST_DONE_ID,
      content: {
        title: 'Rest complete.',
        body: 'Ready for your next set.',
        sound: false,
      },
      trigger: {
        type: N.SchedulableTriggerInputTypes.TIME_INTERVAL,
        seconds,
        channelId: 'rest-timer',
      },
    });
  } catch {
    // Notification scheduling is best-effort; never block the workout
  }
}

/** Cancel the rest-timer notification (call when user skips/resets timer). */
export async function cancelRestNotification(): Promise<void> {
  if (Platform.OS === 'web') return;
  try {
    const N = await import('expo-notifications');
    await N.cancelScheduledNotificationAsync(REST_DONE_ID);
  } catch {}
}

export async function cancelReminders(ids: string[]) {
  if (Platform.OS === 'web') return;
  const Notifications = await import('expo-notifications');
  for (const id of ids) await Notifications.cancelScheduledNotificationAsync(id);
}
export async function scheduleReminders(reminder: Settings['reminder']): Promise<string[]> {
  if (Platform.OS === 'web')
    throw new Error(
      'Local reminders need an Android or iOS build. Your training data still works in the browser.',
    );
  if (!reminder.days.length) throw new Error('Choose at least one reminder day.');
  const N = await import('expo-notifications');
  if (Platform.OS === 'android')
    await N.setNotificationChannelAsync('workouts', {
      name: 'Workout reminders',
      importance: N.AndroidImportance.DEFAULT,
      sound: null,
    });
  const existing = await N.getPermissionsAsync();
  if (!existing.granted && !(await N.requestPermissionsAsync()).granted)
    throw new Error(
      'Notifications are not allowed. Enable them in your device settings to receive reminders.',
    );
  const ids: string[] = [];
  try {
    for (const day of reminder.days)
      ids.push(
        await N.scheduleNotificationAsync({
          content: {
            title: 'A little time for you.',
            body: 'Your next good workout starts with showing up. Open Formwise when you’re ready.',
            sound: false,
          },
          trigger: {
            type: N.SchedulableTriggerInputTypes.WEEKLY,
            weekday: day + 1,
            hour: reminder.hour,
            minute: reminder.minute,
            channelId: 'workouts',
          },
        }),
      );
    const scheduled = new Set(
      (await N.getAllScheduledNotificationsAsync()).map((n) => n.identifier),
    );
    if (!ids.every((id) => scheduled.has(id)))
      throw new Error('Your device did not confirm every reminder. Please try again.');
    return ids;
  } catch (e) {
    await cancelReminders(ids);
    throw e;
  }
}
