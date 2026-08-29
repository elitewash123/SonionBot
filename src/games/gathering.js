// ==========================================================
// Gathering RPG Mechanics (Fishing, Mining, Digging, Hunting)
// ==========================================================

import { FISH_LOOT, MINE_LOOT, DIG_LOOT, HUNT_LOOT, TOOLS, RARITIES } from '../data/items.js';
import { createEmbed, COLORS, createProgressBar, formatNumber } from '../discord/embeds.js';

// Calculate required XP for a given skill level
export function getRequiredXp(level) {
  return Math.floor(100 * Math.pow(level, 1.45));
}

// Add XP and handle potential level ups
export function addSkillXp(user, skillName, xpGain) {
  const skill = user.skills[skillName];
  skill.xp += xpGain;

  let leveledUp = false;
  let oldLevel = skill.level;

  while (true) {
    const requiredXp = getRequiredXp(skill.level);
    if (skill.xp >= requiredXp) {
      skill.xp -= requiredXp;
      skill.level += 1;
      leveledUp = true;
    } else {
      break;
    }
  }

  return {
    leveledUp,
    oldLevel,
    newLevel: skill.level,
    currentXp: skill.xp,
    nextXp: getRequiredXp(skill.level)
  };
}

// Select item from loot table based on player luck, tool tier and active buffs
export function rollLoot(lootTable, tool, skillLevel, buffs = {}) {
  // Base weights for rarities
  const toolLuck = tool?.luck || 0.05;
  const skillBonus = (skillLevel - 1) * 0.015; // 1.5% luck per skill level
  const buffBonus = buffs.lucky_clover ? 0.25 : 0;
  const totalLuck = toolLuck + skillBonus + buffBonus;

  // Weight multipliers
  const weights = {
    COMMON: Math.max(10, 60 - totalLuck * 50),
    UNCOMMON: 30 + totalLuck * 15,
    RARE: 12 + totalLuck * 20,
    EPIC: 4 + totalLuck * 15,
    LEGENDARY: 1 + totalLuck * 8,
    MYTHICAL: 0.2 + totalLuck * 3
  };

  // Filter available items by rolled rarity
  const totalWeight = Object.values(weights).reduce((a, b) => a + b, 0);
  let roll = Math.random() * totalWeight;
  let selectedRarity = 'COMMON';

  for (const [rarity, weight] of Object.entries(weights)) {
    if (roll <= weight) {
      selectedRarity = rarity;
      break;
    }
    roll -= weight;
  }

  const itemsInRarity = lootTable.filter(i => i.rarity === selectedRarity);
  const selectedItem = itemsInRarity.length > 0
    ? itemsInRarity[Math.floor(Math.random() * itemsInRarity.length)]
    : lootTable[0];

  // Quantity multiplier based on tool power
  const toolPower = tool?.power || 1.0;
  let count = 1;
  if (Math.random() < (toolPower - 1) * 0.4) {
    count = Math.floor(1 + Math.random() * (toolPower));
  }

  return {
    item: selectedItem,
    count,
    rarityInfo: RARITIES[selectedItem.rarity] || RARITIES.COMMON
  };
}

/**
 * Executes a gathering action (fish, mine, dig, hunt)
 */
export function executeGatheringAction({ type, user, username }) {
  const configMap = {
    fish: {
      title: '🎣 Fishing Expedition',
      lootTable: FISH_LOOT,
      toolSlot: 'rod',
      skillName: 'fishing',
      statKey: 'fish_caught',
      actionVerb: 'hooked',
      color: COLORS.INFO,
      emptyArt: '🌊 〰️〰️ 🎣'
    },
    mine: {
      title: '⛏️ Mining Expedition',
      lootTable: MINE_LOOT,
      toolSlot: 'pickaxe',
      skillName: 'mining',
      statKey: 'ores_mined',
      actionVerb: 'extracted',
      color: COLORS.PURPLE,
      emptyArt: '🪨 💥 ⛏️'
    },
    dig: {
      title: '🏺 Archaeological Excavation',
      lootTable: DIG_LOOT,
      toolSlot: 'shovel',
      skillName: 'digging',
      statKey: 'items_dug',
      actionVerb: 'unearthed',
      color: COLORS.WARNING,
      emptyArt: '🌱 🕳️ 🪓'
    },
    hunt: {
      title: '🏹 Wilderness Safari',
      lootTable: HUNT_LOOT,
      toolSlot: 'weapon',
      skillName: 'hunting',
      statKey: 'beasts_hunted',
      actionVerb: 'hunted down',
      color: COLORS.SUCCESS,
      emptyArt: '🌲 🎯 🏹'
    }
  };

  const cfg = configMap[type];
  const toolId = user.tools[cfg.toolSlot];
  const tool = TOOLS[toolId] || { name: 'Basic Hands', power: 1.0, luck: 0.0 };
  const skill = user.skills[cfg.skillName];

  // Roll loot
  const { item, count, rarityInfo } = rollLoot(cfg.lootTable, tool, skill.level, user.buffs);

  // Update user inventory
  user.inventory[item.id] = (user.inventory[item.id] || 0) + count;
  user.stats[cfg.statKey] = (user.stats[cfg.statKey] || 0) + count;

  // Add XP
  const xpEarned = item.xp * count;
  const xpResult = addSkillXp(user, cfg.skillName, xpEarned);

  // Consume buff charge if active
  if (user.buffs.lucky_clover) {
    user.buffs.lucky_clover -= 1;
    if (user.buffs.lucky_clover <= 0) delete user.buffs.lucky_clover;
  }

  // Build embed response
  const fields = [
    {
      name: `${rarityInfo.symbol} Found Item`,
      value: `**${item.emoji} ${count}x ${item.name}**\n*Rarity:* **${rarityInfo.name}** | *Value:* 🪙 **${formatNumber(item.value * count)}** coins`,
      inline: false
    },
    {
      name: `✨ Skill Progression (${cfg.skillName.toUpperCase()})`,
      value: `Level **${user.skills[cfg.skillName].level}** | +**${xpEarned}** XP\n${createProgressBar(user.skills[cfg.skillName].xp, getRequiredXp(user.skills[cfg.skillName].level))} (${user.skills[cfg.skillName].xp}/${getRequiredXp(user.skills[cfg.skillName].level)} XP)`,
      inline: false
    },
    {
      name: '🛠️ Equipped Gear',
      value: `**${tool.name}** (Tier ${tool.tier || 1}) • +${Math.round((tool.luck || 0) * 100)}% Luck`,
      inline: true
    }
  ];

  if (xpResult.leveledUp) {
    fields.push({
      name: '🎉 LEVEL UP!',
      value: `Congratulations! Your **${cfg.skillName}** skill reached **Level ${xpResult.newLevel}**! Higher tier loot is now more common!`,
      inline: false
    });
  }

  return createEmbed({
    title: cfg.title,
    description: `**${username}** went exploring and ${cfg.actionVerb} something interesting!`,
    color: rarityInfo.color || cfg.color,
    fields,
    footer: `Use !sell ${item.id} to sell or !inventory to view your backpack.`
  });
}
