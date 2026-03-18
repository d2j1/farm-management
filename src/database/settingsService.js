import * as SQLite from 'expo-sqlite';

const DB_NAME = 'farmmanager.db';

/**
 * Fetches a setting from the database by key.
 */
export async function getSetting(key) {
  const db = await SQLite.openDatabaseAsync(DB_NAME);
  try {
    const result = await db.getFirstAsync('SELECT value FROM settings WHERE key = ?', [key]);
    return result ? result.value : null;
  } catch (error) {
    console.error(`Error fetching setting ${key}:`, error);
    return null;
  }
}

/**
 * Saves a setting to the database (insert or replace).
 */
export async function saveSetting(key, value) {
  const db = await SQLite.openDatabaseAsync(DB_NAME);
  try {
    await db.runAsync(
      'INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)',
      [key, String(value)]
    );
    return true;
  } catch (error) {
    console.error(`Error saving setting ${key}:`, error);
    return false;
  }
}
