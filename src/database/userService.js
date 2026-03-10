import * as SQLite from 'expo-sqlite';

const DB_NAME = 'farmmanager.db';

/**
 * Fetches the user profile from the database.
 * Assumes a single profile record with ID = 1.
 */
export async function getUserProfile() {
  const db = await SQLite.openDatabaseAsync(DB_NAME);
  try {
    const profile = await db.getFirstAsync('SELECT * FROM user_profile WHERE id = 1');
    return profile;
  } catch (error) {
    console.error('Error fetching user profile:', error);
    return null;
  }
}

/**
 * Saves or updates the user profile in the database.
 */
export async function saveUserProfile(data) {
  const db = await SQLite.openDatabaseAsync(DB_NAME);
  const { fullName, villageName, totalAcreage, activeCrops } = data;

  try {
    await db.runAsync(
      `INSERT OR REPLACE INTO user_profile (id, fullName, villageName, totalAcreage, activeCrops)
       VALUES (1, ?, ?, ?, ?)`,
      [fullName, villageName, totalAcreage, activeCrops]
    );
    return true;
  } catch (error) {
    console.error('Error saving user profile:', error);
    return false;
  }
}
