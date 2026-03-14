// ============================================================
// Farm Manager — Database Initializer  (expo-sqlite)
// ============================================================
// Call `initDatabase()` once at app start (e.g. in App.js or a
// root provider) to create / migrate all tables.
// ============================================================

import * as SQLite from 'expo-sqlite';

const DB_NAME = 'farmmanager.db';

/**
 * Opens (or creates) the local SQLite database and ensures
 * every table exists.  Safe to call on every app launch —
 * `CREATE TABLE IF NOT EXISTS` prevents duplicates.
 */
export async function initDatabase(): Promise<SQLite.SQLiteDatabase> {
  const db = await SQLite.openDatabaseAsync(DB_NAME);

  // Enable foreign-key enforcement (required per-connection in SQLite)
  await db.execAsync('PRAGMA foreign_keys = ON;');

  // ── Crops ──────────────────────────────────────────────────
  await db.execAsync(`
    CREATE TABLE IF NOT EXISTS crops (
      id                  INTEGER PRIMARY KEY AUTOINCREMENT,
      landNickname        TEXT    NOT NULL,
      totalArea           REAL    NOT NULL,
      areaUnit            TEXT    NOT NULL CHECK (areaUnit IN ('Acre','Guntha','Hectare','Bigha','SqFt')),
      cropName            TEXT    NOT NULL,
      plantationDate      TEXT    NOT NULL,
      seedVariety         TEXT,
      soilType            TEXT,
      expectedHarvestDate TEXT,
      previousCrop        TEXT,
      status              TEXT    NOT NULL DEFAULT 'active' CHECK (status IN ('active','inactive'))
    );
  `);

  // Migration: add status column to existing crops tables that don't have it
  try {
    await db.execAsync(`ALTER TABLE crops ADD COLUMN status TEXT NOT NULL DEFAULT 'active';`);
  } catch (_) {
    // Column already exists — safe to ignore
  }

  // ── Activities ─────────────────────────────────────────────
  await db.execAsync(`
    CREATE TABLE IF NOT EXISTS activities (
      id      INTEGER PRIMARY KEY AUTOINCREMENT,
      cropId  INTEGER REFERENCES crops(id) ON DELETE CASCADE,
      title   TEXT    NOT NULL,
      remark  TEXT,
      date    TEXT    NOT NULL
    );
  `);

  // Migration: Allow NULL cropId in activities (transition from older schema)
  const activitiesInfo = await db.getAllAsync<any>(`PRAGMA table_info(activities);`);
  const cropIdActivityCol = activitiesInfo.find((c: any) => c.name === 'cropId');
  if (cropIdActivityCol && cropIdActivityCol.notnull === 1) {
    console.log('Migrating activities table to allow NULL cropId...');
    try {
      await db.execAsync(`
        PRAGMA foreign_keys = OFF;
        CREATE TABLE activities_new (
          id      INTEGER PRIMARY KEY AUTOINCREMENT,
          cropId  INTEGER REFERENCES crops(id) ON DELETE CASCADE,
          title   TEXT    NOT NULL,
          remark  TEXT,
          date    TEXT    NOT NULL
        );
        INSERT INTO activities_new (id, cropId, title, remark, date)
        SELECT id, cropId, title, remark, date FROM activities;
        DROP TABLE activities;
        ALTER TABLE activities_new RENAME TO activities;
        PRAGMA foreign_keys = ON;
      `);
      console.log('Activities migration complete.');
    } catch (e) {
      console.error('Failed to migrate activities table:', e);
    }
  }

  // ── Expenses ───────────────────────────────────────────────
  await db.execAsync(`
    CREATE TABLE IF NOT EXISTS expenses (
      id      INTEGER PRIMARY KEY AUTOINCREMENT,
      cropId  INTEGER NOT NULL REFERENCES crops(id) ON DELETE CASCADE,
      title   TEXT    NOT NULL,
      remark  TEXT,
      amount  REAL    NOT NULL DEFAULT 0,
      date    TEXT    NOT NULL
    );
  `);

  // ── Earnings ───────────────────────────────────────────────
  await db.execAsync(`
    CREATE TABLE IF NOT EXISTS earnings (
      id      INTEGER PRIMARY KEY AUTOINCREMENT,
      cropId  INTEGER NOT NULL REFERENCES crops(id) ON DELETE CASCADE,
      title   TEXT    NOT NULL,
      remark  TEXT,
      amount  REAL    NOT NULL DEFAULT 0,
      date    TEXT    NOT NULL
    );
  `);

  // ── Tasks ──────────────────────────────────────────────────
  await db.execAsync(`
    CREATE TABLE IF NOT EXISTS tasks (
      id                  INTEGER PRIMARY KEY AUTOINCREMENT,
      cropId              INTEGER REFERENCES crops(id) ON DELETE CASCADE,
      taskName            TEXT    NOT NULL,
      type                TEXT    NOT NULL CHECK (type IN ('one_time','multi_day','recurring')),
      startDate           TEXT    NOT NULL,
      endDate             TEXT,
      repeatIntervalDays  INTEGER DEFAULT 0
    );
  `);

  // ── Reminders ──────────────────────────────────────────────
  await db.execAsync(`
    CREATE TABLE IF NOT EXISTS reminders (
      id            INTEGER PRIMARY KEY AUTOINCREMENT,
      cropId        INTEGER REFERENCES crops(id) ON DELETE CASCADE,
      taskId        INTEGER REFERENCES tasks(id) ON DELETE CASCADE,
      details       TEXT    NOT NULL,
      reminderDate  TEXT    NOT NULL,
      reminderTime  TEXT
    );
  `);

  // ── User Profile ────────────────────────────────────────────
  await db.execAsync(`
    CREATE TABLE IF NOT EXISTS user_profile (
      id            INTEGER PRIMARY KEY CHECK (id = 1),
      fullName      TEXT,
      villageName   TEXT,
      totalAcreage  REAL,
      activeCrops   TEXT
    );
  `);

  return db;
}

