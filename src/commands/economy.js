// ==========================================================
// Economy, Inventory, Shop & Profile Commands
// ==========================================================

import { TOOLS, CONSUMABLES, ALL_ITEMS, RARITIES } from '../data/items.js';
import { JOBS } from '../data/jobs.js';
import { createEmbed, errorEmbed, successEmbed, COLORS, formatNumber, formatTime, createProgressBar } from '../discord/embeds.js';
import { getRequiredXp } from '../games/gathering.js';
import { parseUserId } from './moderation.js';

export const economyCommands = {
  // --- BALANCE ---
  balance: {
    name: 'balance',
    aliases: ['bal', 'wallet'],
    description: 'Shows your current wallet balance and bank account.',
    usage: '!balance [@user]',
    async execute({ rest, message, args, db }) {
      const targetId = parseUserId(args[0]) || message.author.id;
      const user = db.getUser(targetId);
      const netWorth = user.wallet + user.bank;

      return rest.sendMessage(message.channel_id, {
        embeds: createEmbed({
          title: `💰 Financial Overview`,
          description: `<@${targetId}>'s balance details:`,
          color: COLORS.GOLD,
          fields: [
            { name: '🪙 Wallet', value: `**${formatNumber(user.wallet)}** coins`, inline: true },
            { name: '🏦 Bank', value: `**${formatNumber(user.bank)}** / ${formatNumber(user.bank_capacity)} coins`, inline: true },
            { name: '💎 Net Worth', value: `**${formatNumber(netWorth)}** coins`, inline: true }
          ]
        })
      });
    }
  },

  // --- DEPOSIT ---
  deposit: {
    name: 'deposit',
    aliases: ['dep'],
    description: 'Deposits coins from your wallet into your safe bank account.',
    usage: '!deposit <amount|all>',
    async execute({ rest, message, args, db }) {
      const user = db.getUser(message.author.id);
      let amount = 0;

      if (!args[0]) {
        return rest.sendMessage(message.channel_id, {
          embeds: errorEmbed('Missing Amount', 'Specify an amount to deposit: `!deposit <amount|all>`')
        });
      }

      if (args[0].toLowerCase() === 'all') {
        const availableSpace = user.bank_capacity - user.bank;
        amount = Math.min(user.wallet, availableSpace);
      } else {
        amount = parseInt(args[0], 10);
      }

      if (isNaN(amount) || amount <= 0) {
        return rest.sendMessage(message.channel_id, {
          embeds: errorEmbed('Invalid Amount', 'Please provide a valid positive number.')
        });
      }

      if (user.wallet < amount) {
        return rest.sendMessage(message.channel_id, {
          embeds: errorEmbed('Insufficient Funds', `You only have 🪙 **${formatNumber(user.wallet)}** coins in your wallet.`)
        });
      }

      if (user.bank + amount > user.bank_capacity) {
        return rest.sendMessage(message.channel_id, {
          embeds: errorEmbed('Bank Full', `Your bank can only hold up to 🪙 **${formatNumber(user.bank_capacity)}** coins! (Current: ${formatNumber(user.bank)})`)
        });
      }

      user.wallet -= amount;
      user.bank += amount;
      db.queueSave();

      return rest.sendMessage(message.channel_id, {
        embeds: successEmbed('Deposit Successful', `Deposited 🪙 **${formatNumber(amount)}** coins into your bank.\n\n**Wallet:** ${formatNumber(user.wallet)} | **Bank:** ${formatNumber(user.bank)}`)
      });
    }
  },

  // --- WITHDRAW ---
  withdraw: {
    name: 'withdraw',
    aliases: ['with'],
    description: 'Withdraws coins from your bank into your wallet.',
    usage: '!withdraw <amount|all>',
    async execute({ rest, message, args, db }) {
      const user = db.getUser(message.author.id);
      let amount = 0;

      if (!args[0]) {
        return rest.sendMessage(message.channel_id, {
          embeds: errorEmbed('Missing Amount', 'Specify an amount to withdraw: `!withdraw <amount|all>`')
        });
      }

      if (args[0].toLowerCase() === 'all') {
        amount = user.bank;
      } else {
        amount = parseInt(args[0], 10);
      }

      if (isNaN(amount) || amount <= 0) {
        return rest.sendMessage(message.channel_id, {
          embeds: errorEmbed('Invalid Amount', 'Please provide a valid positive number.')
        });
      }

      if (user.bank < amount) {
        return rest.sendMessage(message.channel_id, {
          embeds: errorEmbed('Insufficient Bank Balance', `You only have 🪙 **${formatNumber(user.bank)}** coins in your bank.`)
        });
      }

      user.bank -= amount;
      user.wallet += amount;
      db.queueSave();

      return rest.sendMessage(message.channel_id, {
        embeds: successEmbed('Withdrawal Successful', `Withdrew 🪙 **${formatNumber(amount)}** coins to your wallet.\n\n**Wallet:** ${formatNumber(user.wallet)} | **Bank:** ${formatNumber(user.bank)}`)
      });
    }
  },

  // --- DAILY ---
  daily: {
    name: 'daily',
    description: 'Claim your daily coin reward and build up your streak multiplier!',
    usage: '!daily',
    async execute({ rest, message, db }) {
      const user = db.getUser(message.author.id);
      const now = Date.now();
      const oneDayMs = 24 * 60 * 60 * 1000;
      const lastDaily = user.stats.last_daily || 0;
      const elapsed = now - lastDaily;

      if (elapsed < oneDayMs) {
        const remaining = (oneDayMs - elapsed) / 1000;
        return rest.sendMessage(message.channel_id, {
          embeds: errorEmbed('Daily Cooldown', `⏳ You have already claimed your daily reward today! Come back in **${formatTime(remaining)}**.`)
        });
      }

      // Check streak (resets if elapsed > 48 hours)
      if (elapsed < oneDayMs * 2) {
        user.stats.daily_streak = (user.stats.daily_streak || 0) + 1;
      } else {
        user.stats.daily_streak = 1;
      }

      user.stats.last_daily = now;

      const baseReward = 500;
      const streakBonus = (user.stats.daily_streak - 1) * 50;
      const totalReward = baseReward + streakBonus;

      user.wallet += totalReward;
      user.stats.total_earned = (user.stats.total_earned || 0) + totalReward;
      db.queueSave();

      return rest.sendMessage(message.channel_id, {
        embeds: createEmbed({
          title: '🎁 Daily Reward Claimed!',
          description: `You collected your daily paycheck of 🪙 **${formatNumber(totalReward)}** coins!\n\n` +
            `🔥 **Daily Streak:** \`${user.stats.daily_streak} days\` (+${streakBonus} streak bonus)\n` +
            `🪙 **Wallet:** ${formatNumber(user.wallet)} coins`,
          color: COLORS.SUCCESS
        })
      });
    }
  },

  // --- WORK ---
  work: {
    name: 'work',
    description: 'Work an honest shift to earn coins.',
    usage: '!work',
    async execute({ rest, message, db }) {
      const user = db.getUser(message.author.id);
      const now = Date.now();
      const cooldownMs = 60 * 1000; // 1 minute cooldown
      const lastWork = user.cooldowns.work || 0;
      const elapsed = now - lastWork;

      if (elapsed < cooldownMs) {
        const remaining = (cooldownMs - elapsed) / 1000;
        return rest.sendMessage(message.channel_id, {
          embeds: errorEmbed('Shift Ended', `⏳ You need to rest before your next shift! Wait **${formatTime(remaining)}**.`)
        });
      }

      user.cooldowns.work = now;

      const job = JOBS[Math.floor(Math.random() * JOBS.length)];
      const earnings = Math.floor(Math.random() * (job.maxPay - job.minPay + 1)) + job.minPay;
      const scenario = job.msgs[Math.floor(Math.random() * job.msgs.length)];

      user.wallet += earnings;
      user.stats.total_earned = (user.stats.total_earned || 0) + earnings;
      db.queueSave();

      return rest.sendMessage(message.channel_id, {
        embeds: createEmbed({
          title: `💼 Job: ${job.title}`,
          description: `${scenario} 🪙 **${formatNumber(earnings)}** coins!`,
          color: COLORS.INFO,
          footer: `New Wallet Balance: ${formatNumber(user.wallet)} coins`
        })
      });
    }
  },

  // --- ROB ---
  rob: {
    name: 'rob',
    description: 'Attempt to pickpocket another user\'s wallet. Beware of police fines!',
    usage: '!rob @user',
    async execute({ rest, message, args, db }) {
      const targetId = parseUserId(args[0]);
      if (!targetId || targetId === message.author.id) {
        return rest.sendMessage(message.channel_id, {
          embeds: errorEmbed('Invalid Target', 'Mention a player to rob: `!rob @user`')
        });
      }

      const robber = db.getUser(message.author.id);
      const victim = db.getUser(targetId);

      // Check cooldown
      const now = Date.now();
      const cooldownMs = 5 * 60 * 1000; // 5 minutes
      const lastRob = robber.cooldowns.rob || 0;
      const elapsed = now - lastRob;

      if (elapsed < cooldownMs) {
        const remaining = (cooldownMs - elapsed) / 1000;
        return rest.sendMessage(message.channel_id, {
          embeds: errorEmbed('Under Surveillance', `🚨 The police are watching you! Lay low for **${formatTime(remaining)}**.`)
        });
      }

      if (robber.wallet < 200) {
        return rest.sendMessage(message.channel_id, {
          embeds: errorEmbed('Too Poor to Rob', 'You need at least 🪙 **200** coins in your wallet in case you get fined!')
        });
      }

      if (victim.wallet < 100) {
        return rest.sendMessage(message.channel_id, {
          embeds: errorEmbed('Empty Pockets', `<@${targetId}> doesn't have enough cash in their wallet to be worth robbing!`)
        });
      }

      robber.cooldowns.rob = now;

      // 45% success chance
      const success = Math.random() < 0.45;

      if (success) {
        const stealPercentage = 0.15 + Math.random() * 0.35; // Steal 15% - 50%
        const stolenAmount = Math.floor(victim.wallet * stealPercentage);

        victim.wallet -= stolenAmount;
        robber.wallet += stolenAmount;
        db.queueSave();

        return rest.sendMessage(message.channel_id, {
          embeds: createEmbed({
            title: '🥷 Heist Successful!',
            description: `You silently snuck up on <@${targetId}> and stole 🪙 **${formatNumber(stolenAmount)}** coins from their pocket!`,
            color: COLORS.SUCCESS
          })
        });
      } else {
        const fine = Math.min(robber.wallet, Math.floor(200 + Math.random() * 300));
        robber.wallet -= fine;
        db.queueSave();

        return rest.sendMessage(message.channel_id, {
          embeds: createEmbed({
            title: '🚨 Caught Red-Handed!',
            description: `You tripped an alarm while trying to rob <@${targetId}>! The police arrested you and fined you 🪙 **${formatNumber(fine)}** coins.`,
            color: COLORS.ERROR
          })
        });
      }
    }
  },

  // --- SHOP ---
  shop: {
    name: 'shop',
    description: 'Browse upgradeable gathering tools and consumable power-ups.',
    usage: '!shop [tools|consumables]',
    async execute({ rest, message, args }) {
      const category = (args[0] || 'all').toLowerCase();

      const toolEntries = Object.values(TOOLS).filter(t => t.cost > 0);
      const consumableEntries = Object.values(CONSUMABLES);

      const fields = [];

      if (category === 'all' || category === 'tools') {
        const toolList = toolEntries.map(t => {
          return `• **${t.name}** (\`${t.id}\`) — 🪙 **${formatNumber(t.cost)}**\n  *Tier ${t.tier} ${t.type.toUpperCase()}* | +${Math.round(t.luck * 100)}% Luck | Power ${t.power}x`;
        }).join('\n\n');

        fields.push({
          name: '🛠️ Tool Upgrades (Permanent Gear)',
          value: toolList || 'No tools available.',
          inline: false
        });
      }

      if (category === 'all' || category === 'consumables') {
        const buffList = consumableEntries.map(c => {
          return `• **${c.name}** (\`${c.id}\`) — 🪙 **${formatNumber(c.price)}**\n  *${c.desc}*`;
        }).join('\n\n');

        fields.push({
          name: '🧪 Consumables & Buffs',
          value: buffList || 'No consumables available.',
          inline: false
        });
      }

      return rest.sendMessage(message.channel_id, {
        embeds: createEmbed({
          title: '🛒 Adventurer\'s Market & Outfitter',
          description: 'Upgrade your gear to hook mythical fish, drill ancient void gems, and double your yields!\nBuy items using `!buy <item_id>`',
          color: COLORS.INFO,
          fields,
          footer: 'Example: !buy rod_fiber or !buy lucky_clover'
        })
      });
    }
  },

  // --- BUY ---
  buy: {
    name: 'buy',
    description: 'Purchase tools or consumables from the shop.',
    usage: '!buy <item_id> [amount]',
    async execute({ rest, message, args, db }) {
      const user = db.getUser(message.author.id);
      const itemId = (args[0] || '').toLowerCase();
      const amount = parseInt(args[1], 10) || 1;

      if (!itemId) {
        return rest.sendMessage(message.channel_id, {
          embeds: errorEmbed('Missing Item ID', 'Please specify an item to buy: `!buy <item_id>` (Use `!shop` to view list).')
        });
      }

      const tool = TOOLS[itemId];
      const consumable = CONSUMABLES[itemId];

      if (!tool && !consumable) {
        return rest.sendMessage(message.channel_id, {
          embeds: errorEmbed('Item Not Found', `No item found matching \`${itemId}\`. View available items with \`!shop\`.`)
        });
      }

      // Buying a tool
      if (tool) {
        if (tool.cost === 0) {
          return rest.sendMessage(message.channel_id, {
            embeds: errorEmbed('Default Tool', 'This is a starter tool and cannot be purchased.')
          });
        }

        if (user.wallet < tool.cost) {
          return rest.sendMessage(message.channel_id, {
            embeds: errorEmbed('Insufficient Funds', `You need 🪙 **${formatNumber(tool.cost)}** coins to buy **${tool.name}**. (You have: ${formatNumber(user.wallet)})`)
          });
        }

        user.wallet -= tool.cost;
        user.tools[tool.type] = tool.id;
        db.queueSave();

        return rest.sendMessage(message.channel_id, {
          embeds: successEmbed(
            'Tool Upgraded!',
            `🎉 You purchased and equipped **${tool.name}** (Tier ${tool.tier}) for 🪙 **${formatNumber(tool.cost)}** coins!\n\nYour gathering yields and rare drop rates have significantly increased!`
          )
        });
      }

      // Buying a consumable
      if (consumable) {
        const totalCost = consumable.price * amount;
        if (user.wallet < totalCost) {
          return rest.sendMessage(message.channel_id, {
            embeds: errorEmbed('Insufficient Funds', `You need 🪙 **${formatNumber(totalCost)}** coins for ${amount}x **${consumable.name}**.`)
          });
        }

        user.wallet -= totalCost;
        user.buffs[consumable.id] = (user.buffs[consumable.id] || 0) + (consumable.duration * amount);
        db.queueSave();

        return rest.sendMessage(message.channel_id, {
          embeds: successEmbed(
            'Buff Activated!',
            `🧪 You purchased **${consumable.name}**! Active charges: **${user.buffs[consumable.id]} uses**.`
          )
        });
      }
    }
  },

  // --- INVENTORY ---
  inventory: {
    name: 'inventory',
    aliases: ['inv'],
    description: 'Shows all items, catches, ores, and relics in your backpack.',
    usage: '!inventory [@user]',
    async execute({ rest, message, args, db }) {
      const targetId = parseUserId(args[0]) || message.author.id;
      const user = db.getUser(targetId);

      const items = Object.entries(user.inventory || {})
        .filter(([_, count]) => count > 0)
        .map(([id, count]) => {
          const item = ALL_ITEMS[id] || { name: id, value: 0, emoji: '📦', rarity: 'COMMON' };
          const rarity = RARITIES[item.rarity] || RARITIES.COMMON;
          return { ...item, count, totalVal: item.value * count, raritySymbol: rarity.symbol };
        });

      if (items.length === 0) {
        return rest.sendMessage(message.channel_id, {
          embeds: createEmbed({
            title: `🎒 ${targetId === message.author.id ? 'Your' : `<@${targetId}>'s`} Backpack is Empty`,
            description: 'Go out and gather resources with `!fish`, `!mine`, `!dig`, or `!hunt`!',
            color: COLORS.DARK
          })
        });
      }

      const totalValue = items.reduce((sum, i) => sum + i.totalVal, 0);
      const totalItems = items.reduce((sum, i) => sum + i.count, 0);

      const formattedList = items.map(i => {
        return `${i.raritySymbol} ${i.emoji} **${i.count}x ${i.name}** — 🪙 ${formatNumber(i.totalVal)} (\`${i.id}\`)`;
      }).join('\n');

      return rest.sendMessage(message.channel_id, {
        embeds: createEmbed({
          title: `🎒 Inventory (${totalItems} items)`,
          description: formattedList,
          color: COLORS.INFO,
          fields: [
            { name: '💎 Total Sell Value', value: `🪙 **${formatNumber(totalValue)}** coins`, inline: true },
            { name: '💡 Sell Commands', value: '`!sell all` or `!sell <item_id>`', inline: true }
          ]
        })
      });
    }
  },

  // --- SELL ---
  sell: {
    name: 'sell',
    description: 'Sell gathered loot, catches, and ores from your inventory.',
    usage: '!sell <item_id|all> [amount]',
    async execute({ rest, message, args, db }) {
      const user = db.getUser(message.author.id);
      const choice = (args[0] || '').toLowerCase();

      if (!choice) {
        return rest.sendMessage(message.channel_id, {
          embeds: errorEmbed('Missing Argument', 'Specify an item ID or `all`: `!sell all` or `!sell fish_minnow 5`')
        });
      }

      // Sell All
      if (choice === 'all') {
        let totalCoins = 0;
        let totalCount = 0;

        for (const [id, count] of Object.entries(user.inventory || {})) {
          if (count > 0) {
            const item = ALL_ITEMS[id];
            if (item) {
              totalCoins += item.value * count;
              totalCount += count;
              user.inventory[id] = 0;
            }
          }
        }

        if (totalCount === 0) {
          return rest.sendMessage(message.channel_id, {
            embeds: errorEmbed('Nothing to Sell', 'Your inventory contains no sellable items!')
          });
        }

        user.wallet += totalCoins;
        user.stats.total_earned = (user.stats.total_earned || 0) + totalCoins;
        db.queueSave();

        return rest.sendMessage(message.channel_id, {
          embeds: successEmbed(
            'Inventory Liquidated',
            `💰 Sold **${totalCount} items** for a total of 🪙 **${formatNumber(totalCoins)}** coins!\n\n**New Wallet Balance:** ${formatNumber(user.wallet)} coins`
          )
        });
      }

      // Sell Specific Item
      const item = ALL_ITEMS[choice];
      if (!item) {
        return rest.sendMessage(message.channel_id, {
          embeds: errorEmbed('Item Not Found', `No sellable item found matching \`${choice}\`.`)
        });
      }

      const available = user.inventory[item.id] || 0;
      if (available <= 0) {
        return rest.sendMessage(message.channel_id, {
          embeds: errorEmbed('Item Not In Inventory', `You do not have any **${item.name}** in your inventory.`)
        });
      }

      let sellCount = parseInt(args[1], 10);
      if (isNaN(sellCount) || sellCount <= 0 || sellCount > available) {
        sellCount = available;
      }

      const earned = item.value * sellCount;
      user.inventory[item.id] -= sellCount;
      user.wallet += earned;
      user.stats.total_earned = (user.stats.total_earned || 0) + earned;
      db.queueSave();

      return rest.sendMessage(message.channel_id, {
        embeds: successEmbed(
          'Items Sold',
          `💰 Sold **${sellCount}x ${item.name}** for 🪙 **${formatNumber(earned)}** coins!\n\n**Wallet:** ${formatNumber(user.wallet)} coins`
        )
      });
    }
  },

  // --- LEADERBOARD ---
  leaderboard: {
    name: 'leaderboard',
    aliases: ['lb', 'top'],
    description: 'Displays the server leaderboards for riches and skills.',
    usage: '!leaderboard [money|fishing|mining|hunting|digging]',
    async execute({ rest, message, args, db }) {
      const type = (args[0] || 'money').toLowerCase();

      if (type === 'money' || type === 'rich') {
        const top = db.getTopBalances(10);
        const list = top.map((u, i) => {
          const medal = i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : `**#${i + 1}**`;
          return `${medal} <@${u.id}> — 🪙 **${formatNumber(u.netWorth)}** *(Wallet: ${formatNumber(u.wallet)})*`;
        }).join('\n');

        return rest.sendMessage(message.channel_id, {
          embeds: createEmbed({
            title: '🏆 Wealthiest Tycoons Leaderboard',
            description: list || 'No players recorded yet.',
            color: COLORS.GOLD
          })
        });
      }

      if (['fishing', 'mining', 'digging', 'hunting'].includes(type)) {
        const top = db.getTopSkill(type, 10);
        const list = top.map((u, i) => {
          const medal = i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : `**#${i + 1}**`;
          return `${medal} <@${u.id}> — Level **${u.level}** (${u.xp} XP)`;
        }).join('\n');

        return rest.sendMessage(message.channel_id, {
          embeds: createEmbed({
            title: `🏆 Top ${type.toUpperCase()} Masters`,
            description: list || 'No players recorded yet.',
            color: COLORS.PRIMARY
          })
        });
      }

      return rest.sendMessage(message.channel_id, {
        embeds: errorEmbed('Unknown Leaderboard', 'Valid categories: `money`, `fishing`, `mining`, `digging`, `hunting`')
      });
    }
  },

  // --- PROFILE / STATS ---
  profile: {
    name: 'profile',
    aliases: ['stats', 'player'],
    description: 'Displays your complete RPG adventurer card, equipped tools, and skill levels.',
    usage: '!profile [@user]',
    async execute({ rest, message, args, db }) {
      const targetId = parseUserId(args[0]) || message.author.id;
      const user = db.getUser(targetId);

      const toolsEquipped = [
        `🎣 **Rod:** ${TOOLS[user.tools.rod]?.name || 'Starter'}`,
        `⛏️ **Pickaxe:** ${TOOLS[user.tools.pickaxe]?.name || 'Starter'}`,
        `🏺 **Shovel:** ${TOOLS[user.tools.shovel]?.name || 'Starter'}`,
        `🏹 **Weapon:** ${TOOLS[user.tools.weapon]?.name || 'Starter'}`
      ].join('\n');

      const skillProgress = ['fishing', 'mining', 'digging', 'hunting'].map(skillName => {
        const s = user.skills[skillName];
        const req = getRequiredXp(s.level);
        return `• **${skillName.toUpperCase()}** Lvl **${s.level}**\n  ${createProgressBar(s.xp, req, 8)} (${s.xp}/${req} XP)`;
      }).join('\n\n');

      const statsOverview = [
        `🐟 Catches: **${user.stats.fish_caught || 0}** | 🪨 Ores: **${user.stats.ores_mined || 0}**`,
        `🏺 Relics Dug: **${user.stats.items_dug || 0}** | 🏹 Beasts Hunted: **${user.stats.beasts_hunted || 0}**`,
        `🃏 Blackjack Won: **${user.stats.bj_won || 0}** | 🎰 Slots Won: **${user.stats.slots_won || 0}**`,
        `🔥 Daily Streak: **${user.stats.daily_streak || 0} days**`
      ].join('\n');

      return rest.sendMessage(message.channel_id, {
        embeds: createEmbed({
          title: `📜 Adventurer Card — ${targetId === message.author.id ? message.author.username : 'Player'}`,
          description: `**Net Worth:** 🪙 **${formatNumber(user.wallet + user.bank)}** coins\n**Wallet:** ${formatNumber(user.wallet)} | **Bank:** ${formatNumber(user.bank)}/${formatNumber(user.bank_capacity)}`,
          color: COLORS.INFO,
          fields: [
            { name: '🛠️ Equipped Gear', value: toolsEquipped, inline: true },
            { name: '📊 Career Stats', value: statsOverview, inline: false },
            { name: '✨ Skill Masteries', value: skillProgress, inline: false }
          ]
        })
      });
    }
  }
};
