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
 * Delete a crop and all related records in one transaction.
 *
 * NOTE:
 * The schema already uses ON DELETE CASCADE, but we explicitly
 * remove linked rows as a defensive fallback for older databases.
 */
export async function deleteCrop(db, id) {
  if (id == null) {
    throw new Error('Crop id is required for deletion.');
  }

  await db.execAsync('BEGIN IMMEDIATE TRANSACTION;');

  try {
    await db.runAsync(
      `DELETE FROM reminders
       WHERE cropId = ?
          OR taskId IN (SELECT id FROM tasks WHERE cropId = ?)`,
      [id, id],
    );
    await db.runAsync('DELETE FROM activities WHERE cropId = ?', [id]);
    await db.runAsync('DELETE FROM expenses WHERE cropId = ?', [id]);
    await db.runAsync('DELETE FROM earnings WHERE cropId = ?', [id]);
    await db.runAsync('DELETE FROM tasks WHERE cropId = ?', [id]);

    const result = await db.runAsync('DELETE FROM crops WHERE id = ?', [id]);
    if (!result?.changes) {
      throw new Error(`Crop ${id} does not exist.`);
    }
    await db.execAsync('COMMIT;');
    return result;
  } catch (error) {
    await db.execAsync('ROLLBACK;');
    throw error;
  }
}

/**
 * Update a crop's status ('active' or 'inactive').
 */
export async function updateCropStatus(db, id, status) {
  return db.runAsync('UPDATE crops SET status = ? WHERE id = ?', [status, id]);
}

/**
 * Update all editable fields of a crop record.
 */
export async function updateCrop(db, id, data) {
  return db.runAsync(
    `UPDATE crops
       SET landNickname = ?, totalArea = ?, areaUnit = ?, cropName = ?,
           plantationDate = ?, seedVariety = ?, soilType = ?,
           expectedHarvestDate = ?, previousCrop = ?
     WHERE id = ?`,
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
      id,
    ],
  );
}

