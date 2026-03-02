import * as SQLite from 'expo-sqlite';

let db = null;

export const getDb = async () => {
  if (db) return db;
  db = await SQLite.openDatabaseAsync('farmer_app_v2.db'); // Changed DB name to start fresh
  return db;
};

export const initDB = async () => {
  try {
    const database = await getDb();

    await database.execAsync(`
      PRAGMA journal_mode = WAL;
      CREATE TABLE IF NOT EXISTS profile (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        village TEXT,
        acreage REAL,
        crops TEXT
      );
      CREATE TABLE IF NOT EXISTS crops (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        land_identifier TEXT NOT NULL,
        total_area REAL NOT NULL,
        area_unit TEXT NOT NULL,
        crop_name TEXT NOT NULL,
        sowing_date TEXT NOT NULL,
        variety TEXT,
        soil_type TEXT,
        expected_harvest_date TEXT,
        previous_crop TEXT
      );
      CREATE TABLE IF NOT EXISTS activities (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        crop_id INTEGER NOT NULL,
        activity_type TEXT NOT NULL,
        date TEXT NOT NULL,
        notes TEXT,
        photo TEXT,
        FOREIGN KEY (crop_id) REFERENCES crops(id) ON DELETE CASCADE
      );
      CREATE TABLE IF NOT EXISTS expenses (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        crop_id INTEGER NOT NULL,
        category TEXT NOT NULL,
        amount REAL NOT NULL,
        payment_mode TEXT,
        date TEXT NOT NULL,
        remarks TEXT,
        FOREIGN KEY (crop_id) REFERENCES crops(id) ON DELETE CASCADE
      );
      CREATE TABLE IF NOT EXISTS earnings (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        crop_id INTEGER NOT NULL,
        category TEXT NOT NULL,
        amount REAL NOT NULL,
        payment_mode TEXT,
        date TEXT NOT NULL,
        remarks TEXT,
        FOREIGN KEY (crop_id) REFERENCES crops(id) ON DELETE CASCADE
      );
    `);



    console.log('Database initialized successfully for Crop-Centric architecture');
  } catch (error) {
    console.error('Error initializing database:', error);
  }
};
