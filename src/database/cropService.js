// ============================================================
// cropService — CRUD operations for the `crops` table
// ============================================================
// Every function receives the `db` handle as its first argument
// so it stays decoupled from React and is easy to test.
// ============================================================

/**
 * Formats a JS Date to ISO-8601 date string (YYYY-MM-DD).
 */
function toISODate(date) {
  if (!date) return null;
  if (typeof date === 'string') return date;
  return date.toISOString().split('T')[0];
}

/**
 * Insert a new crop record.
 * @returns {Promise<number>} The id of the newly inserted crop.
 */
export async function insertCrop(db, data) {
  const result = await db.runAsync(
    `INSERT INTO crops (landNickname, totalArea, areaUnit, cropName, plantationDate, seedVariety, soilType, expectedHarvestDate, previousCrop)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      data.landNickname,
      data.totalArea,
      data.areaUnit,
      data.cropName,
      toISODate(data.plantationDate),
      data.seedVariety || null,
      data.soilType || null,
      toISODate(data.expectedHarvestDate),
      data.previousCrop || null,
    ],
  );
  return result.lastInsertRowId;
}

/**
 * Fetch all crops ordered by most-recently created first.
 */
export async function getAllCrops(db) {
  return db.getAllAsync('SELECT * FROM crops ORDER BY id DESC');
}

/**
 * Fetch a single crop by id.
 */
export async function getCropById(db, id) {
  return db.getFirstAsync('SELECT * FROM crops WHERE id = ?', [id]);
}

/**
 * Delete a crop (cascading deletes all linked activities, expenses, etc.).
 */
export async function deleteCrop(db, id) {
  return db.runAsync('DELETE FROM crops WHERE id = ?', [id]);
}

/**
 * Update a crop's status ('active' or 'inactive').
 */
export async function updateCropStatus(db, id, status) {
  return db.runAsync('UPDATE crops SET status = ? WHERE id = ?', [status, id]);
}
