import * as cropsService from './cropService';
import * as activityService from './activityService';
import * as expenseService from './expenseService';
import * as earningService from './earningService';
import * as taskService from './taskService';
import * as reminderService from './reminderService';

/**
 * Escapes a string for CSV.
 */
function escapeCSV(str) {
  if (str == null) return '';
  const stringified = String(str);
  if (stringified.includes(',') || stringified.includes('"') || stringified.includes('\n')) {
    return `"${stringified.replace(/"/g, '""')}"`;
  }
  return stringified;
}

/**
 * Generates a CSV string representing all crop data and its related entities.
 * @param {object} db - Database handle
 * @param {object} options - Optional parameters
 * @param {() => boolean} [options.isCancelled] - Function that returns true if export should abort
 */
export async function generateCropDataCSV(db, options = {}) {
  const { isCancelled = () => false } = options;
  
  const checkCancellation = () => {
    if (isCancelled()) {
      throw new Error('EXPORT_CANCELLED');
    }
  };

  const crops = await cropsService.getAllCrops(db);
  checkCancellation();
  
  const headers = [
    'Record Type',
    'Crop Name',
    'Land Nickname',
    'Title/Item',
    'Date',
    'Amount',
    'Unit/Category',
    'Details/Variety',
    'Remark/Status',
    'Additional Info'
  ];

  const rows = [headers.join(',')];

  for (const crop of crops) {
    checkCancellation();
    // 1. Add Crop Record
    rows.push([
      'CROP',
      escapeCSV(crop.cropName),
      escapeCSV(crop.landNickname),
      '', // Title
      escapeCSV(crop.plantationDate),
      escapeCSV(crop.totalArea),
      escapeCSV(crop.areaUnit),
      escapeCSV(crop.seedVariety),
      '', // Remark
      escapeCSV(`Soil: ${crop.soilType || ''}, Prev: ${crop.previousCrop || ''}, Harvest: ${crop.expectedHarvestDate || ''}, OrigID: ${crop.id}`)
    ].join(','));

    // 2. Add Activities
    const activities = await activityService.getActivitiesByCrop(db, crop.id);
    for (const activity of activities) {
      rows.push([
        'ACTIVITY',
        escapeCSV(crop.cropName),
        '', // Land
        escapeCSV(activity.title),
        escapeCSV(activity.date),
        '', // Amount
        '', // Unit
        '', // Details
        escapeCSV(activity.remark),
        escapeCSV(`OrigCropID: ${crop.id}`)
      ].join(','));
    }

    // 3. Add Expenses
    const expenses = await expenseService.getExpensesByCrop(db, crop.id);
    for (const exp of expenses) {
      rows.push([
        'EXPENSE',
        escapeCSV(crop.cropName),
        '', // Land
        escapeCSV(exp.title),
        escapeCSV(exp.date),
        escapeCSV(exp.amount),
        '', // Unit
        '', // Details
        escapeCSV(exp.remark),
        escapeCSV(`OrigCropID: ${crop.id}`)
      ].join(','));
    }

    // 4. Add Earnings
    const earnings = await earningService.getEarningsByCrop(db, crop.id);
    for (const earn of earnings) {
      rows.push([
        'EARNING',
        escapeCSV(crop.cropName),
        '', // Land
        escapeCSV(earn.title),
        escapeCSV(earn.date),
        escapeCSV(earn.amount),
        '', // Unit
        '', // Details
        escapeCSV(earn.remark),
        escapeCSV(`OrigCropID: ${crop.id}`)
      ].join(','));
    }

    // 5. Add Tasks
    const tasks = await taskService.getTasksByCrop(db, crop.id);
    for (const task of tasks) {
      rows.push([
        'TASK',
        escapeCSV(crop.cropName),
        '', // Land
        escapeCSV(task.taskName),
        escapeCSV(task.startDate),
        '', // Amount
        escapeCSV(task.type),
        '', // Details
        '', // Remark
        escapeCSV(`End: ${task.endDate || ''}, Interval: ${task.repeatIntervalDays || 0}d, OrigCropID: ${crop.id}`)
      ].join(','));
    }

    // 6. Add Reminders
    const reminders = await reminderService.getRemindersByCrop(db, crop.id);
    for (const rem of reminders) {
      rows.push([
        'REMINDER',
        escapeCSV(crop.cropName),
        '', // Land
        escapeCSV(rem.details),
        escapeCSV(rem.reminderDate),
        '', // Amount
        '', // Unit
        '', // Details
        '', // Remark
        escapeCSV(`Time: ${rem.reminderTime || ''}, TaskID: ${rem.taskId || ''}, OrigCropID: ${crop.id}`)
      ].join(','));
    }
  }

  // Handle Standalone Tasks & Reminders (if any)
  checkCancellation();
  const standaloneTasks = await db.getAllAsync('SELECT * FROM tasks WHERE cropId IS NULL');
  for (const task of standaloneTasks) {
    rows.push([
      'TASK (Standalone)',
      '', // Crop Name
      '', // Land
      escapeCSV(task.taskName),
      escapeCSV(task.startDate),
      '', // Amount
      escapeCSV(task.type),
      '', // Details
      '', // Remark
      escapeCSV(`End: ${task.endDate || ''}, Interval: ${task.repeatIntervalDays || 0}d`)
    ].join(','));
  }

  const standaloneReminders = await db.getAllAsync('SELECT * FROM reminders WHERE cropId IS NULL');
  for (const rem of standaloneReminders) {
    rows.push([
      'REMINDER (Standalone)',
      '', // Crop Name
      '', // Land
      escapeCSV(rem.details),
      escapeCSV(rem.reminderDate),
      '', // Amount
      '', // Unit
      '', // Details
      '', // Remark
      escapeCSV(`Time: ${rem.reminderTime || ''}, TaskID: ${rem.taskId || ''}`)
    ].join(','));
  }

  return rows.join('\n');
}

