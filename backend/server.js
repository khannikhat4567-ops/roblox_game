/**
 * Emberfall — backend server
 * ---------------------------------
 * Serves the frontend (static files) and exposes a small REST API
 * backed by a JSON file, so runs can be saved and a leaderboard
 * can be shown across sessions.
 *
 * Run:
 *   cd backend
 *   npm install
 *   npm start
 *   -> open http://localhost:3000
 */

const express = require('express');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 3000;

const DATA_DIR = path.join(__dirname, 'data');
const SCORES_FILE = path.join(DATA_DIR, 'scores.json');
const FRONTEND_DIR = path.join(__dirname, '..', 'frontend');

// --- storage helpers -------------------------------------------------
function ensureDataFile() {
  if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
  if (!fs.existsSync(SCORES_FILE)) fs.writeFileSync(SCORES_FILE, '[]', 'utf8');
}

function readScores() {
  ensureDataFile();
  try {
    return JSON.parse(fs.readFileSync(SCORES_FILE, 'utf8'));
  } catch (err) {
    console.error('Failed to read scores.json, resetting.', err);
    return [];
  }
}

function writeScores(scores) {
  ensureDataFile();
  fs.writeFileSync(SCORES_FILE, JSON.stringify(scores, null, 2), 'utf8');
}

// --- middleware --------------------------------------------------------
app.use(express.json());
app.use(express.static(FRONTEND_DIR));

// --- API -----------------------------------------------------------
// Save (or update) a run result.
app.post('/api/save', (req, res) => {
  const { name, level, kills, xp } = req.body || {};

  if (!name || typeof name !== 'string' || !name.trim()) {
    return res.status(400).json({ error: 'A non-empty "name" is required.' });
  }
  if (!Number.isFinite(level) || !Number.isFinite(kills)) {
    return res.status(400).json({ error: '"level" and "kills" must be numbers.' });
  }

  const scores = readScores();
  const entry = {
    name: name.trim().slice(0, 24),
    level: Math.max(1, Math.floor(level)),
    kills: Math.max(0, Math.floor(kills)),
    xp: Number.isFinite(xp) ? Math.floor(xp) : 0,
    savedAt: new Date().toISOString(),
  };
  scores.push(entry);
  writeScores(scores);

  res.status(201).json({ ok: true, entry });
});

// Leaderboard — top runs by level, then kills.
app.get('/api/leaderboard', (req, res) => {
  const limit = Math.min(50, Math.max(1, parseInt(req.query.limit, 10) || 10));
  const scores = readScores()
    .sort((a, b) => b.level - a.level || b.kills - a.kills)
    .slice(0, limit);
  res.json({ scores });
});

// Most recent save for a given player name (simple "continue" support).
app.get('/api/load/:name', (req, res) => {
  const scores = readScores().filter(
    (s) => s.name.toLowerCase() === String(req.params.name).toLowerCase()
  );
  if (scores.length === 0) {
    return res.status(404).json({ error: 'No save found for that name.' });
  }
  const latest = scores.sort((a, b) => new Date(b.savedAt) - new Date(a.savedAt))[0];
  res.json({ entry: latest });
});

app.get('/api/health', (req, res) => res.json({ ok: true }));

// Fallback: send index.html for any non-API route (single page app).
app.get('*', (req, res, next) => {
  if (req.path.startsWith('/api/')) return next();
  res.sendFile(path.join(FRONTEND_DIR, 'index.html'));
});

app.listen(PORT, () => {
  ensureDataFile();
  console.log(`Emberfall server running at http://localhost:${PORT}`);
});
