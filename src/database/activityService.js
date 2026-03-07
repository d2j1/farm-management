// ============================================================
// activityService — CRUD operations for the `activities` table
// ============================================================

function toISODate(date) {
  if (!date) return null;
  if (typeof date === 'string') return date;
  return date.toISOString().split('T')[0];
}

/**
 * Insert a new activity log.
 * @returns {Promise<number>} The id of the newly inserted activity.
 */
export async function insertActivity(db, data) {
  const result = await db.runAsync(
    `INSERT INTO activities (cropId, title, remark, date)
     VALUES (?, ?, ?, ?)`,
    [
      data.cropId,
      data.title,
      data.remark || null,
      toISODate(data.date),
    ],
  );
  return result.lastInsertRowId;
}

/**
 * Fetch all activities for a given crop, most recent first.
 */
export async function getActivitiesByCrop(db, cropId) {
  return db.getAllAsync(
    'SELECT * FROM activities WHERE cropId = ? ORDER BY date DESC, id DESC',
    [cropId],
  );
}

/**
 * Delete an activity by id.
 */
export async function deleteActivity(db, id) {
  return db.runAsync('DELETE FROM activities WHERE id = ?', [id]);
}

/**
 * Fetch the most recent activity for a given crop (or null if none).
 */
export async function getLatestActivityByCrop(db, cropId) {
  return db.getFirstAsync(
    'SELECT * FROM activities WHERE cropId = ? ORDER BY date DESC, id DESC LIMIT 1',
    [cropId],
  );
}
