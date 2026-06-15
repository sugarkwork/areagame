const canvas = document.querySelector("#game");
const ctx = canvas.getContext("2d");

const ui = {
  hpText: document.querySelector("#hpText"),
  hpBar: document.querySelector("#hpBar"),
  levelText: document.querySelector("#levelText"),
  xpBar: document.querySelector("#xpBar"),
  waveText: document.querySelector("#waveText"),
  woodText: document.querySelector("#woodText"),
  stoneText: document.querySelector("#stoneText"),
  goldText: document.querySelector("#goldText"),
  ironText: document.querySelector("#ironText"),
  meatText: document.querySelector("#meatText"),
  starstoneText: document.querySelector("#starstoneText"),
  equippedWeaponHud: document.querySelector("#equippedWeaponHud"),
  equippedWeaponIcon: document.querySelector("#equippedWeaponIcon"),
  equippedWeaponName: document.querySelector("#equippedWeaponName"),
  equippedWeaponMeta: document.querySelector("#equippedWeaponMeta"),
  saveButton: document.querySelector("#saveButton"),
  saveDropOverlay: document.querySelector("#saveDropOverlay"),
  quickMenuButton: document.querySelector("#quickMenuButton"),
  weaponList: document.querySelector("#weaponList"),
  enchantButtons: document.querySelector("#enchantButtons"),
  enchantDescription: document.querySelector("#enchantDescription"),
  buildButtons: document.querySelector("#buildButtons"),
  hireButtons: document.querySelector("#hireButtons"),
  skillButtons: document.querySelector("#skillButtons"),
  levelUpBackdrop: document.querySelector("#levelUpBackdrop"),
  levelUpPanel: document.querySelector("#levelUpPanel"),
  skillChoiceButtons: document.querySelector("#skillChoiceButtons"),
  rerollRewards: document.querySelector("#rerollRewards"),
  rerollCount: document.querySelector("#rerollCount"),
  upgradePickaxe: document.querySelector("#upgradePickaxe"),
  upgradeAxe: document.querySelector("#upgradeAxe"),
  weaponPanel: document.querySelector("#weaponPanel"),
  enchantPanel: document.querySelector("#enchantPanel"),
  buildPanel: document.querySelector("#buildPanel"),
  hirePanel: document.querySelector("#hirePanel"),
  skillPanel: document.querySelector("#skillPanel"),
  menuBackdrop: document.querySelector("#menuBackdrop"),
  radialMenu: document.querySelector("#radialMenu"),
  radialWeapons: document.querySelector('[data-menu="weapons"]'),
  radialEnchants: document.querySelector('[data-menu="enchants"]'),
  radialBuild: document.querySelector('[data-menu="build"]'),
  radialHire: document.querySelector('[data-menu="hire"]'),
  radialSkills: document.querySelector('[data-menu="skills"]'),
  joystick: document.querySelector("#joystick"),
  joystickKnob: document.querySelector("#joystickKnob"),
  eventAlert: document.querySelector("#eventAlert"),
  toast: document.querySelector("#toast"),
};

const TAU = Math.PI * 2;
const rand = (min, max) => min + Math.random() * (max - min);
const clamp = (value, min, max) => Math.max(min, Math.min(max, value));
const dist = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);
const now = () => performance.now() / 1000;
const resourceKeys = ["wood", "stone", "gold", "iron", "meat", "starstone"];
const SAVE_VERSION = 1;
const ENEMY_HP_MULTIPLIER = 1.5;
const RESOURCE_HP_MULTIPLIER = 1.5;
const BASE_DUTY_EXTRA_RADIUS = 0.3;
const BASE_WORKER_THREAT_RADIUS = 230;
const BASE_THREAT_RADIUS_PADDING = 80;
const PLAYER_XP_START = 24;
const PLAYER_XP_EARLY_TARGET = 150;
const PLAYER_XP_EARLY_TARGET_LEVEL = 20;

function playerXpRequired(level) {
  const earlyLevel = clamp(level, 1, PLAYER_XP_EARLY_TARGET_LEVEL);
  const step = (PLAYER_XP_EARLY_TARGET - PLAYER_XP_START) / (PLAYER_XP_EARLY_TARGET_LEVEL - 1);
  const earlyRequirement = Math.round(PLAYER_XP_START + (earlyLevel - 1) * step);
  if (level <= PLAYER_XP_EARLY_TARGET_LEVEL) return earlyRequirement;
  const lateLevel = level - PLAYER_XP_EARLY_TARGET_LEVEL;
  return Math.round(PLAYER_XP_EARLY_TARGET + lateLevel * 6 + lateLevel * lateLevel * 0.28);
}

const spriteSheet = new Image();
let spritesReady = false;
spriteSheet.onload = () => {
  spritesReady = true;
};
spriteSheet.src = "assets/sprites/jrpg-sprite-sheet.png";

const customSpriteSheet = new Image();
let customSpritesReady = false;
customSpriteSheet.onload = () => {
  customSpritesReady = true;
};
customSpriteSheet.src = "assets/sprites/custom-jrpg-chips.png";

const bossSpriteSheet = new Image();
let bossSpritesReady = false;
bossSpriteSheet.onload = () => {
  bossSpritesReady = true;
};
bossSpriteSheet.src = "assets/sprites/boss-jrpg-chips.png";

const healerSpriteSheet = new Image();
let healerSpritesReady = false;
healerSpriteSheet.onload = () => {
  healerSpritesReady = true;
};
healerSpriteSheet.src = "assets/sprites/healer-jrpg-sheet.png";

const terrainSheet = new Image();
let terrainReady = false;
terrainSheet.onload = () => {
  terrainReady = true;
};
terrainSheet.src = "assets/terrain/terrain-tiles.png";

const resourceIconImages = {};
const toolIconImages = {};
const weaponIconImages = {};
const dogSpriteImage = new Image();
dogSpriteImage.src = "assets/sprites/dog.png";
for (const key of resourceKeys) {
  resourceIconImages[key] = new Image();
  resourceIconImages[key].src = `assets/icons/resource-${key}.png`;
}
for (const key of ["axe", "pickaxe"]) {
  toolIconImages[key] = new Image();
  toolIconImages[key].src = `assets/icons/tool-${key}.png`;
}
const weaponIconSources = {
  knife: "assets/icons/weapon-knife.png",
  ironSword: "assets/icons/weapon-sword.png",
  duelistBlade: "assets/icons/weapon-duelist.png",
};
for (const [key, src] of Object.entries(weaponIconSources)) {
  weaponIconImages[key] = new Image();
  weaponIconImages[key].src = src;
}

const box = (x, y, w, h) => ({ x, y, w, h });
const TERRAIN_TILE_SIZE = 96;
const TERRAIN_ATLAS_TILE = 128;
const terrainTiles = {
  grass: [box(0, 0, 128, 128), box(128, 0, 128, 128), box(256, 0, 128, 128), box(384, 0, 128, 128)],
  sparse: [box(0, 128, 128, 128), box(128, 128, 128, 128)],
  dirt: [box(256, 128, 128, 128), box(384, 128, 128, 128)],
  pathVertical: [box(0, 256, 128, 128), box(128, 256, 128, 128)],
  pathCross: [box(256, 256, 128, 128)],
  pathCurve: [box(384, 256, 128, 128)],
  pond: [box(0, 384, 128, 128), box(128, 384, 128, 128)],
  swamp: [box(256, 384, 128, 128), box(384, 384, 128, 128)],
};

const sprites = {
  player: {
    down: [box(52, 375, 86, 136), box(183, 375, 85, 136), box(316, 375, 86, 135)],
    right: [box(51, 216, 90, 136), box(187, 216, 88, 136), box(322, 216, 89, 136)],
    up: [box(55, 46, 83, 146), box(189, 46, 84, 146), box(323, 46, 84, 145)],
    sideFaces: "left",
    width: 54,
    height: 86,
  },
  guard: {
    down: [box(480, 536, 84, 141), box(605, 536, 86, 141), box(732, 536, 85, 141)],
    right: [box(480, 216, 81, 136), box(607, 216, 83, 136), box(735, 216, 81, 136)],
    up: [box(480, 47, 85, 145), box(606, 47, 86, 145), box(732, 47, 85, 145)],
    sideFaces: "left",
    width: 52,
    height: 84,
  },
  enemy: {
    down: [box(868, 498, 88, 81), box(981, 499, 87, 81)],
    right: [box(869, 225, 86, 78), box(989, 225, 81, 78)],
    up: [box(872, 79, 87, 82), box(984, 79, 87, 82)],
    sideFaces: "left",
    width: 48,
    height: 45,
  },
  resources: {
    wood: { frame: box(1127, 56, 125, 184), width: 74, height: 108 },
    stone: { frame: box(1119, 293, 119, 114), width: 58, height: 54 },
    gold: { frame: box(1258, 296, 120, 111), width: 58, height: 54 },
  },
  traps: {
    bomb: { frame: box(37, 752, 183, 199), width: 58, height: 62 },
    pit: { frame: box(254, 790, 220, 161), width: 72, height: 50 },
    net: { frame: box(499, 783, 222, 168), width: 72, height: 54 },
    spikes: { frame: box(747, 783, 194, 168), width: 70, height: 56 },
  },
  buildings: {
    wall: { frame: box(1103, 512, 172, 192), width: 88, height: 98 },
    tower: { frame: box(1304, 438, 176, 297), width: 84, height: 142 },
  },
  weapons: {
    ironSword: box(990, 771, 156, 183),
    duelistBlade: box(990, 771, 156, 183),
    longBow: box(1176, 767, 131, 208),
    sparkStaff: box(1350, 783, 148, 193),
  },
};

const customSprites = {
  enemies: {
    goblin: {
      down: [box(0, 0, 64, 64), box(64, 0, 64, 64), box(128, 0, 64, 64)],
      right: [box(192, 0, 64, 64), box(256, 0, 64, 64), box(320, 0, 64, 64)],
      up: [box(384, 0, 64, 64), box(448, 0, 64, 64), box(512, 0, 64, 64)],
      sideFaces: "right",
      width: 46,
      height: 54,
    },
    goblinArcher: {
      down: [box(0, 64, 64, 64), box(64, 64, 64, 64), box(128, 64, 64, 64)],
      right: [box(192, 64, 64, 64), box(256, 64, 64, 64), box(320, 64, 64, 64)],
      up: [box(384, 64, 64, 64), box(448, 64, 64, 64), box(512, 64, 64, 64)],
      sideFaces: "right",
      width: 48,
      height: 55,
    },
    blueSlime: {
      down: [box(0, 128, 64, 64), box(64, 128, 64, 64)],
      right: [box(128, 128, 64, 64), box(192, 128, 64, 64)],
      up: [box(256, 128, 64, 64), box(320, 128, 64, 64)],
      sideFaces: "right",
      width: 48,
      height: 42,
    },
    greenSlime: {
      down: [box(0, 192, 64, 64), box(64, 192, 64, 64)],
      right: [box(128, 192, 64, 64), box(192, 192, 64, 64)],
      up: [box(256, 192, 64, 64), box(320, 192, 64, 64)],
      sideFaces: "right",
      width: 46,
      height: 40,
    },
    boar: {
      down: [box(0, 320, 64, 64), box(64, 320, 64, 64), box(128, 320, 64, 64)],
      right: [box(192, 320, 64, 64), box(256, 320, 64, 64), box(320, 320, 64, 64)],
      up: [box(384, 320, 64, 64), box(448, 320, 64, 64), box(512, 320, 64, 64)],
      sideFaces: "right",
      width: 56,
      height: 44,
    },
    boarBoss: {
      down: [box(0, 320, 64, 64), box(64, 320, 64, 64), box(128, 320, 64, 64)],
      right: [box(192, 320, 64, 64), box(256, 320, 64, 64), box(320, 320, 64, 64)],
      up: [box(384, 320, 64, 64), box(448, 320, 64, 64), box(512, 320, 64, 64)],
      sideFaces: "right",
      width: 92,
      height: 70,
    },
  },
  resources: {
    iron: { frame: box(0, 256, 64, 64), width: 58, height: 54 },
    starstone: { frame: box(64, 256, 64, 64), width: 50, height: 48 },
  },
};

const bossSprites = {
  enemies: {
    ogreBoss: {
      down: [box(0, 0, 96, 96), box(96, 0, 96, 96), box(192, 0, 96, 96)],
      right: [box(0, 96, 96, 96), box(96, 96, 96, 96), box(192, 96, 96, 96)],
      up: [box(0, 192, 96, 96), box(96, 192, 96, 96), box(192, 192, 96, 96)],
      sideFaces: "right",
      width: 90,
      height: 92,
    },
    stormBirdBoss: {
      down: [box(0, 288, 96, 96), box(96, 288, 96, 96), box(192, 288, 96, 96)],
      right: [box(0, 384, 96, 96), box(96, 384, 96, 96), box(192, 384, 96, 96)],
      up: [box(0, 480, 96, 96), box(96, 480, 96, 96), box(192, 480, 96, 96)],
      sideFaces: "right",
      width: 84,
      height: 72,
    },
    wolf: {
      down: [box(0, 576, 96, 96), box(96, 576, 96, 96), box(192, 576, 96, 96)],
      right: [box(0, 672, 96, 96), box(96, 672, 96, 96), box(192, 672, 96, 96)],
      up: [box(0, 768, 96, 96), box(96, 768, 96, 96), box(192, 768, 96, 96)],
      sideFaces: "right",
      width: 58,
      height: 48,
    },
    wolfAlpha: {
      down: [box(0, 864, 96, 96), box(96, 864, 96, 96), box(192, 864, 96, 96)],
      right: [box(0, 960, 96, 96), box(96, 960, 96, 96), box(192, 960, 96, 96)],
      up: [box(0, 1056, 96, 96), box(96, 1056, 96, 96), box(192, 1056, 96, 96)],
      sideFaces: "right",
      width: 74,
      height: 58,
    },
  },
};

const allySprites = {
  healer: {
    down: [box(0, 0, 96, 144), box(96, 0, 96, 144), box(192, 0, 96, 144)],
    right: [box(0, 144, 96, 144), box(96, 144, 96, 144), box(192, 144, 96, 144)],
    up: [box(0, 288, 96, 144), box(96, 288, 96, 144), box(192, 288, 96, 144)],
    sideFaces: "right",
    width: 54,
    height: 86,
  },
};

const state = {
  width: 0,
  height: 0,
  time: 0,
  last: now(),
  terrainSeed: 0,
  camera: { x: 0, y: 0 },
  keys: new Set(),
  pointer: {
    active: false,
    id: null,
    startX: 0,
    startY: 0,
    x: 0,
    y: 0,
    startedAt: 0,
    vector: { x: 0, y: 0 },
  },
  menu: {
    open: false,
    submenu: null,
    x: 0,
    y: 0,
  },
  skillChoice: {
    open: false,
    pending: 0,
    options: [],
  },
  toastUntil: 0,
  eventAlertUntil: 0,
  spawnTimer: 0,
  wave: {
    index: 1,
    elapsed: 0,
    spawned: 0,
    spawnTimer: 0,
    timeoutWarned: false,
    fixedQueue: [],
    event: null,
  },
  resources: [],
  enemies: [],
  projectiles: [],
  traps: [],
  buildings: [],
  nextBuildingUid: 1,
  defenders: [],
  workers: [],
  drops: [],
  flyItems: [],
  particles: [],
  floatText: [],
  resourceSpawnTimer: 0,
};

const player = {
  x: 0,
  y: 0,
  radius: 20,
  speed: 210,
  facing: { x: 1, y: 0 },
  moveDir: "down",
  moving: false,
  hp: 120,
  maxHp: 120,
  level: 1,
  xp: 0,
  xpNext: playerXpRequired(1),
  wood: 40,
  stone: 25,
  gold: 18,
  iron: 14,
  meat: 8,
  starstone: 0,
  skills: {
    magnet: 0,
    xpBoost: 0,
    moveSpeed: 0,
    waterWalk: 0,
    shockwave: 0,
    hiding: 0,
    confusion: 0,
    axeMastery: 0,
    pickaxeMastery: 0,
    collectAll: 0,
    counter: 0,
    meleeRange: 0,
    rangedRange: 0,
    allySpeed: 0,
    allyPower: 0,
    lucky: 0,
    allyShotSpeed: 0,
    allyRange: 0,
    predictiveShot: 0,
  },
  unlocks: {
    weapons: { knife: true },
    enchants: {},
    builds: {},
    hires: {},
  },
  skillCooldowns: {},
  hiddenTime: 0,
  axeLevel: 1,
  pickaxeLevel: 1,
  attackTimer: 0,
  attackFx: null,
  harvestTarget: null,
  harvestPulse: 0,
};

const resourceDefs = {
  wood: {
    label: "木",
    amount: [5, 10],
    hp: 26,
    radius: 24,
    xp: 6,
    tool: "axe",
    color: "#78b957",
    shadow: "#3d762e",
  },
  stone: {
    label: "石",
    amount: [3, 7],
    hp: 34,
    radius: 20,
    xp: 8,
    tool: "pickaxe",
    color: "#aeb7b7",
    shadow: "#656f70",
  },
  gold: {
    label: "金",
    amount: [2, 5],
    hp: 48,
    radius: 18,
    xp: 14,
    tool: "pickaxe",
    color: "#f2bf49",
    shadow: "#936b22",
  },
  iron: {
    label: "鉄",
    amount: [3, 7],
    hp: 40,
    radius: 19,
    xp: 10,
    tool: "pickaxe",
    color: "#7d8d98",
    shadow: "#414d55",
  },
  starstone: {
    label: "星雫石",
    amount: [1, 1],
    hp: 180,
    radius: 18,
    xp: 28,
    tool: "pickaxe",
    color: "#cfa7ff",
    shadow: "#5d4a85",
    special: true,
  },
};

const itemVisuals = {
  wood: { label: "木", color: "#b77a43", particle: "#d49a58", dark: "#5d3925" },
  stone: { label: "石", color: "#aeb7b7", particle: "#d7ddda", dark: "#656f70" },
  gold: { label: "金", color: "#f2bf49", particle: "#ffe371", dark: "#936b22" },
  iron: { label: "鉄", color: "#7d8d98", particle: "#b8cacc", dark: "#414d55" },
  meat: { label: "肉", color: "#d96464", particle: "#ffbea6", dark: "#4b2224" },
  starstone: { label: "星雫石", color: "#cfa7ff", particle: "#efe0ff", dark: "#5d4a85" },
};

const MAX_SKILL_LEVEL = 10;
const skillDefs = [
  {
    key: "magnet",
    name: "アイテム吸着",
    type: "passive",
    icon: "assets/icons/skill-magnet.png",
    rarity: "common",
    weight: 14,
    summary: (level) => `回収範囲 +${level * 22}px。落ちた素材が近づくと吸い寄せられます`,
  },
  {
    key: "xpBoost",
    name: "レベルアップ速度",
    type: "passive",
    icon: "assets/icons/skill-xp.png",
    rarity: "common",
    weight: 11,
    summary: (level) => `獲得経験値 +${level * 8}%`,
  },
  {
    key: "moveSpeed",
    name: "移動速度",
    type: "passive",
    icon: "assets/icons/skill-speed.png",
    rarity: "common",
    weight: 12,
    summary: (level) => `移動速度 +${level * 5}%`,
  },
  {
    key: "waterWalk",
    name: "水上歩行",
    type: "passive",
    icon: "assets/icons/skill-waterwalk.png",
    rarity: "uncommon",
    weight: 8,
    summary: (level) => `池と沼の減速を ${Math.round(level * 10)}% 軽減`,
  },
  {
    key: "shockwave",
    name: "衝撃波",
    type: "active",
    icon: "assets/icons/skill-shockwave.png",
    rarity: "rare",
    weight: 6,
    summary: (level) => `範囲 ${120 + level * 18}px / 威力 ${28 + level * 8} / ノックバック`,
    cooldown: (level) => Math.max(7, 14 - level * 0.45),
  },
  {
    key: "hiding",
    name: "ハイディング",
    type: "active",
    icon: "assets/icons/skill-hiding.png",
    rarity: "rare",
    weight: 5,
    summary: (level) => `${(3 + level * 0.7).toFixed(1)}秒、敵から狙われにくくなります`,
    cooldown: (level) => Math.max(9, 18 - level * 0.55),
  },
  {
    key: "confusion",
    name: "混乱",
    type: "active",
    icon: "assets/icons/skill-confusion.png",
    rarity: "epic",
    weight: 3,
    summary: (level) => `範囲 ${150 + level * 20}px / ${(3.2 + level * 0.55).toFixed(1)}秒、敵同士が攻撃`,
    cooldown: (level) => Math.max(10, 20 - level * 0.6),
  },
  {
    key: "axeMastery",
    name: "斧強化",
    type: "passive",
    icon: "assets/icons/skill-axe.png",
    rarity: "common",
    weight: 10,
    summary: (level) => `伐採速度 +${level * 16}%`,
  },
  {
    key: "pickaxeMastery",
    name: "つるはし強化",
    type: "passive",
    icon: "assets/icons/skill-pickaxe.png",
    rarity: "common",
    weight: 10,
    summary: (level) => `採掘速度 +${level * 16}%`,
  },
  {
    key: "collectAll",
    name: "全ドロップ回収",
    type: "passive",
    icon: "assets/icons/skill-collect-all.png",
    rarity: "uncommon",
    weight: 7,
    summary: (level) => `取得時、地面の全ドロップを吸着。吸着速度 +${level * 12}%`,
    onAcquire: (level) => collectAllDrops(level),
  },
  {
    key: "counter",
    name: "カウンター",
    type: "passive",
    icon: "assets/icons/skill-counter.png",
    rarity: "rare",
    weight: 5,
    summary: (level) => `被ダメージ時、攻撃者へ ${level * 7}% 反射`,
  },
  {
    key: "meleeRange",
    name: "近接武器強化",
    type: "passive",
    icon: "assets/icons/skill-melee-range.png",
    rarity: "uncommon",
    weight: 7,
    summary: (level) => `近接武器の射程 +${level * 8}px`,
  },
  {
    key: "rangedRange",
    name: "遠距離武器強化",
    type: "passive",
    icon: "assets/icons/skill-ranged-range.png",
    rarity: "uncommon",
    weight: 7,
    summary: (level) => `遠距離/魔法武器の射程 +${level * 14}px`,
  },
  {
    key: "allySpeed",
    name: "味方移動速度",
    type: "passive",
    icon: "assets/icons/skill-ally-speed.png",
    rarity: "common",
    weight: 9,
    summary: (level) => `味方の移動速度 +${level * 7}%`,
  },
  {
    key: "allyPower",
    name: "味方強化",
    type: "passive",
    icon: "assets/icons/skill-ally-power.png",
    rarity: "uncommon",
    weight: 7,
    summary: (level) => `味方の最大HPと攻撃力 +${level * 7}%`,
  },
  {
    key: "lucky",
    name: "ラッキー",
    type: "passive",
    icon: "assets/icons/skill-lucky.png",
    rarity: "uncommon",
    weight: 7,
    summary: (level) => `追加ドロップ率 +${level * 6}%。素材と肉が少し増えやすくなります`,
  },
  {
    key: "allyShotSpeed",
    name: "味方射撃速度",
    type: "passive",
    icon: "assets/icons/skill-ally-shot-speed.png",
    rarity: "uncommon",
    weight: 6,
    summary: (level) => `味方と建物の遠距離弾速 +${level * 10}%`,
  },
  {
    key: "allyRange",
    name: "味方射程距離",
    type: "passive",
    icon: "assets/icons/skill-ally-range.png",
    rarity: "uncommon",
    weight: 6,
    summary: (level) => `味方の攻撃射程 +${level * 7}%`,
  },
  {
    key: "predictiveShot",
    name: "予測射撃",
    type: "passive",
    icon: "assets/icons/skill-predictive-shot.png",
    rarity: "epic",
    weight: 1,
    summary: (level) => `味方の射撃が敵の移動先を狙う精度 +${level * 8}%`,
  },
];

const weapons = [
  {
    id: "knife",
    name: "ナイフ",
    type: "近接",
    damage: 9,
    range: 58,
    rate: 1.75,
    knockback: 54,
    bleedChance: 0.05,
    lifesteal: 0,
    rarity: "common",
    weight: 0,
    rewardSummary: "最初から持っている短い近接武器",
    enchants: { damage: 0, speed: 0, knockback: 0, bleed: 0, lifesteal: 0, projectileSpeed: 0, range: 0, homing: 0 },
  },
  {
    id: "ironSword",
    name: "鉄の剣",
    type: "近接",
    damage: 17,
    range: 74,
    rate: 1.25,
    knockback: 140,
    bleedChance: 0.08,
    lifesteal: 0,
    rarity: "uncommon",
    weight: 8,
    rewardSummary: "高いノックバックを持つ安定した近接武器",
    enchants: { damage: 0, speed: 0, knockback: 0, bleed: 0, lifesteal: 0, projectileSpeed: 0, range: 0, homing: 0 },
  },
  {
    id: "duelistBlade",
    name: "決闘の細剣",
    type: "近接",
    damage: 11,
    range: 82,
    rate: 1.9,
    knockback: 72,
    bleedChance: 0.22,
    lifesteal: 0.03,
    rarity: "rare",
    weight: 5,
    rewardSummary: "攻撃速度と出血に優れる近接武器",
    enchants: { damage: 0, speed: 0, knockback: 0, bleed: 0, lifesteal: 0, projectileSpeed: 0, range: 0, homing: 0 },
  },
  {
    id: "longBow",
    name: "狩人の弓",
    type: "遠距離",
    damage: 13,
    range: 430,
    rate: 1.15,
    knockback: 58,
    bleedChance: 0.06,
    lifesteal: 0,
    projectileSpeed: 480,
    rarity: "uncommon",
    weight: 7,
    rewardSummary: "矢は無限。遠距離から敵を削れる",
    enchants: { damage: 0, speed: 0, knockback: 0, bleed: 0, lifesteal: 0, projectileSpeed: 0, range: 0, homing: 0 },
  },
  {
    id: "sparkStaff",
    name: "火花の杖",
    type: "魔法",
    damage: 21,
    range: 250,
    rate: 0.72,
    knockback: 96,
    bleedChance: 0,
    lifesteal: 0.06,
    projectileSpeed: 360,
    splash: 46,
    rarity: "rare",
    weight: 4,
    rewardSummary: "範囲ダメージを持つ魔法武器",
    enchants: { damage: 0, speed: 0, knockback: 0, bleed: 0, lifesteal: 0, projectileSpeed: 0, range: 0, homing: 0 },
  },
];

let equippedIndex = 0;

const enchantDefs = [
  { key: "damage", label: "攻撃力", icon: "assets/icons/enchant-damage.png", rarity: "common", weight: 10, cost: { iron: 10, gold: 5 } },
  { key: "speed", label: "攻撃速度", icon: "assets/icons/enchant-speed.png", rarity: "common", weight: 9, cost: { wood: 8, meat: 4, gold: 2 } },
  { key: "projectileSpeed", label: "射撃速度", icon: "assets/icons/enchant-projectile-speed.png", rarity: "uncommon", weight: 7, cost: { wood: 10, iron: 6, gold: 3 }, weaponTypes: ["遠距離", "魔法"] },
  { key: "range", label: "射程", icon: "assets/icons/enchant-range.png", rarity: "uncommon", weight: 7, cost: { wood: 10, stone: 6, iron: 6, gold: 3 } },
  { key: "knockback", label: "ノックバック", icon: "assets/icons/enchant-knockback.png", rarity: "uncommon", weight: 7, cost: { wood: 12, stone: 8, iron: 8 } },
  { key: "bleed", label: "出血", icon: "assets/icons/enchant-bleed.png", rarity: "rare", weight: 5, cost: { meat: 8, iron: 4, gold: 6 } },
  { key: "lifesteal", label: "吸血", icon: "assets/icons/enchant-lifesteal.png", rarity: "epic", weight: 3, cost: { meat: 12, gold: 12 } },
  { key: "homing", label: "ホーミング", icon: "assets/icons/enchant-homing.png", rarity: "epic", weight: 2, cost: { gold: 14, iron: 8, starstone: 1 }, weaponTypes: ["遠距離", "魔法"] },
];

const buildDefs = [
  {
    id: "bomb",
    label: "爆弾",
    icon: "assets/icons/build-bomb.png",
    type: "trap",
    rarity: "common",
    weight: 10,
    cost: { wood: 8, stone: 4, iron: 2 },
    radius: 25,
    life: 18,
    durability: 1,
  },
  {
    id: "pit",
    label: "落とし穴",
    icon: "assets/icons/build-pit.png",
    type: "trap",
    rarity: "common",
    weight: 9,
    cost: { wood: 10, stone: 14 },
    radius: 30,
    life: 36,
    durability: 4,
  },
  {
    id: "net",
    label: "捕獲網",
    icon: "assets/icons/build-net.png",
    type: "trap",
    rarity: "uncommon",
    weight: 7,
    cost: { wood: 16, meat: 2 },
    radius: 34,
    life: 30,
    durability: 3,
  },
  {
    id: "spikes",
    label: "毒のトゲ",
    icon: "assets/icons/build-spikes.png",
    type: "trap",
    rarity: "rare",
    weight: 5,
    cost: { wood: 12, stone: 8, iron: 4, meat: 2 },
    radius: 32,
    life: 34,
    durability: 6,
  },
  {
    id: "wall",
    label: "防壁",
    icon: "assets/icons/build-wall.png",
    type: "building",
    rarity: "common",
    weight: 9,
    cost: { wood: 8, stone: 6, iron: 1 },
    hp: 720,
  },
  {
    id: "tower",
    label: "物見やぐら",
    icon: "assets/icons/build-tower.png",
    type: "building",
    rarity: "uncommon",
    weight: 7,
    cost: { wood: 24, stone: 14, iron: 5, gold: 3 },
    hp: 720,
  },
  {
    id: "base",
    label: "拠点",
    icon: "assets/icons/build-base.png",
    type: "building",
    rarity: "uncommon",
    weight: 6,
    cost: { wood: 32, stone: 24, iron: 8, gold: 6, meat: 4 },
    hp: 860,
    healRadius: 440,
    healRate: 0.012,
  },
];

const hireDefs = [
  {
    id: "swordsman",
    label: "剣士",
    icon: "assets/icons/hire-swordsman.png",
    role: "swordsman",
    attackType: "melee",
    rarity: "common",
    weight: 9,
    cost: { wood: 10, iron: 12, meat: 6 },
    hp: 105,
    damage: 12,
    range: 66,
    rate: 1.1,
    knockback: 55,
    speed: 160,
  },
  {
    id: "archer",
    label: "弓兵",
    icon: "assets/icons/hire-archer.png",
    role: "archer",
    attackType: "ranged",
    rarity: "uncommon",
    weight: 7,
    cost: { wood: 18, iron: 6, meat: 8 },
    hp: 78,
    damage: 10,
    range: 250,
    rate: 0.95,
    knockback: 35,
    projectileSpeed: 430,
    speed: 156,
  },
  {
    id: "mage",
    label: "魔法使い",
    icon: "assets/icons/hire-mage.png",
    role: "mage",
    attackType: "magic",
    rarity: "rare",
    weight: 4,
    cost: { wood: 12, gold: 12, meat: 10 },
    hp: 68,
    damage: 14,
    range: 230,
    rate: 0.72,
    knockback: 45,
    projectileSpeed: 340,
    splash: 38,
    speed: 152,
  },
  {
    id: "lumberjack",
    label: "木こり",
    icon: "assets/icons/hire-lumberjack.png",
    role: "lumberjack",
    kind: "worker",
    targets: ["wood"],
    rarity: "common",
    weight: 10,
    cost: { wood: 14, stone: 4, meat: 3 },
    hp: 68,
    speed: 150,
    searchRadius: 360,
    leash: 430,
  },
  {
    id: "miner",
    label: "鉱夫",
    icon: "assets/icons/hire-miner.png",
    role: "miner",
    kind: "worker",
    targets: ["stone", "gold", "iron", "starstone"],
    rarity: "uncommon",
    weight: 7,
    cost: { wood: 12, stone: 10, gold: 4, meat: 4 },
    hp: 76,
    speed: 148,
    searchRadius: 390,
    leash: 450,
  },
  {
    id: "healer",
    label: "ヒーラー",
    icon: "assets/icons/hire-healer.png",
    role: "healer",
    kind: "healer",
    rarity: "rare",
    weight: 5,
    cost: { wood: 12, gold: 10, meat: 10 },
    hp: 58,
    speed: 138,
    healRange: 150,
    searchRadius: 760,
    leash: 460,
  },
  {
    id: "dog",
    label: "ワンコ",
    icon: "assets/icons/hire-dog.png",
    role: "dog",
    kind: "dog",
    rarity: "uncommon",
    weight: 8,
    cost: { wood: 8, meat: 8, gold: 3 },
    hp: 64,
    speed: 235,
    searchRadius: 620,
    leash: 520,
  },
  {
    id: "repairer",
    label: "修理職人",
    icon: "assets/icons/hire-repairer.png",
    role: "repairer",
    kind: "repairer",
    rarity: "uncommon",
    weight: 7,
    cost: { wood: 10, stone: 8, iron: 3, meat: 4 },
    hp: 72,
    speed: 154,
    searchRadius: 520,
    leash: 520,
  },
];

const enemyDefs = {
  redSlime: {
    id: "redSlime",
    label: "赤スライム",
    color: "#d94b4b",
    accent: "#fff0a3",
    radius: 17,
    hp: 28,
    speed: [54, 68],
    damage: 5,
    attackCooldown: 1.25,
    xp: 12,
    meatChance: 0.45,
    meatAmount: [1, 1],
    weight: 10,
    behavior: "melee",
  },
  blueSlime: {
    id: "blueSlime",
    label: "青スライム",
    color: "#3f86d8",
    accent: "#b9e8ff",
    radius: 19,
    hp: 64,
    speed: [36, 48],
    damage: 4,
    attackCooldown: 1.45,
    xp: 18,
    meatChance: 0.5,
    meatAmount: [1, 2],
    weight: 5,
    behavior: "melee",
  },
  greenSlime: {
    id: "greenSlime",
    label: "緑スライム",
    color: "#5fbf62",
    accent: "#d9ffd0",
    radius: 17,
    hp: 38,
    speed: [62, 76],
    damage: 6,
    attackCooldown: 1.2,
    xp: 16,
    meatChance: 0.48,
    meatAmount: [1, 2],
    weight: 4,
    behavior: "melee",
  },
  goblin: {
    id: "goblin",
    label: "ゴブリン",
    color: "#79a94a",
    accent: "#f1b84b",
    radius: 16,
    hp: 24,
    speed: [64, 78],
    damage: 10,
    attackCooldown: 1.05,
    xp: 18,
    meatChance: 0.35,
    meatAmount: [1, 1],
    weight: 5,
    behavior: "melee",
  },
  boar: {
    id: "boar",
    label: "イノシシ",
    color: "#8a5a3a",
    accent: "#e5d3b8",
    radius: 20,
    hp: 54,
    speed: [42, 52],
    damage: 12,
    attackCooldown: 1,
    chargeSpeed: 255,
    xp: 24,
    meatChance: 0.75,
    meatAmount: [1, 3],
    weight: 4,
    behavior: "boar",
  },
  boarBoss: {
    id: "boarBoss",
    label: "暴れ大イノシシ",
    color: "#8a5a3a",
    accent: "#f5d8b6",
    radius: 34,
    hp: 520,
    speed: [36, 48],
    damage: 26,
    attackCooldown: 1,
    chargeSpeed: 335,
    xp: 155,
    meatChance: 1,
    meatAmount: [6, 10],
    weight: 1,
    behavior: "boar",
    boss: true,
  },
  goblinArcher: {
    id: "goblinArcher",
    label: "ゴブリン弓兵",
    color: "#5f9f58",
    accent: "#d7b45e",
    radius: 15,
    hp: 22,
    speed: [56, 68],
    damage: 8,
    attackCooldown: 3,
    range: 245,
    projectileSpeed: 310,
    xp: 22,
    meatChance: 0.35,
    meatAmount: [1, 1],
    weight: 3,
    behavior: "ranged",
  },
  wolf: {
    id: "wolf",
    label: "狼",
    color: "#5f666a",
    accent: "#f5cf59",
    radius: 18,
    hp: 42,
    speed: [92, 116],
    damage: 9,
    attackCooldown: 0.85,
    xp: 24,
    meatChance: 0.82,
    meatAmount: [1, 2],
    weight: 4,
    behavior: "melee",
  },
  ogreBoss: {
    id: "ogreBoss",
    label: "巨大オーガ",
    color: "#69a25a",
    accent: "#f1e5b8",
    radius: 37,
    hp: 680,
    speed: [34, 44],
    damage: 30,
    attackCooldown: 1.55,
    xp: 180,
    meatChance: 1,
    meatAmount: [6, 10],
    weight: 1,
    behavior: "melee",
    boss: true,
  },
  stormBirdBoss: {
    id: "stormBirdBoss",
    label: "嵐鳥",
    color: "#466594",
    accent: "#82b5db",
    radius: 30,
    hp: 520,
    speed: [116, 144],
    damage: 22,
    attackCooldown: 0.8,
    xp: 175,
    meatChance: 1,
    meatAmount: [4, 7],
    weight: 1,
    behavior: "melee",
    boss: true,
  },
  wolfAlpha: {
    id: "wolfAlpha",
    label: "群れ狼の王",
    color: "#707884",
    accent: "#94c6ee",
    radius: 32,
    hp: 450,
    speed: [104, 132],
    damage: 18,
    attackCooldown: 0.72,
    xp: 160,
    meatChance: 1,
    meatAmount: [5, 8],
    weight: 1,
    behavior: "melee",
    boss: true,
  },
};

function resize() {
  const dpr = Math.max(1, Math.min(2, window.devicePixelRatio || 1));
  state.width = window.innerWidth;
  state.height = window.innerHeight;
  canvas.width = Math.floor(state.width * dpr);
  canvas.height = Math.floor(state.height * dpr);
  canvas.style.width = `${state.width}px`;
  canvas.style.height = `${state.height}px`;
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
}

function worldToScreen(p) {
  return {
    x: p.x - state.camera.x + state.width / 2,
    y: p.y - state.camera.y + state.height / 2,
  };
}

function screenToWorld(x, y) {
  return {
    x: x + state.camera.x - state.width / 2,
    y: y + state.camera.y - state.height / 2,
  };
}

function hash2(x, y) {
  const value = Math.sin(x * 127.1 + y * 311.7 + (state.terrainSeed || 0) * 0.000137) * 43758.5453123;
  return value - Math.floor(value);
}

function smoothstep(t) {
  return t * t * (3 - 2 * t);
}

function valueNoise(x, y) {
  const x0 = Math.floor(x);
  const y0 = Math.floor(y);
  const tx = smoothstep(x - x0);
  const ty = smoothstep(y - y0);
  const a = hash2(x0, y0);
  const b = hash2(x0 + 1, y0);
  const c = hash2(x0, y0 + 1);
  const d = hash2(x0 + 1, y0 + 1);
  const ab = a + (b - a) * tx;
  const cd = c + (d - c) * tx;
  return ab + (cd - ab) * ty;
}

function fbm(x, y, octaves = 4) {
  let total = 0;
  let amplitude = 0.5;
  let frequency = 1;
  let normalizer = 0;
  for (let i = 0; i < octaves; i += 1) {
    total += valueNoise(x * frequency, y * frequency) * amplitude;
    normalizer += amplitude;
    amplitude *= 0.5;
    frequency *= 2;
  }
  return total / normalizer;
}

function wetlandBasinAtTile(tx, ty) {
  const cellSize = 15;
  const baseX = Math.floor(tx / cellSize);
  const baseY = Math.floor(ty / cellSize);
  let best = null;

  for (let gy = baseY - 1; gy <= baseY + 1; gy += 1) {
    for (let gx = baseX - 1; gx <= baseX + 1; gx += 1) {
      const chance = hash2(gx * 13.7 + 9.1, gy * 17.3 - 4.8);
      if (chance > 0.58) continue;

      const centerX = (gx + 0.18 + hash2(gx + 21.3, gy - 8.2) * 0.64) * cellSize;
      const centerY = (gy + 0.18 + hash2(gx - 6.8, gy + 24.4) * 0.64) * cellSize;
      const radius = 2.4 + hash2(gx + 41.1, gy + 16.9) * 2.6;
      const raggedEdge = (fbm(tx * 0.55 + gx, ty * 0.55 + gy, 3) - 0.5) * 1.2;
      const d = Math.hypot(tx - centerX, ty - centerY);
      const score = d / Math.max(0.1, radius + raggedEdge);

      if (score < 1 && (!best || score < best.score)) {
        best = {
          kind: chance < 0.29 ? "pond" : "swamp",
          score,
        };
      }
    }
  }

  return best;
}

function terrainAtTile(tx, ty) {
  const safeDistance = Math.hypot(tx, ty);
  const pick = (frames, salt = 0) => frames[Math.floor(hash2(tx + salt, ty - salt) * frames.length) % frames.length];
  const basin = safeDistance > 4.5 ? wetlandBasinAtTile(tx, ty) : null;
  const waterNoise = fbm(tx * 0.055 + 42.3, ty * 0.055 - 19.7, 5);
  const swampNoise = fbm(tx * 0.07 - 88.4, ty * 0.07 + 61.1, 4);
  const verticalRoad = Math.abs(Math.sin(tx * 0.17 + fbm(3.2, ty * 0.075 + 10.4, 3) * 5.8));
  const horizontalRoad = Math.abs(Math.sin(ty * 0.15 + fbm(tx * 0.07 - 4.1, 15.6, 3) * 5.1));
  const hasVerticalRoad = safeDistance > 3.2 && verticalRoad < 0.07;
  const hasHorizontalRoad = safeDistance > 3.2 && horizontalRoad < 0.055;
  const isRoad = hasVerticalRoad || hasHorizontalRoad;
  const sparseNoise = fbm(tx * 0.12 + 5.5, ty * 0.12 + 34.2, 3);

  if (basin?.kind === "pond" || (safeDistance > 4.5 && waterNoise > 0.73)) {
    return { kind: "pond", frame: pick(terrainTiles.pond, 20), speed: 0.56, allowsTrees: false };
  }
  if (basin?.kind === "swamp" || (safeDistance > 4.5 && swampNoise > 0.71)) {
    return { kind: "swamp", frame: pick(terrainTiles.swamp, 40), speed: 0.42, allowsTrees: false };
  }
  if (isRoad) {
    if (hasVerticalRoad && hasHorizontalRoad) {
      return { kind: "path", frame: terrainTiles.pathCross[0], speed: 1.08, allowsTrees: false };
    }
    if (hasHorizontalRoad) {
      return { kind: "path", frame: pick(terrainTiles.pathVertical, 60), rotation: Math.PI / 2, speed: 1.08, allowsTrees: false };
    }
    return { kind: "path", frame: pick(terrainTiles.pathVertical, 60), speed: 1.08, allowsTrees: false };
  }
  if (sparseNoise > 0.62) {
    return { kind: "sparse", frame: pick(terrainTiles.sparse, 80), speed: 0.98, allowsTrees: true, treeDensity: 0.42 };
  }
  return { kind: "grass", frame: pick(terrainTiles.grass, 100), speed: 1, allowsTrees: true, treeDensity: 1 };
}

function terrainAtPosition(x, y) {
  return terrainAtTile(Math.floor(x / TERRAIN_TILE_SIZE), Math.floor(y / TERRAIN_TILE_SIZE));
}

function terrainSpeedAt(x, y) {
  return terrainAtPosition(x, y).speed;
}

function directionFromVector(x, y, fallback = "down") {
  if (Math.hypot(x, y) < 0.05) return fallback;
  if (Math.abs(x) > Math.abs(y)) return x < 0 ? "left" : "right";
  return y < 0 ? "up" : "down";
}

function spriteFrame(set, dir, moving, speed = 7) {
  const useDir = dir === "left" || dir === "right" ? "right" : dir;
  const frames = set[useDir] || set.down;
  const index = moving ? Math.floor(state.time * speed) % frames.length : Math.min(1, frames.length - 1);
  const sideFaces = set.sideFaces || "right";
  return {
    frame: frames[index],
    flip: (dir === "left" && sideFaces === "right") || (dir === "right" && sideFaces === "left"),
    width: set.width,
    height: set.height,
  };
}

function drawSpriteFrame(frame, screenX, groundY, width, height, options = {}) {
  return drawSpriteFrameFrom(spriteSheet, spritesReady, frame, screenX, groundY, width, height, options);
}

function drawCustomSpriteFrame(frame, screenX, groundY, width, height, options = {}) {
  return drawSpriteFrameFrom(customSpriteSheet, customSpritesReady, frame, screenX, groundY, width, height, options);
}

function drawBossSpriteFrame(frame, screenX, groundY, width, height, options = {}) {
  return drawSpriteFrameFrom(bossSpriteSheet, bossSpritesReady, frame, screenX, groundY, width, height, options);
}

function drawHealerSpriteFrame(frame, screenX, groundY, width, height, options = {}) {
  return drawSpriteFrameFrom(healerSpriteSheet, healerSpritesReady, frame, screenX, groundY, width, height, options);
}

function drawSpriteFrameFrom(sheet, ready, frame, screenX, groundY, width, height, options = {}) {
  if (!ready) return false;
  ctx.save();
  ctx.translate(screenX, groundY);
  if (options.alpha != null) ctx.globalAlpha = options.alpha;
  if (options.flip) ctx.scale(-1, 1);
  ctx.imageSmoothingEnabled = false;
  ctx.drawImage(sheet, frame.x, frame.y, frame.w, frame.h, -width / 2, -height, width, height);
  ctx.restore();
  return true;
}

function drawSpriteShadow(screenX, screenY, width, height, alpha = 0.24) {
  ctx.fillStyle = `rgba(0,0,0,${alpha})`;
  ctx.beginPath();
  ctx.ellipse(screenX, screenY, width / 2, height / 2, 0, 0, TAU);
  ctx.fill();
}

function hideMenuPanels() {
  ui.weaponPanel.hidden = true;
  ui.enchantPanel.hidden = true;
  ui.buildPanel.hidden = true;
  ui.hirePanel.hidden = true;
  ui.skillPanel.hidden = true;
}

function clearPointerControl() {
  state.pointer.active = false;
  state.pointer.id = null;
  state.pointer.startedAt = 0;
  state.pointer.vector.x = 0;
  state.pointer.vector.y = 0;
  ui.joystick.hidden = true;
  ui.joystickKnob.style.transform = "translate(0, 0)";
}

function clampMenuAnchor(x, y) {
  const radius = window.innerWidth <= 680 ? 116 : 140;
  return {
    x: clamp(x, radius + 8, window.innerWidth - radius - 8),
    y: clamp(y, radius + 8, window.innerHeight - radius - 8),
  };
}

function positionPanel(panel, x, y) {
  panel.hidden = false;
  panel.style.visibility = "hidden";
  panel.style.left = "0px";
  panel.style.top = "0px";
  panel.style.right = "auto";
  panel.style.bottom = "auto";
  panel.style.margin = "0";

  const rect = panel.getBoundingClientRect();
  const offsetX = x < window.innerWidth / 2 ? 22 : -rect.width - 22;
  const offsetY = y < window.innerHeight / 2 ? 22 : -rect.height - 22;
  const left = clamp(x + offsetX, 10, window.innerWidth - rect.width - 10);
  const top = clamp(y + offsetY, 10, window.innerHeight - rect.height - 10);

  panel.style.left = `${left}px`;
  panel.style.top = `${top}px`;
  panel.style.visibility = "";
}

function openWorldMenu(x, y) {
  clearPointerControl();
  state.keys.clear();
  renderStaticUi();
  hideMenuPanels();
  const availability = updateRadialMenuAvailability();
  if (!Object.values(availability).some(Boolean)) {
    showToast("メニュー項目はレベルアップ報酬で解放されます");
    return;
  }
  const point = clampMenuAnchor(x, y);
  state.menu.open = true;
  state.menu.submenu = null;
  state.menu.x = point.x;
  state.menu.y = point.y;
  ui.menuBackdrop.hidden = false;
  ui.radialMenu.hidden = false;
  ui.radialMenu.style.left = `${point.x}px`;
  ui.radialMenu.style.top = `${point.y}px`;
}

function openWorldMenuAtPlayer() {
  const p = worldToScreen(player);
  openWorldMenu(p.x, p.y);
}

function closeWorldMenu() {
  state.menu.open = false;
  state.menu.submenu = null;
  ui.menuBackdrop.hidden = true;
  ui.radialMenu.hidden = true;
  hideMenuPanels();
}

function openSubmenu(kind) {
  if (!state.menu.open) return;
  const availability = updateRadialMenuAvailability();
  if (!availability[kind]) return;
  hideMenuPanels();
  ui.radialMenu.hidden = true;
  state.menu.submenu = kind;
  const panels = {
    weapons: ui.weaponPanel,
    enchants: ui.enchantPanel,
    build: ui.buildPanel,
    hire: ui.hirePanel,
    skills: hasAcquiredSkills() ? ui.skillPanel : null,
  };
  const panel = panels[kind];
  if (panel) positionPanel(panel, state.menu.x, state.menu.y);
}

function openWeaponMenuFromHud() {
  if (!ui.equippedWeaponHud) return;
  if (state.menu.open) closeWorldMenu();
  const rect = ui.equippedWeaponHud.getBoundingClientRect();
  openWorldMenu(rect.left + rect.width / 2, rect.top + rect.height / 2);
  if (state.menu.open) openSubmenu("weapons");
}

function canAfford(cost) {
  return Object.entries(cost).every(([key, value]) => player[key] >= value);
}

function pay(cost) {
  if (!canAfford(cost)) return false;
  Object.entries(cost).forEach(([key, value]) => {
    player[key] -= value;
  });
  return true;
}

function costText(cost) {
  return costEntries(cost)
    .map((entry) => `${entry.label}${entry.need}`)
    .join(" ");
}

const resourceLabels = {
  wood: "木",
  stone: "石",
  gold: "金",
  iron: "鉄",
  meat: "肉",
  starstone: "星雫石",
};

function costEntries(cost) {
  return resourceKeys
    .map((key) => ({ key, label: resourceLabels[key], need: cost[key] || 0, have: Math.floor(player[key]) }))
    .filter((entry) => entry.need > 0);
}

function enrichCost(cost) {
  const entries = costEntries(cost).map((entry) => ({
    ...entry,
    shortage: Math.max(0, entry.need - entry.have),
  }));
  return {
    entries,
    affordable: entries.every((entry) => entry.shortage === 0),
  };
}

function scaledCost(cost, level, scale = 0.7) {
  return Object.fromEntries(
    Object.entries(cost).map(([key, value]) => [key, Math.round(value * (1 + level * scale))]),
  );
}

function formationOffset(index) {
  const slot = index % 6;
  const ring = 58 + Math.floor(index / 6) * 28;
  const angle = -Math.PI / 2 + (slot / 6) * TAU;
  return {
    x: Math.cos(angle) * ring,
    y: Math.sin(angle) * ring,
  };
}

function skillLevel(key) {
  return player.skills[key] || 0;
}

function enchantLevel(weapon, key) {
  if (!weapon.enchants) weapon.enchants = {};
  if (weapon.enchants[key] == null) weapon.enchants[key] = 0;
  return weapon.enchants[key];
}

function enchantAppliesToWeapon(def, weapon) {
  return !def.weaponTypes || def.weaponTypes.includes(weapon.type);
}

function allyRangeMultiplier() {
  return 1 + skillLevel("allyRange") * 0.07;
}

function allyShotSpeedMultiplier() {
  return 1 + skillLevel("allyShotSpeed") * 0.1;
}

function baseBuildings() {
  return state.buildings.filter((building) => building.id === "base" && building.hp > 0);
}

function baseRadius(base) {
  const defRadius = buildDefById("base")?.healRadius || 440;
  return Math.max(base?.healRadius || defRadius, defRadius);
}

function baseWorkRadius(base) {
  return baseRadius(base) * (1 + BASE_DUTY_EXTRA_RADIUS);
}

function assignedBase(ally) {
  if (!ally?.assignedBaseUid) return null;
  const base = baseBuildings().find((building) => building.uid === ally.assignedBaseUid);
  if (!base) {
    ally.assignedBaseUid = null;
    return null;
  }
  return base;
}

function nearestBaseTo(entity) {
  let best = null;
  let bestDistance = Infinity;
  for (const base of baseBuildings()) {
    const d = Math.hypot(base.x - entity.x, base.y - entity.y);
    if (d < bestDistance) {
      best = base;
      bestDistance = d;
    }
  }
  return best;
}

function allyHomePosition(ally) {
  const base = assignedBase(ally);
  if (base) {
    return {
      x: base.x + (ally.homeOffset?.x || 0) * 0.32,
      y: base.y + (ally.homeOffset?.y || 0) * 0.32,
      base,
    };
  }
  return {
    x: player.x + (ally.homeOffset?.x || 0),
    y: player.y + (ally.homeOffset?.y || 0),
    base: null,
  };
}

function withinAssignedBase(ally, target, padding = 0) {
  const base = assignedBase(ally);
  if (!base) return true;
  return Math.hypot(target.x - base.x, target.y - base.y) <= baseWorkRadius(base) + padding;
}

function clearAllyWorkTargets(ally) {
  ally.harvestTarget = null;
  ally.repairTarget = null;
  ally.healTarget = null;
  ally.fetchTarget = null;
  if (ally.repairJob) cancelRepairJob(ally);
}

function isCombatAlly(ally) {
  return ally.attackType === "melee" || ally.attackType === "ranged" || ally.attackType === "magic";
}

function assignedBaseThreat(ally) {
  const base = assignedBase(ally);
  if (!base || isCombatAlly(ally)) return null;
  const baseThreatRadius = baseRadius(base) + BASE_THREAT_RADIUS_PADDING;
  for (const enemy of state.enemies) {
    if (enemy.hp <= 0) continue;
    const nearAlly = Math.hypot(enemy.x - ally.x, enemy.y - ally.y) <= BASE_WORKER_THREAT_RADIUS;
    const nearBase = Math.hypot(enemy.x - base.x, enemy.y - base.y) <= baseThreatRadius;
    if (nearAlly || nearBase) return enemy;
  }
  return null;
}

function retreatAssignedWorkerIfThreatened(ally, dt) {
  const base = assignedBase(ally);
  if (!base || isCombatAlly(ally) || !assignedBaseThreat(ally)) return false;
  clearAllyWorkTargets(ally);
  const home = allyHomePosition(ally);
  moveAllyToward(ally, home.x, home.y, dt, 10);
  ally.fleeingBase = true;
  return true;
}

function assignAllyToNearestBase(ally) {
  const base = nearestBaseTo(ally);
  if (!base) {
    showToast("拠点がありません");
    return false;
  }
  ally.assignedBaseUid = base.uid;
  clearAllyWorkTargets(ally);
  showToast(`${ally.label}を${base.label}勤務にしました`);
  addFloatText("拠点勤務", ally.x, ally.y - 50, "#7dd3ff");
  addParticles(ally.x, ally.y, "#7dd3ff", 14, 105);
  return true;
}

function clearAllyBaseAssignment(ally) {
  const base = assignedBase(ally);
  if (!base) {
    ally.assignedBaseUid = null;
    return false;
  }
  clearAllyWorkTargets(ally);
  ally.assignedBaseUid = null;
  ally.fleeingBase = false;
  showToast(`${ally.label}の拠点勤務を解除しました`);
  addFloatText("勤務解除", ally.x, ally.y - 50, "#f6f0db");
  addParticles(ally.x, ally.y, "#f6f0db", 12, 90);
  return true;
}

function toggleAllyBaseAssignment(ally) {
  if (assignedBase(ally)) return clearAllyBaseAssignment(ally);
  return assignAllyToNearestBase(ally);
}

const rarityDefs = {
  common: { label: "通常", weight: 10 },
  uncommon: { label: "希少", weight: 7 },
  rare: { label: "レア", weight: 4 },
  epic: { label: "エピック", weight: 2 },
};

function rarityLabel(rarity) {
  return rarityDefs[rarity]?.label || rarityDefs.common.label;
}

function skillTypeLabel(type) {
  return type === "passive" ? "パッシブ" : "アクティブ";
}

function unlockBucket(kind) {
  return player.unlocks[kind] || {};
}

function isUnlocked(kind, key) {
  return Boolean(unlockBucket(kind)[key]);
}

function setUnlocked(kind, key) {
  if (!player.unlocks[kind]) player.unlocks[kind] = {};
  player.unlocks[kind][key] = true;
}

function unlockedWeapons() {
  return weapons.filter((weapon) => isUnlocked("weapons", weapon.id));
}

function unlockedEnchants() {
  return enchantDefs.filter((def) => isUnlocked("enchants", def.key));
}

function unlockedBuilds() {
  return buildDefs.filter((def) => isUnlocked("builds", def.id));
}

function unlockedHires() {
  return hireDefs.filter((def) => isUnlocked("hires", def.id));
}

function menuAvailability() {
  return {
    weapons: unlockedWeapons().length > 0,
    enchants: unlockedEnchants().length > 0,
    build: unlockedBuilds().length > 0,
    hire: unlockedHires().length > 0,
    skills: hasAcquiredSkills(),
  };
}

function updateRadialMenuAvailability() {
  const availability = menuAvailability();
  if (ui.radialWeapons) ui.radialWeapons.hidden = !availability.weapons;
  if (ui.radialEnchants) ui.radialEnchants.hidden = !availability.enchants;
  if (ui.radialBuild) ui.radialBuild.hidden = !availability.build;
  if (ui.radialHire) ui.radialHire.hidden = !availability.hire;
  if (ui.radialSkills) ui.radialSkills.hidden = !availability.skills;
  return availability;
}

function shuffleList(items) {
  const copy = [...items];
  for (let i = copy.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

function availableSkillDefs() {
  return skillDefs.filter((def) => skillLevel(def.key) < MAX_SKILL_LEVEL);
}

function acquiredSkillDefs() {
  return skillDefs.filter((def) => skillLevel(def.key) > 0);
}

function hasAcquiredSkills() {
  return acquiredSkillDefs().length > 0;
}

function rewardWeight(item) {
  return item.weight ?? rarityDefs[item.rarity || "common"]?.weight ?? 1;
}

function weightedChoices(items, count) {
  const pool = [...items];
  const picks = [];
  while (pool.length > 0 && picks.length < count) {
    const total = pool.reduce((sum, item) => sum + rewardWeight(item), 0);
    let roll = Math.random() * total;
    const index = pool.findIndex((item) => {
      roll -= rewardWeight(item);
      return roll <= 0;
    });
    const pickIndex = index >= 0 ? index : pool.length - 1;
    picks.push(pool[pickIndex]);
    pool.splice(pickIndex, 1);
  }
  return picks;
}

function availableRewards() {
  const rewards = [];
  for (const def of skillDefs) {
    if (skillLevel(def.key) >= MAX_SKILL_LEVEL) continue;
    rewards.push({
      id: `skill:${def.key}`,
      kind: "skill",
      key: def.key,
      name: def.name,
      icon: def.icon,
      rarity: def.rarity,
      weight: def.weight,
      summary: def.summary(Math.min(MAX_SKILL_LEVEL, skillLevel(def.key) + 1)),
      meta: `${skillTypeLabel(def.type)} / LV ${skillLevel(def.key)} > ${skillLevel(def.key) + 1}`,
    });
  }
  for (const weapon of weapons) {
    if (isUnlocked("weapons", weapon.id)) continue;
    rewards.push({
      id: `weapon:${weapon.id}`,
      kind: "weapon",
      key: weapon.id,
      name: weapon.name,
      icon: `assets/sprites/icons/${weapon.id}.png`,
      rarity: weapon.rarity,
      weight: weapon.weight,
      summary: weapon.rewardSummary || `${weapon.type} / 攻${weapon.damage} / 射程${weapon.range}`,
      meta: "武器解放",
    });
  }
  for (const def of enchantDefs) {
    if (isUnlocked("enchants", def.key)) continue;
    rewards.push({
      id: `enchant:${def.key}`,
      kind: "enchant",
      key: def.key,
      name: def.label,
      icon: def.icon,
      rarity: def.rarity,
      weight: def.weight,
      summary: "エンチャントメニューで強化できるようになります",
      meta: "エンチャント解放",
    });
  }
  for (const def of buildDefs) {
    if (isUnlocked("builds", def.id)) continue;
    rewards.push({
      id: `build:${def.id}`,
      kind: "build",
      key: def.id,
      name: def.label,
      icon: def.icon,
      rarity: def.rarity,
      weight: def.weight,
      summary: `${def.type === "trap" ? "設置トラップ" : "建物"}を設置できるようになります`,
      meta: "設置解放",
    });
  }
  for (const def of hireDefs) {
    if (isUnlocked("hires", def.id)) continue;
    const hireSummary = def.kind === "worker"
      ? "採取役を雇えるようになります"
      : def.kind === "dog"
        ? "落ちた素材を回収するワンコを雇えるようになります"
        : def.kind === "repairer"
          ? "設置物を修理する職人を雇えるようになります"
          : def.kind === "healer"
            ? "味方を回復する支援役を雇えるようになります"
            : "戦闘役を雇えるようになります";
    rewards.push({
      id: `hire:${def.id}`,
      kind: "hire",
      key: def.id,
      name: def.label,
      icon: def.icon,
      rarity: def.rarity,
      weight: def.weight,
      summary: hireSummary,
      meta: "雇用解放",
    });
  }
  return rewards;
}

function skillSummary(def, level = skillLevel(def.key)) {
  const nextLevel = clamp(level || 1, 1, MAX_SKILL_LEVEL);
  return def.summary(nextLevel);
}

function skillCardMarkup(def, options = {}) {
  const level = skillLevel(def.key);
  const previewLevel = options.previewLevel ?? Math.min(MAX_SKILL_LEVEL, level + 1);
  const levelText = options.choice ? `LV ${level} > ${previewLevel}` : `LV ${level}/${MAX_SKILL_LEVEL}`;
  return `
    <span class="skill-icon"><img src="${def.icon}" alt=""></span>
    <span>
      <strong>${def.name}</strong>
      <small>${skillTypeLabel(def.type)} / ${options.choice ? `${levelText} / ` : ""}${def.summary(options.choice ? previewLevel : Math.max(1, level))}</small>
    </span>
    ${options.choice ? "" : `<span class="skill-level">${levelText}</span>`}
  `;
}

function renderSkillPanel() {
  ui.skillButtons.innerHTML = "";
  const visibleSkills = acquiredSkillDefs();
  visibleSkills.forEach((def) => {
    const level = skillLevel(def.key);
    const button = document.createElement("button");
    button.type = "button";
    button.className = `skill-card ${def.type}`;
    const cooldown = player.skillCooldowns[def.key] || 0;
    button.innerHTML = `
      <span class="skill-icon"><img src="${def.icon}" alt=""></span>
      <span>
        <strong>${def.name}</strong>
        <small>${skillTypeLabel(def.type)} / ${level > 0 ? def.summary(level) : "未取得"}</small>
        <span class="skill-meta">
          <span class="rarity-badge rarity-${def.rarity || "common"}">${rarityLabel(def.rarity || "common")}</span>
          <span class="reward-kind">LV ${level}/${MAX_SKILL_LEVEL}</span>
        </span>
      </span>
    `;
    if (def.type === "passive") {
      button.classList.add("passive");
    }
    const wrapper = document.createElement("div");
    wrapper.className = "skill-row";
    wrapper.appendChild(button);
    if (def.type === "active") {
      const useButton = document.createElement("button");
      useButton.type = "button";
      useButton.className = "skill-use";
      useButton.textContent = cooldown > 0 ? `${cooldown.toFixed(1)}秒` : "発動";
      useButton.disabled = level <= 0 || cooldown > 0;
      useButton.addEventListener("click", () => activateSkill(def.key));
      wrapper.appendChild(useButton);
    }
    ui.skillButtons.appendChild(wrapper);
  });
}

function renderSkillChoices() {
  ui.skillChoiceButtons.innerHTML = "";
  state.skillChoice.options.forEach((reward) => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "skill-choice-card";
    const rarity = reward.rarity || "common";
    button.innerHTML = `
      <span class="skill-icon"><img src="${reward.icon}" alt=""></span>
      <span class="choice-copy">
        <strong><span class="rarity-badge rarity-${rarity}">${rarityLabel(rarity)}</span> ${reward.name}</strong>
        <span class="reward-kind">${reward.meta}</span>
        <small>${reward.summary}</small>
      </span>
    `;
    button.addEventListener("click", () => selectReward(reward));
    ui.skillChoiceButtons.appendChild(button);
  });
  updateRerollUi();
}

function updateRerollUi() {
  if (!ui.rerollRewards || !ui.rerollCount) return;
  const count = Math.floor(player.starstone || 0);
  ui.rerollCount.textContent = `星雫石 ${count}`;
  ui.rerollRewards.disabled = count < 1 || !state.skillChoice.open;
}

function rerollSkillChoices() {
  if (!state.skillChoice.open) return;
  if ((player.starstone || 0) < 1) {
    showToast("リロールには星雫石が必要です");
    updateRerollUi();
    return;
  }
  const choices = weightedChoices(availableRewards(), 3);
  if (choices.length === 0) {
    showToast("選択できる報酬がありません");
    return;
  }
  player.starstone -= 1;
  state.skillChoice.options = choices;
  addParticles(player.x, player.y, "#cfa7ff", 22, 160);
  showToast("星雫石を使って報酬をリロールしました");
  renderSkillChoices();
}

function openSkillChoice() {
  const choices = weightedChoices(availableRewards(), 3);
  if (choices.length === 0) {
    state.skillChoice.pending = 0;
    showToast("選択できる報酬がありません");
    return;
  }
  state.skillChoice.open = true;
  state.skillChoice.options = choices;
  clearPointerControl();
  state.keys.clear();
  ui.levelUpBackdrop.hidden = false;
  ui.levelUpPanel.hidden = false;
  renderSkillChoices();
}

function queueSkillChoice() {
  state.skillChoice.pending += 1;
  if (!state.skillChoice.open) openSkillChoice();
}

function closeSkillChoice() {
  state.skillChoice.open = false;
  state.skillChoice.options = [];
  ui.levelUpBackdrop.hidden = true;
  ui.levelUpPanel.hidden = true;
  updateRerollUi();
}

function selectReward(reward) {
  if (!reward) return;
  let message = "";
  if (reward.kind === "skill") {
    const def = skillDefs.find((item) => item.key === reward.key);
    if (!def || skillLevel(reward.key) >= MAX_SKILL_LEVEL) return;
    player.skills[reward.key] += 1;
    if (def.onAcquire) def.onAcquire(player.skills[reward.key]);
    syncAllies();
    message = `${def.name} LV${player.skills[reward.key]} を取得しました`;
  }
  if (reward.kind === "weapon") {
    setUnlocked("weapons", reward.key);
    message = `${reward.name}を入手しました。装備変更は武器メニューから行えます`;
  }
  if (reward.kind === "enchant") {
    setUnlocked("enchants", reward.key);
    message = `${reward.name}のエンチャントを解放しました`;
  }
  if (reward.kind === "build") {
    setUnlocked("builds", reward.key);
    message = `${reward.name}を設置できるようになりました`;
  }
  if (reward.kind === "hire") {
    setUnlocked("hires", reward.key);
    message = `${reward.name}を雇えるようになりました`;
  }
  addParticles(player.x, player.y, "#7dd3ff", 32, 180);
  showToast(message);
  closeSkillChoice();
  state.skillChoice.pending = Math.max(0, state.skillChoice.pending - 1);
  renderStaticUi();
  if (state.skillChoice.pending > 0) openSkillChoice();
}

function xpMultiplier() {
  return 1 + skillLevel("xpBoost") * 0.08;
}

function moveSpeedMultiplier() {
  return 1 + skillLevel("moveSpeed") * 0.05;
}

function playerTerrainSpeedAt(x, y) {
  const base = terrainSpeedAt(x, y);
  const waterLevel = skillLevel("waterWalk");
  if (waterLevel <= 0 || base >= 1) return base;
  return base + (1 - base) * clamp(waterLevel / MAX_SKILL_LEVEL, 0, 1);
}

function dropMagnetRange() {
  return 46 + skillLevel("magnet") * 22;
}

function isAlly(entity) {
  return state.defenders.includes(entity) || state.workers.includes(entity);
}

function allyMaxHp(ally) {
  const base = ally.baseMaxHp || ally.maxHp || ally.hp || 1;
  return Math.round(base * (1 + (ally.level - 1) * 0.13 + skillLevel("allyPower") * 0.07));
}

function allyDamage(ally) {
  const base = ally.baseDamage || ally.damage || 0;
  return base * (1 + (ally.level - 1) * 0.1 + skillLevel("allyPower") * 0.07);
}

function allyMoveSpeed(ally) {
  const base = ally.baseSpeed || ally.speed || 150;
  return base * (1 + (ally.level - 1) * 0.055 + skillLevel("allySpeed") * 0.07);
}

function syncAllyStats(ally, heal = false) {
  ally.level = ally.level || 1;
  ally.xp = ally.xp || 0;
  ally.xpNext = ally.xpNext || 54;
  ally.maxHp = allyMaxHp(ally);
  if (heal) ally.hp = ally.maxHp;
  else ally.hp = clamp(ally.hp, 0, ally.maxHp);
  if (ally.baseDamage != null) ally.damage = allyDamage(ally);
  ally.speed = allyMoveSpeed(ally);
}

function syncAllies() {
  [...state.defenders, ...state.workers].forEach((ally) => syncAllyStats(ally));
}

function allyGainXp(ally, amount) {
  if (!ally) return;
  syncAllyStats(ally);
  ally.xp += amount;
  while (ally.xp >= ally.xpNext) {
    ally.xp -= ally.xpNext;
    ally.level += 1;
    ally.xpNext = Math.round(ally.xpNext * 1.28 + 24);
    syncAllyStats(ally, true);
    addFloatText(`${ally.label} LV${ally.level}`, ally.x, ally.y - 46, "#7dd3ff");
    addParticles(ally.x, ally.y, "#7dd3ff", 18, 145);
  }
}

function activateSkill(key) {
  const def = skillDefs.find((item) => item.key === key);
  const level = skillLevel(key);
  if (!def || def.type !== "active" || level <= 0) return;
  const cooldown = player.skillCooldowns[key] || 0;
  if (cooldown > 0) {
    showToast(`${def.name}はあと ${cooldown.toFixed(1)}秒`);
    return;
  }

  if (key === "shockwave") {
    const radius = 120 + level * 18;
    const damage = 28 + level * 8;
    for (const enemy of state.enemies) {
      const d = Math.hypot(enemy.x - player.x, enemy.y - player.y);
      if (d <= radius) {
        damageEnemy(enemy, damage * (1 - d / (radius * 1.35)), player, {
          knockback: 180 + level * 24,
          color: "#7dd3ff",
        });
      }
    }
    addParticles(player.x, player.y, "#7dd3ff", 52, 310);
    addFloatText("衝撃波", player.x, player.y - 48, "#7dd3ff");
  }

  if (key === "hiding") {
    player.hiddenTime = Math.max(player.hiddenTime, 3 + level * 0.7);
    addParticles(player.x, player.y, "#d8e6d3", 28, 130);
    addFloatText("ハイディング", player.x, player.y - 48, "#d8e6d3");
  }

  if (key === "confusion") {
    const radius = 150 + level * 20;
    const duration = 3.2 + level * 0.55;
    for (const enemy of state.enemies) {
      if (Math.hypot(enemy.x - player.x, enemy.y - player.y) <= radius) {
        enemy.confused = Math.max(enemy.confused || 0, duration);
        enemy.confusionRange = 120 + level * 10;
      }
    }
    addParticles(player.x, player.y, "#e756d9", 42, 210);
    addFloatText("混乱", player.x, player.y - 48, "#f0a6ff");
  }

  player.skillCooldowns[key] = def.cooldown(level);
  closeWorldMenu();
}

function updateSkillTimers(dt) {
  player.hiddenTime = Math.max(0, player.hiddenTime - dt);
  for (const key of Object.keys(player.skillCooldowns)) {
    player.skillCooldowns[key] = Math.max(0, player.skillCooldowns[key] - dt);
  }
}

function actionButtonMarkup({ icon, label, detail = "", cost }) {
  const { entries } = enrichCost(cost);
  const iconMarkup = /\.png$/i.test(icon)
    ? `<img src="${icon}" alt="">`
    : icon;
  const costs = entries.map((entry) => {
    const shortage = entry.shortage ? `<b>-${entry.shortage}</b>` : "";
    return `
      <span class="cost-chip ${entry.key}${entry.shortage ? " shortage" : " enough"}" data-resource="${entry.key}">
        <i></i><span>${entry.label}</span><strong>${entry.have}/${entry.need}</strong>${shortage}
      </span>
    `;
  }).join("");

  return `
    <span class="action-icon">${iconMarkup}</span>
    <span class="action-copy">
      <strong>${label}</strong>
      ${detail ? `<small>${detail}</small>` : ""}
      <span class="cost-row">${costs}</span>
    </span>
  `;
}

function setActionButtonAffordability(button, cost) {
  const { affordable } = enrichCost(cost);
  button.disabled = !affordable;
  button.classList.toggle("unaffordable", !affordable);
  button.classList.toggle("affordable", affordable);
}

function showToast(message) {
  ui.toast.textContent = message;
  ui.toast.hidden = false;
  state.toastUntil = state.time + 2.3;
}

function showEventAlert(title, detail) {
  if (!ui.eventAlert) return;
  ui.eventAlert.innerHTML = `<strong>${title}</strong><span>${detail}</span>`;
  ui.eventAlert.hidden = false;
  state.eventAlertUntil = state.time + 4.2;
}

function addFloatText(text, x, y, color = "#f6f0db") {
  state.floatText.push({ text, x, y, color, age: 0, life: 0.85 });
}

function addParticles(x, y, color, count = 8, power = 90) {
  for (let i = 0; i < count; i += 1) {
    const angle = rand(0, TAU);
    const speed = rand(power * 0.25, power);
    state.particles.push({
      x,
      y,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      color,
      age: 0,
      life: rand(0.32, 0.78),
      size: rand(2, 5),
      shape: "round",
      rotation: rand(0, TAU),
      spin: rand(-8, 8),
      gravity: 0,
    });
  }
}

function addHarvestDebris(resource, count = 5) {
  const visual = itemVisuals[resource.type];
  const tool = resourceDefs[resource.type].tool;
  const originX = resource.x + rand(-resource.radius * 0.45, resource.radius * 0.45);
  const originY = resource.y + rand(-resource.radius * 0.55, resource.radius * 0.15);
  for (let i = 0; i < count; i += 1) {
    const angle = rand(-Math.PI * 0.95, -Math.PI * 0.05);
    const speed = rand(35, tool === "axe" ? 125 : 95);
    state.particles.push({
      x: originX,
      y: originY,
      vx: Math.cos(angle) * speed + rand(-35, 35),
      vy: Math.sin(angle) * speed + rand(-18, 28),
      color: i % 3 === 0 ? visual.particle : visual.color,
      age: 0,
      life: rand(0.34, 0.72),
      size: rand(tool === "axe" ? 3 : 2, tool === "axe" ? 7 : 5),
      shape: tool === "axe" ? "chip" : "dust",
      rotation: rand(0, TAU),
      spin: rand(-12, 12),
      gravity: tool === "axe" ? 170 : 55,
    });
  }
}

function emitHarvestEffect(actor, resource, dt) {
  actor.harvestFxTimer = (actor.harvestFxTimer || 0) - dt;
  if (actor.harvestFxTimer > 0) return;
  actor.harvestFxTimer = resourceDefs[resource.type].tool === "axe" ? 0.14 : 0.11;
  addHarvestDebris(resource, resourceDefs[resource.type].tool === "axe" ? 5 : 7);
}

function resourceCounterTarget(type) {
  const counter = document.querySelector(`[data-resource-counter="${type}"]`);
  if (!counter) return { x: 28, y: 92 };
  const rect = counter.getBoundingClientRect();
  return {
    x: rect.left + rect.width / 2,
    y: rect.top + rect.height / 2,
  };
}

function splitDropAmount(amount, maxPieces) {
  const pieces = Math.max(1, Math.min(maxPieces, amount));
  const base = Math.floor(amount / pieces);
  const extra = amount % pieces;
  return Array.from({ length: pieces }, (_, index) => base + (index < extra ? 1 : 0));
}

function luckyDropBonus(type, amount) {
  const level = skillLevel("lucky");
  if (level <= 0) return 0;
  const chance = Math.min(0.65, level * 0.06);
  const rolls = Math.max(1, Math.ceil(amount / (type === "meat" ? 1 : 4)));
  let bonus = 0;
  for (let i = 0; i < rolls; i += 1) {
    if (Math.random() < chance) bonus += 1;
  }
  return bonus;
}

function spawnDrops(type, amount, x, y) {
  const bonus = luckyDropBonus(type, amount);
  const totalAmount = Math.max(1, Math.round(amount + bonus));
  if (bonus > 0) addFloatText(`ラッキー +${bonus}`, x, y - 56, "#cfa7ff");
  const parts = splitDropAmount(totalAmount, type === "meat" ? 3 : 6);
  parts.forEach((part, index) => {
    const angle = rand(0, TAU);
    const distance = rand(8, 34);
    state.drops.push({
      dropType: type,
      amount: part,
      x: x + Math.cos(angle) * distance * 0.35,
      y: y + Math.sin(angle) * distance * 0.22,
      vx: Math.cos(angle) * rand(28, 82),
      vy: Math.sin(angle) * rand(18, 56),
      radius: 13,
      age: 0,
      pickupDelay: 0.24 + index * 0.035,
      bob: rand(0, TAU),
    });
  });
}

function collectDrop(drop) {
  const start = worldToScreen(drop);
  const target = resourceCounterTarget(drop.dropType);
  const collectAllLevel = skillLevel("collectAll");
  state.flyItems.push({
    type: drop.dropType,
    amount: drop.amount,
    sx: start.x,
    sy: start.y,
    tx: target.x,
    ty: target.y,
    age: 0,
    life: Math.max(0.32, 0.62 - collectAllLevel * 0.018),
  });
  const visual = itemVisuals[drop.dropType];
  addFloatText(`+${drop.amount} ${visual.label}`, drop.x, drop.y - 18, visual.color);
}

function collectAllDrops(level = skillLevel("collectAll")) {
  if (state.drops.length === 0) return;
  const drops = [...state.drops];
  for (const drop of drops) {
    collectDrop(drop);
    drop.collected = true;
  }
  state.drops = state.drops.filter((drop) => !drop.collected);
  addFloatText(`全回収 LV${level}`, player.x, player.y - 58, "#7dd3ff");
}

function canSpawnResourceAt(type, x, y) {
  const terrain = terrainAtPosition(x, y);
  if (type === "starstone") {
    return terrain.kind === "pond"
      && state.resources.every((resource) => Math.hypot(resource.x - x, resource.y - y) > 110);
  }
  if (terrain.kind === "pond" || terrain.kind === "swamp") return false;
  if (state.resources.some((resource) => Math.hypot(resource.x - x, resource.y - y) < resource.radius + 52)) return false;
  if (type === "wood") {
    if (!terrain.allowsTrees || terrain.kind === "path") return false;
    return Math.random() < (terrain.treeDensity || 0.35);
  }
  return true;
}

function resourceSpawnPoint(type, nearPlayer) {
  const angle = rand(0, TAU);
  const distance = type === "starstone"
    ? rand(nearPlayer ? 220 : 620, nearPlayer ? 1100 : 2200)
    : nearPlayer ? rand(120, 820) : rand(720, 1550);
  return {
    x: player.x + Math.cos(angle) * distance + rand(-80, 80),
    y: player.y + Math.sin(angle) * distance + rand(-80, 80),
  };
}

function spawnResource(type, nearPlayer = false) {
  const def = resourceDefs[type];
  let point = null;
  for (let i = 0; i < (type === "starstone" ? 240 : 120); i += 1) {
    const candidate = resourceSpawnPoint(type, nearPlayer);
    if (canSpawnResourceAt(type, candidate.x, candidate.y)) {
      point = candidate;
      break;
    }
  }
  if (!point) return false;
  const hp = Math.round(def.hp * RESOURCE_HP_MULTIPLIER);

  state.resources.push({
    type,
    x: point.x,
    y: point.y,
    hp,
    maxHp: hp,
    radius: def.radius,
    amount: Math.round(rand(def.amount[0], def.amount[1])),
  });
  return true;
}

function nearbyResourceCount(type, radius = 1500) {
  return state.resources.filter((resource) => resource.type === type && Math.hypot(resource.x - player.x, resource.y - player.y) < radius).length;
}

function pruneDistantResources() {
  state.resources = state.resources.filter((resource) => {
    const keepRadius = resource.type === "starstone" ? 5600 : 4300;
    return Math.hypot(resource.x - player.x, resource.y - player.y) < keepRadius;
  });
}

function maintainAmbientResources(dt) {
  state.resourceSpawnTimer -= dt;
  if (state.resourceSpawnTimer > 0) return;
  state.resourceSpawnTimer = 0.9;
  pruneDistantResources();
  const targets = {
    wood: 32,
    stone: 22,
    gold: 12,
    iron: 14,
  };
  for (const [type, count] of Object.entries(targets)) {
    const shortage = count - nearbyResourceCount(type);
    for (let i = 0; i < Math.min(4, shortage); i += 1) {
      spawnResource(type, false);
    }
  }
  if (nearbyResourceCount("starstone", 2400) < 1 && Math.random() < 0.22) {
    spawnResource("starstone", false);
  }
}

function seedAmbientResourcesAroundPlayer() {
  for (let i = 0; i < 34; i += 1) spawnResource("wood", true);
  for (let i = 0; i < 25; i += 1) spawnResource("stone", true);
  for (let i = 0; i < 16; i += 1) spawnResource("gold", true);
  for (let i = 0; i < 18; i += 1) spawnResource("iron", true);
  spawnResource("starstone", false);
}

function cleanNumber(value, fallback = 0) {
  const number = Number(value);
  return Number.isFinite(number) ? number : fallback;
}

function cleanInt(value, fallback = 0) {
  return Math.floor(cleanNumber(value, fallback));
}

function clonePlain(value) {
  return JSON.parse(JSON.stringify(value));
}

function resourceSnapshot() {
  return Object.fromEntries(resourceKeys.map((key) => [key, Math.max(0, cleanInt(player[key], 0))]));
}

function saveAlly(ally) {
  return {
    id: ally.id,
    label: ally.label,
    role: ally.role,
    kind: ally.kind || "defender",
    x: Math.round(ally.x),
    y: Math.round(ally.y),
    radius: ally.radius,
    hp: Math.round(ally.hp),
    maxHp: Math.round(ally.maxHp),
    baseMaxHp: Math.round(ally.baseMaxHp || ally.maxHp || ally.hp || 1),
    baseSpeed: ally.baseSpeed || ally.speed || 150,
    level: ally.level || 1,
    xp: Math.floor(ally.xp || 0),
    xpNext: Math.floor(ally.xpNext || 54),
    homeOffset: ally.homeOffset ? { x: Math.round(ally.homeOffset.x), y: Math.round(ally.homeOffset.y) } : null,
    attackType: ally.attackType || null,
    baseDamage: ally.baseDamage || null,
    range: ally.range || null,
    rate: ally.rate || null,
    knockback: ally.knockback || null,
    projectileSpeed: ally.projectileSpeed || null,
    splash: ally.splash || null,
    weaponId: ally.weaponId || null,
    targets: Array.isArray(ally.targets) ? [...ally.targets] : [],
    searchRadius: ally.searchRadius || null,
    leash: ally.leash || null,
    healRange: ally.healRange || null,
    assignedBaseUid: ally.assignedBaseUid || null,
  };
}

function createSaveData() {
  return {
    kind: "frontier-ring-save",
    version: SAVE_VERSION,
    savedAt: new Date().toISOString(),
    terrainSeed: state.terrainSeed || 0,
    wave: {
      index: state.wave.index,
    },
    player: {
      x: Math.round(player.x),
      y: Math.round(player.y),
      hp: Math.round(player.hp),
      maxHp: Math.round(player.maxHp),
      level: player.level,
      xp: Math.floor(player.xp),
      xpNext: player.xpNext,
      resources: resourceSnapshot(),
      skills: clonePlain(player.skills),
      unlocks: clonePlain(player.unlocks),
      axeLevel: player.axeLevel,
      pickaxeLevel: player.pickaxeLevel,
      equippedWeaponId: equippedWeapon().id,
      weaponEnchants: weapons.map((weapon) => ({
        id: weapon.id,
        enchants: clonePlain(weapon.enchants),
      })),
    },
    buildings: state.buildings.map((building) => ({
      uid: building.uid || null,
      id: building.id,
      label: building.label,
      x: Math.round(building.x),
      y: Math.round(building.y),
      radius: building.radius,
      hp: Math.round(building.hp),
      maxHp: Math.round(building.maxHp),
      healRadius: building.healRadius || null,
      healRate: building.healRate || null,
    })),
    traps: state.traps.map((trap) => ({
      id: trap.id,
      label: trap.label,
      x: Math.round(trap.x),
      y: Math.round(trap.y),
      radius: trap.radius,
      life: trap.life,
      maxLife: trap.maxLife,
      durability: trap.durability,
      maxDurability: trap.maxDurability,
      cooldown: trap.cooldown || 0,
      triggered: Boolean(trap.triggered),
    })),
    allies: {
      defenders: state.defenders.map(saveAlly),
      workers: state.workers.map(saveAlly),
    },
  };
}

function downloadSaveFile() {
  const save = createSaveData();
  const stamp = save.savedAt.replace(/[:.]/g, "-");
  const blob = new Blob([JSON.stringify(save, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `frontier-ring-wave${save.wave.index}-${stamp}.json`;
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 5000);
  showToast("セーブJSONを書き出しました");
}

function restoreUnlocks(savedUnlocks = {}) {
  const unlocks = savedUnlocks || {};
  player.unlocks = {
    weapons: { knife: true },
    enchants: {},
    builds: {},
    hires: {},
  };
  for (const kind of ["weapons", "enchants", "builds", "hires"]) {
    const bucket = unlocks[kind] || {};
    for (const [key, value] of Object.entries(bucket)) {
      if (value) setUnlocked(kind, key);
    }
  }
  player.unlocks.weapons.knife = true;
}

function restoreSkills(savedSkills = {}) {
  const skills = savedSkills || {};
  for (const key of Object.keys(player.skills)) {
    player.skills[key] = clamp(cleanInt(skills[key], 0), 0, MAX_SKILL_LEVEL);
  }
  player.skillCooldowns = {};
}

function restoreWeaponEnchants(savedWeapons = []) {
  const savedList = Array.isArray(savedWeapons) ? savedWeapons : [];
  for (const weapon of weapons) {
    const saved = savedList.find((item) => item.id === weapon.id);
    for (const key of Object.keys(weapon.enchants)) {
      weapon.enchants[key] = Math.max(0, cleanInt(saved?.enchants?.[key], 0));
    }
  }
}

function restorePlayer(savedPlayer = {}) {
  const saved = savedPlayer || {};
  player.x = cleanNumber(saved.x, 0);
  player.y = cleanNumber(saved.y, 0);
  player.level = Math.max(1, cleanInt(saved.level, 1));
  player.xpNext = playerXpRequired(player.level);
  player.xp = Math.max(0, cleanNumber(saved.xp, 0));
  player.maxHp = Math.max(1, cleanInt(saved.maxHp, 120));
  player.hp = clamp(cleanNumber(saved.hp, player.maxHp), 1, player.maxHp);
  player.axeLevel = Math.max(1, cleanInt(saved.axeLevel, 1));
  player.pickaxeLevel = Math.max(1, cleanInt(saved.pickaxeLevel, 1));
  for (const key of resourceKeys) {
    player[key] = Math.max(0, cleanInt(saved.resources?.[key], player[key] || 0));
  }
  player.hiddenTime = 0;
  player.attackTimer = 0;
  player.attackFx = null;
  player.harvestTarget = null;
  player.harvestPulse = 0;
  player.harvesting = false;
  state.camera.x = player.x;
  state.camera.y = player.y;
}

function restoreBuildings(savedBuildings = []) {
  let maxUid = 0;
  state.buildings = savedBuildings.map((saved) => {
    const def = buildDefById(saved.id);
    if (!def || def.type !== "building") return null;
    const maxHp = Math.max(1, cleanInt(saved.maxHp, def.hp));
    const uid = cleanInt(saved.uid, state.nextBuildingUid++);
    maxUid = Math.max(maxUid, uid);
    return {
      uid,
      id: def.id,
      label: def.label,
      x: cleanNumber(saved.x, player.x),
      y: cleanNumber(saved.y, player.y),
      radius: cleanNumber(saved.radius, def.id === "wall" ? 31 : def.id === "base" ? 34 : 27),
      hp: clamp(cleanNumber(saved.hp, maxHp), 1, maxHp),
      maxHp,
      healRadius: def.id === "base" ? Math.max(cleanNumber(saved.healRadius, def.healRadius || 440), def.healRadius || 440) : null,
      healRate: def.id === "base" ? cleanNumber(saved.healRate, def.healRate || 0.012) : null,
      attackTimer: 0,
      repairReservedBy: null,
    };
  }).filter(Boolean);
  state.nextBuildingUid = Math.max(state.nextBuildingUid, maxUid + 1);
}

function restoreTraps(savedTraps = []) {
  state.traps = savedTraps.map((saved) => {
    const def = buildDefById(saved.id);
    if (!def || def.type !== "trap") return null;
    const maxLife = cleanNumber(saved.maxLife, def.life);
    const maxDurability = Math.max(1, cleanInt(saved.maxDurability, def.durability));
    return {
      id: def.id,
      label: def.label,
      x: cleanNumber(saved.x, player.x),
      y: cleanNumber(saved.y, player.y),
      radius: cleanNumber(saved.radius, def.radius),
      life: clamp(cleanNumber(saved.life, maxLife), 0, maxLife),
      maxLife,
      durability: clamp(cleanInt(saved.durability, maxDurability), 1, maxDurability),
      maxDurability,
      cooldown: Math.max(0, cleanNumber(saved.cooldown, 0)),
      triggered: Boolean(saved.triggered),
    };
  }).filter(Boolean);
}

function savedHomeOffset(saved, index) {
  const fallback = formationOffset(index);
  return {
    x: cleanNumber(saved?.homeOffset?.x, fallback.x),
    y: cleanNumber(saved?.homeOffset?.y, fallback.y),
  };
}

function restoreDefender(saved, index) {
  const def = hireDefs.find((item) => item.id === saved.id) || {};
  const attackType = saved.attackType || def.attackType;
  if (!attackType) return null;
  const homeOffset = savedHomeOffset(saved, index);
  const ally = {
    id: saved.id || def.id,
    label: saved.label || def.label || "味方",
    role: saved.role || def.role || "swordsman",
    kind: "defender",
    x: cleanNumber(saved.x, player.x + homeOffset.x),
    y: cleanNumber(saved.y, player.y + homeOffset.y),
    radius: cleanNumber(saved.radius, 17),
    hp: cleanNumber(saved.hp, def.hp || 80),
    maxHp: cleanNumber(saved.maxHp, def.hp || 80),
    baseMaxHp: cleanNumber(saved.baseMaxHp, def.hp || saved.maxHp || 80),
    baseSpeed: cleanNumber(saved.baseSpeed, def.speed || 156),
    level: Math.max(1, cleanInt(saved.level, 1)),
    xp: Math.max(0, cleanNumber(saved.xp, 0)),
    xpNext: Math.max(1, cleanInt(saved.xpNext, 54)),
    moveDir: "down",
    moving: false,
    homeOffset,
    attackType,
    baseDamage: cleanNumber(saved.baseDamage, def.damage || saved.damage || 8),
    damage: cleanNumber(saved.baseDamage, def.damage || saved.damage || 8),
    range: cleanNumber(saved.range, def.range || 70),
    rate: cleanNumber(saved.rate, def.rate || 1),
    knockback: cleanNumber(saved.knockback, def.knockback || 35),
    projectileSpeed: cleanNumber(saved.projectileSpeed, def.projectileSpeed || 0),
    splash: cleanNumber(saved.splash, def.splash || 0),
    attackTimer: 0,
    attackFx: null,
    weaponId: saved.weaponId || def.weaponId || (attackType === "melee" ? "ironSword" : null),
    assignedBaseUid: saved.assignedBaseUid || null,
  };
  syncAllyStats(ally);
  return ally;
}

function restoreWorker(saved, index) {
  const def = hireDefs.find((item) => item.id === saved.id) || {};
  const kind = saved.kind || def.kind;
  if (!kind || kind === "defender") return null;
  const homeOffset = savedHomeOffset(saved, index);
  const ally = {
    id: saved.id || def.id,
    label: saved.label || def.label || "味方",
    role: saved.role || def.role || kind,
    kind,
    x: cleanNumber(saved.x, player.x + homeOffset.x),
    y: cleanNumber(saved.y, player.y + homeOffset.y),
    radius: cleanNumber(saved.radius, kind === "dog" ? 15 : kind === "worker" ? 16 : 17),
    hp: cleanNumber(saved.hp, def.hp || 70),
    maxHp: cleanNumber(saved.maxHp, def.hp || 70),
    baseMaxHp: cleanNumber(saved.baseMaxHp, def.hp || saved.maxHp || 70),
    baseSpeed: cleanNumber(saved.baseSpeed, def.speed || 150),
    level: Math.max(1, cleanInt(saved.level, 1)),
    xp: Math.max(0, cleanNumber(saved.xp, 0)),
    xpNext: Math.max(1, cleanInt(saved.xpNext, 54)),
    moveDir: "down",
    moving: false,
    homeOffset,
    targets: Array.isArray(saved.targets) && saved.targets.length > 0 ? [...saved.targets] : [...(def.targets || [])],
    searchRadius: cleanNumber(saved.searchRadius, def.searchRadius || 420),
    leash: cleanNumber(saved.leash, def.leash || 430),
    harvestTarget: null,
    harvestPulse: 0,
    repairTarget: null,
    repairJob: null,
    repairPulse: 0,
    healTarget: null,
    healPulse: 0,
    fetchTarget: null,
    carryDrop: null,
    healRange: cleanNumber(saved.healRange, def.healRange || 0),
    assignedBaseUid: saved.assignedBaseUid || null,
  };
  syncAllyStats(ally);
  return ally;
}

function restoreAllies(savedAllies = {}) {
  const savedDefenders = Array.isArray(savedAllies.defenders) ? savedAllies.defenders : [];
  const savedWorkers = Array.isArray(savedAllies.workers) ? savedAllies.workers : [];
  state.defenders = savedDefenders.map((saved, index) => restoreDefender(saved, index)).filter(Boolean);
  state.workers = savedWorkers.map((saved, index) => restoreWorker(saved, index + state.defenders.length)).filter(Boolean);
  syncAllies();
}

function clearRuntimeWorldState() {
  closeWorldMenu();
  closeSkillChoice();
  clearPointerControl();
  state.keys.clear();
  state.skillChoice.pending = 0;
  state.enemies = [];
  state.projectiles = [];
  state.resources = [];
  state.drops = [];
  state.flyItems = [];
  state.particles = [];
  state.floatText = [];
  state.resourceSpawnTimer = 0;
  state.spawnTimer = 0;
  state.nextBuildingUid = 1;
}

function loadGameSave(save) {
  if (!save || save.kind !== "frontier-ring-save") {
    throw new Error("Frontier Ring のセーブJSONではありません");
  }
  clearRuntimeWorldState();
  state.terrainSeed = cleanInt(save.terrainSeed, 0);
  restoreUnlocks(save.player?.unlocks);
  restoreSkills(save.player?.skills);
  restoreWeaponEnchants(save.player?.weaponEnchants);
  restorePlayer(save.player);
  restoreBuildings(Array.isArray(save.buildings) ? save.buildings : []);
  restoreTraps(Array.isArray(save.traps) ? save.traps : []);
  restoreAllies(save.allies || {});
  seedAmbientResourcesAroundPlayer();

  const savedWeaponId = save.player?.equippedWeaponId;
  const savedWeaponIndex = weapons.findIndex((weapon) => weapon.id === savedWeaponId && isUnlocked("weapons", weapon.id));
  equippedIndex = savedWeaponIndex >= 0 ? savedWeaponIndex : weapons.findIndex((weapon) => isUnlocked("weapons", weapon.id));
  if (equippedIndex < 0) equippedIndex = 0;

  const waveIndex = Math.max(1, cleanInt(save.wave?.index, 1));
  startWave(waveIndex);
  renderStaticUi();
  updateUi();
  showToast(`セーブを読み込みました：第${state.wave.index}ウェーブ`);
}

async function loadSaveFile(file) {
  if (!file) return;
  try {
    const text = await file.text();
    loadGameSave(JSON.parse(text));
  } catch (error) {
    showToast(`ロードに失敗しました：${error.message}`);
  }
}

function saveDragHasFiles(event) {
  return Array.from(event.dataTransfer?.types || []).includes("Files");
}

let saveDragDepth = 0;

function showSaveDropOverlay(show) {
  if (ui.saveDropOverlay) ui.saveDropOverlay.hidden = !show;
}

function handleSaveDragEnter(event) {
  if (!saveDragHasFiles(event)) return;
  event.preventDefault();
  saveDragDepth += 1;
  showSaveDropOverlay(true);
}

function handleSaveDragOver(event) {
  if (!saveDragHasFiles(event)) return;
  event.preventDefault();
  event.dataTransfer.dropEffect = "copy";
  showSaveDropOverlay(true);
}

function handleSaveDragLeave(event) {
  event.preventDefault();
  saveDragDepth = Math.max(0, saveDragDepth - 1);
  if (saveDragDepth === 0) showSaveDropOverlay(false);
}

function handleSaveDrop(event) {
  event.preventDefault();
  saveDragDepth = 0;
  showSaveDropOverlay(false);
  loadSaveFile(event.dataTransfer.files?.[0]);
}

function buildDefById(id) {
  return buildDefs.find((def) => def.id === id);
}

function enemyDefById(id) {
  return enemyDefs[id] || enemyDefs.redSlime;
}

function waveTier(wave = state.wave.index) {
  return Math.max(1, Math.floor(wave / 5));
}

function raidEnemyPoolForWave(wave) {
  const tier = waveTier(wave);
  const entries = [
    { id: "redSlime", weight: Math.max(2, 9 - tier * 0.6) },
    { id: "blueSlime", weight: 3 + tier * 0.35 },
    { id: "greenSlime", weight: 3 + tier * 0.35 },
    { id: "goblin", weight: wave >= 5 ? 3 + tier * 0.55 : 0 },
  ].filter((entry) => entry.weight > 0);
  if (wave >= 10) entries.push({ id: "boar", weight: 2 + tier * 0.35 });
  if (wave >= 10) entries.push({ id: "goblinArcher", weight: 2 + tier * 0.3 });
  if (wave >= 15) entries.push({ id: "wolf", weight: 2 + tier * 0.45 });
  return entries;
}

function raidPatternForWave(wave) {
  const tier = waveTier(wave);
  const raidIndex = Math.floor(wave / 5);
  if (wave >= 15 && raidIndex % 3 === 0) {
    return {
      label: "イノシシ大突進",
      detail: "イノシシの群れと大型個体が突進してきます。防壁で受け止めると立て直しやすくなります。",
      enemies: [
        { id: "boar", weight: 10 + tier * 0.9 },
        { id: "goblin", weight: 2 + tier * 0.25 },
        { id: "wolf", weight: wave >= 20 ? 2 + tier * 0.35 : 0 },
      ].filter((entry) => entry.weight > 0),
      fixedSpawns: [
        { id: "boarBoss", count: 1 + Math.floor(tier / 8), scale: 1 + tier * 0.14 },
      ],
    };
  }
  if (wave >= 15 && raidIndex % 3 === 2) {
    return {
      label: "混成大襲撃",
      detail: "近いウェーブで出現する魔物が混ざった大群です。足の速い敵と遠距離敵が同時に来ます。",
      enemies: raidEnemyPoolForWave(wave),
      fixedSpawns: [],
    };
  }
  return {
    label: "大襲撃",
    detail: "周辺の魔物が大群で押し寄せます。",
    enemies: raidEnemyPoolForWave(wave),
    fixedSpawns: [],
  };
}

function raidWaveDef(wave) {
  const tier = waveTier(wave);
  const pattern = raidPatternForWave(wave);
  const baseTotal = 24 + tier * 11 + Math.floor(wave * 1.3);
  const fixedTotal = (pattern.fixedSpawns || []).reduce((sum, spawn) => sum + (spawn.count || 1), 0);
  const total = baseTotal + fixedTotal;
  return {
    total,
    maxActive: Math.min(28, 9 + tier * 4),
    spawnInterval: Math.max(0.18, pattern.label === "イノシシ大突進" ? 0.42 - tier * 0.03 : 0.48 - tier * 0.035),
    timeout: 145 + tier * 18,
    scale: 1 + (wave - 4) * 0.085 + tier * 0.04,
    event: {
      type: "raid",
      label: pattern.label,
      title: `第${wave}ウェーブ ${pattern.label}`,
      detail: `${pattern.detail} 敵数 ${total}体`,
    },
    fixedSpawns: pattern.fixedSpawns,
    enemies: pattern.enemies,
  };
}

function bossPatternForWave(wave) {
  const bossTier = Math.max(1, Math.floor(wave / 10));
  const patterns = [
    {
      bossId: "ogreBoss",
      label: "巨大オーガ襲撃",
      detail: "巨大オーガがゴブリンとイノシシを引き連れてきます",
      minions: [
        { id: "goblin", weight: 5 },
        { id: "boar", weight: 3 },
        { id: "goblinArcher", weight: 2 },
      ],
    },
    {
      bossId: "stormBirdBoss",
      label: "嵐鳥襲撃",
      detail: "素早い鳥型ボスが遠距離部隊と混成群を率いてきます",
      minions: [
        { id: "greenSlime", weight: 4 },
        { id: "goblinArcher", weight: 4 },
        { id: "wolf", weight: 3 },
      ],
    },
    {
      bossId: "wolfAlpha",
      label: "狼群襲撃",
      detail: "群れ狼の王と高速の狼たちが包囲してきます",
      minions: [
        { id: "wolf", weight: 8 },
        { id: "greenSlime", weight: 2 },
        { id: "goblin", weight: 2 },
      ],
    },
  ];
  return patterns[(bossTier - 1) % patterns.length];
}

function bossWaveDef(wave) {
  const tier = waveTier(wave);
  const bossTier = Math.max(1, Math.floor(wave / 10));
  const pattern = bossPatternForWave(wave);
  const minionTotal = 14 + tier * 8 + bossTier * 3;
  return {
    total: minionTotal + 1,
    maxActive: Math.min(24, 8 + tier * 3),
    spawnInterval: Math.max(0.28, 0.82 - tier * 0.05),
    timeout: 180 + tier * 24,
    scale: 1 + (wave - 4) * 0.075,
    event: {
      type: "boss",
      label: pattern.label,
      title: `第${wave}ウェーブ ${pattern.label}`,
      detail: pattern.detail,
    },
    fixedSpawns: [
      { id: pattern.bossId, count: 1, scale: 1 + bossTier * 0.2 + tier * 0.08 },
    ],
    enemies: pattern.minions,
  };
}

function eventWaveDef(wave) {
  if (wave % 5 !== 0) return null;
  return wave % 10 === 0 ? bossWaveDef(wave) : raidWaveDef(wave);
}

function currentWaveDef() {
  const wave = state.wave.index;
  const eventDef = eventWaveDef(wave);
  if (eventDef) return eventDef;
  if (wave === 1) {
    return {
      total: 10,
      maxActive: 1,
      spawnInterval: 2.2,
      timeout: 120,
      enemies: [{ id: "redSlime", weight: 1 }],
    };
  }
  if (wave === 2) {
    return {
      total: 20,
      maxActive: 2,
      spawnInterval: 1.9,
      timeout: 140,
      enemies: [{ id: "redSlime", weight: 1 }],
    };
  }
  if (wave === 3) {
    return {
      total: 28,
      maxActive: 3,
      spawnInterval: 1.8,
      timeout: 160,
      enemies: [
        { id: "redSlime", weight: 7 },
        { id: "blueSlime", weight: 3 },
        { id: "greenSlime", weight: 3 },
        { id: "goblin", weight: 3 },
      ],
    };
  }
  const extra = wave - 4;
  return {
    total: 34 + extra * 8,
    maxActive: Math.min(8, 4 + Math.floor(extra / 2)),
    spawnInterval: Math.max(0.9, 1.65 - extra * 0.06),
    timeout: 175 + extra * 12,
    scale: 1 + extra * 0.11,
    enemies: [
      { id: "redSlime", weight: Math.max(2, 6 - extra * 0.3) },
      { id: "blueSlime", weight: 3 + extra * 0.2 },
      { id: "greenSlime", weight: 3 + extra * 0.22 },
      { id: "goblin", weight: 3 + extra * 0.25 },
      { id: "boar", weight: 2 + extra * 0.18 },
      { id: "goblinArcher", weight: 2 + extra * 0.16 },
    ],
  };
}

function weightedEnemyId(entries) {
  const total = entries.reduce((sum, entry) => sum + entry.weight, 0);
  let roll = Math.random() * total;
  for (const entry of entries) {
    roll -= entry.weight;
    if (roll <= 0) return entry.id;
  }
  return entries[entries.length - 1].id;
}

function fixedSpawnQueue(entries = []) {
  const queue = [];
  for (const entry of entries) {
    for (let i = 0; i < (entry.count || 1); i += 1) {
      queue.push({ id: entry.id, scale: entry.scale, boss: true });
    }
  }
  return queue;
}

function startWave(index = state.wave.index) {
  state.wave.index = index;
  state.wave.elapsed = 0;
  state.wave.spawned = 0;
  state.wave.spawnTimer = 0.8;
  state.wave.timeoutWarned = false;
  const def = currentWaveDef();
  state.wave.fixedQueue = fixedSpawnQueue(def.fixedSpawns);
  state.wave.event = def.event || null;
  if (def.event) {
    showEventAlert(def.event.title, def.event.detail);
    showToast(`${def.event.label}：合計${def.total}体 / 同時${def.maxActive}体`);
  } else {
    showToast(`第${state.wave.index}ウェーブ開始：合計${def.total}体 / 同時${def.maxActive}体`);
  }
}

function advanceWave(reason = "clear") {
  if (reason === "timeout") {
    state.enemies.forEach((enemy) => addParticles(enemy.x, enemy.y, enemyDefById(enemy.type).color, 8, 90));
    state.enemies.length = 0;
    showToast(`第${state.wave.index}ウェーブ時間切れ。次のウェーブへ`);
  } else {
    showToast(`第${state.wave.index}ウェーブ突破`);
  }
  startWave(state.wave.index + 1);
}

function enemySpawnPoint() {
  const angle = rand(0, TAU);
  const distance = rand(560, 820);
  return {
    x: player.x + Math.cos(angle) * distance,
    y: player.y + Math.sin(angle) * distance,
  };
}

function spawnEnemy(type = "redSlime", options = {}) {
  const def = enemyDefById(type);
  const point = options.point || enemySpawnPoint();
  const waveScale = options.scale || currentWaveDef().scale || 1;
  const hp = Math.round(def.hp * waveScale * ENEMY_HP_MULTIPLIER);
  state.enemies.push({
    type: def.id,
    label: def.label,
    x: point.x,
    y: point.y,
    radius: def.radius,
    hp,
    maxHp: hp,
    speed: rand(def.speed[0], def.speed[1]) * Math.sqrt(waveScale),
    damage: Math.round(def.damage * (0.9 + waveScale * 0.1)),
    xp: Math.round(def.xp * waveScale),
    boss: Boolean(def.boss || options.boss),
    attackCooldown: def.attackCooldown,
    behavior: def.behavior,
    range: def.range || 0,
    projectileSpeed: def.projectileSpeed || 0,
    chargeSpeed: def.chargeSpeed || 0,
    attackTimer: 0,
    stateTimer: def.behavior === "boar" ? 5 : 0,
    chargeState: def.behavior === "boar" ? "windup" : null,
    chargeDir: { x: 0, y: 0 },
    hitTargets: [],
    moveDir: "down",
    moving: true,
    bleed: 0,
    bleedTick: 0,
    poison: 0,
    rooted: 0,
    slow: 0,
    hurtFlash: 0,
    confused: 0,
  });
}

function updateWave(dt) {
  const wave = state.wave;
  const def = currentWaveDef();
  wave.elapsed += dt;
  wave.spawnTimer -= dt;

  if (wave.elapsed >= def.timeout) {
    advanceWave("timeout");
    return;
  }

  if (!wave.timeoutWarned && def.timeout - wave.elapsed <= 10) {
    wave.timeoutWarned = true;
    showToast(`第${wave.index}ウェーブ残り10秒`);
  }

  while (wave.fixedQueue?.length && state.enemies.length < def.maxActive && wave.spawned < def.total) {
    const spawn = wave.fixedQueue.shift();
    spawnEnemy(spawn.id, { scale: spawn.scale, boss: spawn.boss });
    wave.spawned += 1;
  }

  while (
    wave.spawnTimer <= 0
    && wave.spawned < def.total
    && state.enemies.length < def.maxActive
  ) {
    spawnEnemy(weightedEnemyId(def.enemies));
    wave.spawned += 1;
    wave.spawnTimer += def.spawnInterval;
  }

  if (wave.spawned >= def.total && state.enemies.length === 0) {
    advanceWave("clear");
  }
}

function initWorld() {
  seedAmbientResourcesAroundPlayer();
  startWave(1);
}

function equippedWeapon() {
  if (!weapons[equippedIndex] || !isUnlocked("weapons", weapons[equippedIndex].id)) {
    const firstUnlocked = weapons.findIndex((weapon) => isUnlocked("weapons", weapon.id));
    equippedIndex = firstUnlocked >= 0 ? firstUnlocked : 0;
  }
  return weapons[equippedIndex];
}

function weaponDamage(weapon) {
  return Math.round((weapon.damage + enchantLevel(weapon, "damage") * 5) * (1 + (player.level - 1) * 0.045));
}

function weaponRate(weapon) {
  return weapon.rate * (1 + enchantLevel(weapon, "speed") * 0.11);
}

function weaponRange(weapon) {
  const meleeBonus = weapon.type === "近接" ? skillLevel("meleeRange") * 8 : 0;
  const rangedBonus = weapon.type === "遠距離" || weapon.type === "魔法" ? skillLevel("rangedRange") * 14 : 0;
  const enchantBonus = enchantLevel(weapon, "range") * (weapon.type === "遠距離" || weapon.type === "魔法" ? 18 : 8);
  return weapon.range + meleeBonus + rangedBonus + enchantBonus;
}

function weaponProjectileSpeed(weapon) {
  return (weapon.projectileSpeed || 420) * (1 + enchantLevel(weapon, "projectileSpeed") * 0.12);
}

function weaponKnockback(weapon) {
  return weapon.knockback + enchantLevel(weapon, "knockback") * 30;
}

function weaponBleed(weapon) {
  return clamp(weapon.bleedChance + enchantLevel(weapon, "bleed") * 0.035, 0, 0.65);
}

function weaponLifesteal(weapon) {
  return clamp(weapon.lifesteal + enchantLevel(weapon, "lifesteal") * 0.025, 0, 0.45);
}

function weaponHoming(weapon) {
  return enchantLevel(weapon, "homing");
}

function harvestRate(resource) {
  const def = resourceDefs[resource.type];
  const toolLevel = def.tool === "axe" ? player.axeLevel : player.pickaxeLevel;
  const mastery = def.tool === "axe" ? skillLevel("axeMastery") : skillLevel("pickaxeMastery");
  const base = def.tool === "axe" ? 12 : 10;
  return base * (1 + toolLevel * 0.42 + mastery * 0.16) * (1 + (player.level - 1) * 0.13);
}

function gainXp(amount) {
  player.xp += amount * xpMultiplier();
  while (player.xp >= player.xpNext) {
    player.xp -= player.xpNext;
    player.level += 1;
    player.xpNext = playerXpRequired(player.level);
    player.maxHp += 12;
    player.hp = player.maxHp;
    if (skillLevel("collectAll") > 0) collectAllDrops(skillLevel("collectAll"));
    showToast(`レベル ${player.level}。報酬を選択してください`);
    addParticles(player.x, player.y, "#65c47b", 28, 170);
    queueSkillChoice();
  }
}

function findNearestEnemy(maxDistance = Infinity, origin = player) {
  let best = null;
  let bestDistance = maxDistance;
  for (const enemy of state.enemies) {
    const d = Math.hypot(enemy.x - origin.x, enemy.y - origin.y);
    if (d < bestDistance) {
      best = enemy;
      bestDistance = d;
    }
  }
  return best;
}

function awardEnemyDefeat(enemy, source = null) {
  if (enemy.defeatAwarded) return;
  enemy.defeatAwarded = true;
  const def = enemyDefById(enemy.type);
  const credit = source?.owner || source;
  const xp = enemy.xp || def.xp || 16;
  addParticles(enemy.x, enemy.y, def.color, 14, 135);
  gainXp(xp);
  if (isAlly(credit)) allyGainXp(credit, xp);
  if (Math.random() < Math.min(0.95, (def.meatChance || 0.45) + skillLevel("lucky") * 0.025)) {
    const amount = Math.round(rand(def.meatAmount?.[0] || 1, def.meatAmount?.[1] || 1));
    spawnDrops("meat", amount, enemy.x, enemy.y);
    addFloatText("肉", enemy.x, enemy.y - 45, "#d96464");
  }
}

function damageEnemy(enemy, damage, source, options = {}) {
  enemy.hp -= damage;
  enemy.hurtFlash = 0.12;
  addFloatText(`-${Math.round(damage)}`, enemy.x, enemy.y - 26, options.color || "#ffd66b");
  if (options.bleedChance && Math.random() < options.bleedChance) {
    enemy.bleed = Math.max(enemy.bleed, 4.2);
    enemy.bleedTick = 0.4;
    addFloatText("出血", enemy.x, enemy.y - 42, "#e7564f");
  }
  if (options.poison) {
    enemy.poison = Math.max(enemy.poison, options.poison);
  }
  if (options.root) {
    enemy.rooted = Math.max(enemy.rooted, options.root);
  }
  if (options.slow) {
    enemy.slow = Math.max(enemy.slow, options.slow);
  }
  const knockback = options.knockback || 0;
  if (knockback > 0) {
    const dx = enemy.x - source.x;
    const dy = enemy.y - source.y;
    const len = Math.hypot(dx, dy) || 1;
    enemy.x += (dx / len) * knockback * 0.07;
    enemy.y += (dy / len) * knockback * 0.07;
  }
  if (options.lifesteal) {
    const heal = damage * options.lifesteal;
    player.hp = clamp(player.hp + heal, 0, player.maxHp);
    if (heal > 0.4) addFloatText(`+${Math.round(heal)}`, player.x, player.y - 35, "#65c47b");
  }
  if (enemy.hp <= 0) {
    awardEnemyDefeat(enemy, options.owner || source?.owner || source);
  }
}

function applyDamage(target, amount, source, color = "#e7564f") {
  target.hp -= amount;
  addFloatText(`-${Math.round(amount)}`, target.x, target.y - 30, color);
  addParticles(target.x, target.y, color, 6, 80);
  const counterLevel = skillLevel("counter");
  if (counterLevel > 0 && source && state.enemies.includes(source)) {
    const reflected = amount * counterLevel * 0.07;
    if (reflected > 0.4) {
      damageEnemy(source, reflected, target, {
        knockback: 25 + counterLevel * 4,
        color: "#f1b84b",
      });
      addFloatText("反撃", target.x, target.y - 48, "#f1b84b");
    }
  }
}

function startAttackFx(actor, target, weaponId = "ironSword") {
  if (!actor || !target) return;
  const dx = target.x - actor.x;
  const dy = target.y - actor.y;
  const len = Math.hypot(dx, dy) || 1;
  actor.attackFx = {
    started: state.time,
    duration: 0.34,
    weaponId,
    dirX: dx / len,
    dirY: dy / len,
    distance: Math.min(len * 0.58, 42),
  };
}

function enemyVelocityEstimate(enemy) {
  if (!enemy.moving && enemy.chargeState !== "charge") return { x: 0, y: 0 };
  if (enemy.chargeState === "charge" && enemy.chargeDir) {
    return {
      x: enemy.chargeDir.x * (enemy.chargeSpeed || enemy.speed || 0),
      y: enemy.chargeDir.y * (enemy.chargeSpeed || enemy.speed || 0),
    };
  }
  const dir = {
    left: { x: -1, y: 0 },
    right: { x: 1, y: 0 },
    up: { x: 0, y: -1 },
    down: { x: 0, y: 1 },
  }[enemy.moveDir] || { x: 0, y: 0 };
  return {
    x: dir.x * (enemy.speed || 0),
    y: dir.y * (enemy.speed || 0),
  };
}

function aimPointForTarget(shooter, target, projectileSpeed, leadLevel = 0) {
  if (leadLevel <= 0) return { x: target.x, y: target.y };
  const distance = Math.hypot(target.x - shooter.x, target.y - shooter.y);
  const travelTime = distance / Math.max(1, projectileSpeed);
  const leadFactor = clamp(leadLevel * 0.08, 0, 0.82);
  const velocity = enemyVelocityEstimate(target);
  return {
    x: target.x + velocity.x * travelTime * leadFactor,
    y: target.y + velocity.y * travelTime * leadFactor,
  };
}

function applyProjectileHoming(projectile, dt) {
  const level = projectile.homing || 0;
  if (level <= 0 || projectile.faction === "enemy") return;
  const speed = Math.hypot(projectile.vx, projectile.vy) || projectile.speed || 1;
  const target = findNearestEnemy(170 + level * 42, projectile);
  if (!target) return;
  const dx = target.x - projectile.x;
  const dy = target.y - projectile.y;
  const len = Math.hypot(dx, dy) || 1;
  const turn = clamp(dt * (1.45 + level * 0.32), 0, 0.55);
  const nx = projectile.vx / speed;
  const ny = projectile.vy / speed;
  const tx = dx / len;
  const ty = dy / len;
  const blendedX = nx + (tx - nx) * turn;
  const blendedY = ny + (ty - ny) * turn;
  const blendedLen = Math.hypot(blendedX, blendedY) || 1;
  projectile.vx = (blendedX / blendedLen) * speed;
  projectile.vy = (blendedY / blendedLen) * speed;
}

function playerAttack(dt) {
  const weapon = equippedWeapon();
  player.attackTimer -= dt;
  const range = weaponRange(weapon);
  const target = findNearestEnemy(range);
  if (!target || player.attackTimer > 0) return;

  player.attackTimer = 1 / weaponRate(weapon);
  const options = {
    bleedChance: weaponBleed(weapon),
    lifesteal: weaponLifesteal(weapon),
    knockback: weaponKnockback(weapon),
  };
  const damage = weaponDamage(weapon);
  const dx = target.x - player.x;
  const dy = target.y - player.y;
  const len = Math.hypot(dx, dy) || 1;
  player.facing = { x: dx / len, y: dy / len };

  if (weapon.type === "近接") {
    startAttackFx(player, target, weapon.id);
    damageEnemy(target, damage, player, options);
    addParticles(target.x, target.y, "#f6f0db", 5, 80);
  } else {
    const color = weapon.type === "魔法" ? "#7dd3ff" : "#f1b84b";
    const projectileSpeed = weaponProjectileSpeed(weapon);
    state.projectiles.push({
      x: player.x + player.facing.x * 22,
      y: player.y + player.facing.y * 22,
      vx: player.facing.x * projectileSpeed,
      vy: player.facing.y * projectileSpeed,
      life: range / projectileSpeed,
      radius: weapon.type === "魔法" ? 9 : 5,
      damage,
      color,
      splash: weapon.splash || 0,
      speed: projectileSpeed,
      homing: weaponHoming(weapon),
      owner: player,
      options,
    });
  }
}

function updateProjectiles(dt) {
  for (const projectile of state.projectiles) {
    applyProjectileHoming(projectile, dt);
    projectile.x += projectile.vx * dt;
    projectile.y += projectile.vy * dt;
    projectile.life -= dt;
    if (projectile.faction === "enemy") {
      const hit = enemyProjectileTargetList().find((target) => Math.hypot(target.x - projectile.x, target.y - projectile.y) < (target.radius || player.radius) + projectile.radius);
      if (hit) {
        applyDamage(hit, projectile.damage, projectile, projectile.options?.color || "#d7b45e");
        projectile.life = 0;
      }
      continue;
    }
    const hit = state.enemies.find((enemy) => Math.hypot(enemy.x - projectile.x, enemy.y - projectile.y) < enemy.radius + projectile.radius);
    if (hit) {
      if (projectile.splash) {
        for (const enemy of state.enemies) {
          if (Math.hypot(enemy.x - projectile.x, enemy.y - projectile.y) < projectile.splash + enemy.radius) {
            damageEnemy(enemy, projectile.damage * 0.82, projectile, {
              ...projectile.options,
              knockback: projectile.options.knockback * 0.45,
              color: "#7dd3ff",
            });
          }
        }
        addParticles(projectile.x, projectile.y, "#7dd3ff", 18, 155);
      } else {
        damageEnemy(hit, projectile.damage, projectile, projectile.options);
      }
      projectile.life = 0;
    }
  }
  state.projectiles = state.projectiles.filter((projectile) => projectile.life > 0);
}

function getMoveVector() {
  let x = 0;
  let y = 0;
  if (state.keys.has("KeyA") || state.keys.has("ArrowLeft")) x -= 1;
  if (state.keys.has("KeyD") || state.keys.has("ArrowRight")) x += 1;
  if (state.keys.has("KeyW") || state.keys.has("ArrowUp")) y -= 1;
  if (state.keys.has("KeyS") || state.keys.has("ArrowDown")) y += 1;
  x += state.pointer.vector.x;
  y += state.pointer.vector.y;
  const len = Math.hypot(x, y);
  if (len > 1) {
    x /= len;
    y /= len;
  }
  return { x, y };
}

function updatePlayer(dt) {
  const move = getMoveVector();
  if (Math.hypot(move.x, move.y) > 0.05) {
    const terrainSpeed = playerTerrainSpeedAt(player.x, player.y);
    const speed = player.speed * moveSpeedMultiplier();
    player.x += move.x * speed * terrainSpeed * dt;
    player.y += move.y * speed * terrainSpeed * dt;
    player.facing = move;
    player.moveDir = directionFromVector(move.x, move.y, player.moveDir);
    player.moving = true;
  } else {
    player.moving = false;
  }
  state.camera.x += (player.x - state.camera.x) * clamp(dt * 8, 0, 1);
  state.camera.y += (player.y - state.camera.y) * clamp(dt * 8, 0, 1);
}

function updateHarvest(dt) {
  let target = null;
  let best = 78;
  for (const resource of state.resources) {
    const d = Math.hypot(resource.x - player.x, resource.y - player.y) - resource.radius;
    if (d < best) {
      target = resource;
      best = d;
    }
  }

  player.harvestTarget = target;
  if (!target) {
    player.harvestPulse = 0;
    player.harvesting = false;
    return;
  }

  const rate = harvestRate(target);
  target.hp -= rate * dt;
  player.harvestPulse += dt * 10;
  player.harvesting = true;
  emitHarvestEffect(player, target, dt);
  if (target.hp <= 0) {
    const def = resourceDefs[target.type];
    spawnDrops(target.type, target.amount, target.x, target.y);
    gainXp(def.xp);
    addFloatText(`${target.amount} ${def.label}`, target.x, target.y - 32, def.color);
    addParticles(target.x, target.y, def.color, 16, 125);
    state.resources = state.resources.filter((resource) => resource !== target);
    setTimeout(() => spawnResource(target.type), target.type === "starstone" ? 15000 : 250);
  }
}

function updateTraps(dt) {
  for (const trap of state.traps) {
    if (trap.triggered) trap.life -= dt;
    trap.cooldown -= dt;
    for (const enemy of state.enemies) {
      if (trap.cooldown > 0) break;
      const d = Math.hypot(enemy.x - trap.x, enemy.y - trap.y);
      if (d > trap.radius + enemy.radius) continue;

      trap.triggered = true;
      trap.cooldown = 0.55;
      trap.durability -= 1;
      if (trap.id === "bomb") {
        for (const other of state.enemies) {
          const od = Math.hypot(other.x - trap.x, other.y - trap.y);
          if (od < 112) damageEnemy(other, 62, trap, { knockback: 220, color: "#ffb24d" });
        }
        addParticles(trap.x, trap.y, "#ffb24d", 36, 245);
        trap.life = 0;
        break;
      }
      if (trap.id === "pit") damageEnemy(enemy, 16, trap, { slow: 2.2, knockback: 30, color: "#a78b69" });
      if (trap.id === "net") damageEnemy(enemy, 5, trap, { root: 2.4, color: "#d8e6d3" });
      if (trap.id === "spikes") damageEnemy(enemy, 12, trap, { poison: 4.8, slow: 1.2, color: "#a8e05f" });
    }
  }
  state.traps = state.traps.filter((trap) => trap.life > 0 && trap.durability > 0);
}

function healTargetFromBase(base, target, dt) {
  if (!target || target.hp <= 0 || target.hp >= target.maxHp) return false;
  if (Math.hypot(target.x - base.x, target.y - base.y) > baseRadius(base)) return false;
  const rate = base.healRate || buildDefById("base")?.healRate || 0.012;
  const healed = Math.min(target.maxHp - target.hp, Math.max(0.55, target.maxHp * rate) * dt);
  target.hp += healed;
  return healed > 0;
}

function updateBaseHealing(dt) {
  for (const base of baseBuildings()) {
    let healedAny = false;
    const targets = [
      player,
      ...state.defenders,
      ...state.workers,
      ...state.buildings,
    ];
    for (const target of targets) {
      if (healTargetFromBase(base, target, dt)) healedAny = true;
    }
    base.healPulse = healedAny ? (base.healPulse || 0) + dt * 5 : 0;
    base.healFxTimer = (base.healFxTimer || 0) - dt;
    if (healedAny && base.healFxTimer <= 0) {
      base.healFxTimer = 0.55;
      addParticles(base.x + rand(-base.radius, base.radius), base.y + rand(-base.radius, base.radius), "#7dd3ff", 3, 45);
    }
  }
}

function buildingProjectileSpeed(baseSpeed) {
  return baseSpeed * allyShotSpeedMultiplier();
}

function updateBuildings(dt) {
  updateBaseHealing(dt);
  for (const building of state.buildings) {
    building.attackTimer -= dt;
    if (building.id !== "tower" || building.attackTimer > 0) continue;
    const target = findNearestEnemy(260, building);
    if (!target) continue;
    building.attackTimer = 0.9;
    const speed = buildingProjectileSpeed(430);
    const aim = aimPointForTarget(building, target, speed, skillLevel("predictiveShot"));
    const dx = aim.x - building.x;
    const dy = aim.y - building.y;
    const len = Math.hypot(dx, dy) || 1;
    state.projectiles.push({
      x: building.x,
      y: building.y - 22,
      vx: (dx / len) * speed,
      vy: (dy / len) * speed,
      life: 260 / speed,
      radius: 5,
      damage: 16,
      color: "#f1b84b",
      splash: 0,
      owner: building,
      options: { knockback: 45, bleedChance: 0, lifesteal: 0 },
    });
  }
  state.buildings = state.buildings.filter((building) => building.hp > 0);
}

function defenderProtectionScore(enemy, defender) {
  const protectedSpots = [
    { x: player.x, y: player.y, radius: 390, priority: -70 },
    ...state.buildings.map((item) => ({ x: item.x, y: item.y, radius: 330, priority: -62 })),
    ...state.traps.map((item) => ({ x: item.x, y: item.y, radius: 210, priority: -24 })),
    ...state.defenders.map((item) => ({ x: item.x, y: item.y, radius: item === defender ? 320 : 270, priority: item === defender ? -56 : -44 })),
    ...state.workers.map((item) => ({ x: item.x, y: item.y, radius: 280, priority: -48 })),
  ];

  let best = Infinity;
  for (const spot of protectedSpots) {
    const distance = Math.hypot(enemy.x - spot.x, enemy.y - spot.y);
    if (distance > spot.radius) continue;
    best = Math.min(best, distance + spot.priority);
  }
  return best;
}

function findDefenderHuntTarget(defender, homeX, homeY) {
  const attackRange = (defender.range || 96) * allyRangeMultiplier();
  const melee = defender.attackType === "melee";
  const base = assignedBase(defender);
  const homeLeash = base ? baseWorkRadius(base) : melee ? 560 : attackRange + 90;
  let best = null;
  let bestScore = Infinity;

  for (const enemy of state.enemies) {
    if (!withinAssignedBase(defender, enemy)) continue;
    const protectionScore = defenderProtectionScore(enemy, defender);
    if (!Number.isFinite(protectionScore)) continue;

    const enemyHomeDistance = Math.hypot(enemy.x - homeX, enemy.y - homeY);
    if (enemyHomeDistance > homeLeash) continue;

    const defenderDistance = Math.hypot(enemy.x - defender.x, enemy.y - defender.y);
    if (!melee && defenderDistance > attackRange) continue;

    const score = protectionScore + defenderDistance * 0.42 + enemyHomeDistance * 0.16;
    if (score < bestScore) {
      best = enemy;
      bestScore = score;
    }
  }

  return best;
}

function updateDefenders(dt) {
  for (const defender of state.defenders) {
    syncAllyStats(defender);
    defender.attackTimer -= dt;
    const home = allyHomePosition(defender);
    const homeX = home.x;
    const homeY = home.y;
    const homeDistance = Math.hypot(homeX - defender.x, homeY - defender.y);
    const escortLeash = home.base ? baseWorkRadius(home.base) + 40 : defender.attackType === "melee" ? 520 : 230;
    const target = homeDistance <= escortLeash
      ? findDefenderHuntTarget(defender, homeX, homeY) || (home.base ? null : findNearestEnemy((defender.range || 96) * allyRangeMultiplier(), defender))
      : null;
    if (target) {
      const dx = target.x - defender.x;
      const dy = target.y - defender.y;
      const len = Math.hypot(dx, dy) || 1;
      defender.moveDir = directionFromVector(dx, dy, defender.moveDir);
      const attackRange = (defender.range || 96) * allyRangeMultiplier();
      if (len > attackRange && defender.attackType === "melee") {
        moveAllyToward(defender, target.x, target.y, dt, attackRange * 0.78);
        continue;
      }
      defender.moving = false;
      if (len <= attackRange && defender.attackTimer <= 0) {
        defender.attackTimer = 1 / (defender.rate || 1);
        const options = {
          knockback: defender.knockback || 45,
          bleedChance: defender.attackType === "melee" ? 0.04 : 0,
          color: defender.attackType === "magic" ? "#7dd3ff" : "#f1b84b",
        };
        if (defender.attackType === "melee") {
          startAttackFx(defender, target, defender.weaponId || "ironSword");
          damageEnemy(target, allyDamage(defender) || 10, defender, options);
          addParticles(target.x, target.y, "#f6f0db", 5, 80);
        } else {
          const speed = (defender.projectileSpeed || 420) * allyShotSpeedMultiplier();
          const aim = aimPointForTarget(defender, target, speed, skillLevel("predictiveShot"));
          const aimDx = aim.x - defender.x;
          const aimDy = aim.y - defender.y;
          const aimLen = Math.hypot(aimDx, aimDy) || 1;
          state.projectiles.push({
            x: defender.x + (aimDx / aimLen) * 18,
            y: defender.y + (aimDy / aimLen) * 18,
            vx: (aimDx / aimLen) * speed,
            vy: (aimDy / aimLen) * speed,
            life: attackRange / speed,
            radius: defender.attackType === "magic" ? 8 : 5,
            damage: allyDamage(defender) || 10,
            color: defender.attackType === "magic" ? "#7dd3ff" : "#f1b84b",
            splash: defender.splash || 0,
            owner: defender,
            options,
          });
        }
      }
      continue;
    }

    moveAllyToward(defender, homeX, homeY, dt, 8);
  }
  state.defenders = state.defenders.filter((defender) => defender.hp > 0);
}

function findNearestResourceForWorker(worker) {
  let best = null;
  let bestDistance = worker.searchRadius || 380;
  const home = allyHomePosition(worker);
  const center = home.base || player;
  const allowedRadius = home.base ? baseWorkRadius(home.base) : worker.searchRadius || 380;
  for (const resource of state.resources) {
    if (!worker.targets.includes(resource.type)) continue;
    if (Math.hypot(resource.x - center.x, resource.y - center.y) > allowedRadius) continue;
    const d = Math.hypot(resource.x - worker.x, resource.y - worker.y);
    if (d < bestDistance) {
      best = resource;
      bestDistance = d;
    }
  }
  return best;
}

function workerHarvestRate(worker, resource) {
  const base = worker.role === "lumberjack" ? 13 : 11;
  const focus = worker.targets.length === 1 ? 1.12 : 1;
  const rarity = resource.type === "starstone" ? 0.48 : resource.type === "gold" ? 0.86 : resource.type === "iron" ? 0.94 : 1;
  return base * focus * rarity * (1 + (player.level - 1) * 0.06);
}

function repairEfficiencyMultiplier(worker) {
  const level = Math.min(worker.level || 1, 10);
  return 1 - ((level - 1) / 9) * 0.5;
}

function repairDuration(worker) {
  return 10 * repairEfficiencyMultiplier(worker);
}

function repairCost(building, worker) {
  const def = buildDefById(building.id);
  if (!def) return {};
  const missingRatio = clamp((building.maxHp - building.hp) / building.maxHp, 0, 1);
  const multiplier = repairEfficiencyMultiplier(worker);
  const cost = {};
  for (const [key, value] of Object.entries(def.cost)) {
    const amount = Math.ceil(value * 0.5 * missingRatio * multiplier);
    if (amount > 0) cost[key] = amount;
  }
  return cost;
}

function findNearestDamagedBuildingForRepairer(worker) {
  let best = null;
  let bestScore = Infinity;
  const home = allyHomePosition(worker);
  const center = home.base || worker;
  const allowedRadius = home.base ? baseWorkRadius(home.base) : worker.searchRadius || 520;
  for (const building of state.buildings) {
    if (building.hp >= building.maxHp || building.repairReservedBy) continue;
    if (Math.hypot(building.x - center.x, building.y - center.y) > allowedRadius) continue;
    const d = Math.hypot(building.x - worker.x, building.y - worker.y);
    const ratio = building.hp / building.maxHp;
    const score = ratio * 900 + d * 0.22 + (ratio <= 0.5 ? -420 : 0);
    if (score < bestScore) {
      best = building;
      bestScore = score;
    }
  }
  return best;
}

function findCriticalRepairTarget(worker, currentTarget) {
  const currentRatio = currentTarget ? currentTarget.hp / currentTarget.maxHp : 1;
  let best = null;
  let bestRatio = currentRatio;
  const home = allyHomePosition(worker);
  const center = home.base || worker;
  const allowedRadius = home.base ? baseWorkRadius(home.base) : worker.searchRadius || 520;
  for (const building of state.buildings) {
    if (building === currentTarget || building.hp >= building.maxHp || building.repairReservedBy) continue;
    if (Math.hypot(building.x - center.x, building.y - center.y) > allowedRadius) continue;
    const ratio = building.hp / building.maxHp;
    if (ratio <= 0.5 && ratio < bestRatio - 0.04) {
      best = building;
      bestRatio = ratio;
    }
  }
  return best;
}

function cancelRepairJob(worker) {
  if (worker.repairJob?.target) worker.repairJob.target.repairReservedBy = null;
  worker.repairJob = null;
  worker.repairTarget = null;
}

function spendRepairCostTo(job, fraction) {
  for (const [key, total] of Object.entries(job.cost)) {
    const required = Math.min(total, Math.floor(total * fraction));
    while ((job.spent[key] || 0) < required) {
      if (player[key] < 1) return false;
      player[key] -= 1;
      job.spent[key] = (job.spent[key] || 0) + 1;
    }
  }
  return true;
}

function updateRepairer(worker, dt) {
  syncAllyStats(worker);
  const job = worker.repairJob;
  if (job && (!state.buildings.includes(job.target) || job.target.hp >= job.target.maxHp)) {
    cancelRepairJob(worker);
  }
  if (retreatAssignedWorkerIfThreatened(worker, dt)) return;
  if (worker.repairJob) {
    const urgent = findCriticalRepairTarget(worker, worker.repairJob.target);
    if (urgent) {
      cancelRepairJob(worker);
      worker.repairTarget = urgent;
      addFloatText("緊急修理へ", worker.x, worker.y - 45, "#f1b84b");
    }
  }

  if (!worker.repairJob) {
    const target = findNearestDamagedBuildingForRepairer(worker);
    worker.repairTarget = target;
    if (!target) {
      const home = allyHomePosition(worker);
      moveAllyToward(worker, home.x, home.y, dt, 12);
      return;
    }
    if (!moveAllyToward(worker, target.x, target.y, dt, target.radius + worker.radius + 14)) return;

    const cost = repairCost(target, worker);
    if (!canAfford(cost)) {
      worker.moving = false;
      if (!worker.repairToastUntil || state.time > worker.repairToastUntil) {
        worker.repairToastUntil = state.time + 2.5;
        showToast(`${target.label}の修理には ${costText(cost)} が必要です`);
      }
      return;
    }
    target.repairReservedBy = worker;
    worker.repairJob = {
      target,
      cost,
      spent: {},
      elapsed: 0,
      duration: repairDuration(worker),
      startHp: target.hp,
      missing: target.maxHp - target.hp,
    };
    worker.repairPulse = 0;
    addFloatText("修理開始", target.x, target.y - 54, "#7dd3ff");
    return;
  }

  const activeJob = worker.repairJob;
  const target = activeJob.target;
  worker.repairTarget = target;
  if (!moveAllyToward(worker, target.x, target.y, dt, target.radius + worker.radius + 14)) return;
  const nextElapsed = Math.min(activeJob.duration, activeJob.elapsed + dt);
  if (!spendRepairCostTo(activeJob, nextElapsed / activeJob.duration)) {
    worker.moving = false;
    if (!worker.repairToastUntil || state.time > worker.repairToastUntil) {
      worker.repairToastUntil = state.time + 2.5;
      showToast(`修理資源が足りません：${costText(activeJob.cost)}`);
    }
    return;
  }

  worker.moving = false;
  worker.repairPulse = (worker.repairPulse || 0) + dt * 8;
  activeJob.elapsed = nextElapsed;
  target.hp = clamp(target.hp + (activeJob.missing / activeJob.duration) * dt, 0, target.maxHp);
  addParticles(target.x + rand(-target.radius, target.radius), target.y + rand(-target.radius, target.radius), "#7dd3ff", 1, 45);

  if (activeJob.elapsed >= activeJob.duration) {
    if (!spendRepairCostTo(activeJob, 1)) return;
    target.hp = target.maxHp;
    cancelRepairJob(worker);
    allyGainXp(worker, 60);
    addFloatText("修理完了", target.x, target.y - 58, "#65c47b");
    addParticles(target.x, target.y, "#65c47b", 18, 120);
  }
}

function findHealerTarget(healer) {
  const screenRange = Math.max(520, Math.max(state.width, state.height) * 0.62);
  const home = allyHomePosition(healer);
  const candidates = [
    player,
    ...state.defenders,
    ...state.workers.filter((worker) => worker !== healer),
  ].filter((target) => target.hp > 0 && target.maxHp && target.hp < target.maxHp - 1);
  let best = null;
  let bestScore = Infinity;
  for (const target of candidates) {
    if (home.base) {
      if (Math.hypot(target.x - home.base.x, target.y - home.base.y) > baseWorkRadius(home.base)) continue;
    } else if (Math.hypot(target.x - player.x, target.y - player.y) > screenRange) {
      continue;
    }
    const ratio = target.hp / target.maxHp;
    const distance = Math.hypot(target.x - healer.x, target.y - healer.y);
    const score = ratio * 1000 + distance * 0.16;
    if (score < bestScore) {
      best = target;
      bestScore = score;
    }
  }
  return best;
}

function healerRate(healer, target) {
  return target.maxHp * (0.05 + Math.max(0, (healer.level || 1) - 1) * 0.004);
}

function updateHealer(healer, dt) {
  syncAllyStats(healer);
  if (retreatAssignedWorkerIfThreatened(healer, dt)) return;
  if (healer.healTarget && (healer.healTarget.hp <= 0 || healer.healTarget.hp >= healer.healTarget.maxHp - 1)) {
    healer.healTarget = null;
  }
  const target = healer.healTarget || findHealerTarget(healer);
  healer.healTarget = target;
  if (!target) {
    healer.healPulse = 0;
    const home = allyHomePosition(healer);
    moveAllyToward(healer, home.x, home.y, dt, 12);
    return;
  }

  const distance = Math.hypot(target.x - healer.x, target.y - healer.y);
  const range = healer.healRange || 150;
  if (distance > range) {
    healer.healPulse = 0;
    moveAllyToward(healer, target.x, target.y, dt, range * 0.78);
    return;
  }

  healer.moving = false;
  healer.moveDir = directionFromVector(target.x - healer.x, target.y - healer.y, healer.moveDir);
  if (player.meat <= 0.02) {
    healer.healPulse = 0;
    if (!healer.healToastUntil || state.time > healer.healToastUntil) {
      healer.healToastUntil = state.time + 2.5;
      showToast("ヒーラーの回復には肉が必要です");
    }
    return;
  }

  const missing = target.maxHp - target.hp;
  const healed = Math.min(missing, healerRate(healer, target) * dt);
  if (healed <= 0) return;
  target.hp += healed;
  player.meat = Math.max(0, player.meat - dt / 10);
  healer.healPulse += dt * 8;
  healer.healFxTimer = (healer.healFxTimer || 0) - dt;
  if (healer.healFxTimer <= 0) {
    healer.healFxTimer = 0.2;
    addParticles(target.x, target.y, "#a8e05f", 5, 54);
  }
  healer.healXpBuffer = (healer.healXpBuffer || 0) + healed;
  if (healer.healXpBuffer >= 8) {
    allyGainXp(healer, healer.healXpBuffer * 0.5);
    healer.healXpBuffer = 0;
  }
}

function findNearestDropForDog(dog) {
  let best = null;
  let bestDistance = dog.searchRadius || 620;
  const home = allyHomePosition(dog);
  const center = home.base || dog;
  const allowedRadius = home.base ? baseWorkRadius(home.base) : dog.searchRadius || 620;
  for (const drop of state.drops) {
    if (drop.collected || drop.pickupDelay > 0) continue;
    if (Math.hypot(drop.x - center.x, drop.y - center.y) > allowedRadius) continue;
    const d = Math.hypot(drop.x - dog.x, drop.y - dog.y);
    if (d < bestDistance) {
      best = drop;
      bestDistance = d;
    }
  }
  return best;
}

function moveAllyToward(ally, x, y, dt, arriveDistance = 10) {
  const dx = x - ally.x;
  const dy = y - ally.y;
  const len = Math.hypot(dx, dy);
  if (len <= arriveDistance) {
    ally.moving = false;
    return true;
  }
  ally.moveDir = directionFromVector(dx, dy, ally.moveDir);
  ally.moving = true;
  const terrainSpeed = terrainSpeedAt(ally.x, ally.y);
  const speed = allyMoveSpeed(ally);
  ally.x += (dx / len) * speed * terrainSpeed * dt;
  ally.y += (dy / len) * speed * terrainSpeed * dt;
  return false;
}

function updateDog(dog, dt) {
  syncAllyStats(dog);
  if (dog.carryDrop) {
    dog.fetchTarget = null;
    const home = allyHomePosition(dog);
    const deliverX = home.base ? home.x : player.x + dog.homeOffset.x * 0.25;
    const deliverY = home.base ? home.y : player.y + dog.homeOffset.y * 0.25;
    const arrived = moveAllyToward(dog, deliverX, deliverY, dt, dog.radius + (home.base?.radius || player.radius) + 20);
    if (arrived) {
      collectDrop({
        dropType: dog.carryDrop.dropType,
        amount: dog.carryDrop.amount,
        x: dog.x,
        y: dog.y,
      });
      addFloatText("お届け", dog.x, dog.y - 34, "#f1b84b");
      dog.carryDrop = null;
    }
    return;
  }

  if (retreatAssignedWorkerIfThreatened(dog, dt)) return;

  const drop = findNearestDropForDog(dog);
  if (drop) {
    dog.fetchTarget = drop;
    const arrived = moveAllyToward(dog, drop.x, drop.y, dt, dog.radius + drop.radius + 8);
    if (arrived && !drop.collected) {
      dog.carryDrop = {
        dropType: drop.dropType,
        amount: drop.amount,
      };
      drop.collected = true;
      addFloatText("ワンコ回収", dog.x, dog.y - 32, "#f1b84b");
    }
    return;
  }

  dog.fetchTarget = null;
  const home = allyHomePosition(dog);
  moveAllyToward(dog, home.x, home.y, dt, 12);
}

function finishWorkerHarvest(worker, resource) {
  const def = resourceDefs[resource.type];
  spawnDrops(resource.type, resource.amount, resource.x, resource.y);
  addFloatText(`${worker.label} ${resource.amount} ${def.label}`, resource.x, resource.y - 32, def.color);
  addParticles(resource.x, resource.y, def.color, 12, 100);
  state.resources = state.resources.filter((item) => item !== resource);
  setTimeout(() => spawnResource(resource.type), resource.type === "starstone" ? 15000 : 250);
}

function updateWorkers(dt) {
  for (const worker of state.workers) {
    if (worker.kind === "dog") {
      updateDog(worker, dt);
      continue;
    }
    if (worker.kind === "repairer") {
      updateRepairer(worker, dt);
      continue;
    }
    if (worker.kind === "healer") {
      updateHealer(worker, dt);
      continue;
    }
    syncAllyStats(worker);
    if (retreatAssignedWorkerIfThreatened(worker, dt)) {
      worker.harvesting = false;
      continue;
    }
    if (!state.resources.includes(worker.harvestTarget)) {
      worker.harvestTarget = null;
    }
    if (worker.harvestTarget && !withinAssignedBase(worker, worker.harvestTarget)) {
      worker.harvestTarget = null;
    }
    if (!assignedBase(worker) && worker.harvestTarget && Math.hypot(worker.harvestTarget.x - player.x, worker.harvestTarget.y - player.y) > (worker.searchRadius || 380)) {
      worker.harvestTarget = null;
    }

    const home = allyHomePosition(worker);
    const tooFarFromHome = Math.hypot(worker.x - home.x, worker.y - home.y) > (home.base ? baseWorkRadius(home.base) + 30 : worker.leash || 430);
    const target = tooFarFromHome ? null : worker.harvestTarget || findNearestResourceForWorker(worker);
    worker.harvestTarget = target;

    if (!target) {
      worker.harvesting = false;
      const dx = home.x - worker.x;
      const dy = home.y - worker.y;
      const len = Math.hypot(dx, dy);
      if (len > 12) {
        moveAllyToward(worker, home.x, home.y, dt, 12);
      } else {
        worker.moving = false;
      }
      continue;
    }

    const dx = target.x - worker.x;
    const dy = target.y - worker.y;
    const len = Math.hypot(dx, dy) || 1;
    const stopDistance = target.radius + worker.radius + 28;

    if (len > stopDistance) {
      worker.harvesting = false;
      moveAllyToward(worker, target.x, target.y, dt, stopDistance);
      continue;
    }

    worker.moving = false;
    worker.harvesting = true;
    worker.harvestPulse += dt * 9;
    target.hp -= workerHarvestRate(worker, target) * dt;
    emitHarvestEffect(worker, target, dt);
    if (target.hp <= 0) {
      finishWorkerHarvest(worker, target);
      worker.harvestTarget = null;
    }
  }

  state.workers = state.workers.filter((worker) => worker.hp > 0);
  for (const building of state.buildings) {
    if (building.repairReservedBy && !state.workers.includes(building.repairReservedBy)) {
      building.repairReservedBy = null;
    }
  }
}

function findEnemyOpponent(enemy, maxDistance) {
  let best = null;
  let bestDistance = maxDistance;
  for (const other of state.enemies) {
    if (other === enemy || other.hp <= 0) continue;
    const d = Math.hypot(other.x - enemy.x, other.y - enemy.y);
    if (d < bestDistance) {
      best = other;
      bestDistance = d;
    }
  }
  return best;
}

function enemyTargetDistance(enemy, target) {
  return Math.hypot(target.x - enemy.x, target.y - enemy.y) - (target.radius || player.radius);
}

function findEnemyTarget(enemy) {
  let target = player.hiddenTime > 0 ? null : player;
  let targetDistance = target ? Math.hypot(player.x - enemy.x, player.y - enemy.y) : Infinity;
  for (const building of state.buildings) {
    const d = Math.hypot(building.x - enemy.x, building.y - enemy.y) - building.radius;
    if (d < targetDistance && d < 92) {
      target = building;
      targetDistance = d;
    }
  }
  for (const defender of state.defenders) {
    const d = Math.hypot(defender.x - enemy.x, defender.y - enemy.y);
    if (d < targetDistance && d < 82) {
      target = defender;
      targetDistance = d;
    }
  }
  for (const worker of state.workers) {
    const d = Math.hypot(worker.x - enemy.x, worker.y - enemy.y);
    if (d < targetDistance && d < 82) {
      target = worker;
      targetDistance = d;
    }
  }
  return { target, targetDistance };
}

function resolveEnemyWallCollision(enemy) {
  for (const wall of state.buildings) {
    if (wall.id !== "wall" || wall.hp <= 0) continue;
    const minDistance = enemy.radius + wall.radius;
    const dx = enemy.x - wall.x;
    const dy = enemy.y - wall.y;
    let d = Math.hypot(dx, dy);
    if (d >= minDistance) continue;
    if (d < 0.01) {
      d = 0.01;
      enemy.x += 0.01;
    }
    const nx = dx / d;
    const ny = dy / d;
    enemy.x = wall.x + nx * minDistance;
    enemy.y = wall.y + ny * minDistance;
    return wall;
  }
  return null;
}

function enemyHitBlockingWall(enemy, wall, multiplier = 1) {
  enemy.moving = false;
  enemy.rooted = Math.max(enemy.rooted || 0, 0.12);
  enemy.moveDir = directionFromVector(wall.x - enemy.x, wall.y - enemy.y, enemy.moveDir);
  if (enemy.attackTimer <= 0) {
    enemy.attackTimer = Math.max(0.45, (enemy.attackCooldown || 1.1) * 0.8);
    applyDamage(wall, enemy.damage * multiplier, enemy, "#aeb7b7");
    addParticles(wall.x, wall.y, "#aeb7b7", 7, 95);
  }
}

function moveEnemyToward(enemy, target, dt, speedMultiplier = 1) {
  if (enemy.rooted > 0) {
    enemy.moving = false;
    return;
  }
  const dx = target.x - enemy.x;
  const dy = target.y - enemy.y;
  const len = Math.hypot(dx, dy) || 1;
  const slowFactor = enemy.slow > 0 || enemy.poison > 0 ? 0.48 : 1;
  const terrainSpeed = terrainSpeedAt(enemy.x, enemy.y);
  enemy.moveDir = directionFromVector(dx, dy, enemy.moveDir);
  enemy.moving = true;
  enemy.x += (dx / len) * enemy.speed * speedMultiplier * slowFactor * terrainSpeed * dt;
  enemy.y += (dy / len) * enemy.speed * speedMultiplier * slowFactor * terrainSpeed * dt;
  const wall = resolveEnemyWallCollision(enemy);
  if (wall) enemyHitBlockingWall(enemy, wall);
}

function enemyMeleeAttack(enemy, target, targetDistance) {
  if (targetDistance >= enemy.radius + (target.radius || player.radius) + 9) return false;
  enemy.moving = false;
  enemy.moveDir = directionFromVector(target.x - enemy.x, target.y - enemy.y, enemy.moveDir);
  if (enemy.attackTimer <= 0) {
    enemy.attackTimer = enemy.attackCooldown || 1.1;
    applyDamage(target, enemy.damage, enemy);
  }
  return true;
}

function enemyProjectileTargetList() {
  return [
    ...(player.hiddenTime > 0 ? [] : [player]),
    ...state.buildings,
    ...state.defenders,
    ...state.workers,
  ].filter((target) => target.hp > 0);
}

function enemyTargetId(target) {
  if (target === player) return "player";
  return `${target.role || target.id || "object"}:${target.x.toFixed(1)}:${target.y.toFixed(1)}`;
}

function updateRangedEnemy(enemy, target, targetDistance, dt) {
  const range = enemy.range || 230;
  if (targetDistance > range) {
    moveEnemyToward(enemy, target, dt);
    return;
  }
  enemy.moving = false;
  enemy.moveDir = directionFromVector(target.x - enemy.x, target.y - enemy.y, enemy.moveDir);
  if (enemy.attackTimer > 0) return;
  enemy.attackTimer = enemy.attackCooldown || 3;
  const dx = target.x - enemy.x;
  const dy = target.y - enemy.y;
  const len = Math.hypot(dx, dy) || 1;
  const speed = enemy.projectileSpeed || 300;
  state.projectiles.push({
    faction: "enemy",
    x: enemy.x + (dx / len) * 18,
    y: enemy.y + (dy / len) * 18,
    vx: (dx / len) * speed,
    vy: (dy / len) * speed,
    life: range / speed,
    radius: 5,
    damage: enemy.damage,
    color: "#d7b45e",
    options: { color: "#d7b45e" },
  });
}

function updateBoarEnemy(enemy, target, dt) {
  enemy.stateTimer -= dt;
  if (enemy.chargeState === "charge") {
    enemy.moving = true;
    const terrainSpeed = terrainSpeedAt(enemy.x, enemy.y);
    const slowFactor = enemy.slow > 0 || enemy.poison > 0 ? 0.48 : 1;
    if (enemy.rooted <= 0) {
      enemy.x += enemy.chargeDir.x * enemy.chargeSpeed * slowFactor * terrainSpeed * dt;
      enemy.y += enemy.chargeDir.y * enemy.chargeSpeed * slowFactor * terrainSpeed * dt;
    }
    const blockingWall = resolveEnemyWallCollision(enemy);
    if (blockingWall) {
      enemyHitBlockingWall(enemy, blockingWall, 1.65);
      enemy.chargeState = "windup";
      enemy.stateTimer = 3.2;
      enemy.hitTargets = [];
      addFloatText("激突", enemy.x, enemy.y - 34, "#d67b42");
      return;
    }
    for (const item of enemyProjectileTargetList()) {
      if (enemy.hitTargets.includes(item)) continue;
      const d = Math.hypot(item.x - enemy.x, item.y - enemy.y);
      if (d < enemy.radius + (item.radius || player.radius) + 8) {
        enemy.hitTargets.push(item);
        applyDamage(item, enemy.damage, enemy, "#d67b42");
        addParticles(item.x, item.y, "#d67b42", 8, 105);
      }
    }
    if (enemy.stateTimer <= 0) {
      enemy.chargeState = "windup";
      enemy.stateTimer = 5;
      enemy.hitTargets = [];
      enemy.moving = false;
    }
    return;
  }

  enemy.moving = false;
  enemy.moveDir = directionFromVector(target.x - enemy.x, target.y - enemy.y, enemy.moveDir);
  if (enemy.stateTimer <= 0) {
    const dx = target.x - enemy.x;
    const dy = target.y - enemy.y;
    const len = Math.hypot(dx, dy) || 1;
    enemy.chargeDir = { x: dx / len, y: dy / len };
    enemy.chargeState = "charge";
    enemy.stateTimer = 3;
    enemy.hitTargets = [];
    addFloatText("突進", enemy.x, enemy.y - 38, "#d67b42");
  }
}

function updateEnemies(dt) {
  updateWave(dt);

  for (const enemy of state.enemies) {
    enemy.attackTimer -= dt;
    enemy.hurtFlash -= dt;
    enemy.bleed -= dt;
    enemy.poison -= dt;
    enemy.rooted -= dt;
    enemy.slow -= dt;
    enemy.confused = Math.max(0, (enemy.confused || 0) - dt);

    if (enemy.bleed > 0) {
      enemy.bleedTick -= dt;
      if (enemy.bleedTick <= 0) {
        enemy.bleedTick = 0.55;
        enemy.hp -= 3;
        addFloatText("-3", enemy.x, enemy.y - 22, "#e7564f");
      }
    }
    if (enemy.poison > 0) {
      enemy.hp -= 7 * dt;
    }

    if (enemy.confused > 0) {
      const opponent = findEnemyOpponent(enemy, enemy.confusionRange || 130);
      if (opponent) {
        const dx = opponent.x - enemy.x;
        const dy = opponent.y - enemy.y;
        const distance = Math.hypot(dx, dy);
        enemy.moveDir = directionFromVector(dx, dy, enemy.moveDir);
        if (distance < enemy.radius + opponent.radius + 8) {
          enemy.moving = false;
          if (enemy.attackTimer <= 0) {
            enemy.attackTimer = 0.95;
            opponent.hp -= enemy.damage * 0.9;
            addFloatText(`-${Math.round(enemy.damage * 0.9)}`, opponent.x, opponent.y - 26, "#f0a6ff");
            addParticles(opponent.x, opponent.y, "#f0a6ff", 5, 78);
          }
        } else if (enemy.rooted <= 0) {
          const len = distance || 1;
          const terrainSpeed = terrainSpeedAt(enemy.x, enemy.y);
          enemy.moving = true;
          enemy.x += (dx / len) * enemy.speed * 0.78 * terrainSpeed * dt;
          enemy.y += (dy / len) * enemy.speed * 0.78 * terrainSpeed * dt;
          const wall = resolveEnemyWallCollision(enemy);
          if (wall) enemyHitBlockingWall(enemy, wall, 0.8);
        }
      } else {
        enemy.moving = false;
      }
      continue;
    }

    const { target, targetDistance } = findEnemyTarget(enemy);

    if (!target) {
      enemy.moving = false;
      continue;
    }

    if (enemy.behavior === "ranged") {
      updateRangedEnemy(enemy, target, targetDistance, dt);
      continue;
    }

    if (enemy.behavior === "boar") {
      updateBoarEnemy(enemy, target, dt);
      continue;
    }

    if (enemyMeleeAttack(enemy, target, targetDistance)) continue;
    moveEnemyToward(enemy, target, dt);
  }

  const defeated = state.enemies.filter((enemy) => enemy.hp <= 0);
  defeated.forEach(awardEnemyDefeat);
  state.enemies = state.enemies.filter((enemy) => enemy.hp > 0);
  if (defeated.length > 0) {
    for (let i = 0; i < defeated.length; i += 1) {
      if (Math.random() < 0.4) spawnResource(Math.random() < 0.58 ? "wood" : Math.random() < 0.55 ? "stone" : "iron");
    }
  }

  if (player.hp <= 0) {
    player.hp = player.maxHp;
    player.x = 0;
    player.y = 0;
    player.wood = Math.max(0, Math.floor(player.wood * 0.72));
    player.stone = Math.max(0, Math.floor(player.stone * 0.72));
    player.gold = Math.max(0, Math.floor(player.gold * 0.72));
    player.iron = Math.max(0, Math.floor(player.iron * 0.72));
    player.meat = Math.max(0, Math.floor(player.meat * 0.72));
    state.enemies.length = 0;
    startWave(Math.max(1, state.wave.index));
    showToast("倒れました。資源を少し失って中央から再開します");
  }
}

function updateEffects(dt) {
  for (const particle of state.particles) {
    particle.age += dt;
    particle.x += particle.vx * dt;
    particle.y += particle.vy * dt;
    particle.vy += (particle.gravity || 0) * dt;
    particle.rotation += (particle.spin || 0) * dt;
    particle.vx *= 0.92;
    particle.vy *= 0.92;
  }
  state.particles = state.particles.filter((particle) => particle.age < particle.life);

  for (const text of state.floatText) {
    text.age += dt;
    text.y -= 36 * dt;
  }
  state.floatText = state.floatText.filter((text) => text.age < text.life);
}

function updateDrops(dt) {
  const collectors = [player, ...state.workers.filter((worker) => worker.hp > 0)];
  const magnetRange = dropMagnetRange();
  for (const drop of state.drops) {
    if (drop.collected) continue;
    drop.age += dt;
    drop.pickupDelay -= dt;
    drop.x += drop.vx * dt;
    drop.y += drop.vy * dt;
    drop.vx *= 0.84;
    drop.vy *= 0.84;

    if (drop.pickupDelay > 0) continue;
    let collector = null;
    let bestDistance = Infinity;
    for (const item of collectors) {
      const d = Math.hypot(item.x - drop.x, item.y - drop.y);
      if (d < bestDistance && d < (item.radius || 18) + magnetRange) {
        collector = item;
        bestDistance = d;
      }
    }
    if (!collector) continue;
    const dx = collector.x - drop.x;
    const dy = collector.y - drop.y;
    const len = Math.hypot(dx, dy) || 1;
    const pull = 220 + skillLevel("magnet") * 48;
    drop.vx += (dx / len) * pull * dt;
    drop.vy += (dy / len) * pull * dt;
    if (bestDistance < (collector.radius || 18) + drop.radius + 10) {
      collectDrop(drop);
      drop.collected = true;
    }
  }
  state.drops = state.drops.filter((drop) => !drop.collected);
}

function updateFlyItems(dt) {
  for (const item of state.flyItems) {
    item.age += dt;
    if (item.age < item.life) continue;
    player[item.type] += item.amount;
    item.done = true;
  }
  state.flyItems = state.flyItems.filter((item) => !item.done);
}

function placeBuild(def) {
  if (!isUnlocked("builds", def.id)) {
    showToast(`${def.label}はまだ解放されていません`);
    return;
  }
  if (!pay(def.cost)) {
    showToast(`${def.label}には ${costText(def.cost)} が必要です`);
    return;
  }

  const x = player.x;
  const y = player.y;

  if (def.type === "trap") {
    state.traps.push({
      id: def.id,
      label: def.label,
      x,
      y,
      radius: def.radius,
      life: def.life,
      maxLife: def.life,
      durability: def.durability,
      maxDurability: def.durability,
      cooldown: 0,
      triggered: false,
    });
    showToast(`${def.label}を設置しました`);
  }

  if (def.type === "building") {
    state.buildings.push({
      uid: state.nextBuildingUid++,
      id: def.id,
      label: def.label,
      x,
      y,
      radius: def.id === "wall" ? 31 : def.id === "base" ? 34 : 27,
      hp: def.hp,
      maxHp: def.hp,
      healRadius: def.id === "base" ? def.healRadius || 440 : null,
      healRate: def.id === "base" ? def.healRate || 0.012 : null,
      attackTimer: 0,
    });
    showToast(`${def.label}を建てました`);
  }
}

function hirePerson(def) {
  if (!isUnlocked("hires", def.id)) {
    showToast(`${def.label}はまだ解放されていません`);
    return;
  }
  if (!pay(def.cost)) {
    showToast(`${def.label}には ${costText(def.cost)} が必要です`);
    return;
  }

  const homeOffset = formationOffset(state.defenders.length + state.workers.length);
  const allyBase = {
    id: def.id,
    label: def.label,
    role: def.role,
    kind: def.kind || "defender",
    x: player.x + homeOffset.x,
    y: player.y + homeOffset.y,
    radius: def.kind === "dog" ? 15 : def.kind === "worker" ? 16 : 17,
    hp: def.hp,
    maxHp: def.hp,
    baseMaxHp: def.hp,
    baseSpeed: def.speed || 156,
    level: 1,
    xp: 0,
    xpNext: 54,
    moveDir: "down",
    moving: false,
    homeOffset,
  };

  if (def.kind === "worker" || def.kind === "dog" || def.kind === "repairer" || def.kind === "healer") {
    const worker = {
      ...allyBase,
      id: def.id,
      label: def.label,
      role: def.role,
      kind: def.kind,
      targets: def.targets || [],
      searchRadius: def.searchRadius,
      leash: def.leash,
      harvestTarget: null,
      harvestPulse: 0,
      repairTarget: null,
      repairJob: null,
      repairPulse: 0,
      healTarget: null,
      healPulse: 0,
      fetchTarget: null,
      carryDrop: null,
      healRange: def.healRange || 0,
    };
    syncAllyStats(worker, true);
    state.workers.push(worker);
    showToast(`${def.label}を雇いました`);
    return;
  }

  const defender = {
    ...allyBase,
    attackType: def.attackType,
    baseDamage: def.damage,
    damage: def.damage,
    range: def.range,
    rate: def.rate,
    knockback: def.knockback,
    projectileSpeed: def.projectileSpeed || 0,
    splash: def.splash || 0,
    attackTimer: 0,
    attackFx: null,
    weaponId: def.weaponId || (def.attackType === "melee" ? "ironSword" : null),
  };
  syncAllyStats(defender, true);
  state.defenders.push(defender);
  showToast(`${def.label}を雇いました`);
}

function upgradeTool(kind) {
  const key = kind === "axe" ? "axeLevel" : "pickaxeLevel";
  const label = kind === "axe" ? "斧" : "つるはし";
  const level = player[key];
  const cost = kind === "axe"
    ? { wood: 18 + level * 14, stone: 6 + level * 6, iron: level * 4, gold: level * 3 }
    : { wood: 8 + level * 8, stone: 18 + level * 14, iron: level * 5, gold: level * 4 };
  if (!pay(cost)) {
    showToast(`${label}強化には ${costText(cost)} が必要です`);
    return;
  }
  player[key] += 1;
  showToast(`${label}が LV${player[key]} になりました`);
}

function enchantWeapon(key) {
  const weapon = equippedWeapon();
  const def = enchantDefs.find((item) => item.key === key);
  if (!def || !isUnlocked("enchants", key)) {
    showToast("このエンチャントはまだ解放されていません");
    return;
  }
  if (!enchantAppliesToWeapon(def, weapon)) {
    showToast(`${weapon.name}には${def.label}を追加できません`);
    return;
  }
  const current = enchantLevel(weapon, key);
  const cost = scaledCost(def.cost, current);
  if (!pay(cost)) {
    showToast(`${def.label}強化には ${costText(cost)} が必要です`);
    return;
  }
  weapon.enchants[key] = current + 1;
  showToast(`${weapon.name}の${def.label}が +${weapon.enchants[key]} になりました`);
  renderStaticUi();
}

function renderEquippedWeaponHud() {
  if (!ui.equippedWeaponHud) return;
  const weapon = equippedWeapon();
  ui.equippedWeaponIcon.src = `assets/sprites/icons/${weapon.id}.png`;
  ui.equippedWeaponName.textContent = weapon.name;
  ui.equippedWeaponMeta.textContent = `${weapon.type} / 攻${weaponDamage(weapon)} 速${weaponRate(weapon).toFixed(1)} 射程${weaponRange(weapon)}`;
}

function renderStaticUi() {
  updateRadialMenuAvailability();
  renderEquippedWeaponHud();
  ui.weaponList.innerHTML = "";
  const visibleWeapons = unlockedWeapons();
  visibleWeapons.forEach((weapon, displayIndex) => {
    const index = weapons.findIndex((item) => item.id === weapon.id);
    const item = document.createElement("div");
    item.className = `weapon${index === equippedIndex ? " active" : ""}`;
    item.tabIndex = 0;
    item.innerHTML = `
      <img src="assets/sprites/icons/${weapon.id}.png" alt="">
      <kbd>${displayIndex + 1}</kbd>
      <span>
        <strong>${weapon.name}</strong>
        <small>${weapon.type} / 攻${weaponDamage(weapon)} 速${weaponRate(weapon).toFixed(1)} 射程${weaponRange(weapon)}</small>
      </span>
      <b>+${Object.values(weapon.enchants).reduce((a, b) => a + b, 0)}</b>
    `;
    item.addEventListener("click", () => {
      equippedIndex = index;
      player.attackTimer = 0;
      showToast(`${weapon.name}を装備しました`);
      renderStaticUi();
      closeWorldMenu();
    });
    item.addEventListener("keydown", (event) => {
      if (event.key === "Enter" || event.key === " ") item.click();
    });
    ui.weaponList.appendChild(item);
  });

  ui.enchantButtons.innerHTML = "";
  const enchantWeaponTarget = equippedWeapon();
  const visibleEnchants = unlockedEnchants().filter((def) => enchantAppliesToWeapon(def, enchantWeaponTarget));
  if (ui.enchantDescription) {
    ui.enchantDescription.hidden = visibleEnchants.length === 0;
    ui.enchantDescription.textContent = visibleEnchants.length > 0
      ? `エンチャント：${enchantWeaponTarget.name}に以下の効果を追加します`
      : `${enchantWeaponTarget.name}に追加できるエンチャントはまだありません`;
  }
  if (visibleEnchants.length === 0) {
    ui.enchantButtons.innerHTML = `<div class="empty-panel">この武器に追加できるエンチャントはありません</div>`;
  }
  visibleEnchants.forEach((def) => {
    const weapon = enchantWeaponTarget;
    const current = enchantLevel(weapon, def.key);
    const cost = scaledCost(def.cost, current);
    const button = document.createElement("button");
    button.type = "button";
    button.className = "action-button";
    button.innerHTML = actionButtonMarkup({
      icon: def.icon,
      label: `${def.label} +${current}`,
      detail: `${weapon.name}へ追加 / LV ${current} > ${current + 1}`,
      cost,
    });
    setActionButtonAffordability(button, cost);
    button.addEventListener("click", () => {
      enchantWeapon(def.key);
      closeWorldMenu();
    });
    ui.enchantButtons.appendChild(button);
  });

  ui.buildButtons.innerHTML = "";
  const visibleBuilds = unlockedBuilds();
  if (visibleBuilds.length === 0) {
    ui.buildButtons.innerHTML = `<div class="empty-panel">レベルアップ報酬で設置を解放できます</div>`;
  }
  visibleBuilds.forEach((def) => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "action-button";
    button.innerHTML = actionButtonMarkup({
      icon: def.icon,
      label: def.label,
      detail: def.type === "trap"
        ? `耐久 ${def.durability} / ${def.life}秒`
        : def.id === "base"
          ? `HP ${def.hp} / 回復範囲 ${def.healRadius}px`
          : `HP ${def.hp}`,
      cost: def.cost,
    });
    setActionButtonAffordability(button, def.cost);
    button.addEventListener("click", () => {
      placeBuild(def);
      closeWorldMenu();
    });
    ui.buildButtons.appendChild(button);
  });

  ui.hireButtons.innerHTML = "";
  const visibleHires = unlockedHires();
  if (visibleHires.length === 0) {
    ui.hireButtons.innerHTML = `<div class="empty-panel">レベルアップ報酬で雇用を解放できます</div>`;
  }
  visibleHires.forEach((def) => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "action-button";
    let detail = `${def.attackType === "melee" ? "近接" : def.attackType === "ranged" ? "遠距離" : "魔法"} / HP ${def.hp} / 攻${def.damage}`;
    if (def.kind === "worker") detail = `${def.targets.map((key) => resourceLabels[key]).join("、")}を採取 / HP ${def.hp}`;
    if (def.kind === "dog") detail = `ドロップ回収 / HP ${def.hp} / 速${def.speed}`;
    if (def.kind === "repairer") detail = `建築修理 / HP ${def.hp} / 10秒`;
    if (def.kind === "healer") detail = `味方回復 / HP ${def.hp} / 肉10秒で1`;
    button.innerHTML = actionButtonMarkup({
      icon: def.icon,
      label: def.label,
      detail,
      cost: def.cost,
    });
    setActionButtonAffordability(button, def.cost);
    button.addEventListener("click", () => {
      hirePerson(def);
      closeWorldMenu();
    });
    ui.hireButtons.appendChild(button);
  });

  renderSkillPanel();
}

function updateUi() {
  ui.hpText.textContent = `${Math.ceil(player.hp)} / ${player.maxHp}`;
  ui.hpBar.style.transform = `scaleX(${clamp(player.hp / player.maxHp, 0, 1)})`;
  ui.levelText.textContent = `${player.level} (${Math.floor(player.xp)} / ${player.xpNext})`;
  ui.xpBar.style.transform = `scaleX(${clamp(player.xp / player.xpNext, 0, 1)})`;
  if (ui.waveText) {
    const waveDef = currentWaveDef();
    const remaining = Math.max(0, Math.ceil(waveDef.timeout - state.wave.elapsed));
    const eventLabel = waveDef.event ? ` ${waveDef.event.label}` : "";
    ui.waveText.textContent = `WAVE ${state.wave.index}${eventLabel}  ${state.wave.spawned}/${waveDef.total}  出現中 ${state.enemies.length}/${waveDef.maxActive}  残り ${remaining}s`;
  }
  ui.woodText.textContent = Math.floor(player.wood);
  ui.stoneText.textContent = Math.floor(player.stone);
  ui.goldText.textContent = Math.floor(player.gold);
  ui.ironText.textContent = Math.floor(player.iron);
  ui.meatText.textContent = Math.floor(player.meat);
  if (ui.starstoneText) ui.starstoneText.textContent = Math.floor(player.starstone);
  renderEquippedWeaponHud();
  updateRerollUi();
  if (ui.upgradeAxe) ui.upgradeAxe.textContent = `斧 LV${player.axeLevel} 強化`;
  if (ui.upgradePickaxe) ui.upgradePickaxe.textContent = `つるはし LV${player.pickaxeLevel} 強化`;

  if (!ui.toast.hidden && state.time > state.toastUntil) {
    ui.toast.hidden = true;
  }
  if (ui.eventAlert && !ui.eventAlert.hidden && state.time > state.eventAlertUntil) {
    ui.eventAlert.hidden = true;
  }
}

function drawGround() {
  if (!terrainReady) {
    const gradient = ctx.createLinearGradient(0, 0, state.width, state.height);
    gradient.addColorStop(0, "#20372e");
    gradient.addColorStop(0.52, "#283327");
    gradient.addColorStop(1, "#24313b");
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, state.width, state.height);
    return;
  }

  const startTx = Math.floor((state.camera.x - state.width / 2) / TERRAIN_TILE_SIZE) - 1;
  const endTx = Math.floor((state.camera.x + state.width / 2) / TERRAIN_TILE_SIZE) + 1;
  const startTy = Math.floor((state.camera.y - state.height / 2) / TERRAIN_TILE_SIZE) - 1;
  const endTy = Math.floor((state.camera.y + state.height / 2) / TERRAIN_TILE_SIZE) + 1;

  ctx.imageSmoothingEnabled = false;
  for (let ty = startTy; ty <= endTy; ty += 1) {
    for (let tx = startTx; tx <= endTx; tx += 1) {
      const terrain = terrainAtTile(tx, ty);
      const sx = tx * TERRAIN_TILE_SIZE - state.camera.x + state.width / 2;
      const sy = ty * TERRAIN_TILE_SIZE - state.camera.y + state.height / 2;
      if (terrain.rotation) {
        ctx.save();
        ctx.translate(Math.floor(sx) + TERRAIN_TILE_SIZE / 2, Math.floor(sy) + TERRAIN_TILE_SIZE / 2);
        ctx.rotate(terrain.rotation);
        ctx.drawImage(
          terrainSheet,
          terrain.frame.x,
          terrain.frame.y,
          TERRAIN_ATLAS_TILE,
          TERRAIN_ATLAS_TILE,
          -TERRAIN_TILE_SIZE / 2,
          -TERRAIN_TILE_SIZE / 2,
          TERRAIN_TILE_SIZE + 1,
          TERRAIN_TILE_SIZE + 1,
        );
        ctx.restore();
      } else {
        ctx.drawImage(
          terrainSheet,
          terrain.frame.x,
          terrain.frame.y,
          TERRAIN_ATLAS_TILE,
          TERRAIN_ATLAS_TILE,
          Math.floor(sx),
          Math.floor(sy),
          TERRAIN_TILE_SIZE + 1,
          TERRAIN_TILE_SIZE + 1,
        );
      }
    }
  }
}

function drawBaseAreas() {
  for (const base of baseBuildings()) {
    const p = worldToScreen(base);
    const radius = baseRadius(base);
    const pulse = 1 + Math.sin(state.time * 3.2) * 0.015;
    ctx.save();
    ctx.strokeStyle = "rgba(125,211,255,0.42)";
    ctx.fillStyle = "rgba(125,211,255,0.055)";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(p.x, p.y, radius * pulse, 0, TAU);
    ctx.fill();
    ctx.stroke();
    ctx.setLineDash([8, 9]);
    ctx.strokeStyle = "rgba(246,240,219,0.18)";
    ctx.beginPath();
    ctx.arc(p.x, p.y, radius * 0.66, 0, TAU);
    ctx.stroke();
    ctx.restore();
  }
}

function drawResource(resource) {
  const p = worldToScreen(resource);
  const def = resourceDefs[resource.type];
  const customSprite = customSprites.resources[resource.type];
  if (customSprite && customSpritesReady) {
    const groundY = p.y + 25;
    drawSpriteShadow(p.x, groundY - 3, customSprite.width * 0.72, 12, 0.22);
    drawCustomSpriteFrame(customSprite.frame, p.x, groundY, customSprite.width, customSprite.height);
    if (player.harvestTarget === resource) {
      ctx.strokeStyle = "rgba(255,255,255,0.86)";
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(p.x, p.y, resource.radius + 9, -Math.PI / 2, -Math.PI / 2 + TAU * (1 - resource.hp / resource.maxHp));
      ctx.stroke();
    }
    return;
  }
  const sprite = sprites.resources[resource.type];
  if (sprite && spritesReady) {
    const groundY = p.y + (resource.type === "wood" ? 42 : 25);
    drawSpriteShadow(p.x, groundY - 3, sprite.width * 0.72, 12, 0.22);
    drawSpriteFrame(sprite.frame, p.x, groundY, sprite.width, sprite.height);
    if (player.harvestTarget === resource) {
      ctx.strokeStyle = "rgba(255,255,255,0.86)";
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(p.x, p.y, resource.radius + 9, -Math.PI / 2, -Math.PI / 2 + TAU * (1 - resource.hp / resource.maxHp));
      ctx.stroke();
    }
    return;
  }
  ctx.save();
  ctx.translate(p.x, p.y);

  if (resource.type === "wood") {
    ctx.fillStyle = "#6d4327";
    ctx.fillRect(-5, 3, 10, 24);
    ctx.fillStyle = def.shadow;
    ctx.beginPath();
    ctx.arc(-8, -4, 18, 0, TAU);
    ctx.arc(8, -8, 20, 0, TAU);
    ctx.arc(0, -24, 17, 0, TAU);
    ctx.fill();
    ctx.fillStyle = def.color;
    ctx.beginPath();
    ctx.arc(-10, -8, 14, 0, TAU);
    ctx.arc(9, -12, 16, 0, TAU);
    ctx.arc(0, -25, 13, 0, TAU);
    ctx.fill();
  } else {
    ctx.fillStyle = def.shadow;
    ctx.beginPath();
    ctx.ellipse(0, 6, resource.radius + 4, resource.radius * 0.72, 0, 0, TAU);
    ctx.fill();
    ctx.fillStyle = def.color;
    ctx.beginPath();
    ctx.moveTo(-resource.radius, 10);
    ctx.lineTo(-resource.radius * 0.5, -resource.radius * 0.65);
    ctx.lineTo(resource.radius * 0.4, -resource.radius * 0.9);
    ctx.lineTo(resource.radius, 3);
    ctx.lineTo(resource.radius * 0.35, resource.radius * 0.65);
    ctx.closePath();
    ctx.fill();
    if (resource.type === "gold") {
      ctx.fillStyle = "#fff0a3";
      ctx.fillRect(-3, -11, 8, 5);
    }
  }

  if (player.harvestTarget === resource) {
    ctx.strokeStyle = "rgba(255,255,255,0.86)";
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(0, 0, resource.radius + 9, -Math.PI / 2, -Math.PI / 2 + TAU * (1 - resource.hp / resource.maxHp));
    ctx.stroke();
  }
  ctx.restore();
}

function drawPlayer() {
  const p = worldToScreen(player);
  const frame = spriteFrame(sprites.player, player.moveDir, player.moving);
  const hiddenAlpha = player.hiddenTime > 0 ? 0.44 + Math.sin(state.time * 9) * 0.08 : 1;
  if (spritesReady) {
    drawSpriteShadow(p.x, p.y + 20, 34, 12, player.hiddenTime > 0 ? 0.08 : 0.24);
    drawSpriteFrame(frame.frame, p.x, p.y + 26, frame.width, frame.height, { flip: frame.flip, alpha: hiddenAlpha });
  } else {
    ctx.save();
    ctx.globalAlpha = hiddenAlpha;
    ctx.translate(p.x, p.y);
    ctx.rotate(Math.atan2(player.facing.y, player.facing.x));

    ctx.fillStyle = "rgba(0,0,0,0.24)";
    ctx.beginPath();
    ctx.ellipse(0, 17, 19, 8, 0, 0, TAU);
    ctx.fill();

    ctx.fillStyle = "#2f81dd";
    ctx.beginPath();
    ctx.arc(0, 0, player.radius, 0, TAU);
    ctx.fill();

    ctx.fillStyle = "#f6f0db";
    ctx.beginPath();
    ctx.arc(8, -6, 5, 0, TAU);
    ctx.fill();

    ctx.strokeStyle = "#f1b84b";
    ctx.lineWidth = 4;
    ctx.lineCap = "round";
    ctx.beginPath();
    ctx.moveTo(10, 2);
    ctx.lineTo(28, 2);
    ctx.stroke();

    ctx.restore();
  }

  const weapon = equippedWeapon();
  const target = findNearestEnemy(weaponRange(weapon));
  if (target) {
    const t = worldToScreen(target);
    ctx.strokeStyle = "rgba(241,184,75,0.28)";
    ctx.lineWidth = 2;
    ctx.setLineDash([4, 6]);
    ctx.beginPath();
    ctx.moveTo(p.x, p.y);
    ctx.lineTo(t.x, t.y);
    ctx.stroke();
    ctx.setLineDash([]);
  }
}

function drawEnemy(enemy) {
  const p = worldToScreen(enemy);
  const def = enemyDefById(enemy.type);
  const bossSprite = bossSprites.enemies[enemy.type];
  if (bossSprite && bossSpritesReady) {
    const frame = spriteFrame(bossSprite, enemy.moveDir, enemy.moving || enemy.chargeState === "charge", 7);
    const groundOffset = enemy.type === "stormBirdBoss" ? 18 : 24;
    drawSpriteShadow(p.x, p.y + 18, bossSprite.width * 0.68, 12, 0.26);
    drawBossSpriteFrame(frame.frame, p.x, p.y + groundOffset, frame.width, frame.height, { flip: frame.flip });
    if (enemy.hurtFlash > 0) {
      ctx.fillStyle = "rgba(255,255,190,0.3)";
      ctx.beginPath();
      ctx.arc(p.x, p.y + 2, enemy.radius + 8, 0, TAU);
      ctx.fill();
    }
    if (enemy.rooted > 0 || enemy.slow > 0 || enemy.poison > 0) {
      ctx.strokeStyle = enemy.poison > 0 ? "#a8e05f" : "#d8e6d3";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(p.x, p.y + 3, enemy.radius + 8, 0, TAU);
      ctx.stroke();
    }
    const barWidth = enemy.boss ? Math.max(62, enemy.radius * 2.2) : 42;
    const barY = p.y - bossSprite.height + groundOffset - 10;
    ctx.fillStyle = "rgba(0,0,0,0.55)";
    ctx.fillRect(p.x - barWidth / 2, barY, barWidth, 5);
    ctx.fillStyle = enemy.boss ? "#e7564f" : "#65c47b";
    ctx.fillRect(p.x - barWidth / 2, barY, barWidth * clamp(enemy.hp / enemy.maxHp, 0, 1), 5);
    return;
  }
  const customSprite = customSprites.enemies[enemy.type];
  if (customSprite && customSpritesReady) {
    const frame = spriteFrame(customSprite, enemy.moveDir, enemy.moving || enemy.chargeState === "charge", enemy.type.includes("Slime") ? 5 : 7);
    drawSpriteShadow(p.x, p.y + 17, customSprite.width * 0.62, 10, 0.23);
    drawCustomSpriteFrame(frame.frame, p.x, p.y + 24, frame.width, frame.height, { flip: frame.flip });
    if (enemy.hurtFlash > 0) {
      ctx.fillStyle = "rgba(255,255,190,0.28)";
      ctx.beginPath();
      ctx.arc(p.x, p.y + 2, enemy.radius + 6, 0, TAU);
      ctx.fill();
    }
    if (enemy.rooted > 0 || enemy.slow > 0 || enemy.poison > 0) {
      ctx.strokeStyle = enemy.poison > 0 ? "#a8e05f" : "#d8e6d3";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(p.x, p.y + 3, enemy.radius + 8, 0, TAU);
      ctx.stroke();
    }
    if (enemy.confused > 0) {
      ctx.strokeStyle = "#f0a6ff";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(p.x, p.y - 9, enemy.radius + 6 + Math.sin(state.time * 7) * 2, 0, TAU);
      ctx.stroke();
    }
    const barWidth = enemy.boss ? Math.max(62, enemy.radius * 2.2) : 38;
    const barY = enemy.boss ? p.y - customSprite.height + 14 : p.y - 31;
    ctx.fillStyle = "rgba(0,0,0,0.48)";
    ctx.fillRect(p.x - barWidth / 2, barY, barWidth, enemy.boss ? 5 : 4);
    ctx.fillStyle = enemy.boss ? "#e7564f" : "#65c47b";
    ctx.fillRect(p.x - barWidth / 2, barY, barWidth * clamp(enemy.hp / enemy.maxHp, 0, 1), enemy.boss ? 5 : 4);
    return;
  }
  if (spritesReady && enemy.type === "redSlime") {
    const frame = spriteFrame(sprites.enemy, enemy.moveDir, enemy.moving, 5);
    drawSpriteShadow(p.x, p.y + 18, 34, 10, 0.23);
    drawSpriteFrame(frame.frame, p.x, p.y + 24, frame.width, frame.height, { flip: frame.flip });
    if (enemy.hurtFlash > 0) {
      ctx.fillStyle = "rgba(255,255,190,0.32)";
      ctx.beginPath();
      ctx.arc(p.x, p.y + 3, enemy.radius + 5, 0, TAU);
      ctx.fill();
    }
    if (enemy.rooted > 0 || enemy.slow > 0 || enemy.poison > 0) {
      ctx.strokeStyle = enemy.poison > 0 ? "#a8e05f" : "#d8e6d3";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(p.x, p.y + 4, enemy.radius + 8, 0, TAU);
      ctx.stroke();
    }
    if (enemy.confused > 0) {
      ctx.strokeStyle = "#f0a6ff";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(p.x, p.y - 9, enemy.radius + 6 + Math.sin(state.time * 7) * 2, 0, TAU);
      ctx.stroke();
    }
    ctx.fillStyle = "rgba(0,0,0,0.48)";
    ctx.fillRect(p.x - 19, p.y - 30, 38, 4);
    ctx.fillStyle = "#65c47b";
    ctx.fillRect(p.x - 19, p.y - 30, 38 * clamp(enemy.hp / enemy.maxHp, 0, 1), 4);
    return;
  }
  ctx.save();
  ctx.translate(p.x, p.y);
  ctx.fillStyle = "rgba(0,0,0,0.23)";
  ctx.beginPath();
  ctx.ellipse(0, 15, enemy.radius + 2, 7, 0, 0, TAU);
  ctx.fill();

  if (enemy.type === "boar") {
    ctx.fillStyle = enemy.hurtFlash > 0 ? def.accent : def.color;
    ctx.beginPath();
    ctx.ellipse(0, 1, enemy.radius + 5, enemy.radius * 0.7, 0, 0, TAU);
    ctx.fill();
    ctx.fillStyle = "#3b2a22";
    ctx.beginPath();
    ctx.arc(8, -4, 3, 0, TAU);
    ctx.fill();
    ctx.strokeStyle = def.accent;
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(16, 2);
    ctx.lineTo(26, -2);
    ctx.moveTo(16, 7);
    ctx.lineTo(26, 10);
    ctx.stroke();
    if (enemy.chargeState === "windup") {
      ctx.strokeStyle = "rgba(214,123,66,0.75)";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(0, 1, enemy.radius + 8, -Math.PI / 2, -Math.PI / 2 + TAU * clamp(1 - enemy.stateTimer / 5, 0, 1));
      ctx.stroke();
    }
  } else if (enemy.type === "goblin" || enemy.type === "goblinArcher") {
    ctx.fillStyle = enemy.hurtFlash > 0 ? def.accent : def.color;
    ctx.beginPath();
    ctx.arc(0, -4, enemy.radius, 0, TAU);
    ctx.fill();
    ctx.fillStyle = "#2d241c";
    ctx.beginPath();
    ctx.arc(-5, -8, 2.5, 0, TAU);
    ctx.arc(5, -8, 2.5, 0, TAU);
    ctx.fill();
    ctx.strokeStyle = enemy.type === "goblinArcher" ? "#d7b45e" : "#f6f0db";
    ctx.lineWidth = 3;
    ctx.lineCap = "round";
    ctx.beginPath();
    if (enemy.type === "goblinArcher") {
      ctx.arc(15, -3, 10, -Math.PI / 2, Math.PI / 2);
      ctx.moveTo(15, -13);
      ctx.lineTo(15, 7);
    } else {
      ctx.moveTo(8, 2);
      ctx.lineTo(20, -4);
    }
    ctx.stroke();
  } else {
    ctx.fillStyle = enemy.hurtFlash > 0 ? def.accent : def.color;
    ctx.beginPath();
    ctx.arc(0, 0, enemy.radius, 0, TAU);
    ctx.fill();
    ctx.fillStyle = "#1d2530";
    ctx.beginPath();
    ctx.arc(-6, -4, 3, 0, TAU);
    ctx.arc(6, -4, 3, 0, TAU);
    ctx.fill();
  }

  if (enemy.rooted > 0 || enemy.slow > 0 || enemy.poison > 0) {
    ctx.strokeStyle = enemy.poison > 0 ? "#a8e05f" : "#d8e6d3";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(0, 0, enemy.radius + 5, 0, TAU);
    ctx.stroke();
  }

  if (enemy.confused > 0) {
    ctx.strokeStyle = "#f0a6ff";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(0, -9, enemy.radius + 5 + Math.sin(state.time * 7) * 2, 0, TAU);
    ctx.stroke();
  }

  ctx.fillStyle = "rgba(0,0,0,0.48)";
  ctx.fillRect(-19, -30, 38, 4);
  ctx.fillStyle = "#65c47b";
  ctx.fillRect(-19, -30, 38 * clamp(enemy.hp / enemy.maxHp, 0, 1), 4);
  ctx.restore();
}

function drawTrap(trap) {
  const p = worldToScreen(trap);
  const sprite = sprites.traps[trap.id];
  const lifeRatio = trap.triggered ? clamp(trap.life / trap.maxLife, 0.35, 1) : 1;
  if (sprite && spritesReady) {
    const alpha = lifeRatio;
    drawSpriteShadow(p.x, p.y + 18, sprite.width * 0.68, 10, 0.2);
    drawSpriteFrame(sprite.frame, p.x, p.y + 28, sprite.width, sprite.height, { alpha });
    const colors = {
      bomb: "#ffb24d",
      pit: "#a78b69",
      net: "#d8e6d3",
      spikes: "#a8e05f",
    };
    ctx.strokeStyle = colors[trap.id];
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(p.x, p.y, trap.radius - 5, 0, TAU * (trap.durability / trap.maxDurability));
    ctx.stroke();
    if (trap.triggered) {
      ctx.strokeStyle = "rgba(246,240,219,0.62)";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(p.x, p.y, trap.radius - 12, -Math.PI / 2, -Math.PI / 2 + TAU * clamp(trap.life / trap.maxLife, 0, 1));
      ctx.stroke();
    }
    return;
  }
  ctx.save();
  ctx.translate(p.x, p.y);
  ctx.globalAlpha = lifeRatio;
  const colors = {
    bomb: ["#3a2b29", "#ffb24d"],
    pit: ["#2a1d17", "#a78b69"],
    net: ["#22313a", "#d8e6d3"],
    spikes: ["#213226", "#a8e05f"],
  }[trap.id];
  ctx.fillStyle = colors[0];
  ctx.beginPath();
  ctx.arc(0, 0, trap.radius, 0, TAU);
  ctx.fill();
  ctx.strokeStyle = colors[1];
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.arc(0, 0, trap.radius - 5, 0, TAU * (trap.durability / trap.maxDurability));
  ctx.stroke();
  if (trap.triggered) {
    ctx.strokeStyle = "rgba(246,240,219,0.62)";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(0, 0, trap.radius - 12, -Math.PI / 2, -Math.PI / 2 + TAU * clamp(trap.life / trap.maxLife, 0, 1));
    ctx.stroke();
  }
  if (trap.id === "bomb") {
    ctx.fillStyle = colors[1];
    ctx.fillRect(-6, -22, 12, 12);
  }
  if (trap.id === "net") {
    ctx.strokeStyle = colors[1];
    ctx.lineWidth = 1.5;
    for (let i = -18; i <= 18; i += 12) {
      ctx.beginPath();
      ctx.moveTo(i, -20);
      ctx.lineTo(i, 20);
      ctx.moveTo(-20, i);
      ctx.lineTo(20, i);
      ctx.stroke();
    }
  }
  if (trap.id === "spikes") {
    ctx.fillStyle = colors[1];
    for (let i = 0; i < 8; i += 1) {
      const a = (i / 8) * TAU;
      ctx.beginPath();
      ctx.moveTo(Math.cos(a) * 8, Math.sin(a) * 8);
      ctx.lineTo(Math.cos(a - 0.12) * 24, Math.sin(a - 0.12) * 24);
      ctx.lineTo(Math.cos(a + 0.12) * 24, Math.sin(a + 0.12) * 24);
      ctx.closePath();
      ctx.fill();
    }
  }
  ctx.restore();
}

function drawBuilding(building) {
  const p = worldToScreen(building);
  const sprite = sprites.buildings[building.id];
  if (sprite && spritesReady) {
    const groundY = p.y + (building.id === "tower" ? 56 : 42);
    drawSpriteShadow(p.x, groundY - 5, sprite.width * 0.72, 14, 0.25);
    drawSpriteFrame(sprite.frame, p.x, groundY, sprite.width, sprite.height);
    ctx.fillStyle = "rgba(0,0,0,0.48)";
    ctx.fillRect(p.x - 30, p.y - 34, 60, 5);
    ctx.fillStyle = "#65c47b";
    ctx.fillRect(p.x - 30, p.y - 34, 60 * clamp(building.hp / building.maxHp, 0, 1), 5);
    return;
  }
  ctx.save();
  ctx.translate(p.x, p.y);
  ctx.fillStyle = "rgba(0,0,0,0.25)";
  ctx.beginPath();
  ctx.ellipse(0, 24, 30, 10, 0, 0, TAU);
  ctx.fill();

  if (building.id === "wall") {
    ctx.fillStyle = "#8f795e";
    ctx.fillRect(-34, -20, 68, 42);
    ctx.fillStyle = "#b29a74";
    for (let i = -28; i <= 22; i += 17) ctx.fillRect(i, -16, 11, 34);
  } else if (building.id === "base") {
    ctx.fillStyle = "#4a3428";
    ctx.fillRect(-30, -10, 60, 42);
    ctx.fillStyle = "#9b6f48";
    ctx.fillRect(-22, -24, 44, 42);
    ctx.fillStyle = "#d69b48";
    ctx.beginPath();
    ctx.moveTo(-34, -22);
    ctx.lineTo(0, -54);
    ctx.lineTo(34, -22);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = "#20323a";
    ctx.fillRect(-9, 2, 18, 30);
    ctx.fillStyle = "#7dd3ff";
    ctx.globalAlpha = 0.72 + Math.sin(state.time * 4) * 0.18;
    ctx.beginPath();
    ctx.arc(0, -24, 8, 0, TAU);
    ctx.fill();
    ctx.globalAlpha = 1;
  } else {
    ctx.fillStyle = "#765234";
    ctx.fillRect(-15, -8, 30, 48);
    ctx.fillStyle = "#c19a5b";
    ctx.beginPath();
    ctx.moveTo(-33, -8);
    ctx.lineTo(0, -43);
    ctx.lineTo(33, -8);
    ctx.closePath();
    ctx.fill();
  }

  ctx.fillStyle = "rgba(0,0,0,0.48)";
  ctx.fillRect(-30, -34, 60, 5);
  ctx.fillStyle = "#65c47b";
  ctx.fillRect(-30, -34, 60 * clamp(building.hp / building.maxHp, 0, 1), 5);
  ctx.restore();
}

function drawAllyStatus(ally, x, y, width = 40) {
  const level = ally.level || 1;
  const hpRatio = clamp(ally.hp / ally.maxHp, 0, 1);
  const xpRatio = clamp((ally.xp || 0) / (ally.xpNext || 1), 0, 1);
  const barY = y + 31;
  const labelY = y + 45;
  ctx.save();
  ctx.font = "700 10px 'Segoe UI', sans-serif";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.lineWidth = 3;
  ctx.strokeStyle = "rgba(23,20,20,0.72)";
  ctx.strokeText(`LV${level}`, x, labelY);
  ctx.fillStyle = "#f6f0db";
  ctx.fillText(`LV${level}`, x, labelY);
  ctx.fillStyle = "rgba(0,0,0,0.52)";
  ctx.fillRect(x - width / 2, barY, width, 4);
  ctx.fillStyle = "#65c47b";
  ctx.fillRect(x - width / 2, barY, width * hpRatio, 4);
  ctx.fillStyle = "rgba(0,0,0,0.44)";
  ctx.fillRect(x - width / 2, barY + 6, width, 3);
  ctx.fillStyle = "#7dd3ff";
  ctx.fillRect(x - width / 2, barY + 6, width * xpRatio, 3);
  if (assignedBase(ally)) {
    ctx.fillStyle = "#7dd3ff";
    ctx.fillRect(x + width / 2 + 4, barY - 1, 7, 7);
    ctx.fillStyle = "#20323a";
    ctx.fillRect(x + width / 2 + 6, barY + 1, 3, 5);
  }
  ctx.restore();
}

const allyRoleVisuals = {
  swordsman: { primary: "#d9a441", accent: "#f6f0db", tool: "sword" },
  archer: { primary: "#65b86f", accent: "#d7b45e", tool: "bow" },
  mage: { primary: "#4e8fd8", accent: "#b9e8ff", tool: "staff" },
  healer: { primary: "#f2e7d5", accent: "#f49ab2", tool: "cross" },
  lumberjack: { primary: "#78b957", accent: "#b77a43", tool: "axe" },
  miner: { primary: "#aeb7b7", accent: "#f2bf49", tool: "pickaxe" },
  repairer: { primary: "#7dd3ff", accent: "#f1b84b", tool: "hammer" },
};

function drawAllyRoleOverlay(ally, p) {
  const visual = allyRoleVisuals[ally.role];
  if (!visual) return;
  ctx.save();
  ctx.translate(p.x, p.y);
  ctx.fillStyle = "rgba(25, 20, 18, 0.72)";
  ctx.fillRect(-13, -20, 26, 23);
  ctx.fillStyle = visual.primary;
  ctx.fillRect(-11, -23, 22, 24);
  ctx.fillStyle = visual.accent;
  ctx.fillRect(-11, -23, 22, 5);
  ctx.fillStyle = "rgba(35, 26, 22, 0.72)";
  ctx.fillRect(-12, -3, 24, 4);
  ctx.lineCap = "round";
  ctx.lineJoin = "round";
  ctx.strokeStyle = visual.accent;
  ctx.lineWidth = 3;
  if (visual.tool === "sword") {
    ctx.beginPath();
    ctx.moveTo(13, -16);
    ctx.lineTo(25, -29);
    ctx.stroke();
  } else if (visual.tool === "bow") {
    ctx.beginPath();
    ctx.arc(18, -17, 10, -1.1, 1.1);
    ctx.stroke();
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(18, -27);
    ctx.lineTo(18, -7);
    ctx.stroke();
  } else if (visual.tool === "staff") {
    ctx.beginPath();
    ctx.moveTo(18, 2);
    ctx.lineTo(23, -30);
    ctx.stroke();
    ctx.fillStyle = visual.accent;
    ctx.beginPath();
    ctx.arc(24, -32, 4, 0, TAU);
    ctx.fill();
  } else if (visual.tool === "cross") {
    ctx.fillStyle = visual.accent;
    ctx.fillRect(-3, -18, 6, 17);
    ctx.fillRect(-8, -13, 16, 6);
  } else if (visual.tool === "axe") {
    ctx.beginPath();
    ctx.moveTo(18, 0);
    ctx.lineTo(24, -24);
    ctx.stroke();
    ctx.fillStyle = visual.accent;
    ctx.fillRect(18, -27, 11, 7);
  } else if (visual.tool === "pickaxe") {
    ctx.beginPath();
    ctx.moveTo(18, 0);
    ctx.lineTo(24, -24);
    ctx.stroke();
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(16, -25);
    ctx.lineTo(31, -21);
    ctx.stroke();
  } else if (visual.tool === "hammer") {
    ctx.beginPath();
    ctx.moveTo(17, 0);
    ctx.lineTo(23, -20);
    ctx.stroke();
    ctx.fillStyle = visual.accent;
    ctx.fillRect(18, -26, 14, 8);
  }
  ctx.restore();
}

function drawDefender(defender) {
  const p = worldToScreen(defender);
  const markerColor = {
    swordsman: "#f1b84b",
    archer: "#78b957",
    mage: "#7dd3ff",
  }[defender.role] || "#65c47b";
  if (spritesReady) {
    const frame = spriteFrame(sprites.guard, defender.moveDir, defender.moving, 7);
    drawSpriteShadow(p.x, p.y + 18, 32, 10, 0.22);
    drawSpriteFrame(frame.frame, p.x, p.y + 26, frame.width, frame.height, { flip: frame.flip });
    drawAllyRoleOverlay(defender, p);
    ctx.fillStyle = markerColor;
    ctx.beginPath();
    ctx.arc(p.x + 13, p.y - 36, 5, 0, TAU);
    ctx.fill();
    drawAllyStatus(defender, p.x, p.y, 40);
    return;
  }
  ctx.save();
  ctx.translate(p.x, p.y);
  ctx.fillStyle = "rgba(0,0,0,0.22)";
  ctx.beginPath();
  ctx.ellipse(0, 15, 15, 6, 0, 0, TAU);
  ctx.fill();
  ctx.fillStyle = "#65c47b";
  ctx.beginPath();
  ctx.arc(0, 0, defender.radius, 0, TAU);
  ctx.fill();
  ctx.restore();
  drawAllyRoleOverlay(defender, p);
  ctx.save();
  ctx.translate(p.x, p.y);
  ctx.fillStyle = markerColor;
  ctx.beginPath();
  ctx.arc(12, -19, 5, 0, TAU);
  ctx.fill();
  ctx.strokeStyle = "#f6f0db";
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(9, 2);
  ctx.lineTo(23, -4);
  ctx.stroke();
  ctx.restore();
  drawAllyStatus(defender, p.x, p.y, 40);
}

function drawWorker(worker) {
  const p = worldToScreen(worker);
  const healerSprite = worker.role === "healer" ? allySprites.healer : null;
  if (healerSprite && healerSpritesReady) {
    const frame = spriteFrame(healerSprite, worker.moveDir, worker.moving || worker.healPulse > 0, 7);
    drawSpriteShadow(p.x, p.y + 18, 30, 10, 0.2);
    drawHealerSpriteFrame(frame.frame, p.x, p.y + 26, frame.width, frame.height, { flip: frame.flip });
    if (worker.healTarget) {
      const target = worldToScreen(worker.healTarget);
      ctx.strokeStyle = "rgba(168,224,95,0.48)";
      ctx.lineWidth = 2;
      ctx.setLineDash([4, 5]);
      ctx.beginPath();
      ctx.moveTo(p.x, p.y - 12);
      ctx.lineTo(target.x, target.y - 18);
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.strokeStyle = "rgba(168,224,95,0.55)";
      ctx.beginPath();
      ctx.arc(target.x, target.y - 14, 14 + Math.sin(state.time * 8) * 3, 0, TAU);
      ctx.stroke();
    }
    drawAllyStatus(worker, p.x, p.y, 40);
    return;
  }
  if (spritesReady) {
    const frame = spriteFrame(sprites.guard, worker.moveDir, worker.moving, 7);
    drawSpriteShadow(p.x, p.y + 18, 30, 10, 0.2);
    drawSpriteFrame(frame.frame, p.x, p.y + 25, frame.width, frame.height, { flip: frame.flip });
    drawAllyRoleOverlay(worker, p);

    const markerColors = {
      lumberjack: ["#78b957"],
      miner: ["#aeb7b7", "#f2bf49"],
      repairer: ["#7dd3ff", "#f1b84b"],
      healer: ["#f2e7d5", "#f49ab2"],
    }[worker.role] || ["#aeb7b7"];
    markerColors.forEach((color, index) => {
      ctx.fillStyle = color;
      ctx.beginPath();
      ctx.arc(p.x - 7 + index * 14, p.y - 34, 4, 0, TAU);
      ctx.fill();
    });

    const workTarget = worker.harvestTarget || worker.repairTarget || worker.healTarget;
    if (workTarget) {
      const target = worldToScreen(workTarget);
      ctx.strokeStyle = worker.role === "healer" ? "rgba(168,224,95,0.42)" : "rgba(246,240,219,0.22)";
      ctx.lineWidth = 2;
      ctx.setLineDash([3, 5]);
      ctx.beginPath();
      ctx.moveTo(p.x, p.y);
      ctx.lineTo(target.x, target.y);
      ctx.stroke();
      ctx.setLineDash([]);
    }

    drawAllyStatus(worker, p.x, p.y, 40);
    return;
  }

  ctx.save();
  ctx.translate(p.x, p.y);
  ctx.fillStyle = worker.role === "lumberjack" ? "#7ec35c" : worker.role === "repairer" ? "#7dd3ff" : worker.role === "healer" ? "#f2e7d5" : "#aab0b0";
  ctx.beginPath();
  ctx.arc(0, 0, worker.radius, 0, TAU);
  ctx.fill();
  ctx.restore();
  drawAllyRoleOverlay(worker, p);
  drawAllyStatus(worker, p.x, p.y, 40);
}

function drawDog(dog) {
  const p = worldToScreen(dog);
  const bob = dog.moving ? Math.sin(state.time * 12) * 2 : 0;
  drawSpriteShadow(p.x, p.y + 12, 30, 9, 0.22);

  if (dogSpriteImage.complete && dogSpriteImage.naturalWidth > 0) {
    const smoothing = ctx.imageSmoothingEnabled;
    ctx.imageSmoothingEnabled = false;
    ctx.drawImage(dogSpriteImage, p.x - 24, p.y - 28 + bob, 48, 48);
    ctx.imageSmoothingEnabled = smoothing;
  } else {
    ctx.save();
    ctx.translate(p.x, p.y + bob);
    ctx.fillStyle = "#8b5835";
    ctx.beginPath();
    ctx.ellipse(0, 2, 18, 10, 0, 0, TAU);
    ctx.fill();
    ctx.fillStyle = "#a86c40";
    ctx.beginPath();
    ctx.arc(17, -5, 9, 0, TAU);
    ctx.fill();
    ctx.strokeStyle = "#8b5835";
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(-16, -3);
    ctx.lineTo(-25, -13 + Math.sin(state.time * 14) * 2);
    ctx.stroke();
    ctx.fillStyle = "#3b2a22";
    ctx.fillRect(18, -8, 3, 3);
    ctx.restore();
  }

  if (dog.carryDrop?.dropType) {
    drawIconImage(resourceIconImages[dog.carryDrop.dropType], p.x + 17, p.y - 23 + bob, 17, {
      fallback: itemVisuals[dog.carryDrop.dropType]?.color || "#f6f0db",
    });
  }
  drawAllyStatus(dog, p.x, p.y, 38);
}

function drawProjectiles() {
  for (const projectile of state.projectiles) {
    const p = worldToScreen(projectile);
    ctx.fillStyle = projectile.color;
    ctx.beginPath();
    ctx.arc(p.x, p.y, projectile.radius, 0, TAU);
    ctx.fill();
  }
}

function drawIconImage(image, x, y, size, options = {}) {
  const { rotation = 0, alpha = 1, fallback = "#f6f0db" } = options;
  ctx.save();
  ctx.globalAlpha *= alpha;
  ctx.translate(x, y);
  ctx.rotate(rotation);
  if (image?.complete && image.naturalWidth > 0) {
    const smoothing = ctx.imageSmoothingEnabled;
    ctx.imageSmoothingEnabled = false;
    ctx.drawImage(image, -size / 2, -size / 2, size, size);
    ctx.imageSmoothingEnabled = smoothing;
  } else {
    ctx.fillStyle = fallback;
    ctx.beginPath();
    ctx.arc(0, 0, size * 0.42, 0, TAU);
    ctx.fill();
  }
  ctx.restore();
}

function drawDrop(drop) {
  const p = worldToScreen(drop);
  const visual = itemVisuals[drop.dropType];
  const bob = Math.sin(state.time * 5 + drop.bob) * 2.5;
  drawSpriteShadow(p.x, p.y + 7, 20, 6, 0.22);
  drawIconImage(resourceIconImages[drop.dropType], p.x, p.y - 7 + bob, 22, { fallback: visual.color });
  if (drop.amount > 1) {
    ctx.font = "700 10px 'Segoe UI', sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.lineWidth = 3;
    ctx.strokeStyle = "rgba(31, 26, 22, 0.78)";
    ctx.strokeText(String(drop.amount), p.x + 10, p.y + 5 + bob);
    ctx.fillStyle = "#fff8dc";
    ctx.fillText(String(drop.amount), p.x + 10, p.y + 5 + bob);
  }
}

function drawHarvestTool(actor, resource, pulse) {
  if (!resource || !state.resources.includes(resource)) return;
  const def = resourceDefs[resource.type];
  const actorScreen = worldToScreen(actor);
  const resourceScreen = worldToScreen(resource);
  const mix = def.tool === "axe" ? 0.72 : 0.62;
  const x = actorScreen.x + (resourceScreen.x - actorScreen.x) * mix;
  const y = actorScreen.y + (resourceScreen.y - actorScreen.y) * mix - 24;
  const swing = Math.sin(pulse * 1.35) * 0.78;
  const baseAngle = def.tool === "axe" ? -0.62 : -0.25;
  drawIconImage(toolIconImages[def.tool], x, y, 34, {
    rotation: baseAngle + swing,
    fallback: def.color,
  });

  ctx.strokeStyle = def.tool === "axe" ? "rgba(244, 211, 147, 0.55)" : "rgba(221, 229, 226, 0.42)";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(resourceScreen.x, resourceScreen.y - 10, resource.radius + 8, -0.9, -0.9 + Math.abs(swing) * 0.9);
  ctx.stroke();
}

function drawAttackTool(actor) {
  const fx = actor.attackFx;
  if (!fx) return;
  const age = state.time - fx.started;
  if (age > fx.duration) {
    actor.attackFx = null;
    return;
  }
  const t = clamp(age / fx.duration, 0, 1);
  const actorScreen = worldToScreen(actor);
  const dirX = fx.dirX || 1;
  const dirY = fx.dirY || 0;
  const perpX = -dirY;
  const perpY = dirX;
  const pop = Math.sin(t * Math.PI);
  const wobble = Math.sin(t * Math.PI * 3) * 5;
  const x = actorScreen.x + dirX * (fx.distance || 34) + perpX * wobble;
  const y = actorScreen.y + dirY * (fx.distance || 34) - 24 + perpY * wobble - pop * 12;
  const rotation = Math.atan2(dirY, dirX) + Math.PI / 4 + Math.sin(t * Math.PI * 2.2) * 0.72;
  const alpha = 1 - t * 0.22;
  const size = (actor === player ? 32 : 30) + pop * 7;
  drawIconImage(weaponIconImages[fx.weaponId] || weaponIconImages.ironSword, x, y, size, {
    rotation,
    alpha,
    fallback: "#f6f0db",
  });

  ctx.strokeStyle = `rgba(246, 240, 219, ${0.34 * (1 - t)})`;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(x, y, size * 0.58, rotation - 1.35, rotation + 0.65);
  ctx.stroke();
}

function drawAttackTools() {
  drawAttackTool(player);
  for (const defender of state.defenders) {
    if (defender.attackType === "melee") drawAttackTool(defender);
  }
}

function drawHarvestTools() {
  if (player.harvesting && player.harvestTarget) drawHarvestTool(player, player.harvestTarget, player.harvestPulse);
  for (const worker of state.workers) {
    if (worker.harvesting && worker.harvestTarget) drawHarvestTool(worker, worker.harvestTarget, worker.harvestPulse);
  }
}

function drawFlyingItems() {
  for (const item of state.flyItems) {
    const t = clamp(item.age / item.life, 0, 1);
    const ease = 1 - (1 - t) ** 3;
    const x = item.sx + (item.tx - item.sx) * ease;
    const y = item.sy + (item.ty - item.sy) * ease - Math.sin(t * Math.PI) * 54;
    const size = 24 - t * 7;
    drawIconImage(resourceIconImages[item.type], x, y, size, {
      alpha: 1 - t * 0.1,
      fallback: itemVisuals[item.type].color,
    });
  }
}

function drawEffects() {
  for (const particle of state.particles) {
    const p = worldToScreen(particle);
    ctx.globalAlpha = 1 - particle.age / particle.life;
    ctx.fillStyle = particle.color;
    if (particle.shape === "chip") {
      ctx.save();
      ctx.translate(p.x, p.y);
      ctx.rotate(particle.rotation);
      ctx.fillRect(-particle.size * 0.75, -particle.size * 0.32, particle.size * 1.5, particle.size * 0.64);
      ctx.restore();
    } else {
      ctx.beginPath();
      ctx.arc(p.x, p.y, particle.size, 0, TAU);
      ctx.fill();
    }
  }
  ctx.globalAlpha = 1;

  drawHarvestTools();
  drawAttackTools();

  ctx.font = "700 14px 'Segoe UI', sans-serif";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  for (const text of state.floatText) {
    const p = worldToScreen(text);
    ctx.globalAlpha = 1 - text.age / text.life;
    ctx.fillStyle = text.color;
    ctx.fillText(text.text, p.x, p.y);
  }
  ctx.globalAlpha = 1;

  drawFlyingItems();
}

function drawHarvestRange() {
  const p = worldToScreen(player);
  ctx.strokeStyle = "rgba(255,255,255,0.09)";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(p.x, p.y, 78, 0, TAU);
  ctx.stroke();
}

function draw() {
  drawGround();
  drawBaseAreas();
  drawHarvestRange();

  const drawables = [
    ...state.resources,
    ...state.drops,
    ...state.traps,
    ...state.buildings,
    ...state.defenders,
    ...state.workers,
    ...state.enemies,
    player,
  ].sort((a, b) => a.y - b.y);

  for (const item of drawables) {
    if (item === player) drawPlayer();
    else if ("dropType" in item) drawDrop(item);
    else if ("type" in item && resourceDefs[item.type]) drawResource(item);
    else if (item.attackType) drawDefender(item);
    else if (item.role === "dog") drawDog(item);
    else if (item.role === "lumberjack" || item.role === "miner" || item.role === "repairer" || item.role === "healer") drawWorker(item);
    else if ("maxDurability" in item) drawTrap(item);
    else if ("maxHp" in item && buildDefById(item.id)) drawBuilding(item);
    else if ("damage" in item && "bleed" in item) drawEnemy(item);
  }

  drawProjectiles();
  drawEffects();
}

function tick() {
  const current = now();
  const dt = clamp(current - state.last, 0, 0.05);
  state.last = current;

  if (!state.menu.open && !state.skillChoice.open) {
    state.time += dt;
    updateSkillTimers(dt);
    updatePlayer(dt);
    updateHarvest(dt);
    playerAttack(dt);
    updateProjectiles(dt);
    updateTraps(dt);
    updateBuildings(dt);
    updateDefenders(dt);
    updateWorkers(dt);
    updateEnemies(dt);
    updateDrops(dt);
    maintainAmbientResources(dt);
    updateFlyItems(dt);
    updateEffects(dt);
  }

  updateUi();
  draw();

  requestAnimationFrame(tick);
}

function updatePointerVector(clientX, clientY) {
  const dx = clientX - state.pointer.startX;
  const dy = clientY - state.pointer.startY;
  const max = 46;
  const len = Math.hypot(dx, dy);
  const strength = clamp(len / max, 0, 1);
  const nx = len > 0 ? dx / len : 0;
  const ny = len > 0 ? dy / len : 0;
  state.pointer.vector.x = nx * strength;
  state.pointer.vector.y = ny * strength;
  ui.joystickKnob.style.transform = `translate(${nx * Math.min(len, max)}px, ${ny * Math.min(len, max)}px)`;
}

function allyAtScreenPoint(clientX, clientY) {
  const point = screenToWorld(clientX, clientY);
  let best = null;
  let bestDistance = 32;
  for (const ally of [...state.defenders, ...state.workers]) {
    const d = Math.hypot(ally.x - point.x, ally.y - point.y);
    if (d < bestDistance) {
      best = ally;
      bestDistance = d;
    }
  }
  return best;
}

function handleWorldTap(clientX, clientY) {
  const ally = allyAtScreenPoint(clientX, clientY);
  if (!ally) return false;
  toggleAllyBaseAssignment(ally);
  return true;
}

function startPointer(event) {
  if (state.menu.open || state.skillChoice.open || event.button !== 0 || event.target.closest(".hud")) return;
  canvas.setPointerCapture(event.pointerId);
  state.pointer.active = true;
  state.pointer.id = event.pointerId;
  state.pointer.startX = event.clientX;
  state.pointer.startY = event.clientY;
  state.pointer.x = event.clientX;
  state.pointer.y = event.clientY;
  state.pointer.startedAt = now();
  ui.joystick.hidden = false;
  ui.joystick.style.left = `${event.clientX}px`;
  ui.joystick.style.top = `${event.clientY}px`;
  updatePointerVector(event.clientX, event.clientY);
}

function movePointer(event) {
  if (!state.pointer.active || event.pointerId !== state.pointer.id) return;
  state.pointer.x = event.clientX;
  state.pointer.y = event.clientY;
  updatePointerVector(event.clientX, event.clientY);
}

function endPointer(event) {
  if (!state.pointer.active || event.pointerId !== state.pointer.id) return;
  const tapDistance = Math.hypot(event.clientX - state.pointer.startX, event.clientY - state.pointer.startY);
  const tapDuration = now() - state.pointer.startedAt;
  if (tapDistance < 10 && tapDuration < 0.32) {
    handleWorldTap(event.clientX, event.clientY);
  }
  state.pointer.active = false;
  state.pointer.id = null;
  state.pointer.startedAt = 0;
  state.pointer.vector.x = 0;
  state.pointer.vector.y = 0;
  ui.joystick.hidden = true;
  ui.joystickKnob.style.transform = "translate(0, 0)";
}

function handleKeydown(event) {
  if (event.repeat) return;
  if (state.skillChoice.open) {
    event.preventDefault();
    return;
  }
  if (event.code === "Escape") {
    if (state.menu.open) {
      closeWorldMenu();
      event.preventDefault();
    }
    return;
  }
  if (event.code === "KeyE") {
    if (state.menu.open) closeWorldMenu();
    else openWorldMenuAtPlayer();
    event.preventDefault();
    return;
  }
  if (state.menu.open) {
    event.preventDefault();
    return;
  }
  if (/^[1-9]$/.test(event.key)) {
    const index = Number(event.key) - 1;
    const visibleWeapons = unlockedWeapons();
    if (visibleWeapons[index]) {
      equippedIndex = weapons.findIndex((weapon) => weapon.id === visibleWeapons[index].id);
      player.attackTimer = 0;
      showToast(`${visibleWeapons[index].name}を装備しました`);
      renderStaticUi();
    }
    return;
  }
  const moveKeys = ["KeyW", "KeyA", "KeyS", "KeyD", "ArrowUp", "ArrowLeft", "ArrowDown", "ArrowRight"];
  if (moveKeys.includes(event.code)) {
    state.keys.add(event.code);
    event.preventDefault();
  }
}

function handleKeyup(event) {
  state.keys.delete(event.code);
}

function handleContextMenu(event) {
  event.preventDefault();
  if (state.skillChoice.open) return;
  if (event.target.closest(".hud") || event.target.closest(".radial-menu")) return;
  openWorldMenu(event.clientX, event.clientY);
}

window.addEventListener("resize", resize);
window.addEventListener("keydown", handleKeydown);
window.addEventListener("keyup", handleKeyup);
window.addEventListener("contextmenu", handleContextMenu);
canvas.addEventListener("pointerdown", startPointer);
canvas.addEventListener("pointermove", movePointer);
canvas.addEventListener("pointerup", endPointer);
canvas.addEventListener("pointercancel", endPointer);
ui.menuBackdrop.addEventListener("click", closeWorldMenu);
if (ui.quickMenuButton) {
  ui.quickMenuButton.addEventListener("click", () => {
    if (state.skillChoice.open) return;
    if (state.menu.open) closeWorldMenu();
    else openWorldMenuAtPlayer();
  });
}
if (ui.saveButton) {
  ui.saveButton.addEventListener("click", (event) => {
    event.stopPropagation();
    downloadSaveFile();
  });
}
ui.radialMenu.addEventListener("click", (event) => {
  const button = event.target.closest("[data-menu]");
  if (!button) return;
  openSubmenu(button.dataset.menu);
});
if (ui.upgradeAxe) {
  ui.upgradeAxe.addEventListener("click", () => {
    upgradeTool("axe");
    closeWorldMenu();
  });
}
if (ui.upgradePickaxe) {
  ui.upgradePickaxe.addEventListener("click", () => {
    upgradeTool("pickaxe");
    closeWorldMenu();
  });
}
if (ui.equippedWeaponHud) {
  ui.equippedWeaponHud.addEventListener("click", (event) => {
    event.stopPropagation();
    openWeaponMenuFromHud();
  });
}
if (ui.rerollRewards) {
  ui.rerollRewards.addEventListener("click", rerollSkillChoices);
}
window.addEventListener("dragenter", handleSaveDragEnter);
window.addEventListener("dragover", handleSaveDragOver);
window.addEventListener("dragleave", handleSaveDragLeave);
window.addEventListener("drop", handleSaveDrop);

resize();
renderStaticUi();
initWorld();
showToast("WASD / 矢印キーで移動、E / 右クリックでメニュー");
requestAnimationFrame(tick);
