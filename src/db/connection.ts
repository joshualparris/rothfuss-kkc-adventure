import Database from 'better-sqlite3';

const dbPath = process.env.DB_PATH;

if (!dbPath) {
  throw new Error('DB_PATH is not set. Define DB_PATH before opening the database.');
}

const db = new Database(dbPath);

export default db;
