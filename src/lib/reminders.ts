import { Platform } from 'react-native';
import { Settings } from '../types/domain';
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
