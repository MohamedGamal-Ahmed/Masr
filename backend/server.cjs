const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const { v4: uuidv4 } = require('uuid');

const app = express();
const PORT = 3004;
const DB_PATH = path.join(__dirname, '..', 'devlog.db');
const SCHEMA_PATH = path.join(__dirname, 'schema.sql');

// Middleware
app.use(cors());
app.use(express.json());

// Database Initialization
const db = new sqlite3.Database(DB_PATH, (err) => {
  if (err) {
    console.error('Error opening database:', err.message);
  } else {
    console.log('Connected to the SQLite database.');
    initDb();
  }
});

function initDb() {
  const schema = fs.readFileSync(SCHEMA_PATH, 'utf8');
  db.exec(schema, (err) => {
    if (err) console.error('Schema initialization failed:', err);
    else {
      console.log('Database schema ensured.');
      // Check if columns exist and add them if not (Migration)
      db.all("PRAGMA table_info(notes)", (err, columns) => {
        if (!err) {
          const columnNames = columns.map(c => c.name);
          if (!columnNames.includes('status')) {
            db.run("ALTER TABLE notes ADD COLUMN status TEXT CHECK(status IN ('pending', 'in_progress', 'completed')) DEFAULT 'pending'");
          }
          if (!columnNames.includes('reminder')) {
            db.run("ALTER TABLE notes ADD COLUMN reminder INTEGER DEFAULT 1");
          }
          if (!columnNames.includes('progress_logs')) {
            db.run("ALTER TABLE notes ADD COLUMN progress_logs TEXT DEFAULT '[]'");
          }
        }
      });
    }
  });
}

// --- Helper: Promisify Database Operations ---
const dbRun = (sql, params = []) => {
  return new Promise((resolve, reject) => {
    db.run(sql, params, function (err) {
      if (err) reject(err);
      else resolve(this);
    });
  });
};

const dbGet = (sql, params = []) => {
  return new Promise((resolve, reject) => {
    db.get(sql, params, (err, row) => {
      if (err) reject(err);
      else resolve(row);
    });
  });
};

const dbAll = (sql, params = []) => {
  return new Promise((resolve, reject) => {
    db.all(sql, params, (err, rows) => {
      if (err) reject(err);
      else resolve(rows);
    });
  });
};

// --- API Endpoints ---

// 1. Projects CRUD
app.get('/api/projects', async (req, res) => {
  try {
    const projects = await dbAll("SELECT * FROM projects ORDER BY last_update DESC");
    res.json(projects);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/projects/:id', async (req, res) => {
  try {
    const project = await dbGet("SELECT * FROM projects WHERE id = ?", [req.params.id]);
    if (!project) return res.status(404).json({ error: "Project not found" });
    res.json(project);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/projects', async (req, res) => {
  const { name, description, language, version, repoUrl, localPath, branch } = req.body;

  // Validation
  if (!name || name.length < 2) return res.status(400).json({ error: 'Name is required (min 2 chars)' });
  if (!language) return res.status(400).json({ error: 'Language is required' });
  if (!version || !/^v\d+\.\d+\.\d+$/.test(version)) return res.status(400).json({ error: 'Invalid version format (e.g. v1.0.0)' });

  const id = uuidv4();
  try {
    await dbRun(
      "INSERT INTO projects (id, name, description, language, version, repo_url, local_path, branch) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
      [id, name, description, language, version, repoUrl, localPath, branch || 'main']
    );
    const newProject = await dbGet("SELECT * FROM projects WHERE id = ?", [id]);
    res.status(201).json(newProject);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

app.put('/api/projects/:id', async (req, res) => {
  try {
    // Get current project first
    const current = await dbGet("SELECT * FROM projects WHERE id = ?", [req.params.id]);
    if (!current) return res.status(404).json({ error: "Project not found" });

    // Merge with incoming data (partial update support)
    const {
      name = current.name,
      description = current.description,
      language = current.language,
      version = current.version,
      status = current.status,
      repoUrl = current.repo_url,
      localPath = current.local_path,
      branch = current.branch
    } = req.body;

    const sql = `UPDATE projects SET name = ?, description = ?, language = ?, version = ?, status = ?, repo_url = ?, local_path = ?, branch = ?, last_update = CURRENT_TIMESTAMP WHERE id = ?`;

    await dbRun(sql, [name, description, language, version, status, repoUrl, localPath, branch, req.params.id]);
    const updated = await dbGet("SELECT * FROM projects WHERE id = ?", [req.params.id]);
    res.json(updated);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

app.delete('/api/projects/:id', async (req, res) => {
  const { id } = req.params;
  try {
    // Start transaction or just run multiple deletes
    await dbRun("BEGIN TRANSACTION");
    await dbRun("DELETE FROM projects WHERE id = ?", [id]);
    await dbRun("DELETE FROM notes WHERE project_id = ?", [id]);
    await dbRun("DELETE FROM version_logs WHERE project_id = ?", [id]);
    await dbRun("COMMIT");
    res.json({ success: true, message: "Project and associated data deleted" });
  } catch (err) {
    await dbRun("ROLLBACK");
    res.status(500).json({ error: err.message });
  }
});

// 2. Version Logs
app.get('/api/logs', async (req, res) => {
  // Optional query param ?projectId=...
  const { projectId } = req.query;
  try {
    let sql = "SELECT * FROM version_logs";
    let params = [];
    if (projectId) {
      sql += " WHERE project_id = ?";
      params.push(projectId);
    }
    sql += " ORDER BY date DESC";

    const logs = await dbAll(sql, params);
    // Parse JSON string changes back to array
    const parsedLogs = logs.map(log => ({
      ...log,
      changes: JSON.parse(log.changes || '[]')
    }));
    res.json(parsedLogs);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/logs', async (req, res) => {
  const { projectId, version, title, description, type, changes } = req.body;
  const id = uuidv4();
  const changesJson = JSON.stringify(changes || []);

  try {
    await dbRun(
      "INSERT INTO version_logs (id, project_id, version, title, description, type, changes) VALUES (?, ?, ?, ?, ?, ?, ?)",
      [id, projectId, version, title, description, type, changesJson]
    );
    // Update project version and last_update automatically
    await dbRun("UPDATE projects SET version = ?, last_update = CURRENT_TIMESTAMP WHERE id = ?", [version, projectId]);

    const newLog = await dbGet("SELECT * FROM version_logs WHERE id = ?", [id]);
    res.status(201).json({ ...newLog, changes: JSON.parse(newLog.changes) });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// 3. Notes
app.get('/api/notes', async (req, res) => {
  try {
    const notes = await dbAll("SELECT * FROM notes ORDER BY date DESC");
    res.json(notes);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/notes', async (req, res) => {
  const { projectId, title, content, type, status, reminder } = req.body;

  // Basic Validation
  if (!content || content.trim().length < 3) {
    return res.status(400).json({ error: 'Content is required and must be at least 3 characters' });
  }
  if (!['idea', 'bug', 'todo'].includes(type)) {
    return res.status(400).json({ error: 'Invalid note type' });
  }

  const id = uuidv4();
  try {
    await dbRun(
      "INSERT INTO notes (id, project_id, title, content, type, status, reminder) VALUES (?, ?, ?, ?, ?, ?, ?)",
      [id, projectId === 'general' ? null : projectId, title, content, type, status || 'pending', reminder !== undefined ? (reminder ? 1 : 0) : 1]
    );
    const newNote = await dbGet("SELECT * FROM notes WHERE id = ?", [id]);
    res.status(201).json(newNote);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

app.put('/api/notes/:id', async (req, res) => {
  const { id } = req.params;
  const updates = req.body;
  try {
    const current = await dbGet("SELECT * FROM notes WHERE id = ?", [id]);
    if (!current) return res.status(404).json({ error: "Note not found" });

    const merged = {
      projectId: updates.projectId !== undefined ? updates.projectId : current.project_id,
      title: updates.title !== undefined ? updates.title : current.title,
      content: updates.content !== undefined ? updates.content : current.content,
      type: updates.type !== undefined ? updates.type : current.type,
      status: updates.status !== undefined ? updates.status : current.status,
      reminder: updates.reminder !== undefined ? (updates.reminder ? 1 : 0) : current.reminder,
      progress_logs: updates.progressLogs !== undefined ? JSON.stringify(updates.progressLogs) : current.progress_logs
    };

    await dbRun(
      "UPDATE notes SET project_id = ?, title = ?, content = ?, type = ?, status = ?, reminder = ?, progress_logs = ? WHERE id = ?",
      [merged.projectId, merged.title, merged.content, merged.type, merged.status, merged.reminder, merged.progress_logs, id]
    );

    const updated = await dbGet("SELECT * FROM notes WHERE id = ?", [id]);
    res.json(updated);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

app.get('/api/backup/export', (req, res) => {
  try {
    if (fs.existsSync(DB_PATH)) {
      res.download(DB_PATH, 'masar_backup.db');
    } else {
      res.status(404).json({ error: 'Database file not found' });
    }
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 4. Settings & Stats
app.get('/api/settings', async (req, res) => {
  try {
    const rows = await dbAll("SELECT * FROM settings");
    const settings = rows.reduce((acc, row) => ({ ...acc, [row.key]: row.value }), {});
    res.json(settings);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/settings', async (req, res) => {
  const { key, value } = req.body;
  try {
    await dbRun("INSERT INTO settings (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value", [key, value]);
    res.json({ success: true, key, value });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Stats Endpoint
app.get('/api/stats/dashboard', async (req, res) => {
  try {
    const projectCount = await dbGet("SELECT COUNT(*) as count FROM projects WHERE status='active'");
    const streak = await dbGet("SELECT value FROM settings WHERE key='streak'");

    // Language Distribution
    const languages = await dbAll(`
      SELECT language as name, COUNT(*) as count 
      FROM projects 
      WHERE status='active' AND language IS NOT NULL AND language != ''
      GROUP BY language
      ORDER BY count DESC
    `);

    // Total projects for percentage calculation
    const totalActive = projectCount.count || 1;
    const languageStats = languages.map(lang => ({
      name: lang.name,
      value: Math.round((lang.count / totalActive) * 100)
    }));

    // Monthly Activity Grouping (Last 6 months)
    const activity = await dbAll(`
      SELECT strftime('%m', date) as month, COUNT(*) as value 
      FROM version_logs 
      WHERE date >= date('now', '-6 months') 
      GROUP BY month 
      ORDER BY month
    `);

    // Convert month numbers to names for frontend
    const monthNames = ["يناير", "فبراير", "مارس", "أبريل", "مايو", "يونيو", "يوليو", "أغسطس", "سبتمبر", "أكتوبر", "نوفمبر", "ديسمبر"];
    const formattedActivity = activity.map(a => ({
      name: monthNames[parseInt(a.month) - 1],
      value: a.value
    }));

    // Sync Metrics
    const totalProjects = await dbGet("SELECT COUNT(*) as count FROM projects");
    const projectsWithRepo = await dbGet("SELECT COUNT(*) as count FROM projects WHERE repo_url IS NOT NULL AND repo_url != ''");
    const lastLog = await dbGet("SELECT date FROM version_logs ORDER BY date DESC LIMIT 1");

    const syncStatus = totalProjects.count > 0
      ? Math.round((projectsWithRepo.count / totalProjects.count) * 100)
      : 100;

    res.json({
      activeProjects: projectCount.count,
      streak: parseInt(streak?.value || '0'),
      activity: formattedActivity,
      languages: languageStats,
      syncStatus: syncStatus,
      lastSyncTime: lastLog?.date || null
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
