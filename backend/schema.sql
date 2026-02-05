-- Enable Foreign Keys
PRAGMA foreign_keys = ON;

-- Projects Table
CREATE TABLE IF NOT EXISTS projects (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    language TEXT,
    version TEXT DEFAULT 'v0.0.1',
    last_update DATETIME DEFAULT CURRENT_TIMESTAMP,
    status TEXT CHECK(status IN ('active', 'completed', 'archived')) DEFAULT 'active',
    repo_url TEXT,
    local_path TEXT,
    branch TEXT DEFAULT 'main'
);

-- Version Logs (History)
CREATE TABLE IF NOT EXISTS version_logs (
    id TEXT PRIMARY KEY,
    project_id TEXT NOT NULL,
    version TEXT NOT NULL,
    date DATETIME DEFAULT CURRENT_TIMESTAMP,
    title TEXT NOT NULL,
    description TEXT,
    type TEXT CHECK(type IN ('feature', 'bugfix', 'improvement', 'release')),
    changes TEXT, -- Stored as JSON Array
    FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE
);

-- Quick Notes
CREATE TABLE IF NOT EXISTS notes (
    id TEXT PRIMARY KEY,
    project_id TEXT, -- Can be NULL for global notes
    title TEXT,
    content TEXT NOT NULL,
    type TEXT CHECK(type IN ('idea', 'bug', 'todo')),
    status TEXT CHECK(status IN ('pending', 'in_progress', 'completed')) DEFAULT 'pending',
    reminder INTEGER DEFAULT 1,
    progress_logs TEXT DEFAULT '[]', -- Stored as JSON Array
    date DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE SET NULL
);

-- App Settings (Key-Value Store)
CREATE TABLE IF NOT EXISTS settings (
    key TEXT PRIMARY KEY,
    value TEXT NOT NULL
);

-- Seed initial settings if not exist
INSERT OR IGNORE INTO settings (key, value) VALUES ('streak', '0');
INSERT OR IGNORE INTO settings (key, value) VALUES ('inactivity_alert_days', '14');
