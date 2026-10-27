import { Platform } from 'react-native';
import { AppData } from '../types/domain';
import { parseBackup, serializeBackup } from './fitness';
export async function exportBackup(data: AppData) {
  const json = serializeBackup(data);
  const name = `formwise-${new Date().toISOString().slice(0, 10)}.json`;
  if (Platform.OS === 'web') {
    const url = URL.createObjectURL(new Blob([json], { type: 'application/json' }));
    const link = document.createElement('a');
    link.href = url;
    link.download = name;
    link.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    return;
  }
  const { File, Paths } = await import('expo-file-system');
  const Sharing = await import('expo-sharing');
  const file = new File(Paths.cache, name);
  file.write(json);
  if (!(await Sharing.isAvailableAsync()))
    throw new Error(
      'File sharing is unavailable on this device. Your data is still safe in the app.',
    );
  await Sharing.shareAsync(file.uri, {
    mimeType: 'application/json',
    dialogTitle: 'Save your Formwise backup',
    UTI: 'public.json',
  });
}
export async function chooseBackup(): Promise<AppData | null> {
  const Picker = await import('expo-document-picker');
  const result = await Picker.getDocumentAsync({
    type: ['application/json', 'text/plain'],
    copyToCacheDirectory: true,
  });
  if (result.canceled) return null;
  if ((result.assets[0].size ?? 0) > 25_000_000)
    throw new Error('Choose a backup smaller than 25 MB.');
  let raw: string;
  if (Platform.OS === 'web') raw = await (await fetch(result.assets[0].uri)).text();
  else {
    const { File } = await import('expo-file-system');
    const file = new File(result.assets[0].uri);
    if (file.size > 25_000_000) throw new Error('Choose a backup smaller than 25 MB.');
    raw = await file.text();
  }
  return parseBackup(raw);
}
