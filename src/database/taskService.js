// ============================================================
// taskService — CRUD operations for the `tasks` table
// ============================================================

function toISODate(date) {
  if (!date) return null;
  if (typeof date === 'string') return date;
  return date.toISOString().split('T')[0];
}

/**
 * Map a UI duration string ('One-time' | 'Multi-day' | 'Recurring')
 * to the DB enum value ('one_time' | 'multi_day' | 'recurring').
 */
function mapDurationType(duration) {
  switch (duration) {
    case 'Multi-day':
      return 'multi_day';
    case 'Recurring':
      return 'recurring';
    case 'One-time':
    default:
      return 'one_time';
  }
}

/**
 * Insert a new task.
 * @returns {Promise<number>} The id of the newly inserted task.
 */
export async function insertTask(db, data) {
  const type = mapDurationType(data.duration);

  let startDate = null;
  let endDate = null;
  let repeatIntervalDays = 0;

  if (type === 'one_time') {
    startDate = toISODate(data.date);
  } else if (type === 'multi_day') {
    startDate = toISODate(data.startDate);
    endDate = toISODate(data.endDate);
  } else {
    // recurring
    startDate = toISODate(data.startDate);
    endDate = toISODate(data.endDate);
    repeatIntervalDays = data.repeatInterval || 0;
  }

  const result = await db.runAsync(
    `INSERT INTO tasks (cropId, taskName, type, startDate, endDate, repeatIntervalDays)
     VALUES (?, ?, ?, ?, ?, ?)`,
    [
      data.cropId ?? null,
      data.taskName,
      type,
      startDate,
      endDate,
      repeatIntervalDays,
    ],
  );
  return result.lastInsertRowId;
}

/**
 * Fetch all tasks for a given crop (or standalone tasks if cropId is null).
 */
export async function getTasksByCrop(db, cropId) {
  return db.getAllAsync(
    'SELECT * FROM tasks WHERE cropId = ? ORDER BY startDate DESC',
    [cropId],
  );
}

/**
 * Fetch all tasks (across all crops + standalone).
 */
export async function getAllTasks(db) {
  return db.getAllAsync('SELECT * FROM tasks ORDER BY startDate DESC');
}

/**
 * Delete a task by id.
 */
export async function deleteTask(db, id) {
  return db.runAsync('DELETE FROM tasks WHERE id = ?', [id]);
}

/**
 * Fetch the nearest upcoming task for a crop (startDate >= today), or null.
 */
export async function getUpcomingTaskByCrop(db, cropId) {
  const today = new Date().toISOString().split('T')[0];
  return db.getFirstAsync(
    'SELECT * FROM tasks WHERE cropId = ? AND startDate >= ? ORDER BY startDate ASC LIMIT 1',
    [cropId, today],
  );
}
