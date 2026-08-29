// ==========================================================
// Atomic JSON Database Manager (Zero Dependencies)
// ==========================================================

import fs from 'node:fs';
import path from 'node:path';

const DEFAULT_USER = {
  wallet: 500,
  bank: 0,
  bank_capacity: 5000,
  inventory: {},
  tools: {
    rod: 'rod_wood',
    pickaxe: 'pick_stone',
    shovel: 'shovel_plastic',
    weapon: 'hunt_sling'
  },
  skills: {
    fishing: { level: 1, xp: 0 },
    mining: { level: 1, xp: 0 },
    digging: { level: 1, xp: 0 },
    hunting: { level: 1, xp: 0 }
  },
  stats: {
    fish_caught: 0,
    ores_mined: 0,
    items_dug: 0,
    beasts_hunted: 0,
    bj_won: 0,
    bj_lost: 0,
    slots_won: 0,
    slots_lost: 0,
    total_earned: 0,
    daily_streak: 0,
    last_daily: 0
  },
  cooldowns: {},
  buffs: {}
};

const DEFAULT_GUILD = {
  prefix: '!',
  mod_log_channel: null,
  warnings: [],
  mod_logs: []
};

export class Database {
  constructor(filePath = './database.json') {
    this.filePath = path.resolve(filePath);
    this.data = {
      users: {},
      guilds: {}
    };
    this.saveTimeout = null;
    this.load();
  }

  load() {
    try {
      if (fs.existsSync(this.filePath)) {
        const raw = fs.readFileSync(this.filePath, 'utf8');
        this.data = JSON.parse(raw);
        if (!this.data.users) this.data.users = {};
        if (!this.data.guilds) this.data.guilds = {};
        console.log(`[Database] Successfully loaded database with ${Object.keys(this.data.users).length} users.`);
      } else {
        this.saveImmediately();
        console.log('[Database] Initialized new empty database file.');
      }
    } catch (err) {
      console.error('[Database] Failed to load database file, initializing clean state:', err);
      this.data = { users: {}, guilds: {} };
    }
  }

  saveImmediately() {
    if (this.saveTimeout) {
      clearTimeout(this.saveTimeout);
      this.saveTimeout = null;
    }
    const tempPath = `${this.filePath}.tmp.${Date.now()}`;
    try {
      const dir = path.dirname(this.filePath);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
      fs.writeFileSync(tempPath, JSON.stringify(this.data, null, 2), 'utf8');
      fs.renameSync(tempPath, this.filePath);
    } catch (err) {
      console.error('[Database] Error saving database:', err);
      if (fs.existsSync(tempPath)) {
        try { fs.unlinkSync(tempPath); } catch (_) {}
      }
    }
  }

  queueSave() {
    if (this.saveTimeout) return;
    this.saveTimeout = setTimeout(() => {
      this.saveImmediately();
    }, 1500);
  }

  // --- User Methods ---

  getUser(userId) {
    if (!this.data.users[userId]) {
      this.data.users[userId] = JSON.parse(JSON.stringify(DEFAULT_USER));
      this.queueSave();
    }
    
    // Ensure backwards compatibility with any missing fields
    const u = this.data.users[userId];
    if (u.wallet === undefined) u.wallet = 500;
    if (u.bank === undefined) u.bank = 0;
    if (u.bank_capacity === undefined) u.bank_capacity = 5000;
    if (!u.inventory) u.inventory = {};
    if (!u.tools) u.tools = { ...DEFAULT_USER.tools };
    if (!u.skills) u.skills = { ...DEFAULT_USER.skills };
    if (!u.stats) u.stats = { ...DEFAULT_USER.stats };
    if (!u.cooldowns) u.cooldowns = {};
    if (!u.buffs) u.buffs = {};

    return u;
  }

  updateUser(userId, modifierFn) {
    const user = this.getUser(userId);
    modifierFn(user);
    this.queueSave();
    return user;
  }

  // --- Guild Methods ---

  getGuild(guildId) {
    if (!guildId) return { ...DEFAULT_GUILD };
    if (!this.data.guilds[guildId]) {
      this.data.guilds[guildId] = JSON.parse(JSON.stringify(DEFAULT_GUILD));
      this.queueSave();
    }
    const g = this.data.guilds[guildId];
    if (!g.warnings) g.warnings = [];
    if (!g.mod_logs) g.mod_logs = [];
    if (!g.prefix) g.prefix = '!';
    return g;
  }

  updateGuild(guildId, modifierFn) {
    const guild = this.getGuild(guildId);
    modifierFn(guild);
    this.queueSave();
    return guild;
  }

  // --- Leaderboards ---

  getTopBalances(limit = 10) {
    const entries = Object.entries(this.data.users).map(([id, data]) => ({
      id,
      netWorth: (data.wallet || 0) + (data.bank || 0),
      wallet: data.wallet || 0,
      bank: data.bank || 0
    }));
    return entries.sort((a, b) => b.netWorth - a.netWorth).slice(0, limit);
  }

  getTopSkill(skillName, limit = 10) {
    const entries = Object.entries(this.data.users).map(([id, data]) => ({
      id,
      level: data.skills?.[skillName]?.level || 1,
      xp: data.skills?.[skillName]?.xp || 0
    }));
    return entries.sort((a, b) => (b.level * 10000 + b.xp) - (a.level * 10000 + a.xp)).slice(0, limit);
  }
}
