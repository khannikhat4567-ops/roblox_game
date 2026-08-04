# 🌸 Emberfall — Magical Princess Edition (v5) 🌸

[![GitHub License](https://img.shields.io/github/license/khannikhat4567-ops/roblox_game?style=flat-square&color=pink)](LICENSE)
[![Three.js](https://img.shields.io/badge/Three.js-r128-lavender?style=flat-square&logo=three.js)](https://threejs.org)
[![Backend](https://img.shields.io/badge/Backend-Node.js%20%7C%20Python-mintgreen?style=flat-square)](https://nodejs.org)

Welcome to **Emberfall — Magical Princess Edition**, an immersive, playable 3D open-world fantasy RPG prototype built using **Three.js** on the frontend, and a choice of **Node.js (Express)** or **Python** on the backend. 

Explore a magical landscape filled with cherry blossom forests, sparkling pastel lakes, and magical encounters. Synthesize spells, level up your princess character, build warm flower hearths, and test your skills against enemies to secure a spot on the persistent leaderboard!

---

## ✨ Features & Gameplay Mechanics

### 🎀 Aesthetic & Visual Design
- **Magical Landscape**: Features soft pastel pink water with custom shader shimmers, cherry blossom trees with soft pink canopies, and floating pastel dust particles (hearts & stars).
- **Cute Character Model**: A custom-designed 3D princess with pink twintails and a lavender gown.
- **Telegraphed Combat**: Wield wands and staffs (Heart Wand, Star Staff) that shoot telegraphed pink meteors and stars at foes.
- **HUD & UI**: Redesigned with a soft pastel pink, lavender, and mint green HUD, complete with a functional minimap.

### 🪄 Magical Abilities
- **Star Burst** (Slam): Triggers a magical energy slam dealing area damage.
- **Sparkle Leap** (Dash): Quickly dash forward leaving a trail of glitter.
- **Fairy Blessing** (Pact): Regenerate mana and health through a magical pact.
- **Heart Shot** (Fireball): Shoot rapid magic projectiles to hit targets from afar.

### 🍎 Progression & Customization (Perk System)
Level up your character to unlock powerful passive perks:
- **Vitality (❤)**: Increases Maximum HP.
- **Warrior (✨)**: Boosts Spell Power.
- **Arcane (🔮)**: Decreases ability cooldowns.
- **Lucky Star (⭐)**: Enhances critical strike chance.
- **Swiftness (🕊)**: Boosts movement speed.
- **Barricade (🎀)**: Minimizes damage taken.
- **Lifesteal (💖)**: Restores health upon hitting enemies.
- **Frenzy (🌸)**: Amplifies damage when health drops below 30%.

### 🔨 Construction & Building
Harvest wood and gather gold to craft and place items in the open world:
- **Flower Hearth** (Campfire): Heals the player over time when standing nearby.
- **Pastel Fence** (Wall): Blocks enemies and protects structures.

### 🎶 Web Audio Synthesizer
The game features a lightweight, fully synthesized audio engine built on top of the **Web Audio API**—producing bells, harps, and chime sounds in real-time without needing heavy audio assets.

---

## 🛠 Project Structure

```
emberfall-app/
├── backend/
│   ├── server.js         # Express server: serves frontend + REST API
│   ├── server.py         # Alternative Python implementation of the REST API
│   ├── package.json      # Node.js dependencies
│   └── data/
│       └── scores.json   # Flat JSON database for leaderboard runs (auto-created)
├── frontend/
│   ├── index.html        # Main landing page & canvas container
│   ├── style.css         # Game CSS styling (HUD, fonts, overlays)
│   ├── game.js           # Full Three.js game engine (terrain, combat, AI, audio synth)
│   └── debug_js.py       # Helper debug utility
└── README.md
```

---

## 🚀 How to Run the App

You can choose either a **Node.js (Recommended)** or **Python** server to run the backend API and host the static files.

### Option A: Node.js (Recommended)
1. Navigate to the `backend` directory:
   ```bash
   cd backend
   ```
2. Install the necessary packages (Express & Middleware):
   ```bash
   npm install
   ```
3. Run the development server:
   ```bash
   npm start
   ```
4. Open your browser and go to **[http://localhost:3000](http://localhost:3000)**.

### Option B: Python (No dependencies required)
1. Navigate to the `backend` directory:
   ```bash
   cd backend
   ```
2. Run the lightweight server script (uses built-in `http.server` & `json` modules):
   ```bash
   python server.py
   ```
3. Open your browser and go to **[http://localhost:3000](http://localhost:3000)**.

---

## 🎮 Controls

| Key / Control | Action |
|---|---|
| **W, A, S, D** | Move Princess |
| **SHIFT** | Sprint |
| **SPACE** | Jump |
| **Mouse Drag / Look** | Look Around (First & Third-Person Camera) |
| **Left Click** | Basic Wand/Staff Attack |
| **1, 2, 3, 4** | Trigger Magical Abilities |
| **B** | Toggle Construction / Build Mode |
| **E** | Interact (Chests, Potions, Fairy NPC) |
| **ESC** | Release Cursor |

---

## 💾 REST API Endpoints
The backend serves the frontend and handles saving, loading, and score persistency using `backend/data/scores.json`:

- `GET /api/health` — Checks backend health.
- `POST /api/save` — Saves a run (Player Name, Level, Kills, XP, and timestamp).
- `GET /api/leaderboard?limit=10` — Fetches top runs sorted by level, then kills.
- `GET /api/load/:name` — Loads the most recent save file for a given player name.

---

## 🌸 Credits & Acknowledgements
- Developed using **Three.js** for browser-based 3D rendering.
- Ambient particles, synth tracks, and mechanics designed specifically for the *Magical Princess Edition*.
- All audio assets are procedurally generated via the Web Audio API.
