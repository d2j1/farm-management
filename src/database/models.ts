// ============================================================
// Farm Manager — TypeScript Models
// ============================================================
// These interfaces mirror the SQLite schema in schema.sql.
// All date strings use ISO-8601 format (YYYY-MM-DD).
// All time strings use 24-hour format (HH:MM).
// ============================================================

// ---- Enums -------------------------------------------------

/** Supported area measurement units. */
export enum AreaUnit {
  Acre    = 'Acre',
  Guntha  = 'Guntha',
  Hectare = 'Hectare',
  Bigha   = 'Bigha',
  SqFt    = 'SqFt',
}

/** Task scheduling types. */
export enum TaskType {
  OneTime   = 'one_time',
  MultiDay  = 'multi_day',
  Recurring = 'recurring',
}

// ---- Table Interfaces --------------------------------------

export interface Crop {
  id: number;
  landNickname: string;
  totalArea: number;
  areaUnit: AreaUnit;
  cropName: string;
  /** ISO-8601 date string (YYYY-MM-DD) */
  plantationDate: string;
  seedVariety: string | null;
  soilType: string | null;
  /** ISO-8601 date string (YYYY-MM-DD) */
  expectedHarvestDate: string | null;
  previousCrop: string | null;
}

export interface Activity {
  id: number;
  /** FK → crops.id  (NOT NULL) */
  cropId: number;
  title: string;
  remark: string | null;
  /** ISO-8601 date string (YYYY-MM-DD) */
  date: string;
}

export interface Expense {
  id: number;
  /** FK → crops.id  (NOT NULL) */
  cropId: number;
  title: string;
  remark: string | null;
  amount: number;
  /** ISO-8601 date string (YYYY-MM-DD) */
  date: string;
}

export interface Earning {
  id: number;
  /** FK → crops.id  (NOT NULL) */
  cropId: number;
  title: string;
  remark: string | null;
  amount: number;
  /** ISO-8601 date string (YYYY-MM-DD) */
  date: string;
}

export interface Task {
  id: number;
  /** FK → crops.id  (NULLABLE — allows standalone tasks) */
  cropId: number | null;
  taskName: string;
  type: TaskType;
  /** ISO-8601 date string (YYYY-MM-DD) */
  startDate: string;
  /** ISO-8601 date string (YYYY-MM-DD).  Nullable for one_time / recurring. */
  endDate: string | null;
  /** Number of days between recurrences.  0 = not recurring. */
  repeatIntervalDays: number;
}

export interface Reminder {
  id: number;
  /** FK → crops.id   (NULLABLE) */
  cropId: number | null;
  /** FK → tasks.id   (NULLABLE) */
  taskId: number | null;
  details: string;
  /** ISO-8601 date string (YYYY-MM-DD) */
  reminderDate: string;
  /** 24-hour time string (HH:MM) */
  reminderTime: string | null;
}
