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
    `SELECT t.*, c.cropName 
     FROM tasks t 
     LEFT JOIN crops c ON t.cropId = c.id 
     WHERE t.cropId = ? 
     ORDER BY t.startDate DESC`,
    [cropId],
  );
}

/**
 * Fetch all tasks (across all crops + standalone).
 */
export async function getAllTasks(db) {
  return db.getAllAsync(
    `SELECT t.*, c.cropName 
     FROM tasks t 
     LEFT JOIN crops c ON t.cropId = c.id 
     ORDER BY t.startDate DESC`
  );
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

/**
 * Returns an object mapping cropId → most recent past task for ALL crops.
 * Crops with no past task won't have an entry in the map.
 */
export async function getLastTaskPerCrop(db) {
  const today = new Date().toISOString().split('T')[0];
  const rows = await db.getAllAsync(
    `SELECT t.cropId, t.taskName, t.startDate
     FROM tasks t
     WHERE t.cropId IS NOT NULL
       AND t.startDate < ?
       AND t.startDate = (
         SELECT MAX(t2.startDate)
         FROM tasks t2
         WHERE t2.cropId = t.cropId AND t2.startDate < ?
       )`,
    [today, today],
  );
  const map = {};
  for (const row of rows) {
    if (!map[row.cropId]) map[row.cropId] = row;
  }
  return map;
}

/**
 * Returns an object mapping cropId → nearest upcoming task for ALL crops.
 * Crops with no upcoming task won't have an entry in the map.
 */
export async function getNextUpcomingTaskPerCrop(db) {
  const today = new Date().toISOString().split('T')[0];
  const rows = await db.getAllAsync(
    `SELECT t.cropId, t.taskName, t.startDate
     FROM tasks t
     WHERE t.cropId IS NOT NULL
       AND t.startDate >= ?
       AND t.startDate = (
         SELECT MIN(t2.startDate)
         FROM tasks t2
         WHERE t2.cropId = t.cropId AND t2.startDate >= ?
       )`,
    [today, today],
  );
  const map = {};
  for (const row of rows) {
    if (!map[row.cropId]) map[row.cropId] = row;
  }
  return map;
}
/**
 * Update an existing task.
 */
export async function updateTask(db, id, data) {
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

  return db.runAsync(
    `UPDATE tasks 
     SET taskName = ?, type = ?, startDate = ?, endDate = ?, repeatIntervalDays = ?
     WHERE id = ?`,
    [
      data.taskName,
      type,
      startDate,
      endDate,
      repeatIntervalDays,
      id,
    ],
  );
}
/**
 * Fetch unified tasks and reminders with pagination and optional filtering.
 */
export async function getPaginatedTasksAndReminders(db, { limit = 20, offset = 0, filter = 'all' }) {
  const today = new Date().toISOString().split('T')[0];

  let whereClause = '';
  const params = [];

  if (filter === 'dueToday') {
    whereClause = 'WHERE rawDate = ?';
    params.push(today, today); // One for task UNION, one for reminder UNION
  } else if (filter === 'upcoming') {
    whereClause = 'WHERE rawDate > ?';
    params.push(today, today);
  } else if (filter === 'general') {
    whereClause = 'WHERE cropId IS NULL';
  } else if (filter === 'cropRelated') {
    whereClause = 'WHERE cropId IS NOT NULL';
  }

  // Combined query using UNION ALL
  const query = `
    SELECT * FROM (
      SELECT 
        id, 
        cropId, 
        taskName as title, 
        startDate as rawDate, 
        type, 
        endDate, 
        'task' as kind,
        NULL as reminderTime
      FROM tasks
      UNION ALL
      SELECT 
        id, 
        cropId, 
        details as title, 
        reminderDate as rawDate, 
        NULL as type, 
        NULL as endDate, 
        'reminder' as kind,
        reminderTime
      FROM reminders
    ) 
    ${whereClause}
    ORDER BY rawDate DESC, id DESC, kind DESC
    LIMIT ? OFFSET ?
  `;

  // We need to double the params if we used today (one for each side of UNION)
  // But wait, the whereClause is applied to the WRAPPED query, so we only need it once.
  const finalParams = [];
  if (filter === 'dueToday' || filter === 'upcoming') {
    finalParams.push(today);
  }
  finalParams.push(limit, offset);

  // We also need crop name for tasks
  const rows = await db.getAllAsync(
    `SELECT combined.*, c.cropName 
     FROM (${query}) AS combined
     LEFT JOIN crops c ON combined.cropId = c.id
     ORDER BY combined.rawDate DESC, combined.id DESC, combined.kind DESC`,
    finalParams
  );

  return rows;
}
