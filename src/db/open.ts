import * as SQLite from 'expo-sqlite';
import { Repository } from './repository';
export async function openRepository() {
  return new Repository(await SQLite.openDatabaseAsync('formwise.db'));
}
