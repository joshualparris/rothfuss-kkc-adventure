import Database from 'better-sqlite3';
import os from 'os';
import path from 'path';

const dbPath = process.env.DB_PATH || path.join(os.tmpdir(), 'kkc-adventure.db');
const db = new Database(dbPath);

export default db;
