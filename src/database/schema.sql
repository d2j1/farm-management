-- ============================================================
-- Farm Manager — SQLite Schema
-- ============================================================
-- IMPORTANT: Run this PRAGMA every time a new connection is
-- opened so that ON DELETE CASCADE constraints actually fire.
-- ============================================================

PRAGMA foreign_keys = ON;

-- -----------------------------------------------------------
-- 1. Crops
-- -----------------------------------------------------------
CREATE TABLE IF NOT EXISTS crops (
    id                  INTEGER PRIMARY KEY AUTOINCREMENT,
    landNickname        TEXT    NOT NULL,
    totalArea           REAL    NOT NULL,
    areaUnit            TEXT    NOT NULL CHECK (areaUnit IN ('Acre', 'Guntha', 'Hectare', 'Bigha', 'SqFt')),
    cropName            TEXT    NOT NULL,
    plantationDate      TEXT    NOT NULL,   -- ISO-8601  YYYY-MM-DD
    seedVariety         TEXT,
    soilType            TEXT,
    expectedHarvestDate TEXT,               -- ISO-8601  YYYY-MM-DD
    previousCrop        TEXT
);

-- -----------------------------------------------------------
-- 2. Activities  (always tied to a crop)
-- -----------------------------------------------------------
CREATE TABLE IF NOT EXISTS activities (
    id      INTEGER PRIMARY KEY AUTOINCREMENT,
    cropId  INTEGER REFERENCES crops(id) ON DELETE CASCADE,
    title   TEXT    NOT NULL,
    remark  TEXT,
    date    TEXT    NOT NULL   -- ISO-8601  YYYY-MM-DD
);

-- -----------------------------------------------------------
-- 3. Expenses  (always tied to a crop)
-- -----------------------------------------------------------
CREATE TABLE IF NOT EXISTS expenses (
    id      INTEGER PRIMARY KEY AUTOINCREMENT,
    cropId  INTEGER NOT NULL REFERENCES crops(id) ON DELETE CASCADE,
    title   TEXT    NOT NULL,
    remark  TEXT,
    amount  REAL    NOT NULL DEFAULT 0,
    date    TEXT    NOT NULL   -- ISO-8601  YYYY-MM-DD
);

-- -----------------------------------------------------------
-- 4. Earnings  (always tied to a crop)
-- -----------------------------------------------------------
CREATE TABLE IF NOT EXISTS earnings (
    id      INTEGER PRIMARY KEY AUTOINCREMENT,
    cropId  INTEGER NOT NULL REFERENCES crops(id) ON DELETE CASCADE,
    title   TEXT    NOT NULL,
    remark  TEXT,
    amount  REAL    NOT NULL DEFAULT 0,
    date    TEXT    NOT NULL   -- ISO-8601  YYYY-MM-DD
);

-- -----------------------------------------------------------
-- 5. Tasks  (optionally tied to a crop — standalone allowed)
-- -----------------------------------------------------------
CREATE TABLE IF NOT EXISTS tasks (
    id                  INTEGER PRIMARY KEY AUTOINCREMENT,
    cropId              INTEGER REFERENCES crops(id) ON DELETE CASCADE,   -- NULLABLE
    taskName            TEXT    NOT NULL,
    type                TEXT    NOT NULL CHECK (type IN ('one_time', 'multi_day', 'recurring')),
    startDate           TEXT    NOT NULL,   -- ISO-8601  YYYY-MM-DD
    endDate             TEXT,               -- ISO-8601  YYYY-MM-DD  (nullable for one_time / recurring)
    repeatIntervalDays  INTEGER DEFAULT 0   -- used only when type = 'recurring'
);

-- -----------------------------------------------------------
-- 6. Reminders  (optionally tied to a crop and/or task)
-- -----------------------------------------------------------
CREATE TABLE IF NOT EXISTS reminders (
    id            INTEGER PRIMARY KEY AUTOINCREMENT,
    cropId        INTEGER REFERENCES crops(id) ON DELETE CASCADE,    -- NULLABLE
    taskId        INTEGER REFERENCES tasks(id) ON DELETE CASCADE,    -- NULLABLE
    details       TEXT    NOT NULL,
    reminderDate  TEXT    NOT NULL,   -- ISO-8601  YYYY-MM-DD
    reminderTime  TEXT               -- HH:MM  (24-hr)
);
