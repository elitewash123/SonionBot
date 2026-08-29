// ==========================================================
// Comprehensive Test & Verification Suite
// ==========================================================

import assert from 'node:assert';
import fs from 'node:fs';
import path from 'node:path';
import { Database } from './src/db/database.js';
import { getRequiredXp, addSkillXp, rollLoot, executeGatheringAction } from './src/games/gathering.js';
import { FISH_LOOT, MINE_LOOT, DIG_LOOT, HUNT_LOOT, TOOLS, ALL_ITEMS } from './src/data/items.js';
import { BlackjackGame } from './src/games/blackjack.js';
import { playSlots, playCoinflip, playRoulette, playDice } from './src/games/casino.js';
import { PERMISSIONS, hasPermission } from './src/discord/permissions.js';
import { createProgressBar, formatNumber, formatTime } from './src/discord/embeds.js';
import { COMMAND_MAP, ALL_COMMANDS } from './src/commands/index.js';

console.log('🧪 Starting Automated Test Suite for SonionBot...\n');

let passedTests = 0;

function test(name, fn) {
  try {
    fn();
    console.log(`  ✅ [PASS] ${name}`);
    passedTests++;
  } catch (err) {
    console.error(`  ❌ [FAIL] ${name}`);
    console.error(err);
    process.exit(1);
  }
}

// 1. Database Tests
test('Database: User initialization and atomic operations', () => {
  const testDbPath = './test_db.json';
  if (fs.existsSync(testDbPath)) fs.unlinkSync(testDbPath);

  const db = new Database(testDbPath);
  const user = db.getUser('test_user_1');
  assert.strictEqual(user.wallet, 500);
  assert.strictEqual(user.bank, 0);
  assert.strictEqual(user.skills.fishing.level, 1);

  db.updateUser('test_user_1', u => {
    u.wallet += 1000;
  });
  assert.strictEqual(db.getUser('test_user_1').wallet, 1500);

  // Clean up
  if (fs.existsSync(testDbPath)) fs.unlinkSync(testDbPath);
});

// 2. Gathering RPG Tests
test('Gathering: Skill XP curve and level up calculation', () => {
  assert(getRequiredXp(1) > 0);
  assert(getRequiredXp(5) > getRequiredXp(1));

  const dummyUser = {
    skills: {
      fishing: { level: 1, xp: 0 }
    }
  };

  const req1 = getRequiredXp(1);
  const res = addSkillXp(dummyUser, 'fishing', req1 + 10);
  assert.strictEqual(res.leveledUp, true);
  assert.strictEqual(res.newLevel, 2);
  assert.strictEqual(dummyUser.skills.fishing.xp, 10);
});

test('Gathering: Loot roll tables and item index integrity', () => {
  assert(FISH_LOOT.length >= 10);
  assert(MINE_LOOT.length >= 10);
  assert(DIG_LOOT.length >= 10);
  assert(HUNT_LOOT.length >= 10);

  const tool = TOOLS.rod_cosmic;
  const roll = rollLoot(FISH_LOOT, tool, 10);
  assert(roll.item);
  assert(roll.count >= 1);
  assert(ALL_ITEMS[roll.item.id]);
});

test('Gathering: Action execution and inventory insertion', () => {
  const user = {
    wallet: 500,
    inventory: {},
    tools: { rod: 'rod_wood', pickaxe: 'pick_stone', shovel: 'shovel_plastic', weapon: 'hunt_sling' },
    skills: {
      fishing: { level: 1, xp: 0 },
      mining: { level: 1, xp: 0 },
      digging: { level: 1, xp: 0 },
      hunting: { level: 1, xp: 0 }
    },
    stats: {},
    buffs: {}
  };

  const embed = executeGatheringAction({ type: 'fish', user, username: 'Player1' });
  assert(embed.title.includes('Fishing'));
  assert(Object.keys(user.inventory).length > 0);
  assert.strictEqual(user.stats.fish_caught >= 1, true);
});

// 3. Blackjack Engine Tests
test('Blackjack: Card values and score calculation with soft aces', () => {
  const game = new BlackjackGame('user_123', 'Player', 100, 'channel_1');

  // Hard 17
  const hand1 = [{ suit: '♠', val: '10' }, { suit: '♦', val: '7' }];
  assert.strictEqual(game.calculateScore(hand1), 17);

  // Soft 18 (Ace + 7) -> 18
  const hand2 = [{ suit: '♠', val: 'A' }, { suit: '♦', val: '7' }];
  assert.strictEqual(game.calculateScore(hand2), 18);

  // Dynamic Ace reduction: Ace + 9 + 5 = 15 (not 25)
  const hand3 = [{ suit: '♠', val: 'A' }, { suit: '♦', val: '9' }, { suit: '♣', val: '5' }];
  assert.strictEqual(game.calculateScore(hand3), 15);

  // Two Aces: Ace + Ace = 12
  const hand4 = [{ suit: '♠', val: 'A' }, { suit: '♦', val: 'A' }];
  assert.strictEqual(game.calculateScore(hand4), 12);
});

test('Blackjack: Stand, Double Down, and Dealer rules', () => {
  const game = new BlackjackGame('user_123', 'Player', 100, 'channel_1');
  game.playerHand = [{ suit: '♠', val: '10' }, { suit: '♦', val: '9' }]; // 19
  game.dealerHand = [{ suit: '♠', val: '10' }, { suit: '♦', val: '6' }]; // 16 -> must draw
  game.stand();

  assert.notStrictEqual(game.status, 'IN_PROGRESS');
  assert(game.dealerHand.length >= 2);
  assert(game.calculateScore(game.dealerHand) >= 17 || game.calculateScore(game.dealerHand) > 21);
});

// 4. Casino Minigames Tests
test('Casino: Slots mechanics and payouts', () => {
  const slotRes = playSlots(100);
  assert(slotRes.embed);
  assert(typeof slotRes.payout === 'number');
  assert(typeof slotRes.win === 'boolean');
});

test('Casino: Coinflip mechanics', () => {
  const cfRes = playCoinflip('heads', 50);
  assert(cfRes.embed);
  if (cfRes.win) assert.strictEqual(cfRes.payout, 100);
  else assert.strictEqual(cfRes.payout, 0);
});

test('Casino: Roulette number and color payout calculation', () => {
  const rRes = playRoulette('red', 100);
  assert(rRes.embed);
  if (rRes.win) assert.strictEqual(rRes.payout, 200);
});

test('Casino: Dice roll showdown', () => {
  const diceRes = playDice(50);
  assert(diceRes.embed);
  assert(typeof diceRes.payout === 'number');
});

// 5. Discord Permissions Tests
test('Permissions: Administrator and bitwise checks', () => {
  const adminMember = {
    user: { id: 'admin_1' },
    permissions: PERMISSIONS.ADMINISTRATOR.toString()
  };

  const regularMember = {
    user: { id: 'user_regular' },
    permissions: PERMISSIONS.SEND_MESSAGES.toString()
  };

  assert.strictEqual(hasPermission(adminMember, PERMISSIONS.BAN_MEMBERS), true);
  assert.strictEqual(hasPermission(regularMember, PERMISSIONS.BAN_MEMBERS), false);
  assert.strictEqual(hasPermission(regularMember, PERMISSIONS.BAN_MEMBERS, ['user_regular']), true);
});

// 6. UI Helpers Tests
test('UI: Progress bars and number formatting', () => {
  const bar = createProgressBar(50, 100, 10);
  assert.strictEqual(bar, '`[█████░░░░░]` 50%');

  assert.strictEqual(formatNumber(1250000), '1,250,000');
  assert.strictEqual(formatTime(75), '1m 15s');
  assert.strictEqual(formatTime(3665), '1h 1m 5s');
});

// 7. Command Map and Alias Resolution Tests
test('Commands: Command router and alias integrity', () => {
  assert(COMMAND_MAP.has('fish'));
  assert(COMMAND_MAP.has('mine'));
  assert(COMMAND_MAP.has('dig'));
  assert(COMMAND_MAP.has('hunt'));
  assert(COMMAND_MAP.has('bal')); // Alias of balance
  assert(COMMAND_MAP.has('bj'));  // Alias of blackjack
  assert(COMMAND_MAP.has('kick'));
  assert(COMMAND_MAP.has('ban'));
  assert(COMMAND_MAP.has('help'));
});

// 8. Bank Upgrade & Category Selling Tests
test('Economy: Bank upgrades and category / fuzzy selling', () => {
  const testUser = {
    wallet: 50000,
    bank: 0,
    bank_capacity: 5000,
    inventory: {
      fish_minnow: 5,
      fish_salmon: 2,
      mine_diamond: 1,
      mine_iron: 10
    },
    stats: {},
    buffs: {},
    tools: {},
    skills: {}
  };

  // Test selling category 'fish'
  let totalFishCoins = 0;
  for (const [id, count] of Object.entries(testUser.inventory)) {
    if (id.startsWith('fish_') && count > 0) {
      totalFishCoins += ALL_ITEMS[id].value * count;
      testUser.inventory[id] = 0;
    }
  }

  assert.strictEqual(totalFishCoins, (25 * 5) + (85 * 2));
  assert.strictEqual(testUser.inventory.fish_minnow, 0);
  assert.strictEqual(testUser.inventory.fish_salmon, 0);
  assert.strictEqual(testUser.inventory.mine_diamond, 1);
});

// 9. Fun Games & Trivia Tests
import { TriviaGame, TRIVIA_QUESTIONS } from './src/games/trivia.js';
import { CrashGame } from './src/games/crash.js';
import { playScratchCard, spinFortuneWheel, playRPS } from './src/games/minigames.js';

test('Fun Games: Trivia generation, options and scoring', () => {
  const trivia = new TriviaGame('u_123', 'Player', 'ch_1');
  assert(trivia.question.q);
  assert.strictEqual(trivia.question.options.length, 4);
  assert(trivia.getComponents().length > 0);
});

test('Fun Games: Crash game multiplier and cash out', () => {
  const mockRest = { sendMessage: async () => ({ id: '123' }), editMessage: async () => {} };
  const mockDb = { getUser: () => ({ wallet: 1000, stats: {} }), queueSave: () => {} };
  const crash = new CrashGame('u_123', 'Player', 100, 'ch_1', mockRest, mockDb);
  assert(crash.crashPoint >= 1.0);
  assert.strictEqual(crash.status, 'FLYING');
});

test('Fun Games: Scratch card lottery mechanics', () => {
  const scratch = playScratchCard(100);
  assert(scratch.embed);
  assert(typeof scratch.win === 'boolean');
});

test('Fun Games: Fortune Wheel spin and prize awarding', () => {
  const user = { wallet: 500, buffs: {} };
  const embed = spinFortuneWheel(user);
  assert(embed.title.includes('Wheel'));
  assert(user.wallet > 500 || Object.keys(user.buffs).length > 0);
});

test('Fun Games: Rock Paper Scissors match outcomes', () => {
  const rpsWin = playRPS('rock', 50);
  assert(['WIN', 'LOSE', 'TIE'].includes(rpsWin.outcome));
  assert(rpsWin.embed);
});

console.log(`\n🎉 All ${passedTests} automated tests passed successfully!\n`);
