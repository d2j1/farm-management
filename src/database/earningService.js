// ============================================================
// earningService — CRUD operations for the `earnings` table
// ============================================================

function toISODate(date) {
  if (!date) return null;
  if (typeof date === 'string') return date;
  return date.toISOString().split('T')[0];
}

/**
 * Insert a new earning.
 * @returns {Promise<number>} The id of the newly inserted earning.
 */
export async function insertEarning(db, data) {
  const result = await db.runAsync(
    `INSERT INTO earnings (cropId, title, remark, amount, date)
     VALUES (?, ?, ?, ?, ?)`,
    [
      data.cropId,
      data.title,
      data.remark || null,
      data.amount || 0,
      toISODate(data.date),
    ],
  );
  return result.lastInsertRowId;
}

/**
 * Fetch all earnings for a given crop, most recent first.
 */
export async function getEarningsByCrop(db, cropId) {
  return db.getAllAsync(
    'SELECT * FROM earnings WHERE cropId = ? ORDER BY date DESC, id DESC',
    [cropId],
  );
}

/**
 * Update an existing earning by id.
 */
export async function updateEarning(db, id, data) {
  return db.runAsync(
    `UPDATE earnings SET title = ?, remark = ?, amount = ?, date = ? WHERE id = ?`,
    [
      data.title,
      data.remark || null,
      data.amount || 0,
      toISODate(data.date),
      id,
    ],
  );
}

/**
 * Delete an earning by id.
 */
export async function deleteEarning(db, id) {
  return db.runAsync('DELETE FROM earnings WHERE id = ?', [id]);
}

/**
 * Get the total earning amount for a crop.
 */
export async function getTotalEarningsByCrop(db, cropId) {
  const row = await db.getFirstAsync(
    'SELECT COALESCE(SUM(amount), 0) as total FROM earnings WHERE cropId = ?',
    [cropId],
  );
  return row?.total ?? 0;
}

