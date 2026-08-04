# Emberfall — Open World Prototype (Full Stack)

A playable 3D fantasy RPG prototype: Three.js frontend + a small Node/Express
backend that persists runs to a leaderboard.

```
emberfall-app/
├── backend/
│   ├── server.js         Express server: serves the frontend + REST API
│   ├── package.json
│   └── data/
│       └── scores.json   JSON "database" for saved runs (auto-created)
├── frontend/
│   ├── index.html
│   ├── style.css
│   └── game.js            Three.js game engine (terrain, combat, AI, HUD)
└── README.md
```

## Run it

You can run it with either Node.js or Python.

Node.js (recommended if installed):

```bash
cd backend
npm install
npm start
```

Python (fallback; works with Python 3.10+):

```bash
cd backend
python server.py
```

Then open **http://localhost:3000** in a browser (Chrome/Firefox/Edge).
The frontend is served directly by the backend — no separate frontend
server or build step needed.

## Why this needed a backend

The single-file version couldn't save progress anywhere. This version adds:

- `POST /api/save` — save a run (name, level, kills, xp) to `data/scores.json`
- `GET /api/leaderboard?limit=10` — top runs by level, then kills
- `GET /api/load/:name` — most recent save for a given name
- `GET /api/health` — basic health check

Data is stored in a flat JSON file for simplicity — swap `readScores`/
`writeScores` in `server.js` for a real database (SQLite, Postgres, etc.)
if you want this to scale past a single machine.

## Controls

| Key | Action |
|---|---|
| WASD | Move |
| SHIFT | Sprint |
| SPACE | Jump |
| Mouse | Look around |
| Left Click | Attack |
| ESC | Release cursor |

## Troubleshooting

- **Blank page / nothing loads**: open the browser console (F12). If you see
  a Three.js load error, check your internet connection — the 3D engine
  loads from a CDN (`cdnjs.cloudflare.com`).
- **"Could not reach the backend"** on Save/Leaderboard: make sure
  `npm start` is running in `backend/` and you're visiting
  `http://localhost:3000` (not opening `index.html` directly as a file).
- **Port already in use**: run `PORT=4000 npm start` and open
  `http://localhost:4000` instead.
