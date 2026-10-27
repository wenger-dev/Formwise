import { DatabaseSync } from 'node:sqlite';
import { Database } from '../db/repository';
export class TestDatabase implements Database {
  native: DatabaseSync;
  failOn: string | null = null;
  constructor(path = ':memory:') {
    this.native = new DatabaseSync(path);
  }
  async execAsync(sql: string) {
    this.native.exec(sql);
  }
  async runAsync(sql: string, ...params: (string | number | null)[]) {
    if (this.failOn && sql.includes(this.failOn)) throw new Error('Injected storage failure');
    return this.native.prepare(sql).run(...params);
  }
  async getAllAsync<T>(sql: string, ...params: (string | number | null)[]): Promise<T[]> {
    return this.native
      .prepare(sql)
      .all(...params)
      .map((row) => ({ ...row })) as T[];
  }
  async withTransactionAsync(task: () => Promise<void>) {
    this.native.exec('BEGIN');
    try {
      await task();
      this.native.exec('COMMIT');
    } catch (e) {
      this.native.exec('ROLLBACK');
      throw e;
    }
  }
}
