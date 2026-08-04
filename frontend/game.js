/* =====================================================================
   EMBERFALL — MAGICAL PRINCESS EDITION (v5)
   Upgrades:
   • Pastel pink water & shimmers
   • Cherry Blossom Trees (soft pink canopies)
   • Sparkling pastel dust & heart/star ambient particles
   • Cute character model with pink twintails & pastel lavender gown
   • Wands/Staffs instead of swords (Heart Wand, Star Staff)
   • Telegraphed attacks with magical pink meteors & stars
   • Magical Abilities (Star Burst, Sparkle Leap, Fairy Blessing, Heart Shot)
   • Web Audio bell, harp, and chime synthesizer
   • Soft pastel pink, lavender, and mint green HUD redesign
===================================================================== */

// ── Core ──────────────────────────────────────────────────────────────────
let scene, camera, renderer, clock;
const WORLD = { size: 600 };

// ── Player ─────────────────────────────────────────────────────────────────
let playerMesh, player;
let keys = {};
let mouseLocked = false;
let yaw = 0, pitch = 0;
let onGround = true, vy = 0;
let firstPerson = false;
let walkTime = 0;
let isSwimming = false;

// ── Screen Shake ──────────────────────────────────────────────────────────
let screenShakeAmt = 0;

// ── Dodge ─────────────────────────────────────────────────────────────────
let dodgeCooldown = 0, isDodging = false, dodgeTime = 0;
let dodgeVelocity = new THREE.Vector3();

// ── Stats ──────────────────────────────────────────────────────────────────
let stats = {
  hp: 120, maxHp: 120, mp: 80, maxMp: 80, sp: 100, maxSp: 100,
  level: 1, xp: 0, xpNext: 60, kills: 0, gold: 0, wood: 0
};

// ── Perks ──────────────────────────────────────────────────────────────────
const perks = { vitality: 0, warrior: 0, mage: 0, shadow: 0, swift: 0, fortress: 0, vampire: 0, berserker: 0 };
const PERK_DEFS = {
  vitality:  { name: 'Vitality',  icon: '❤', desc: '+30 Max HP',          color: '#ff66aa' },
  warrior:   { name: 'Warrior',   icon: '✨', desc: '+8 Spell Power',      color: '#ffaa66' },
  mage:      { name: 'Arcane',    icon: '🔮', desc: '-20% Ability CDs',    color: '#c988ff' },
  shadow:    { name: 'Lucky Star',icon: '⭐', desc: '+12% Crit Chance',   color: '#66aaff' },
  swift:     { name: 'Swiftness', icon: '🕊', desc: '+15% Move Speed',    color: '#88ffcc' },
  fortress:  { name: 'Barricade', icon: '🎀', desc: '-20% Dmg Taken',     color: '#ffaad4' },
  vampire:   { name: 'Lifesteal', icon: '💖', desc: '12% Healing Hit',     color: '#d44488' },
  berserker: { name: 'Frenzy',    icon: '🌸', desc: '+40% DMG <30% HP',   color: '#ff5599' },
};

// ── Abilities ──────────────────────────────────────────────────────────────
const abilities = {
  slam:     { cooldown: 0, maxCooldown: 8,  mpCost: 20, active: false },
  dash:     { cooldown: 0, maxCooldown: 4,  mpCost: 10, active: false },
  pact:     { cooldown: 0, maxCooldown: 20, mpCost: 0,  active: false, timer: 0 },
  fireball: { cooldown: 0, maxCooldown: 3,  mpCost: 15, active: false },
};
let attackCooldown = 0;
let comboCount = 0, comboTimer = 0;

// ── Building / Construction System ─────────────────────────────────────────
let buildMode = false;
let selectedBuildItem = 'campfire';
let buildGhost = null;
let placedStructures = [];
const BUILD_DEFS = {
  campfire: { name: 'Flower Hearth', woodCost: 6, hp: 50, radius: 1.0 },
  wall:     { name: 'Pastel Fence', woodCost: 4, hp: 120, radius: 1.5 }
};

// ── Game state ─────────────────────────────────────────────────────────────
let gameActive = false, gamePaused = false;
let playerName = 'Princess', dayTime = 0.3;
let sunLight, hemiLight;
let sunSphere, moonSphere;
let fairyNpc = { x: 0, z: -12, mesh: null, wingsL: null, wingsR: null };
let bowUnlocked = false;
let activeStance = 'wand';
let mounted = false;
let mountMesh = null;

// ── World objects ──────────────────────────────────────────────────────────
let enemies = [], xpOrbs = [], potions = [], particles = [];
let damageNumbers = [], projectiles = [], lootDrops = [];
let campfires = [], chests = [], choppableTrees = [];
let birds = [], pollenSystem = null, pollenPositions = null;
let rainSystem = null, rainPositions = null;
let waterMesh;
let meteors = [];

// ── Minimap Settings ───────────────────────────────────────────────────────
let minimapZoom = 1.0;

// ── Status effects ─────────────────────────────────────────────────────────
let statusEffects = { burning: 0, slowed: 0, invincible: 0 };

// ── Weather ────────────────────────────────────────────────────────────────
let weather = 'clear', weatherTimer = 90, lightningTimer = 0;

// ── Inventory ──────────────────────────────────────────────────────────────
let inventory = [];

// ── Quests ─────────────────────────────────────────────────────────────────
const quests = [
  { id: 'hunt',   title: 'First Magic',   goal: 10, current: 0, complete: false, desc: 'Defeat 10 monsters',     reward: 'perk' },
  { id: 'chop',   title: 'Gardening',     goal: 5,  current: 0, complete: false, desc: 'Gather 5 wood logs',     reward: 'hp50' },
  { id: 'boss',   title: 'Princess Quest',goal: 1,  current: 0, complete: false, desc: 'Defeat the Overlord',    reward: 'xp500' },
  { id: 'level',  title: 'Royal Power',   goal: 5,  current: 0, complete: false, desc: 'Reach Level 5',          reward: 'perk' },
];
let activeQuestIdx = 0;

// ── Biomes ─────────────────────────────────────────────────────────────────
const biomeZones = [
  { name: 'Cherry Reach',     cx:   0, cz:    0, r: 140, ground: 0x5a3e4c, groundLow: 0x4a2e3c }, // Purplish-pink grass
  { name: 'Sundered Wastes',  cx: 270, cz:  130, r: 150, ground: 0xb8965a, groundLow: 0x9a7840 },
  { name: 'Frostspire Reach', cx:-240, cz:  190, r: 130, ground: 0xd7e6ee, groundLow: 0xb0cce0 },
  { name: 'Blightmarsh',      cx:  70, cz: -280, r: 120, ground: 0x445a3f, groundLow: 0x304030 },
];

// ── Enemy types ────────────────────────────────────────────────────────────
const ENEMY_TYPES = {
  grunt:  { label: 'Goblin', color: 0xbcbcaa, emissive: 0x110000, scale: 1.0, baseHp: 40,  speed: 2.4, damage: 6,  xpVal: 8,  weight: 45, ranged: false },
  wraith: { label: 'Wraith', color: 0xa88df0, emissive: 0x220044, scale: 0.9, baseHp: 60,  speed: 3.8, damage: 9,  xpVal: 15, weight: 18, ranged: false, transparent: true, opacity: 0.75 },
  brute:  { label: 'Brute',  color: 0x8a3520, emissive: 0x220500, scale: 1.6, baseHp: 130, speed: 1.5, damage: 18, xpVal: 28, weight: 18, ranged: false },
  elite:  { label: 'Elite',  color: 0x7a40c0, emissive: 0x1a0040, scale: 1.2, baseHp: 200, speed: 3.0, damage: 14, xpVal: 40, weight: 5,  ranged: false },
  archer: { label: 'Elf Archer', color: 0x5a8a4a, emissive: 0x001100, scale: 0.95, baseHp: 55,  speed: 3.5, damage: 12, xpVal: 18, weight: 14, ranged: true  },
};
const BOSS_DEF = { label: 'Ancient Overlord', color: 0xcc1111, emissive: 0x440000, scale: 2.5, baseHp: 800, speed: 2.0, damage: 25, xpVal: 200 };
let bossActive = false, nextBossKill = 10;

// ── Items ──────────────────────────────────────────────────────────────────
const ITEM_POOL = [
  { id: 'iron_sword',  name: 'Sparkle Wand', icon: '🪄', rarity: 'common',   type: 'weapon',  bonus: 6,  desc: '+6 Magic DMG' },
  { id: 'steel_blade', name: 'Love Staff',   icon: '🎀', rarity: 'uncommon', type: 'weapon',  bonus: 14, desc: '+14 Magic DMG' },
  { id: 'flame_sword', name: 'Heart Wand',   icon: '💖', rarity: 'rare',     type: 'weapon',  bonus: 24, desc: '+24 Magic DMG' },
  { id: 'iron_helm',   name: 'Bunny Ribbon', icon: '🐰', rarity: 'common',   type: 'armor',   bonus: 20, desc: '+20 Max HP' },
  { id: 'dragon_plate', name: 'Princess Gown',icon: '👗', rarity: 'rare',     type: 'armor',   bonus: 50, desc: '+50 Max HP' },
  { id: 'mana_gem',    name: 'Star Gemstone',icon: '⭐', rarity: 'uncommon', type: 'trinket', bonus: 25, desc: '+25 Max MP' },
  { id: 'swift_boots', name: 'Glitter Shoes',icon: '👠', rarity: 'uncommon', type: 'trinket', bonus: 2,  desc: '+2 SPD' },
  { id: 'gold_ring',   name: 'Heart Ring',   icon: '💍', rarity: 'rare',     type: 'trinket', bonus: 10, desc: '+10% Crit' },
  { id: 'hp_potion',   name: 'Berry Elixir', icon: '🧃', rarity: 'common',   type: 'potion',  bonus: 40, desc: 'Restore 40 HP' },
];
const RARITY_COLORS = { common: '#ffccd4', uncommon: '#e2abff', rare: '#ff77aa', epic: '#cc44ff' };

// ─────────────────────────────────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────────────────────────────────
function hillHeight(x, z) {
  return (
    Math.sin(x * 0.018) * 4.5 + Math.cos(z * 0.022) * 4.0 +
    Math.sin((x + z) * 0.009) * 3.0 + Math.cos((x - z) * 0.011) * 2.0 +
    Math.sin(x * 0.055) * 1.5 + Math.cos(z * 0.065) * 1.2 +
    Math.sin(x * 0.04 - z * 0.05) * 1.0 +
    Math.sin(x * 0.14 + z * 0.1) * 0.5 + Math.cos(x * 0.11 - z * 0.13) * 0.4
  );
}
function groundHeightAt(x, z) { return hillHeight(x, z) + 1.0; }
function nearestBiome(x, z) {
  let best = biomeZones[0], bd = Infinity;
  for (const b of biomeZones) {
    const d = (x - b.cx) ** 2 + (z - b.cz) ** 2;
    if (d < bd) { bd = d; best = b; }
  }
  return best;
}

function triggerScreenShake(amt) {
  screenShakeAmt = Math.max(screenShakeAmt, amt);
}

// ─────────────────────────────────────────────────────────────────────────
// SOUNDS (SWEET BELL / HARP CHIMES)
// ─────────────────────────────────────────────────────────────────────────
let audioCtx = null;
let musicInterval = null;
let musicStep = 0;
const musicNotes = [261.63, 293.66, 329.63, 349.23, 392.00, 440.00, 493.88, 523.25]; // C Major scale notes (sweet arpeggio)

function initAudio() {
  try {
    audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    startProceduralMusic();
  } catch (e) {}
}

function playSound(type) {
  if (!audioCtx) return;
  if (audioCtx.state === 'suspended') audioCtx.resume().catch(() => {});
  const now = audioCtx.currentTime;

  function bell(freq, vol, dur, delay = 0) {
    const osc1 = audioCtx.createOscillator(), osc2 = audioCtx.createOscillator(), gain = audioCtx.createGain(), t = now + delay;
    osc1.type = 'sine'; osc1.frequency.value = freq;
    osc2.type = 'sine'; osc2.frequency.value = freq * 2.02; // soft bright ring harmonic
    gain.gain.setValueAtTime(vol, t);
    gain.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    osc1.connect(gain); osc2.connect(gain);
    gain.connect(audioCtx.destination);
    osc1.start(t); osc1.stop(t + dur + 0.01);
    osc2.start(t); osc2.stop(t + dur + 0.01);
  }
  
  function chimeSweep(f1, f2, vol, dur, delay = 0) {
    const osc = audioCtx.createOscillator(), gain = audioCtx.createGain(), t = now + delay;
    osc.type = 'sine';
    osc.frequency.setValueAtTime(f1, t);
    osc.frequency.exponentialRampToValueAtTime(f2, t + dur);
    gain.gain.setValueAtTime(vol, t);
    gain.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    osc.connect(gain); gain.connect(audioCtx.destination);
    osc.start(t); osc.stop(t + dur + 0.01);
  }

  switch (type) {
    case 'attack':   chimeSweep(600, 1100, 0.12, 0.18); break;
    case 'hit':      bell(520, 0.18, 0.15); break;
    case 'chop':     chimeSweep(220, 150, 0.14, 0.1); bell(660, 0.1, 0.06, 0.05); break;
    case 'levelup':  [523.25, 659.25, 783.99, 1046.50].forEach((f, i) => bell(f, 0.12, 0.4, i * 0.08)); break;
    case 'pickup':   bell(880, 0.1, 0.08); bell(1320, 0.08, 0.1, 0.06); break;
    case 'slam':     chimeSweep(300, 150, 0.25, 0.35); bell(120, 0.15, 0.3); break;
    case 'fireball': chimeSweep(400, 950, 0.12, 0.4); break;
    case 'dash':     chimeSweep(600, 1300, 0.1, 0.18); break;
    case 'dodge':    chimeSweep(800, 400, 0.08, 0.2); break;
    case 'perk':     [523, 587, 659, 698, 784].forEach((f, i) => bell(f, 0.12, 0.45, i * 0.06)); break;
    case 'loot':     [659, 784, 1046].forEach((f, i) => bell(f, 0.08, 0.15, i * 0.06)); break;
    case 'boss':     chimeSweep(120, 440, 0.25, 0.8); bell(220, 0.18, 0.8, 0.1); break;
    case 'quest':    [523, 659, 784, 1046].forEach((f, i) => bell(f, 0.15, 0.35, i * 0.08)); break;
    case 'build':    bell(440, 0.15, 0.25); bell(554, 0.1, 0.2, 0.05); break;
    case 'meteor':   chimeSweep(150, 600, 0.3, 0.5); break;
  }
}

function startProceduralMusic() {
  if (musicInterval) clearInterval(musicInterval);
  musicInterval = setInterval(() => {
    if (!audioCtx || gamePaused || !gameActive) return;
    const isBossActive = bossActive;
    
    const now = audioCtx.currentTime;
    // Cute harp arpeggio scale melody
    const stepIdx = musicStep % musicNotes.length;
    const freq = musicNotes[stepIdx] * (isBossActive ? 1.5 : 1);
    
    // Ambient Music Pluck Node
    const pluckOsc = audioCtx.createOscillator();
    const pluckGain = audioCtx.createGain();
    pluckOsc.type = 'triangle';
    pluckOsc.frequency.setValueAtTime(freq, now);
    pluckGain.gain.setValueAtTime(isBossActive ? 0.07 : 0.045, now);
    pluckGain.gain.exponentialRampToValueAtTime(0.0001, now + (isBossActive ? 0.25 : 0.45));
    
    pluckOsc.connect(pluckGain);
    pluckGain.connect(audioCtx.destination);
    
    pluckOsc.start(now);
    pluckOsc.stop(now + 0.5);

    // Accompanying cute sub-bass arpeggio
    if (musicStep % 2 === 0) {
      const subOsc = audioCtx.createOscillator();
      const subGain = audioCtx.createGain();
      subOsc.type = 'sine';
      subOsc.frequency.setValueAtTime(freq / 4, now);
      subGain.gain.setValueAtTime(0.05, now);
      subGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.45);
      subOsc.connect(subGain);
      subGain.connect(audioCtx.destination);
      subOsc.start(now);
      subOsc.stop(now + 0.5);
    }
    
    musicStep++;
  }, 260);
}

// ─────────────────────────────────────────────────────────────────────────
// INIT
// ─────────────────────────────────────────────────────────────────────────
function init() {
  scene  = new THREE.Scene();
  clock  = new THREE.Clock();
  camera = new THREE.PerspectiveCamera(70, innerWidth / innerHeight, 0.1, 1200);

  renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setSize(innerWidth, innerHeight);
  renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.15;
  document.body.appendChild(renderer.domElement);

  buildLighting();
  buildGround();
  buildSky();
  buildWater();
  buildCelestials();
  buildFairyNpc();
  scatterWorld();
  buildPlayer();
  buildBirds();
  buildPollenSystem();
  buildCampfires();
  buildChests();
  spawnEnemies(32);
  spawnPotions(14);

  window.addEventListener('resize', onResize);
  window.addEventListener('keydown', onKeyDown);
  window.addEventListener('keyup',   e => { keys[e.code] = false; });
  document.addEventListener('mousemove', onMouseMove);
  document.addEventListener('pointerlockchange', () => {
    mouseLocked = document.pointerLockElement === renderer.domElement;
    const h = document.getElementById('click-hint');
    if (h) h.style.display = mouseLocked ? 'none' : 'flex';
  });
  renderer.domElement.addEventListener('click', () => {
    if (gameActive && !gamePaused) {
      if (!mouseLocked) {
        renderer.domElement.requestPointerLock();
      } else {
        if (buildMode) confirmPlacement();
        else tryAttack();
      }
    }
  });

  document.getElementById('startBtn').onclick       = startGame;
  document.getElementById('respawnBtn').onclick     = respawn;
  document.getElementById('leaderboardBtn').onclick = toggleLeaderboard;
  document.getElementById('saveScoreBtn').onclick   = saveScore;
  window.buyShopItem = buyShopItem;
  window.closeShop = closeShop;

  document.getElementById('mm-zoom-in').onclick = (e) => { e.stopPropagation(); minimapZoom = Math.min(2.5, minimapZoom + 0.3); };
  document.getElementById('mm-zoom-out').onclick = (e) => { e.stopPropagation(); minimapZoom = Math.max(0.4, minimapZoom - 0.3); };

  buildCompass();
  updateAbilityUI();
  updateQuestUI();
  animate();
}

// ─────────────────────────────────────────────────────────────────────────
// LIGHTING + SKY
// ─────────────────────────────────────────────────────────────────────────
function buildLighting() {
  hemiLight = new THREE.HemisphereLight(0xffd6e8, 0x3d2a3c, 0.7); // Cute pinkish-purple sky bounce
  scene.add(hemiLight);

  sunLight = new THREE.DirectionalLight(0xffe3ec, 1.35); // Soft rose light
  sunLight.castShadow = true;
  sunLight.shadow.mapSize.set(4096, 4096);
  sunLight.shadow.camera.left = sunLight.shadow.camera.bottom = -220;
  sunLight.shadow.camera.right = sunLight.shadow.camera.top = 220;
  sunLight.shadow.camera.far = 800;
  sunLight.shadow.bias = -0.0001;
  scene.add(sunLight, sunLight.target);

  const fill = new THREE.DirectionalLight(0xff88bb, 0.4);
  fill.position.set(-50, 30, -50);
  scene.add(fill);
}

function buildSky() {
  scene.background = new THREE.Color(0xffdbeb); // Shimmering pastel pink
  scene.fog = new THREE.FogExp2(0xffe3f0, 0.0022);
}

// ─────────────────────────────────────────────────────────────────────────
// SHIMMERING PASTEL PINK WATER
// ─────────────────────────────────────────────────────────────────────────
function buildWater() {
  const geo = new THREE.PlaneGeometry(WORLD.size, WORLD.size, 40, 40);
  const mat = new THREE.MeshStandardMaterial({
    color: 0xffadc6, // Bright pink water
    transparent: true,
    opacity: 0.72,
    roughness: 0.08,
    metalness: 0.1,
    side: THREE.DoubleSide
  });
  waterMesh = new THREE.Mesh(geo, mat);
  waterMesh.rotateX(-Math.PI / 2);
  waterMesh.position.y = -3.8;
  scene.add(waterMesh);
}

// ─────────────────────────────────────────────────────────────────────────
// GROUND (improved: slope + height based vertex colors)
// ─────────────────────────────────────────────────────────────────────────
function buildGround() {
  const seg = 220;
  const geo = new THREE.PlaneGeometry(WORLD.size, WORLD.size, seg, seg);
  geo.rotateX(-Math.PI / 2);
  const pos = geo.attributes.position;
  const gridW = seg + 1;

  const heights = new Float32Array(pos.count);
  for (let i = 0; i < pos.count; i++) {
    heights[i] = hillHeight(pos.getX(i), pos.getZ(i));
    pos.setY(i, heights[i]);
  }

  const colors = [];
  for (let i = 0; i < pos.count; i++) {
    const row = Math.floor(i / gridW), col = i % gridW;
    const h  = heights[i];
    const hL = col > 0   ? heights[row * gridW + col - 1] : h;
    const hR = col < seg ? heights[row * gridW + col + 1] : h;
    const hU = row > 0   ? heights[(row - 1) * gridW + col] : h;
    const hD = row < seg ? heights[(row + 1) * gridW + col] : h;
    const slope = Math.sqrt(((hR - hL) / 2) ** 2 + ((hD - hU) / 2) ** 2);

    const x = pos.getX(i), z = pos.getZ(i);
    const biome = nearestBiome(x, z);

    let c;
    if (h > 9.5) {
      c = biome.name === 'Frostspire Reach' ? new THREE.Color(0xfff5fa) : new THREE.Color(0x9a8498);
    } else if (biome.name === 'Frostspire Reach' && h > 6) {
      c = new THREE.Color(0xffebf4);
    } else if (slope > 0.6) {
      c = new THREE.Color(0xa2849c).lerp(new THREE.Color(biome.ground), 0.25);
    } else if (h < -2.5) {
      c = new THREE.Color(biome.groundLow || biome.ground).multiplyScalar(0.78);
    } else {
      const t = Math.max(0, Math.min(1, (h + 2) / 11));
      c = new THREE.Color(biome.groundLow || biome.ground).lerp(new THREE.Color(biome.ground), t);
    }

    const n = (Math.sin(x * 3.7 + z * 2.3) * 0.5 + 0.5) * 0.07;
    c.r = Math.max(0, Math.min(1, c.r + n - 0.035));
    c.g = Math.max(0, Math.min(1, c.g + n - 0.035));
    c.b = Math.max(0, Math.min(1, c.b + n * 0.4 - 0.02));

    colors.push(c.r, c.g, c.b);
  }
  geo.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
  geo.computeVertexNormals();
  const mat = new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.92, metalness: 0.0 });
  const mesh = new THREE.Mesh(geo, mat);
  mesh.receiveShadow = true;
  scene.add(mesh);
}

// ─────────────────────────────────────────────────────────────────────────
// CHERRY BLOSSOM & PASTEL TREE BUILDERS
// ─────────────────────────────────────────────────────────────────────────
function buildPineTree(x, z, s) {
  const g = new THREE.Group();
  const tMat = new THREE.MeshStandardMaterial({ color: 0x6e525a, roughness: 0.9 });
  const lCol = 0xffc4db + Math.floor(Math.random() * 0x050505); // light pink
  const lMat = new THREE.MeshStandardMaterial({ color: lCol, roughness: 0.85 });

  const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.17 * s, 0.28 * s, 2.0 * s, 7), tMat);
  trunk.position.y = s; trunk.castShadow = true; g.add(trunk);

  const tiers = [[1.5 * s, 1.8 * s, 0.1 * s], [1.1 * s, 1.4 * s, 1.6 * s], [0.65 * s, 1.0 * s, 3.0 * s]];
  for (const [r, h, y] of tiers) {
    const cone = new THREE.Mesh(new THREE.ConeGeometry(r, h, 9), lMat);
    cone.position.y = 1.8 * s + y; cone.rotation.y = Math.random() * Math.PI; cone.castShadow = true; g.add(cone);
  }
  g.rotation.z = (Math.random() - 0.5) * 0.14; g.rotation.x = (Math.random() - 0.5) * 0.08;
  g.rotation.y = Math.random() * Math.PI;
  g.position.set(x, hillHeight(x, z), z);
  return g;
}

function buildOakTree(x, z, s) {
  // Replaced with Cherry Blossom Tree
  const g = new THREE.Group();
  const tMat = new THREE.MeshStandardMaterial({ color: 0x5a3f4c, roughness: 0.9 });
  const lCol = 0xffa3c4 + Math.floor(Math.random() * 0x001010); // blossom pink
  const lMat = new THREE.MeshStandardMaterial({ color: lCol, roughness: 0.7 });

  const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.24 * s, 0.38 * s, 2.8 * s, 8), tMat);
  trunk.position.y = 1.4 * s; trunk.castShadow = true; g.add(trunk);

  const canopy = new THREE.Mesh(new THREE.SphereGeometry(1.7 * s, 9, 7), lMat);
  canopy.position.y = 3.8 * s; canopy.scale.set(1, 0.72, 1); canopy.castShadow = true; g.add(canopy);

  for (let i = 0; i < 4; i++) {
    const a = (i / 4) * Math.PI * 2 + Math.random() * 0.8;
    const sub = new THREE.Mesh(new THREE.SphereGeometry(0.95 * s, 7, 5), lMat);
    sub.position.set(Math.cos(a) * 1.1 * s, 3.2 * s + (Math.random() - 0.5) * 0.6 * s, Math.sin(a) * 1.1 * s);
    g.add(sub);
  }
  g.rotation.y = Math.random() * Math.PI;
  g.rotation.z = (Math.random() - 0.5) * 0.1;
  g.position.set(x, hillHeight(x, z), z);
  return g;
}

function buildDeadTree(x, z, s) {
  // Replaced with Lavender Magical Tree
  const g = new THREE.Group();
  const mat = new THREE.MeshStandardMaterial({ color: 0x3d2a3c, roughness: 1.0 });

  const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.14 * s, 0.25 * s, 3.8 * s, 6), mat);
  trunk.position.y = 1.9 * s; trunk.rotation.z = (Math.random() - 0.5) * 0.18; trunk.castShadow = true; g.add(trunk);

  const branchData = [[0.4, 2.1, 0.8], [-0.35, 2.6, 0.9], [0.55, 3.0, 0.7], [-0.5, 2.8, 0.6], [0.25, 3.4, 0.5]];
  for (const [angle, hy, bl] of branchData) {
    const br = new THREE.Mesh(new THREE.CylinderGeometry(0.055 * s, 0.09 * s, bl * s, 4), mat);
    br.position.y = hy * s; br.position.x = Math.sin(angle) * 0.5 * s;
    br.rotation.z = angle; br.rotation.y = Math.random() * Math.PI; g.add(br);
  }
  g.position.set(x, hillHeight(x, z), z);
  return g;
}

// ─────────────────────────────────────────────────────────────────────────
// WORLD SCATTER
// ─────────────────────────────────────────────────────────────────────────
function scatterWorld() {
  const rockGeo    = new THREE.DodecahedronGeometry(0.8, 0);
  const crystalGeo = new THREE.ConeGeometry(0.28, 1.8, 5);

  for (let i = 0; i < 320; i++) {
    const x = (Math.random() - 0.5) * WORLD.size * 0.88;
    const z = (Math.random() - 0.5) * WORLD.size * 0.88;
    const biome = nearestBiome(x, z);
    const y = hillHeight(x, z);
    if (biome.name === 'Frostspire Reach' && Math.random() < 0.45) continue;

    if (biome.name !== 'Sundered Wastes' && Math.random() < 0.7) {
      const s = 0.55 + Math.random() * 1.0;
      let treeGroup;
      if (biome.name === 'Frostspire Reach') {
        treeGroup = buildPineTree(x, z, s);
      } else if (biome.name === 'Blightmarsh' && Math.random() < 0.3) {
        treeGroup = buildDeadTree(x, z, s);
      } else if (Math.random() < 0.45) {
        treeGroup = buildOakTree(x, z, s);
      } else {
        treeGroup = buildPineTree(x, z, s);
      }
      scene.add(treeGroup);
      choppableTrees.push({ group: treeGroup, hp: 3, maxHp: 3, x, z, s });

    } else if (biome.name === 'Frostspire Reach' && Math.random() < 0.6) {
      const s = 0.4 + Math.random() * 0.9;
      const crystal = new THREE.Mesh(crystalGeo, new THREE.MeshStandardMaterial({ color: 0xe2a8ff, transparent: true, opacity: 0.8, metalness: 0.5, roughness: 0.1 })); // Lavender crystals
      crystal.position.set(x, y + 0.9 * s, z); crystal.scale.set(s, s, s); crystal.rotation.y = Math.random() * Math.PI;
      scene.add(crystal);
    } else if (Math.random() < 0.42) {
      const s = 0.4 + Math.random() * 1.6;
      const rock = new THREE.Mesh(rockGeo, new THREE.MeshStandardMaterial({ color: 0x8a7288, flatShading: true })); // Purplish rock
      rock.position.set(x, y + 0.3 * s, z); rock.scale.set(s, s * 0.7, s); rock.castShadow = true;
      scene.add(rock);
    }
  }

  buildRuins( 80, -80); buildRuins(-140, 120); buildRuins(200, -60);
}

function buildRuins(cx, cz) {
  const mat = new THREE.MeshStandardMaterial({ color: 0x9a8498, roughness: 0.9, flatShading: true });
  const pGeo = new THREE.CylinderGeometry(0.5, 0.7, 4, 8);
  const cGeo = new THREE.BoxGeometry(1.6, 0.4, 1.6);
  const bGeo = new THREE.BoxGeometry(1.8, 0.3, 1.8);
  for (let i = 0; i < 7; i++) {
    const a = (i / 7) * Math.PI * 2, r = 9 + Math.random() * 3;
    const px = cx + Math.cos(a) * r, pz = cz + Math.sin(a) * r, py = hillHeight(px, pz);
    if (Math.random() < 0.65) {
      const p = new THREE.Mesh(pGeo, mat); p.position.set(px, py + 2, pz); p.castShadow = true; scene.add(p);
      const b = new THREE.Mesh(bGeo, mat); b.position.set(px, py + 0.15, pz); scene.add(b);
      if (Math.random() < 0.5) { const c = new THREE.Mesh(cGeo, mat); c.position.set(px, py + 4.2, pz); scene.add(c); }
    }
  }
}

// ─────────────────────────────────────────────────────────────────────────
// CUTE PLAYER MODEL (pink hair, twintails, lavender gown)
// ─────────────────────────────────────────────────────────────────────────
function buildPlayer() {
  playerMesh = new THREE.Group();

  const skinMat  = new THREE.MeshStandardMaterial({ color: 0xffe0d0, roughness: 0.7 });
  const gownMat  = new THREE.MeshStandardMaterial({ color: 0xe2adff, roughness: 0.8 }); // Pastel lavender gown
  const hairMat  = new THREE.MeshStandardMaterial({ color: 0xff8ab2, roughness: 0.9 }); // Bright pink hair
  const bootMat  = new THREE.MeshStandardMaterial({ color: 0xffaac4, roughness: 0.9 }); // Pastel pink boots

  function castable(m) { m.castShadow = true; return m; }

  // ── Torso / Gown
  const torso = castable(new THREE.Mesh(new THREE.BoxGeometry(0.54, 0.68, 0.32), gownMat));
  torso.position.y = 1.35;

  // ── Head
  const head = castable(new THREE.Mesh(new THREE.BoxGeometry(0.36, 0.36, 0.36), skinMat));
  head.position.y = 1.9;

  // ── Pink Hair Cap
  const hairCap = castable(new THREE.Mesh(new THREE.BoxGeometry(0.38, 0.22, 0.38), hairMat));
  hairCap.position.set(0, 2.0, -0.02);

  // ── Twintails (Cute hair details that bob when walking)
  const lTail = castable(new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.04, 0.5, 6), hairMat));
  lTail.position.set(-0.24, 1.88, -0.1);
  lTail.rotation.z = Math.PI / 10;
  
  const rTail = castable(new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.04, 0.5, 6), hairMat));
  rTail.position.set(0.24, 1.88, -0.1);
  rTail.rotation.z = -Math.PI / 10;

  // ── Left arm
  const lArmPivot = new THREE.Group();
  lArmPivot.position.set(-0.38, 1.55, 0);
  const lArm = castable(new THREE.Mesh(new THREE.BoxGeometry(0.19, 0.58, 0.19), gownMat));
  lArm.position.y = -0.29;
  lArmPivot.add(lArm);

  // ── Right arm (wand container)
  const rArmPivot = new THREE.Group();
  rArmPivot.position.set(0.38, 1.55, 0);
  const rArm = castable(new THREE.Mesh(new THREE.BoxGeometry(0.19, 0.58, 0.19), gownMat));
  rArm.position.y = -0.29;
  rArmPivot.add(rArm);

  // Wand attachment
  const swordGroup = new THREE.Group();
  swordGroup.position.set(0.18, -0.48, 0.1);
  rArmPivot.add(swordGroup);

  // ── Left leg
  const lLegPivot = new THREE.Group();
  lLegPivot.position.set(-0.15, 0.95, 0);
  const lLeg = castable(new THREE.Mesh(new THREE.BoxGeometry(0.23, 0.75, 0.23), bootMat));
  lLeg.position.y = -0.38;
  lLegPivot.add(lLeg);

  // ── Right leg
  const rLegPivot = new THREE.Group();
  rLegPivot.position.set(0.15, 0.95, 0);
  const rLeg = castable(new THREE.Mesh(new THREE.BoxGeometry(0.23, 0.75, 0.23), bootMat));
  rLeg.position.y = -0.38;
  rLegPivot.add(rLeg);

  playerMesh.add(torso, head, hairCap, lTail, rTail, lArmPivot, rArmPivot, lLegPivot, rLegPivot);

  playerMesh.userData.lArmPivot  = lArmPivot;
  playerMesh.userData.rArmPivot  = rArmPivot;
  playerMesh.userData.lLegPivot  = lLegPivot;
  playerMesh.userData.rLegPivot  = rLegPivot;
  playerMesh.userData.swordGroup = swordGroup;
  playerMesh.userData.head       = head;
  playerMesh.userData.lTail      = lTail;
  playerMesh.userData.rTail      = rTail;

  playerMesh.position.set(0, groundHeightAt(0, 0), 8);
  scene.add(playerMesh);
  player = { pos: playerMesh.position, speed: 6.5, sprint: 12, mesh: playerMesh, invincible: false };

  rebuildWeaponMesh();
}


// ─────────────────────────────────────────────────────────────────────────
// CELESTIALS & ANINATED LOW-POLY WATER WAVES
// ─────────────────────────────────────────────────────────────────────────
function updateWaterWaves(t) {
  if (!waterMesh) return;
  const pos = waterMesh.geometry.attributes.position;
  for (let i = 0; i < pos.count; i++) {
    const x = pos.getX(i);
    const y = pos.getY(i);
    const zOffset = Math.sin(t * 1.5 + x * 0.08) * 0.45 + Math.cos(t * 1.2 + y * 0.06) * 0.35;
    pos.setZ(i, zOffset);
  }
  waterMesh.geometry.computeVertexNormals();
  waterMesh.geometry.attributes.position.needsUpdate = true;
}

function buildCelestials() {
  const sunGeo = new THREE.SphereGeometry(6, 8, 8);
  const sunMat = new THREE.MeshBasicMaterial({ color: 0xffdd44 });
  sunSphere = new THREE.Mesh(sunGeo, sunMat);
  scene.add(sunSphere);

  const moonGeo = new THREE.SphereGeometry(4, 8, 8);
  const moonMat = new THREE.MeshBasicMaterial({ color: 0xe0e6ff });
  moonSphere = new THREE.Mesh(moonGeo, moonMat);
  scene.add(moonSphere);
}

function buildFairyNpc() {
  const npcGroup = new THREE.Group();
  const dressMat = new THREE.MeshStandardMaterial({ color: 0xff66b2, roughness: 0.5 });
  const wingMat  = new THREE.MeshStandardMaterial({ color: 0xffc2eb, transparent: true, opacity: 0.75 });
  const skinMat  = new THREE.MeshStandardMaterial({ color: 0xffe0d0 });

  const body = new THREE.Mesh(new THREE.ConeGeometry(0.24, 0.68, 6), dressMat);
  body.position.y = 0.34;
  
  const head = new THREE.Mesh(new THREE.SphereGeometry(0.15, 8, 8), skinMat);
  head.position.y = 0.78;

  const wingsL = new THREE.Mesh(new THREE.BoxGeometry(0.35, 0.22, 0.02), wingMat);
  wingsL.position.set(-0.25, 0.5, -0.05);
  wingsL.rotation.y = -Math.PI / 6;

  const wingsR = new THREE.Mesh(new THREE.BoxGeometry(0.35, 0.22, 0.02), wingMat);
  wingsR.position.set(0.25, 0.5, -0.05);
  wingsR.rotation.y = Math.PI / 6;

  npcGroup.add(body, head, wingsL, wingsR);
  
  const y = hillHeight(fairyNpc.x, fairyNpc.z);
  npcGroup.position.set(fairyNpc.x, y + 0.3, fairyNpc.z);
  scene.add(npcGroup);

  fairyNpc.mesh = npcGroup;
  fairyNpc.wingsL = wingsL;
  fairyNpc.wingsR = wingsR;

  const stand = new THREE.Mesh(new THREE.CylinderGeometry(0.6, 0.6, 0.5, 8), new THREE.MeshStandardMaterial({ color: 0xffaad4 }));
  stand.position.set(fairyNpc.x, y + 0.25, fairyNpc.z);
  scene.add(stand);
}

function updateFairyNpc(t) {
  if (!fairyNpc.mesh) return;
  fairyNpc.mesh.position.y = hillHeight(fairyNpc.x, fairyNpc.z) + 0.55 + Math.sin(t * 2.5) * 0.12;
  const flap = Math.sin(t * 12) * 0.38;
  fairyNpc.wingsL.rotation.y = -Math.PI / 6 + flap;
  fairyNpc.wingsR.rotation.y = Math.PI / 6 - flap;

  const dist = Math.hypot(player.pos.x - fairyNpc.x, player.pos.z - fairyNpc.z);
  const prompt = document.getElementById('shop-prompt');
  if (prompt) {
    if (dist < 4.0) {
      prompt.style.display = 'block';
    } else {
      prompt.style.display = 'none';
      closeShop();
    }
  }
}

function toggleShop() {
  const panel = document.getElementById('shop-modal');
  if (!panel) return;
  if (panel.style.display === 'flex') {
    closeShop();
  } else {
    gamePaused = true;
    if (document.pointerLockElement) document.exitPointerLock();
    panel.style.display = 'flex';
    const gEl = document.getElementById('shop-gold-current');
    if (gEl) gEl.textContent = `Your Gold: ${stats.gold}g`;
  }
}

function closeShop() {
  const panel = document.getElementById('shop-modal');
  if (panel) panel.style.display = 'none';
  if (gamePaused) {
    gamePaused = false;
    setTimeout(() => { const p = renderer.domElement.requestPointerLock(); if (p && p.catch)p.catch(() => {}); }, 100);
  }
}

function buyShopItem(itemType) {
  if (itemType === 'tonic') {
    if (stats.gold < 30) { showNotification('❌ Need 30g!', 1500, '#ff44aa'); return; }
    stats.gold -= 30;
    collectItem(ITEM_POOL.find(it => it.id === 'hp_potion'));
  } else if (itemType === 'tiara') {
    if (stats.gold < 100) { showNotification('❌ Need 100g!', 1500, '#ff44aa'); return; }
    stats.gold -= 100;
    collectItem(ITEM_POOL.find(it => it.id === 'dragon_plate'));
  } else if (itemType === 'bow') {
    if (bowUnlocked) { showNotification('Already unlocked Bow of Light!', 1500, '#ffaacc'); return; }
    if (stats.gold < 150) { showNotification('❌ Need 150g!', 1500, '#ff44aa'); return; }
    stats.gold -= 150;
    bowUnlocked = true;
    showNotification('🏹 Bow of Light unlocked! Press X to swap stance.', 3000, '#84ffcc');
    activeStance = 'bow';
    rebuildWeaponMesh();
  }
  const gEl = document.getElementById('shop-gold-current');
  if (gEl) gEl.textContent = `Your Gold: ${stats.gold}g`;
  updateHud();
}

function toggleStance() {
  if (!bowUnlocked) {
    showNotification('Buy the Bow of Light from Fairy Lily first!', 2500, '#ff66aa');
    return;
  }
  activeStance = activeStance === 'wand' ? 'bow' : 'wand';
  showNotification(activeStance === 'bow' ? 'Stance: Bow of Light (Ranged)' : 'Stance: Magic Wand (Melee)', 2000, '#ffaad4');
  rebuildWeaponMesh();
}

function toggleMount() {
  if (!gameActive || gamePaused) return;
  mounted = !mounted;
  playSound('mount');
  showNotification(mounted ? '☁ Summoned Sparkle Cloud Mount!' : 'Dismounted.', 2000, '#ff88dd');

  if (mounted) {
    createMountMesh();
    player.speed = 11.5 + perks.swift * 1.5;
    player.sprint = 21.0 + perks.swift * 2.0;
  } else {
    removeMountMesh();
    player.speed = 6.5 + perks.swift * 1.0;
    player.sprint = 12 + perks.swift * 1.5;
  }
}

function createMountMesh() {
  removeMountMesh();
  mountMesh = new THREE.Group();
  const cloudMat = new THREE.MeshStandardMaterial({ color: 0xffebf2, roughness: 0.9, transparent: true, opacity: 0.85 });
  const count = 5;
  for (let i = 0; i < count; i++) {
    const sphere = new THREE.Mesh(new THREE.SphereGeometry(0.35 + Math.random() * 0.2, 6, 6), cloudMat);
    sphere.position.set((Math.random() - 0.5) * 0.8, -0.6, (Math.random() - 0.5) * 0.8);
    mountMesh.add(sphere);
  }
  playerMesh.add(mountMesh);
}

function removeMountMesh() {
  if (mountMesh) {
    playerMesh.remove(mountMesh);
    mountMesh = null;
  }
}

function rebuildWeaponMesh() {
  const sg = playerMesh.userData.swordGroup;
  if (!sg) return;
  while (sg.children.length > 0) {
    const obj = sg.children[0];
    sg.remove(obj);
    if (obj.geometry) obj.geometry.dispose();
    if (obj.material) obj.material.dispose();
  }

  if (activeStance === 'bow') {
    const bowMat = new THREE.MeshStandardMaterial({ color: 0xffd166, metalness: 0.9, roughness: 0.1 });
    const bowRing = new THREE.Mesh(new THREE.TorusGeometry(0.28, 0.02, 4, 12, Math.PI), bowMat);
    bowRing.position.set(0.0, 0.25, 0.1);
    bowRing.rotation.y = Math.PI / 2;
    sg.add(bowRing);
    sg.userData.currentWeaponId = 'bow';
    return;
  }
  const weapons = inventory.filter(i => i.type === 'weapon');
  let best = 'iron_sword';
  if (weapons.some(w => w.id === 'flame_sword')) best = 'flame_sword';
  else if (weapons.some(w => w.id === 'steel_blade')) best = 'steel_blade';

  let rodMat, topMat, rodGeo, topGeo;
  if (best === 'flame_sword') {
    // Replaced with Star Heart Wand
    rodMat = new THREE.MeshStandardMaterial({ color: 0xffd166, metalness: 0.9, roughness: 0.1 });
    topMat = new THREE.MeshStandardMaterial({ color: 0xff66b2, emissive: 0xff0077, emissiveIntensity: 2.0 });
    rodGeo = new THREE.CylinderGeometry(0.02, 0.02, 0.8, 6);
    topGeo = new THREE.SphereGeometry(0.18, 8, 8); // Heart/star shape equivalent
  } else if (best === 'steel_blade') {
    // Replaced with Love Staff
    rodMat = new THREE.MeshStandardMaterial({ color: 0xffebf2, roughness: 0.5 });
    topMat = new THREE.MeshStandardMaterial({ color: 0xd680ff, metalness: 0.8 });
    rodGeo = new THREE.CylinderGeometry(0.02, 0.02, 0.7, 6);
    topGeo = new THREE.TorusGeometry(0.12, 0.03, 4, 12);
  } else {
    // Sparkle Wand
    rodMat = new THREE.MeshStandardMaterial({ color: 0xffaadd, roughness: 0.4 });
    topMat = new THREE.MeshStandardMaterial({ color: 0xffeef5, emissive: 0xffffff, emissiveIntensity: 0.6 });
    rodGeo = new THREE.CylinderGeometry(0.015, 0.015, 0.65, 5);
    topGeo = new THREE.BoxGeometry(0.12, 0.12, 0.12);
  }

  const rod = new THREE.Mesh(rodGeo, rodMat); rod.position.y = 0.3; rod.castShadow = true;
  const top = new THREE.Mesh(topGeo, topMat); top.position.y = 0.65;
  sg.add(rod, top);
  sg.userData.currentWeaponId = best;
}

// ─────────────────────────────────────────────────────────────────────────
// BIRDS
// ─────────────────────────────────────────────────────────────────────────
function buildBirds() {
  const wingMat = new THREE.MeshBasicMaterial({ color: 0xffa6c9 }); // Pink birds
  for (let i = 0; i < 7; i++) {
    const group = new THREE.Group();
    const wGeo  = new THREE.BoxGeometry(0.45, 0.03, 0.12);
    const lWing = new THREE.Mesh(wGeo, wingMat);
    const rWing = lWing.clone();
    lWing.position.x = -0.22; rWing.position.x = 0.22;
    group.add(lWing, rWing);
    group.position.set((Math.random() - 0.5) * 120, 28 + Math.random() * 22, (Math.random() - 0.5) * 120);
    scene.add(group);
    birds.push({
      group, lWing, rWing,
      angle: Math.random() * Math.PI * 2,
      radius: 40 + Math.random() * 70,
      height: 28 + Math.random() * 20,
      speed: 0.25 + Math.random() * 0.35,
      wingT: Math.random() * Math.PI * 2,
      cx: (Math.random() - 0.5) * 100,
      cz: (Math.random() - 0.5) * 100
    });
  }
}

function updateBirds(dt) {
  for (const b of birds) {
    b.angle  += b.speed * dt;
    b.wingT  += dt * 4.5;
    const bx = b.cx + Math.cos(b.angle) * b.radius;
    const bz = b.cz + Math.sin(b.angle) * b.radius;
    const by = b.height + Math.sin(b.angle * 3) * 4;
    b.group.position.set(bx, by, bz);
    b.group.rotation.y = -b.angle + Math.PI / 2;
    const flap = Math.sin(b.wingT) * 0.45;
    b.lWing.rotation.z =  Math.PI / 5 + flap;
    b.rWing.rotation.z = -Math.PI / 5 - flap;
  }
}

// ─────────────────────────────────────────────────────────────────────────
// CUTE GLITTER / SPARKS AMBIENT PARTICLES
// ─────────────────────────────────────────────────────────────────────────
function buildPollenSystem() {
  const count = 400;
  const geo   = new THREE.BufferGeometry();
  pollenPositions = new Float32Array(count * 3);
  for (let i = 0; i < count; i++) {
    pollenPositions[i * 3]   = (Math.random() - 0.5) * 90;
    pollenPositions[i * 3 + 1] = Math.random() * 14;
    pollenPositions[i * 3 + 2] = (Math.random() - 0.5) * 90;
  }
  geo.setAttribute('position', new THREE.BufferAttribute(pollenPositions, 3));
  const mat = new THREE.PointsMaterial({ color: 0xffa2d6, size: 0.08, transparent: true, opacity: 0.7 }); // Pastel pink/rose sparkle
  pollenSystem = new THREE.Points(geo, mat);
  scene.add(pollenSystem);
}

function updatePollen(dt) {
  if (!pollenSystem) return;
  const t = performance.now() * 0.001;
  const count = pollenPositions.length / 3;
  for (let i = 0; i < count; i++) {
    pollenPositions[i * 3]   += Math.sin(t * 0.4 + i * 2.1) * 0.3 * dt;
    pollenPositions[i * 3 + 1] += Math.sin(t * 0.6 + i * 1.7) * 0.15 * dt;
    pollenPositions[i * 3 + 2] += Math.cos(t * 0.35 + i * 1.9) * 0.25 * dt;
    if (pollenPositions[i * 3 + 1] < -1) pollenPositions[i * 3 + 1] = 14;
    if (pollenPositions[i * 3 + 1] > 16) pollenPositions[i * 3 + 1] = 0;
  }
  pollenSystem.position.set(player.pos.x, 0, player.pos.z);
  pollenSystem.geometry.attributes.position.needsUpdate = true;
}

// ─────────────────────────────────────────────────────────────────────────
// CAMPFIRES (FLOWER HEARTH)
// ─────────────────────────────────────────────────────────────────────────
function buildCampfires() {
  for (const [cx, cz] of [[70, -60], [-60, 80], [120, 150], [-100, -120], [180, -180]]) {
    createCampfireInstance(cx, cz);
  }
}

function createCampfireInstance(cx, cz) {
  const y = hillHeight(cx, cz);
  const lMat = new THREE.MeshStandardMaterial({ color: 0x826573 });
  const sGeo = new THREE.DodecahedronGeometry(0.22, 0);
  const sMat = new THREE.MeshStandardMaterial({ color: 0xffaac4, flatShading: true }); // Pink stones

  const campGroup = new THREE.Group();

  for (let i = 0; i < 4; i++) {
    const a = (i / 4) * Math.PI * 2;
    const log = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.15, 1.0, 5), lMat);
    log.position.set(Math.cos(a) * 0.35, 0.1, Math.sin(a) * 0.35);
    log.rotation.set(Math.PI / 2.2, a, 0); log.castShadow = true; campGroup.add(log);
  }
  for (let i = 0; i < 8; i++) {
    const a = (i / 8) * Math.PI * 2;
    const st = new THREE.Mesh(sGeo, sMat);
    st.position.set(Math.cos(a) * 0.8, 0.1, Math.sin(a) * 0.8);
    st.scale.set(0.8, 0.5, 0.8); campGroup.add(st);
  }

  const light = new THREE.PointLight(0xff44aa, 3.0, 20); // Magical pink glow
  light.position.set(0, 1.5, 0); campGroup.add(light);

  const fMat = new THREE.MeshBasicMaterial({ color: 0xff77bb, transparent: true, opacity: 0.85 });
  const flame = new THREE.Mesh(new THREE.ConeGeometry(0.25, 0.85, 6), fMat);
  flame.position.set(0, 0.85, 0); campGroup.add(flame);

  campGroup.position.set(cx, y, cz);
  scene.add(campGroup);

  campfires.push({ x: cx, z: cz, light, flame, fMat, t: Math.random() * Math.PI * 2 });
}

function updateCampfires(dt) {
  let nearFire = false;
  for (const cf of campfires) {
    cf.t += dt;
    cf.light.intensity = 2.5 + Math.sin(cf.t * 8) * 0.7 + Math.sin(cf.t * 13) * 0.3;
    const sc = 0.8 + Math.sin(cf.t * 7) * 0.22;
    cf.flame.scale.set(sc, 0.85 + Math.sin(cf.t * 5) * 0.18, sc);
    cf.fMat.opacity = 0.7 + Math.sin(cf.t * 6) * 0.15;
    if (Math.hypot(player.pos.x - cf.x, player.pos.z - cf.z) < 5.5) {
      nearFire = true;
      if (stats.hp < stats.maxHp) { stats.hp = Math.min(stats.maxHp, stats.hp + dt * 8); updateHud(); }
    }
  }
  const ind = document.getElementById('campfire-indicator');
  if (ind) ind.style.display = nearFire ? 'flex' : 'none';
}

// ─────────────────────────────────────────────────────────────────────────
// TREASURE CHESTS
// ─────────────────────────────────────────────────────────────────────────
function buildChests() {
  for (const [cx, cz] of [[40, 40], [-80, -50], [160, 30], [-200, 100], [30, -180]]) {
    const y = hillHeight(cx, cz);
    const cMat = new THREE.MeshStandardMaterial({ color: 0x8a6f88, roughness: 0.7, metalness: 0.1 });
    const rMat = new THREE.MeshStandardMaterial({ color: 0xffd166, metalness: 0.8, roughness: 0.2 });
    const body = new THREE.Mesh(new THREE.BoxGeometry(0.8, 0.5, 0.5), cMat); body.position.set(cx, y + 0.35, cz); body.castShadow = true; scene.add(body);
    const rim = new THREE.Mesh(new THREE.BoxGeometry(0.85, 0.06, 0.55), rMat); rim.position.set(cx, y + 0.61, cz); scene.add(rim);
    const glow = new THREE.PointLight(0xffaae2, 0.8, 6); glow.position.set(cx, y + 1, cz); scene.add(glow);
    chests.push({ x: cx, z: cz, body, rim, glow, opened: false });
  }
}

function checkChestOpen() {
  for (const ch of chests) {
    if (ch.opened) continue;
    if (Math.hypot(player.pos.x - ch.x, player.pos.z - ch.z) < 2.5) {
      ch.opened = true;
      ch.rim.position.y += 0.25; ch.rim.rotation.x = -Math.PI / 4; ch.glow.intensity = 0;
      const cnt = 1 + Math.floor(Math.random() * 2);
      for (let i = 0; i < cnt; i++) spawnLootDrop(new THREE.Vector3(ch.x + (Math.random() - 0.5) * 1.5, groundHeightAt(ch.x, ch.z) + 0.5, ch.z + (Math.random() - 0.5) * 1.5));
      const gold = 10 + Math.floor(Math.random() * 30) * stats.level;
      stats.gold += gold;
      showNotification(`💰 Magical Box! +${gold} gold`, 2500, '#ff99dd');
      updateHud();
      break;
    }
  }
}

// ─────────────────────────────────────────────────────────────────────────
// CONSTRUCTION / PLACEMENT SYSTEM
// ─────────────────────────────────────────────────────────────────────────
function toggleBuildMode() {
  if (!gameActive || gamePaused) return;
  buildMode = !buildMode;
  showNotification(buildMode ? 'BUILD MODE ACTIVE (Press 1/2, Left Click to place)' : 'Build Mode deactivated.', 2500, buildMode ? '#ff88dd' : '#aaaaaa');
  
  if (buildMode) createBuildGhost();
  else removeBuildGhost();
  
  document.getElementById('build-overlay').style.display = buildMode ? 'block' : 'none';
  updateBuildOverlay();
}

function createBuildGhost() {
  removeBuildGhost();
  const mat = new THREE.MeshBasicMaterial({ color: 0xff77cc, transparent: true, opacity: 0.45 });
  buildGhost = new THREE.Group();

  if (selectedBuildItem === 'campfire') {
    const ring = new THREE.Mesh(new THREE.TorusGeometry(0.8, 0.08, 6, 24), mat);
    ring.rotateX(Math.PI / 2);
    buildGhost.add(ring);
  } else if (selectedBuildItem === 'wall') {
    const wall = new THREE.Mesh(new THREE.BoxGeometry(2.6, 1.4, 0.4), mat);
    wall.position.y = 0.7;
    buildGhost.add(wall);
  }
  scene.add(buildGhost);
}

function removeBuildGhost() {
  if (buildGhost) {
    scene.remove(buildGhost);
    buildGhost = null;
  }
}

function selectBuildItem(type) {
  if (!buildMode) return;
  selectedBuildItem = type;
  createBuildGhost();
  updateBuildOverlay();
  showNotification(`Selected ${BUILD_DEFS[type].name}`, 1500, '#ff88cc');
}

function updateBuildOverlay() {
  const d = BUILD_DEFS[selectedBuildItem];
  document.getElementById('build-name').textContent = d.name.toUpperCase();
  document.getElementById('build-cost').textContent = `Cost: ${d.woodCost} logs`;
  document.getElementById('build-wood-current').textContent = `You have: ${stats.wood} logs`;
}

function confirmPlacement() {
  const def = BUILD_DEFS[selectedBuildItem];
  if (stats.wood < def.woodCost) {
    showNotification('❌ Need more logs!', 2000, '#ff55aa');
    return;
  }

  stats.wood -= def.woodCost;
  playSound('build');

  const bx = buildGhost.position.x;
  const bz = buildGhost.position.z;
  const by = groundHeightAt(bx, bz);

  let placedMesh;
  if (selectedBuildItem === 'campfire') {
    createCampfireInstance(bx, bz);
    const campG = new THREE.Group();
    placedMesh = campG;
  } else if (selectedBuildItem === 'wall') {
    // Pastel Pink Wooden Fence
    const mat = new THREE.MeshStandardMaterial({ color: 0xffaad4, roughness: 0.95 });
    const geo = new THREE.BoxGeometry(2.6, 1.4, 0.4);
    placedMesh = new THREE.Mesh(geo, mat);
    placedMesh.castShadow = true;
    placedMesh.receiveShadow = true;
    placedMesh.position.set(bx, by + 0.7, bz);
    placedMesh.rotation.y = yaw;
    scene.add(placedMesh);
  }

  placedStructures.push({
    mesh: placedMesh,
    type: selectedBuildItem,
    hp: def.hp,
    x: bx,
    z: bz,
    yaw: yaw,
    radius: def.radius
  });

  showNotification(`Placed ${def.name}!`, 2000, '#ff99dd');
  updateHud();
  updateBuildOverlay();
}

// ─────────────────────────────────────────────────────────────────────────
// ENEMIES & MAGICAL BOSS VARIANT
// ─────────────────────────────────────────────────────────────────────────
function pickEnemyType() {
  const pool = [];
  for (const [key, def] of Object.entries(ENEMY_TYPES)) {
    for (let i = 0; i < def.weight; i++) pool.push(key);
  }
  return pool[Math.floor(Math.random() * pool.length)];
}

function spawnEnemies(n) { for (let i = 0; i < n; i++) spawnOneEnemy(); }

function spawnOneEnemy(typeKey) {
  const key = typeKey || pickEnemyType(), def = ENEMY_TYPES[key], s = def.scale;
  const mat = new THREE.MeshStandardMaterial({
    color: def.color, emissive: def.emissive, emissiveIntensity: 1, roughness: 0.7,
    ...(def.transparent ? { transparent: true, opacity: def.opacity } : {})
  });
  const mesh = new THREE.Mesh(new THREE.CapsuleGeometry(0.32 * s, 0.78 * s, 4, 8), mat);
  mesh.castShadow = true;

  let x, z;
  do {
    x = (Math.random() - 0.5) * WORLD.size * 0.8;
    z = (Math.random() - 0.5) * WORLD.size * 0.8;
  } while (Math.hypot(x - player.pos.x, z - player.pos.z) < 28);
  mesh.position.set(x, groundHeightAt(x, z) + 0.85 * s, z);
  scene.add(mesh);

  const eyeCol = key === 'wraith' ? 0xff88ee : key === 'elite' ? 0xff44aa : key === 'archer' ? 0xccff66 : 0xff2a2a;
  const eyeMat = new THREE.MeshBasicMaterial({ color: eyeCol });
  for (const ex of [-0.11 * s, 0.11 * s]) {
    const e = new THREE.Mesh(new THREE.SphereGeometry(0.055 * s, 5, 5), eyeMat);
    e.position.set(ex, 0.46 * s, 0.28 * s); mesh.add(e);
  }

  if (key === 'archer') {
    const bow = new THREE.Mesh(new THREE.TorusGeometry(0.3, 0.03, 4, 12, Math.PI), new THREE.MeshStandardMaterial({ color: 0x8a6f88 }));
    bow.position.set(0.4, 0.5 * s, 0.1); bow.rotation.y = Math.PI / 2; mesh.add(bow);
  }

  const maxHp = def.baseHp + stats.level * 4;
  enemies.push({ mesh, key, def, s, hp: maxHp, maxHp, speed: def.speed + Math.random() * 0.5, state: 'idle', hitCooldown: 0, shootCooldown: 0, damagedTimer: 0, isBoss: false, strafeDir: Math.random() < 0.5 ? 1 : -1 });
}

function spawnBoss() {
  if (bossActive) return;
  bossActive = true;
  playSound('boss');
  
  const isVolcanic = stats.kills >= 20;
  const label = isVolcanic ? 'Starry Dragon' : 'Shadow Overlord';
  const color = isVolcanic ? 0xff66b2 : 0x7a40c0;
  const emissive = isVolcanic ? 0xaa0066 : 0x2a0050;

  showNotification(`⚠  ${label.toUpperCase()} APPROACHES  ⚠`, 3500, '#ff33aa');
  
  const def = { ...BOSS_DEF, label, color, emissive };
  const s = def.scale;
  const mat = new THREE.MeshStandardMaterial({ color: def.color, emissive: def.emissive, emissiveIntensity: 1, roughness: 0.5, metalness: 0.1 });
  const mesh = new THREE.Mesh(new THREE.CapsuleGeometry(0.32 * s, 0.78 * s, 4, 8), mat); mesh.castShadow = true;
  const a = Math.random() * Math.PI * 2, d = 45 + Math.random() * 20;
  const x = player.pos.x + Math.cos(a) * d, z = player.pos.z + Math.sin(a) * d;
  mesh.position.set(x, groundHeightAt(x, z) + 0.85 * s, z); scene.add(mesh);
  
  const sMat = new THREE.MeshStandardMaterial({ color: 0xffcc00, metalness: 0.9, roughness: 0.1 });
  for (let i = 0; i < 6; i++) {
    const ang = (i / 6) * Math.PI * 2, sp = new THREE.Mesh(new THREE.ConeGeometry(0.13, 0.7, 5), sMat);
    sp.position.set(Math.cos(ang) * 0.58 * s, 1.28 * s, Math.sin(ang) * 0.58 * s);
    sp.rotation.z = Math.cos(ang) * 0.5; sp.rotation.x = Math.sin(ang) * 0.5; mesh.add(sp);
  }
  const eM = new THREE.MeshBasicMaterial({ color: 0xff00aa });
  for (const ex of [-0.15 * s, 0.15 * s]) {
    const e = new THREE.Mesh(new THREE.SphereGeometry(0.08 * s, 6, 6), eM);
    e.position.set(ex, 0.46 * s, 0.28 * s); mesh.add(e);
  }
  const maxHp = def.baseHp + stats.level * 20;
  enemies.push({
    mesh, key: 'boss', def, s, hp: maxHp, maxHp, speed: def.speed,
    state: 'chase', hitCooldown: 0, shootCooldown: 0, damagedTimer: 0,
    isBoss: true, isVolcanic, meteorTimer: 3.5, strafeDir: 1
  });
  
  document.getElementById('boss-bar').style.display = 'block';
  document.getElementById('boss-name').textContent = `⚔ ${label.toUpperCase()} ⚔`;
}

function refreshBossBar() {
  const boss = enemies.find(e => e.isBoss && e.hp > 0), bar = document.getElementById('boss-bar');
  if (!boss) { bar.style.display = 'none'; return; }
  bar.style.display = 'block';
  document.getElementById('boss-fill').style.width = Math.max(0, (boss.hp / boss.maxHp) * 100) + '%';
}

// ─────────────────────────────────────────────────────────────────────────
// TELEGRAPHED METEORS (Magical Pink Star Meteors)
// ─────────────────────────────────────────────────────────────────────────
function spawnMeteorTelegraph(targetPos) {
  const rGeo = new THREE.RingGeometry(0.1, 2.2, 24);
  const rMat = new THREE.MeshBasicMaterial({ color: 0xff66cc, side: THREE.DoubleSide, transparent: true, opacity: 0.75 });
  const ring = new THREE.Mesh(rGeo, rMat);
  ring.rotation.x = -Math.PI / 2;
  ring.position.copy(targetPos);
  ring.position.y = groundHeightAt(targetPos.x, targetPos.z) + 0.15;
  scene.add(ring);

  // Pink Star mesh
  const mGeo = new THREE.SphereGeometry(0.5, 5, 5);
  const mMat = new THREE.MeshStandardMaterial({ color: 0xff33aa, emissive: 0xff00bb, emissiveIntensity: 1.5 });
  const mMesh = new THREE.Mesh(mGeo, mMat);
  mMesh.position.set(targetPos.x + (Math.random() - 0.5) * 5, targetPos.y + 40, targetPos.z + (Math.random() - 0.5) * 5);
  scene.add(mMesh);

  meteors.push({ ring, mMesh, targetPos, timer: 1.6, initHeight: targetPos.y + 40 });
}

function updateMeteors(dt) {
  for (const m of meteors) {
    m.timer -= dt;
    const progress = Math.max(0, m.timer) / 1.6;
    m.mMesh.position.y = m.targetPos.y + progress * 40;
    m.mMesh.position.x = THREE.MathUtils.lerp(m.targetPos.x, m.mMesh.position.x, progress);
    m.mMesh.position.z = THREE.MathUtils.lerp(m.targetPos.z, m.mMesh.position.z, progress);

    m.ring.material.opacity = 0.35 + Math.sin(progress * 25) * 0.4;

    if (m.timer <= 0) {
      playSound('meteor');
      triggerScreenShake(0.85);
      spawnBurst(m.targetPos, 0xff77dd, 28);
      scene.remove(m.ring);
      scene.remove(m.mMesh);
      m.ring.geometry.dispose(); m.ring.material.dispose();
      m.mMesh.geometry.dispose(); m.mMesh.material.dispose();

      if (player.pos.distanceTo(m.targetPos) < 3.2 && !player.invincible) {
        const dmg = Math.floor(25 * (1 - perks.fortress * 0.2));
        stats.hp = Math.max(0, stats.hp - dmg);
        flashDamage();
        updateHud();
        if (stats.hp <= 0) onPlayerDeath();
      }

      for (const st of placedStructures) {
        if (st.hp > 0 && Math.hypot(st.x - m.targetPos.x, st.z - m.targetPos.z) < 3.2) {
          st.hp -= 40;
        }
      }

      m.dead = true;
    }
  }
  meteors = meteors.filter(m => !m.dead);
}

// ─────────────────────────────────────────────────────────────────────────
// POTIONS
// ─────────────────────────────────────────────────────────────────────────
function spawnPotions(n) { for (let i = 0; i < n; i++) spawnOnePotion(); }
function spawnOnePotion() {
  const geo = new THREE.SphereGeometry(0.22, 8, 8);
  const mat = new THREE.MeshStandardMaterial({ color: 0xff33bb, emissive: 0xaa00aa, emissiveIntensity: 0.9, transparent: true, opacity: 0.92 }); // Pink potions
  const mesh = new THREE.Mesh(geo, mat);
  const x = (Math.random() - 0.5) * WORLD.size * 0.75, z = (Math.random() - 0.5) * WORLD.size * 0.75;
  mesh.position.set(x, groundHeightAt(x, z) + 0.9, z);
  const ring = new THREE.Mesh(new THREE.TorusGeometry(0.38, 0.04, 6, 20), new THREE.MeshBasicMaterial({ color: 0xffaae2, transparent: true, opacity: 0.55 }));
  mesh.add(ring); scene.add(mesh);
  potions.push({ mesh, ring, value: 35 + Math.floor(Math.random() * 25) });
}

// ─────────────────────────────────────────────────────────────────────────
// PROJECTILES (Spawning Heart Shot projectiles)
// ─────────────────────────────────────────────────────────────────────────
function spawnProjectile(pos, dir, owner, damage, type) {
  let mesh;
  if (type === 'light_arrow') {
    mesh = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 0.8, 5), new THREE.MeshStandardMaterial({ color: 0xffdd44, emissive: 0xffaa00, emissiveIntensity: 1.2 }));
    mesh.rotation.x = Math.PI / 2;
  } else if (type === 'fireball') {
    // Sparkly Heart shape projectile
    mesh = new THREE.Mesh(new THREE.SphereGeometry(0.24, 6, 6), new THREE.MeshStandardMaterial({ color: 0xff33aa, emissive: 0xff00bb, emissiveIntensity: 1.8, transparent: true, opacity: 0.9 }));
  } else {
    mesh = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 0.75, 4), new THREE.MeshStandardMaterial({ color: 0xa988a6 }));
    mesh.rotation.x = Math.PI / 2;
  }
  mesh.position.copy(pos); scene.add(mesh);
  projectiles.push({ mesh, vel: dir.clone().multiplyScalar(type === 'fireball' ? 20 : type === 'light_arrow' ? 24 : 16), owner, damage, type, life: 3.5, trailT: 0 });
  if (type === 'fireball' || type === 'light_arrow') playSound('fireball');
}

function updateProjectiles(dt) {
  for (const p of projectiles) {
    p.life -= dt; if (p.life <= 0) continue;
    p.mesh.position.addScaledVector(p.vel, dt);
    
    if (p.type === 'arrow' || p.type === 'light_arrow') {
      p.vel.y -= 4 * dt;
      if (p.vel.length() > 0.1) p.mesh.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), p.vel.clone().normalize());
    }
    
    if (p.type === 'fireball' || p.type === 'light_arrow') {
      p.trailT -= dt;
      if (p.trailT <= 0) { p.trailT = 0.05; spawnBurst(p.mesh.position.clone(), 0xffaae2, 4); }
    }

    const gY = groundHeightAt(p.mesh.position.x, p.mesh.position.z);
    if (p.mesh.position.y < gY) {
      if (p.type === 'fireball' || p.type === 'light_arrow') {
        spawnBurst(p.mesh.position.clone(), 0xff33aa, 20);
        for (const en of enemies) {
          if (en.hp <= 0) continue;
          if (en.mesh.position.distanceTo(p.mesh.position) < 3) damageEnemy(en, Math.floor(p.damage * 0.6), false);
        }
      }
      p.life = 0; continue;
    }

    let hitWall = false;
    for (const st of placedStructures) {
      if (st.type === 'wall' && st.hp > 0 && Math.hypot(st.x - p.mesh.position.x, st.z - p.mesh.position.z) < st.radius) {
        st.hp -= p.damage;
        hitWall = true;
        p.life = 0;
        break;
      }
    }
    if (hitWall) continue;

    if (p.owner === 'player') {
      for (const en of enemies) {
        if (en.hp <= 0) continue;
        if (en.mesh.position.distanceTo(p.mesh.position) < 1.1 * en.s) {
          const ic = Math.random() < 0.15;
          damageEnemy(en, Math.floor(p.damage * (ic ? 2 : 1)), ic);
          if (p.type === 'fireball' || p.type === 'light_arrow') spawnBurst(p.mesh.position.clone(), 0xff66b2, 18);
          p.life = 0; break;
        }
      }
    } else if (p.owner === 'enemy') {
      if (!player.invincible && p.mesh.position.distanceTo(player.pos) < 1.3) {
        const dmg = Math.floor(p.damage * (1 - perks.fortress * 0.2));
        stats.hp = Math.max(0, stats.hp - dmg); flashDamage(); playSound('hit'); updateHud();
        if (stats.hp <= 0) onPlayerDeath(); p.life = 0;
      }
    }
  }
  for (const p of projectiles.filter(p => p.life <= 0)) { scene.remove(p.mesh); p.mesh.geometry.dispose(); p.mesh.material.dispose(); }
  projectiles = projectiles.filter(p => p.life > 0);
}

// ─────────────────────────────────────────────────────────────────────────
// LOOT
// ─────────────────────────────────────────────────────────────────────────
function dropLoot(pos, key) {
  const r = key === 'boss' ? 1 : key === 'elite' ? 0.65 : key === 'brute' ? 0.4 : key === 'archer' ? 0.35 : 0.22;
  if (Math.random() > r) return;
  if (key === 'boss') { for (let i = 0; i < 3; i++) spawnLootDrop(pos.clone().add(new THREE.Vector3((Math.random() - 0.5) * 3, 0, (Math.random() - 0.5) * 3))); return; }
  spawnLootDrop(pos);
}

function spawnLootDrop(pos) {
  const item = ITEM_POOL[Math.floor(Math.random() * ITEM_POOL.length)];
  const col = { common: 0xffaacc, uncommon: 0xd680ff, rare: 0xff44aa, epic: 0xcc44ff }[item.rarity] || 0xffaacc;
  const mat = new THREE.MeshStandardMaterial({ color: col, emissive: col, emissiveIntensity: 0.6, metalness: 0.7, roughness: 0.2 });
  const mesh = new THREE.Mesh(new THREE.OctahedronGeometry(0.2, 0), mat);
  mesh.position.copy(pos); mesh.position.y = groundHeightAt(pos.x, pos.z) + 0.6;
  const ring = new THREE.Mesh(new THREE.TorusGeometry(0.3, 0.03, 6, 16), new THREE.MeshBasicMaterial({ color: col, transparent: true, opacity: 0.5 }));
  mesh.add(ring); scene.add(mesh);
  lootDrops.push({ mesh, ring, item, life: 35 });
}

function updateLoot(dt) {
  const t = performance.now() * 0.001;
  for (const ld of lootDrops) {
    ld.life -= dt; ld.mesh.rotation.y += dt * 2;
    ld.mesh.position.y = groundHeightAt(ld.mesh.position.x, ld.mesh.position.z) + 0.6 + Math.sin(t * 3 + ld.mesh.position.x) * 0.12;
    ld.ring.rotation.z += dt * 1.5;
    if (ld.mesh.position.distanceTo(player.pos) < 1.6) {
      collectItem(ld.item); scene.remove(ld.mesh); ld.mesh.geometry.dispose(); ld.mesh.material.dispose(); ld.life = 0;
    }
  }
  lootDrops = lootDrops.filter(l => l.life > 0);
}

function collectItem(item) {
  playSound('loot'); inventory.push({ ...item });
  switch (item.type) {
    case 'armor':   stats.maxHp += item.bonus; stats.hp = Math.min(stats.hp + item.bonus, stats.maxHp); break;
    case 'trinket': if (item.id === 'mana_gem') stats.maxMp += item.bonus; if (item.id === 'swift_boots') { player.speed += item.bonus; } break;
    case 'potion':  stats.hp = Math.min(stats.maxHp, stats.hp + item.bonus); break;
    case 'weapon':  rebuildWeaponMesh(); break;
  }
  showNotification(`${item.icon} ${item.name} — ${item.desc}`, 2200, RARITY_COLORS[item.rarity]);
  updateHud(); updateInventoryPanel();
}
function getWeaponBonus() { return inventory.filter(i => i.type === 'weapon').reduce((s, i) => s + i.bonus, 0); }
function getCritBonus() { return (perks.shadow * 12 + inventory.filter(i => i.id === 'gold_ring').length * 10) / 100; }

function updateInventoryPanel() {
  const grid = document.getElementById('inventory-grid');
  if (!grid) return;
  if (!inventory.length) { grid.innerHTML = '<div class="inv-empty">No items yet.</div>'; return; }
  grid.innerHTML = inventory.map(it => `<div class="inv-item" style="border-color:${RARITY_COLORS[it.rarity]}" title="${it.desc}"><div class="inv-icon">${it.icon}</div><div class="inv-name" style="color:${RARITY_COLORS[it.rarity]}">${it.name}</div><div class="inv-stat">${it.desc}</div></div>`).join('');
}

// ─────────────────────────────────────────────────────────────────────────
// PLACED STRUCTURES DESTRUCTION
// ─────────────────────────────────────────────────────────────────────────
function updatePlacedStructures(dt) {
  for (const st of placedStructures) {
    if (st.hp <= 0 && !st.dead) {
      st.dead = true;
      spawnBurst(new THREE.Vector3(st.x, groundHeightAt(st.x, st.z) + 0.5, st.z), 0xffaad4, 15);
      scene.remove(st.mesh);
    }
  }
  placedStructures = placedStructures.filter(st => !st.dead);
}

// ─────────────────────────────────────────────────────────────────────────
// WEATHER
// ─────────────────────────────────────────────────────────────────────────
function updateWeather(dt) {
  weatherTimer -= dt;
  if (weatherTimer <= 0) {
    const c = ['clear', 'clear', 'rain', 'storm', 'fog'];
    setWeather(c[Math.floor(Math.random() * c.length)]);
    weatherTimer = 80 + Math.random() * 100;
  }
  if (rainSystem) updateRain(dt);
  if (weather === 'storm') { lightningTimer -= dt; if (lightningTimer <= 0) { triggerLightning(); lightningTimer = 4 + Math.random() * 8; } }
  const badge = document.getElementById('weather-badge');
  if (badge) { const ic = { clear: '', rain: '🌧', storm: '⛈', fog: '🌫' }; badge.textContent = (ic[weather] || '') + (weather !== 'clear' ? ' ' + weather.toUpperCase() : ''); badge.style.display = weather === 'clear' ? 'none' : 'flex'; }
}

function setWeather(w) {
  if (w === weather) return;
  weather = w; removeRain();
  if (w === 'rain')  { scene.fog.density = 0.004; createRain(800, '#ffc4db', 0.55); } // Pink rain
  else if (w === 'storm') { scene.fog.density = 0.006; createRain(2000, '#ffccd4', 0.7); lightningTimer = 2; }
  else if (w === 'fog')  { scene.fog.density = 0.009; }
  else                { scene.fog.density = 0.0022; }
  if (w !== 'clear') showNotification('Weather: ' + w.toUpperCase(), 2500, '#ff77aa');
}
function createRain(count, col, op) {
  const geo = new THREE.BufferGeometry(); rainPositions = new Float32Array(count * 3);
  for (let i = 0; i < count; i++) { rainPositions[i * 3] = (Math.random() - 0.5) * 80; rainPositions[i * 3 + 1] = Math.random() * 55; rainPositions[i * 3 + 2] = (Math.random() - 0.5) * 80; }
  geo.setAttribute('position', new THREE.BufferAttribute(rainPositions, 3));
  rainSystem = new THREE.Points(geo, new THREE.PointsMaterial({ color: new THREE.Color(col), size: 0.09, transparent: true, opacity: op }));
  scene.add(rainSystem);
}
function updateRain(dt) {
  if (!rainSystem || !rainPositions) return;
  const spd = weather === 'storm' ? 28 : 16, cnt = rainPositions.length / 3;
  for (let i = 0; i < cnt; i++) { rainPositions[i * 3 + 1] -= spd * dt; if (rainPositions[i * 3 + 1] < -2) { rainPositions[i * 3] = (Math.random() - 0.5) * 80; rainPositions[i * 3 + 1] = 55 + Math.random() * 5; rainPositions[i * 3 + 2] = (Math.random() - 0.5) * 80; } }
  rainSystem.position.set(player.pos.x, 0, player.pos.z);
  rainSystem.geometry.attributes.position.needsUpdate = true;
}
function removeRain() { if (rainSystem) { scene.remove(rainSystem); rainSystem.geometry.dispose(); rainSystem.material.dispose(); rainSystem = null; rainPositions = null; } }
function triggerLightning() {
  const orig = scene.background.clone();
  scene.background.set(0xffebf4); hemiLight.intensity += 4;
  const fl = new THREE.PointLight(0xffaae2, 40, 120);
  fl.position.set(player.pos.x + (Math.random() - 0.5) * 80, 65, player.pos.z + (Math.random() - 0.5) * 80);
  scene.add(fl);
  setTimeout(() => { scene.background.copy(orig); hemiLight.intensity = Math.max(0.2, hemiLight.intensity - 4); scene.remove(fl); }, 110);
}

// ─────────────────────────────────────────────────────────────────────────
// PERKS
// ─────────────────────────────────────────────────────────────────────────
function showPerkSelection() {
  gamePaused = true;
  if (document.pointerLockElement) document.exitPointerLock();
  const keys = Object.keys(PERK_DEFS).sort(() => Math.random() - 0.5).slice(0, 3);
  const modal = document.getElementById('perk-modal');
  document.getElementById('perk-options').innerHTML = keys.map(k => {
    const p = PERK_DEFS[k];
    return `<div class="perk-card" data-key="${k}" style="border-color:${p.color}"><div class="perk-icon">${p.icon}</div><div class="perk-name" style="color:${p.color}">${p.name}</div><div class="perk-desc">${p.desc}</div><div class="perk-lv">${perks[k] > 0 ? `Lv ${perks[k]}→${perks[k] + 1}` : 'NEW'}</div></div>`;
  }).join('');
  modal.style.display = 'flex';
  modal.querySelectorAll('.perk-card').forEach(card => {
    card.onclick = () => { applyPerk(card.dataset.key); modal.style.display = 'none'; gamePaused = false; setTimeout(() => { const p = renderer.domElement.requestPointerLock(); if (p && p.catch)p.catch(() => {}); }, 100); };
  });
}

function applyPerk(key) {
  perks[key]++;
  playSound('perk');
  showNotification(`${PERK_DEFS[key].icon} ${PERK_DEFS[key].name} upgraded!`, 2500, PERK_DEFS[key].color);
  if (key === 'vitality') { stats.maxHp += 30; stats.hp = Math.min(stats.hp + 30, stats.maxHp); }
  if (key === 'swift') { player.speed = 6.5 + perks.swift * 1.0; player.sprint = 12 + perks.swift * 1.5; }
  updateHud();
}
function getCooldownMult() { return Math.max(0.3, 1 - perks.mage * 0.2); }

// ─────────────────────────────────────────────────────────────────────────
// QUESTS
// ─────────────────────────────────────────────────────────────────────────
function updateQuestProgress(type, value = 1) {
  for (const q of quests) {
    if (q.complete) continue;
    if (q.id === type) {
      q.current = Math.min(q.goal, q.current + value);
      if (q.current >= q.goal) completeQuest(q);
      updateQuestUI();
    }
  }
  if (type === 'kill') updateQuestProgress('hunt', value);
  if (type === 'level') { quests.find(q => q.id === 'level').current = stats.level; updateQuestUI(); }
}

function completeQuest(q) {
  q.complete = true;
  playSound('quest');
  showNotification(`✅ Quest Complete: ${q.title}!`, 4000, '#ff77aa');
  switch (q.reward) {
    case 'perk':   setTimeout(() => showPerkSelection(), 500); break;
    case 'hp50':   stats.maxHp += 50; stats.hp = stats.maxHp; updateHud(); break;
    case 'xp500':  gainXp(500); break;
  }
  const nextIdx = quests.findIndex(q2 => !q2.complete);
  activeQuestIdx = nextIdx >= 0 ? nextIdx : activeQuestIdx;
  updateQuestUI();
}

function updateQuestUI() {
  const q = quests[activeQuestIdx];
  if (!q) { document.getElementById('quest-tracker').style.display = 'none'; return; }
  document.getElementById('quest-tracker').style.display = 'block';
  document.getElementById('quest-title').textContent = q.title;
  document.getElementById('quest-desc').textContent = q.desc;
  document.getElementById('quest-count').textContent = q.current + '/' + q.goal;
  document.getElementById('quest-progress').style.width = Math.min(100, (q.current / q.goal) * 100) + '%';
}

// ─────────────────────────────────────────────────────────────────────────
// MAGIC PARTICLES
// ─────────────────────────────────────────────────────────────────────────
function spawnBurst(pos, color, count = 22) {
  const geo = new THREE.BufferGeometry(), positions = new Float32Array(count * 3), vel = [];
  for (let i = 0; i < count; i++) { positions[i * 3] = pos.x; positions[i * 3 + 1] = pos.y + 0.5; positions[i * 3 + 2] = pos.z; vel.push(new THREE.Vector3((Math.random() - 0.5) * 6, Math.random() * 6 + 1, (Math.random() - 0.5) * 6)); }
  geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  const mat = new THREE.PointsMaterial({ color, size: 0.26, transparent: true, opacity: 1 });
  const pts = new THREE.Points(geo, mat); scene.add(pts);
  particles.push({ pts, vel, life: 1.0, geo, mat, positions });
}

function updateParticles(dt) {
  for (const p of particles) {
    p.life -= dt * 1.8; p.mat.opacity = Math.max(0, p.life);
    for (let i = 0; i < p.vel.length; i++) { p.vel[i].y -= 14 * dt; p.positions[i * 3] += p.vel[i].x * dt; p.positions[i * 3 + 1] += p.vel[i].y * dt; p.positions[i * 3 + 2] += p.vel[i].z * dt; }
    p.geo.attributes.position.needsUpdate = true;
  }
  for (const p of particles.filter(p => p.life <= 0)) { scene.remove(p.pts); p.geo.dispose(); p.mat.dispose(); }
  particles = particles.filter(p => p.life > 0);
}

// ─────────────────────────────────────────────────────────────────────────
// DAMAGE NUMBERS
// ─────────────────────────────────────────────────────────────────────────
function showDamageNumber(worldPos, amount, isCrit, isHeal) {
  const el = document.createElement('div');
  el.className = 'dmg-num' + (isCrit ? ' crit' : '') + (isHeal ? ' heal' : '');
  el.textContent = (isCrit ? '★ ' : (isHeal ? '+' : '')) + amount;
  document.getElementById('dmg-container').appendChild(el);
  damageNumbers.push({ el, worldPos: worldPos.clone(), life: 1.3, maxLife: 1.3 });
}

function updateDamageNumbers(dt) {
  for (const dn of damageNumbers) {
    dn.life -= dt;
    const v = dn.worldPos.clone().project(camera);
    const x = (v.x * 0.5 + 0.5) * innerWidth, y = (-v.y * 0.5 + 0.5) * innerHeight;
    const rise = (1 - dn.life / dn.maxLife) * 65;
    dn.el.style.left = x + 'px'; dn.el.style.top = (y - rise) + 'px'; dn.el.style.opacity = Math.max(0, dn.life / dn.maxLife);
    if (dn.life <= 0) dn.el.remove();
  }
  damageNumbers = damageNumbers.filter(d => d.life > 0);
}

// ─────────────────────────────────────────────────────────────────────────
// NOTIFICATIONS
// ─────────────────────────────────────────────────────────────────────────
function showNotification(msg, duration = 2200, color = '#ff66aa') {
  const el = document.getElementById('notification');
  el.textContent = msg; el.style.color = color; el.style.opacity = 1;
  clearTimeout(el._t); el._t = setTimeout(() => { el.style.opacity = 0; }, duration);
}

// ─────────────────────────────────────────────────────────────────────────
// COMBAT — MAGICAL WAND SHOTS / ATTACKS
// ─────────────────────────────────────────────────────────────────────────
function tryAttack() {
  if (attackCooldown > 0 || stats.hp <= 0) return;
  attackCooldown = Math.max(0.25, 0.42 - perks.warrior * 0.02);
  if (activeStance === 'bow') {
    spawnProjectile(
      new THREE.Vector3(player.pos.x, player.pos.y + 1.4, player.pos.z),
      new THREE.Vector3(Math.sin(yaw) * Math.cos(pitch), Math.sin(pitch) + 0.02, Math.cos(yaw) * Math.cos(pitch)).normalize(),
      'player', Math.floor((14 + getWeaponBonus() + perks.warrior * 5) * (abilities.pact.active ? 1.5 : 1.0)), 'light_arrow'
    );
    return;
  }
  playSound('attack');

  const sg = playerMesh.userData.swordGroup;
  if (sg) { sg.rotation.x = -Math.PI / 2.2; setTimeout(() => { if (sg) sg.rotation.x = 0; }, 160); }

  const fwd = new THREE.Vector3(Math.sin(yaw), 0, Math.cos(yaw));
  let hitAny = false;

  for (const en of enemies) {
    if (en.hp <= 0) continue;
    const toEn = new THREE.Vector3().subVectors(en.mesh.position, player.pos);
    if (toEn.length() < 3.5 * en.s && toEn.normalize().dot(fwd) > 0.20) {
      const base = 12 + getWeaponBonus() + Math.floor(Math.random() * 8) + Math.floor(stats.level * 1.8) + perks.warrior * 8;
      const pactM = abilities.pact.active ? 1.5 : 1;
      const berkM = perks.berserker > 0 && stats.hp < stats.maxHp * 0.3 ? 1 + perks.berserker * 0.4 : 1;
      const isCrit = Math.random() < 0.14 + getCritBonus();
      const dmg = Math.floor(base * pactM * berkM * (isCrit ? 2 : 1));
      damageEnemy(en, dmg, isCrit);
      if (perks.vampire > 0) { stats.hp = Math.min(stats.maxHp, stats.hp + Math.floor(dmg * perks.vampire * 0.12)); updateHud(); }
      hitAny = true;
    }
  }

  for (const tree of choppableTrees) {
    if (tree.hp <= 0) continue;
    const dist = Math.hypot(player.pos.x - tree.x, player.pos.z - tree.z);
    if (dist < 4.0 && fwd.dot(new THREE.Vector3(tree.x - player.pos.x, 0, tree.z - player.pos.z).normalize()) > 0.15) {
      playSound('chop');
      tree.hp--;
      showDamageNumber(new THREE.Vector3(tree.x, hillHeight(tree.x, tree.z) + 3.5, tree.z), '✨', false, false);
      if (tree.hp <= 0) {
        scene.remove(tree.group); stats.wood++;
        updateHud();
        updateQuestProgress('chop');
        showNotification('🪵 Logs gathered! (' + stats.wood + ')', 1500, '#ff99dd');
        setTimeout(() => {
          const treeG = Math.random() < 0.5 ? buildOakTree(tree.x, tree.z, tree.s) : buildPineTree(tree.x, tree.z, tree.s);
          scene.add(treeG); tree.group = treeG; tree.hp = 3;
        }, 30000);
      }
      hitAny = true;
    }
  }

  if (hitAny) spawnBurst(new THREE.Vector3(player.pos.x + Math.sin(yaw) * 2.2, player.pos.y + 1.3, player.pos.z + Math.cos(yaw) * 2.2), 0xffaae2, 10);
}

function damageEnemy(en, dmg, isCrit = false) {
  en.hp -= dmg; en.damagedTimer = 0.13; en.mesh.material.emissiveIntensity = 4;
  showDamageNumber(en.mesh.position.clone().add(new THREE.Vector3(0, 0.5 * en.s, 0)), dmg, isCrit, false);
  if (en.isBoss) refreshBossBar();
  if (en.hp <= 0 && !en.dead) { en.dead = true; killEnemy(en); }
}

function killEnemy(en) {
  stats.kills++;
  document.getElementById('killnum').textContent = stats.kills;
  updateQuestProgress('hunt');
  spawnXpOrb(en.mesh.position.clone(), en.def.xpVal || 8);
  spawnBurst(en.mesh.position.clone(), en.isBoss ? 0xff33aa : en.key === 'wraith' ? 0xd680ff : en.key === 'elite' ? 0xff77dd : 0xffaae2, en.isBoss ? 40 : 22);
  dropLoot(en.mesh.position.clone(), en.key);
  scene.remove(en.mesh);
  comboCount++; comboTimer = 3.8;
  if (comboCount >= 3) showCombo(comboCount);
  
  if (en.isBoss) {
    bossActive = false; nextBossKill = stats.kills + 10;
    document.getElementById('boss-bar').style.display = 'none';
    showNotification('🏆 BOSS DEFEATED!', 4500, '#ff66aa'); gainXp(200);
    updateQuestProgress('boss');
  } else {
    showKillFeed(en.def.label + ' defeated.');
  }
  
  if (!bossActive && stats.kills >= nextBossKill) spawnBoss();
  setTimeout(() => { enemies = enemies.filter(e => e !== en); if (!en.isBoss) spawnOneEnemy(); }, 60);
}

// ─────────────────────────────────────────────────────────────────────────
// MAGICAL PRINCESS ABILITIES
// ─────────────────────────────────────────────────────────────────────────
function useGroundSlam() {
  // Replaced with Star Burst
  const ab = abilities.slam;
  if (ab.cooldown > 0 || stats.mp < ab.mpCost) return;
  ab.cooldown = ab.maxCooldown * getCooldownMult(); stats.mp = Math.max(0, stats.mp - ab.mpCost);
  playSound('slam');
  const rGeo = new THREE.RingGeometry(0.1, 0.5, 32), rMat = new THREE.MeshBasicMaterial({ color: 0xff55bb, side: THREE.DoubleSide, transparent: true, opacity: 1 });
  const ring = new THREE.Mesh(rGeo, rMat); ring.rotation.x = -Math.PI / 2; ring.position.copy(player.pos); ring.position.y = groundHeightAt(player.pos.x, player.pos.z) + 0.1; scene.add(ring);
  let t = 0; const anim = setInterval(() => { t += 0.055; const sc = 1 + t * 13; ring.scale.set(sc, sc, sc); rMat.opacity = Math.max(0, 1 - t); if (t >= 1) { clearInterval(anim); scene.remove(ring); rGeo.dispose(); rMat.dispose(); } }, 16);
  let cnt = 0;
  for (const en of enemies) { if (en.hp <= 0) continue; if (en.mesh.position.distanceTo(player.pos) < 6.5) { damageEnemy(en, Math.floor((22 + stats.level * 3 + perks.warrior * 8) * (abilities.pact.active ? 1.5 : 1)), false); cnt++; } }
  showNotification(`STAR BURST  ·  ${cnt} hit${cnt !== 1 ? 's' : ''}`, 1800, '#ff77dd');
  updateHud(); updateAbilityUI();
}

function useDashStrike() {
  // Replaced with Sparkle Leap
  const ab = abilities.dash;
  if (ab.cooldown > 0 || stats.mp < ab.mpCost) return;
  ab.cooldown = ab.maxCooldown * getCooldownMult(); stats.mp = Math.max(0, stats.mp - ab.mpCost);
  playSound('dash');
  const dir = new THREE.Vector3(Math.sin(yaw), 0, Math.cos(yaw));
  const start = player.pos.clone(); const hitSet = new Set(); let t = 0; const half = WORLD.size * 0.48;
  const iv = setInterval(() => {
    t += 0.09;
    player.pos.x = Math.max(-half, Math.min(half, start.x + dir.x * t * 8));
    player.pos.z = Math.max(-half, Math.min(half, start.z + dir.z * t * 8));
    player.pos.y = groundHeightAt(player.pos.x, player.pos.z) + 1.0; playerMesh.position.copy(player.pos);
    for (const en of enemies) { if (en.hp <= 0 || hitSet.has(en)) continue; if (en.mesh.position.distanceTo(player.pos) < 2.4 * en.s) { hitSet.add(en); damageEnemy(en, Math.floor((18 + stats.level * 2.5 + perks.warrior * 8) * (abilities.pact.active ? 1.5 : 1)), Math.random() < 0.3); } }
    if (t >= 1) clearInterval(iv);
  }, 20);
  spawnBurst(player.pos.clone(), 0xffaae2, 12);
  showNotification('SPARKLE LEAP!', 1200, '#ff66cc'); updateHud(); updateAbilityUI();
}

function useCrimsonPact() {
  // Replaced with Fairy Blessing
  const ab = abilities.pact;
  if (ab.cooldown > 0 || ab.active) return;
  ab.cooldown = ab.maxCooldown * getCooldownMult(); ab.active = true; ab.timer = 5.0;
  
  // Magical heal & buff trigger instead of cost
  stats.hp = Math.min(stats.maxHp, stats.hp + Math.floor(stats.maxHp * 0.25));
  
  const fl = document.getElementById('dmg-flash');
  fl.style.opacity = 0.85; fl.style.background = 'radial-gradient(circle, transparent 30%, #ff88cca0 100%)';
  setTimeout(() => { fl.style.opacity = 0; fl.style.background = 'radial-gradient(circle, transparent 55%, #6b0f0f66 100%)'; }, 350);
  showNotification('✨ FAIRY BLESSING  Regen HP & Spells boosted!', 2500, '#ffaad4'); updateHud(); updateAbilityUI();
}

function useFireball() {
  // Replaced with Heart Shot
  const ab = abilities.fireball;
  if (ab.cooldown > 0 || stats.mp < ab.mpCost) return;
  ab.cooldown = ab.maxCooldown * getCooldownMult(); stats.mp = Math.max(0, stats.mp - ab.mpCost);
  spawnProjectile(
    new THREE.Vector3(player.pos.x, player.pos.y + 1.5, player.pos.z),
    new THREE.Vector3(Math.sin(yaw) * Math.cos(pitch), Math.sin(pitch) + 0.03, Math.cos(yaw) * Math.cos(pitch)).normalize(),
    'player', Math.floor((25 + stats.level * 4 + perks.warrior * 6) * (abilities.pact.active ? 1.5 : 1)), 'fireball'
  );
  updateHud(); updateAbilityUI();
}

// ─────────────────────────────────────────────────────────────────────────
// DODGE ROLL (Sparkle Roll)
// ─────────────────────────────────────────────────────────────────────────
function triggerDodge() {
  if (dodgeCooldown > 0 || stats.sp < 25 || !onGround) return;
  isDodging = true; dodgeTime = 0; dodgeCooldown = 1.5; stats.sp -= 25;
  dodgeVelocity.set(Math.sin(yaw), 0, Math.cos(yaw)).multiplyScalar(22);
  player.invincible = true;
  playSound('dodge');
  spawnBurst(player.pos.clone(), 0xfff5fa, 10);
  setTimeout(() => { player.invincible = false; }, 400);
  updateHud();
}

// ─────────────────────────────────────────────────────────────────────────
// XP ORBS
// ─────────────────────────────────────────────────────────────────────────
function spawnXpOrb(pos, value = 8) {
  const mat = new THREE.MeshStandardMaterial({ color: 0xffaae2, emissive: 0xaa0088, emissiveIntensity: 1.2 }); // Glowing pink stars
  const orb = new THREE.Mesh(new THREE.SphereGeometry(0.14, 8, 8), mat);
  orb.position.set(pos.x + (Math.random() - 0.5) * 1.6, pos.y + 0.6, pos.z + (Math.random() - 0.5) * 1.6);
  scene.add(orb); xpOrbs.push({ mesh: orb, value });
}

// ─────────────────────────────────────────────────────────────────────────
// INPUT
// ─────────────────────────────────────────────────────────────────────────
function onKeyDown(e) {
  keys[e.code] = true;
  if (!gameActive) return;
  if (e.code === 'KeyH') {
    const dist = Math.hypot(player.pos.x - fairyNpc.x, player.pos.z - fairyNpc.z);
    if (dist < 4.0) { toggleShop(); return; }
  }
  if (gamePaused) return;

  if (buildMode) {
    if (e.code === 'Digit1') { selectBuildItem('campfire'); return; }
    if (e.code === 'Digit2') { selectBuildItem('wall'); return; }
  }

  switch (e.code) {
    case 'KeyQ': useGroundSlam();   break;
    case 'KeyE': useDashStrike();   break;
    case 'KeyR': useCrimsonPact();  break;
    case 'KeyF': useFireball();     break;
    case 'KeyG': checkChestOpen(); break;
    case 'KeyI': toggleInventory(); break;
    case 'KeyB': toggleBuildMode(); break;
    case 'KeyU': toggleMount();     break;
    case 'KeyX': toggleStance();    break;
    case 'KeyH': {
      const dist = Math.hypot(player.pos.x - fairyNpc.x, player.pos.z - fairyNpc.z);
      if (dist < 4.0) toggleShop();
      break;
    }
    case 'KeyV': toggleView();      break;
    case 'ControlLeft': case 'ControlRight': triggerDodge(); break;
    case 'Escape': if (mouseLocked) document.exitPointerLock(); break;
  }
}

function toggleInventory() {
  const panel = document.getElementById('inventory-panel');
  if (!panel) return;
  panel.style.display = panel.style.display === 'block' ? 'none' : 'block';
  updateInventoryPanel();
}

function toggleView() {
  firstPerson = !firstPerson;
  playerMesh.visible = !firstPerson;
  showNotification(firstPerson ? 'First-Person [V]' : 'Third-Person [V]', 1400);
}

function onMouseMove(e) {
  if (!mouseLocked) return;
  yaw -= e.movementX * 0.0025; pitch -= e.movementY * 0.0025;
  pitch = Math.max(-0.88, Math.min(0.88, pitch));
}

function onResize() {
  camera.aspect = innerWidth / innerHeight; camera.updateProjectionMatrix();
  renderer.setSize(innerWidth, innerHeight);
}

// ─────────────────────────────────────────────────────────────────────────
// UPDATE — PLAYER
// ─────────────────────────────────────────────────────────────────────────
function updatePlayer(dt) {
  if (stats.hp <= 0) return;

  const forward = new THREE.Vector3(Math.sin(yaw), 0, Math.cos(yaw));
  const right = new THREE.Vector3(Math.sin(yaw + Math.PI / 2), 0, Math.cos(yaw + Math.PI / 2));
  const move = new THREE.Vector3();
  if (keys['KeyW']) move.add(forward);
  if (keys['KeyS']) move.sub(forward);
  if (keys['KeyD']) move.add(right);
  if (keys['KeyA']) move.sub(right);

  const gY = groundHeightAt(player.pos.x, player.pos.z);
  isSwimming = gY < -3.5 && player.pos.y <= -3.2 && !mounted;

  const sprinting = keys['ShiftLeft'] && stats.sp > 1 && move.lengthSq() > 0 && !isSwimming;
  let spd = sprinting ? player.sprint : player.speed;
  if (isSwimming) spd *= 0.55;

  if (isDodging) {
    dodgeTime += dt;
    const dSpd = Math.max(0, 22 - dodgeTime * 44);
    player.pos.x += dodgeVelocity.x * dSpd * dt;
    player.pos.z += dodgeVelocity.z * dSpd * dt;
    if (dodgeTime >= 0.5) isDodging = false;
  } else if (move.lengthSq() > 0) {
    move.normalize().multiplyScalar(spd * dt);
    
    const nextX = player.pos.x + move.x;
    const nextZ = player.pos.z + move.z;
    let collides = false;
    for (const st of placedStructures) {
      if (st.type === 'wall' && Math.hypot(st.x - nextX, st.z - nextZ) < st.radius) {
        collides = true;
        break;
      }
    }

    if (!collides) {
      player.pos.x += move.x;
      player.pos.z += move.z;
    }

    playerMesh.rotation.y = Math.atan2(move.x, move.z);
    if (sprinting) stats.sp = Math.max(0, stats.sp - dt * 22);
    walkTime += dt * (sprinting ? 2.2 : 1.4);
  } else {
    stats.sp = Math.min(stats.maxSp, stats.sp + dt * 12);
  }
  if (!sprinting) stats.sp = Math.min(stats.maxSp, stats.sp + dt * 6);

  if (isSwimming) {
    vy = Math.max(-1.5, Math.min(1.5, vy + (keys['Space'] ? 3.0 : -1.0) * dt));
    player.pos.y += vy * dt;
    if (player.pos.y > -3.3) player.pos.y = -3.3;
    onGround = false;
    if (Math.random() < 0.2) spawnBurst(player.pos.clone().add(new THREE.Vector3(0, -0.4, 0)), 0xffaae2, 2);
  } else {
    const minHeight = mounted ? gY + 2.1 : gY + 1.0;
    const jumpPower = mounted ? 8.5 : 5.5;
    if (keys['Space'] && onGround && !isDodging) { vy = jumpPower; onGround = false; }
    vy -= 14 * dt; player.pos.y += vy * dt;
    if (player.pos.y <= minHeight) { player.pos.y = minHeight; vy = 0; onGround = true; }
  }

  const half = WORLD.size * 0.48;
  player.pos.x = Math.max(-half, Math.min(half, player.pos.x));
  player.pos.z = Math.max(-half, Math.min(half, player.pos.z));

  if (mounted && Math.random() < 0.35) {
    spawnBurst(player.pos.clone().add(new THREE.Vector3((Math.random() - 0.5) * 0.6, -1.1, (Math.random() - 0.5) * 0.6)), 0xffe2f5, 3);
  }
  if (buildMode && buildGhost) {
    const fwdDist = 4.2;
    const ghostX = player.pos.x + Math.sin(yaw) * fwdDist;
    const ghostZ = player.pos.z + Math.cos(yaw) * fwdDist;
    buildGhost.position.set(ghostX, groundHeightAt(ghostX, ghostZ), ghostZ);
    buildGhost.rotation.y = yaw;
  }

  const sg = playerMesh.userData.swordGroup;
  if (sg && sg.userData.currentWeaponId === 'flame_sword' && Math.random() < 0.28) {
    const swordTip = new THREE.Vector3(0, 0.9, 0).applyMatrix4(sg.matrixWorld);
    spawnBurst(swordTip, 0xff00bb, 2); // Pink flame sparks
  }

  // ── Limb & Hair animation
  const { lArmPivot, rArmPivot, lLegPivot, rLegPivot, head, lTail, rTail } = playerMesh.userData;
  const isMoving = move.lengthSq() > 0.001 || isDodging;
  const walkSway = Math.sin(walkTime * 8) * (isMoving ? 0.48 : 0.03);
  const idleSway = Math.sin(performance.now() * 0.001) * 0.015;
  if (lLegPivot) lLegPivot.rotation.x = walkSway;
  if (rLegPivot) rLegPivot.rotation.x = -walkSway;
  if (lArmPivot) lArmPivot.rotation.x = -walkSway * 0.5;
  if (rArmPivot) rArmPivot.rotation.x = walkSway * 0.5;
  if (head) head.rotation.y = idleSway * 2;
  
  // Twintails sway
  if (lTail) lTail.rotation.z = Math.PI / 10 + Math.sin(walkTime * 8) * 0.12;
  if (rTail) rTail.rotation.z = -Math.PI / 10 - Math.sin(walkTime * 8) * 0.12;

  const bob = isMoving ? Math.sin(walkTime * 8) * 0.025 : 0;
  playerMesh.position.y = player.pos.y + bob;

  let shakeOffset = new THREE.Vector3();
  if (screenShakeAmt > 0.01) {
    shakeOffset.set((Math.random() - 0.5) * screenShakeAmt, (Math.random() - 0.5) * screenShakeAmt, (Math.random() - 0.5) * screenShakeAmt);
    screenShakeAmt = THREE.MathUtils.lerp(screenShakeAmt, 0, dt * 6.5);
  }

  if (firstPerson) {
    camera.position.set(player.pos.x, player.pos.y + 1.65, player.pos.z).add(shakeOffset);
    const dir = new THREE.Vector3(Math.sin(yaw) * Math.cos(pitch), Math.sin(pitch), Math.cos(yaw) * Math.cos(pitch));
    camera.lookAt(camera.position.clone().add(dir));
  } else {
    const cd = 6.5, ch = 2.8;
    const off = new THREE.Vector3(-Math.sin(yaw) * cd, ch + pitch * 3, -Math.cos(yaw) * cd).add(shakeOffset);
    camera.position.lerp(player.pos.clone().add(off), 1 - Math.pow(0.001, dt));
    camera.lookAt(player.pos.x, player.pos.y + 1.4, player.pos.z);
  }

  if (attackCooldown > 0) attackCooldown -= dt;
  if (dodgeCooldown > 0)  dodgeCooldown -= dt;
  for (const ab of Object.values(abilities)) if (ab.cooldown > 0) ab.cooldown = Math.max(0, ab.cooldown - dt);
  if (abilities.pact.active) {
    abilities.pact.timer -= dt;
    if (abilities.pact.timer <= 0) {
      abilities.pact.active = false;
      showNotification('Fairy Blessing ended.', 1600, '#ffaad4');
    }
  }
  stats.mp = Math.min(stats.maxMp, stats.mp + dt * 3.5);

  updateAbilityUI();
}

// ─────────────────────────────────────────────────────────────────────────
// UPDATE — ENEMIES
// ─────────────────────────────────────────────────────────────────────────
function updateEnemies(dt) {
  for (const en of enemies) {
    if (en.hp <= 0) continue;
    const toPlayer = new THREE.Vector3().subVectors(player.pos, en.mesh.position); toPlayer.y = 0;
    const dist = toPlayer.length();
    const agR = en.isBoss ? 9999 : 20, deR = en.isBoss ? 9999 : 35;
    if (dist < agR) en.state = 'chase'; if (dist > deR) en.state = 'idle';

    if (en.def.ranged) {
      if (dist < 12) {
        const away = toPlayer.clone().normalize().negate();
        en.mesh.position.x += away.x * en.speed * 1.3 * dt;
        en.mesh.position.z += away.z * en.speed * 1.3 * dt;
      } else if (dist < 30 && en.state === 'chase') {
        const perp = new THREE.Vector3(-toPlayer.z, 0, toPlayer.x).normalize();
        en.mesh.position.x += perp.x * en.strafeDir * en.speed * 0.7 * dt;
        en.mesh.position.z += perp.z * en.strafeDir * en.speed * 0.7 * dt;
      }
      en.shootCooldown -= dt;
      if (dist < 28 && en.shootCooldown <= 0 && en.state === 'chase') {
        en.shootCooldown = 2.5 + Math.random();
        const dir = toPlayer.clone().normalize().add(new THREE.Vector3((Math.random() - 0.5) * 0.1, 0.05, (Math.random() - 0.5) * 0.1)).normalize();
        spawnProjectile(en.mesh.position.clone().add(new THREE.Vector3(0, 0.5, 0)), dir, 'enemy', en.def.damage, 'arrow');
      }
    } else {
      if (en.state === 'chase' && dist > 1.2 * en.s) {
        toPlayer.normalize();
        
        const nextX = en.mesh.position.x + toPlayer.x * en.speed * dt;
        const nextZ = en.mesh.position.z + toPlayer.z * en.speed * dt;
        let blockedByWall = false;
        
        for (const st of placedStructures) {
          if (st.type === 'wall' && st.hp > 0 && Math.hypot(st.x - nextX, st.z - nextZ) < st.radius) {
            blockedByWall = true;
            st.hp -= en.def.damage * dt * 0.5;
            break;
          }
        }

        if (!blockedByWall) {
          en.mesh.position.x += toPlayer.x * en.speed * dt;
          en.mesh.position.z += toPlayer.z * en.speed * dt;
        }
        en.mesh.rotation.y = Math.atan2(toPlayer.x, toPlayer.z);
      }
    }

    if (en.isBoss && en.isVolcanic && en.state === 'chase') {
      en.meteorTimer -= dt;
      if (en.meteorTimer <= 0) {
        en.meteorTimer = 4.0 + Math.random() * 2.5;
        spawnMeteorTelegraph(player.pos.clone().add(new THREE.Vector3((Math.random() - 0.5) * 4, 0, (Math.random() - 0.5) * 4)));
      }
    }

    en.mesh.position.y = groundHeightAt(en.mesh.position.x, en.mesh.position.z) + 0.85 * en.s;
    if (en.damagedTimer > 0) { en.damagedTimer -= dt; if (en.damagedTimer <= 0) en.mesh.material.emissiveIntensity = 1; }

    en.hitCooldown -= dt;
    if (!en.def.ranged && dist < 1.5 * en.s && en.hitCooldown <= 0 && stats.hp > 0 && !player.invincible) {
      en.hitCooldown = en.isBoss ? 0.8 : 1.1;
      const dmg = Math.floor(en.def.damage * (1 - perks.fortress * 0.2)) + Math.floor(Math.random() * 5);
      stats.hp = Math.max(0, stats.hp - dmg);
      flashDamage();
      playSound('hit');
      triggerScreenShake(0.3);
      updateHud();
      if (stats.hp <= 0) onPlayerDeath();
    }
  }
}

// ─────────────────────────────────────────────────────────────────────────
// UPDATE — XP ORBS
// ─────────────────────────────────────────────────────────────────────────
function updateXpOrbs(dt) {
  for (const orb of xpOrbs) {
    orb.mesh.position.y += Math.sin(performance.now() * 0.004 + orb.mesh.position.x) * 0.007;
    const d = orb.mesh.position.distanceTo(player.pos);
    if (d < 7) orb.mesh.position.addScaledVector(new THREE.Vector3().subVectors(player.pos, orb.mesh.position).normalize(), dt * 10);
    if (d < 1.0) { gainXp(orb.value); scene.remove(orb.mesh); orb.collected = true; }
  }
  xpOrbs = xpOrbs.filter(o => !o.collected);
}

// ─────────────────────────────────────────────────────────────────────────
// UPDATE — POTIONS
// ─────────────────────────────────────────────────────────────────────────
function updatePotions(dt) {
  const t = performance.now() * 0.001;
  for (const pot of potions) {
    pot.mesh.position.y = groundHeightAt(pot.mesh.position.x, pot.mesh.position.z) + 0.9 + Math.sin(t * 2 + pot.mesh.position.x) * 0.13;
    pot.ring.rotation.z += dt * 1.6;
    if (pot.mesh.position.distanceTo(player.pos) < 1.5) {
      const h = Math.min(pot.value, stats.maxHp - stats.hp);
      stats.hp = Math.min(stats.maxHp, stats.hp + pot.value);
      showDamageNumber(pot.mesh.position.clone(), h, false, true);
      showNotification('🍀 +' + pot.value + ' HP', 1400, '#ff66aa');
      scene.remove(pot.mesh); pot.collected = true; updateHud();
      setTimeout(spawnOnePotion, 18000);
    }
  }
  potions = potions.filter(p => !p.collected);
}

// ─────────────────────────────────────────────────────────────────────────
// UPDATE — DAY/NIGHT
// ─────────────────────────────────────────────────────────────────────────
function updateDayNight(dt) {
  dayTime += dt * 0.006; if (dayTime > 1) dayTime -= 1;
  const angle = dayTime * Math.PI * 2, sunH = Math.sin(angle);
  sunLight.position.set(Math.cos(angle) * 220, Math.max(sunH, 0.05) * 220, 60);
  sunLight.target.position.set(player.pos.x, 0, player.pos.z);
  sunLight.intensity = Math.max(0.08, sunH * 1.35);
  hemiLight.intensity = 0.18 + Math.max(0, sunH) * 0.6;
  if (sunSphere && moonSphere) {
    sunSphere.position.set(player.pos.x + Math.cos(angle) * 240, player.pos.y + Math.sin(angle) * 180, player.pos.z + 80);
    moonSphere.position.set(player.pos.x + Math.cos(angle + Math.PI) * 240, player.pos.y + Math.sin(angle + Math.PI) * 180, player.pos.z - 80);
  }
  const dayC = new THREE.Color(0xffdbeb), nightC = new THREE.Color(0x1a0c20), duskC = new THREE.Color(0xffb2d6);
  let col;
  if (sunH > 0.15) col = dayC.clone();
  else if (sunH > -0.1) col = dayC.clone().lerp(duskC, 1 - (sunH + 0.1) / 0.25);
  else col = duskC.clone().lerp(nightC, Math.min(1, -sunH * 2));
  scene.background = col; scene.fog.color = col;
}

// ─────────────────────────────────────────────────────────────────────────
// HUD
// ─────────────────────────────────────────────────────────────────────────
function updateHud() {
  const pct = (id, v, mx) => { document.getElementById(id).style.width = Math.max(0, v / mx * 100) + '%'; };
  pct('hp-fill', stats.hp, stats.maxHp);
  pct('mp-fill', stats.mp, stats.maxMp);
  pct('sp-fill', stats.sp, stats.maxSp);
  pct('xp-fill', stats.xp, stats.xpNext);
  document.getElementById('hp-val').textContent = Math.ceil(stats.hp) + '/' + stats.maxHp;
  document.getElementById('mp-val').textContent = Math.ceil(stats.mp) + '/' + stats.maxMp;
  document.getElementById('sp-val').textContent = Math.ceil(stats.sp) + '/' + stats.maxSp;
  document.getElementById('lvlnum').textContent = stats.level;
  document.getElementById('killnum').textContent = stats.kills;
  document.getElementById('gold-val').textContent = stats.gold;
  document.getElementById('wood-val').textContent = stats.wood;
  const b = nearestBiome(player.pos.x, player.pos.z);
  document.getElementById('biome-tag').textContent = b.name;
  const sb = document.getElementById('stance-badge');
  if (sb) sb.textContent = activeStance === 'bow' ? '🏹 BOW' : '🪄 WAND';
}

// ─────────────────────────────────────────────────────────────────────────
// ABILITIES UI
// ─────────────────────────────────────────────────────────────────────────
function updateAbilityUI() {
  [{ id: 'ab-slam', ab: abilities.slam }, { id: 'ab-dash', ab: abilities.dash }, { id: 'ab-pact', ab: abilities.pact }, { id: 'ab-fire', ab: abilities.fireball }].forEach(({ id, ab }) => {
    const el = document.getElementById(id); if (!el) return;
    const fill = el.querySelector('.ab-cd');
    if (fill) fill.style.height = (ab.cooldown > 0 ? (ab.cooldown / ab.maxCooldown) * 100 : 0) + '%';
    el.classList.toggle('ab-active', !!ab.active);
    el.classList.toggle('ab-ready', ab.cooldown <= 0 && !ab.active);
  });
}

function flashDamage() { const el = document.getElementById('dmg-flash'); el.style.opacity = 1; setTimeout(() => { el.style.opacity = 0; }, 190); }
function flashLevelUp() { const el = document.getElementById('levelup'); el.style.opacity = 1; el.style.transform = 'translate(-50%,-62%) scale(1.1)'; setTimeout(() => { el.style.opacity = 0; el.style.transform = 'translate(-50%,-50%) scale(1.0)'; }, 1600); }
function showKillFeed(msg) { const el = document.getElementById('killfeed'); el.textContent = msg; el.style.opacity = 1; setTimeout(() => { el.style.opacity = 0; }, 1400); }

// ─────────────────────────────────────────────────────────────────────────
// COMPASS + MINIMAP
// ─────────────────────────────────────────────────────────────────────────
function buildCompass() {
  const strip = document.getElementById('compass-strip');
  const dirs = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'];
  let html = '';
  for (let i = 0; i < 40; i++) html += `<span style="display:inline-block;width:60px;text-align:center;${i % 8 === 0 ? 'color:#ff66aa;font-weight:bold;' : ''}">${dirs[i % 8]}</span>`;
  strip.innerHTML = html;
}

function updateCompass() {
  const deg = ((yaw * 180 / Math.PI) % 360 + 360) % 360;
  document.getElementById('compass-strip').style.left = (-(deg / 360) * 8 * 60 + 170) + 'px';
}

function updateMinimap() {
  const inner = document.getElementById('minimap-inner'); inner.innerHTML = '';
  const sc = (160 / 260) * minimapZoom;

  const pdot = document.createElement('div');
  pdot.className = 'mm-dot mm-player'; pdot.style.left = '80px'; pdot.style.top = '80px';
  inner.appendChild(pdot);
  
  const cone = document.createElement('div');
  const coneAngleDeg = ((-yaw * 180 / Math.PI) % 360 + 360) % 360;
  cone.style.cssText = `position:absolute;left:80px;top:80px;width:0;height:0;border-left:4px solid transparent;border-right:4px solid transparent;border-bottom:10px solid #ffccd4;transform-origin:4px 0;transform:translate(-4px,-10px) rotate(${coneAngleDeg}deg);opacity:0.8;`;
  inner.appendChild(cone);

  for (const en of enemies) {
    if (en.hp <= 0) continue;
    const dx = (en.mesh.position.x - player.pos.x) * sc, dz = (en.mesh.position.z - player.pos.z) * sc;
    if (Math.hypot(dx, dz) > 80) continue;
    const d = document.createElement('div');
    d.className = 'mm-dot ' + (en.isBoss ? 'mm-boss' : en.key === 'wraith' ? 'mm-wraith' : en.key === 'elite' ? 'mm-elite' : en.key === 'archer' ? 'mm-archer' : 'mm-enemy');
    d.style.left = (80 + dx) + 'px'; d.style.top = (80 + dz) + 'px'; inner.appendChild(d);
  }
  for (const pot of potions) {
    const dx = (pot.mesh.position.x - player.pos.x) * sc, dz = (pot.mesh.position.z - player.pos.z) * sc;
    if (Math.hypot(dx, dz) > 80) continue;
    const d = document.createElement('div'); d.className = 'mm-dot mm-potion';
    d.style.left = (80 + dx) + 'px'; d.style.top = (80 + dz) + 'px'; inner.appendChild(d);
  }
  for (const ch of chests) {
    if (ch.opened) continue;
    const dx = (ch.x - player.pos.x) * sc, dz = (ch.z - player.pos.z) * sc;
    if (Math.hypot(dx, dz) > 80) continue;
    const d = document.createElement('div'); d.className = 'mm-dot mm-chest';
    d.style.left = (80 + dx) + 'px'; d.style.top = (80 + dz) + 'px'; inner.appendChild(d);
  }
}

// ─────────────────────────────────────────────────────────────────────────
// GAME LIFECYCLE
// ─────────────────────────────────────────────────────────────────────────
function startGame() {
  const inp = document.getElementById('playerName');
  playerName = (inp.value || '').trim() || 'Princess';
  document.getElementById('start').style.display = 'none';
  document.getElementById('hud').style.display   = 'block';
  gameActive = true; initAudio();
  setTimeout(() => { const p = renderer.domElement.requestPointerLock(); if (p && p.catch)p.catch(() => {}); }, 50);
}

function onPlayerDeath() {
  gameActive = false; document.exitPointerLock();
  document.getElementById('deadStats').textContent = `Level ${stats.level}  ·  ${stats.kills} defeated  ·  ${stats.gold}g`;
  document.getElementById('saveStatus').textContent = '';
  document.getElementById('saveScoreBtn').disabled  = false;
  document.getElementById('dead').style.display     = 'flex';
}

function respawn() {
  stats.hp = stats.maxHp; stats.mp = stats.maxMp; stats.sp = stats.maxSp;
  player.pos.set(0, groundHeightAt(0, 0) + 1, 8);
  document.getElementById('dead').style.display = 'none';
  updateHud(); gameActive = true;
  setTimeout(() => { const p = renderer.domElement.requestPointerLock(); if (p && p.catch)p.catch(() => {}); }, 50);
}

// ─────────────────────────────────────────────────────────────────────────
// API
// ─────────────────────────────────────────────────────────────────────────
async function toggleLeaderboard() {
  const panel = document.getElementById('leaderboard');
  if (panel.style.display === 'block') { panel.style.display = 'none'; return; }
  panel.style.display = 'block'; panel.innerHTML = '<div class="empty">loading…</div>';
  try { const res = await fetch('/api/leaderboard?limit=10'); if (!res.ok) throw new Error(); const d = await res.json(); renderLeaderboard(panel, d.scores || []); }
  catch { panel.innerHTML = '<div class="empty">Could not reach the backend.</div>'; }
}
function renderLeaderboard(panel, scores) {
  if (!scores.length) { panel.innerHTML = '<div class="empty">No runs saved yet.</div>'; return; }
  panel.innerHTML = `<table><tr><th>Name</th><th>Level</th><th>Kills</th></tr>${scores.map(s => `<tr><td>${escapeHtml(s.name)}</td><td>LV ${s.level}</td><td>${s.kills}</td></tr>`).join('')}</table>`;
}
function escapeHtml(str) { const d = document.createElement('div'); d.textContent = str; return d.innerHTML; }
async function saveScore() {
  const btn = document.getElementById('saveScoreBtn'), st = document.getElementById('saveStatus');
  btn.disabled = true; st.textContent = 'saving…';
  try { const res = await fetch('/api/save', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name: playerName, level: stats.level, kills: stats.kills, xp: stats.xp }) }); if (!res.ok) throw new Error(); st.textContent = 'Saved ✓'; }
  catch { st.textContent = 'Could not save.'; btn.disabled = false; }
}

function gainXp(v) {
  stats.xp += v;
  while (stats.xp >= stats.xpNext) {
    stats.xp -= stats.xpNext; stats.level++;
    stats.xpNext = Math.floor(stats.xpNext * 1.3);
    stats.maxHp += 15; stats.maxMp += 8; stats.maxSp += 6;
    stats.hp = stats.maxHp; stats.mp = stats.maxMp; stats.sp = stats.maxSp;
    flashLevelUp(); playSound('levelup');
    updateQuestProgress('level');
    showPerkSelection();
  }
  updateHud();
}

function showCombo(count) {
  const el = document.getElementById('combo');
  if (el) {
    el.textContent = count + '  COMBO'; el.style.opacity = 1; el.style.transform = 'translate(-50%,-50%) scale(1.15)';
    setTimeout(() => { el.style.transform = 'translate(-50%,-50%) scale(1.0)'; }, 160);
  }
}

function updateComboTimer(dt) {
  if (comboTimer <= 0) return;
  comboTimer -= dt;
  if (comboTimer <= 0) {
    const el = document.getElementById('combo');
    if (el) el.style.opacity = 0;
    comboCount = 0;
  }
}

// ─────────────────────────────────────────────────────────────────────────
// MAIN LOOP
// ─────────────────────────────────────────────────────────────────────────
function animate() {
  requestAnimationFrame(animate);
  const dt = Math.min(0.05, clock.getDelta());
  if (gameActive && !gamePaused) {
    updatePlayer(dt);
    updateEnemies(dt);
    updateXpOrbs(dt);
    updatePotions(dt);
    updateLoot(dt);
    updateProjectiles(dt);
    updatePlacedStructures(dt);
    updateDayNight(dt);
    updateWeather(dt);
    updateCampfires(dt);
    updateBirds(dt);
    updatePollen(dt);
    updateMeteors(dt);
    updateWaterWaves(performance.now() * 0.001);
    updateFairyNpc(performance.now() * 0.001);
    updateCompass();
    updateMinimap();
    updateHud();
    updateComboTimer(dt);
    updateParticles(dt);
    updateDamageNumbers(dt);
    refreshBossBar();
  }
  renderer.render(scene, camera);
}

init();
