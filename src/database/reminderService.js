// ============================================================
// reminderService — CRUD operations for the `reminders` table
// ============================================================

function toISODate(date) {
  if (!date) return null;
  if (typeof date === 'string') return date;
  return date.toISOString().split('T')[0];
}

function toTimeString(date) {
  if (!date) return null;
  if (typeof date === 'string') return date;
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  return `${hours}:${minutes}`;
}

/**
 * Insert a new reminder.
 * @returns {Promise<number>} The id of the newly inserted reminder.
 */
export async function insertReminder(db, data) {
  const result = await db.runAsync(
    `INSERT INTO reminders (cropId, taskId, details, reminderDate, reminderTime)
     VALUES (?, ?, ?, ?, ?)`,
    [
      data.cropId ?? null,
      data.taskId ?? null,
      data.details,
      toISODate(data.date || data.reminderDate),
      toTimeString(data.time || data.reminderTime),
    ],
  );
  return result.lastInsertRowId;
}

/**
 * Fetch all reminders for a given crop.
 */
export async function getRemindersByCrop(db, cropId) {
  return db.getAllAsync(
    'SELECT * FROM reminders WHERE cropId = ? ORDER BY reminderDate DESC',
    [cropId],
  );
}

/**
 * Fetch all reminders (across all crops + standalone).
 */
export async function getAllReminders(db) {
  return db.getAllAsync('SELECT * FROM reminders ORDER BY reminderDate DESC');
}

/**
 * Delete a reminder by id.
 */
export async function deleteReminder(db, id) {
  return db.runAsync('DELETE FROM reminders WHERE id = ?', [id]);
}

