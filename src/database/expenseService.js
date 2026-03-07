// ============================================================
// expenseService — CRUD operations for the `expenses` table
// ============================================================

function toISODate(date) {
  if (!date) return null;
  if (typeof date === 'string') return date;
  return date.toISOString().split('T')[0];
}

/**
 * Insert a new expense.
 * @returns {Promise<number>} The id of the newly inserted expense.
 */
export async function insertExpense(db, data) {
  const result = await db.runAsync(
    `INSERT INTO expenses (cropId, title, remark, amount, date)
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
 * Fetch all expenses for a given crop, most recent first.
 */
export async function getExpensesByCrop(db, cropId) {
  return db.getAllAsync(
    'SELECT * FROM expenses WHERE cropId = ? ORDER BY date DESC, id DESC',
    [cropId],
  );
}

/**
 * Delete an expense by id.
 */
export async function deleteExpense(db, id) {
  return db.runAsync('DELETE FROM expenses WHERE id = ?', [id]);
}

/**
 * Get the total expense amount for a crop.
 */
export async function getTotalExpensesByCrop(db, cropId) {
  const row = await db.getFirstAsync(
    'SELECT COALESCE(SUM(amount), 0) as total FROM expenses WHERE cropId = ?',
    [cropId],
  );
  return row?.total ?? 0;
}
