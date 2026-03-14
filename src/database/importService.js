import * as cropsService from './cropService';
import * as activityService from './activityService';
import * as expenseService from './expenseService';
import * as earningService from './earningService';
import * as taskService from './taskService';
import * as reminderService from './reminderService';

/**
 * Simple CSV parser that handles quoted strings and newlines in quotes.
 */
function parseCSV(csvString) {
  const result = [];
  let row = [];
  let cell = '';
  let inQuotes = false;

  for (let i = 0; i < csvString.length; i++) {
    const char = csvString[i];
    const nextChar = csvString[i + 1];

    if (inQuotes) {
      if (char === '"' && nextChar === '"') {
        cell += '"';
        i++; // skip next quote
      } else if (char === '"') {
        inQuotes = false;
      } else {
        cell += char;
      }
    } else {
      if (char === '"') {
        inQuotes = true;
      } else if (char === ',') {
        row.push(cell.trim());
        cell = '';
      } else if (char === '\n' || char === '\r') {
        if (cell !== '' || row.length > 0) {
          row.push(cell.trim());
          result.push(row);
        }
        row = [];
        cell = '';
        if (char === '\r' && nextChar === '\n') i++; // skip \n
      } else {
        cell += char;
      }
    }
  }

  if (cell !== '' || row.length > 0) {
    row.push(cell.trim());
    result.push(row);
  }

  return result;
}

/**
 * Imports farm data from a CSV string.
 * @param {object} db - Database handle
 * @param {string} csvString - The CSV content
 * @param {object} options - Optional parameters
 * @param {() => boolean} [options.isCancelled] - Function that returns true if import should abort
 * @param {(progress: number) => void} [options.onProgress] - Progress callback (0-100)
 */
export async function importFromCSV(db, csvString, options = {}) {
  const { isCancelled = () => false, onProgress = () => {} } = options;

  const checkCancellation = (rowIdx) => {
    if (isCancelled()) {
      console.log(`[importService] Cancellation detected at row ${rowIdx}. Aborting...`);
      throw new Error('IMPORT_CANCELLED');
    }
  };

  const lines = parseCSV(csvString);
  if (lines.length < 2) return;

  const headers = lines[0];
  const dataRows = lines.slice(1);
  const totalRows = dataRows.length;

  console.log(`[importService] Starting import of ${totalRows} rows within transaction...`);
  const cropIdMap = new Map();

  try {
    await db.withTransactionAsync(async () => {
      console.log('[importService] Transaction handle acquired.');
      for (let i = 0; i < totalRows; i++) {
        checkCancellation(i + 1);
        
        if (i % 10 === 0 || i === totalRows - 1) {
          onProgress(Math.round(((i + 1) / totalRows) * 100));
        }

        const row = dataRows[i];
        const recordType = row[0];
        const addInfo = row[9] || '';

        try {
          checkCancellation(i + 1);
          switch (recordType) {
            case 'CROP': {
              const cropData = {
                cropName: row[1],
                landNickname: row[2],
                plantationDate: row[4],
                totalArea: parseFloat(row[5]) || 0,
                areaUnit: row[6],
                seedVariety: row[7],
              };
              
              const soilMatch = addInfo.match(/Soil: ([^,]*)/);
              const prevMatch = addInfo.match(/Prev: ([^,]*)/);
              const harvestMatch = addInfo.match(/Harvest: ([^,]*)/);
              const origIdMatch = addInfo.match(/OrigID: (\d+)/);
              
              cropData.soilType = soilMatch ? soilMatch[1].trim() : '';
              cropData.previousCrop = prevMatch ? prevMatch[1].trim() : '';
              cropData.expectedHarvestDate = harvestMatch ? harvestMatch[1].trim() : '';
              cropData.status = 'active';

              const newCropId = await cropsService.insertCrop(db, cropData);
              if (origIdMatch) {
                cropIdMap.set(origIdMatch[1], newCropId);
              }
              break;
            }

            case 'ACTIVITY': {
              const cropIdMatch = addInfo.match(/OrigCropID: (\d+)/);
              const cropId = cropIdMatch ? cropIdMap.get(cropIdMatch[1]) : null;
              if (cropId) {
                await activityService.insertActivity(db, {
                  cropId,
                  title: row[3],
                  date: row[4],
                  remark: row[8]
                });
              }
              break;
            }

            case 'EXPENSE': {
              const cropIdMatch = addInfo.match(/OrigCropID: (\d+)/);
              const cropId = cropIdMatch ? cropIdMap.get(cropIdMatch[1]) : null;
              if (cropId) {
                await expenseService.insertExpense(db, {
                  cropId,
                  title: row[3],
                  date: row[4],
                  amount: parseFloat(row[5]) || 0,
                  remark: row[8]
                });
              }
              break;
            }

            case 'EARNING': {
              const cropIdMatch = addInfo.match(/OrigCropID: (\d+)/);
              const cropId = cropIdMatch ? cropIdMap.get(cropIdMatch[1]) : null;
              if (cropId) {
                await earningService.insertEarning(db, {
                  cropId,
                  title: row[3],
                  date: row[4],
                  amount: parseFloat(row[5]) || 0,
                  remark: row[8]
                });
              }
              break;
            }

            case 'TASK':
            case 'TASK (Standalone)': {
              const cropIdMatch = addInfo.match(/OrigCropID: (\d+)/);
              const cropId = (recordType === 'TASK' && cropIdMatch) ? cropIdMap.get(cropIdMatch[1]) : null;
              const endMatch = addInfo.match(/End: ([^,]*)/);
              const intervalMatch = addInfo.match(/Interval: (\d+)d/);

              await taskService.insertTask(db, {
                cropId,
                taskName: row[3],
                startDate: row[4],
                date: row[4],
                endDate: endMatch ? endMatch[1].trim() : '',
                duration: row[6], 
                repeatInterval: intervalMatch ? parseInt(intervalMatch[1]) : 0,
                status: 'pending'
              });
              break;
            }

            case 'REMINDER':
            case 'REMINDER (Standalone)': {
              const cropIdMatch = addInfo.match(/OrigCropID: (\d+)/);
              const cropId = (recordType === 'REMINDER' && cropIdMatch) ? cropIdMap.get(cropIdMatch[1]) : null;
              const timeMatch = addInfo.match(/Time: ([^,]*)/);

              await reminderService.insertReminder(db, {
                cropId,
                details: row[3],
                reminderDate: row[4],
                date: row[4],
                reminderTime: timeMatch ? timeMatch[1].trim() : '',
                time: timeMatch ? timeMatch[1].trim() : ''
              });
              break;
            }
          }
        } catch (err) {
          if (err.message === 'IMPORT_CANCELLED') throw err; 
          console.warn(`[importService] Error importing row ${i + 1}:`, err);
        }
      }
      console.log('[importService] All rows processed successfully. Committing transaction...');
    });
    console.log('[importService] Transaction committed successfully.');
  } catch (err) {
    if (err.message === 'IMPORT_CANCELLED') {
      console.log('[importService] Import was cancelled. Transaction has been rolled back.');
      throw err;
    }
    console.error('[importService] Database transaction failed:', err);
    throw err;
  }
}

/**
 * findCropIdByName is no longer needed for new clean imports
 */

